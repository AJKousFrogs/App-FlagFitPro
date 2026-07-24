import { beforeEach, describe, expect, it, vi } from "vitest";

// Covers the 5 fields added to player-settings.js for TIER 1 (sport,
// years_experience, medical_history, emergency_contact_name/phone) — these
// mirror onto `users` the same way height/weight/jersey already do, so this
// asserts the mirror actually happens rather than duplicating a whole new
// write path (the athlete-profile.js function this superseded was deleted).

const state = vi.hoisted(() => ({ usersUpdatePayload: null }));

let mockSupabase = {};

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      supabase: mockSupabase,
    }),
}));

vi.mock("../../netlify/functions/utils/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table !== "users") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        update: (payload) => {
          state.usersUpdatePayload = payload;
          return { eq: () => Promise.resolve({ data: null, error: null }) };
        },
      };
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

describe("player-settings mirrors the new athlete profile fields onto users", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.usersUpdatePayload = null;
    mockSupabase = {
      from: (table) => {
        if (table !== "athlete_training_config") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return {
          upsert: () => ({
            select: () => ({
              single: async () => ({
                data: { primary_position: "wr_db" },
                error: null,
              }),
            }),
          }),
        };
      },
    };
    const mod = await import("../../netlify/functions/player-settings.js");
    handler = mod.handler;
  });

  it("mirrors sport/yearsExperience/medicalHistory/emergencyContact* onto users", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          sport: "football",
          yearsExperience: 5,
          medicalHistory: "Prior ACL 2023",
          emergencyContactName: "John Athlete",
          emergencyContactPhone: "+1234567890",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.usersUpdatePayload).toMatchObject({
      sport: "football",
      years_experience: 5,
      medical_history: "Prior ACL 2023",
      emergency_contact_name: "John Athlete",
      emergency_contact_phone: "+1234567890",
    });
  });

  it("a save with none of the new fields omits them from the users update", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ primaryPosition: "qb" }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.usersUpdatePayload).not.toHaveProperty("sport");
    expect(state.usersUpdatePayload).not.toHaveProperty("years_experience");
    expect(state.usersUpdatePayload).not.toHaveProperty("medical_history");
    expect(state.usersUpdatePayload).not.toHaveProperty(
      "emergency_contact_name",
    );
  });
});
