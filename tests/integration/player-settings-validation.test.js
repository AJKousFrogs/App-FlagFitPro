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
});
