import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
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

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ type: "eq", field, value });
      return this;
    }

    in(field, values) {
      this.filters.push({ type: "in", field, values });
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

    maybeSingle() {
      return Promise.resolve(this.run());
    }

    single() {
      return Promise.resolve(this.run());
    }

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "team_members" && this.mode === "select") {
        const hasActiveFilter = this.filters.some(
          (f) => f.type === "eq" && f.field === "status" && f.value === "active",
        );
        if (hasActiveFilter) {
          return { data: null, error: null };
        }
        return { data: { role: "coach" }, error: null };
      }

      if (this.table === "parent_guardian_links" && this.mode === "select") {
        return { data: null, error: null };
      }

      if (this.table === "notification_preferences" && this.mode === "select") {
        return { data: null, error: { code: "PGRST116" } };
      }

      if (this.table === "digest_history" && this.mode === "insert") {
        return { data: {}, error: null };
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

describe("notification-digest validation and role hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/notification-digest.js");
    handler = mod.handler;
  });

  it("rejects invalid digest type with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notification-digest/preview",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { type: "yearly" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("treats inactive coach memberships as non-coach role in preview", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notification-digest/preview",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { type: "weekly" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.role).toBe("athlete");
  });

  it("rejects invalid weekly_digest_day with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/notification-digest/preferences",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ weekly_digest_day: 9 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object preference payload with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/notification-digest/preferences",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid history digest type with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notification-digest/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { type: "yearly" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects out-of-range history limit with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notification-digest/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "1000" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed history limit values with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notification-digest/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid JSON for digest send with 400", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notification-digest/send",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });
});
