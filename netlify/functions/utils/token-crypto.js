import crypto from "node:crypto";

// Envelope encryption for wearable OAuth tokens (device_pairings.
// access_token_encrypted / refresh_token_encrypted) — AES-256-GCM, key from
// WEARABLE_TOKEN_ENCRYPTION_KEY. Never store a raw vendor token.
//
// Key format: 32 bytes, base64-encoded (e.g. `openssl rand -base64 32`).
// Lazy-loaded like utils/stripe-client.js's getStripeClient() — throws a
// friendly, caught-and-503'd error rather than crashing at import time when
// unset, so the rest of the app works fine before this is configured.

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV, the GCM-recommended size

function loadKey() {
  const raw = process.env.WEARABLE_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "WEARABLE_TOKEN_ENCRYPTION_KEY is not configured — wearable OAuth token storage is not yet available",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "WEARABLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64-encoded AES-256 key)",
    );
  }
  return key;
}

/**
 * Encrypt a plaintext token. Returns a single base64 string encoding
 * iv || authTag || ciphertext, safe to store directly in a text column.
 */
export function encryptToken(plaintext) {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/**
 * Decrypt a value produced by encryptToken(). Throws if the ciphertext was
 * tampered with (GCM auth tag mismatch) rather than silently returning
 * corrupted data.
 */
export function decryptToken(encoded) {
  const key = loadKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_BYTES);
  const authTag = buf.subarray(IV_BYTES, IV_BYTES + 16);
  const ciphertext = buf.subarray(IV_BYTES + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

/** Whether encryption is configured at all — lets callers 503 cleanly. */
export function isTokenCryptoConfigured() {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}
