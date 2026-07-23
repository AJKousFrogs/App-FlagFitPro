// Wearable OAuth provider registry — one config object per vendor, the
// connect/callback endpoints are provider-agnostic (same interface pattern
// as utils/session-load-adapters.js: add a provider = add a config, never
// edit the endpoints).
//
// Endpoint URLs are DELIBERATELY not hardcoded. Vendor OAuth endpoints and
// exact field/scope names change over time (Garmin in particular has been
// migrating away from OAuth 1.0a) and must be verified against each
// vendor's current developer docs before go-live, not assumed from memory —
// getting this wrong silently breaks the whole flow. Every URL is read from
// an env var; a provider with no configured authorizeUrl/tokenUrl is
// reported as "not configured" rather than guessing a value.

const PROVIDERS = Object.freeze({
  garmin: {
    key: "garmin",
    displayName: "Garmin",
    authorizeUrlEnv: "GARMIN_OAUTH_AUTHORIZE_URL",
    tokenUrlEnv: "GARMIN_OAUTH_TOKEN_URL",
    profileUrlEnv: "GARMIN_OAUTH_PROFILE_URL",
    clientIdEnv: "GARMIN_CLIENT_ID",
    clientSecretEnv: "GARMIN_CLIENT_SECRET",
    scopes: [],
  },
  oura: {
    key: "oura",
    displayName: "Oura",
    authorizeUrlEnv: "OURA_OAUTH_AUTHORIZE_URL",
    tokenUrlEnv: "OURA_OAUTH_TOKEN_URL",
    profileUrlEnv: "OURA_OAUTH_PROFILE_URL",
    clientIdEnv: "OURA_CLIENT_ID",
    clientSecretEnv: "OURA_CLIENT_SECRET",
    scopes: ["daily", "heartrate", "workout"],
  },
  whoop: {
    key: "whoop",
    displayName: "WHOOP",
    authorizeUrlEnv: "WHOOP_OAUTH_AUTHORIZE_URL",
    tokenUrlEnv: "WHOOP_OAUTH_TOKEN_URL",
    profileUrlEnv: "WHOOP_OAUTH_PROFILE_URL",
    clientIdEnv: "WHOOP_CLIENT_ID",
    clientSecretEnv: "WHOOP_CLIENT_SECRET",
    scopes: ["read:recovery", "read:cycles", "read:sleep", "read:workout"],
  },
});

export function getWearableOAuthProvider(key) {
  return PROVIDERS[key] ?? null;
}

export function listWearableOAuthProviders() {
  return Object.keys(PROVIDERS);
}

/**
 * Resolve a provider's runtime config from env vars. Returns null (not a
 * throw) when anything required is unset, so callers can surface a clean
 * 503 "not yet available" rather than crash — same convention as
 * utils/stripe-client.js's resolvePriceId returning null.
 */
export function resolveProviderRuntimeConfig(providerKey) {
  const provider = getWearableOAuthProvider(providerKey);
  if (!provider) {
    return null;
  }
  const authorizeUrl = process.env[provider.authorizeUrlEnv];
  const tokenUrl = process.env[provider.tokenUrlEnv];
  const profileUrl = process.env[provider.profileUrlEnv];
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];

  if (!authorizeUrl || !tokenUrl || !clientId || !clientSecret) {
    return null;
  }

  return {
    ...provider,
    authorizeUrl,
    tokenUrl,
    profileUrl: profileUrl || null,
    clientId,
    clientSecret,
  };
}
