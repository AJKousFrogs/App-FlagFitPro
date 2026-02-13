import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    select() {
      return this;
    }

    order() {
      return this;
    }

    limit() {
      return this;
    }

    eq() {
      return this;
    }

    then(resolve, reject) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    }
  }

  return {
    from() {
      return new Query();
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { supabase: createFakeSupabase() }),
}));

describe("isometrics and plyometrics validation hardening", () => {
  let isometricsHandler;
  let plyometricsHandler;

  beforeEach(async () => {
    vi.resetModules();
    const iso = await import("../../netlify/functions/isometrics.js");
    const plyo = await import("../../netlify/functions/plyometrics.js");
    isometricsHandler = iso.handler;
    plyometricsHandler = plyo.handler;
  });

  it("returns 422 for malformed isometrics limit", async () => {
    const response = await isometricsHandler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/isometrics",
        queryStringParameters: { limit: "10rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed plyometrics limit", async () => {
    const response = await plyometricsHandler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/plyometrics",
        queryStringParameters: { limit: "20items" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
