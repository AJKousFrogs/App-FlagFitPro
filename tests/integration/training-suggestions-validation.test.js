import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  throwFromError: false,
}));

function createFakeSupabase() {
  class Query {
    select() {
      return this;
    }
    eq() {
      return this;
    }
    gte() {
      return this;
    }
    order() {
      return this;
    }
    then(resolve, reject) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }
  return {
    from() {
      if (state.throwFromError) {
        throw new Error("sensitive warehouse detail");
      }
      return new Query();
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

describe("training-suggestions validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.throwFromError = false;
    const mod = await import("../../netlify/functions/training-suggestions.js");
    handler = mod.handler;
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-suggestions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 403 when request body userId differs from authenticated user", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-suggestions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ userId: "other-user" }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("sanitizes analysis errors in success payload", async () => {
    state.throwFromError = true;
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/training-suggestions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({}),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data?.analysis?.totalSessions).toBe(0);
    expect(JSON.stringify(payload)).not.toContain("sensitive warehouse detail");
  });
});
