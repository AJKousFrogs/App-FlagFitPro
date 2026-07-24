import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for two real bugs found in an audit:
// (1) the inner handler declared only (event, _context) and read userId off
//     the raw Lambda context instead of baseHandler's injected auth object
//     (the third argument) — userId was always undefined, so getUserRole()
//     always returned null and every caller got a 403, regardless of role.
// (2) teamId was read as the LAST path segment, but the route is
//     /api/rtp/team/:teamId/protocols — "protocols" trails it, so teamId
//     resolved to "protocols" (never a real team) on every real request.

const state = vi.hoisted(() => ({
  role: "coach",
  assignments: [],
  users: [],
}));

function createQuery(table) {
  const call = { filters: {} };

  const resolve = () => {
    if (table === "rtp_athlete_protocol_assignments") {
      return { data: state.assignments, error: null };
    }
    if (table === "users") {
      return { data: state.users, error: null };
    }
    return { data: [], error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    in: () => query,
    neq: () => query,
    then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

describe("rtp-team-protocols", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "coach";
    state.assignments = [];
    state.users = [];
    const mod = await import("../../netlify/functions/rtp-team-protocols.js");
    handler = mod.handler;
  });

  it("does not 403 an authorized caller (userId must reach getUserRole)", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/rtp/team/team-abc-123/protocols",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).not.toBe(403);
  });

  it("returns 403 for a role outside LOAD_MANAGEMENT_ACCESS_ROLES", async () => {
    state.role = "player";
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/rtp/team/team-abc-123/protocols",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("extracts teamId as the second-to-last path segment, not the last", async () => {
    state.assignments = [
      {
        id: "assign-1",
        athlete_id: "athlete-1",
        injury_id: "injury-1",
        protocol_id: "protocol-1",
        current_phase: 2,
        estimated_return_date: "2026-08-01",
        created_at: "2026-07-01T00:00:00Z",
        rtp_protocol_definitions: [
          { injury_type: "ACL Tear", display_name: "ACL Tear", rts_rate_percent: 85 },
        ],
        rtp_protocol_phases: [{ phase_number: 2, phase_name: "Early Mobilization" }],
        rtp_functional_criteria: [],
      },
    ];
    state.users = [{ id: "athlete-1", full_name: "Alice Athlete" }];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/rtp/team/team-abc-123/protocols",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.teamId).toBe("team-abc-123");
    expect(body.data.protocols).toHaveLength(1);
  });

  it("joins athlete_name onto each protocol", async () => {
    state.assignments = [
      {
        id: "assign-1",
        athlete_id: "athlete-1",
        injury_id: "injury-1",
        protocol_id: "protocol-1",
        current_phase: 1,
        estimated_return_date: "2026-08-01",
        created_at: "2026-07-01T00:00:00Z",
        rtp_protocol_definitions: [{ injury_type: "ACL Tear", rts_rate_percent: 85 }],
        rtp_protocol_phases: [],
        rtp_functional_criteria: [],
      },
    ];
    state.users = [{ id: "athlete-1", full_name: "Alice Athlete" }];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/rtp/team/team-abc-123/protocols",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    const body = JSON.parse(response.body);
    expect(body.data.protocols[0].athlete_name).toBe("Alice Athlete");
  });

  it("returns an empty protocol list when the team has no assignments", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/rtp/team/team-abc-123/protocols",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.protocols).toEqual([]);
    expect(body.data.teamId).toBe("team-abc-123");
  });
});
