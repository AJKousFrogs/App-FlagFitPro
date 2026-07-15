import { describe, it, expect } from "vitest";
import {
  computePersonalCutoffs,
  BASELINE_DEFAULTS,
} from "../../netlify/functions/utils/readiness-baseline.js";

// ─────────────────────────────────────────────────────────────────────────────
// Audit C6/§4.2 — within-athlete readiness baselines: z-cuts on the trailing
// 28-day distribution, shrunk toward the population priors by w = n/(n+14).
// ─────────────────────────────────────────────────────────────────────────────

const PRIORS = { low: 55, high: 75 };

describe("computePersonalCutoffs — shrinkage blend of personal z-cuts and priors", () => {
  it("fewer than 10 observations → the priors verbatim, nothing fabricated (Law #7)", () => {
    for (const scores of [[], [80], Array(9).fill(70), null]) {
      const c = computePersonalCutoffs(scores, PRIORS);
      expect(c.low).toBe(55);
      expect(c.high).toBe(75);
      expect(c.personalized).toBe(false);
      expect(c.mean).toBeNull();
    }
  });

  it("a chronically-HIGH athlete's cuts rise: their 'low' fires earlier (more sensitive)", () => {
    // 28 days steady around 85 ± 6 — for this athlete, 70 IS a bad day.
    const scores = Array.from({ length: 28 }, (_, i) => 85 + (i % 3) - 1);
    const c = computePersonalCutoffs(scores, PRIORS);
    expect(c.personalized).toBe(true);
    expect(c.low).toBeGreaterThan(PRIORS.low); // deload flag before 55
    expect(c.high).toBeGreaterThan(PRIORS.high); // and 'push' demands more
  });

  it("a chronically-LOW athlete's cuts drop: fewer false deloads on their normal days", () => {
    // Steady around 58 — the old absolute 55 called half their life 'low'.
    const scores = Array.from({ length: 28 }, (_, i) => 58 + (i % 5) - 2);
    const c = computePersonalCutoffs(scores, PRIORS);
    expect(c.personalized).toBe(true);
    expect(c.low).toBeLessThan(PRIORS.low);
    // Clamped: never below the sanity floor
    expect(c.low).toBeGreaterThanOrEqual(BASELINE_DEFAULTS.lowCutClamp.min);
  });

  it("shrinkage: 10 observations stay closer to the priors than 28 do", () => {
    // Mean 75 keeps both blends inside the clamps so the shrinkage itself is
    // what's measured (a mean-90 history pins both at the clamp ceiling —
    // which is the clamp doing its job, tested separately below).
    const days = (n) => Array.from({ length: n }, () => 75);
    const at10 = computePersonalCutoffs(days(10), PRIORS);
    const at28 = computePersonalCutoffs(days(28), PRIORS);
    expect(Math.abs(at10.low - PRIORS.low)).toBeLessThan(
      Math.abs(at28.low - PRIORS.low),
    );
  });

  it("σ floor: a perfectly flat history cannot collapse the band onto the mean", () => {
    const flat = Array(28).fill(72);
    const c = computePersonalCutoffs(flat, PRIORS);
    expect(c.sd).toBe(BASELINE_DEFAULTS.sdFloor);
    expect(c.high - c.low).toBeGreaterThanOrEqual(BASELINE_DEFAULTS.minGap);
  });

  it("clamps hold at the extremes and the band keeps its minimum gap", () => {
    const extreme = Array(28).fill(99);
    const c = computePersonalCutoffs(extreme, PRIORS);
    expect(c.low).toBeLessThanOrEqual(BASELINE_DEFAULTS.lowCutClamp.max);
    expect(c.high).toBeLessThanOrEqual(BASELINE_DEFAULTS.highCutClamp.max);
    expect(c.high - c.low).toBeGreaterThanOrEqual(BASELINE_DEFAULTS.minGap);
    const floorAthlete = Array(28).fill(20);
    const f = computePersonalCutoffs(floorAthlete, PRIORS);
    expect(f.low).toBeGreaterThanOrEqual(BASELINE_DEFAULTS.lowCutClamp.min);
    expect(f.high).toBeGreaterThanOrEqual(BASELINE_DEFAULTS.highCutClamp.min);
  });

  it("non-finite entries are ignored, not counted toward n", () => {
    const scores = [...Array(9).fill(70), NaN, undefined, "80"];
    const c = computePersonalCutoffs(scores, PRIORS);
    expect(c.personalized).toBe(false); // only 9 valid observations
  });
});
