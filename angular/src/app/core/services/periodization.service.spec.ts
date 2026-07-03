/**
 * Periodization Regression Tests
 *
 * Locks the prescription algorithm. `prescribeFor` is pure — same inputs
 * always yield the same prescription. These tests are the contract that
 * every future change must justify breaking.
 *
 * If a test here changes, the prescription algorithm contract is changing —
 * justify the break in the PR.
 */

import { describe, it, expect } from "vitest";
import {
  prescribeFor,
  macroPhaseFor,
  __periodization__,
} from "./periodization.service";
import {
  PeriodizationInputs,
  WeatherInput,
} from "../models/prescription.models";
import { CompetitionEvent } from "../models/schedule.models";

// =============================================================================
// FIXTURE BUILDERS
// =============================================================================

function event(overrides: Partial<CompetitionEvent> = {}): CompetitionEvent {
  return {
    id: "ev-1",
    competitionId: "c-1",
    teamId: "t-1",
    startsAt: "2026-05-09T08:00:00Z",
    endsAt: null,
    expectedGameCount: 4,
    importance: "high",
    label: "Round 1",
    location: null,
    venue: null,
    notes: null,
    status: "scheduled",
    competitionName: "Slovenian Cup 2026",
    competitionShortName: "SVN Cup 2026",
    competitionKind: "cup",
    competitionLevel: "national",
    competitionCountry: "SI",
    competitionSeasonYear: 2026,
    teamName: "Ljubljana Frogs",
    source: "team",
    ...overrides,
  };
}

function inputs(over: Partial<PeriodizationInputs> = {}): PeriodizationInputs {
  return {
    date: new Date("2026-05-04T10:00:00Z"), // a Monday
    phase: "accumulation",
    upcoming: [],
    lastEvent: null,
    acwr: 1.0,
    readiness: 75,
    bodyweightKg: 80,
    density14d: { totalGames: 0, hasPeakImportance: false },
    ...over,
  };
}

// =============================================================================
// PRIORITY 1: COMPETITION DAY
// =============================================================================

describe("prescribeFor — competition day", () => {
  it("returns competition intent during a live event", () => {
    const rx = prescribeFor(
      inputs({
        phase: "competition",
        upcoming: [
          event({
            startsAt: "2026-05-09T07:00:00Z",
            endsAt: "2026-05-09T17:00:00Z",
          }),
        ],
        date: new Date("2026-05-09T12:00:00Z"),
      }),
    );
    expect(rx.intent).toBe("competition");
    expect(rx.recoveryEmphasis).toBe("critical");
    expect(rx.targetRpe).toBeNull();
  });
});

// =============================================================================
// PRIORITY 2: TAPER-PRIME (≤ 24H BEFORE GAME)
// =============================================================================

describe("prescribeFor — pre-game taper-prime", () => {
  it("inside 24h triggers taper-prime regardless of phase", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation", // would normally pick a hard day
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
        date: new Date("2026-05-08T20:00:00Z"), // 12h before
      }),
    );
    expect(rx.intent).toBe("taper-prime");
    expect(rx.targetRpe).toBe(4);
    expect(rx.targetMinutes).toBeLessThanOrEqual(30);
    expect(rx.sprintReps).toBeGreaterThan(0);
  });

  it("just outside 24h does NOT trigger taper-prime", () => {
    const rx = prescribeFor(
      inputs({
        phase: "taper",
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
        date: new Date("2026-05-07T08:00:00Z"), // 48h before
      }),
    );
    expect(rx.intent).not.toBe("taper-prime");
  });
});

// =============================================================================
// PRIORITY 3: ACWR DANGER OVERRIDE
// =============================================================================

describe("prescribeFor — ACWR safety override", () => {
  it("ACWR > 1.5 forces rest, regardless of phase", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", acwr: 1.6 }),
    );
    expect(rx.intent).toBe("rest");
    expect(rx.recoveryEmphasis).toBe("critical");
    expect(rx.reasoning).toMatch(/ACWR.*danger/i);
  });

  it("ACWR exactly 1.5 does NOT trigger rest override", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", acwr: 1.5 }),
    );
    expect(rx.intent).not.toBe("rest");
  });
});

// =============================================================================
// PRIORITY 4: LOW READINESS OVERRIDE
// =============================================================================

describe("prescribeFor — readiness collapse", () => {
  it("readiness < 55 forces recovery", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", readiness: 45 }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.reasoning).toMatch(/readiness/i);
  });

  it("readiness null falls back to 70 (no override)", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", readiness: null }),
    );
    expect(rx.intent).not.toBe("recovery");
  });
});

// =============================================================================
// PRIORITY 5: PHASE-DRIVEN DEFAULTS
// =============================================================================

