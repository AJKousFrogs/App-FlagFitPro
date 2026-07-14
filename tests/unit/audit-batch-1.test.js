import { describe, it, expect } from "vitest";
import {
  computeAcwrAt,
  ACWR_RISK_ZONES,
} from "../../netlify/functions/utils/acwr.js";
import {
  buildWarmupTemplate,
  NMT_PREVENTION_SEGMENT,
  NMT_TARGET_SECONDS,
} from "../../netlify/functions/utils/daily-protocol-training-logic.js";
import { keywordsForRegion } from "../../netlify/functions/utils/daily-protocol-blocks.js";
import {
  prescribeFor,
  applyWeatherGuard,
} from "../../angular/src/app/core/services/periodization-engine.ts";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-07-14 external-audit batch 1 (user-approved): graded ACWR confidence
// (C2), building-base state (C3), risk-multiplier retirement (§1.1), NMT/ACL
// warm-up block (§1.3), finger/hand regions (§1.2), no fabricated bodyweight
// for per-kg dosing (C7), stricter NATA WBGT bands (C8).
// ─────────────────────────────────────────────────────────────────────────────

const dayKey = (daysAgo, base) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

describe("C2 — graded ACWR confidence (binary 14-day flag stopped informing)", () => {
  const base = new Date("2026-06-10T00:00:00Z");

  it("a 3×/week amateur (12 loaded days/28) is MEDIUM confidence, not just 'low'", () => {
    const loads = new Map();
    for (let i = 0; i < 28; i += 2.5)
      loads.set(dayKey(Math.floor(i), base), 350);
    const r = computeAcwrAt(loads, base);
    expect(r.daysWithData).toBeGreaterThanOrEqual(8);
    expect(r.daysWithData).toBeLessThan(14);
    expect(r.confidence).toBe("medium");
    expect(r.lowConfidence).toBe(true); // legacy flag preserved for back-compat
  });

  it("≥14 loaded days → high; <8 → low", () => {
    const dense = new Map();
    for (let i = 0; i < 20; i++) dense.set(dayKey(i, base), 200);
    expect(computeAcwrAt(dense, base).confidence).toBe("high");
    const sparse = new Map([[dayKey(2, base), 300]]);
    expect(computeAcwrAt(sparse, base).confidence).toBe("low");
  });
});

describe("C3 — building-base state instead of a floored, fabricated ratio", () => {
  const base = new Date("2026-06-10T00:00:00Z");

  it("one 300 AU return session after a layoff → building_base, acwr null (was ACWR≈6 'Critical')", () => {
    const loads = new Map([[dayKey(1, base), 300]]);
    const r = computeAcwrAt(loads, base);
    expect(r.state).toBe("building_base");
    expect(r.acwr).toBeNull();
  });

  it("a steady 2-3×/week amateur keeps a REAL ratio (chronic ~100 > the floor)", () => {
    const loads = new Map();
    for (let i = 0; i < 28; i++) loads.set(dayKey(i, base), 100);
    const r = computeAcwrAt(loads, base);
    expect(r.state).toBe("normal");
    expect(r.acwr).toBeGreaterThan(0.8);
    expect(r.acwr).toBeLessThan(1.2);
  });
});

describe("§1.1 — injury-risk multipliers retired (contested point estimates)", () => {
  it("zones carry labels + actions only — no 1.2×/4.2× 'facts'", () => {
    for (const zone of Object.values(ACWR_RISK_ZONES)) {
      expect(zone.risk).toBeUndefined();
      expect(typeof zone.label).toBe("string");
      expect(typeof zone.action).toBe("string");
    }
  });
});

describe("§1.3 — NMT/ACL prevention block (Grewal 2025: 87% non-contact, 2/24 had done ANY prevention)", () => {
  it("quality-day warm-ups (fitness variant) carry the ~10-min NMT segment", () => {
    const plan = buildWarmupTemplate({ variant: "fitness", includeNmt: true });
    const names = plan.map((i) => i.name);
    expect(names).toContain("Lateral Hop-and-Stick");
    expect(names).toContain("Drop-Land Freeze (Landing Mechanics)");
    expect(names).toContain("Decel-to-Stop Runs");
    const nmtSeconds = NMT_PREVENTION_SEGMENT.reduce(
      (s, i) => s + i.durationSeconds,
      0,
    );
    expect(nmtSeconds).toBe(NMT_TARGET_SECONDS); // 10 min, budgeted honestly
  });

  it("recovery days never get the NMT segment; includeNmt=false leaves plans unchanged", () => {
    const recovery = buildWarmupTemplate({
      variant: "recovery",
      includeNmt: true,
    });
    expect(recovery.map((i) => i.name)).not.toContain("Lateral Hop-and-Stick");
    const plain = buildWarmupTemplate({
      variant: "fitness",
      includeNmt: false,
    });
    expect(plain.map((i) => i.name)).not.toContain("Lateral Hop-and-Stick");
  });
});

describe("§1.2/§5 — finger/hand injury regions (the #1 adult flag injury site)", () => {
  it("finger and hand resolve to real keyword sets", () => {
    expect(keywordsForRegion("finger")).toContain("grip");
    expect(keywordsForRegion("hand")).toContain("wrist");
  });
});

describe("C7 — no per-kg targets from a fabricated bodyweight (Law #7)", () => {
  const inputs = {
    date: new Date("2026-07-14T08:00:00Z"),
    phase: "accumulation",
    upcoming: [],
    lastEvent: null,
    acwr: 1.0,
    readiness: 80,
    bodyweightKg: null, // never captured
    density14d: null,
    seasonPhase: "offseason",
  };

  it("bodyweight null → nutrition null (UI shows 'add your weight'), prescription otherwise intact", () => {
    const rx = prescribeFor(structuredClone(inputs));
    expect(rx.nutrition).toBeNull();
    expect(rx.intent).toBeTruthy();
    expect(rx.targetMinutes).toBeGreaterThan(0);
  });

  it("a real bodyweight still produces per-kg targets", () => {
    const rx = prescribeFor({ ...structuredClone(inputs), bodyweightKg: 60 });
    expect(rx.nutrition).not.toBeNull();
    expect(rx.nutrition.proteinG).toBe(108); // 1.8 g/kg × 60
  });
});

describe("C8 — stricter NATA WBGT bands (scale 27.8, relocate 30, stop 32.2)", () => {
  const wx = (tempC, humidityPct) => ({
    tempC,
    apparentC: tempC,
    humidityPct,
    condition: "clear",
    weatherCode: 0,
    precipMm: 0,
    windKmh: 5,
  });
  const rx = () => ({
    intent: "sprint",
    targetMinutes: 90,
    sprintReps: 10,
    reasoning: "sprint day",
  });

  it("WBGT ~29 → SCALE (was advisory-only under the old loose bands)", () => {
    const out = applyWeatherGuard(rx(), wx(29, 55), false);
    expect(out.weatherAdjustment.action).toBe("scale");
  });

  it("WBGT ~31 → RELOCATE indoors (the branch that was dead code before)", () => {
    const out = applyWeatherGuard(rx(), wx(31, 55), false);
    expect(out.weatherAdjustment.action).toBe("relocate");
    expect(out.intent).toBe("mobility");
  });

  it("WBGT ≥ 32.2 still STOPS", () => {
    const out = applyWeatherGuard(rx(), wx(33, 60), false);
    expect(out.weatherAdjustment.action).toBe("stop");
  });
});
