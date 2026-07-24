import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for alert-evaluate-rules.js. The original file queried
// wrong table/column names throughout (athlete_id instead of user_id,
// upper_bound_ratio instead of personalized_safe_zone_max, a nonexistent
// psychological_readiness_assessments table, an invalid PostgREST
// .gte(col, "expr * literal") comparison, and a check_underload_condition RPC
// that was never defined anywhere). ACWR Red/Yellow/Safety Alert, Phase
// Advancement, and Psychological Readiness Failed are now no-ops (handled by
// DB triggers instead -- see the file's header comment); only Underload Alert
// still runs real query logic here, since it's a multi-day condition no
// single-row trigger can express.

const state = vi.hoisted(() => ({
  rules: [],
  snapshots: [],
  insertedAlerts: [],
}));

function createQuery(table) {
  const call = {};
  const resolve = () => {
    if (table === "alert_rules") {
      return { data: state.rules, error: null };
    }
    if (table === "acwr_snapshots") {
      return { data: state.snapshots, error: null };
    }
    if (table === "generated_alerts") {
      if (call.method === "insert") {
        const row = { id: `alert-${state.insertedAlerts.length + 1}`, ...call.payload };
        state.insertedAlerts.push(row);
        return { data: [{ id: row.id }], error: null };
      }
    }
    if (table === "alert_delivery_logs") {
      return { data: [{ id: "delivery-1" }], error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    not: () => query,
    order: () => query,
    insert: (payload) => {
      call.method = "insert";
      call.payload = payload;
      return query;
    },
    then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "service-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

function makeEvent() {
  return {
    httpMethod: "POST",
    path: "/api/alert-evaluate-rules",
    headers: { "x-service-role": "true" },
  };
}

describe("alert-evaluate-rules", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.rules = [];
    state.snapshots = [];
    state.insertedAlerts = [];
    const mod = await import("../../netlify/functions/alert-evaluate-rules.js");
    handler = mod.handler;
  });

  it("rejects requests without the service-role header", async () => {
    const response = await handler(
      { httpMethod: "POST", path: "/api/alert-evaluate-rules", headers: {} },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("returns 0 evaluated rules when none are enabled", async () => {
    state.rules = [];
    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.evaluatedRules).toBe(0);
    expect(body.data.generatedAlerts).toBe(0);
  });

  it("does not fire an underload alert when fewer than consecutive_days of data exist", async () => {
    state.rules = [
      {
        id: "rule-underload",
        name: "Underload Alert",
        trigger_condition: { threshold: 0.8, consecutive_days: 3 },
      },
    ];
    state.snapshots = [
      { user_id: "athlete-1", snapshot_date: "2026-07-22", acwr_ratio: 0.5 },
      { user_id: "athlete-1", snapshot_date: "2026-07-23", acwr_ratio: 0.6 },
    ];

    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.generatedAlerts).toBe(0);
    expect(state.insertedAlerts.length).toBe(0);
  });

  it("fires an underload alert when all snapshots in the window are below threshold for consecutive_days", async () => {
    state.rules = [
      {
        id: "rule-underload",
        name: "Underload Alert",
        trigger_condition: { threshold: 0.8, consecutive_days: 3 },
      },
    ];
    state.snapshots = [
      { user_id: "athlete-1", snapshot_date: "2026-07-21", acwr_ratio: 0.5 },
      { user_id: "athlete-1", snapshot_date: "2026-07-22", acwr_ratio: 0.6 },
      { user_id: "athlete-1", snapshot_date: "2026-07-23", acwr_ratio: 0.55 },
    ];

    const response = await handler(makeEvent(), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.generatedAlerts).toBe(1);
    expect(state.insertedAlerts[0].user_id).toBe("athlete-1");
    expect(state.insertedAlerts[0].alert_type).toBe("low");
  });

  it("does not fire underload when any snapshot in the window is above threshold", async () => {
    state.rules = [
      {
        id: "rule-underload",
        name: "Underload Alert",
        trigger_condition: { threshold: 0.8, consecutive_days: 3 },
      },
    ];
    state.snapshots = [
      { user_id: "athlete-1", snapshot_date: "2026-07-21", acwr_ratio: 0.5 },
      { user_id: "athlete-1", snapshot_date: "2026-07-22", acwr_ratio: 0.9 },
      { user_id: "athlete-1", snapshot_date: "2026-07-23", acwr_ratio: 0.55 },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.generatedAlerts).toBe(0);
  });

  it("treats ACWR Red Flag / Phase Advancement / Psych Readiness rules as no-ops (handled by DB triggers)", async () => {
    state.rules = [
      { id: "r1", name: "ACWR Red Flag", trigger_condition: {} },
      { id: "r2", name: "ACWR Yellow Flag", trigger_condition: {} },
      { id: "r3", name: "Safety Alert", trigger_condition: {} },
      { id: "r4", name: "Phase Advancement Ready", trigger_condition: {} },
      { id: "r5", name: "Readiness Gate Failed", trigger_condition: {} },
      { id: "r6", name: "Psychological Readiness Failed", trigger_condition: {} },
      { id: "r7", name: "CMJ Depression Trend", trigger_condition: {} },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    expect(body.data.evaluatedRules).toBe(7);
    expect(body.data.generatedAlerts).toBe(0);
    expect(state.insertedAlerts.length).toBe(0);
  });
});
