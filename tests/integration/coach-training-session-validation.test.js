import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  activeTargetMember: false,
  teamMembersForDashboard: [{ user_id: "athlete-1" }],
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
      this.insertPayload = null;
    }

    select() {
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.insertPayload = payload;
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

    limit() {
      return this;
    }

    order() {
      return this;
    }

    maybeSingle() {
      return Promise.resolve(this.runMaybeSingle());
    }

    single() {
      return Promise.resolve(this.runSingle());
    }

    then(resolve, reject) {
      return Promise.resolve(this.runList()).then(resolve, reject);
    }

    runList() {
      if (this.table === "team_members") {
        const hasRoleInFilter = this.filters.some(
          (f) => f.type === "in" && f.field === "role",
        );
        if (hasRoleInFilter) {
          return { data: [{ team_id: "team-1" }], error: null };
        }
      }

      return { data: [], error: null };
    }

    runMaybeSingle() {
      if (this.table === "team_members") {
        if (state.activeTargetMember) {
          return { data: { id: "tm-1" }, error: null };
        }
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }

    runSingle() {
      if (this.table === "training_sessions" && this.mode === "insert") {
        const row = Array.isArray(this.insertPayload)
          ? this.insertPayload[0]
          : this.insertPayload;
        return { data: { id: "sess-1", ...row }, error: null };
      }

      if (this.table === "users") {
        return {
          data: { id: "athlete-1", full_name: "Athlete One", position: "WR" },
          error: null,
        };
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
    options.handler(event, context, { userId: "coach-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
  db: {
    teams: {
      getUserTeams: async () => state.teamMembersForDashboard,
      getTeamMembers: async () => state.teamMembersForDashboard,
    },
  },
}));

vi.mock("../../netlify/functions/utils/consent-data-reader.js", () => ({
  ConsentDataReader: class {
    async readTrainingSessions() {
      return { data: [], consentInfo: { blockedPlayerIds: [] } };
    }

    async readWellnessEntries() {
      return { data: [], consentInfo: { blockedPlayerIds: [] } };
    }
  },
  AccessContext: {
    COACH_TEAM_DATA: "COACH_TEAM_DATA",
  },
}));

vi.mock("../../netlify/functions/utils/data-state.js", () => ({
  DataState: {
    NO_DATA: "NO_DATA",
    REAL_DATA: "REAL_DATA",
    INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  },
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "coach",
  requireRole: async () => ({ authorized: true }),
  logViolation: async () => {},
}));

describe("coach training-session hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.activeTargetMember = false;
    const mod = await import("../../netlify/functions/coach.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON in training-session", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/training-session",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("invalid_json");
  });

  it("returns 422 for non-object training-session payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/training-session",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 when target user is not an active team member", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/training-session",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ user_id: "athlete-x", sessionType: "practice" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("maps dashboard member name from full_name", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach/dashboard",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.members[0].name).toBe("Athlete One");
  });
});
