import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              range: async () => ({ data: [], error: null }),
            }),
          }),
          gte: () => ({
            order: () => ({ data: [], error: null }),
          }),
          in: () => ({
            order: async () => ({ data: [], error: null }),
          }),
          single: async () => ({ data: null, error: { code: "PGRST116" } }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: {}, error: null }),
            }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: {}, error: null }),
        }),
      }),
    }),
  },
}));

describe("micro-sessions validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/micro-sessions.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed analytics weeks query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/micro-sessions/analytics",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { weeks: "bad" },
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed list limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/micro-sessions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "x" },
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for non-numeric follow-up rating", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/micro-sessions/session1/follow-up",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ rating: "10" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for empty PATCH payload", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/micro-sessions/session1",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({}),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });
});
