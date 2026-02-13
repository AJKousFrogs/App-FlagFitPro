import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  return {
    from() {
      return {
        insert() {
          return this;
        },
        select() {
          return this;
        },
        eq() {
          return this;
        },
        gte() {
          return this;
        },
        order() {
          return this;
        },
        single() {
          return Promise.resolve({
            data: {
              id: "hydration-1",
              fluid_ml: 500,
              fluid_type: "water",
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        },
      };
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("hydration validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/hydration.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed history days query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/hydration/history",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { days: "7days" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid hydration log amount", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/hydration/log",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ amount: 0 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
