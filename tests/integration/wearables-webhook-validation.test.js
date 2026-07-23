import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  providers: [],
  devicePairings: [],
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
          if (table === "monitoring_providers") {
            const match = state.providers.find(
              (p) => p.key === call.filters.key,
            );
            return Promise.resolve({ data: match || null, error: null });
          }
          if (table === "device_pairings") {
            const match = state.devicePairings.find(
              (p) =>
                p.provider_id === call.filters.provider_id &&
                p.external_athlete_id === call.filters.external_athlete_id &&
                (!("is_active" in call.filters) ||
                  p.is_active === call.filters.is_active),
            );
            return Promise.resolve({ data: match || null, error: null });
          }
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
          if (table === "wearable_health" && call.method === "upsert") {
            const rows = call.payload;
            state.wearableHealthUpserts.push(...rows);
            return Promise.resolve({
              data: rows.map((_, i) => ({ id: `row-${i}` })),
              error: null,
            }).then(resolve, reject);
          }
          return Promise.resolve({ data: null, error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

function sign(secret, rawBody) {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function makeEvent(provider, body, { signature, secret = "whsecret" } = {}) {
  const rawBody = JSON.stringify(body);
  return {
    httpMethod: "POST",
    path: `/api/wearables/webhook/${provider}`,
    headers: {
      "x-webhook-signature":
        signature !== undefined ? signature : sign(secret, rawBody),
    },
    body: rawBody,
  };
}

describe("wearables-webhook", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    process.env.GARMIN_WEBHOOK_SECRET = "whsecret";
    state.providers = [{ key: "garmin", id: "prov-garmin" }];
    state.devicePairings = [
      {
        provider_id: "prov-garmin",
        external_athlete_id: "ext-1",
        user_id: "athlete-1",
        is_active: true,
      },
    ];
    state.consents = [{ user_id: "athlete-1", source: "garmin", state: "granted" }];
    state.wearableHealthUpserts = [];

    const mod = await import("../../netlify/functions/wearables-webhook.js");
    handler = mod.handler;
  });

  it("rejects an unknown provider", async () => {
    const response = await handler(
      makeEvent("nonsense", { externalAthleteId: "ext-1", readings: [] }),
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 503 when the webhook secret isn't configured", async () => {
    delete process.env.GARMIN_WEBHOOK_SECRET;
    const response = await handler(
      makeEvent("garmin", { externalAthleteId: "ext-1", readings: [] }),
      {},
    );
    expect(response.statusCode).toBe(503);
  });

  it("rejects a missing signature", async () => {
    const response = await handler(
      makeEvent("garmin", { externalAthleteId: "ext-1", readings: [] }, { signature: "" }),
      {},
    );
    expect(response.statusCode).toBe(400);
  });

  it("rejects a wrong signature", async () => {
    const response = await handler(
      makeEvent(
        "garmin",
        { externalAthleteId: "ext-1", readings: [] },
        { signature: "0".repeat(64) },
      ),
      {},
    );
    expect(response.statusCode).toBe(400);
  });

  it("ignores (200) a payload for an unpaired external athlete id", async () => {
    const response = await handler(
      makeEvent("garmin", {
        externalAthleteId: "no-such-athlete",
        readings: [{ metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" }],
      }),
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ignored).toBeTruthy();
    expect(state.wearableHealthUpserts).toHaveLength(0);
  });

  it("ignores (200) a payload when consent was revoked", async () => {
    state.consents = [{ user_id: "athlete-1", source: "garmin", state: "revoked" }];
    const response = await handler(
      makeEvent("garmin", {
        externalAthleteId: "ext-1",
        readings: [{ metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" }],
      }),
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ignored).toBeTruthy();
    expect(state.wearableHealthUpserts).toHaveLength(0);
  });

  it("resolves the pairing and ingests readings when everything checks out", async () => {
    const response = await handler(
      makeEvent("garmin", {
        externalAthleteId: "ext-1",
        readings: [{ metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" }],
      }),
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.acknowledged).toBe(true);
    expect(body.ingested).toBe(1);
    expect(state.wearableHealthUpserts).toHaveLength(1);
    expect(state.wearableHealthUpserts[0].user_id).toBe("athlete-1");
    expect(state.wearableHealthUpserts[0].source).toBe("garmin");
  });
});
