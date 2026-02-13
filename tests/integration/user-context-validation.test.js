import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  userMissing: false,
  userQueryErrorMessage: null,
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
    }
    select() {
      return this;
    }
    eq() {
      return this;
    }
    in() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    gte() {
      return this;
    }
    async single() {
      if (this.table === "users") {
        if (state.userMissing) {
          return { data: null, error: { code: "PGRST116", message: "No rows" } };
        }
        if (state.userQueryErrorMessage) {
          return {
            data: null,
            error: { code: "XX001", message: state.userQueryErrorMessage },
          };
        }
        return {
          data: {
            id: "user-1",
            position: "QB",
            height_cm: 182,
            weight_kg: 84,
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          error: null,
        };
      }
      if (this.table === "wellness_checkins") {
        return { data: null, error: { code: "PGRST116" } };
      }
      return { data: null, error: null };
    }
    then(resolve) {
      if (this.table === "injuries") {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      }
      if (this.table === "training_sessions") {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      }
      if (this.table === "supplement_logs") {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      }
      if (this.table === "team_members") {
        return Promise.resolve({
          data: [{ team_id: "team-1", role: "coach" }],
          error: null,
        }).then(resolve);
      }
      return Promise.resolve({ data: [], error: null }).then(resolve);
    }
  }
  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createSupabase(),
}));

describe("user-context validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.userMissing = false;
    state.userQueryErrorMessage = null;
  });

  it("maps body metrics from height_cm/weight_kg fields", async () => {
    const { handler } = await import("../../netlify/functions/user-context.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/user-context", queryStringParameters: {} },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.bodyMetrics.height).toBe(182);
    expect(payload.data.bodyMetrics.weight).toBe(84);
    expect(payload.data.role).toBe("coach");
  });

  it("returns 404 when user record is missing", async () => {
    state.userMissing = true;
    const { handler } = await import("../../netlify/functions/user-context.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/user-context", queryStringParameters: {} },
      {},
    );

    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("not_found");
  });

  it("returns sanitized 500 when user query fails unexpectedly", async () => {
    state.userQueryErrorMessage = "sensitive db plan detail";
    const { handler } = await import("../../netlify/functions/user-context.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/user-context", queryStringParameters: {} },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("database_error");
    expect(response.body).not.toContain("sensitive db plan detail");
  });
});
