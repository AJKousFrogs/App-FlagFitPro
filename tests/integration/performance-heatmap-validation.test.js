import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  queryError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        or: () => ({
          gte: () => ({
            lte: () => ({
              order: async () => ({
                data: [],
                error: dbState.queryError,
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

describe("performance-heatmap validation and failure handling", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    dbState.queryError = null;
    const mod = await import("../../netlify/functions/performance-heatmap.js");
    handler = mod.handler;
  });

  it("returns 422 for invalid timeRange", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/performance-heatmap",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { timeRange: "bad" },
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 500 when training session query fails", async () => {
    dbState.queryError = { message: "db down", code: "XX001" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/performance-heatmap",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { timeRange: "6months" },
      },
      {},
    );

    expect(response.statusCode).toBe(500);
  });
});
