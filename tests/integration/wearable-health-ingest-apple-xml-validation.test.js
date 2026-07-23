import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  consents: [],
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
          if (call.method === "upsert" && table === "wearable_health") {
            state.wearableHealthUpserts.push(...call.payload);
            return Promise.resolve({
              data: call.payload.map((_, i) => ({ id: `row-${i}` })),
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

function record(attrs) {
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<Record ${attrString}/>`;
}

function makeEvent(body) {
  return {
    httpMethod: "POST",
    path: "/api/wearable-health-ingest/apple-health-xml",
    body: JSON.stringify(body),
  };
}

describe("wearable-health-ingest-apple-xml", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.consents = [];
    state.wearableHealthUpserts = [];
    const mod = await import(
      "../../netlify/functions/wearable-health-ingest-apple-xml.js"
    );
    handler = mod.handler;
  });

  it("requires xml text", async () => {
    const response = await handler(makeEvent({}), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects xml over the byte limit", async () => {
    const huge = "a".repeat(6 * 1024 * 1024);
    const response = await handler(makeEvent({ xml: huge }), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects an xml with no Record elements", async () => {
    const response = await handler(
      makeEvent({ xml: "<HealthData></HealthData>" }),
      {},
    );
    expect(response.statusCode).toBe(422);
    expect(response.body).toContain("export.xml");
  });

  it("rejects an export with records but none importable", async () => {
    const xml = record({
      type: "HKCategoryTypeIdentifierSleepAnalysis",
      value: "HKCategoryValueSleepAnalysisAsleep",
      startDate: "2024-01-01 23:00:00 -0700",
    });
    const response = await handler(makeEvent({ xml }), {});
    expect(response.statusCode).toBe(422);
    expect(response.body).toContain("no_importable_readings");
  });

  it("blocks ingest without granted apple_health consent", async () => {
    const xml = record({
      type: "HKQuantityTypeIdentifierHeartRate",
      unit: "count/min",
      value: "62",
      startDate: "2024-01-01 06:00:00 -0700",
    });
    const response = await handler(makeEvent({ xml }), {});
    expect(response.statusCode).toBe(403);
  });

  it("ingests readings once consent is granted", async () => {
    state.consents = [
      { user_id: "athlete-1", source: "apple_health", state: "granted" },
    ];
    const xml = [
      record({
        type: "HKQuantityTypeIdentifierHeartRate",
        unit: "count/min",
        value: "62",
        startDate: "2024-01-01 06:00:00 -0700",
      }),
      record({
        type: "HKQuantityTypeIdentifierRestingHeartRate",
        unit: "count/min",
        value: "55",
        startDate: "2024-01-01 06:05:00 -0700",
      }),
    ].join("\n");

    const response = await handler(makeEvent({ xml }), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.recordCount).toBe(2);
    expect(body.data.ingested).toBe(2);
    expect(body.data.truncated).toBe(false);
    expect(state.wearableHealthUpserts).toHaveLength(2);
    expect(state.wearableHealthUpserts[0].source).toBe("apple_health");
  });
});
