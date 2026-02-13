import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  currentUserId: "player-1",
  roleByUser: {
    "player-1": "player",
    "coach-1": "coach",
  },
  teamMemberships: {
    "coach-1": [{ team_id: "team-1", role: "coach" }],
    "athlete-1": [{ team_id: "team-1", role: "player" }],
    "athlete-2": [{ team_id: "team-2", role: "player" }],
  },
  wellnessRows: [
    {
      id: "w-1",
      athlete_id: "athlete-1",
      user_id: "athlete-1",
      date: "2026-02-10",
      sleep_quality: 7,
      energy_level: 7,
      stress_level: 2,
      muscle_soreness: 2,
      motivation_level: 8,
      mood: "good",
      hydration_level: 7,
      created_at: "2026-02-10T10:00:00.000Z",
    },
  ],
}));

function createSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
    }

    select() {
      this.mode = "select";
      return this;
    }

    eq(field, value) {
      this.filters.push({ op: "eq", field, value });
      return this;
    }

    gte() {
      return this;
    }

    order() {
      return this;
    }

    range() {
      return this;
    }

    in(field, values) {
      this.filters.push({ op: "in", field, values });
      return this;
    }

    limit() {
      return this;
    }

    maybeSingle() {
      if (this.table === "team_members") {
        const userId = this.filters.find((f) => f.op === "eq" && f.field === "user_id")?.value;
        const teamIds = this.filters.find((f) => f.op === "in" && f.field === "team_id")?.values;

        const memberships = state.teamMemberships[userId] || [];
        if (teamIds?.length) {
          const found = memberships.find((m) => teamIds.includes(m.team_id));
          return Promise.resolve({ data: found ? { team_id: found.team_id } : null, error: null });
        }
        return Promise.resolve({ data: memberships[0] || null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(resolve, reject) {
      if (this.table === "team_members") {
        const userId = this.filters.find((f) => f.op === "eq" && f.field === "user_id")?.value;
        return Promise.resolve({
          data: state.teamMemberships[userId] || [],
          error: null,
        }).then(resolve, reject);
      }

      if (this.table === "wellness_entries") {
        const athleteId = this.filters.find(
          (f) => f.op === "eq" && f.field === "athlete_id",
        )?.value;
        const data = state.wellnessRows.filter((r) => r.athlete_id === athleteId);
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      }

      if (this.table === "physical_measurements" || this.table === "performance_tests") {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      }

      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
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

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (...args) => createSupabase().from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async (userId) => state.roleByUser[userId] || "player",
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewWellness: async () => ({
    allowed: true,
    reason: "CONSENT_GRANTED",
    safetyOverride: false,
  }),
  filterWellnessDataForCoach: (item) => item,
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: async () => ({}),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

const buildEvent = (endpoint, query = {}) => ({
  httpMethod: "GET",
  path: `/.netlify/functions/performance-data/${endpoint}`,
  headers: { authorization: "Bearer test-token" },
  queryStringParameters: query,
  body: null,
});

const buildMutationEvent = (method, endpoint, body) => ({
  httpMethod: method,
  path: `/.netlify/functions/performance-data/${endpoint}`,
  headers: { authorization: "Bearer test-token" },
  queryStringParameters: {},
  body,
});

describe("performance-data cross-athlete authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/performance-data.js");
    handler = mod.handler;
  });

  it("blocks player from reading another athlete wellness by athleteId", async () => {
    state.currentUserId = "player-1";

    const response = await handler(
      buildEvent("wellness", { athleteId: "athlete-1" }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks coach from reading out-of-team athlete trends", async () => {
    state.currentUserId = "coach-1";

    const response = await handler(
      buildEvent("trends", { athleteId: "athlete-2" }),
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("allows coach to read in-team athlete wellness", async () => {
    state.currentUserId = "coach-1";

    const response = await handler(
      buildEvent("wellness", { athleteId: "athlete-1" }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(Array.isArray(payload.data)).toBe(true);
  });

  it("returns 422 for malformed measurements page query", async () => {
    state.currentUserId = "player-1";

    const response = await handler(
      buildEvent("measurements", { page: "1abc" }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed performance-tests limit query", async () => {
    state.currentUserId = "player-1";

    const response = await handler(
      buildEvent("performance-tests", { limit: "25items" }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 400 for malformed JSON in measurements POST", async () => {
    state.currentUserId = "player-1";

    const response = await handler(
      buildMutationEvent("POST", "measurements", "{bad-json"),
      {},
    );

    expect(response.statusCode).toBe(400);
  });
});
