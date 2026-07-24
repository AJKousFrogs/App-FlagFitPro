import { describe, it, expect } from "vitest";
import { ingestWearableReadings } from "../../netlify/functions/utils/wearable-health-ingest-core.js";

function fakeSupabase({ consent, upsertError = null }) {
  const upserted = [];
  return {
    upserted,
    client: {
      from(table) {
        const query = {
          select() {
            return query;
          },
          eq() {
            return query;
          },
          upsert(payload) {
            upserted.push(...payload);
            return query;
          },
          maybeSingle: () => {
            if (table === "wearable_consent") {
              return Promise.resolve({ data: consent, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
          then: (resolve, reject) => {
            if (table === "wearable_health") {
              if (upsertError) {
                return Promise.resolve({ data: null, error: upsertError }).then(
                  resolve,
                  reject,
                );
              }
              return Promise.resolve({
                data: upserted.map((_, i) => ({ id: `row-${i}` })),
                error: null,
              }).then(resolve, reject);
            }
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          },
        };
        return query;
      },
    },
  };
}

describe("ingestWearableReadings", () => {
  it("blocks ingestion when consent is not granted", async () => {
    const { client } = fakeSupabase({ consent: null });
    const result = await ingestWearableReadings(client, "user-1", "oura", []);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("consent_required");
  });

  it("blocks ingestion when consent was revoked", async () => {
    const { client } = fakeSupabase({ consent: { state: "revoked" } });
    const result = await ingestWearableReadings(client, "user-1", "oura", []);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("consent_required");
  });

  it("ingests valid readings and surfaces invalid ones in failed[]", async () => {
    const { client, upserted } = fakeSupabase({ consent: { state: "granted" } });
    const result = await ingestWearableReadings(client, "user-1", "oura", [
      { metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" },
      { value: 10 }, // missing metric AND recordedAt
    ]);
    expect(result.ok).toBe(true);
    expect(result.data.ingested).toBe(1);
    expect(result.data.failedCount).toBe(1);
    expect(result.data.partial).toBe(true);
    expect(upserted).toHaveLength(1);
    expect(upserted[0].user_id).toBe("user-1");
    expect(upserted[0].source).toBe("oura");
  });

  it("never keeps NEVER cross-brand-merges: source is always stamped from the caller's provider", async () => {
    const { client, upserted } = fakeSupabase({ consent: { state: "granted" } });
    await ingestWearableReadings(client, "user-1", "whoop", [
      { metric: "sleep", value: 7.5, recordedAt: "2026-07-20T00:00:00Z" },
    ]);
    expect(upserted[0].source).toBe("whoop");
  });

  it("surfaces a DB error rather than reporting a partial success as done", async () => {
    const { client } = fakeSupabase({
      consent: { state: "granted" },
      upsertError: { message: "db exploded" },
    });
    const result = await ingestWearableReadings(client, "user-1", "oura", [
      { metric: "hrv", value: 55, recordedAt: "2026-07-20T00:00:00Z" },
    ]);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("ingest_failed");
  });
});
