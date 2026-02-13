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

    order() {
      return this;
    }

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "team_members") {
        const hasActive = this.filters.some(
          (f) => f.type === "eq" && f.field === "status" && f.value === "active",
        );

        if (!hasActive) {
          return { data: [], error: null };
        }

        const hasUserFilter = this.filters.some(
          (f) => f.type === "eq" && f.field === "user_id",
        );

        if (hasUserFilter) {
          return { data: [{ team_id: "team-1" }], error: null };
        }

        return {
          data: [
            {
              user_id: "athlete-1",
              role: "player",
              position: "WR",
              jersey_number: 11,
              status: "active",
            },
          ],
          error: null,
        };
      }

      if (this.table === "team_chemistry") {
        return { data: [], error: null };
      }

      if (this.table === "training_sessions") {
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
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/cache.js", () => ({
  CACHE_PREFIX: { DASHBOARD: "dashboard" },
  CACHE_TTL: { DASHBOARD: 300 },
  getOrFetch: async (_key, fn) => fn(),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
  db: {
    training: {
      getUserStats: async () => {
        throw new Error("db connection string leaked");
      },
      getRecentSessions: async () => [],
    },
  },
}));

describe("dashboard hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/dashboard.js");
    handler = mod.handler;
  });

  it("does not leak internal error message in overview fallback", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/dashboard",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data._isFallback).toBe(true);
    expect(payload.data._fallbackReason).toBe("database_error");
    expect(payload.data._error).toBeUndefined();
  });

  it("uses active membership for team chemistry", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/dashboard/team-chemistry",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.teamId).toBe("team-1");
    expect(payload.data.memberCount).toBe(1);
  });
});
