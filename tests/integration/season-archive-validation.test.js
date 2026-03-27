import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "coach",
  rpcError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    rpc: async () => ({ data: null, error: state.rpcError }),
  },
}));

describe("season-archive validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "coach";
    state.rpcError = null;
    ({ handler } = await import("../../netlify/functions/season-archive.js"));
  });

  it("returns 422 for non-object payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-archive",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid season_id format", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-archive",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ season_id: "not-a-uuid" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when archive rpc fails", async () => {
    state.rpcError = { message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/season-archive",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ season_id: "123e4567-e89b-12d3-a456-426614174000" }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to archive season");
    expect(body.error.details).toBeFalsy();
  });
});
