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
    maybeSingle() {
      return Promise.resolve(this.run());
    }
    single() {
      return Promise.resolve(this.run());
    }
    run() {
      if (this.table === "team_members" && this.filters.user_id === "user-1") {
        return {
          data: { role: "physiotherapist", team_id: "team-1", status: "active" },
          error: null,
        };
      }
      if (this.table === "athlete_injuries" && this.filters.id === "inj-1") {
        return { data: { user_id: "athlete-1" }, error: null };
      }
      if (
        this.table === "team_members" &&
        this.filters.user_id === "athlete-1" &&
        this.filters.team_id === "team-1"
      ) {
        return { data: { user_id: "athlete-1" }, error: null };
      }
      return { data: null, error: { code: "PGRST116" } };
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

describe("staff-physiotherapist validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/staff-physiotherapist.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON on RTP update", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/staff-physiotherapist/rtp/inj-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for RTP progress outside 0-100", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/staff-physiotherapist/rtp/inj-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ progress: 140 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
