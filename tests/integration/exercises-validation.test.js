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

    order() {
      return this;
    }

    or() {
      return this;
    }

    then(resolve, reject) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from() {
      if (state.throwFromError) {
        throw new Error("sensitive query planner detail");
      }
      return new Query();
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { supabase: createFakeSupabase() }),
}));

describe("exercises validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.throwFromError = false;
    const mod = await import("../../netlify/functions/exercises.js");
    handler = mod.handler;
  });

  it("returns 422 for malformed limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercises",
        queryStringParameters: { limit: "50rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid negative offset", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercises",
        queryStringParameters: { offset: "-1" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for search terms longer than 120 chars", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/exercises",
        queryStringParameters: { search: "a".repeat(121) },
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
        path: "/.netlify/functions/exercises",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive query planner detail");
  });
});
