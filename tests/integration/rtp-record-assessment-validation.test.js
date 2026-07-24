import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for two real bugs in the same query:
// 1. .select("DISTINCT criteria_id") is not valid PostgREST syntax (there's
//    no SQL DISTINCT in the select query param) — this query always errored
//    when the next phase had real criteria.
// 2. The error was silently swallowed (only `data` was destructured), so
//    `phaseAdvancementEligible` was always false regardless of real
//    progress — the "ready to advance" signal returned to the frontend was
//    permanently wrong.

const state = vi.hoisted(() => ({
  role: "physiotherapist",
  assignment: null,
  criteria: null,
  nextPhaseCriteria: [],
  passedAssessments: [],
  insertedAssessment: null,
}));

function createQuery(table) {
  const call = { filters: {} };

  const resolve = () => {
    if (table === "rtp_athlete_protocol_assignments") {
      return state.assignment
        ? { data: state.assignment, error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    if (table === "rtp_functional_criteria") {
      if (call.method === "single") {
        return state.criteria
          ? { data: state.criteria, error: null }
          : { data: null, error: { code: "PGRST116" } };
      }
      return { data: state.nextPhaseCriteria, error: null };
    }
    if (table === "rtp_criteria_assessments") {
      if (call.method === "insert") {
        return state.insertedAssessment
          ? { data: state.insertedAssessment, error: null }
          : { data: null, error: { code: "23503" } };
      }
      return { data: state.passedAssessments, error: null };
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
    insert: (payload) => {
      call.method = "insert";
      call.payload = payload;
      return query;
    },
    single: () => {
      if (!call.method) call.method = "single";
      return Promise.resolve(resolve());
    },
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

function makeEvent(body) {
  return {
    httpMethod: "POST",
    path: "/api/rtp/assessments",
    headers: { authorization: "Bearer test-token" },
    body: JSON.stringify(body),
  };
}

describe("rtp-record-assessment", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "physiotherapist";
    state.assignment = {
      id: "assign-1",
      athlete_id: "athlete-1",
      current_phase: 2,
      protocol_id: "protocol-1",
    };
    state.criteria = {
      id: "crit-1",
      criteria_name: "Strength LSI 90%",
      phase_required: 3,
    };
    state.nextPhaseCriteria = [];
    state.passedAssessments = [];
    state.insertedAssessment = {
      id: "assess-1",
      assignment_id: "assign-1",
      criteria_id: "crit-1",
      pass_fail: true,
    };
    const mod = await import("../../netlify/functions/rtp-record-assessment.js");
    handler = mod.handler;
  });

  it("returns 403 for a non-physiotherapist role", async () => {
    state.role = "coach";
    const response = await handler(
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await handler(
      makeEvent({ assignmentId: "assign-1" }),
      {},
    );
    expect(response.statusCode).toBe(400);
  });

  it("returns 404 when the assignment does not exist", async () => {
    state.assignment = null;
    const response = await handler(
      makeEvent({
        assignmentId: "missing",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );
    expect(response.statusCode).toBe(404);
  });

  it("returns 404 when the criteria does not belong to the protocol", async () => {
    state.criteria = null;
    const response = await handler(
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );
    expect(response.statusCode).toBe(404);
  });

  it("records the assessment and marks phaseAdvancementEligible false when no next-phase criteria are met yet", async () => {
    state.nextPhaseCriteria = [
      { id: "crit-1", criteria_name: "Strength LSI 90%" },
      { id: "crit-2", criteria_name: "Hop Test" },
    ];
    state.passedAssessments = [{ criteria_id: "crit-1" }];

    const response = await handler(
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.phaseAdvancementEligible).toBe(false);
  });

  it("marks phaseAdvancementEligible true, deduping multiple passed rows for the same criterion", async () => {
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
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.phaseAdvancementEligible).toBe(true);
    expect(body.nextPhase).toBe(3);
  });

  it("is eligible to advance when the next phase has no functional criteria", async () => {
    state.nextPhaseCriteria = [];

    const response = await handler(
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.phaseAdvancementEligible).toBe(true);
  });

  it("does not compute phase advancement when the athlete is already at the final phase", async () => {
    state.assignment.current_phase = 5;

    const response = await handler(
      makeEvent({
        assignmentId: "assign-1",
        criteriaId: "crit-1",
        assessedValue: 92,
        pass_fail: true,
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.phaseAdvancementEligible).toBe(false);
    expect(body.nextPhase).toBe(null);
  });
});
