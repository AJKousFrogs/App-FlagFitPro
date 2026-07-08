import { describe, it, expect } from "vitest";
import { ageFromDob } from "../../netlify/functions/utils/age.js";

/**
 * 2026-07-08 reusability-audit consolidation (F2): this trivial calculation had been
 * hand-copied into 8 files across the backend, one of them (privacy-settings.js,
 * fixed in this same change) missing the month/day correction — a real bug, since
 * that copy gated the GDPR/COPPA parental-consent check. These tests lock in the
 * correction so it can't silently regress again.
 */
describe("ageFromDob", () => {
  it("null/undefined/empty -> null (no fabrication)", () => {
    expect(ageFromDob(null)).toBeNull();
    expect(ageFromDob(undefined)).toBeNull();
    expect(ageFromDob("")).toBeNull();
  });

  it("unparseable date -> null", () => {
    expect(ageFromDob("not-a-date")).toBeNull();
  });

  it("the exact bug privacy-settings.js had: birthday NOT yet occurred this year", () => {
    // "now" is Jan 15; birth month is December -> the raw year-diff (the old bug)
    // would say 18, but the birthday hasn't happened yet this year -> really 17.
    const now = new Date("2026-01-15T12:00:00Z");
    expect(ageFromDob("2008-12-20", now)).toBe(17);
  });

  it("birthday already occurred this year -> plain year diff is correct", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(ageFromDob("2008-01-01", now)).toBe(18);
  });

  it("birthday is TODAY -> already counts the new age", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(ageFromDob("2008-07-15", now)).toBe(18);
  });

  it("a future/negative-age dob -> null, never a negative number", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(ageFromDob("2030-01-01", now)).toBeNull();
  });
});
