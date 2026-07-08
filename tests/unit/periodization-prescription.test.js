import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/periodization-prescription.js";

const {
  resolveActiveRestrictions,
  resolveAgeYears,
  isTeamPractice,
  normalizeSeverity,
} = __test__;

/**
 * periodization-prescription.js is the server-side input-assembly for the ported
 * prescription engine (netlify/functions/utils/periodization-engine.js) — the
 * counterpart to periodization.service.ts's private readAcwr/readBodyweight/
 * readAgeYears/isTeamPractice helpers and InjuryService.restrictions(). These tests
 * lock in that the server-side re-derivation matches the client's logic exactly,
 * since a silent divergence here is exactly the class of bug this migration exists
 * to eliminate.
 */
describe("periodization-prescription: input-assembly helpers", () => {
  describe("normalizeSeverity", () => {
    it("maps clinical grades to the minor/moderate/severe vocab", () => {
      expect(normalizeSeverity("Grade 1")).toBe("minor");
      expect(normalizeSeverity("Grade 2")).toBe("moderate");
      expect(normalizeSeverity("Grade 3")).toBe("severe");
    });
    it("passes the legacy vocab through unchanged", () => {
      expect(normalizeSeverity("severe")).toBe("severe");
    });
    it("defaults unknown grades to minor (never fabricates a worse signal)", () => {
      expect(normalizeSeverity(null)).toBe("minor");
      expect(normalizeSeverity("unknown")).toBe("minor");
    });
  });

  describe("resolveActiveRestrictions", () => {
    it("no injuries -> null (matches the engine's null-safe 'no restriction' input)", () => {
      expect(resolveActiveRestrictions([])).toBeNull();
    });

    it("a sprint-restricting injury sets restrictsSprint only", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "hamstring",
          injury_grade: "Grade 2",
          activity_restrictions: ["sprint", "plyometric"],
        },
      ]);
      expect(result).toEqual({
        restrictsSprint: true,
        restrictsThrowing: false,
        regions: ["hamstring"],
        severity: "moderate",
      });
    });

    it("a throwing-restricting injury sets restrictsThrowing only", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "shoulder",
          injury_grade: "minor",
          activity_restrictions: ["throwing"],
        },
      ]);
      expect(result.restrictsSprint).toBe(false);
      expect(result.restrictsThrowing).toBe(true);
      expect(result.regions).toEqual(["shoulder"]);
    });

    it("an injury with no restricting activity types is ignored (no false-positive gate)", () => {
      // e.g. a logged injury with restrictions that don't map to sprint/throwing
      expect(
        resolveActiveRestrictions([
          {
            injury_location: "wrist",
            injury_grade: "minor",
            activity_restrictions: ["grip_strength"],
          },
        ]),
      ).toBeNull();
    });

    it("takes the WORST severity across multiple flagged injuries (never under-restricts)", () => {
      const result = resolveActiveRestrictions([
        {
          injury_location: "ankle",
          injury_grade: "minor",
          activity_restrictions: ["sprint"],
        },
        {
          injury_location: "hamstring",
          injury_grade: "severe",
          activity_restrictions: ["sprint"],
        },
      ]);
      expect(result.severity).toBe("severe");
      expect(result.regions).toEqual(["ankle", "hamstring"]);
    });
  });

  describe("resolveAgeYears", () => {
    it("null dob -> null (engine falls back to the 48h base CNS window)", () => {
      expect(resolveAgeYears(null)).toBeNull();
    });

    it("computes whole years, accounting for whether the birthday has passed this year", () => {
      const now = new Date();
      const turningAgeToday = new Date(now);
      turningAgeToday.setFullYear(now.getFullYear() - 30);
      expect(resolveAgeYears(turningAgeToday.toISOString())).toBe(30);
    });

    it("implausible ages (outside 16-80) return null rather than a fabricated value", () => {
      const veryOld = new Date();
      veryOld.setFullYear(veryOld.getFullYear() - 95);
      expect(resolveAgeYears(veryOld.toISOString())).toBeNull();
    });
  });

  describe("isTeamPractice", () => {
    it("matches a recurring weekday declared in settings", () => {
      const wednesday = new Date("2026-07-15T12:00:00Z"); // a Wednesday
      expect(isTeamPractice(wednesday, [wednesday.getDay()], [])).toBe(true);
    });

    it("matches a one-off schedule-declared training date even off the recurring days", () => {
      const date = new Date("2026-07-15T12:00:00Z");
      const iso = date.toISOString().slice(0, 10);
      expect(isTeamPractice(date, [], [iso])).toBe(true);
    });

    it("neither recurring nor one-off -> false", () => {
      const date = new Date("2026-07-15T12:00:00Z");
      expect(isTeamPractice(date, [], [])).toBe(false);
    });
  });
});
