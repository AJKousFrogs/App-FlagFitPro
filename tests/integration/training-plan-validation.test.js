import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => true,
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            lte: () => ({
              in: () => ({
                order: async () => ({ data: [], error: null }),
              }),
              order: async () => ({ data: [], error: null }),
            }),
            in: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
          lte: () => ({
            gte: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
          limit: async () => ({ data: [], error: null }),
          order: async () => ({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

describe("training-plan validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/training-plan.js");
    handler = mod.handler;
  });

  it("returns 422 for non-YYYY-MM-DD date input", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-plan",
        queryStringParameters: { date: "2026-02-13T12:00:00Z" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 when date is in the future", async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = future.toISOString().slice(0, 10);
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-plan",
        queryStringParameters: { date },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
