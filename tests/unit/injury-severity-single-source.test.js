import { describe, it, expect } from "vitest";
import { injuriesPainLevel } from "../../netlify/functions/utils/active-injuries.js";
import { normalizeSeverity } from "../../netlify/functions/utils/periodization-input-helpers.js";

/**
 * 2026-07-08 consistency audit C1: the grade→severity-tier classification used
 * to live in THREE independent copies — normalizeSeverity (periodization engine,
 * F8 canonical), active-injuries.js injuriesPainLevel (its own Grade-N/legacy
 * rank map), and calc-readiness.js (inline `=== "severe" || "Grade 3"`). This
 * locks in that injuriesPainLevel now routes through the one canonical
 * classifier, with byte-identical results to the old private map (a real
 * safety property: injury grade drives RTP sizing and the readiness penalty).
 */
describe("injury-severity single source (audit C1)", () => {
  // The pain-level domain map injuriesPainLevel still owns: tier -> 2..4.
  const EXPECTED_PAIN_BY_GRADE = {
    "Grade 1": 2,
    "Grade 2": 3,
    "Grade 3": 4,
    minor: 2,
    moderate: 3,
    severe: 4,
  };

  it("injuriesPainLevel matches the canonical tier for every accepted grade format", () => {
    for (const [grade, expected] of Object.entries(EXPECTED_PAIN_BY_GRADE)) {
      expect(injuriesPainLevel([{ injury_grade: grade }])).toBe(expected);
      // and the classifier it delegates to lands on the matching tier
      const tier = normalizeSeverity(grade);
      expect({ minor: 2, moderate: 3, severe: 4 }[tier]).toBe(expected);
    }
  });

  it("unknown/missing grade defaults to the minimum pain level (2), never silently higher", () => {
    expect(injuriesPainLevel([{ injury_grade: "nonsense" }])).toBe(2);
    expect(injuriesPainLevel([{ injury_grade: null }])).toBe(2);
    expect(injuriesPainLevel([{}])).toBe(2);
    expect(injuriesPainLevel([])).toBe(2);
  });

  it("takes the WORST tier across multiple injuries (never under-sizes RTP)", () => {
    expect(
      injuriesPainLevel([
        { injury_grade: "Grade 1" },
        { injury_grade: "Grade 3" },
        { injury_grade: "moderate" },
      ]),
    ).toBe(4);
  });

  it("a clinical Grade 3 and legacy 'severe' are treated identically (no format drift)", () => {
    expect(injuriesPainLevel([{ injury_grade: "Grade 3" }])).toBe(
      injuriesPainLevel([{ injury_grade: "severe" }]),
    );
  });
});
