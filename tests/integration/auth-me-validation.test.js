import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null,
  authError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-123",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.user },
        error: state.authError,
      }),
    },
  }),
}));

describe("auth-me validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.user = null;
    state.authError = null;
  });

  it("does not throw when Authorization header is missing", async () => {
    const { handler } = await import("../../netlify/functions/auth-me.js");

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/auth-me",
        headers: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.user.id).toBe("user-123");
    expect(payload.data.user.email_verified).toBe(false);
  });

  it("sets email_verified false when auth user data is unavailable", async () => {
    const { handler } = await import("../../netlify/functions/auth-me.js");

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/auth-me",
        headers: { authorization: "Bearer token" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.user.email_verified).toBe(false);
  });
});
