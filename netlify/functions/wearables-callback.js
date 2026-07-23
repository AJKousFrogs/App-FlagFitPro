import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { resolveProviderRuntimeConfig } from "./utils/wearable-oauth-providers.js";
import { verifyOAuthState } from "./utils/wearable-oauth-state.js";
import {
  exchangeCodeForTokens,
  fetchExternalAthleteId,
} from "./utils/wearable-oauth-client.js";
import { encryptToken } from "./utils/token-crypto.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.wearables-callback" });

/**
 * Wearable OAuth Callback
 * GET /api/wearables/callback/:provider
 *
 * The vendor redirects the athlete's browser back here after consent.
 * requireAuth: false — trust comes from the signed `state` param (proves
 * who started the flow and when), not a bearer token, same principle as
 * the Stripe webhook trusting Stripe's signature instead of a session.
 * See docs/gps_wearable_csv_import_proposal.md §2.
 */

function baseUrl() {
  return process.env.URL || process.env.DEPLOY_PRIME_URL || "";
}

async function upsertPairing(
  supabase,
  { userId, providerId, externalAthleteId, tokens },
) {
  const row = {
    user_id: userId,
    provider_id: providerId,
    external_athlete_id: externalAthleteId,
    is_active: true,
    access_token_encrypted: encryptToken(tokens.accessToken),
    refresh_token_encrypted: tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null,
    token_expires_at:
      tokens.expiresInSeconds !== null
        ? new Date(Date.now() + tokens.expiresInSeconds * 1000).toISOString()
        : null,
    scopes: tokens.scope
      ? String(tokens.scope).split(/[ ,]+/).filter(Boolean)
      : null,
  };

  if (externalAthleteId) {
    // NULL external_athlete_id can't rely on ON CONFLICT (Postgres never
    // treats two NULLs as equal in a unique index), so that path is handled
    // separately below via an explicit existing-row lookup.
    return supabase
      .from("device_pairings")
      .upsert(row, { onConflict: "user_id,provider_id,external_athlete_id" });
  }

  const { data: existing } = await supabase
    .from("device_pairings")
    .select("id")
    .eq("user_id", userId)
    .eq("provider_id", providerId)
    .is("external_athlete_id", null)
    .maybeSingle();

  if (existing?.id) {
    return supabase.from("device_pairings").update(row).eq("id", existing.id);
  }
  return supabase.from("device_pairings").insert(row);
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables-callback",
    allowedMethods: ["GET"],
    rateLimitType: "DEFAULT",
    requireAuth: false,
    handler: async (evt) => {
      const requestLogger = logger.child(buildRequestLogContext(evt));
      const match = evt.path?.match(/\/wearables\/callback\/([^/?]+)/);
      const providerKey = match?.[1];
      const { code, state, error: vendorError } = evt.queryStringParameters || {};

      if (vendorError) {
        return createErrorResponse(
          `Vendor denied authorization: ${vendorError}`,
          400,
          "oauth_denied",
        );
      }
      if (!code || !state) {
        return createErrorResponse(
          "code and state are required",
          422,
          "validation_error",
        );
      }

      const verified = verifyOAuthState(state, providerKey);
      if (!verified.ok) {
        requestLogger.warn("wearable_oauth_state_invalid", {
          reason: verified.reason,
        });
        return createErrorResponse(
          "Invalid or expired OAuth state",
          400,
          "invalid_state",
        );
      }

      const runtime = resolveProviderRuntimeConfig(providerKey);
      if (!runtime) {
        return createErrorResponse(
          `${providerKey} is not yet configured for OAuth connect`,
          503,
          "provider_not_configured",
        );
      }

      const { data: providerRow } = await supabaseAdmin
        .from("monitoring_providers")
        .select("id")
        .eq("key", providerKey)
        .maybeSingle();
      if (!providerRow?.id) {
        return createErrorResponse(
          `Unknown provider '${providerKey}'`,
          422,
          "unsupported_provider",
        );
      }

      let tokens;
      try {
        tokens = await exchangeCodeForTokens({
          tokenUrl: runtime.tokenUrl,
          clientId: runtime.clientId,
          clientSecret: runtime.clientSecret,
          code,
          redirectUri: `${baseUrl()}/api/wearables/callback/${providerKey}`,
        });
      } catch (err) {
        requestLogger.error("wearable_oauth_token_exchange_failed", {
          error: err.message,
        });
        return createErrorResponse(
          "Failed to complete wearable connection",
          502,
          "token_exchange_failed",
        );
      }

      let externalAthleteId = tokens.externalUserId;
      if (!externalAthleteId && runtime.profileUrl) {
        try {
          externalAthleteId = await fetchExternalAthleteId({
            profileUrl: runtime.profileUrl,
            accessToken: tokens.accessToken,
          });
        } catch (err) {
          requestLogger.warn("wearable_oauth_profile_fetch_failed", {
            error: err.message,
          });
          // Non-fatal — the pairing is still anchored on user_id.
        }
      }

      const { error: pairingError } = await upsertPairing(supabaseAdmin, {
        userId: verified.userId,
        providerId: providerRow.id,
        externalAthleteId,
        tokens,
      });
      if (pairingError) {
        requestLogger.error("wearable_pairing_upsert_failed", {
          error: pairingError.message,
        });
        return createErrorResponse(
          "Failed to save wearable connection",
          500,
          "database_error",
        );
      }

      return {
        statusCode: 302,
        headers: { Location: `${baseUrl()}/device-data?connected=${providerKey}` },
        body: "",
      };
    },
  });

export const testHandler = handler;
export { handler };
