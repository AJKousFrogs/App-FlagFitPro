import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  targetPlayerActive: true,
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
        const teamIdFilter = this.filters.find(
          (filter) => filter.type === "eq" && filter.field === "team_id",
        );

        if (teamIdFilter?.value === "team-1") {
          return {
            data: [
              { user_id: "coach-1", role: "coach" },
              { user_id: "player-1", role: "player" },
              { user_id: "assistant-1", role: "assistant_coach" },
            ],
            error: null,
          };
        }

        const roleFilter = this.filters.find(
          (filter) => filter.type === "in" && filter.field === "role",
        );
        if (roleFilter) {
          return { data: [{ team_id: "team-1" }], error: null };
        }
      }

      return { data: [], error: null };
    }

    runMaybeSingle() {
      return { data: null, error: null };
    }

    runSingle() {
      if (this.table === "notifications" && this.mode === "insert") {
        const row = Array.isArray(this.insertPayload)
          ? this.insertPayload[0]
          : this.insertPayload;
        return { data: { id: "notif-1", ...row }, error: null };
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
      getUserTeams: async () => [],
      getTeamMembers: async () => [],
    },
  },
}));

vi.mock("../../netlify/functions/utils/consent-data-reader.js", () => ({
  ConsentDataReader: class {
    readTrainingSessions = async () => ({ data: [], consentInfo: { blockedPlayerIds: [] } });
    readWellnessEntries = async () => ({ data: [], consentInfo: { blockedPlayerIds: [] } });
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

describe("coach communications validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.targetPlayerActive = true;
    ({ handler } = await import("../../netlify/functions/coach.js"));
  });

  it("rejects non-object payloads for team messages", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/team-message",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects blank team messages", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/team-message",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ message: "   " }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects access requests for players outside the active coach team", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/access-request",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          playerId: "player-2",
          message: "Please share your training data with me.",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("accepts a valid access request payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/coach/access-request",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          playerId: "player-1",
          message: "Please share your training data with me.",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
  });
});
