import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

const dbState = vi.hoisted(() => ({
  insertError: null,
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
    from: (table) => {
      if (table === "team_members") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "sessions") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "session-1" },
                error: dbState.insertError,
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    },
  },
}));

describe("import-open-data validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    dbState.insertError = null;
    const mod = await import("../../netlify/functions/import-open-data.js");
    handler = mod.handler;
  });

  it("returns 422 for non-object payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/import-open-data",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when player targets another athlete", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/import-open-data",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          athleteId: "athlete-2",
          dataset: [{ speed_m_s: 5, distance_m: 10 }],
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for invalid dataset value types", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/import-open-data",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          dataset: [{ speed_m_s: "fast", distance_m: 10 }],
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when insert fails", async () => {
    dbState.insertError = { message: "db secret exposed" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/import-open-data",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          dataset: [{ speed_m_s: 5, distance_m: 10 }],
        }),
      },
      {},
    );
    const parsed = JSON.parse(response.body);
    expect(response.statusCode).toBe(500);
    expect(parsed.error?.message).toBe("Failed to insert session");
    expect(response.body).not.toContain("db secret exposed");
  });
});
