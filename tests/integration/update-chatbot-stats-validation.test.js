import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  queryError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("pg", () => ({
  Pool: class {
    async query() {
      if (state.queryError) {
        throw state.queryError;
      }
      return { rows: [] };
    }
  },
}));

describe("update-chatbot-stats validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.queryError = null;
    const mod = await import("../../netlify/functions/update-chatbot-stats.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/update-chatbot-stats",
        body: JSON.stringify("bad"),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-string topic", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/update-chatbot-stats",
        body: JSON.stringify({ topic: 123 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when stats update query fails", async () => {
    state.queryError = new Error("sensitive db connection detail");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/update-chatbot-stats",
        body: JSON.stringify({ topic: "hydration" }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to update chatbot statistics");
    expect(body.error.details).toBeFalsy();
  });
});
