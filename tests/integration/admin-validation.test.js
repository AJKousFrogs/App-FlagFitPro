import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "user-1",
  role: "player",
}));
const researchState = vi.hoisted(() => ({
  throwError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => authState.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        limit: async () => ({ data: [], error: null }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
      insert: async () => ({ error: null }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
      }),
    },
  },
}));

vi.mock("../../netlify/functions/research-sync.js", () => ({
  syncAllResearch: async () => {
    if (researchState.throwError) {
      throw new Error("upstream token expired");
    }
    return { success: true, stats: {} };
  },
}));

describe("admin authorization and failure response hardening", () => {
  let handler;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    authState.userId = "user-1";
    authState.role = "player";
    researchState.throwError = false;
    const mod = await import("../../netlify/functions/admin.js");
    handler = mod.handler;
  });

  it("returns 403 when authenticated user is not admin by authoritative role lookup", async () => {
    authState.role = "player";
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/admin/health-metrics",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 503 with success=false when USDA sync is unavailable", async () => {
    process.env.USDA_API_KEY = "";
    authState.role = "admin";
    vi.resetModules();
    const mod = await import("../../netlify/functions/admin.js");
    handler = mod.handler;

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/admin/sync-usda",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(503);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.message).toContain("unavailable");
  });

  it("sanitizes internal sync errors for research endpoint", async () => {
    authState.role = "admin";
    researchState.throwError = true;

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/admin/sync-research",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(parsed.error?.message).toBe("Research sync failed due to an internal error");
    expect(JSON.stringify(parsed)).not.toContain("upstream token expired");
  });
});
