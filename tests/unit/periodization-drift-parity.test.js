import { describe, it, expect } from "vitest";
import {
  prescribeFor,
  applyWeatherGuard,
  planWeek,
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

// Phase 3 — off-season is now a real anchor-placed, phase-shaped GPP week (via
// planWeek), not a flat "mixed" every day. These lock the week-level behavior.
const offseasonWeek = (seasonPhase) => {
  const mon = new Date("2026-07-13T08:00:00Z");
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(mon.getTime() + i * 864e5),
    phase: "transition",
    upcoming: [],
    lastEvent: null,
    acwr: null,
    readiness: 60,
    bodyweightKg: 80,
    density14d: null,
    seasonPhase,
  }));
};

describe("Phase 3 — off-season GPP week (planWeek)", () => {
  for (const season of ["offseason", null]) {
    it(`seasonPhase=${season}: GPP variety, not 5 flat "mixed"`, () => {
      const week = planWeek(
        offseasonWeek(season),
        new Array(7).fill(false), // no team practices
        new Array(7).fill("transition"), // off-season macro phase
        60,
        null,
      );
      const intents = week.map((d) => d.intent);
      const count = (x) => intents.filter((i) => i === x).length;
      expect(count("rest")).toBeGreaterThanOrEqual(2); // 2 rest days non-negotiable
      expect(count("mixed")).toBeLessThan(5); // NOT the old flat-mixed bug
      expect(count("strength")).toBeGreaterThanOrEqual(1); // GPP strength base
      expect(new Set(intents).size).toBeGreaterThan(2); // real variety, not one type
      // no max-velocity sprints in off-season GPP (those are pre-/in-season)
      expect(count("sprint")).toBe(0);
    });
  }

  it("adapts around REAL practice days (indices 1 & 3), not a fixed weekday shape", () => {
    const flags = [false, true, false, true, false, false, false]; // practices on i1,i3
    const noPractice = planWeek(
      offseasonWeek("offseason"),
      new Array(7).fill(false),
      new Array(7).fill("transition"),
      60,
      null,
    ).map((d) => d.intent);
    const withPractice = planWeek(
      offseasonWeek("offseason"),
      flags,
      new Array(7).fill("transition"),
      60,
      null,
    ).map((d) => d.intent);
    // the placement changes when the anchors change — it is NOT a fixed weekday shape
    expect(withPractice).not.toEqual(noPractice);
    // and the GPP properties still hold: ≤5 active, ≥2 rest, no off-season sprints
    const active = withPractice.filter((i) => i !== "rest").length;
    expect(active).toBeLessThanOrEqual(5);
    expect(withPractice.filter((i) => i === "sprint").length).toBe(0);
  });
});