describe("prescribeFor — phase defaults", () => {
  it("recovery phase emits recovery intent with last-event reasoning", () => {
    const rx = prescribeFor(
      inputs({
        phase: "recovery",
        lastEvent: event({
          competitionShortName: "CPH Bowl 2026",
          expectedGameCount: 8,
        }),
      }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.reasoning).toMatch(/CPH Bowl/);
    expect(rx.reasoning).toMatch(/8 games/);
  });

  it("taper phase, far from event → sprint (CNS sharp, low volume)", () => {
    const rx = prescribeFor(
      inputs({
        phase: "taper",
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
        date: new Date("2026-05-04T08:00:00Z"), // 5 days out
      }),
    );
    expect(rx.intent).toBe("sprint");
  });

  it("taper phase, 2 days from event → mobility (final third)", () => {
    const rx = prescribeFor(
      inputs({
        phase: "taper",
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
        date: new Date("2026-05-07T08:00:00Z"), // 48h out — final third
      }),
    );
    expect(rx.intent).toBe("mobility");
  });

  it("transition phase, no heavy density → mixed", () => {
    const rx = prescribeFor(
      inputs({
        phase: "transition",
        density14d: { totalGames: 0, hasPeakImportance: false },
      }),
    );
    expect(rx.intent).toBe("mixed");
  });

  it("transition phase, heavy density → mobility", () => {
    const rx = prescribeFor(
      inputs({
        phase: "transition",
        density14d: { totalGames: 12, hasPeakImportance: true },
      }),
    );
    expect(rx.intent).toBe("mobility");
  });
});

// =============================================================================
// ACCUMULATION DAY-OF-WEEK SHAPE
// =============================================================================

describe("prescribeFor — accumulation week shape", () => {
  // Anchor dates by day of week to be timezone-safe.
  const monday    = new Date("2026-05-04T10:00:00Z");
  const tuesday   = new Date("2026-05-05T10:00:00Z");
  const wednesday = new Date("2026-05-06T10:00:00Z");
  const thursday  = new Date("2026-05-07T10:00:00Z");
  const friday    = new Date("2026-05-08T10:00:00Z");
  const saturday  = new Date("2026-05-09T10:00:00Z");
  const sunday    = new Date("2026-05-10T10:00:00Z");

  it.each([
    ["Mon", monday,    "strength"],
    ["Tue", tuesday,   "sprint"],
    ["Wed", wednesday, "mobility"],
    ["Thu", thursday,  "strength"],
    ["Fri", friday,    "sprint"],
    ["Sat", saturday,  "mixed"],
    ["Sun", sunday,    "rest"],
  ] as const)(
    "%s default intent is %s",
    (_label, date, expected) => {
      const rx = prescribeFor(
        inputs({ date, phase: "accumulation", upcoming: [] }),
      );
      expect(rx.intent).toBe(expected);
    },
  );

  it("elevated ACWR demotes a sprint day to mobility", () => {
    const rx = prescribeFor(
      inputs({
        date: tuesday, // would be sprint
        phase: "accumulation",
        acwr: 1.4, // elevated, below danger
      }),
    );
    expect(rx.intent).toBe("mobility");
  });

  it("heavy density demotes a strength day to technical", () => {
    const rx = prescribeFor(
      inputs({
        date: monday, // would be strength
        phase: "accumulation",
        density14d: { totalGames: 12, hasPeakImportance: true },
      }),
    );
    expect(rx.intent).toBe("technical");
  });
});

// =============================================================================
// DAY-TYPE → PHASE-MODIFIER PIPELINE (team practice)
//
// Locks the "resolveDayType → applyModifiers" composition: a declared team-practice
// day is resolved FIRST (you're going to practice regardless), then the event/season
// PHASE is applied as a data-driven modifier (PRACTICE_PHASE_MODIFIERS). This proves
// the pipeline is data-driven (a phase = a row, not a branch) and that higher-priority
// safety/competition overrides still win over a practice day.
// =============================================================================

describe("prescribeFor — team practice (day type) × phase modifier", () => {
  it("accumulation phase → practice IS the session (mixed, rpe7/90min, 'own' framing)", () => {
    const rx = prescribeFor(inputs({ isTeamPractice: true, phase: "accumulation" }));
    expect(rx.intent).toBe("mixed");
    expect(rx.intentLabel).toBe("Flag football practice");
    expect(rx.targetRpe).toBe(7);
    expect(rx.targetMinutes).toBe(90);
    expect(rx.reasoning).toContain("main session");
  });

  it("recovery phase → practice is HONOURED but at recovery intensity (finding 1.1)", () => {
    // The calendar fact (practice) is kept — label + framing acknowledge it — but
    // the recovery context modifies intensity down to the recovery default (rpe3/30).
    // Before finding 1.1 this practice day was silently dropped.
    const rx = prescribeFor(
      inputs({
        isTeamPractice: true,
        phase: "recovery",
        lastEvent: event({ startsAt: "2026-05-02T08:00:00Z" }),
      }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.intentLabel).toBe("Flag football practice"); // practice not discarded
    expect(rx.targetRpe).toBe(3);
    expect(rx.targetMinutes).toBe(30);
    expect(rx.recoveryEmphasis).toBe("high");
    expect(rx.reasoning).toContain("recovery");
  });

  it("taper phase, >2 days out → sharp practice (mixed, rpe6/60min, 'sharp' framing)", () => {
    const rx = prescribeFor(
      inputs({
        isTeamPractice: true,
        phase: "taper",
        upcoming: [event({ startsAt: "2026-05-07T10:00:00Z" })], // 72h out
      }),
    );
    expect(rx.intent).toBe("mixed");
    expect(rx.targetRpe).toBe(6);
    expect(rx.targetMinutes).toBe(60);
    expect(rx.reasoning).toContain("sharp");
  });

  it("taper phase, ≤2 days out → taper_final practice (lighter rpe5/45min)", () => {
    const rx = prescribeFor(
      inputs({
        isTeamPractice: true,
        phase: "taper",
        upcoming: [event({ startsAt: "2026-05-05T22:00:00Z" })], // 36h out → daysOut 2
      }),
    );
    expect(rx.intent).toBe("mixed");
    expect(rx.targetRpe).toBe(5);
    expect(rx.targetMinutes).toBe(45);
  });

  it("competition phase → the GAME is the session; practice yields", () => {
    const rx = prescribeFor(inputs({ isTeamPractice: true, phase: "competition" }));
    expect(rx.intent).toBe("competition");
  });

  it("ACWR danger overrides a practice day (safety precedence)", () => {
    const rx = prescribeFor(
      inputs({ isTeamPractice: true, phase: "accumulation", acwr: 1.8 }),
    );
    expect(rx.intent).toBe("rest");
  });

  it("readiness collapse overrides a practice day (recovery precedence)", () => {
    const rx = prescribeFor(
      inputs({ isTeamPractice: true, phase: "accumulation", readiness: 40 }),
    );
    expect(rx.intent).toBe("recovery");
  });
});

// =============================================================================
// NUTRITION SCALING
// =============================================================================

describe("prescribeFor — nutrition", () => {
  it("80kg sprint day: 4.5×80 carbs (short high-intensity, NOT glycogen-loading), 1.8×80 protein, 35ml/kg base water", () => {
    const rx = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"), // Tue → sprint
        bodyweightKg: 80,
      }),
    );
    expect(rx.nutrition.carbsG).toBe(Math.round(80 * 4.5));
    expect(rx.nutrition.proteinG).toBe(Math.round(80 * 1.8));
    expect(rx.nutrition.hydrationL).toBeCloseTo((80 * 35) / 1000, 1);
  });

  it("competition adds 1.5L water above baseline", () => {
    const rx = prescribeFor(
      inputs({
        phase: "competition",
        upcoming: [
          event({
            startsAt: "2026-05-09T07:00:00Z",
            endsAt: "2026-05-09T17:00:00Z",
          }),
        ],
        date: new Date("2026-05-09T12:00:00Z"),
        bodyweightKg: 80,
      }),
    );
    const baseline = (80 * 35) / 1000;
    expect(rx.nutrition.hydrationL).toBeGreaterThanOrEqual(baseline + 1.4);
  });

  it("heavy density adds 0.5L on training days", () => {
    const rxNormal = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"), // Tue
        bodyweightKg: 80,
        density14d: { totalGames: 0, hasPeakImportance: false },
      }),
    );
    const rxHeavy = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"),
        bodyweightKg: 80,
        density14d: { totalGames: 12, hasPeakImportance: true },
      }),
    );
    expect(rxHeavy.nutrition.hydrationL - rxNormal.nutrition.hydrationL).toBeCloseTo(0.5, 1);
  });

  it("rest day: 3 g/kg carbs (lower)", () => {
    const rx = prescribeFor(
      inputs({
        date: new Date("2026-05-10T10:00:00Z"), // Sun → rest
        bodyweightKg: 80,
      }),
    );
    expect(rx.nutrition.carbsG).toBe(80 * 3);
  });

  it("missing bodyweight falls back to 80kg", () => {
    const rxNull = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"),
        bodyweightKg: null,
      }),
    );
    const rx80 = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"),
        bodyweightKg: 80,
      }),
    );
    expect(rxNull.nutrition.carbsG).toBe(rx80.nutrition.carbsG);
    expect(rxNull.nutrition.proteinG).toBe(rx80.nutrition.proteinG);
  });
});

