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
    const sprintRx = {
      intent: "sprint",
      sprintReps: 6,
      reasoning: "sprint day",
    };
    expect(applyWeatherGuard(sprintRx, HEAT_33, false)).toMatchSnapshot();
  });
  it("applyWeatherGuard(e: conditioning @33°C) — currently UNguarded (documents the inversion)", () => {
    const condRx = {
      intent: "conditioning",
      reasoning: "sustained conditioning",
    };
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
      // 2026-07-14 coach directive: sprint exposure is YEAR-ROUND (hamstring-
      // protective near-max running), so the off-season rotation includes a
      // sprint day — the old "no off-season sprints" rule is retired. Never
      // two high-CNS days (sprint/mixed) back-to-back.
      expect(count("sprint")).toBeGreaterThanOrEqual(1);
      // an anchor-less off-season week now reaches the full 5-day budget
      expect(intents.filter((i) => i !== "rest").length).toBe(5);
      for (let i = 1; i < 7; i++) {
        const highCns = (x) => x === "sprint" || x === "mixed";
        expect(highCns(intents[i - 1]) && highCns(intents[i])).toBe(false);
      }
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
    // and the GPP properties still hold: ≤5 active, ≥2 rest (sprint days are
    // allowed year-round since 2026-07-14 — see the rotation directive above)
    const active = withPractice.filter((i) => i !== "rest").length;
    expect(active).toBeLessThanOrEqual(5);
  });
});

// Phase 4 — a taper CUTS VOLUME while HOLDING INTENSITY (rubric B6; Bosquet 2007
// meta-analysis, Mujika & Padilla 2003). The accumulation sprint baseline is
// RPE 8 / 90 min (total, incl. warm-up + DOP) / 10 reps; every individual taper
// day must keep near-max sprint
// work (never soften to mobility/technique) and reduce only minutes + reps. These
// assertions FAILED before the fix (regular was RPE 6, final was mobility RPE 4).
// 2026-07-14: quality sessions target 90 min TOTAL (warm-up + DOP included).
const SPRINT_BASELINE = { rpe: 8, minutes: 90, reps: 10 };
const taperDay = (hoursOut, competitionLevel = "national") => ({
  date: now,
  phase: "taper",
  upcoming: [
    {
      // engine reads camelCase startsAt/endsAt (periodization-engine.ts:2058)
      startsAt: new Date(now.getTime() + hoursOut * 36e5).toISOString(),
      endsAt: new Date(now.getTime() + hoursOut * 36e5).toISOString(),
      importance: "regular",
      competitionLevel,
      expectedGameCount: 1,
      competitionShortName: "League",
    },
  ],
  lastEvent: null,
  acwr: 1.0,
  readiness: 75,
  bodyweightKg: 80,
  density14d: null,
  seasonPhase: "inseason",
});

describe("Phase 4 — taper holds intensity, cuts volume (B6)", () => {
  // Front of taper (3 days out → the "regular" row) and final 48h (40h out → the
  // "final" row; > 24h so the taper-prime game-eve gate does not fire first).
  const cases = [
    { name: "front of taper (72h out)", rx: prescribeFor(taperDay(72)) },
    { name: "final 48h (40h out)", rx: prescribeFor(taperDay(40)) },
  ];

  for (const { name, rx } of cases) {
    it(`${name}: keeps sprint velocity work — never mobility/technique`, () => {
      expect(rx.intent).toBe("sprint"); // velocity/CNS work preserved
      expect(rx.sprintReps).toBeGreaterThan(0);
    });
    it(`${name}: intensity MAINTAINED at the sprint baseline (RPE ${SPRINT_BASELINE.rpe})`, () => {
      expect(rx.targetRpe).toBe(SPRINT_BASELINE.rpe); // not reduced
    });
    it(`${name}: volume reduced 40-60%+ vs baseline`, () => {
      const minutesCut = 1 - rx.targetMinutes / SPRINT_BASELINE.minutes;
      const repsCut = 1 - rx.sprintReps / SPRINT_BASELINE.reps;
      expect(minutesCut).toBeGreaterThanOrEqual(0.4); // ≥40% less time
      expect(repsCut).toBeGreaterThanOrEqual(0.4); // ≥40% fewer reps
      expect(rx.strengthSets).toBe(0); // no strength volume in a taper
    });
    it(`${name}: prescription is locked (regression snapshot)`, () => {
      expect(rx).toMatchSnapshot();
    });
  }

  it("final 48h is LOWER VOLUME than the front of the taper (progressive), same intensity", () => {
    const front = prescribeFor(taperDay(72));
    const final = prescribeFor(taperDay(40));
    expect(final.sprintReps).toBeLessThan(front.sprintReps); // fewer reps closer in
    expect(final.targetMinutes).toBeLessThanOrEqual(front.targetMinutes);
    expect(final.targetRpe).toBe(front.targetRpe); // intensity unchanged across taper
  });

  // Two-layer model (Phase 4b): the taper is GRADUATED by event level from the
  // materialized ruleset — a World peak event gets a deeper taper than a local
  // game — but EVERY level keeps sprint velocity and intensity ≥ 90% (RPE ≥ 7),
  // never the old mobility-RPE-4 detraining error.
  it("graduates by event level: bigger event → deeper volume cut, all keep sprint + RPE ≥ 7", () => {
    const local = prescribeFor(taperDay(72, "club")); // → "local" rule
    const national = prescribeFor(taperDay(72, "national"));
    const world = prescribeFor(taperDay(72, "world"));
    // deeper events cut more VOLUME (retain fewer minutes)
    expect(world.targetMinutes).toBeLessThan(national.targetMinutes);
    expect(national.targetMinutes).toBeLessThan(local.targetMinutes);
    // …while intensity is held high everywhere (curated retention ≥ 0.90)
    for (const rx of [local, national, world]) {
      expect(rx.intent).toBe("sprint"); // velocity always preserved
      expect(rx.targetRpe).toBeGreaterThanOrEqual(7); // never crashed to mobility
    }
    expect(world.targetRpe).toBe(8); // peak event holds full intensity
  });
});
