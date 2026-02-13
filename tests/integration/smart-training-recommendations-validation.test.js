import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "player",
  throwTrainingProgramError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => true,
  supabaseAdmin: {
    from: (table) => {
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

      if (table === "training_sessions") {
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
            return this;
          },
          in: async () => ({ data: [], error: null }),
        };
      }

      if (table === "tournaments") {
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
          order: async () => ({ data: [], error: null }),
        };
      }

      if (table === "injuries") {
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
          order: async () => ({ data: [], error: null }),
        };
      }

      if (table === "wellness_logs") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          lte() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle: async () => ({ data: null, error: null }),
        };
      }

      if (table === "training_programs") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle: async () => {
            if (state.throwTrainingProgramError) {
              throw new Error("sensitive db details");
            }
            return { data: null, error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe("smart-training-recommendations authorization and validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "player";
    state.throwTrainingProgramError = false;
    const mod = await import("../../netlify/functions/smart-training-recommendations.js");
    handler = mod.handler;
  });

  it("returns 403 for cross-athlete access by non-coach", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/smart-training-recommendations",
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for invalid date input", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/smart-training-recommendations",
        queryStringParameters: { date: "not-a-date" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when downstream query fails", async () => {
    state.throwTrainingProgramError = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/smart-training-recommendations",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to generate training recommendations");
    expect(body.error.details).toBeFalsy();
  });
});
