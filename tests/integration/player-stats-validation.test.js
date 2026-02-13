import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  games: [],
  primaryPlays: [],
  secondaryPlays: [],
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/db-query-helper.js", () => ({
  parseAthleteId: () => ({ valid: true, athleteId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => true,
  supabaseAdmin: {
    from: (table) => {
      if (table === "games") {
        return {
          select() {
            return this;
          },
          gte() {
            return this;
          },
          lte() {
            return this;
          },
          eq() {
            return this;
          },
          order: async () => ({ data: dbState.games, error: null }),
        };
      }

      if (table === "game_events") {
        return {
          select() {
            return this;
          },
          in() {
            return this;
          },
          eq: async () => ({ data: dbState.primaryPlays, error: null }),
          contains: async () => ({ data: dbState.secondaryPlays, error: null }),
        };
      }

      if (table === "team_members") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => ({ data: { role: "player" }, error: null }),
        };
      }

      if (table === "player_stats_consent") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          is() {
            return this;
          },
          maybeSingle: async () => ({ data: null, error: null }),
        };
      }

      throw new Error(`Unexpected table mocked: ${table}`);
    },
  },
}));

describe("player-stats validation and aggregation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.games = [];
    dbState.primaryPlays = [];
    dbState.secondaryPlays = [];
    const mod = await import("../../netlify/functions/player-stats.js");
    handler = mod.handler;
  });

  it("does not count QB completed passes as receptions/targets", async () => {
    dbState.games = [{ game_id: "game-1", game_date: "2026-02-10T12:00:00Z" }];
    dbState.primaryPlays = [
      {
        id: "play-1",
        game_id: "game-1",
        play_type: "pass",
        play_result: "completion",
        primary_player_id: "user-1",
        secondary_player_ids: ["receiver-1"],
        yards_gained: 10,
      },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/player-stats/aggregated",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.passAttempts).toBe(1);
    expect(body.data.completions).toBe(1);
    expect(body.data.passingYards).toBe(10);
    expect(body.data.targets).toBe(0);
    expect(body.data.receptions).toBe(0);
    expect(body.data.receivingYards).toBe(0);
  });

  it("returns 422 when startDate is after endDate", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/player-stats/date-range",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {
          startDate: "2026-02-12",
          endDate: "2026-02-10",
        },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns full empty stats schema when no games exist", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/player-stats/aggregated",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.receivingTouchdowns).toBe(0);
    expect(body.data.yardsPerCarry).toBe(0);
    expect(body.data.interceptionsDef).toBe(0);
  });
});
