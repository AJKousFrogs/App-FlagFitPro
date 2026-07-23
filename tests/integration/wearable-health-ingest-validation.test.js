import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  consents: [],
  consentUpserts: [],
  wearableHealthUpserts: [],
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { table, filters: {} };
      const query = {
        select() {
          return query;
        },
        eq(field, value) {
          call.filters[field] = value;
          return query;
        },
        upsert(payload) {
          call.method = "upsert";
          call.payload = payload;
          return query;
        },
        maybeSingle: () => {
          if (table === "wearable_consent") {
            const match = state.consents.find(
              (c) =>
                c.user_id === call.filters.user_id &&
                c.source === call.filters.source,
            );
            return Promise.resolve({ data: match || null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve, reject) {
          if (call.method === "upsert" && table === "wearable_consent") {
            state.consentUpserts.push(call.payload);
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          }
          if (call.method === "upsert" && table === "wearable_health") {
            const rows = call.payload;
            state.wearableHealthUpserts.push(...rows);
            return Promise.resolve({
              data: rows.map((_, i) => ({ id: `row-${i}` })),
              error: null,
            }).then(resolve, reject);
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        },
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

function makeEvent(method, body) {
  return {
    httpMethod: method,
    path: "/api/wearable-health-ingest",
    body: JSON.stringify(body),
  };
}

describe("wearable-health-ingest (refactored onto the shared core)", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.consents = [];
    state.consentUpserts = [];
    state.wearableHealthUpserts = [];
    const mod = await import("../../netlify/functions/wearable-health-ingest.js");
    handler = mod.handler;
  });

  it("records granted consent via PUT", async () => {
    const response = await handler(
      makeEvent("PUT", { source: "oura", state: "granted" }),
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(state.consentUpserts[0].state).toBe("granted");
  });

  it("blocks POST ingest without granted consent", async () => {
    const response = await handler(
      makeEvent("POST", {
        source: "oura",
        readings: [{ metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" }],
      }),
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("ingests readings once consent is granted", async () => {
    state.consents = [{ user_id: "athlete-1", source: "oura", state: "granted" }];
    const response = await handler(
      makeEvent("POST", {
        source: "oura",
        readings: [{ metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" }],
      }),
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.ingested).toBe(1);
    expect(state.wearableHealthUpserts).toHaveLength(1);
  });

  it("requires readings[] on POST", async () => {
    state.consents = [{ user_id: "athlete-1", source: "oura", state: "granted" }];
    const response = await handler(makeEvent("POST", { source: "oura" }), {});
    expect(response.statusCode).toBe(422);
  });
});
