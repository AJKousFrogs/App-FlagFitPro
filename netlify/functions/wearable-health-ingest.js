import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { ingestWearableReadings } from "./utils/wearable-health-ingest-core.js";

// Netlify Function: Wearable-health Ingest
// Endpoint: /api/wearable-health-ingest
//
// Separate path for consumer devices (Apple HealthKit / Android Health Connect /
// WHOOP / Oura). Athletes ingest their OWN device data (self-scoped).
//   PUT  { source, state:'granted'|'revoked' }  -> record/withdraw opt-in consent
//   POST { source, sourceDevice, readings[] }   -> ingest, GATED on granted consent
//
// The POST path delegates to utils/wearable-health-ingest-core.js, shared with
// wearables-webhook.js's vendor-push path — same consent gate, same idempotent
// upsert, so the two entry points can't drift (CLAUDE.md §4).
//
// - Ingestion is BLOCKED unless a 'granted' wearable_consent row exists; revoking
//   consent stops further ingestion (proven).
// - Every reading stores source + source_device; readings are NEVER merged across
//   brands (HRV/sleep from different devices are not comparable).
// - Idempotent on (user_id, source, metric, recorded_at).

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "wearable-health-ingest",
    allowedMethods: ["POST", "PUT"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;
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

        const result = await ingestWearableReadings(
          supabaseAdmin,
          userId,
          source,
          readings,
          sourceDevice,
        );
        if (!result.ok) {
          const status = result.code === "consent_required" ? 403 : 500;
          return createErrorResponse(result.message, status, result.code);
        }

        return createSuccessResponse(
          result.data,
          200,
          result.data.partial
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
