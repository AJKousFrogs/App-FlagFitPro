import { beforeEach, describe, expect, it, vi } from "vitest";

const baseHandlerMock = async (event, context, options) =>
  options.handler(event, context, { userId: "athlete-1", requestId: "req-test" });

function createNoopSupabase() {
  return {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        gte() {
          return this;
        },
        lte() {
          return this;
        },
        or() {
          return this;
        },
        not() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
    },
  };
}

describe("read endpoint authorization hardening", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("blocks cross-athlete access on trends endpoint", async () => {
    vi.doMock("../../netlify/functions/utils/base-handler.js", () => ({
      baseHandler: baseHandlerMock,
    }));
    vi.doMock("../../netlify/functions/supabase-client.js", () => ({
      supabaseAdmin: createNoopSupabase(),
    }));

    const mod = await import("../../netlify/functions/trends.js");
    const response = await mod.handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/trends/change-of-direction",
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks cross-athlete access on performance-metrics endpoint", async () => {
    vi.doMock("../../netlify/functions/utils/base-handler.js", () => ({
      baseHandler: baseHandlerMock,
    }));
    vi.doMock("../../netlify/functions/supabase-client.js", () => ({
      supabaseAdmin: createNoopSupabase(),
    }));

    const mod = await import("../../netlify/functions/performance-metrics.js");
    const response = await mod.handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/performance-metrics",
        queryStringParameters: { athleteId: "athlete-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("blocks non-coach cross-athlete wellness checkins access", async () => {
    vi.doMock("../../netlify/functions/utils/base-handler.js", () => ({
      baseHandler: baseHandlerMock,
    }));
    vi.doMock("../../netlify/functions/supabase-client.js", () => ({
      supabaseAdmin: createNoopSupabase(),
    }));
    vi.doMock("../../netlify/functions/utils/authorization-guard.js", async () => {
      const actual = await vi.importActual(
        "../../netlify/functions/utils/authorization-guard.js",
      );
      return {
        ...actual,
        getUserRole: vi.fn().mockResolvedValue("player"),
      };
    });

    const mod = await import("../../netlify/functions/wellness.js");
    const response = await mod.handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/wellness/checkins",
        queryStringParameters: {
          athleteId: "athlete-2",
        },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("rejects invalid wellness checkins limit with 422", async () => {
    vi.doMock("../../netlify/functions/utils/base-handler.js", () => ({
      baseHandler: baseHandlerMock,
    }));
    vi.doMock("../../netlify/functions/supabase-client.js", () => ({
      supabaseAdmin: createNoopSupabase(),
    }));
    vi.doMock("../../netlify/functions/utils/authorization-guard.js", async () => {
      const actual = await vi.importActual(
        "../../netlify/functions/utils/authorization-guard.js",
      );
      return {
        ...actual,
        getUserRole: vi.fn().mockResolvedValue("player"),
      };
    });

    const mod = await import("../../netlify/functions/wellness.js");
    const response = await mod.handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/wellness/checkins",
        queryStringParameters: {
          limit: "0",
        },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
