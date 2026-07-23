import { supabaseAdmin } from "./supabase-client.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  getWearableOAuthProvider,
  listWearableOAuthProviders,
  resolveProviderRuntimeConfig,
} from "./utils/wearable-oauth-providers.js";
import { createOAuthState } from "./utils/wearable-oauth-state.js";

/**
 * Wearable OAuth Connect
 * GET /api/wearables/connect/:provider
 *
 * Returns the vendor's OAuth consent-screen URL for the frontend to navigate
 * to. This can't be a raw 302 -- the caller is authenticated via a Bearer
 * token attached by an HTTP interceptor, which a plain top-level browser
 * navigation (<a href>) can't carry. Mirrors the stripe-checkout.js /
 * stripe-portal.js pattern: authenticated XHR returns a URL, the frontend
 * does `window.location.href = url` itself.
 * See docs/gps_wearable_csv_import_proposal.md §2.
 */

function baseUrl() {
  return process.env.URL || process.env.DEPLOY_PRIME_URL || "";
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wearables-connect",
    allowedMethods: ["GET"],
    rateLimitType: "DEFAULT",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      const match = evt.path?.match(/\/wearables\/connect\/([^/?]+)/);
      const providerKey = match?.[1];

      if (!providerKey || !getWearableOAuthProvider(providerKey)) {
        return createErrorResponse(
          `Unknown provider '${providerKey}'. Known: ${listWearableOAuthProviders().join(", ")}`,
          422,
          "unsupported_provider",
        );
      }

      const { data: providerRow } = await supabaseAdmin
        .from("monitoring_providers")
        .select("id, kind, is_active")
        .eq("key", providerKey)
        .maybeSingle();

      if (
        !providerRow?.is_active ||
        !["wearable", "both"].includes(providerRow.kind)
      ) {
        return createErrorResponse(
          `'${providerKey}' is not an active wearable provider`,
          422,
          "unsupported_provider",
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

      let state;
      try {
        state = createOAuthState(userId, providerKey);
      } catch (err) {
        return createErrorResponse(err.message, 503, "not_configured");
      }

      const redirectUri = `${baseUrl()}/api/wearables/callback/${providerKey}`;
      const authorizeUrl = new URL(runtime.authorizeUrl);
      authorizeUrl.searchParams.set("client_id", runtime.clientId);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("state", state);
      if (runtime.scopes.length) {
        authorizeUrl.searchParams.set("scope", runtime.scopes.join(" "));
      }

      return createSuccessResponse({ authorizeUrl: authorizeUrl.toString() });
    },
  });

export const testHandler = handler;
export { handler };