// =============================================================================
// META: REASONING IS NEVER EMPTY
// =============================================================================

describe("prescribeFor — reasoning contract", () => {
  it("every prescription has non-empty reasoning", () => {
    const phases = [
      "competition",
      "taper",
      "recovery",
      "accumulation",
      "transition",
    ] as const;
    for (const phase of phases) {
      const rx = prescribeFor(inputs({ phase }));
      expect(rx.reasoning.length).toBeGreaterThan(10);
    }
  });

  it("driverEvent is the next upcoming event when one exists", () => {
    const future = event({ startsAt: "2026-05-10T08:00:00Z" });
    const rx = prescribeFor(
      inputs({
        date: new Date("2026-05-04T08:00:00Z"),
        upcoming: [future],
      }),
    );
    expect(rx.driverEvent?.id).toBe(future.id);
  });

  it("hoursUntilNextEvent is null when nothing upcoming", () => {
    const rx = prescribeFor(inputs({ upcoming: [] }));
    expect(rx.hoursUntilNextEvent).toBeNull();
  });
});

// =============================================================================
// WEATHER GUARD
// =============================================================================

function weather(over: Partial<WeatherInput> = {}): WeatherInput {
  return {
    tempC: 18,
    apparentC: 18,
    condition: "clear",
    weatherCode: 1,
    precipMm: 0,
    windKmh: 5,
    suitability: "good",
    ...over,
  };
}

const tuesday = new Date("2026-05-05T10:00:00Z"); // accumulation → sprint

describe("prescribeFor — weather guard", () => {
  it("rain substitutes a sprint for an indoor strength session", () => {
    const rx = prescribeFor(
      inputs({ date: tuesday, weather: weather({ weatherCode: 63, precipMm: 2 }) }),
    );
    expect(rx.intent).toBe("strength");
    expect(rx.weatherAdjustment?.applied).toBe(true);
    expect(rx.weatherAdjustment?.action).toBe("substitute");
    expect(rx.weatherAdjustment?.originalIntent).toBe("sprint");
  });

  it("≥35°C relocates intense outdoor work to indoor mobility", () => {
    const rx = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 36, tempC: 34 }) }),
    );
    expect(rx.weatherAdjustment?.action).toBe("relocate");
    expect(rx.intent).toBe("mobility");
    expect(rx.weatherAdjustment?.heatLoadFactor).toBe(1.2);
  });

  it("thunderstorm hard-stops outdoor training", () => {
    const rx = prescribeFor(
      inputs({ date: tuesday, weather: weather({ weatherCode: 96 }) }),
    );
    expect(rx.weatherAdjustment?.action).toBe("stop");
    expect(rx.intent).toBe("recovery");
  });

  it("≥32°C scales volume and applies a heat load factor (intent unchanged)", () => {
    const rx = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 33 }) }),
    );
    expect(rx.intent).toBe("sprint");
    expect(rx.weatherAdjustment?.action).toBe("scale");
    expect(rx.weatherAdjustment?.heatLoadFactor).toBe(1.1);
    expect(rx.targetMinutes).toBeLessThan(60); // 60 → 48
    expect(rx.sprintReps).toBeLessThan(10);
  });

  it("coach override bypasses the guard (keeps the planned session)", () => {
    const rx = prescribeFor(
      inputs({
        date: tuesday,
        weather: weather({ apparentC: 36 }),
        coachOverride: true,
      }),
    );
    expect(rx.intent).toBe("sprint"); // not relocated
    expect(rx.weatherAdjustment?.applied).toBe(false);
  });

  it("weather-agnostic intents (indoor strength) are untouched", () => {
    const monday = new Date("2026-05-04T10:00:00Z"); // → strength
    const rx = prescribeFor(
      inputs({ date: monday, weather: weather({ weatherCode: 96 }) }),
    );
    expect(rx.intent).toBe("strength");
    expect(rx.weatherAdjustment).toBeUndefined();
  });

  it("benign weather leaves no adjustment; null weather is a no-op", () => {
    const benign = prescribeFor(inputs({ date: tuesday, weather: weather() }));
    expect(benign.weatherAdjustment).toBeUndefined();
    const none = prescribeFor(inputs({ date: tuesday, weather: null }));
    expect(none.weatherAdjustment).toBeUndefined();
  });
});

