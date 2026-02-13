import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  throwFromError: false,
}));

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

    gte() {
      return this;
    }

    order() {
      return this;
    }

    range() {
      return this;
    }

    limit() {
      return this;
    }

    insert() {
      this.mode = "insert";
      return this;
    }

    update() {
      this.mode = "update";
      return this;
    }

    maybeSingle() {
      if (this.table === "team_members") {
        return Promise.resolve({
          data: { role: "coach", team_id: "team-1", users: { full_name: "Coach One" } },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      if (state.throwFromError) {
        throw new Error("sensitive partner api token");
      }
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
  checkEnvVars: () => {},
}));

describe("exercisedb validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.throwFromError = false;
    const mod = await import("../../netlify/functions/exercisedb.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed curated exercises limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercisedb",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "50rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed search limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercisedb/search",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10items" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-object JSON body on import", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/exercisedb/import",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 for unexpected internal failures", async () => {
    state.throwFromError = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercisedb",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive partner api token");
  });
});
