import crypto from "node:crypto";
import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getWearableOAuthProvider } from "./utils/wearable-oauth-providers.js";
import { ingestWearableReadings } from "./utils/wearable-health-ingest-core.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.wearables-webhook" });

/**
 * Wearable Webhook Receiver
 * POST /api/wearables/webhook/:provider (no auth — verified by an HMAC
 * signature header, same principle as the Stripe webhook)
 *
 * IMPORTANT — this endpoint's request-body CONTRACT is a placeholder, not a
 * verified vendor spec: Garmin/Oura/WHOOP's real push-notification payload
 * shapes (and in Garmin's case, whether the push carries the reading at all
 * vs. just a "new data available, go fetch it" ping) must be checked against
 * each vendor's current webhook docs before go-live and this file adjusted
 * to match. Building against a guessed shape with false confidence would be
 * worse than flagging it — see docs/gps_wearable_csv_import_proposal.md §2.
 * What IS solid and real regardless of the exact vendor shape: signature
 * verification, external-athlete-id -> user_id resolution via
 * device_pairings, and delegating to the same consent-respecting ingest
 * core wearable-health-ingest.js uses (CLAUDE.md §4).
 *
 * Expected body (placeholder contract): { externalAthleteId, readings: [{
 *   metric, value, unit, recordedAt }, ...] }
 */

function verifySignature(providerKey, rawBody, signatureHeader) {
  const secret = process.env[`${providerKey.toUpperCase()}_WEBHOOK_SECRET`];
  if (!secret) {
    return { ok: false, reason: "not_configured" };
  }
  if (!signatureHeader) {
    return { ok: false, reason: "missing_signature" };
  }
  const provided = signatureHeader.replace(/^sha256=/, "");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const providedBuf = Buffer.from(provided, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables-webhook",
    allowedMethods: ["POST"],
    rateLimitType: "DEFAULT",
    requireAuth: false,
    handler: async (evt) => {
      const requestLogger = logger.child(buildRequestLogContext(evt));
      const match = evt.path?.match(/\/wearables\/webhook\/([^/?]+)/);
      const providerKey = match?.[1];

      if (!providerKey || !getWearableOAuthProvider(providerKey)) {
        return createErrorResponse(
          `Unknown provider '${providerKey}'`,
          422,
          "unsupported_provider",
        );
      }

      const rawBody = evt.body || "";
      const signatureHeader =
        evt.headers?.["x-webhook-signature"] ||
        evt.headers?.["X-Webhook-Signature"];
      const verified = verifySignature(providerKey, rawBody, signatureHeader);
      if (!verified.ok) {
        if (verified.reason === "not_configured") {
          return createErrorResponse(
            `${providerKey} webhook is not yet configured`,
            503,
            "provider_not_configured",
          );
        }
        requestLogger.warn("wearable_webhook_signature_invalid", {
          reason: verified.reason,
        });
        return createErrorResponse(
          "Invalid webhook signature",
          400,
          "invalid_signature",
        );
      }

      let body;
      try {
        body = JSON.parse(rawBody);
      } catch {
        return createErrorResponse(
          "Invalid JSON body",
          400,
          "validation_error",
        );
      }

      const externalAthleteId = body?.externalAthleteId;
      const readings = Array.isArray(body?.readings) ? body.readings : null;
      if (!externalAthleteId || !readings) {
        return createErrorResponse(
          "externalAthleteId and readings[] are required",
          422,
          "validation_error",
        );
      }

      const { data: providerRow } = await supabaseAdmin
        .from("monitoring_providers")
        .select("id")
        .eq("key", providerKey)
        .maybeSingle();

      const { data: pairing } = providerRow
        ? await supabaseAdmin
            .from("device_pairings")
            .select("user_id")
            .eq("provider_id", providerRow.id)
            .eq("external_athlete_id", String(externalAthleteId))
            .eq("is_active", true)
            .maybeSingle()
        : { data: null };

      if (!pairing?.user_id) {
        requestLogger.warn("wearable_webhook_unknown_pairing", {
          provider: providerKey,
        });
        // 200, not an error: an unpaired/unknown external id from the
        // vendor's own webhook isn't a caller mistake to retry — discard
        // quietly rather than have the vendor keep redelivering forever.
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acknowledged: true, ignored: "no active pairing" }),
        };
      }

      const result = await ingestWearableReadings(
        supabaseAdmin,
        pairing.user_id,
        providerKey,
        readings,
        null,
      );
      if (!result.ok) {
        if (result.code === "consent_required") {
          // Consent was revoked after pairing — discard, don't error the
          // vendor into a redelivery loop for something that will never
          // succeed until the athlete re-grants consent.
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acknowledged: true, ignored: result.message }),
          };
        }
        requestLogger.error("wearable_webhook_ingest_failed", {
          error: result.message,
        });
        return createErrorResponse(result.message, 500, result.code);
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: true, ...result.data }),
      };
    },
  });

export const testHandler = handler;
export { handler };
