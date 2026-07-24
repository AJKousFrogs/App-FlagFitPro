import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for a real bug: .select("DISTINCT criteria_id") is not
// valid PostgREST syntax (there's no SQL DISTINCT in the select query param).
// Whenever the next phase had real functional criteria, this query returned
// a PostgREST parse error, which the code treated as assessmentError and
// hard-500'd — a physiotherapist could never advance an athlete past any
// phase that actually had criteria defined.

const state = vi.hoisted(() => ({
  role: "physiotherapist",
  assignment: null,
  nextPhaseCriteria: [],
  passedAssessments: [],
  protocol: null,
  nextPhaseDetails: null,
  updatedAssignment: null,
}));

function createQuery(table) {
  const call = { filters: {} };

  const resolve = () => {
    if (table === "rtp_athlete_protocol_assignments") {
      if (call.method === "update") {
        return { data: state.updatedAssignment, error: null };
      }
      return state.assignment
        ? { data: state.assignment, error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    if (table === "rtp_functional_criteria") {
      return { data: state.nextPhaseCriteria, error: null };
    }
    if (table === "rtp_criteria_assessments") {
      return { data: state.passedAssessments, error: null };
    }
    if (table === "rtp_protocol_definitions") {
      return state.protocol
        ? { data: state.protocol, error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    if (table === "rtp_protocol_phases") {
      return state.nextPhaseDetails
        ? { data: state.nextPhaseDetails, error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    in: () => query,
    update: (payload) => {
      call.method = "update";
      call.payload = payload;
      return query;
    },
    single: () => Promise.resolve(resolve()),
    maybeSingle: () => Promise.resolve(resolve()),
    then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "physio-1" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

describe("rtp-advance-phase", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "physiotherapist";
    state.assignment = {
      id: "assign-1",
      athlete_id: "athlete-1",
      injury_id: "injury-1",
      protocol_id: "protocol-1",
      current_phase: 2,
      phase_start_date: "2026-07-01",
    };
    state.nextPhaseCriteria = [];
    state.passedAssessments = [];
    state.protocol = { typical_rtp_timeline_days_min: 30 };
    state.nextPhaseDetails = { id: "phase-3", phase_name: "Intermediate Strengthening" };
    state.updatedAssignment = { id: "assign-1", current_phase: 3 };
    const mod = await import("../../netlify/functions/rtp-advance-phase.js");
    handler = mod.handler;
  });

  it("returns 403 for a non-physiotherapist role", async () => {
    state.role = "coach";
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/rtp/athletes/athlete-1/injury-1/phase",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("advances when the next phase has no functional criteria", async () => {
    state.nextPhaseCriteria = [];
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/rtp/athletes/athlete-1/injury-1/phase",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("advances when all next-phase criteria have passed (dedupes multiple rows per criterion)", async () => {
    state.nextPhaseCriteria = [
      { id: "crit-1", criteria_name: "Strength LSI 90%" },
      { id: "crit-2", criteria_name: "Hop Test" },
    ];
    // crit-1 has two passing rows over time (retested) — must count once.
    state.passedAssessments = [
      { criteria_id: "crit-1" },
      { criteria_id: "crit-1" },
      { criteria_id: "crit-2" },
    ];

    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/rtp/athletes/athlete-1/injury-1/phase",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
  });

  it("blocks advancement when not all next-phase criteria have passed", async () => {
    state.nextPhaseCriteria = [
      { id: "crit-1", criteria_name: "Strength LSI 90%" },
      { id: "crit-2", criteria_name: "Hop Test" },
    ];
    state.passedAssessments = [{ criteria_id: "crit-1" }];

    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/rtp/athletes/athlete-1/injury-1/phase",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when the athlete is already at the final phase", async () => {
    state.assignment.current_phase = 5;
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/rtp/athletes/athlete-1/injury-1/phase",
        headers: { authorization: "Bearer test-token" },
      },
      {},
    );
    expect(response.statusCode).toBe(400);
  });
});
