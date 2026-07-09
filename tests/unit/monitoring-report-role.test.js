import { describe, it, expect } from "vitest";
import { lensForRoles } from "../../netlify/functions/monitoring-report.js";

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
