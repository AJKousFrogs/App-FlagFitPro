import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = { userId: "user-admin" };

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "admin",
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async () => ({ messageId: "msg-1" })),
    })),
  },
}));

describe("send-email validation hardening", () => {
  let handler;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      GMAIL_EMAIL: "sender@example.com",
      GMAIL_APP_PASSWORD: "app-password",
    };
    authState.userId = "user-admin";
    const mod = await import("../../netlify/functions/send-email.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/send-email",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for invalid recipient email format", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/send-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          type: "welcome",
          to: "not-an-email",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-numeric acwrValue", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/send-email",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          type: "acwr_alert",
          to: "coach@example.com",
          coachName: "Coach",
          playerName: "Player",
          acwrValue: "bad-value",
          alertMessage: "Risk high",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
