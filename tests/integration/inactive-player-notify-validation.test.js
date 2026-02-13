import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "coach-1",
  role: "coach",
}));

const dbState = vi.hoisted(() => ({
  sameTeam: true,
  updateError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "team_members") {
        const state = {};
        return {
          select: () => ({
            eq: (col, val) => {
              state[col] = val;
              return {
                eq: (col2, val2) => {
                  state[col2] = val2;
                  return {
                    limit: () => ({
                      maybeSingle: async () => {
                        if (state.user_id === "coach-1") {
                          return { data: { team_id: "team-1" }, error: null };
                        }
                        if (!dbState.sameTeam) {
                          return { data: null, error: null };
                        }
                        if (state.user_id === "player-1" && state.team_id === "team-1") {
                          return { data: { team_id: "team-1", role: "player" }, error: null };
                        }
                        return { data: null, error: null };
                      },
                    }),
                  };
                },
                limit: () => ({
                  maybeSingle: async () => {
                    if (state.user_id === "coach-1") {
                      return { data: { team_id: "team-1" }, error: null };
                    }
                    return { data: null, error: null };
                  },
                }),
              };
            },
          }),
        };
      }

      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "player-1", email: "p@example.com", first_name: "P", last_name: "One" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "player_activity_tracking") {
        return {
          update: () => ({
            eq: async () => ({ error: dbState.updateError }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  },
}));

describe("inactive-player-notify validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "coach-1";
    authState.role = "coach";
    dbState.sameTeam = true;
    dbState.updateError = null;
    const mod = await import("../../netlify/functions/inactive-player-notify.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/inactive-player-notify",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid days_inactive", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/inactive-player-notify",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ user_id: "player-1", days_inactive: -1 }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when target player is not in coach team", async () => {
    dbState.sameTeam = false;
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/inactive-player-notify",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ user_id: "player-1", days_inactive: 30 }),
      },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns sanitized 500 when update fails", async () => {
    dbState.updateError = { message: "sensitive db reason" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/inactive-player-notify",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ user_id: "player-1", days_inactive: 30 }),
      },
      {},
    );
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("sensitive db reason");
  });
});
