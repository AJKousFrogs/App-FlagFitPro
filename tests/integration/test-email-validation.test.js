import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = { userId: "user-coach", role: "coach" };
const nodemailerState = {
  verifyFails: false,
};

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn(async () => {
        if (nodemailerState.verifyFails) {
          throw new Error("SMTP verify failed");
        }
      }),
      sendMail: vi.fn(async () => ({ messageId: "test-msg-1" })),
    })),
  },
}));

describe("test-email validation hardening", () => {
  let handler;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    authState.userId = "user-coach";
    authState.role = "coach";
    nodemailerState.verifyFails = false;
    const mod = await import("../../netlify/functions/test-email.js");
    handler = mod.handler;
  });

  it("returns 422 for invalid email format", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/test-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ email: "bad-email" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for unsupported provider value", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/test-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ email: "coach@example.com", provider: "ses" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 503 when no provider is configured", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/test-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ email: "coach@example.com" }),
      },
      {},
    );

    expect(response.statusCode).toBe(503);
  });

  it("returns 502 when provider verify fails", async () => {
    process.env.GMAIL_EMAIL = "sender@example.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
    nodemailerState.verifyFails = true;

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/test-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ email: "coach@example.com", provider: "gmail" }),
      },
      {},
    );

    expect(response.statusCode).toBe(502);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Email service configuration issue");
    expect(JSON.stringify(payload)).not.toContain("SMTP verify failed");
    expect(payload.error?.details ?? null).toBeNull();
  });
});
