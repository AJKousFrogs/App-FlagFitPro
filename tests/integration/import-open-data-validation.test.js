import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

const dbState = vi.hoisted(() => ({
  insertError: null,
  updateError: null,
  rpcData: [{ session_id: "session-1" }],
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

      if (table === "training_sessions") {
        return {
          update: () => ({
            eq: async () => ({
              data: null,
              error: dbState.updateError,
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
    rpc: async () => ({
      data: dbState.rpcData,
      error: dbState.insertError,
    }),
  },
}));

describe("import-open-data validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    dbState.insertError = null;
    dbState.updateError = null;
    dbState.rpcData = [{ session_id: "session-1" }];
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

  it("returns canonical session metadata after successful import", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/import-open-data",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          dataset: [
            { speed_m_s: 7.5, distance_m: 20 },
            { speed_m_s: 5.8, distance_m: 15 },
            { speed_m_s: 4.2, distance_m: 10 },
          ],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const parsed = JSON.parse(response.body);
    expect(parsed.data.ok).toBe(true);
    expect(parsed.data.session_id).toBe("session-1");
    expect(parsed.data.estimated_rpe).toBeGreaterThanOrEqual(1);
    expect(parsed.data.metrics.total_volume).toBeGreaterThan(0);
    expect(parsed.data.metrics.duration_minutes).toBeGreaterThanOrEqual(0);
  });
});
