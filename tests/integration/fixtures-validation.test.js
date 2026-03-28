import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

const dbState = vi.hoisted(() => ({
  fixturesError: null,
  teamIdByUser: {
    "athlete-1": "team-1",
    "athlete-2": "team-2",
  },
  fixtures: [],
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "team_members") {
        let requestedUserId = authState.userId;
        return {
          select: () => ({
            eq: (_field, value) => {
              requestedUserId = value;
              return {
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({
                        data: { team_id: dbState.teamIdByUser[requestedUserId] ?? null },
                        error: null,
                      }),
                    }),
                  }),
                }),
              };
            },
          }),
        };
      }

      if (table === "fixtures") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => ({
                  order: async () => ({
                    data: dbState.fixtures,
                    error: dbState.fixturesError,
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    },
  },
}));

describe("fixtures validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    dbState.fixturesError = null;
    dbState.fixtures = [];
    const mod = await import("../../netlify/functions/fixtures.js");
    handler = mod.handler;
  });

  it("returns 403 when player requests another athlete fixtures", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for malformed days query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 without leaking db details", async () => {
    dbState.fixturesError = { message: "db password leaked" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(parsed.error?.message).toBe("Failed to retrieve fixtures");
    expect(response.body).not.toContain("db password leaked");
  });

  it("maps team fixtures to the frontend game_start shape", async () => {
    dbState.fixtures = [
      {
        id: "fixture-1",
        team_id: "team-1",
        opponent_team_name: "Wolves",
        fixture_date: "2026-04-10",
        fixture_time: "18:30",
        is_home: true,
      },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/fixtures",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const parsed = JSON.parse(response.body);
    expect(parsed.data[0].opponent_name).toBe("Wolves");
    expect(parsed.data[0].game_start).toBe("2026-04-10T18:30:00");
    expect(parsed.data[0].is_home_game).toBe(true);
  });
});
