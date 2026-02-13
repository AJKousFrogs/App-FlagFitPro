import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  unreadCount: 3,
  lastOpenedAt: "2026-02-13T00:00:00.000Z",
  shouldThrow: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  db: {
    notifications: {
      getUnreadCount: async () => {
        if (dbState.shouldThrow) {
          throw new Error("sensitive db detail");
        }
        return dbState.unreadCount;
      },
      getLastOpenedAt: async () => dbState.lastOpenedAt,
    },
  },
}));

describe("notifications-count hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.unreadCount = 3;
    dbState.lastOpenedAt = "2026-02-13T00:00:00.000Z";
    dbState.shouldThrow = false;
    const mod = await import("../../netlify/functions/notifications-count.js");
    handler = mod.handler;
  });

  it("normalizes invalid unread/lastOpenedAt outputs", async () => {
    dbState.unreadCount = -7;
    dbState.lastOpenedAt = "not-a-date";
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications-count",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(parsed.data.unreadCount).toBe(0);
    expect(parsed.data.lastOpenedAt).toBe(null);
  });

  it("returns sanitized 500 when db call fails", async () => {
    dbState.shouldThrow = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/notifications-count",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("sensitive db detail");
  });
});
