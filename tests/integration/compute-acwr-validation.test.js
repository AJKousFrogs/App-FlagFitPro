import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId, requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    rpc: async () => ({ data: [], error: null }),
  },
}));

describe("compute-acwr validation and authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    ({ handler } = await import("../../netlify/functions/compute-acwr.js"));
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/compute-acwr",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid athleteId format", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/compute-acwr",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ athleteId: "bad id with spaces" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when non-staff user targets another athlete", async () => {
    authState.role = "player";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/compute-acwr",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ athleteId: "athlete-2" }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
