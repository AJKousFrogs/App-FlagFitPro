import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            lte: () => ({
              or: async () => ({ data: [], error: null }),
              not: async () => ({ data: [], error: null }),
            }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
        or: () => ({
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

describe("trends validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/trends.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed weeks query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/trends/change-of-direction",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { weeks: "4abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for malformed games query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/trends/game-performance",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { games: "7days" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });
});
