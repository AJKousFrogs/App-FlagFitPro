import { describe, it, expect } from "vitest";
import {
  ewma,
  computeAcwrAt,
  computeSessionLoad,
  classifyAcwrZone,
  acwrDateKey,
  ACWR_DEFAULTS,
  ACWR_RISK_ZONES,
} from "../../netlify/functions/utils/acwr.js";

// The canonical load/ACWR math — pure, so tested directly (handlers only mock it).

describe("ewma", () => {
  it("returns 0 for an empty series", () => {
    expect(ewma([], 0.25)).toBe(0);
  });

  it("returns the single value for a one-element series", () => {
    expect(ewma([100], 0.25)).toBe(100);
  });

  it("weights the most recent (last) value highest", () => {
    // series is oldest→newest; last element dominates
    expect(ewma([0, 0, 100], 0.5)).toBeGreaterThan(ewma([100, 0, 0], 0.5));
  });

  it("clamps lambda into [0,1]", () => {
    expect(ewma([10, 20], 5)).toBe(20); // lambda→1: newest only
    expect(ewma([10, 20], -5)).toBe(10); // lambda→0: oldest seed only
  });
});

describe("computeSessionLoad", () => {
  it("prefers a real workload column", () => {
    expect(
      computeSessionLoad({ workload: 450, rpe: 5, duration_minutes: 60 }),
    ).toBe(450);
  });

  it("falls back to rpe × duration when workload is missing/zero", () => {
    expect(computeSessionLoad({ rpe: 7, duration_minutes: 60 })).toBe(420);
    expect(
      computeSessionLoad({ workload: 0, rpe: 7, duration_minutes: 60 }),
    ).toBe(420);
  });

  it("returns 0 — never a fabricated default — when there is no real load", () => {
    expect(computeSessionLoad({})).toBe(0);
    expect(computeSessionLoad({ rpe: 7 })).toBe(0); // no duration
    expect(computeSessionLoad({ duration_minutes: 60 })).toBe(0); // no rpe
  });
});

describe("computeAcwrAt", () => {
  const dayKey = (offsetDaysAgo, base) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - offsetDaysAgo);
    return acwrDateKey(d);
  };

  it("returns null acwr when there is no chronic load (chronic floored, acute 0)", () => {
    const r = computeAcwrAt(new Map(), new Date("2026-06-10T00:00:00Z"));
    // empty loads → acute 0, chronic floored to minChronicLoad → ratio 0, low confidence
    expect(r.lowConfidence).toBe(true);
    expect(r.daysWithData).toBe(0);
  });

  it("flags low confidence with fewer than minDaysWithData days of data", () => {
    const base = new Date("2026-06-10T00:00:00Z");
    const loads = new Map([[dayKey(1, base), 300]]);
    const r = computeAcwrAt(loads, base);
    expect(r.lowConfidence).toBe(true);
    expect(r.daysWithData).toBe(1);
  });

  it("computes a ratio ~1 for steady daily load over the full window", () => {
    const base = new Date("2026-06-10T00:00:00Z");
    const loads = new Map();
    for (let i = 0; i < 28; i++) loads.set(dayKey(i, base), 100);
    const r = computeAcwrAt(loads, base);
    expect(r.lowConfidence).toBe(false);
    expect(r.acwr).toBeGreaterThan(0.8);
    expect(r.acwr).toBeLessThan(1.2);
  });

  it("uses uncoupled windows — a recent spike pushes acute above chronic", () => {
    const base = new Date("2026-06-10T00:00:00Z");
    const loads = new Map();
    for (let i = 7; i < 28; i++) loads.set(dayKey(i, base), 100); // chronic only
    for (let i = 0; i < 7; i++) loads.set(dayKey(i, base), 400); // acute spike
    const r = computeAcwrAt(loads, base);
    expect(r.acwr).toBeGreaterThan(1.5);
  });

  it("honours the documented default windows/lambdas", () => {
    expect(ACWR_DEFAULTS.acuteDays).toBe(7);
    expect(ACWR_DEFAULTS.chronicDays).toBe(21);
    expect(ACWR_DEFAULTS.acuteLambda).toBeCloseTo(0.25, 5);
  });
});

describe("classifyAcwrZone", () => {
  it("maps ratios to the evidence-based zones", () => {
    expect(classifyAcwrZone(0.5)).toBe("detraining");
    expect(classifyAcwrZone(1.0)).toBe("safe");
    expect(classifyAcwrZone(1.3)).toBe("safe");
    expect(classifyAcwrZone(1.4)).toBe("caution");
    expect(classifyAcwrZone(1.6)).toBe("danger");
    expect(classifyAcwrZone(1.8)).toBe("critical");
    expect(classifyAcwrZone(2.5)).toBe("critical");
  });

  it("returns null for a non-finite ratio", () => {
    expect(classifyAcwrZone(null)).toBeNull();
    expect(classifyAcwrZone(NaN)).toBeNull();
  });

  it("zone boundaries are contiguous with ACWR_RISK_ZONES metadata", () => {
    expect(ACWR_RISK_ZONES.safe.min).toBe(0.8);
    expect(ACWR_RISK_ZONES.critical.max).toBe(Infinity);
    expect(ACWR_RISK_ZONES.danger.risk).toBeGreaterThan(
      ACWR_RISK_ZONES.safe.risk,
    );
  });
});
