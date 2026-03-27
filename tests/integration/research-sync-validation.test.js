import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () => ({ success: true, user: { id: "admin-1" } }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "admin",
}));

describe("research-sync validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    ({ handler } = await import("../../netlify/functions/research-sync.js"));
  });

  it("returns 422 for malformed JSON payloads", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/research-sync/search",
        body: "{",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for non-object JSON payloads", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/research-sync/search",
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });
});
