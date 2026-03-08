import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  userId: "user-1",
  token: "test-token",
  supabase: null,
}));

function createFakeSupabase(initialState = {}) {
  const state = {
    protocolExercises: new Map(),
    protocolCompletions: [],
    ...initialState,
  };

  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.updatePayload = null;
      this.insertPayload = null;
      this.selectClause = null;
    }

    select(columns) {
      this.selectClause = columns;
      return this;
    }

    update(payload) {
      this.updatePayload = payload;
      return this;
    }

    insert(payload) {
      this.insertPayload = payload;
      if (this.table === "protocol_completions") {
        if (Array.isArray(payload)) {
          state.protocolCompletions.push(...payload);
        } else {
          state.protocolCompletions.push(payload);
        }
      }
      return Promise.resolve({ data: payload, error: null });
    }

    eq(field, value) {
      this.filters.push({ op: "eq", field, value });
      return this;
    }

    neq(field, value) {
      this.filters.push({ op: "neq", field, value });
      return this;
    }

    async single() {
      const result = await this.exec();
      if (!result.data) {
        return { data: null, error: { code: "PGRST116", message: "Not found" } };
      }
      if (Array.isArray(result.data)) {
        return {
          data: result.data[0] || null,
          error: result.data.length > 0 ? null : { code: "PGRST116", message: "Not found" },
        };
      }
      return result;
    }

    async maybeSingle() {
      const result = await this.exec();
      if (Array.isArray(result.data)) {
        return { data: result.data[0] || null, error: null };
      }
      return result;
    }

    then(resolve, reject) {
      return this.exec().then(resolve, reject);
    }

    async exec() {
      if (this.table !== "protocol_exercises") {
        return { data: null, error: null };
      }

      const rows = Array.from(state.protocolExercises.values()).filter((row) => {
        return this.filters.every((f) => {
          const value = row[f.field];
          if (f.op === "eq") {
            return value === f.value;
          }
          if (f.op === "neq") {
            return value !== f.value;
          }
          return true;
        });
      });

      if (!this.updatePayload) {
        return { data: rows, error: null };
      }

      if (rows.length === 0) {
        return { data: null, error: null };
      }

      const updated = rows.map((row) => {
        const next = { ...row, ...this.updatePayload };
        state.protocolExercises.set(next.id, next);
        return next;
      });

      if (this.selectClause) {
        return { data: updated[0], error: null };
      }

      return { data: null, error: null };
    }
  }

  return {
    state,
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () => ({
    success: true,
    token: mockCtx.token,
    user: { id: mockCtx.userId },
  }),
}));

vi.mock("../../netlify/functions/utils/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (...args) => mockCtx.supabase.from(...args),
    rpc: async () => ({ data: null, error: null }),
  },
  getSupabaseClient: () => mockCtx.supabase,
}));

const buildEvent = (path, payload) => ({
  httpMethod: "POST",
  path,
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("daily-protocol mutations", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/daily-protocol.js");
    handler = mod.handler;
  });

  it("treats repeated complete calls as idempotent and avoids duplicate completion logs", async () => {
    const fake = createFakeSupabase({
      protocolExercises: new Map([
        [
          "pe-1",
          {
            id: "pe-1",
            status: "pending",
            protocol_id: "dp-1",
            block_type: "warm_up",
            exercise_id: "ex-1",
            daily_protocols: {
              id: "dp-1",
              user_id: "user-1",
              protocol_date: "2026-02-13",
            },
          },
        ],
      ]),
    });
    mockCtx.supabase = fake;

    const first = await handler(
      buildEvent("/api/daily-protocol/complete", { protocolExerciseId: "pe-1" }),
      {},
    );
    const firstPayload = JSON.parse(first.body);
    expect(first.statusCode).toBe(200);
    expect(firstPayload.success).toBe(true);
    expect(firstPayload.idempotent).toBeUndefined();
    expect(fake.state.protocolCompletions).toHaveLength(1);

    const second = await handler(
      buildEvent("/api/daily-protocol/complete", { protocolExerciseId: "pe-1" }),
      {},
    );
    const secondPayload = JSON.parse(second.body);
    expect(second.statusCode).toBe(200);
    expect(secondPayload.success).toBe(true);
    expect(secondPayload.idempotent).toBe(true);
    expect(fake.state.protocolCompletions).toHaveLength(1);
  });

  it("rejects skip when user does not own the protocol exercise", async () => {
    const fake = createFakeSupabase({
      protocolExercises: new Map([
        [
          "pe-unauth",
          {
            id: "pe-unauth",
            status: "pending",
            protocol_id: "dp-2",
            block_type: "warm_up",
            exercise_id: "ex-2",
            daily_protocols: {
              id: "dp-2",
              user_id: "other-user",
              protocol_date: "2026-02-13",
            },
          },
        ],
      ]),
    });
    mockCtx.supabase = fake;

    const response = await handler(
      buildEvent("/api/daily-protocol/skip", { protocolExerciseId: "pe-unauth" }),
      {},
    );

    expect(response.statusCode).toBe(403);
    expect(fake.state.protocolExercises.get("pe-unauth").status).toBe("pending");
  });

  it("rejects invalid block type for complete-block", async () => {
    const fake = createFakeSupabase();
    mockCtx.supabase = fake;

    const response = await handler(
      buildEvent("/api/daily-protocol/complete-block", {
        protocolId: "dp-3",
        blockType: "__invalid_block__",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