// =============================================================================
// V2.4 — HEAT/COLD ACCLIMATIZATION GUARD
//
// American Samoa to Mongolia: the same raw apparent temperature is far more
// dangerous for an athlete who landed yesterday than one who's lived there
// year-round. `acclimatizationDay` (days since arrival, from
// athlete_travel_log) tightens every threshold — heat down, cold up —
// while the athlete is still adapting, and decays to zero (byte-identical
// to V1) by day 14.
// =============================================================================
describe("prescribeFor — V2.4 acclimatization guard", () => {
  it("day-0 arrival: 30°C (normally just 'warm', unchanged) now scales volume", () => {
    const acclimatized = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 30 }) }),
    );
    expect(acclimatized.weatherAdjustment?.action).toBe("none");

    const justArrived = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 30 }), acclimatizationDay: 0 }),
    );
    expect(justArrived.weatherAdjustment?.action).toBe("scale");
    expect(justArrived.weatherAdjustment?.reason).toMatch(/still acclimatizing/i);
  });

  it("day-0 arrival: 32°C (normally 'scale') now relocates indoors (heatAvoidEff = 35-4 = 31)", () => {
    const acclimatized = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 32 }) }),
    );
    expect(acclimatized.weatherAdjustment?.action).toBe("scale");
    expect(acclimatized.intent).toBe("sprint");

    const justArrived = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 32 }), acclimatizationDay: 0 }),
    );
    expect(justArrived.weatherAdjustment?.action).toBe("relocate");
    expect(justArrived.intent).toBe("mobility");
  });

  it("day-0 arrival at a COLD destination: -3°C (normally just 'cold muscles') now substitutes indoors", () => {
    const acclimatized = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: -3, tempC: -3 }) }),
    );
    expect(acclimatized.weatherAdjustment?.action).toBe("none");
    expect(acclimatized.intent).toBe("sprint");

    const justArrived = prescribeFor(
      inputs({
        date: tuesday,
        weather: weather({ apparentC: -3, tempC: -3 }),
        acclimatizationDay: 0,
      }),
    );
    expect(justArrived.weatherAdjustment?.action).toBe("substitute");
    expect(justArrived.intent).toBe("mobility");
    expect(justArrived.weatherAdjustment?.reason).toMatch(/still acclimatizing/i);
  });

  it("the shift decays with adaptation — day 7 is intermediate, day 14 is fully acclimatized (== V1)", () => {
    // 30°C: day-0 scales (see above). By day 14 the shift is fully gone —
    // identical to the no-acclimatization-data baseline.
    const day14 = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 30 }), acclimatizationDay: 14 }),
    );
    expect(day14.weatherAdjustment?.action).toBe("none");

    // Day 7 (halfway through the 14-day window, shift = 2°C) still isn't
    // enough to push 30°C (heatReduceEff = 32-2 = 30) past caution into scale
    // territory at exactly the boundary — assert the boundary math directly
    // via a value that only trips with the larger day-0 shift.
    const day7 = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 30 }), acclimatizationDay: 7 }),
    );
    expect(day7.weatherAdjustment?.action).toBe("scale");
  });

  it("null/undefined acclimatizationDay is a no-op (identical to omitting it entirely)", () => {
    const omitted = prescribeFor(inputs({ date: tuesday, weather: weather({ apparentC: 30 }) }));
    const explicitNull = prescribeFor(
      inputs({ date: tuesday, weather: weather({ apparentC: 30 }), acclimatizationDay: null }),
    );
    expect(explicitNull.weatherAdjustment?.action).toBe(omitted.weatherAdjustment?.action);
  });
});

// =============================================================================
// V2.4 — ARRIVAL-DAY LOAD CAP
//
// A ≥3h same-day arrival (declared via athlete_travel_log) caps the session
// to activation only — the travel itself is a fatigue cost the base plan
// hasn't accounted for. Closes the gap flagged "not built" in
// docs/v2/V2.1-plan-travel.md.
// =============================================================================
describe("prescribeFor — V2.4 arrival-day load cap", () => {
  it("a ≥3h same-day arrival caps a sprint day to activation-only mobility", () => {
    const rx = prescribeFor(inputs({ date: tuesday, arrivalDayTravelHours: 5 }));
    expect(rx.intent).toBe("mobility");
    expect(rx.intentLabel).toBe("Arrival-day activation");
    expect(rx.targetRpe).toBeLessThanOrEqual(4);
    expect(rx.targetMinutes).toBeLessThanOrEqual(30);
    expect(rx.sprintReps).toBe(0);
    expect(rx.reasoning).toMatch(/5h of travel today/i);
  });

  it("exactly 3h triggers the cap (boundary is inclusive)", () => {
    const rx = prescribeFor(inputs({ date: tuesday, arrivalDayTravelHours: 3 }));
    expect(rx.intent).toBe("mobility");
  });

  it("under 3h of travel does not trigger the cap", () => {
    const rx = prescribeFor(inputs({ date: tuesday, arrivalDayTravelHours: 2 }));
    expect(rx.intent).toBe("sprint");
  });

  it("null/undefined arrivalDayTravelHours is a no-op", () => {
    const rx = prescribeFor(inputs({ date: tuesday }));
    expect(rx.intent).toBe("sprint");
  });

  it("does not touch a game day even with a long same-day arrival (organiser's call, exempt)", () => {
    const rx = prescribeFor(
      inputs({
        phase: "competition",
        upcoming: [
          event({ startsAt: "2026-05-05T07:00:00Z", endsAt: "2026-05-05T17:00:00Z" }),
        ],
        date: tuesday,
        arrivalDayTravelHours: 10,
      }),
    );
    expect(rx.intent).toBe("competition");
  });

  it("does not double-downgrade an already-taper-prime opener", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        upcoming: [event({ startsAt: "2026-05-08T20:00:00Z" })],
        date: new Date("2026-05-08T08:00:00Z"), // 12h before → taper-prime
        arrivalDayTravelHours: 8,
      }),
    );
    expect(rx.intent).toBe("taper-prime");
  });

  it("runs after the weather guard — a thunderstorm's stop still wins over the mobility cap", () => {
    const rx = prescribeFor(
      inputs({
        date: tuesday,
        weather: weather({ weatherCode: 96 }),
        arrivalDayTravelHours: 6,
      }),
    );
    expect(rx.intent).toBe("recovery"); // weather "stop", not the arrival-day "mobility"
  });
});

// =============================================================================
// MACRO SEASON PHASE
// =============================================================================

describe("macroPhaseFor — athlete-declared windows", () => {
  it("resolves a specific span", () => {
    const w = [{ phase: "inseason" as const, from: "2025-09-01", to: "2026-04-30" }];
    expect(macroPhaseFor(new Date("2026-03-01T10:00:00Z"), w)).toBe("inseason");
    expect(macroPhaseFor(new Date("2026-07-01T10:00:00Z"), w)).toBeNull();
  });

  it("resolves a recurring annual window, including year-end wrap", () => {
    const w = [{ phase: "inseason" as const, from: "09-01", to: "04-30" }];
    expect(macroPhaseFor(new Date("2026-02-15T10:00:00Z"), w)).toBe("inseason");
    expect(macroPhaseFor(new Date("2026-06-15T10:00:00Z"), w)).toBeNull();
  });

  it("returns null when no window covers the date (generic fallback)", () => {
    expect(macroPhaseFor(new Date("2026-07-20T10:00:00Z"), [])).toBeNull();
    expect(macroPhaseFor(new Date("2026-07-20T10:00:00Z"), null)).toBeNull();
  });
});

