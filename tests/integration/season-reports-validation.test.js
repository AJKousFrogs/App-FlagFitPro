import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  userRole: "coach",
  season: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    team_id: "team-1",
    name: "2026",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  },
  seasonError: null,
  membership: { role: "coach" },
  membershipError: null,
  teamMembers: [{ user_id: "player-1", role: "player" }],
  teamMembersError: null,
  insertError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.userRole,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => {
      if (table === "seasons") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single: async () => ({ data: state.season, error: state.seasonError }),
        };
      }

      if (table === "team_members") {
        return {
          select(fields) {
            if (fields === "role") {
              return {
                eq() {
                  return this;
                },
                maybeSingle: async () => ({
                  data: state.membership,
                  error: state.membershipError,
                }),
              };
            }
            return {
              eq: async () => ({
                data: state.teamMembers,
                error: state.teamMembersError,
              }),
            };
          },
        };
      }

      if (table === "daily_wellness_checkin") {
        return {
          select() {
            return this;
          },
          in() {
            return this;
          },
          eq() {
            return this;
          },
          gte() {
            return this;
          },
          lte() {
            return {
              data: [],
              error: null,
              order: async () => ({ data: [], error: null }),
            };
          },
        };
      }

      if (table === "training_sessions") {
        return {
          select() {
            return this;
          },
          in() {
            return this;
          },
          eq() {
            return this;
          },
          gte() {
            return this;
          },
          lte: async () => ({ data: [], error: null }),
        };
      }

      if (table === "acwr_history") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          gte() {
            return this;
          },
          lte() {
            return {
              order() {
                return {
                  limit: async () => ({ data: [], error: null }),
                };
              },
            };
          },
        };
      }

      if (table === "season_summary_reports") {
        return {
          insert: async () => ({ error: state.insertError }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe("season-reports validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.userRole = "coach";
    state.seasonError = null;
    state.membership = { role: "coach" };
    state.membershipError = null;
    state.teamMembers = [{ user_id: "player-1", role: "player" }];
    state.teamMembersError = null;
    state.insertError = null;
    ({ handler } = await import("../../netlify/functions/season-reports.js"));
  });

  it("returns 422 for non-object payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-reports",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when coach is not member of season team", async () => {
    state.membership = null;
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-reports",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ season_id: "123e4567-e89b-12d3-a456-426614174000" }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns sanitized 500 when report insert fails", async () => {
    state.insertError = { message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-reports",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ season_id: "123e4567-e89b-12d3-a456-426614174000" }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to generate reports");
    expect(body.error.details).toBeFalsy();
  });
});
