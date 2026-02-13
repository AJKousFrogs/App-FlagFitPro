import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  db: {
    notifications: {
      getUserPreferences: async () => ({}),
      updateUserPreferences: async (_userId, preferences) => preferences,
    },
  },
}));

describe("notifications-preferences validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/notifications-preferences.js");
    handler = mod.handler;
  });

  it("returns 422 for unknown notification type", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/notifications-preferences",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          preferences: {
            unknown_type: { muted: true },
          },
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for unknown nested preference key", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/notifications-preferences",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          preferences: {
            training: { muted: false, smsEnabled: true },
          },
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for null body payload", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/notifications-preferences",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
