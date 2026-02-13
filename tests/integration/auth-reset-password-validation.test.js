import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  validationData: {
    email: "athlete@example.com",
    action: "request",
  },
  initializeCalls: 0,
  verifyCalls: 0,
  useCalls: 0,
  verifyResult: { valid: true, email: "athlete@example.com" },
  isInitialized: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/validation.js", () => ({
  validateRequestBody: () => ({
    valid: true,
    data: state.validationData,
  }),
}));

vi.mock("../../netlify/functions/utils/email-service.js", () => ({
  emailService: {
    get isInitialized() {
      return state.isInitialized;
    },
    initialize: async () => {
      state.initializeCalls += 1;
      state.isInitialized = true;
      return true;
    },
    sendPasswordReset: async () => ({ messageId: "msg-1" }),
    verifyResetToken: () => {
      state.verifyCalls += 1;
      return state.verifyResult;
    },
    useResetToken: () => {
      state.useCalls += 1;
    },
  },
}));

describe("auth-reset-password validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.validationData = { email: "athlete@example.com", action: "request" };
    state.initializeCalls = 0;
    state.verifyCalls = 0;
    state.useCalls = 0;
    state.verifyResult = { valid: true, email: "athlete@example.com" };
    state.isInitialized = false;
  });

  it("allows verify action without email and does not initialize smtp", async () => {
    state.validationData = { action: "verify", token: "tok-1" };
    const { handler } = await import("../../netlify/functions/auth-reset-password.js");

    const response = await handler(
      { httpMethod: "POST", path: "/.netlify/functions/auth-reset-password", body: "{}" },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.initializeCalls).toBe(0);
    expect(state.verifyCalls).toBe(1);
  });

  it("allows reset action without email and does not initialize smtp", async () => {
    state.validationData = {
      action: "reset",
      token: "tok-1",
      newPassword: "StrongPass1!",
    };
    const { handler } = await import("../../netlify/functions/auth-reset-password.js");

    const response = await handler(
      { httpMethod: "POST", path: "/.netlify/functions/auth-reset-password", body: "{}" },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.initializeCalls).toBe(0);
    expect(state.verifyCalls).toBe(1);
    expect(state.useCalls).toBe(1);
  });

  it("requires email for request action", async () => {
    state.validationData = { action: "request" };
    const { handler } = await import("../../netlify/functions/auth-reset-password.js");

    const response = await handler(
      { httpMethod: "POST", path: "/.netlify/functions/auth-reset-password", body: "{}" },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });
});
