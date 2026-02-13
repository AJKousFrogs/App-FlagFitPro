import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "player",
  sessionsError: null,
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
      if (table === "sessions") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order: async () => ({
            data: [],
            error: state.sessionsError,
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
    state.sessionsError = null;
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
    state.sessionsError = { message: "sensitive db detail" };
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
});
