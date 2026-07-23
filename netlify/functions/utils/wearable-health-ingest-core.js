// Shared core for BOTH wearable-health ingest entry points: the athlete's own
// authenticated self-service ingest (wearable-health-ingest.js) and the
// vendor webhook push (wearables-webhook.js, no user session — resolves
// userId from device_pairings first). Single source of truth for the
// consent gate and the idempotent upsert, so the two entry points can't
// drift (CLAUDE.md §4).

const isNil = (x) => x === null || x === undefined;
const num = (v) => (isNil(v) || v === "" ? null : Number(v));

/**
 * @returns {Promise<{ok: true, data: object} | {ok: false, code: string, message: string}>}
 */
export async function ingestWearableReadings(
  supabase,
  userId,
  source,
  readings,
  sourceDevice = null,
) {
  const { data: consent } = await supabase
    .from("wearable_consent")
    .select("state")
    .eq("user_id", userId)
    .eq("source", source)
    .maybeSingle();
  if (!consent || consent.state !== "granted") {
    // Blocked: no opt-in on record (or revoked). Ingestion does not proceed —
    // this is exactly as true for a vendor webhook as for self-service
    // ingest; a webhook arriving for a user who revoked consent must be
    // discarded, not silently written.
    return {
      ok: false,
      code: "consent_required",
      message: `Ingestion blocked: no granted consent for '${source}'`,
    };
  }

  const failed = [];
  const rows = [];
  readings.forEach((r, index) => {
    const metric = typeof r.metric === "string" ? r.metric : null;
    const recordedAt = r.recordedAt ?? r.recorded_at;
    if (!metric || isNil(recordedAt)) {
      failed.push({ index, reason: "metric and recordedAt are required" });
      return;
    }
    rows.push({
      user_id: userId,
      source, // brand kept per reading — never cross-brand merged
      source_device: sourceDevice,
      metric,
      value: num(r.value),
      unit: r.unit ? String(r.unit).slice(0, 20) : null,
      recorded_at: recordedAt,
      consent_state: "granted",
    });
  });

  let ingested = 0;
  if (rows.length) {
    // Idempotent on (user_id, source, metric, recorded_at).
    const { data, error } = await supabase
      .from("wearable_health")
      .upsert(rows, { onConflict: "user_id,source,metric,recorded_at" })
      .select("id");
    if (error) {
      return {
        ok: false,
        code: "ingest_failed",
        message: `Wearable ingest error: ${error.message}`,
      };
    }
    ingested = data?.length ?? rows.length;
  }

  const partial = failed.length > 0;
  return {
    ok: true,
    data: {
      source,
      sourceDevice,
      received: readings.length,
      ingested,
      failedCount: failed.length,
      failed,
      partial,
      idempotentKey: "user_id,source,metric,recorded_at",
    },
  };
}
