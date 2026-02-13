import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
    }

    select() {
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

    range() {
      return this;
    }

    order() {
      return this;
    }

    limit() {
      return this;
    }

    single() {
      return Promise.resolve(this.run());
    }

    maybeSingle() {
      return Promise.resolve(this.run());
    }

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "team_members") {
        const hasCoachRoleFilter = this.filters.some(
          (f) =>
            f.type === "in" &&
            f.field === "role" &&
            Array.isArray(f.values) &&
            f.values.includes("coach"),
        );
        if (hasCoachRoleFilter) {
          return { data: [{ team_id: "team-1" }], error: null };
        }
        return {
          data: [
            {
              user_id: "player-1",
              role: "player",
              user: { first_name: "Pat", last_name: "Lee", position: "WR" },
            },
          ],
          error: null,
        };
      }

      if (this.table === "ai_messages") {
        return { data: [{ user_id: "player-1" }], error: null };
      }

      if (this.table === "micro_sessions") {
        return { data: [{ user_id: "player-1", status: "completed" }], error: null };
      }

      return { data: [], error: null };
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
    rpc: async () => ({ data: {} }),
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

describe("coach-analytics role consistency", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/coach-analytics.js");
    handler = mod.handler;
  });

  it("includes team members with role player in team analytics", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-analytics/team/team-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.memberCount).toBe(1);
    expect(payload.data.athletes.length).toBe(1);
  });

  it("rejects invalid trends days with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-analytics/trends",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "bad" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid leaderboard limit with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-analytics/leaderboard/team-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "1000" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid JSON for refresh with 400", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach-analytics/refresh",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });
});
