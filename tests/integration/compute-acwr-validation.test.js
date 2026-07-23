import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "athlete-1",
  role: "player",
}));

const dbState = vi.hoisted(() => ({
  sessions: [],
  activePause: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: authState.userId,
      requestId: "req-test",
    }),
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
          select() {
            return this;
          },
          eq() {
            return this;
          },
          gte() {
            return this;
          },
          order: async () => ({
            data: dbState.sessions,
            error: null,
          }),
        };
      }

      if (table === "account_pause_requests") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle: async () => ({
            data: dbState.activePause,
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    rpc: async () => ({ data: 1.11, error: null }),
  },
}));

describe("compute-acwr validation and authorization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "athlete-1";
    authState.role = "player";
    dbState.sessions = [];
    dbState.activePause = null;
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

  it("returns a timeline array plus current summary", async () => {
    dbState.sessions = [
      {
        session_date: "2026-03-27",
        duration_minutes: 60,
        rpe: 7,
        workload: 420,
        status: "completed",
      },
      {
        session_date: "2026-03-25",
        duration_minutes: 50,
        rpe: 6,
        workload: 300,
        status: "completed",
      },
    ];

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/compute-acwr",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ athleteId: "athlete-1" }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body.data.data)).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
    expect(body.data.summary.current_acwr).toBeDefined();
    expect(body.data.summary.latest_session_date).toBe("2026-03-27");
  });

  it("freezes the series at the pause moment when acwr_frozen is active", async () => {
    dbState.sessions = [
      // Newest first, matching the real query's ORDER BY session_date DESC.
      // This session lands AFTER the freeze moment (e.g. a delayed sync/
      // admin-logged entry) -- without freezing it would push the series'
      // end date past the pause.
      {
        session_date: "2026-03-28",
        duration_minutes: 60,
        rpe: 7,
        workload: 420,
        status: "completed",
      },
      {
        session_date: "2026-03-25",
        duration_minutes: 50,
        rpe: 6,
        workload: 300,
        status: "completed",
      },
    ];
    dbState.activePause = { paused_at: "2026-03-27T00:00:00.000Z" };

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/compute-acwr",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ athleteId: "athlete-1" }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // The series' last row is the pause moment, not "today" -- no zero-load
    // days past the freeze point are folded into the EWMA windows.
    expect(body.data.data.at(-1).session_date).toBe("2026-03-27");
  });
});
