import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
    }

    select() {
      return this;
    }

    eq(field, value) {
      this.filters.push({ type: "eq", field, value });
      return this;
    }

    limit() {
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

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "team_members") {
        const hasActiveFilter = this.filters.some(
          (f) => f.type === "eq" && f.field === "status" && f.value === "active",
        );

        if (!hasActiveFilter) {
          return { data: [], error: null };
        }

        const isMembershipLookup = this.filters.some(
          (f) => f.type === "eq" && f.field === "user_id",
        );

        if (isMembershipLookup) {
          return { data: [{ team_id: "team-1" }], error: null };
        }

        return {
          data: [
            { user_id: "athlete-1", position: "WR" },
            { user_id: "athlete-2", position: "QB" },
          ],
          error: null,
        };
      }

      if (this.table === "users") {
        return {
          data: [
            { id: "athlete-1", name: "A One", position: "WR" },
            { id: "athlete-2", name: "B Two", position: "QB" },
          ],
          error: null,
        };
      }

      if (this.table === "performance_tests") {
        return { data: [], error: null };
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
    options.handler(event, context, { userId: "coach-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/cache.js", () => ({
  CACHE_PREFIX: { ANALYTICS: "analytics" },
  CACHE_TTL: { ANALYTICS: 300 },
  getOrFetch: async (_key, fn) => fn(),
}));

vi.mock("../../netlify/functions/utils/consent-data-reader.js", () => ({
  AccessContext: {
    PLAYER_OWN_DATA: "PLAYER_OWN_DATA",
    COACH_TEAM_DATA: "COACH_TEAM_DATA",
  },
  ConsentDataReader: class {
    async readTrainingSessions() {
      return {
        data: [
          {
            user_id: "athlete-1",
            score: 86,
            completed_at: new Date().toISOString(),
          },
        ],
        consentInfo: { blockedPlayerIds: [], blockedCount: 0 },
        dataState: "available",
      };
    }
  },
}));

vi.mock("../../netlify/functions/utils/data-state.js", () => ({
  DataState: {
    NO_DATA: "no_data",
  },
}));

describe("analytics validation and membership scoping", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/analytics.js");
    handler = mod.handler;
  });

  it("returns 422 for invalid query params instead of undefined response", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/analytics/performance-trends",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "bad" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
    expect(payload.error?.message).toContain("limit");
  });

  it("returns 422 for out-of-range weeks", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/analytics/performance-trends",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { weeks: "0" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
    expect(payload.error?.message).toContain(
      "weeks must be an integer between 1 and 52",
    );
  });

  it("uses active membership for team chemistry resolution", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/analytics/team-chemistry",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.overall).not.toBe(8.4);
    expect(payload.data.dataState).toBe("available");
  });
});
