import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectACWRTrigger: async () => {},
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => {
      throw new Error("DB should not be called for this validation case");
    },
  },
}));

describe("calc-readiness validation and authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    const mod = await import("../../netlify/functions/calc-readiness.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/calc-readiness",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["not-an-object"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid day value", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/calc-readiness",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ day: "not-a-date" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when a non-coach user targets another athlete", async () => {
    authState.role = "player";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/calc-readiness",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ athleteId: "athlete-2", day: "2026-02-13" }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
