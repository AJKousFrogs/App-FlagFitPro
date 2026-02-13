import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pendingLookupError: null,
}));

function createSupabaseClient() {
  class Query {
    constructor() {
      this.mode = "select";
    }
    select() {
      return this;
    }
    eq() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    single() {
      return Promise.resolve({
        data: null,
        error: { code: "PGRST116" },
      });
    }
    maybeSingle() {
      if (state.pendingLookupError) {
        return Promise.resolve({
          data: null,
          error: state.pendingLookupError,
        });
      }
      return Promise.resolve({ data: null, error: null });
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
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  getSupabaseClient: () => createSupabaseClient(),
  supabaseAdmin: {
    rpc: async () => ({ data: "req-1", error: null }),
  },
}));

describe("account-deletion validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.pendingLookupError = null;
  });

  it("returns 422 for non-object POST payload", async () => {
    const { handler } = await import("../../netlify/functions/account-deletion.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-deletion",
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for invalid reason type", async () => {
    const { handler } = await import("../../netlify/functions/account-deletion.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-deletion",
        body: JSON.stringify({ confirmDelete: true, reason: 123 }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 500 when pending request lookup fails in DELETE", async () => {
    state.pendingLookupError = { message: "db offline" };
    const { handler } = await import("../../netlify/functions/account-deletion.js");
    const response = await handler(
      {
        httpMethod: "DELETE",
        path: "/.netlify/functions/account-deletion",
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("database_error");
    expect(payload.error?.message).toBe(
      "Failed to retrieve pending deletion request",
    );
    expect(payload.error?.details).toBeFalsy();
  });
});
