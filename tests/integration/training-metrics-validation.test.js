import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "player",
  trainingSessionsError: null,
  legacySessionsError: null,
  trainingSessionsData: [],
  legacySessionsData: [],
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "training_sessions") {
        return {
          select() {
            return this;
          },
          or() {
            return this;
          },
          order: async () => ({
            data: state.trainingSessionsData,
            error: state.trainingSessionsError,
          }),
          gte() {
            return this;
          },
        };
      }

      if (table === "sessions") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order: async () => ({
            data: state.legacySessionsData,
            error: state.legacySessionsError,
          }),
          gte() {
            return this;
          },
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
          in() {
            return this;
          },
          limit: async () => ({ data: [], error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe("training-metrics authorization and validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "player";
    state.trainingSessionsError = null;
    state.legacySessionsError = null;
    state.trainingSessionsData = [];
    state.legacySessionsData = [];
    const mod = await import("../../netlify/functions/training-metrics.js");
    handler = mod.handler;
  });

  it("returns 403 for cross-athlete access by non-coach", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-metrics",
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for malformed startDate query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-metrics",
        queryStringParameters: { startDate: "not-a-date" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when metrics query fails", async () => {
    state.trainingSessionsError = { message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-metrics",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to retrieve metrics");
    expect(body.error.details).toBeFalsy();
  });

  it("prefers canonical training session metrics over legacy rows", async () => {
    state.trainingSessionsData = [
      {
        session_date: "2026-03-20",
        duration_minutes: 55,
        rpe: 7,
        workload: 385,
        status: "completed",
        session_metrics: {
          total_volume: 1800,
          high_speed_distance: 220,
          sprint_count: 12,
          data_source: "open_dataset",
        },
      },
    ];
    state.legacySessionsData = [
      {
        date: "2026-03-20",
        total_volume: 900,
        high_speed_distance: 90,
        sprint_count: 4,
        duration_minutes: 35,
        data_source: "legacy_session",
      },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-metrics",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      date: "2026-03-20",
      total_volume: 1800,
      high_speed_distance: 220,
      sprint_count: 12,
      duration_minutes: 55,
      session_load: 385,
    });
  });
});
