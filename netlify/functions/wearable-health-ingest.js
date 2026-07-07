import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Wearable-health Ingest
// Endpoint: /api/wearable-health-ingest
//
// Separate path for consumer devices (Apple HealthKit / Android Health Connect /
// WHOOP / Oura). Athletes ingest their OWN device data (self-scoped).
//   PUT  { source, state:'granted'|'revoked' }  -> record/withdraw opt-in consent
//   POST { source, sourceDevice, readings[] }   -> ingest, GATED on granted consent
//
// - Ingestion is BLOCKED unless a 'granted' wearable_consent row exists; revoking
//   consent stops further ingestion (proven).
// - Every reading stores source + source_device; readings are NEVER merged across
//   brands (HRV/sleep from different devices are not comparable).
// - Idempotent on (user_id, source, metric, recorded_at).

const isNil = (x) => x === null || x === undefined;
const num = (v) => (isNil(v) || v === "" ? null : Number(v));

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "wearable-health-ingest",
    allowedMethods: ["POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      let body;
      try {
        body = parseJsonObjectBody(evt.body);
      } catch (_e) {
        return createErrorResponse(
          "Request body must be a JSON object",
          422,
          "validation_error",
        );
      }
      const source = typeof body.source === "string" ? body.source.trim() : "";
      if (!source) {
        return createErrorResponse(
          "source is required",
          422,
          "validation_error",
        );
      }

      try {
        // ── consent management (PUT) ──────────────────────────────────────
        if (evt.httpMethod === "PUT") {
          const state = body.state === "revoked" ? "revoked" : "granted";
          const now = new Date().toISOString();
          const { error } = await supabaseAdmin.from("wearable_consent").upsert(
            {
              user_id: userId,
              source,
              state,
              granted_at: state === "granted" ? now : null,
              revoked_at: state === "revoked" ? now : null,
              updated_at: now,
            },
            { onConflict: "user_id,source" },
          );
          if (error) {
            throw error;
          }
          return createSuccessResponse(
            { source, state },
            200,
            `Consent ${state}`,
          );
        }

        // ── ingest (POST) — GATED on recorded opt-in consent ──────────────
        const { data: consent } = await supabaseAdmin
          .from("wearable_consent")
          .select("state")
          .eq("user_id", userId)
          .eq("source", source)
          .maybeSingle();
        if (!consent || consent.state !== "granted") {
          // Blocked: no opt-in on record (or revoked). Ingestion does not proceed.
          return createErrorResponse(
            `Ingestion blocked: no granted consent for '${source}'`,
            403,
            "consent_required",
          );
        }

        const readings = Array.isArray(body.readings) ? body.readings : null;
        if (!readings) {
          return createErrorResponse(
            "readings[] is required",
            422,
            "validation_error",
          );
        }
        const sourceDevice = body.sourceDevice
          ? String(body.sourceDevice).slice(0, 80)
          : null;

        const failed = [];
        const rows = [];
        readings.forEach((r, index) => {
          const metric = typeof r.metric === "string" ? r.metric : null;
          const recordedAt = r.recordedAt ?? r.recorded_at;
          if (!metric || isNil(recordedAt)) {
            failed.push({
              index,
              reason: "metric and recordedAt are required",
            });
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
          const { data, error } = await supabaseAdmin
            .from("wearable_health")
            .upsert(rows, { onConflict: "user_id,source,metric,recorded_at" })
            .select("id");
          if (error) {
            throw error;
          }
          ingested = data?.length ?? rows.length;
        }

        const partial = failed.length > 0;
        return createSuccessResponse(
          {
            source,
            sourceDevice,
            received: readings.length,
            ingested,
            failedCount: failed.length,
            failed,
            partial,
            idempotentKey: "user_id,source,metric,recorded_at",
          },
          200,
          partial
            ? "Ingest completed with surfaced failures"
            : "Ingest complete",
        );
      } catch (error) {
        return createErrorResponse(
          `Wearable ingest error: ${error?.message ?? "unknown"}`,
          500,
          "ingest_failed",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
