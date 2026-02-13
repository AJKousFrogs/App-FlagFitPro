import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  validationResult: {
    valid: true,
    data: {
      email: "athlete@example.com",
      password: "pass1234",
    },
  },
  signInResult: {
    data: {
      user: {
        id: "user-1",
        email: "athlete@example.com",
        user_metadata: { role: "player", name: "Athlete" },
      },
      session: {
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 3600,
      },
    },
    error: null,
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/validation.js", () => ({
  validateRequestBody: () => state.validationResult,
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithPassword: async () => state.signInResult,
    },
  }),
}));

describe("auth-login validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.validationResult = {
      valid: true,
      data: {
        email: "athlete@example.com",
        password: "pass1234",
      },
    };
    state.signInResult = {
      data: {
        user: {
          id: "user-1",
          email: "athlete@example.com",
          user_metadata: { role: "player", name: "Athlete" },
        },
        session: {
          access_token: "access",
          refresh_token: "refresh",
          expires_in: 3600,
        },
      },
      error: null,
    };
  });

  it("returns 502 when auth provider responds without user/session", async () => {
    state.signInResult = {
      data: { user: null, session: null },
      error: null,
    };

    const { handler } = await import("../../netlify/functions/auth-login.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/auth-login",
        headers: {},
        body: "{}",
      },
      {},
    );

    expect(response.statusCode).toBe(502);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("auth_response_invalid");
  });

  it("returns 401 when auth provider returns credentials error", async () => {
    state.signInResult = {
      data: null,
      error: { message: "Invalid login credentials" },
    };

    const { handler } = await import("../../netlify/functions/auth-login.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/auth-login",
        headers: {},
        body: "{}",
      },
      {},
    );

    expect(response.statusCode).toBe(401);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("auth_failed");
  });
});
