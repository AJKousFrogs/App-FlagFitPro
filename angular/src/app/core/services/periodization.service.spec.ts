/**
 * Periodization Regression Tests
 *
 * Locks the prescription algorithm. `prescribeFor` is pure — same inputs
 * always yield the same prescription. These tests are the contract that
 * every future change must justify breaking.
 *
 * If a test here changes, update the corresponding section in
 * `docs/CALCULATION_SPEC.md` (or the future PRESCRIPTION_SPEC).
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
// NUTRITION SCALING
// =============================================================================

describe("prescribeFor — nutrition", () => {
  it("80kg sprint day: 6×80 carbs, 1.8×80 protein, 35ml/kg base water", () => {
    const rx = prescribeFor(
      inputs({
        date: new Date("2026-05-05T10:00:00Z"), // Tue → sprint
        bodyweightKg: 80,
      }),
    );
    expect(rx.nutrition.carbsG).toBe(80 * 6);
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
    expect(none.intent).toBe("sprint");
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