describe("prescribeFor — season macro-phase shapes the non-event week", () => {
  const monday = new Date("2026-05-04T10:00:00Z");

  it("off-season biases toward strength & conditioning", () => {
    const rx = prescribeFor(inputs({ date: monday, seasonPhase: "offseason" }));
    expect(rx.intent).toBe("strength");
    expect(rx.seasonPhase).toBe("offseason");
    expect(rx.reasoning).toMatch(/off-season/i);
  });

  it("in-season maintains + sharpens skills (a Tuesday is technical, not a sprint peak)", () => {
    const rx = prescribeFor(inputs({ date: tuesday, seasonPhase: "inseason" }));
    expect(rx.intent).toBe("technical");
    expect(rx.reasoning).toMatch(/in-season/i);
  });

  it("transition is active rest / base", () => {
    const rx = prescribeFor(inputs({ date: tuesday, seasonPhase: "transition" }));
    expect(rx.intent).toBe("mobility");
  });

  it("pre-season uses the generic progressive build (Tuesday → sprint)", () => {
    const rx = prescribeFor(inputs({ date: tuesday, seasonPhase: "preseason" }));
    expect(rx.intent).toBe("sprint");
  });

  it("an event micro-phase still overrides the macro season (taper-prime near a game)", () => {
    const rx = prescribeFor(
      inputs({
        date: new Date("2026-05-08T20:00:00Z"), // 12h before
        seasonPhase: "offseason",
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
      }),
    );
    expect(rx.intent).toBe("taper-prime");
  });
});

// =============================================================================
// SANITY: pure helpers exposed for cross-validation
// =============================================================================

describe("__periodization__ exports", () => {
  it("exposes carb table and helpers for verification", () => {
    expect(__periodization__.CARB_PER_KG.competition).toBeGreaterThan(
      __periodization__.CARB_PER_KG.rest,
    );
    expect(typeof __periodization__.prescribeFor).toBe("function");
  });
});

// =============================================================================
// WEATHER GUARD — end-to-end: a rainy payload moves a sprint indoors
// =============================================================================

describe("prescribeFor — weather guard moves a rainy sprint indoors", () => {
  // 2026-05-05 is a Tuesday — accumulation picks sprint on Tue/Fri.
  const sprintDay = new Date("2026-05-05T10:00:00Z");

  function baseSprint() {
    return prescribeFor(inputs({ phase: "accumulation", date: sprintDay }));
  }

  it("sanity: the base day is a sprint with no weather", () => {
    expect(baseSprint().intent).toBe("sprint");
  });

  it("rain (precip + WMO rain code, benign temp) substitutes sprint → strength", () => {
    const rainy: WeatherInput = {
      tempC: 15,
      apparentC: 15, // benign — only the wet branch should fire
      condition: "rain",
      weatherCode: 61, // WMO rain (>= RAIN_WEATHER_CODE, < storm)
      precipMm: 3, // > RAIN_PRECIP_MM (0.5)
      windKmh: 10,
    };
    const rx = prescribeFor(
      inputs({ phase: "accumulation", date: sprintDay, weather: rainy }),
    );
    expect(rx.intent).toBe("strength"); // moved indoors off the wet grass
    expect(rx.weatherAdjustment?.applied).toBe(true);
    expect(rx.weatherAdjustment?.action).toBe("substitute");
    expect(rx.weatherAdjustment?.originalIntent).toBe("sprint");
    expect(rx.weatherAdjustment?.reason).toMatch(/wet|slip|indoor/i);
  });
});

// =============================================================================
// CNS RECOVERY SPACING — no back-to-back high-CNS days
// =============================================================================

describe("prescribeFor — sprint CNS recovery spacing", () => {
  const sprintDay = new Date("2026-05-05T10:00:00Z"); // Tuesday → accumulation sprint

  it("blocks a sprint within 48h of the last sprint (→ technique)", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        date: sprintDay,
        recentSessions: [{ at: "2026-05-04T10:00:00Z", type: "sprint" }], // 24h ago
      }),
    );
    expect(rx.intent).toBe("technical");
    expect(rx.sprintReps).toBe(0);
    expect(rx.cnsRecoveryAdjustment?.originalIntent).toBe("sprint");
    expect(rx.cnsRecoveryAdjustment?.hoursSinceLastHighCns).toBe(24);
    expect(rx.reasoning).toMatch(/CNS recovery/i);
  });

  it("allows a sprint once the 48h window has passed", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        date: sprintDay,
        recentSessions: [{ at: "2026-05-03T08:00:00Z", type: "sprint" }], // 50h ago
      }),
    );
    expect(rx.intent).toBe("sprint");
    expect(rx.cnsRecoveryAdjustment ?? null).toBeNull();
  });

  it("a non-CNS recent session does not block a sprint", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        date: sprintDay,
        recentSessions: [{ at: "2026-05-04T10:00:00Z", type: "strength" }], // 24h ago, not CNS
      }),
    );
    expect(rx.intent).toBe("sprint");
  });

  it("physio precedence still overrides CNS spacing", () => {
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        date: sprintDay,
        recentSessions: [{ at: "2026-05-04T10:00:00Z", type: "sprint" }],
        activeRestrictions: {
          restrictsSprint: true,
          severity: "severe",
          regions: ["hamstring"],
        },
      }),
    );
    expect(rx.intent).toBe("recovery"); // injury wins over CNS-spacing's "technical"
    expect(rx.injuryAdjustment).toBeTruthy();
  });

  it("composes with weather: recent sprint + rain still ends up indoors, never a sprint", () => {
    const rainy: WeatherInput = {
      tempC: 15,
      apparentC: 15,
      condition: "rain",
      weatherCode: 61,
      precipMm: 3,
      windKmh: 10,
    };
    const rx = prescribeFor(
      inputs({
        phase: "accumulation",
        date: sprintDay,
        recentSessions: [{ at: "2026-05-04T10:00:00Z", type: "sprint" }],
        weather: rainy,
      }),
    );
    expect(rx.intent).not.toBe("sprint");
    expect(["technical", "strength", "mobility", "recovery"]).toContain(rx.intent);
  });
});

