import { beforeEach, describe, expect, it, vi } from "vitest";

let insertedSessionPayload = null;
let forceInsertError = null;

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = {};
      this.payload = null;
    }
    select() {
      this.mode = "select";
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    gte() {
      return this;
    }
    lte() {
      return this;
    }
    order() {
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
    single() {
      return Promise.resolve(this.run());
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    run() {
      if (this.table === "training_sessions" && this.mode === "select") {
        return { data: null, error: { code: "PGRST116" } };
      }
      if (this.table === "training_sessions" && this.mode === "insert") {
        if (forceInsertError) {
          return { data: null, error: { message: forceInsertError } };
        }
        insertedSessionPayload = this.payload;
        return { data: { id: "session-1" }, error: null };
      }
      return { data: [], error: null };
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
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: vi.fn(),
  detectACWRTrigger: vi.fn(),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  requireAuthorization: vi.fn().mockResolvedValue({ success: true }),
  logViolation: vi.fn(),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
  checkEnvVars: () => {},
}));

describe("daily-training validation and hardening", () => {
  let handler;

  beforeEach(async () => {
    insertedSessionPayload = null;
    forceInsertError = null;
    vi.resetModules();
    const mod = await import("../../netlify/functions/daily-training.js");
    handler = mod.handler;
  });

  it("rejects invalid execution status with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/daily-training",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ status: "planned" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("prevents overriding protected fields when creating progress session", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/daily-training",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          user_id: "attacker-id",
          session_state: "COMPLETED",
          coach_locked: true,
          status: "completed",
          notes: "done",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(insertedSessionPayload.user_id).toBe("user-1");
    expect(insertedSessionPayload.session_state).toBe("IN_PROGRESS");
    expect(insertedSessionPayload.coach_locked).toBe(false);
    expect(insertedSessionPayload.status).toBe("completed");
  });

  it("returns sanitized 500 when session insert fails", async () => {
    forceInsertError = "db timeout on shard alpha";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/daily-training",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ status: "completed", notes: "done" }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Failed to update progress");
    expect(JSON.stringify(payload)).not.toContain("db timeout on shard alpha");
  });
});
