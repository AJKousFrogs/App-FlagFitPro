import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
    }

    select() {
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    in() {
      return this;
    }

    limit() {
      return this;
    }

    insert() {
      this.mode = "insert";
      return this;
    }

    order() {
      return this;
    }

    single() {
      return Promise.resolve(this.run());
    }

    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }

    run() {
      if (this.table === "team_members" && this.mode === "select") {
        return { data: [{ team_id: "team-1" }], error: null };
      }
      if (this.table === "team_events" && this.mode === "insert") {
        return { data: { id: "event-1" }, error: null };
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
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
  db: {
    teams: {
      getUserTeams: async () => [],
      getTeamMembers: async () => [],
    },
  },
}));

vi.mock("../../netlify/functions/utils/consent-data-reader.js", () => ({
  ConsentDataReader: class {
    readTrainingSessions = async () => ({ data: [] });
    readWellnessEntries = async () => ({ data: [] });
  },
  AccessContext: { COACH_TEAM_DATA: "COACH_TEAM_DATA" },
}));

vi.mock("../../netlify/functions/utils/data-state.js", () => ({
  DataState: { NO_DATA: "NO_DATA", REAL_DATA: "REAL_DATA", INSUFFICIENT_DATA: "INSUFFICIENT_DATA" },
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "coach",
  requireRole: async () => ({ authorized: true }),
  logViolation: async () => {},
}));

describe("coach calendar validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/coach.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON body on calendar POST", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/calendar",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON body on calendar POST", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/calendar",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when endTime is before startTime", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/calendar",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          title: "Practice",
          date: "2026-02-13",
          startTime: "18:00",
          endTime: "17:00",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