// =============================================================================
// INJURY / PHYSIO GUARD (spec law: injury precedence over training)
// =============================================================================

describe("prescribeFor — injury guard", () => {
  const sprintDay = new Date("2026-05-05T10:00:00Z"); // Tuesday → accumulation sprint
  const strengthDay = new Date("2026-05-04T10:00:00Z"); // Monday → strength

  const restriction = (
    severity: "minor" | "moderate" | "severe",
    over: Partial<{ restrictsSprint: boolean; regions: string[] }> = {},
  ) => ({
    restrictsSprint: true,
    severity,
    regions: ["hamstring"],
    ...over,
  });

  it("severe restriction forces recovery-only (RPE 3 / 30min / no sprints)", () => {
    const rx = prescribeFor(
      inputs({ date: sprintDay, activeRestrictions: restriction("severe") }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.targetRpe).toBe(3);
    expect(rx.targetMinutes).toBe(30);
    expect(rx.sprintReps).toBe(0);
    expect(rx.strengthSets).toBe(0);
    expect(rx.injuryAdjustment?.severity).toBe("severe");
    expect(rx.injuryAdjustment?.regions).toEqual(["hamstring"]);
    expect(rx.reasoning).toMatch(/injury precedence/i);
  });

  it("moderate restriction pulls sprints and caps volume (≤40min, ≤3 sets)", () => {
    const rx = prescribeFor(
      inputs({ date: sprintDay, activeRestrictions: restriction("moderate") }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.targetRpe).toBe(3);
    expect(rx.targetMinutes).toBeLessThanOrEqual(40);
    expect(rx.strengthSets).toBeLessThanOrEqual(3);
    expect(rx.sprintReps).toBe(0);
    expect(rx.injuryAdjustment?.severity).toBe("moderate");
  });

  it("minor tightness on a sprint day keeps training but swaps to mobility (RPE ≤6)", () => {
    const rx = prescribeFor(
      inputs({ date: sprintDay, activeRestrictions: restriction("minor") }),
    );
    expect(rx.intent).toBe("mobility");
    expect(rx.sprintReps).toBe(0);
    expect(rx.targetRpe).toBeLessThanOrEqual(6);
    expect(rx.injuryAdjustment?.severity).toBe("minor");
  });

  it("minor tightness on a day with no sprint work is a no-op", () => {
    const rx = prescribeFor(
      inputs({ date: strengthDay, activeRestrictions: restriction("minor") }),
    );
    expect(rx.intent).toBe("strength");
    expect(rx.injuryAdjustment ?? null).toBeNull();
  });

  it("restrictions that do not restrict sprinting are a no-op", () => {
    const rx = prescribeFor(
      inputs({
        date: sprintDay,
        activeRestrictions: restriction("severe", { restrictsSprint: false }),
      }),
    );
    expect(rx.intent).toBe("sprint");
    expect(rx.injuryAdjustment ?? null).toBeNull();
  });

  it("never overrides a competition day (a game is a game)", () => {
    const rx = prescribeFor(
      inputs({
        phase: "competition",
        upcoming: [
          event({
            startsAt: "2026-05-09T07:00:00Z",
            endsAt: "2026-05-09T17:00:00Z",
          }),
        ],
        date: new Date("2026-05-09T12:00:00Z"),
        activeRestrictions: restriction("severe"),
      }),
    );
    expect(rx.intent).toBe("competition");
  });

  it("injury precedence beats the weather guard's substitution", () => {
    // Rain would substitute the sprint with indoor strength; the severe
    // restriction must still win and force recovery.
    const rx = prescribeFor(
      inputs({
        date: sprintDay,
        weather: weather({ weatherCode: 63, precipMm: 2 }),
        activeRestrictions: restriction("severe"),
      }),
    );
    expect(rx.intent).toBe("recovery");
    expect(rx.injuryAdjustment).toBeTruthy();
  });
});

// =============================================================================
// AGE-SCALED CNS RECOVERY — older athletes get more spacing, younger unchanged
// =============================================================================

describe("cnsRecoveryHoursForAge", () => {
  const f = __periodization__.cnsRecoveryHoursForAge;

  it("keeps the 48h base for under-35s and missing/implausible ages", () => {
    expect(f(19)).toBe(48);
    expect(f(34)).toBe(48);
    expect(f(null)).toBe(48);
    expect(f(undefined)).toBe(48);
    expect(f(NaN)).toBe(48);
    expect(f(10)).toBe(48); // implausible → base
  });

  it("lengthens monotonically with age (35–39 → 60h, 40+ → 72h)", () => {
    expect(f(35)).toBe(60);
    expect(f(38)).toBe(60);
    expect(f(40)).toBe(72);
    expect(f(52)).toBe(72);
    // never shorter than the base, always non-decreasing
    expect(f(40)).toBeGreaterThanOrEqual(f(35));
    expect(f(35)).toBeGreaterThanOrEqual(f(34));
  });
});

describe("prescribeFor — age-scaled CNS spacing (19 vs 38)", () => {
  const sprintDay = new Date("2026-05-05T10:00:00Z"); // Tue → accumulation sprint
  // a sprint 60h before today: inside a 38yo's 72h window, outside a 19yo's 48h
  const sprint60hAgo = [{ at: "2026-05-02T22:00:00Z", type: "sprint" }];

  it("a 38yo is still recovering at 60h post-sprint → today downgraded", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", date: sprintDay, ageYears: 38, recentSessions: sprint60hAgo }),
    );
    expect(rx.intent).toBe("technical");
    expect(rx.cnsRecoveryAdjustment?.windowHours).toBe(60);
  });

  it("a 19yo has cleared the 48h window at 60h → sprint allowed", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", date: sprintDay, ageYears: 19, recentSessions: sprint60hAgo }),
    );
    expect(rx.intent).toBe("sprint");
    expect(rx.cnsRecoveryAdjustment ?? null).toBeNull();
  });

  it("no age provided behaves exactly like the 48h base (younger never under-rested)", () => {
    const rx = prescribeFor(
      inputs({ phase: "accumulation", date: sprintDay, recentSessions: sprint60hAgo }),
    );
    expect(rx.intent).toBe("sprint"); // 60h > 48h base → cleared
  });
});

