/**
 * Unit tests for the canonical ACWR util (netlify/functions/utils/acwr.js).
 *
 * Deterministic, no DB. This is the regression guard for the state-of-the-art
 * EWMA + uncoupled ACWR used by calc-readiness.js and compute-acwr.js.
 */
import { describe, it, expect } from "vitest";
import {
  ewma,
  computeAcwrAt,
  acwrDateKey,
  ACWR_DEFAULTS,
} from "../../netlify/functions/utils/acwr.js";

/** Build a Map<dateKey, load> with `load` on each of the `days` days ending at `end`. */
function constantLoads(end, days, load) {
  const m = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    m.set(acwrDateKey(d), load);
  }
  return m;
}

const END = "2026-03-28";

describe("ewma()", () => {
  it("is chronological & recency-weighted (newest dominates)", () => {
    // [2,4,8] λ=0.5 => 2 -> .5*4+.5*2=3 -> .5*8+.5*3=5.5
    expect(ewma([2, 4, 8], 0.5)).toBe(5.5);
  });
  it("handles single value and empty", () => {
    expect(ewma([5], 0.25)).toBe(5);
    expect(ewma([], 0.25)).toBe(0);
  });
});

describe("computeAcwrAt()", () => {
  it("steady load => ACWR ≈ 1.0", () => {
    const loads = constantLoads(END, 40, 300);
    const r = computeAcwrAt(loads, END);
    expect(r.acwr).toBe(1);
    expect(r.lowConfidence).toBe(false);
  });

  it("a recent spike raises ACWR above 1", () => {
    const loads = constantLoads(END, 40, 300);
    loads.set(acwrDateKey(END), 900); // today spikes
    const r = computeAcwrAt(loads, END);
    expect(r.acwr).toBeGreaterThan(1.3);
  });

  it("recency: a spike TODAY raises ACWR more than the same spike 6 days ago", () => {
    const today = constantLoads(END, 40, 300);
    today.set(acwrDateKey(END), 900);

    const sixAgoDate = new Date(END);
    sixAgoDate.setUTCDate(sixAgoDate.getUTCDate() - 6);
    const old = constantLoads(END, 40, 300);
    old.set(acwrDateKey(sixAgoDate), 900);

    expect(computeAcwrAt(today, END).acwr).toBeGreaterThan(
      computeAcwrAt(old, END).acwr,
    );
  });

  it("is UNCOUPLED: load only in the acute week does not enter chronic", () => {
    const loads = new Map();
    loads.set(acwrDateKey(END), 300); // today only
    const r = computeAcwrAt(loads, END);
    // chronic window (the 21 days before the acute week) is empty => floored
    expect(r.chronicLoad).toBe(ACWR_DEFAULTS.minChronicLoad);
    expect(r.lowConfidence).toBe(true);
  });

  it("empty history => acwr 0, low confidence, chronic floored", () => {
    const r = computeAcwrAt(new Map(), END);
    expect(r.acwr).toBe(0);
    expect(r.chronicLoad).toBe(ACWR_DEFAULTS.minChronicLoad);
    expect(r.lowConfidence).toBe(true);
  });
});
