import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for two real bugs found in an audit, both mirroring
// what was already found/fixed in rtp-team-protocols.js:
// (1) the inner handler declared only (event, _context) and read userId off
//     the raw Lambda context instead of baseHandler's injected auth object —
//     userId was always undefined, so every caller got a 403 regardless of
//     role.
// (2) the query embedded a nonexistent "athletes" table (no such table
//     exists live — rtp_athlete_protocol_assignments.athlete_id has no
//     declared FK to public.users), which would fail the entire select()
//     with a PostgREST relationship error on every call, even once (1) is
//     fixed.

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
    order: () => query,
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

describe("rtp-all-protocols", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "coach";
    state.assignments = [];
    state.users = [];
    const mod = await import("../../netlify/functions/rtp-all-protocols.js");
    handler = mod.handler;
  });

  it("does not 403 an authorized caller (userId must reach getUserRole)", async () => {
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).not.toBe(403);
  });

  it("returns 403 for a role outside LOAD_MANAGEMENT_ACCESS_ROLES", async () => {
    state.role = "player";
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("does not embed a nonexistent athletes table and joins the name via users instead", async () => {
    state.assignments = [
      {
        id: "assign-1",
        athlete_id: "athlete-1",
        injury_id: "injury-1",
        protocol_id: "protocol-1",
        current_phase: 1,
        estimated_return_date: "2026-08-01",
        created_at: "2026-07-01T00:00:00Z",
        updated_at: "2026-07-01T00:00:00Z",
        rtp_protocol_definitions: [{ injury_type: "ACL Tear", rts_rate_percent: 85 }],
        rtp_protocol_phases: [],
        rtp_functional_criteria: [],
      },
    ];
    state.users = [{ id: "athlete-1", first_name: "Alice", last_name: "Athlete" }];

    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.protocols).toHaveLength(1);
    expect(body.data.protocols[0].athlete_name).toBe("Alice Athlete");
  });

  it("returns an empty protocol list when there are no assignments", async () => {
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.protocols).toEqual([]);
  });
});
