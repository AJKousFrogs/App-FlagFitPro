import { describe, it, expect } from "vitest";
import {
  prescribeFor,
  applyWeatherGuard,
} from "../../angular/src/app/core/services/periodization-engine.ts";

/**
 * PHASE-2 PARITY HARNESS (kill-the-drift). Snapshots the ENGINE outputs for the
 * Phase-1 audit fixtures. Phase 2 changes only the REALIZATION layer
 * (daily-protocol phase resolution + rationale), NOT the engine — so every
 * snapshot here MUST stay byte-identical across Phase 2. Any diff = the engine
 * moved unexpectedly = stop and report (per the audit ground rules).
 *
 * Fixtures (from the Phase-1 deliverable):
 *   (a) in-season: practices Mon/Wed/Thu, gameday +10d
 *   (b) far pre-season: first gameday +45d
 *   (c) full off-season: zero inputs (the live Center-player state)
 *   (d) heat + sprint session
 *   (e) heat + sustained conditioning session
 */

const now = new Date("2026-07-13T08:00:00Z"); // Monday
const gameIn = (days, extra = {}) => [
  {
    starts_at: new Date(now.getTime() + days * 864e5).toISOString(),
    ends_at: new Date(now.getTime() + days * 864e5).toISOString(),
    importance: "regular",
    competition_level: "national",
    ...extra,
  },
];

const FIXTURES = {
  a_in_season: {
    date: now,
    phase: "accumulation",
    upcoming: gameIn(10),
    lastEvent: null,
    acwr: 1.0,
    readiness: 70,
    bodyweightKg: 80,
    density14d: null,
    seasonPhase: "inseason",
  },
  b_far_preseason: {
    date: now,
    phase: "transition",
    upcoming: gameIn(45),
    lastEvent: null,
    acwr: null,
    readiness: 65,
    bodyweightKg: 80,
    density14d: null,
    seasonPhase: "preseason",
  },
  c_off_season: {
    date: now,
    phase: "transition",
    upcoming: [],
    lastEvent: null,
    acwr: null,
    readiness: 60,
    bodyweightKg: 80,
    density14d: null,
    seasonPhase: "offseason",
  },
};

const HEAT_33 = {
  tempC: 33,
  apparentC: 33,
  condition: "hot",
  weatherCode: 0,
  precipMm: 0,
  windKmh: 5,
};

describe("PHASE-2 harness — engine baseline (must not move in Phase 2)", () => {
  for (const [name, input] of Object.entries(FIXTURES)) {
    it(`prescribeFor(${name})`, () => {
      expect(prescribeFor(structuredClone(input))).toMatchSnapshot();
    });
  }

  // Weather fixtures (d,e) — the D13 inversion: a short sprint IS guarded while
  // sustained conditioning is NOT (conditioning isn't an OUTDOOR_INTENSE intent).
  it("applyWeatherGuard(d: sprint @33°C) — guarded", () => {
    const sprintRx = { intent: "sprint", sprintReps: 6, reasoning: "sprint day" };
    expect(applyWeatherGuard(sprintRx, HEAT_33, false)).toMatchSnapshot();
  });
  it("applyWeatherGuard(e: conditioning @33°C) — currently UNguarded (documents the inversion)", () => {
    const condRx = { intent: "conditioning", reasoning: "sustained conditioning" };
    expect(applyWeatherGuard(condRx, HEAT_33, false)).toMatchSnapshot();
  });
});
