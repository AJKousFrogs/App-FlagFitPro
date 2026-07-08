import { describe, it, expect } from "vitest";
import {
  calculateWellnessIndex,
  calculateWellnessScore,
  WELLNESS_REQUIRED_WEIGHTS,
  WELLNESS_OPTIONAL_WEIGHTS,
  WELLNESS_REQUIRED_BLEND,
} from "../../netlify/functions/utils/readiness-score.js";
import { __test__ } from "../../netlify/functions/wellness-checkin.js";

const { calculateReadiness } = __test__;

/**
 * 2026-07-08 readiness-formula unification (calc-audit fix #2, completed). The
 * composite Today score (calc-readiness.js) and the check-in-time estimate
 * (wellness-checkin.js) now share ONE weighting scheme instead of two independently
 * -tuned formulas. This test locks in: the shared weights, that the check-in path
 * now actually uses `mood` (previously collected and silently ignored), and that the
 * S6 scale-inversion safeguard survived the unification.
 */
describe("readiness formula unification: shared weights, S6 preserved", () => {
  it("the canonical weighting is the single source both formulas read", () => {
    expect(WELLNESS_REQUIRED_WEIGHTS).toEqual({
      sleep: 0.4,
      soreness: 0.3,
      energy: 0.3,
    });
    expect(WELLNESS_OPTIONAL_WEIGHTS).toEqual({ mood: 0.5, stress: 0.5 });
    expect(WELLNESS_REQUIRED_BLEND).toBe(0.6);
  });

  it("calculateWellnessScore matches calculateWellnessIndex's proportions on a 1-10 input", () => {
    // Same raw values fed to both: the DB-sourced index (1-5 bucketed) and the
    // check-in-safe direct scorer (explicit scale=10, no bucket loss) should land
    // within a few points of each other — same weighting, different precision.
    const raw = {
      sleep_quality: 8,
      soreness: 3,
      energy: 7,
      mood: 8,
      stress: 3,
    };
    const indexResult = calculateWellnessIndex(raw);
    const directResult = calculateWellnessScore(
      { sleep: 8, soreness: 3, energy: 7, mood: 8, stress: 3 },
      { scale: 10 },
    );
    expect(Math.abs(indexResult.subscore - directResult)).toBeLessThanOrEqual(
      6,
    );
  });

  it("mood is now used by the check-in estimate (previously silently ignored)", () => {
    const withGoodMood = calculateReadiness({
      sleepQuality: 6,
      energyLevel: 6,
      mood: 10,
      scale: 10,
    });
    const withBadMood = calculateReadiness({
      sleepQuality: 6,
      energyLevel: 6,
      mood: 1,
      scale: 10,
    });
    expect(withGoodMood).toBeGreaterThan(withBadMood);
  });

  it("S6 preserved: a bad 0-10 day still scores low after unification", () => {
    const score = calculateReadiness({
      sleepQuality: 4,
      energyLevel: 3,
      muscleSoreness: 5,
      stressLevel: 5,
      // no scale -> defaults to 0-10
    });
    expect(score).not.toBeNull();
    expect(score).toBeLessThan(55);
  });

  it("S6 preserved: the same numbers on an explicit 1-5 scale are a GOOD day", () => {
    const score = calculateReadiness({
      sleepQuality: 4,
      energyLevel: 4,
      muscleSoreness: 1,
      stressLevel: 1,
      scale: 5,
    });
    expect(score).toBeGreaterThan(70);
  });

  it("still requires sleep AND energy (no fabrication, Spec Law 7)", () => {
    expect(calculateReadiness({ sleepQuality: 5 })).toBeNull();
    expect(calculateWellnessScore({ sleep: null, energy: 5 })).toBeNull();
  });

  it("travel penalty is shared with calc-readiness.js, not a second formula", () => {
    const noTravel = calculateReadiness({ sleepQuality: 8, energyLevel: 8 });
    const longTravel = calculateReadiness({
      sleepQuality: 8,
      energyLevel: 8,
      travelHours: 8,
    });
    // calc-readiness's travelReadinessPenalty: >=6h -> 8 points off.
    expect(noTravel - longTravel).toBe(8);
  });
});
