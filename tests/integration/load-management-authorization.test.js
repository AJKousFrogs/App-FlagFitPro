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
    run() {
      // No requester team membership -> deny cross-user access
      if (this.table === "team_members" && this.filters.user_id === "user-1") {
        return { data: null, error: { code: "PGRST116" } };
      }
      return { data: null, error: null };
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

describe("load-management authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/load-management.js");
    handler = mod.handler;
  });

  it("blocks cross-user load endpoint access without valid team role", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/load-management/acwr",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { playerId: "user-2", teamId: "team-1" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
