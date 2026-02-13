import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = {};
    }
    select() {
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    in() {
      return this;
    }
    limit() {
      return this;
    }
    single() {
      return Promise.resolve(this.run());
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    run() {
      if (this.table === "team_members" && this.filters.user_id === "user-1") {
        return {
          data: { role: "nutritionist", team_id: "team-1", status: "active" },
          error: null,
        };
      }
      // Athlete is not on requester team
      if (this.table === "team_members" && this.filters.user_id === "user-2") {
        return { data: null, error: { code: "PGRST116" } };
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

describe("staff-nutritionist authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/staff-nutritionist.js");
    handler = mod.handler;
  });

  it("blocks out-of-team athlete trend access", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/staff-nutritionist/athletes/user-2/trends",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "30" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 400 for invalid report JSON", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/staff-nutritionist/reports/user-2",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for malformed days query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/staff-nutritionist/athletes/user-1/trends",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "30days" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
