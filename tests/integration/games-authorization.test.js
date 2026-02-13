import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "u-player",
  userRoleByUser: {
    "u-player": "player",
    "u-coach": "coach",
    "u-coach-2": "coach",
    "u-outsider": "player",
  },
  memberships: {
    "u-player:t-1": "player",
    "u-coach:t-1": "coach",
  },
  consentByCoachPlayer: {
    "u-coach:u-player": true,
    "u-coach-2:u-player": false,
  },
  games: {
    "a1b2": {
      id: "a1b2",
      visibility_scope: "team",
      team_id: "t-1",
      created_by: "u-coach",
      player_owner_id: null,
      status: "scheduled",
      home_away: "home",
      opponent_name: "Rivals",
    },
    "b2c3": {
      id: "b2c3",
      visibility_scope: "personal",
      team_id: "t-1",
      created_by: "u-player",
      player_owner_id: "u-player",
      status: "scheduled",
      home_away: "away",
      opponent_name: "League Team",
    },
  },
  insertedEvents: [],
  duplicateEvent: null,
}));

function buildSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
      this.limitValue = null;
    }

    select() {
      if (this.mode !== "insert" && this.mode !== "update") {
        this.mode = "select";
      }
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ op: "eq", field, value });
      return this;
    }

    is(field, value) {
      this.filters.push({ op: "is", field, value });
      return this;
    }

    limit(value) {
      this.limitValue = value;
      return this;
    }

    order() {
      return this;
    }

    lte() {
      return this;
    }

    gte() {
      return this;
    }

    maybeSingle() {
      return Promise.resolve(this.execMaybeSingle());
    }

    single() {
      return Promise.resolve(this.execSingle());
    }

    then(resolve, reject) {
      return Promise.resolve(this.exec()).then(resolve, reject);
    }

    findEq(field) {
      return this.filters.find((f) => f.op === "eq" && f.field === field)?.value;
    }

    consentGrantedFilter() {
      return this.findEq("consent_granted");
    }

    execSingle() {
      if (this.table === "games" && this.mode === "select") {
        const gameId = this.findEq("id");
        const game = state.games[gameId];
        if (!game) {
          return { data: null, error: { code: "PGRST116", message: "Not found" } };
        }
        return { data: { ...game }, error: null };
      }

      if (this.table === "games" && this.mode === "update") {
        const gameId = this.findEq("id");
        const game = state.games[gameId];
        if (!game) {
          return { data: null, error: { code: "PGRST116", message: "Not found" } };
        }
        const updated = { ...game, ...this.payload };
        state.games[gameId] = updated;
        return { data: updated, error: null };
      }

      if (this.table === "game_events" && this.mode === "insert") {
        const inserted = { id: `evt-${state.insertedEvents.length + 1}`, ...this.payload };
        state.insertedEvents.push(inserted);
        return { data: inserted, error: null };
      }

      if (this.table === "player_stats_consent" && this.mode === "update") {
        return { data: null, error: { code: "PGRST116", message: "Not found" } };
      }

      return { data: null, error: null };
    }

    execMaybeSingle() {
      if (this.table === "game_events" && this.mode === "select") {
        return { data: state.duplicateEvent, error: null };
      }
      if (this.table === "team_members") {
        const userId = this.findEq("user_id");
        const role = state.userRoleByUser[userId];
        if (!role) {
          return { data: null, error: { code: "PGRST116", message: "Not found" } };
        }
        return { data: { role }, error: null };
      }
      return { data: null, error: null };
    }

    exec() {
      if (this.table === "player_stats_consent" && this.mode === "select") {
        const coachId = this.findEq("coach_id");
        const playerId = this.findEq("player_id");
        const consentGranted = this.consentGrantedFilter();
        const isRevokedNull = this.filters.some(
          (f) => f.op === "is" && f.field === "revoked_at" && f.value === null,
        );
        const key = `${coachId}:${playerId}`;
        const granted = state.consentByCoachPlayer[key] === true;
        const shouldReturn = granted && consentGranted === true && isRevokedNull;
        return { data: shouldReturn ? [{ id: "cons-1" }] : [], error: null };
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
    options.handler(event, context, { userId: state.currentUserId }),
}));

vi.mock("../../netlify/functions/validation.js", () => ({
  validate: () => ({ valid: true, errors: [] }),
  validateRequestBody: () => ({ valid: true, errors: [] }),
  VALIDATION_RULES: {},
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => buildSupabase().from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  checkTeamMembership: async (userId, teamId) => {
    const role = state.memberships[`${userId}:${teamId}`];
    if (!role) {
      return { authorized: false, role: null };
    }
    return { authorized: true, role, teamId };
  },
  getUserTeamId: async (userId) => {
    const entry = Object.keys(state.memberships).find((k) => k.startsWith(`${userId}:`));
    return entry ? entry.split(":")[1] : null;
  },
}));

const buildEvent = (method, path, body = null) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: body ? JSON.stringify(body) : null,
  queryStringParameters: {},
});

describe("games authorization guardrails", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.currentUserId = "u-player";
    state.insertedEvents = [];
    state.duplicateEvent = null;
    const mod = await import("../../netlify/functions/games.js");
    handler = mod.handler;
  });

  it("blocks direct team-game details read for non-team members", async () => {
    state.currentUserId = "u-outsider";

    const response = await handler(
      buildEvent("GET", "/.netlify/functions/games/a1b2"),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks team-game update for members without coach role", async () => {
    state.currentUserId = "u-player";

    const response = await handler(
      buildEvent("PUT", "/.netlify/functions/games/a1b2", { status: "completed" }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks personal-game event logging by coach without player consent", async () => {
    state.currentUserId = "u-coach-2";

    const response = await handler(
      buildEvent("POST", "/.netlify/functions/games/b2c3/events", {
        eventType: "completion",
      }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("allows team members to log team-game events", async () => {
    state.currentUserId = "u-player";

    const response = await handler(
      buildEvent("POST", "/.netlify/functions/games/a1b2/events", {
        eventType: "completion",
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.recorded_by_role).toBe("player");
  });

  it("returns existing event for retry-identical play submissions", async () => {
    state.currentUserId = "u-player";
    state.duplicateEvent = {
      id: "evt-existing",
      game_id: "a1b2",
      player_id: "u-player",
      event_type: "completion",
      quarter: null,
      game_time: null,
      yards: 0,
      description: null,
      recorded_by: "u-player",
      recorded_by_role: "player",
    };

    const response = await handler(
      buildEvent("POST", "/.netlify/functions/games/a1b2/events", {
        eventType: "completion",
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe("evt-existing");
    expect(state.insertedEvents.length).toBe(0);
  });

  it("returns 422 for non-object JSON payloads", async () => {
    state.currentUserId = "u-player";

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/games/consent",
        headers: { authorization: "Bearer test-token" },
        body: "null",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed games list limit query", async () => {
    state.currentUserId = "u-player";

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/games",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: { limit: "25rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
