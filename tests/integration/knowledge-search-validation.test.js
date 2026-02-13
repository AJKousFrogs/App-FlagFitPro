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
    or() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    single() {
      return Promise.resolve({ data: null, error: null });
    }
    then(resolve, reject) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from() {
      if (state.throwFromError) {
        throw new Error("sensitive db host detail");
      }
      return new Query();
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("knowledge-search validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.throwFromError = false;
    const mod = await import("../../netlify/functions/knowledge-search.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed search limit", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-search",
        headers: {},
        body: JSON.stringify({ query: "hydration", limit: "10items" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-search",
        headers: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-search",
        headers: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 for unexpected internal failures", async () => {
    state.throwFromError = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/knowledge-search",
        headers: {},
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive db host detail");
  });
});
