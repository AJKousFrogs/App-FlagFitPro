import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "user-1",
  role: "player",
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

describe("admin authorization and failure response hardening", () => {
  let handler;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    authState.userId = "user-1";
    authState.role = "player";
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

  // The USDA/research sync admin lanes were retired (ghost-table cleanup,
  // 2026-06-09; the research-sync stub function was since removed) — they 404 now.
  it("returns 404 for the retired sync lanes", async () => {
    authState.role = "admin";

    for (const path of [
      "/.netlify/functions/admin/sync-usda",
      "/.netlify/functions/admin/sync-research",
    ]) {
      const response = await handler(
        {
          httpMethod: "POST",
          path,
          headers: { authorization: "Bearer test-token" },
        },
        {},
      );
      expect(response.statusCode).toBe(404);
    }
  });
});
