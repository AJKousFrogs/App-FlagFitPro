import { beforeEach, describe, expect, it } from "vitest";
import {
  encryptToken,
  decryptToken,
  isTokenCryptoConfigured,
} from "../../netlify/functions/utils/token-crypto.js";

describe("token-crypto", () => {
  beforeEach(() => {
    process.env.WEARABLE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64",
    );
  });

  it("round-trips a plaintext token", () => {
    const encrypted = encryptToken("super-secret-access-token");
    expect(encrypted).not.toContain("super-secret-access-token");
    expect(decryptToken(encrypted)).toBe("super-secret-access-token");
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptToken("same-token");
    const b = encryptToken("same-token");
    expect(a).not.toBe(b);
  });

  it("throws on tampered ciphertext rather than returning corrupted data", () => {
    const encrypted = encryptToken("token-value");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip a bit in the ciphertext
    expect(() => decryptToken(buf.toString("base64"))).toThrow();
  });

  it("reports unconfigured when the key env var is missing", () => {
    delete process.env.WEARABLE_TOKEN_ENCRYPTION_KEY;
    expect(isTokenCryptoConfigured()).toBe(false);
    expect(() => encryptToken("x")).toThrow(/not configured/);
  });

  it("reports unconfigured when the key isn't 32 bytes", () => {
    process.env.WEARABLE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(16).toString(
      "base64",
    );
    expect(isTokenCryptoConfigured()).toBe(false);
  });
});
