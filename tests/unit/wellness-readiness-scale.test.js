import { describe, it, expect } from "vitest";
import { __test__ } from "../../netlify/functions/wellness-checkin.js";

const { calculateReadiness } = __test__;

// S6: scale must come from the form, not be guessed from the values. A genuinely
// bad 0–10 day must score LOW — it must not be misread as a great 1–5 day.
describe("calculateReadiness — explicit scale, no value-based inversion", () => {
  it("a bad 0–10 day scores low (was inverted to ~70–80 by the old guess)", () => {
    const score = calculateReadiness({
      sleepQuality: 4,
      energyLevel: 3,
      muscleSoreness: 5,
      stressLevel: 5,
      // no scale → defaults to 0–10 (the live full check-in)
    });
    expect(score).not.toBeNull();
    expect(score).toBeLessThan(55); // a poor day, not a 70–80 misread
  });

  it("the same numbers on an explicit 1–5 scale are a GOOD day", () => {
    const score = calculateReadiness({
      sleepQuality: 4,
      energyLevel: 4,
      muscleSoreness: 1, // low soreness = good
      stressLevel: 1,
      scale: 5,
    });
    expect(score).toBeGreaterThan(70);
  });

  it("missing required inputs → null (no fabrication)", () => {
    expect(calculateReadiness({ sleepQuality: 5 })).toBeNull();
  });
});
