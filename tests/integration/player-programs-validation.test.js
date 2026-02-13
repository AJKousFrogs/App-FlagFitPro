import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({}),
}));

describe("player-programs validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/player-programs.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object POST payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-programs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid program_id on POST", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/player-programs",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ program_id: "not-a-uuid" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid assignment id in PUT path", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/player-programs/not-a-uuid",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ status: "paused" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });
});