// =============================================================================
// TOURNAMENT CONGESTION — a congested single day trips heavy-density handling
// =============================================================================

describe("prescribeFor — tournament congestion (peak-day games)", () => {
  const tuesday = new Date("2026-05-05T10:00:00Z"); // accumulation training day

  it("8 games over 2 days (4/day, total 8 < 10) still triggers heavy density", () => {
    // Heavy density adds +0.5L fluid on a training day — use that as the signal.
    const spread = prescribeFor(
      inputs({
        date: tuesday,
        bodyweightKg: 80,
        density14d: { totalGames: 8, hasPeakImportance: false, peakDayGameCount: 1 },
      }),
    );
    const congested = prescribeFor(
      inputs({
        date: tuesday,
        bodyweightKg: 80,
        density14d: { totalGames: 8, hasPeakImportance: false, peakDayGameCount: 4 },
      }),
    );
    expect(congested.nutrition.hydrationL - spread.nutrition.hydrationL).toBeCloseTo(0.5, 1);
  });

  it("a non-congested low total (peak 2/day) does NOT trip heavy density", () => {
    const a = prescribeFor(
      inputs({ date: tuesday, bodyweightKg: 80, density14d: { totalGames: 4, hasPeakImportance: false, peakDayGameCount: 2 } }),
    );
    const b = prescribeFor(
      inputs({ date: tuesday, bodyweightKg: 80, density14d: { totalGames: 4, hasPeakImportance: false, peakDayGameCount: 1 } }),
    );
    expect(a.nutrition.hydrationL).toBeCloseTo(b.nutrition.hydrationL, 1);
  });
});

// =============================================================================
// HEAT FLUID — a hot day adds fluid (the documented-but-unimplemented bonus)
// =============================================================================

describe("prescribeFor — heat adds fluid", () => {
  const tuesday = new Date("2026-05-05T10:00:00Z");

  it("apparent ≥ 28°C adds +0.5L over a cool day", () => {
    const cool = prescribeFor(inputs({ date: tuesday, bodyweightKg: 80, weather: weather({ apparentC: 18 }) }));
    const hot = prescribeFor(inputs({ date: tuesday, bodyweightKg: 80, weather: weather({ apparentC: 30, tempC: 30 }) }));
    expect(hot.nutrition.hydrationL - cool.nutrition.hydrationL).toBeCloseTo(0.5, 1);
  });
});

// =============================================================================
// SEASON PHASES — peak (sharp) and post-season (regeneration), split seasons
// =============================================================================

describe("prescribeFor — peak & post-season phases", () => {
  const monday = new Date("2026-05-04T10:00:00Z"); // getDay 1

  it("peak is sharp & low-volume (a Monday is a quality sprint, not strength)", () => {
    const peak = prescribeFor(inputs({ date: monday, seasonPhase: "peak" }));
    const inseason = prescribeFor(inputs({ date: monday, seasonPhase: "inseason" }));
    expect(peak.intent).toBe("sprint"); // quality
    expect(inseason.intent).toBe("strength"); // maintenance volume
    expect(peak.seasonPhase).toBe("peak");
  });

  it("post-season is active regeneration (Tuesday → mobility), same shape as transition", () => {
    const post = prescribeFor(inputs({ date: tuesday, seasonPhase: "postseason" }));
    const trans = prescribeFor(inputs({ date: tuesday, seasonPhase: "transition" }));
    expect(post.intent).toBe("mobility");
    expect(post.intent).toBe(trans.intent);
  });

  it("a split season resolves each day to its declared window (in-season vs off-season gap)", () => {
    const windows = [
      { phase: "inseason" as const, from: "03-01", to: "07-15" },
      { phase: "offseason" as const, from: "07-16", to: "08-14" }, // mid-season gap
      { phase: "inseason" as const, from: "08-15", to: "10-31" },
      { phase: "postseason" as const, from: "11-01", to: "11-30" },
      { phase: "offseason" as const, from: "12-01", to: "02-28" },
    ];
    expect(macroPhaseFor(new Date("2026-05-10T10:00:00Z"), windows)).toBe("inseason"); // spring block
    expect(macroPhaseFor(new Date("2026-07-25T10:00:00Z"), windows)).toBe("offseason"); // mid gap
    expect(macroPhaseFor(new Date("2026-09-10T10:00:00Z"), windows)).toBe("inseason"); // autumn block
    expect(macroPhaseFor(new Date("2026-11-15T10:00:00Z"), windows)).toBe("postseason");
    expect(macroPhaseFor(new Date("2026-01-10T10:00:00Z"), windows)).toBe("offseason"); // winter
  });
});

// =============================================================================
// POSITION EMPHASIS — accessory/prehab focus by role (additive, not load-changing)
// =============================================================================

describe("prescribeFor — position emphasis", () => {
  const tuesday = new Date("2026-05-05T10:00:00Z"); // sprint day (non-rest)
  const sunday = new Date("2026-05-10T10:00:00Z"); // rest day

  it("QB gets throwing-shoulder / rotational focus", () => {
    const rx = prescribeFor(inputs({ date: tuesday, position: "qb" }));
    expect(rx.positionEmphasis?.position).toBe("qb");
    expect(rx.positionEmphasis?.note).toMatch(/shoulder|throw/i);
    expect(rx.positionEmphasis?.focus.join(" ")).toMatch(/cuff|scap|rotation/i);
  });

  it("WR/DB gets hamstring + deceleration focus", () => {
    const rx = prescribeFor(inputs({ date: tuesday, position: "wr_db" }));
    expect(rx.positionEmphasis?.position).toBe("wr_db");
    expect(rx.positionEmphasis?.focus.join(" ")).toMatch(/hamstring|decel/i);
  });

  it("center/rusher gets snapping wrist/shoulder + brace focus", () => {
    const rx = prescribeFor(inputs({ date: tuesday, position: "center_rusher" }));
    expect(rx.positionEmphasis?.position).toBe("center");
    expect(rx.positionEmphasis?.note).toMatch(/snap/i);
  });

  it("does NOT change the core intent or load (additive only)", () => {
    const withPos = prescribeFor(inputs({ date: tuesday, position: "qb" }));
    const without = prescribeFor(inputs({ date: tuesday }));
    expect(withPos.intent).toBe(without.intent);
    expect(withPos.targetRpe).toBe(without.targetRpe);
    expect(withPos.sprintReps).toBe(without.sprintReps);
  });

  it("no position, or a rest day, yields no emphasis", () => {
    expect(prescribeFor(inputs({ date: tuesday })).positionEmphasis ?? null).toBeNull();
    expect(prescribeFor(inputs({ date: sunday, position: "qb" })).positionEmphasis ?? null).toBeNull();
  });
});

