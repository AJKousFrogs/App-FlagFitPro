import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => {
  class Query {
    select() {
      return this;
    }
    eq() {
      return this;
    }
    single() {
      return Promise.resolve({
        data: { ai_processing_enabled: true },
        error: null,
      });
    }
  }

  return {
    checkEnvVars: () => {},
    supabaseAdmin: {
      from() {
        return new Query();
      },
    },
  };
});

describe("ai-chat validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 422 for non-object JSON body", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat",
        headers: {},
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for whitespace-only message", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat",
        headers: {},
        body: JSON.stringify({ message: "   " }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for non-object JSON on analyze-context endpoint", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat/analyze-context",
        headers: {},
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });
});
