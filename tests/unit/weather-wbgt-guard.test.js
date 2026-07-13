import { describe, it, expect } from "vitest";
import {
  approxWBGT,
  applyWeatherGuard,
} from "../../angular/src/app/core/services/periodization-engine.ts";

/**
 * Phase 5a — the weather guard is rebuilt around WBGT (Wet-Bulb Globe
 * Temperature, the ACSM/NATA heat-illness standard) instead of raw air/apparent
 * temp, and it now scales by WBGT × duration × intensity across all FIELD intents
 * (fixing the D13 inversion where a long outdoor skills session was unguarded).
 * When humidity is unavailable the guard falls back byte-identically to the
 * legacy apparent-temp path (locked separately in the drift-parity harness).
 */

const rx = (intent, targetMinutes = 45, sprintReps = 6) => ({
  date: "2026-07-13",
  phase: "accumulation",
  intent,
  intentLabel: intent,
  targetRpe: 8,
  targetMinutes,
  sprintReps,
  strengthSets: 0,
  reasoning: "base session",
  recoveryEmphasis: "low",
  nutrition: { carbsG: 0, proteinG: 0, hydrationL: 0, rationale: "" },
  driverEvent: null,
  hoursUntilNextEvent: null,
  acwrAtIssue: null,
});
const wx = (tempC, humidityPct, extra = {}) => ({
  tempC,
  apparentC: tempC,
  humidityPct,
  condition: "clear",
  weatherCode: 0,
  precipMm: 0,
  windKmh: 5,
  ...extra,
});

describe("approxWBGT — BoM shade formula (temp + humidity)", () => {
  it("computes a plausible WBGT (30°C / 60%RH ≈ 30.9)", () => {
    expect(approxWBGT(30, 60)).toBeCloseTo(30.9, 1);
  });
  it("humidity drives it: 30°C is ~27.6 WBGT dry vs ~32.6 humid", () => {
    expect(approxWBGT(30, 40)).toBeCloseTo(27.6, 1);
    expect(approxWBGT(30, 70)).toBeCloseTo(32.6, 1);
  });
  it("returns null (never fabricates) when humidity or temp is missing/invalid", () => {
    expect(approxWBGT(30, null)).toBeNull();
    expect(approxWBGT(null, 60)).toBeNull();
    expect(approxWBGT(30, undefined)).toBeNull();
    expect(approxWBGT(30, 150)).toBeNull();
  });
});

describe("applyWeatherGuard — WBGT: same temp, humidity flips the risk", () => {
  it("30°C @ 40%RH (WBGT ~27.6) → benign; @ 70%RH (WBGT ~32.6) → STOP", () => {
    const dry = applyWeatherGuard(rx("sprint"), wx(30, 40), false);
    const humid = applyWeatherGuard(rx("sprint"), wx(30, 70), false);
    // dry: below the caution WBGT → session untouched
    expect(dry.intent).toBe("sprint");
    expect(dry.weatherAdjustment).toBeUndefined();
    // humid: identical air temp, but WBGT crosses the stop line
    expect(humid.intent).toBe("recovery");
    expect(humid.weatherAdjustment.action).toBe("stop");
    expect(humid.weatherAdjustment.reason).toContain("WBGT");
  });
});

describe("applyWeatherGuard — D13 inversion fixed: technical is now heat-guarded", () => {
  it("a technical (skills) session at 33°C/55%RH (WBGT ~33.5) is guarded, not ignored", () => {
    const out = applyWeatherGuard(rx("technical", 75, 0), wx(33, 55), false);
    expect(out.weatherAdjustment.applied).toBe(true); // previously: unguarded
    expect(out.intent).not.toBe("technical"); // moved off the hot field
  });
});

describe("applyWeatherGuard — scale cut is strain-scaled (WBGT × duration × intensity)", () => {
  it("a long sprint loses more volume than a short skills session at the same WBGT", () => {
    // 31°C @ 55%RH → WBGT ~31.2, inside the SCALE band [30, 32.2).
    const sprint = applyWeatherGuard(rx("sprint", 60, 10), wx(31, 55), false);
    const technical = applyWeatherGuard(rx("technical", 30, 0), wx(31, 55), false);
    expect(sprint.weatherAdjustment.action).toBe("scale");
    expect(technical.weatherAdjustment.action).toBe("scale");
    const sprintCut = 1 - sprint.targetMinutes / 60;
    const techCut = 1 - technical.targetMinutes / 30;
    expect(sprintCut).toBeGreaterThan(techCut); // harder + longer = deeper cut
  });
});

describe("applyWeatherGuard — no humidity → legacy apparent-temp path", () => {
  it("cites feels-like (not WBGT) and applies the flat legacy cut", () => {
    const out = applyWeatherGuard(
      rx("sprint", 45, 6),
      { ...wx(33, null) }, // 33°C feels-like, humidity unknown
      false,
    );
    expect(out.weatherAdjustment.action).toBe("scale");
    expect(out.weatherAdjustment.reason).toContain("feels-like");
    expect(out.weatherAdjustment.reason).not.toContain("WBGT");
    expect(out.targetMinutes).toBe(36); // 45 × 0.8 legacy flat cut
  });
});
