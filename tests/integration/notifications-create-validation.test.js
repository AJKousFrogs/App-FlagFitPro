import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  db: {
    notifications: {
      getUserPreferences: async () => ({}),
      createNotification: async (_userId, payload) => {
        if (payload.type === "invalid_type") {
          throw new Error("Invalid notification type: invalid_type");
        }
        return {
          id: "notif-1",
          user_id: "user-1",
          notification_type: payload.type,
          message: payload.message,
          is_read: false,
        };
      },
    },
  },
}));

describe("notifications-create validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/notifications-create.js");
    handler = mod.handler;
  });

  it("rejects unsupported priority with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications-create",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          type: "general",
          message: "Hello",
          priority: "urgent",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("maps invalid notification type errors to 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications-create",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          type: "invalid_type",
          message: "Hello",
          priority: "medium",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object payloads with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications-create",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
