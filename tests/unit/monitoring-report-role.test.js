import { describe, it, expect } from "vitest";
import {
  lensForRoles,
  canSeeRawBloodwork,
} from "../../netlify/functions/monitoring-report.js";

// 2026-07-09 club-owner directive: physiotherapists AND coaches get the full
// clinical monitoring lens; other staff use their own lanes. lensForRoles is the
// pure mapping resolveRequesterRole applies to the caller's same-team roles.
describe("lensForRoles — team_members role → monitoring lens", () => {
  it("physiotherapist → full clinical lens", () => {
    expect(lensForRoles(new Set(["physiotherapist"]))).toBe("physio");
  });

  it("coach → full clinical lens (owner directive: coaches see all data)", () => {
    expect(lensForRoles(new Set(["coach"]))).toBe("physio");
  });

  it("nutritionist / psychologist / player → null (own lanes, not this report)", () => {
    expect(lensForRoles(new Set(["nutritionist"]))).toBeNull();
    expect(lensForRoles(new Set(["psychologist"]))).toBeNull();
    expect(lensForRoles(new Set(["player"]))).toBeNull();
  });

  it("empty role set → null (403)", () => {
    expect(lensForRoles(new Set())).toBeNull();
  });

  it("any full-clinical role wins in a mixed membership", () => {
    expect(lensForRoles(new Set(["nutritionist", "coach"]))).toBe("physio");
  });
});

// Raw bloodwork (GDPR special-category) is gated on the athlete's health-sharing
// consent for staff viewers; the athlete always sees their own.
describe("canSeeRawBloodwork — athlete-consent gate on raw bloodwork", () => {
  it("self always sees their own bloodwork, consent flag irrelevant", () => {
    expect(canSeeRawBloodwork("self", false)).toBe(true);
    expect(canSeeRawBloodwork("self", true)).toBe(true);
  });

  it("a staff viewer needs the athlete's health-sharing consent", () => {
    expect(canSeeRawBloodwork("physio", true)).toBe(true);
    expect(canSeeRawBloodwork("physio", false)).toBe(false);
  });

  it("no consent (undefined/null) → withheld for staff", () => {
    expect(canSeeRawBloodwork("physio", undefined)).toBe(false);
    expect(canSeeRawBloodwork("physio", null)).toBe(false);
  });
});
