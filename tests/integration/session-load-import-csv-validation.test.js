import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  providers: [],
  devicePairings: [],
  teamMemberRoles: [],
  sessionLoadUpserts: [],
  upsertError: null,
}));

function resolve(call) {
  if (call.table === "monitoring_providers") {
    const match = state.providers.find((p) => p.key === call.filters.key);
    return { data: match || null, error: null };
  }
  if (call.table === "device_pairings") {
    const rows = state.devicePairings.filter(
      (p) =>
        p.provider_id === call.filters.provider_id &&
        (!("is_active" in call.filters) ||
          p.is_active === call.filters.is_active),
    );
    return { data: rows, error: null };
  }
  if (call.table === "team_member_roles") {
    let rows = state.teamMemberRoles;
    if (call.filters.user_id) {
      rows = rows.filter((r) => r.user_id === call.filters.user_id);
    }
    if (call.inFilters.user_id) {
      rows = rows.filter((r) => call.inFilters.user_id.includes(r.user_id));
    }
    if (call.inFilters.role) {
      rows = rows.filter((r) => call.inFilters.role.includes(r.role));
    }
    return { data: rows, error: null };
  }
  if (call.table === "session_load" && call.method === "upsert") {
    const rows = Array.isArray(call.payload) ? call.payload : [call.payload];
    if (state.upsertError) {
      return { data: null, error: state.upsertError };
    }
    state.sessionLoadUpserts.push(...rows);
    return { data: rows.map((_, i) => ({ id: `row-${i}` })), error: null };
  }
  return { data: [], error: null };
}

function createFakeSupabase() {
  return {
    from(table) {
      const call = { table, filters: {}, inFilters: {} };
      const query = {
        select() {
          return query;
        },
        eq(field, value) {
          call.filters[field] = value;
          return query;
        },
        in(field, values) {
          call.inFilters[field] = values;
          return query;
        },
        upsert(payload) {
          call.method = "upsert";
          call.payload = payload;
          return query;
        },
        maybeSingle: () => Promise.resolve(resolve(call)),
        then: (res, rej) => Promise.resolve(resolve(call)).then(res, rej),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

function makeEvent(body) {
  return {
    httpMethod: "POST",
    path: "/api/session-load-import/csv",
    headers: { authorization: "Bearer test-token" },
    body: JSON.stringify(body),
  };
}

describe("session-load-import-csv", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.providers = [{ key: "manual", id: "prov-manual" }];
    state.devicePairings = [
      {
        provider_id: "prov-manual",
        external_athlete_id: "ext-1",
        user_id: "coach-1",
        is_active: true,
      },
    ];
    state.teamMemberRoles = [];
    state.sessionLoadUpserts = [];
    state.upsertError = null;
    const mod = await import(
      "../../netlify/functions/session-load-import-csv.js"
    );
    handler = mod.handler;
  });

  it("requires csv text", async () => {
    const response = await handler(makeEvent({ provider: "manual" }), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects a header-only CSV with no data rows", async () => {
    const response = await handler(
      makeEvent({ provider: "manual", csv: "athlete_id,session_id,date\n" }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects a CSV over the byte limit", async () => {
    const huge = "a,b\n" + "1,2\n".repeat(1_000_000);
    const response = await handler(
      makeEvent({ provider: "manual", csv: huge }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("parses a manual-provider CSV export and imports the paired row", async () => {
    const csv = [
      "athlete_id,session_id,date,distance,load",
      "ext-1,sess-1,2026-07-20,4500,320",
    ].join("\n");

    const response = await handler(
      makeEvent({ provider: "manual", csv }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.received).toBe(1);
    expect(body.data.imported).toBe(1);
    expect(state.sessionLoadUpserts).toHaveLength(1);
    expect(state.sessionLoadUpserts[0].total_distance_m).toBe(4500);
  });

  it("surfaces an unpaired external athlete id as a failed row, not a silent drop", async () => {
    const csv = [
      "athlete_id,session_id,date,distance",
      "no-such-athlete,sess-2,2026-07-20,1000",
    ].join("\n");

    const response = await handler(
      makeEvent({ provider: "manual", csv }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.imported).toBe(0);
    expect(body.data.partial).toBe(true);
    expect(body.data.failed[0].reason).toBe("no device<->athlete pairing");
  });

  it("rejects an unknown provider", async () => {
    const response = await handler(
      makeEvent({ provider: "nonsense", csv: "a,b\n1,2" }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });
});
