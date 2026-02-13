import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rpcError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    rpc: async () => {
      if (state.rpcError) {
        return { data: null, error: state.rpcError };
      }
      return { data: "pause-1", error: null };
    },
  },
}));

describe("account-pause validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    state.rpcError = null;
  });

  it("returns 422 for non-object payload", async () => {
    const { handler } = await import("../../netlify/functions/account-pause.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-pause",
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for invalid action", async () => {
    const { handler } = await import("../../netlify/functions/account-pause.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-pause",
        body: JSON.stringify({ action: "stop" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for invalid paused_until date", async () => {
    const { handler } = await import("../../netlify/functions/account-pause.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-pause",
        body: JSON.stringify({ action: "pause", paused_until: "not-a-date" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("does not leak internal rpc error details on pause failure", async () => {
    state.rpcError = { message: "sensitive db error" };
    const { handler } = await import("../../netlify/functions/account-pause.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/account-pause",
        body: JSON.stringify({ action: "pause" }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Failed to pause account");
    expect(payload.error?.details).toBeNull();
  });
});
