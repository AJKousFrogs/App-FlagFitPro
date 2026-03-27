import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  digestInsertError: null,
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      if (this.mode !== "insert" && this.mode !== "update") {
        this.mode = "select";
      }
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

    in() {
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

    limit() {
      return this;
    }

    is() {
      return this;
    }

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    single() {
      return Promise.resolve(this.run());
    }

    maybeSingle() {
      return Promise.resolve(this.run());
    }

    run() {
      if (this.table === "team_members" && this.mode === "select") {
        return { data: null, error: null };
      }

      if (this.table === "parent_guardian_links" && this.mode === "select") {
        return { data: null, error: null };
      }

      if (this.table === "ai_messages" && this.mode === "select") {
        return { data: [], error: null };
      }

      if (this.table === "micro_sessions" && this.mode === "select") {
        return { data: [], error: null };
      }

      if (this.table === "athlete_achievements" && this.mode === "select") {
        return { data: [], error: null };
      }

      if (this.table === "daily_wellness_checkin" && this.mode === "select") {
        return { data: [], error: null };
      }

      if (this.table === "ai_followups" && this.mode === "select") {
        return { data: [], error: null };
      }

      if (this.table === "digest_history" && this.mode === "insert") {
        return { data: null, error: mockCtx.digestInsertError };
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

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

describe("notification-digest send idempotency", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.digestInsertError = null;
    ({ handler } = await import("../../netlify/functions/notification-digest.js"));
  });

  it("returns success with duplicate flag when digest_history unique conflict occurs", async () => {
    mockCtx.digestInsertError = { code: "23505" };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notification-digest/send",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ digestType: "weekly" }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.duplicate).toBe(true);
  });
});
