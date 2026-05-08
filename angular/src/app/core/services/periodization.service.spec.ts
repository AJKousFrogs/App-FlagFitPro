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
import { prescribeFor, __periodization__ } from "./periodization.service";
import {
  PeriodizationInputs,
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
