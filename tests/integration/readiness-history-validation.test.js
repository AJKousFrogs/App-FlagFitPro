import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "player",
  dbErrorMessage: null,
  attempts: 0,
  fallbackOnly: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            lte: () => ({
              order: async () => {
                state.attempts += 1;
                if (state.dbErrorMessage && state.attempts === 1) {
                  return {
                    data: [],
                    error: { code: "42703", message: state.dbErrorMessage },
                  };
                }
                return {
                  data:
                    state.dbErrorMessage && state.fallbackOnly
                      ? [{ day: "2026-03-28", score: 72 }]
                      : [],
                  error:
                    state.dbErrorMessage && !state.fallbackOnly
                      ? { message: state.dbErrorMessage }
                      : null,
                };
              },
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewReadiness: async () => ({ allowed: false, reason: "NO_CONSENT", safetyOverride: false }),
  filterReadinessForCoach: (item) => item,
}));

describe("readiness-history validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "player";
    state.dbErrorMessage = null;
    state.attempts = 0;
    state.fallbackOnly = false;
    const mod = await import("../../netlify/functions/readiness-history.js");
    handler = mod.handler;
  });

  it("returns 403 when a non-coach requests another athlete's readiness history", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/readiness-history",
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
        path: "/.netlify/functions/readiness-history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when readiness query fails", async () => {
    state.dbErrorMessage = "sensitive db details";
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/readiness-history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to retrieve readiness history");
    expect(body.error.message.includes("sensitive")).toBe(false);
  });

  it("falls back from athlete_id to user_id schema when needed", async () => {
    state.dbErrorMessage = "column athlete_id does not exist";
    state.fallbackOnly = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/readiness-history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.attempts).toBe(2);
  });
});
