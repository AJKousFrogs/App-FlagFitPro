import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
    }

    select() {
      return this;
    }
    eq() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    upsert() {
      this.mode = "upsert";
      return this;
    }
    insert() {
      this.mode = "insert";
      return this;
    }
    single() {
      return Promise.resolve(this.run());
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "athlete_recovery_profiles" && this.mode === "upsert") {
        return { data: { id: "profile-1" }, error: null };
      }
      if (this.table === "recovery_sessions" && this.mode === "insert") {
        return { data: { id: "log-1" }, error: null };
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
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("recovery endpoint validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/recovery.js");
    handler = mod.handler;
  });

  it("rejects invalid recommend payload intensity with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/recovery/recommend",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ intensity: 11 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid history limit with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/recovery/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "-3" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed history limit strings with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/recovery/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "20rows" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects log payload attempting to override user identity", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/recovery/log",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          user_id: "other-user",
          protocol_id: "cryotherapy",
          protocol_name: "Ice Bath",
          started_at: "2026-02-13T10:00:00Z",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
