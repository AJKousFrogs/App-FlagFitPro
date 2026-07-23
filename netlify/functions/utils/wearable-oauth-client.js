// Thin wrapper around the actual vendor HTTP calls (token exchange, profile
// fetch) — kept separate from wearables-callback.js so tests can mock this
// module instead of hitting real network, same pattern as
// utils/stripe-client.js. Response field names are read tolerantly (a few
// common variants per field) since exact vendor response shapes must be
// verified against each vendor's current docs before go-live — this is not
// a guess at what's "correct", just resilience against the field naming
// this class of OAuth2 API commonly uses.

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return null;
}

/**
 * Standard OAuth2 authorization-code exchange (RFC 6749 §4.1.3) — the part
 * of this flow that IS specified, not vendor-specific.
 */
export async function exchangeCodeForTokens({
  tokenUrl,
  clientId,
  clientSecret,
  code,
  redirectUri,
}) {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `Token exchange failed (${response.status}): ${bodyText.slice(0, 200)}`,
    );
  }

  const body = await response.json();
  const accessToken = pick(body, "access_token", "accessToken");
  const refreshToken = pick(body, "refresh_token", "refreshToken");
  const expiresIn = pick(body, "expires_in", "expiresIn"); // seconds
  const scope = pick(body, "scope", "scopes");

  if (!accessToken) {
    throw new Error("Token exchange response had no access token");
  }

  return {
    accessToken,
    refreshToken: refreshToken ?? null,
    expiresInSeconds: expiresIn !== null ? Number(expiresIn) : null,
    scope: scope ?? null,
    // Some vendors embed the athlete's external user id directly in the
    // token response; if so, callers can skip the separate profile fetch.
    externalUserId: pick(body, "user_id", "userId", "athlete_id") ?? null,
  };
}

/**
 * Fetch the vendor's own user/athlete id for pairing — only called when the
 * token response didn't already include one.
 */
export async function fetchExternalAthleteId({ profileUrl, accessToken }) {
  if (!profileUrl) {
    return null;
  }
  const response = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Profile fetch failed (${response.status})`);
  }
  const body = await response.json();
  return pick(body, "user_id", "userId", "id", "athlete_id");
}
