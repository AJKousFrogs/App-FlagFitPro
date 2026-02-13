import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  adminAuthorized: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: async () => ({ data: [{ team_id: "team-1" }], error: null }),
          }),
          single: async () => ({ data: { id: "coach-1", name: "Coach One" }, error: null }),
        }),
      }),
    }),
  },
  db: {
    teams: {
      getUserTeams: async () => [],
      getTeamMembers: async () => [],
    },
  },
}));

vi.mock("../../netlify/functions/utils/consent-data-reader.js", () => ({
  ConsentDataReader: class {
    readTrainingSessions = async () => ({ data: [], consentInfo: { blockedPlayerIds: [] } });
    readWellnessEntries = async () => ({ data: [], consentInfo: { blockedPlayerIds: [] } });
  },
  AccessContext: {
    COACH_TEAM_DATA: "COACH_TEAM_DATA",
  },
}));

vi.mock("../../netlify/functions/utils/data-state.js", () => ({
  DataState: {
    NO_DATA: "NO_DATA",
    REAL_DATA: "REAL_DATA",
    INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  },
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "coach",
  requireRole: async () => ({ authorized: mockCtx.adminAuthorized }),
  logViolation: async () => {},
}));

describe("coach cross-coach access control", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.adminAuthorized = false;
    const mod = await import("../../netlify/functions/coach.js");
    handler = mod.handler;
  });

  it("blocks non-admin coach from querying another coach's dashboard", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/coach/dashboard",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { coachId: "coach-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });
});
