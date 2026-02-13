import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  db: {
    notifications: {
      getUserNotifications: async () => [],
      updateLastOpenedAt: async () => ({}),
      markAllAsRead: async () => ({}),
      markManyAsRead: async () => ({}),
      markAsRead: async () => ({}),
    },
  },
}));

describe("notifications handler validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/notifications.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON in PATCH body", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid JSON in POST body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for invalid limit/page query params", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: { limit: "-1", page: "0" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-numeric limit values", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: { limit: "10abc", page: "1" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid onlyUnread query values", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: { onlyUnread: "yes" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid lastOpenedAt query values", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: null,
        queryStringParameters: { lastOpenedAt: "not-a-date" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-object POST payloads", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: "[]",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid notificationId type", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ notificationId: { bad: true } }),
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when ids array contains invalid values", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/notifications",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ ids: ["valid-id", 123] }),
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
