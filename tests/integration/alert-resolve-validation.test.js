import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for a real bug: clearAutomationFlags queried
// acwr_snapshots with .eq("athlete_id", ...) instead of the actual column
// user_id, and tried to update a load_restriction_active column that doesn't
// exist. It was wrapped in try/catch (so it degraded silently rather than
// crashing the request), but the intended "clear the safety flag on resolve"
// behavior never actually ran. This locks the fixed column names.

const state = vi.hoisted(() => ({
  alert: null,
  teamMember: null,
  updatedAlert: null,
  snapshot: null,
  snapshotUpdatePayload: null,
  snapshotEqFilters: {},
  snapshotSelectFilters: {},
}));

function createQuery(table) {
  const call = { filters: {} };
  const resolve = () => {
    if (table === "generated_alerts") {
      if (call.method === "update") {
        return { data: [state.updatedAlert], error: null };
      }
      return state.alert ? { data: state.alert, error: null } : { data: null, error: { code: "PGRST116" } };
    }
    if (table === "team_members") {
      return state.teamMember
        ? { data: state.teamMember, error: null }
        : { data: null, error: null };
    }
    if (table === "athlete_injuries") {
      return { data: null, error: null };
    }
    if (table === "acwr_snapshots") {
      if (call.method === "update") {
        state.snapshotUpdatePayload = call.payload;
        state.snapshotEqFilters = { ...call.filters };
        return { data: null, error: null };
      }
      state.snapshotSelectFilters = { ...call.filters };
      return state.snapshot
        ? { data: state.snapshot, error: null }
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
    order: () => query,
    limit: () => query,
    single: () => Promise.resolve(resolve()),
    update: (payload) => {
      call.method = "update";
      call.payload = payload;
      return query;
    },
    then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "coach",
}));

vi.mock("../../netlify/functions/utils/role-sets.js", () => ({
  hasAnyRole: (role, roles) => roles.includes(role),
  LOAD_MANAGEMENT_ACCESS_ROLES: ["coach", "physiotherapist", "strength_coach"],
}));

vi.mock("../../netlify/functions/utils/team-scope.js", () => ({
  getUserTeam: async () => ({ teamId: "team-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

describe("alert-resolve", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.alert = {
      id: "alert-1",
      user_id: "athlete-1",
      rule_id: "rule-1",
      status: "active",
      trigger_data: { acwr: 1.42, acute_load: 150 },
      related_injury_id: null,
    };
    state.teamMember = { user_id: "athlete-1" };
    state.updatedAlert = { id: "alert-1", status: "resolved", resolved_at: "2026-07-23T00:00:00Z" };
    state.snapshot = { id: "snapshot-1" };
    state.snapshotUpdatePayload = null;
    state.snapshotEqFilters = {};

    const mod = await import("../../netlify/functions/alert-resolve.js");
    handler = mod.handler;
  });

  function makeEvent(body = {}) {
    return {
      httpMethod: "PATCH",
      path: "/api/alerts/alert-1/resolve",
      headers: {},
      body: JSON.stringify(body),
    };
  }

  it("resolves the alert and clears the acwr_snapshots safety_alert flag by user_id", async () => {
    const response = await handler(makeEvent({ resolutionNotes: "load reduced" }), {});
    expect(response.statusCode).toBe(200);

    expect(state.snapshotSelectFilters.user_id).toBe("athlete-1");
    expect(state.snapshotSelectFilters.athlete_id).toBeUndefined();
    expect(state.snapshotUpdatePayload).toEqual({ safety_alert: false });
    expect(state.snapshotUpdatePayload.load_restriction_active).toBeUndefined();
  });

  it("returns 404 when the alert does not exist", async () => {
    state.alert = null;
    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(404);
  });

  it("returns 403 when the athlete is not on the caller's team", async () => {
    state.teamMember = null;
    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(403);
  });
});
