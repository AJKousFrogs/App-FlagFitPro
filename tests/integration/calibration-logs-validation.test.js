import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
  },
}));

describe("calibration-logs validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    const mod = await import("../../netlify/functions/calibration-logs.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object recommendation payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/calibration-logs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when player logs recommendation for another athlete", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/calibration-logs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          athleteId: "athlete-2",
          recommendation: { type: "push" },
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns 403 when player requests preset stats", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/calibration-logs/preset-stats/preset-1",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );
    expect(response.statusCode).toBe(403);
  });
});
