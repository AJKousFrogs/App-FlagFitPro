import crypto from "node:crypto";

// Signed, stateless OAuth "state" parameter — HMAC-SHA256 over
// {userId, provider, nonce, iat}, verified on the callback. Avoids a new
// state-storage table: the state param itself IS the proof of who started
// the flow and when, the same trust model a server-side session would give
// but without needing to persist anything mid-flow.

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the vendor consent screen

function loadSecret() {
  const secret = process.env.WEARABLE_OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error(
      "WEARABLE_OAUTH_STATE_SECRET is not configured — wearable OAuth connect is not yet available",
    );
  }
  return secret;
}

function sign(payloadB64) {
  return crypto
    .createHmac("sha256", loadSecret())
    .update(payloadB64)
    .digest("base64url");
}

/** Build a signed state string to hand the vendor's authorize URL. */
export function createOAuthState(userId, provider) {
  const payload = {
    userId,
    provider,
    nonce: crypto.randomBytes(9).toString("base64url"),
    iat: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a state string returned by the vendor on callback.
 * @returns {{ok: true, userId: string, provider: string} | {ok: false, reason: string}}
 */
export function verifyOAuthState(state, expectedProvider) {
  if (typeof state !== "string" || !state.includes(".")) {
    return { ok: false, reason: "malformed state" };
  }
  const [payloadB64, signature] = state.split(".");
  const expectedSignature = sign(payloadB64);
  const sigBuf = Buffer.from(signature ?? "");
  const expectedBuf = Buffer.from(expectedSignature);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { ok: false, reason: "signature mismatch" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed payload" };
  }

  if (Date.now() - payload.iat > STATE_TTL_MS) {
    return { ok: false, reason: "expired" };
  }
  if (payload.provider !== expectedProvider) {
    return { ok: false, reason: "provider mismatch" };
  }
  if (!payload.userId) {
    return { ok: false, reason: "missing userId" };
  }

  return { ok: true, userId: payload.userId, provider: payload.provider };
}
