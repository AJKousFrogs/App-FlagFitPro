import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOAuthState,
  verifyOAuthState,
} from "../../netlify/functions/utils/wearable-oauth-state.js";

describe("wearable-oauth-state", () => {
  beforeEach(() => {
    process.env.WEARABLE_OAUTH_STATE_SECRET = "test-secret";
  });

  it("round-trips a valid state for the right provider", () => {
    const state = createOAuthState("user-1", "garmin");
    const result = verifyOAuthState(state, "garmin");
    expect(result).toEqual({ ok: true, userId: "user-1", provider: "garmin" });
  });

  it("rejects a state checked against the wrong provider", () => {
    const state = createOAuthState("user-1", "garmin");
    const result = verifyOAuthState(state, "oura");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("provider mismatch");
  });

  it("rejects a tampered signature", () => {
    const state = createOAuthState("user-1", "garmin");
    const [payload] = state.split(".");
    const tampered = `${payload}.not-the-real-signature`;
    const result = verifyOAuthState(tampered, "garmin");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signature mismatch");
  });

  it("rejects a state signed with a different secret", () => {
    const state = createOAuthState("user-1", "garmin");
    process.env.WEARABLE_OAUTH_STATE_SECRET = "a-different-secret";
    const result = verifyOAuthState(state, "garmin");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("signature mismatch");
  });

  it("rejects an expired state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const state = createOAuthState("user-1", "garmin");
    vi.setSystemTime(new Date("2026-01-01T00:11:00.000Z")); // +11 minutes
    const result = verifyOAuthState(state, "garmin");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
    vi.useRealTimers();
  });

  it("rejects a malformed state string", () => {
    const result = verifyOAuthState("not-a-real-state", "garmin");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("malformed state");
  });
});
