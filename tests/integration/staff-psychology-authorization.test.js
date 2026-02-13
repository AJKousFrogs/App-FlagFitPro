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
    order() {
      return this;
    }
    gte() {
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
          data: { role: "sports_psychologist", team_id: "team-1", status: "active" },
          error: null,
        };
      }
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

describe("staff-psychology authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/staff-psychology.js");
    handler = mod.handler;
  });

  it("blocks staff report generation for out-of-team athlete", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/staff-psychology/reports/wellness",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ athleteId: "user-2", days: 30 }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/staff-psychology/my-data/log",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for invalid days query param", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/staff-psychology/my-data",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "0" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid pre-competition gameDate", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/staff-psychology/reports/pre-competition",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ gameDate: "not-a-date" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
