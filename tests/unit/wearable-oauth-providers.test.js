import { beforeEach, describe, expect, it } from "vitest";
import {
  getWearableOAuthProvider,
  listWearableOAuthProviders,
  resolveProviderRuntimeConfig,
} from "../../netlify/functions/utils/wearable-oauth-providers.js";

const GARMIN_ENV_KEYS = [
  "GARMIN_OAUTH_AUTHORIZE_URL",
  "GARMIN_OAUTH_TOKEN_URL",
  "GARMIN_OAUTH_PROFILE_URL",
  "GARMIN_CLIENT_ID",
  "GARMIN_CLIENT_SECRET",
];

describe("wearable-oauth-providers", () => {
  beforeEach(() => {
    for (const key of GARMIN_ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("lists garmin, oura, and whoop", () => {
    expect(listWearableOAuthProviders()).toEqual(
      expect.arrayContaining(["garmin", "oura", "whoop"]),
    );
  });

  it("returns null for an unknown provider key", () => {
    expect(getWearableOAuthProvider("nonsense")).toBeNull();
  });

  it("resolveProviderRuntimeConfig returns null when nothing is configured", () => {
    expect(resolveProviderRuntimeConfig("garmin")).toBeNull();
  });

  it("resolveProviderRuntimeConfig returns null when only some vars are set", () => {
    process.env.GARMIN_CLIENT_ID = "abc";
    expect(resolveProviderRuntimeConfig("garmin")).toBeNull();
  });

  it("resolveProviderRuntimeConfig returns full config once everything required is set", () => {
    process.env.GARMIN_OAUTH_AUTHORIZE_URL = "https://example.com/authorize";
    process.env.GARMIN_OAUTH_TOKEN_URL = "https://example.com/token";
    process.env.GARMIN_CLIENT_ID = "client-abc";
    process.env.GARMIN_CLIENT_SECRET = "secret-xyz";

    const config = resolveProviderRuntimeConfig("garmin");
    expect(config).toMatchObject({
      key: "garmin",
      authorizeUrl: "https://example.com/authorize",
      tokenUrl: "https://example.com/token",
      clientId: "client-abc",
      clientSecret: "secret-xyz",
      profileUrl: null,
    });
  });
});
