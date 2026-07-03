import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSupabase = {};

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", supabase: mockSupabase }),
}));

describe("player-settings validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockSupabase = {};
    const mod = await import("../../netlify/functions/player-settings.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid birthDate", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ birthDate: "not-a-date" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("accepts string preferredTrainingDays and maxSessionsPerWeek after coercion", async () => {
    const savedRow = {
      primary_position: "wr_db",
      secondary_position: null,
      birth_date: null,
      flag_practice_schedule: [],
      preferred_training_days: [1, 2, 3],
      daily_routine: null,
      max_sessions_per_week: 4,
      has_gym_access: true,
      has_field_access: true,
      warmup_focus: null,
      available_equipment: [],
      current_limitations: null,
    };

    mockSupabase = {
      from: vi.fn((tableName) => {
        if (tableName === "age_recovery_modifiers") {
          return {
            select: vi.fn(() => ({
              lte: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: null, error: { code: "PGRST116" } }),
                  ),
                })),
              })),
            })),
          };
        }

        if (tableName === "athlete_training_config") {
          return {
            upsert: vi.fn((payload) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { ...savedRow, ...payload },
                  error: null,
                })),
              })),
            })),
          };
        }

        if (tableName === "users") {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${tableName}`);
      }),
    };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          preferredTrainingDays: ["1", "2", "3"],
          maxSessionsPerWeek: "4",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
  });

  it("returns 422 for out-of-range maxSessionsPerWeek", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ maxSessionsPerWeek: 99 }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid dailyRoutine entries", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          dailyRoutine: [{ id: "sleep", label: "Sleep", time: "25:99" }],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("persists and returns dailyRoutine when provided", async () => {
    const savedRow = {
      primary_position: "wr_db",
      secondary_position: null,
      birth_date: null,
      flag_practice_schedule: [],
      preferred_training_days: [1, 2, 4, 5, 6],
      daily_routine: [{ id: "sleep", label: "Sleep", time: "22:15" }],
      max_sessions_per_week: 5,
      has_gym_access: true,
      has_field_access: true,
      warmup_focus: null,
      available_equipment: [],
      current_limitations: null,
    };

    mockSupabase = {
      from: vi.fn((tableName) => {
        if (tableName === "age_recovery_modifiers") {
          return {
            select: vi.fn(() => ({
              lte: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: null, error: { code: "PGRST116" } }),
                  ),
                })),
              })),
            })),
          };
        }

        if (tableName === "athlete_training_config") {
          return {
            upsert: vi.fn((payload) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { ...savedRow, daily_routine: payload.daily_routine },
                  error: null,
                })),
              })),
            })),
          };
        }

        if (tableName === "users") {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${tableName}`);
      }),
    };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          dailyRoutine: [{ id: "sleep", label: "Sleep", time: "22:15" }],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      success: true,
      data: {
        dailyRoutine: [{ id: "sleep", label: "Sleep", time: "22:15" }],
      },
    });
  });

  it("a partial save omits unrelated fields from the upsert (does not wipe them to defaults)", async () => {
    let upsertPayload = null;

    mockSupabase = {
      from: vi.fn((tableName) => {
        if (tableName === "athlete_training_config") {
          return {
            upsert: vi.fn((payload) => {
              upsertPayload = payload;
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      primary_position: "qb",
                      secondary_position: null,
                      birth_date: null,
                      flag_practice_schedule: [],
                      daily_routine: [],
                      max_sessions_per_week: 5,
                      has_gym_access: true,
                      has_field_access: true,
                      warmup_focus: null,
                      available_equipment: [],
                      season_calendar: [{ phase: "inseason", from: "04-01", to: "07-07" }],
                      current_limitations: null,
                      ...payload,
                    },
                    error: null,
                  })),
                })),
              };
            }),
          };
        }
        if (tableName === "users") {
          return { update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })) };
        }
        throw new Error(`Unexpected table: ${tableName}`);
      }),
    };

    // Saving ONLY primaryPosition (mirrors settings.component.ts's savePosition())
    // must not include season_calendar, available_equipment, birth_date, etc. in
    // the upsert -- those keys being absent is what leaves the athlete's
    // previously-saved values untouched at the DB layer.
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
    expect(upsertPayload).toMatchObject({ primary_position: "qb" });
    expect(upsertPayload).not.toHaveProperty("season_calendar");
    expect(upsertPayload).not.toHaveProperty("available_equipment");
    expect(upsertPayload).not.toHaveProperty("birth_date");
    expect(upsertPayload).not.toHaveProperty("daily_routine");
    expect(upsertPayload).not.toHaveProperty("has_gym_access");
    expect(upsertPayload).not.toHaveProperty("age_recovery_modifier");
  });

  it("saving seasonCalendar alone does not include primary_position/available_equipment in the upsert", async () => {
    let upsertPayload = null;

    mockSupabase = {
      from: vi.fn((tableName) => {
        if (tableName === "athlete_training_config") {
          return {
            upsert: vi.fn((payload) => {
              upsertPayload = payload;
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { primary_position: "wr_db", ...payload },
                    error: null,
                  })),
                })),
              };
            }),
          };
        }
        if (tableName === "users") {
          return { update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })) };
        }
        throw new Error(`Unexpected table: ${tableName}`);
      }),
    };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          seasonCalendar: [{ phase: "preseason", from: "03-01", to: "03-31" }],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(upsertPayload).toMatchObject({
      season_calendar: [{ phase: "preseason", from: "03-01", to: "03-31" }],
    });
    expect(upsertPayload).not.toHaveProperty("primary_position");
    expect(upsertPayload).not.toHaveProperty("available_equipment");
    expect(upsertPayload).not.toHaveProperty("daily_routine");
  });
});