// =============================================================================
// REGION-AWARE INJURY × POSITION — a shoulder issue pulls throwing, not running
// =============================================================================

describe("prescribeFor — throwing restriction overrides QB/center emphasis", () => {
  const tuesday = new Date("2026-05-05T10:00:00Z"); // sprint day

  it("a QB shoulder issue leaves running intact but flags the throwing arm", () => {
    const rx = prescribeFor(
      inputs({
        date: tuesday,
        position: "qb",
        activeRestrictions: { restrictsSprint: false, restrictsThrowing: true, severity: "moderate", regions: ["shoulder"] },
      }),
    );
    expect(rx.intent).toBe("sprint"); // running unaffected — shoulder doesn't restrict sprinting
    expect(rx.positionEmphasis?.restricted).toBe(true);
    expect(rx.positionEmphasis?.note).toMatch(/skip throwing|protect/i);
  });

  it("without a throwing restriction the QB emphasis is the normal throwing-care one", () => {
    const rx = prescribeFor(inputs({ date: tuesday, position: "qb" }));
    expect(rx.positionEmphasis?.restricted ?? false).toBe(false);
    expect(rx.positionEmphasis?.note).toMatch(/throw/i);
  });

  it("a center snap/shoulder issue flags snapping", () => {
    const rx = prescribeFor(
      inputs({
        date: tuesday,
        position: "center_rusher",
        activeRestrictions: { restrictsSprint: false, restrictsThrowing: true, severity: "minor", regions: ["wrist"] },
      }),
    );
    expect(rx.positionEmphasis?.restricted).toBe(true);
    expect(rx.positionEmphasis?.note).toMatch(/snapping/i);
  });
});

// =============================================================================
// POSITION VOLUME — worst-case demands surfaced from the tunable reference
// =============================================================================

describe("prescribeFor — position worst-case volume targets", () => {
  const tuesday = new Date("2026-05-05T10:00:00Z");

  it("QB shows the throws/session worst case", () => {
    const v = prescribeFor(inputs({ date: tuesday, position: "qb" })).positionEmphasis?.volume;
    expect(v?.targets.join(" ")).toMatch(/throws\/session/);
    expect(v?.worstCase).toMatch(/throw/i);
  });

  it("WR/DB shows catches/week, backpedals and sprints/game", () => {
    const v = prescribeFor(inputs({ date: tuesday, position: "wr_db" })).positionEmphasis?.volume;
    const s = v?.targets.join(" ") ?? "";
    expect(s).toMatch(/catches\/week/);
    expect(s).toMatch(/backpedals/);
    expect(s).toMatch(/sprints\/game/);
  });

  it("center shows snaps/session + catches + sprints", () => {
    const v = prescribeFor(inputs({ date: tuesday, position: "center_rusher" })).positionEmphasis?.volume;
    const s = v?.targets.join(" ") ?? "";
    expect(s).toMatch(/snaps\/session/);
    expect(s).toMatch(/sprints\/game/);
  });

  it("volume still shows when the arm is injury-restricted (awareness)", () => {
    const v = prescribeFor(inputs({
      date: tuesday, position: "qb",
      activeRestrictions: { restrictsSprint: false, restrictsThrowing: true, severity: "moderate", regions: ["shoulder"] },
    })).positionEmphasis?.volume;
    expect(v?.targets.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TEAM PRACTICE DAY — practice is the session, even inside a game taper
// (regression: a declared practice day was being overridden by a sprint taper)
// =============================================================================

describe("prescribeFor — team practice day", () => {
  const wed = new Date("2026-05-06T10:00:00Z");

  it("accumulation: a practice day is the session (light extra work)", () => {
    const rx = prescribeFor(inputs({ date: wed, phase: "accumulation", isTeamPractice: true }));
    expect(rx.intentLabel).toBe("Flag football practice");
    expect(rx.reasoning).toMatch(/practice/i);
  });

  it("TAPER: a practice day stays practice, kept sharp — NOT replaced by a standalone sprint", () => {
    const rx = prescribeFor(
      inputs({
        date: wed,
        phase: "taper",
        isTeamPractice: true,
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })], // ~3 days out
      }),
    );
    expect(rx.intentLabel).toBe("Flag football practice");
    expect(rx.reasoning).toMatch(/sharp, not heavy/i);
    expect(rx.targetRpe).toBeLessThan(7); // tapered, not a full practice
  });

  it("without a declared practice day, the taper is the normal sharp sprint", () => {
    const rx = prescribeFor(
      inputs({
        date: wed,
        phase: "taper",
        isTeamPractice: false,
        upcoming: [event({ startsAt: "2026-05-09T08:00:00Z" })],
      }),
    );
    expect(rx.intentLabel).not.toBe("Flag football practice");
  });
});

// =============================================================================
// FINDING 1.1 — a practice day on a post-game RECOVERY phase is honoured at
// recovery intensity, not silently dropped to a generic recovery session.
// =============================================================================

describe("prescribeFor — practice day on a recovery phase (finding 1.1)", () => {
  const mon = new Date("2026-05-04T10:00:00Z");

  it("honours the practice (label) at recovery intensity instead of dropping it", () => {
    const rx = prescribeFor(inputs({ date: mon, phase: "recovery", isTeamPractice: true }));
    expect(rx.intentLabel).toBe("Flag football practice");
    expect(rx.intent).toBe("recovery");
    expect(rx.targetRpe).toBe(3); // same intensity as the recovery default — safe
    expect(rx.reasoning).toMatch(/recovery/i);
    expect(rx.reasoning).toMatch(/practice/i);
  });

  it("without a declared practice, a recovery phase still emits the generic recovery session", () => {
    const rx = prescribeFor(inputs({ date: mon, phase: "recovery", isTeamPractice: false }));
    expect(rx.intentLabel).not.toBe("Flag football practice");
    expect(rx.intent).toBe("recovery");
  });
});
