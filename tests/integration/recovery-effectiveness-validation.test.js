import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression coverage for two bugs found in the same pass:
// 1. recovery-effectiveness.js queried/inserted into "recovery_logs", a table
//    no migration had ever created -- every call 500'd. Fixed by creating the
//    table (20260723120000_create_recovery_logs_table.sql).
// 2. logRecoverySession expected { modality_name, effectiveness_score, domain,
//    logDate }, but the frontend (recovery-effectiveness.component.ts) sends
//    { modality_name, log_date, effectiveness_1_10 } -- a payload-shape
//    mismatch that would have 422'd on every submission even after the table
//    existed. Fixed to accept the frontend's actual field names.

const state = vi.hoisted(() => ({
  logs: [],
  insertedRows: [],
}));

function createQuery(table) {
  const call = { filters: {} };
  const resolve = () => {
    if (table === "recovery_logs") {
      if (call.method === "insert") {
        state.insertedRows.push(...call.payload);
        return { data: null, error: null };
      }
      return { data: state.logs, error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    gte: () => query,
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
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

describe("recovery-effectiveness", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.logs = [];
    state.insertedRows = [];
    const mod = await import("../../netlify/functions/recovery-effectiveness.js");
    handler = mod.handler;
  });

  it("logs a recovery session using the frontend's actual payload shape", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/api/recovery-effectiveness",
        headers: {},
        body: JSON.stringify({
          modality_name: "ice_bath",
          log_date: "2026-07-23",
          effectiveness_1_10: 8,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.insertedRows).toHaveLength(1);
    expect(state.insertedRows[0]).toMatchObject({
      athlete_id: "athlete-1",
      modality_name: "ice_bath",
      effectiveness_score: 8,
      domain: "general",
      created_at: "2026-07-23",
    });
  });

  it("rejects a log without modality_name or effectiveness_1_10", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/api/recovery-effectiveness",
        headers: {},
        body: JSON.stringify({ modality_name: "ice_bath" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("aggregates modality effectiveness on GET", async () => {
    state.logs = [
      { modality_name: "ice_bath", effectiveness_score: 8, domain: "inflammation", created_at: "2026-07-20T00:00:00Z" },
      { modality_name: "ice_bath", effectiveness_score: 6, domain: "inflammation", created_at: "2026-07-21T00:00:00Z" },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/api/recovery-effectiveness",
        headers: {},
        rawQueryString: "timeframe=4-week",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // createSuccessResponse wraps the handler's payload under .data; the
    // frontend unwraps this one level via extractApiPayload().
    expect(body.data.modalities).toHaveLength(1);
    expect(body.data.modalities[0].usage_count).toBe(2);
    expect(body.data.modalities[0].avg_effectiveness).toBe(7);
  });
});
