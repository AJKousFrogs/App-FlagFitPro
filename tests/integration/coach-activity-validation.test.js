import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  activityExists: false,
  feedErrorMessage: null,
}));

function createSupabase() {
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

    in() {
      return this;
    }

    or() {
      return this;
    }

    order() {
      return this;
    }

    limit() {
      return this;
    }

    range() {
      return this;
    }

    gte() {
      return this;
    }

    update() {
      return this;
    }

    single() {
      if (this.table === "coach_activity_log") {
        if (!state.activityExists) {
          return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        }
        return Promise.resolve({ data: { team_id: "team-1" }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "team_members") {
        return Promise.resolve({ data: [{ team_id: "team-1" }], error: null }).then(
          resolve,
          reject,
        );
      }
      if (this.table === "coach_activity_log") {
        if (state.feedErrorMessage) {
          return Promise.resolve({
            data: null,
            error: { message: state.feedErrorMessage },
          }).then(resolve, reject);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve, reject);
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
  supabaseAdmin: createSupabase(),
}));

describe("coach-activity validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.activityExists = false;
    state.feedErrorMessage = null;
    const mod = await import("../../netlify/functions/coach-activity.js");
    handler = mod.handler;
  });

  it("returns 422 for invalid limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-activity",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 404 when marking missing activity as read", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach-activity/missing-id/read",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(404);
  });

  it("returns sanitized 500 when activity feed query fails unexpectedly", async () => {
    state.feedErrorMessage = "sensitive query execution detail";

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach-activity",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(body.error?.message).toBe("Internal server error");
    expect(body.error?.code).toBe("server_error");
    expect(response.body).not.toContain("sensitive query execution detail");
  });
});
