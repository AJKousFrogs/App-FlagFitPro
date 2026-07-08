import { describe, it, expect } from "vitest";
import {
  deriveRestrictions,
  isTeamPractice,
  normalizeSeverity,
} from "./periodization-input-helpers";

/**
 * 2026-07-08 reusability audit F8: this module is now the ONE shared
 * implementation for isTeamPractice + injury-restriction resolution, consumed
 * by both periodization.service.ts/injury.service.ts (client) and
 * periodization-prescription.js (server, via the esbuild port). Consolidating
 * surfaced two real bugs the client's independent copy had — both locked in
 * here.
 */
describe("periodization-input-helpers", () => {
  describe("normalizeSeverity", () => {
    it("maps clinical Grade N to the minor/moderate/severe vocab", () => {
      expect(normalizeSeverity("Grade 1")).toBe("minor");
      expect(normalizeSeverity("Grade 2")).toBe("moderate");
      expect(normalizeSeverity("Grade 3")).toBe("severe");
    });
    it("passes the legacy vocab through unchanged", () => {
      expect(normalizeSeverity("severe")).toBe("severe");
    });
    it("unknown/missing -> minor (safe default, never fabricates worse)", () => {
      expect(normalizeSeverity(null)).toBe("minor");
      expect(normalizeSeverity(undefined)).toBe("minor");
      expect(normalizeSeverity("unrecognized")).toBe("minor");
    });
  });

  describe("deriveRestrictions — BUG FIX: Grade N severity ranking", () => {
    // Before this consolidation, InjuryService.SEV_RANK only recognized
    // "minor"/"moderate"/"severe" — a raw "Grade N" value (the documented live
    // clinical format athlete-injuries.js passes through unnormalized) never
    // matched any key, so SEV_RANK["Grade N"] was undefined, defaulting every
    // "Grade N" injury to the SAME rank regardless of N. A "Grade 3" (severe)
    // injury and a "Grade 1" (minor) one both computed the same rank, and the
    // literal string "Grade 3" leaked into activeRestrictions.severity, which
    // the engine only recognizes "minor"|"moderate"|"severe"|null for.
    it("a single Grade 3 injury is correctly classified as SEVERE, not minor", () => {
      const result = deriveRestrictions([
        {
          region: "hamstring",
          restrictionTypes: ["sprint"],
          severityGrade: "Grade 3",
        },
      ]);
      expect(result?.severity).toBe("severe");
    });

    it("a Grade 3 (clinical) injury outranks a legacy-vocab 'minor' injury", () => {
      const result = deriveRestrictions([
        {
          region: "ankle",
          restrictionTypes: ["sprint"],
          severityGrade: "minor",
        },
        {
          region: "hamstring",
          restrictionTypes: ["sprint"],
          severityGrade: "Grade 3",
        },
      ]);
      expect(result?.severity).toBe("severe");
    });

    it("Grade 1 correctly ranks below Grade 2 (not silently equal)", () => {
      const grade1Only = deriveRestrictions([
        { region: "a", restrictionTypes: ["sprint"], severityGrade: "Grade 1" },
      ]);
      const grade2Only = deriveRestrictions([
        { region: "a", restrictionTypes: ["sprint"], severityGrade: "Grade 2" },
      ]);
      expect(grade1Only?.severity).toBe("minor");
      expect(grade2Only?.severity).toBe("moderate");
    });
  });

  describe("deriveRestrictions — restriction-type gating (unchanged behavior)", () => {
    it("no injuries -> null", () => {
      expect(deriveRestrictions([])).toBeNull();
    });

    it("an injury with no sprint/throwing restriction types is ignored", () => {
      expect(
        deriveRestrictions([
          {
            region: "wrist",
            restrictionTypes: ["grip_strength"],
            severityGrade: "severe",
          },
        ]),
      ).toBeNull();
    });

    it("sprint-restricting injury sets restrictsSprint only", () => {
      const result = deriveRestrictions([
        {
          region: "hamstring",
          restrictionTypes: ["sprint", "plyometric"],
          severityGrade: "moderate",
        },
      ]);
      expect(result).toEqual({
        restrictsSprint: true,
        restrictsThrowing: false,
        regions: ["hamstring"],
        severity: "moderate",
      });
    });

    it("throwing-restricting injury sets restrictsThrowing only", () => {
      const result = deriveRestrictions([
        {
          region: "shoulder",
          restrictionTypes: ["throwing"],
          severityGrade: "minor",
        },
      ]);
      expect(result?.restrictsSprint).toBe(false);
      expect(result?.restrictsThrowing).toBe(true);
    });
  });

  describe("isTeamPractice — BUG FIX: UTC-consistent date key", () => {
    // Before this consolidation, the client built the one-off-date comparison
    // key from LOCAL getFullYear/getMonth/getDate, while scheduleTrainingDays
    // is built server-side from starts_at.slice(0,10) — a UTC calendar date.
    // Near local midnight in any non-UTC timezone the two could disagree.
    it("a date that is a different LOCAL day than its UTC day still matches the UTC-keyed training day", () => {
      // 2026-07-15T23:30:00-05:00 is LOCAL July 15, but UTC July 16 04:30.
      const lateLocalEvening = new Date("2026-07-15T23:30:00-05:00");
      expect(isTeamPractice(lateLocalEvening, [], ["2026-07-16"])).toBe(true);
    });

    it("matches a recurring weekday (local calendar concept, unaffected by the UTC fix)", () => {
      const date = new Date("2026-07-15T12:00:00Z");
      expect(isTeamPractice(date, [date.getDay()], [])).toBe(true);
    });

    it("neither recurring nor one-off -> false", () => {
      expect(isTeamPractice(new Date("2026-07-15T12:00:00Z"), [], [])).toBe(
        false,
      );
    });
  });
});
