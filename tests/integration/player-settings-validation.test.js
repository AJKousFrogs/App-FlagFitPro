import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", supabase: {} }),
}));

describe("player-settings validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
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
});
