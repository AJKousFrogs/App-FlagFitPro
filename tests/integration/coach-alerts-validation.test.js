import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  state: {
    protocol: {
      id: "alert-1",
      user_id: "user-1",
      protocol_date: "2026-02-13",
      coach_alert_active: true,
      coach_alert_requires_acknowledgment: true,
      coach_acknowledged: false,
      coach_acknowledged_at: null,
    },
  },
  throwFromError: false,
}));

function createFakeSupabase(state) {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      return this;
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    single() {
      return Promise.resolve(this.run());
    }

    run() {
      if (this.table === "daily_protocols" && this.mode === "select") {
        if (!state.protocol) {
          return { data: null, error: null };
        }
        return { data: state.protocol, error: null };
      }

      if (this.table === "daily_protocols" && this.mode === "update") {
        const updated = { ...state.protocol, ...this.payload };
        state.protocol = updated;
        return { data: updated, error: null };
      }

      if (this.table === "coach_alert_acknowledgments") {
        return { data: { id: "audit-1", ...this.payload }, error: null };
      }

      return { data: null, error: null };
    }
  }

  return {
    from(table) {
      if (mockCtx.throwFromError) {
        throw new Error("sensitive read replica detail");
      }
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (...args) => createFakeSupabase(mockCtx.state).from(...args),
  },
}));

const buildEvent = (rawBody) => ({
  httpMethod: "POST",
  path: "/api/coach-alerts/alert-1/acknowledge",
  headers: { authorization: "Bearer test-token" },
  body: rawBody,
});

describe("coach-alerts validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.throwFromError = false;
    mockCtx.state = {
      protocol: {
        id: "alert-1",
        user_id: "user-1",
        protocol_date: "2026-02-13",
        coach_alert_active: true,
        coach_alert_requires_acknowledgment: true,
        coach_acknowledged: false,
        coach_acknowledged_at: null,
      },
    };
    const mod = await import("../../netlify/functions/coach-alerts.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON payload", async () => {
    const response = await handler(buildEvent("{"), {});
    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON payload", async () => {
    const response = await handler(buildEvent("null"), {});
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid sessionDate format", async () => {
    const response = await handler(
      buildEvent(JSON.stringify({ sessionDate: "02/13/2026" })),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 404 when alert is not found", async () => {
    mockCtx.state.protocol = null;
    const response = await handler(
      buildEvent(JSON.stringify({ sessionDate: "2026-02-13" })),
      {},
    );
    expect(response.statusCode).toBe(404);
  });

  it("returns sanitized 500 for unexpected internal failures", async () => {
    mockCtx.throwFromError = true;
    const response = await handler(
      buildEvent(JSON.stringify({ sessionDate: "2026-02-13" })),
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive read replica detail");
  });
});
