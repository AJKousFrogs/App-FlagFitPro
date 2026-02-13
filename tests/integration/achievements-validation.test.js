import { beforeEach, describe, expect, it, vi } from "vitest";

const achievementsState = vi.hoisted(() => ({
  definitionsError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: [{ new_streak: 1, achievements_unlocked: [] }], error: null }),
    from: (table) => ({
      select: () => {
        if (table === "achievement_definitions") {
          return {
            eq: () => ({
              order: async () =>
                achievementsState.definitionsError
                  ? { data: null, error: { message: "relation missing" } }
                  : { data: [], error: null },
            }),
          };
        }

        return {
          eq: () => ({
            single: async () => ({ data: null, error: { code: "PGRST116" } }),
          }),
        };
      },
    }),
  },
}));

describe("achievements validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    achievementsState.definitionsError = false;
  });

  it("returns 422 for non-object streak payload", async () => {
    const { handler } = await import("../../netlify/functions/achievements.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/achievements/streak",
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for invalid streak date format", async () => {
    const { handler } = await import("../../netlify/functions/achievements.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/achievements/streak",
        body: JSON.stringify({ streakType: "daily_protocol", date: "13-02-2026" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("sanitizes internal database errors on achievements list endpoint", async () => {
    achievementsState.definitionsError = true;
    const { handler } = await import("../../netlify/functions/achievements.js");
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/achievements",
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Failed to load achievements");
    expect(JSON.stringify(payload)).not.toContain("relation missing");
  });
});
