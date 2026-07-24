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
    if (call.filters.role) {
      rows = rows.filter((r) => r.role === call.filters.role);
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
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

function makeEvent(body) {
  return {
    httpMethod: "POST",
    path: "/api/session-load-import",
    headers: { authorization: "Bearer test-token" },
    body: JSON.stringify(body),
  };
}

describe("session-load-import (JSON)", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-1",
        user_id: "athlete-1",
        is_active: true,
      },
    ];
    state.teamMemberRoles = [];
    state.sessionLoadUpserts = [];
    state.upsertError = null;
    const mod = await import("../../netlify/functions/session-load-import.js");
    handler = mod.handler;
  });

  it("rejects an unknown provider", async () => {
    const response = await handler(
      makeEvent({ provider: "nonsense", rows: [{}] }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("requires rows[]", async () => {
    const response = await handler(makeEvent({ provider: "catapult" }), {});
    expect(response.statusCode).toBe(422);
  });

  it("imports a paired athlete's row and upserts idempotently", async () => {
    const response = await handler(
      makeEvent({
        provider: "catapult",
        rows: [
          {
            athlete_id: "ext-1",
            activity_id: "act-1",
            start_time: "2026-07-20T10:00:00Z",
            total_distance: "5000",
          },
        ],
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.imported).toBe(1);
    expect(body.data.failedCount).toBe(0);
    expect(state.sessionLoadUpserts).toHaveLength(1);
    expect(state.sessionLoadUpserts[0].user_id).toBe("athlete-1");
  });

  it("surfaces an unpaired row in failed[] without failing the whole import", async () => {
    const response = await handler(
      makeEvent({
        provider: "catapult",
        rows: [
          {
            athlete_id: "unknown-ext-id",
            activity_id: "act-2",
            start_time: "2026-07-20T10:00:00Z",
          },
        ],
      }),
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.imported).toBe(0);
    expect(body.data.partial).toBe(true);
    expect(body.data.failed[0].reason).toBe("no device<->athlete pairing");
  });

  it("blocks importing for an athlete the caller doesn't staff", async () => {
    state.devicePairings.push({
      provider_id: "prov-cat",
      external_athlete_id: "ext-2",
      user_id: "athlete-2",
      is_active: true,
    });

    const response = await handler(
      makeEvent({
        provider: "catapult",
        rows: [
          {
            athlete_id: "ext-2",
            activity_id: "act-3",
            start_time: "2026-07-20T10:00:00Z",
          },
        ],
      }),
      {},
    );

    const body = JSON.parse(response.body);
    expect(body.data.imported).toBe(0);
    expect(body.data.failed[0].reason).toBe(
      "not permitted to import for this athlete",
    );
  });

  it("returns 500 without silently reporting success when the upsert fails", async () => {
    state.upsertError = { message: "db exploded" };
    const response = await handler(
      makeEvent({
        provider: "catapult",
        rows: [
          {
            athlete_id: "ext-1",
            activity_id: "act-1",
            start_time: "2026-07-20T10:00:00Z",
          },
        ],
      }),
      {},
    );
    expect(response.statusCode).toBe(500);
  });
});
