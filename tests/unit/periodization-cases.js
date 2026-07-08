// Shared golden-parity fixture matrix for the periodization engine.
//
// These PeriodizationInputs cases exercise every decision branch and guard of
// `prescribeFor` (base phase/season selection, ACWR zones, readiness, injury/
// physio precedence, weather, acclimatization, arrival-day cap, CNS recovery
// spacing, practice days, coach override). The SAME matrix is fed to:
//   1. the client engine (angular .../periodization-engine.ts) — golden reference,
//   2. the backend port (Batch 3) — asserted byte-for-byte equal to the client.
//
// If a case changes an output, that is a behavior change and must be intentional.
// Fixtures are pure data (Date + plain objects) so both vitest suites can import them.

const BASE = {
  date: new Date("2026-07-15T08:00:00Z"), // Wednesday
  phase: "accumulation",
  upcoming: [],
  lastEvent: null,
  acwr: 1.0,
  readiness: 70,
  bodyweightKg: 80,
  density14d: null,
  seasonPhase: "inseason",
};

const HEAT = {
  tempC: 36,
  apparentC: 39,
  condition: "hot",
  weatherCode: 0,
  precipMm: 0,
  windKmh: 5,
};
const COLD = {
  tempC: -6,
  apparentC: -9,
  condition: "cold",
  weatherCode: 0,
  precipMm: 0,
  windKmh: 12,
};
const STORM = {
  tempC: 20,
  apparentC: 20,
  condition: "thunderstorm",
  weatherCode: 96,
  precipMm: 6,
  windKmh: 35,
};

const RAW_CASES = [
  ["baseline", {}],
  // ACWR risk zones
  ["acwr-danger", { acwr: 1.6 }],
  ["acwr-elevated", { acwr: 1.35 }],
  ["acwr-under", { acwr: 0.7 }],
  ["acwr-null", { acwr: null }],
  // Readiness
  ["readiness-low", { readiness: 40 }],
  ["readiness-high", { readiness: 92 }],
  ["readiness-null", { readiness: null }],
  // Base phases
  ["phase-competition", { phase: "competition" }],
  ["phase-taper", { phase: "taper" }],
  ["phase-recovery", { phase: "recovery" }],
  ["phase-transition", { phase: "transition" }],
  ["phase-travel", { phase: "travel" }],
  // Season phases
  ["season-offseason", { seasonPhase: "offseason" }],
  ["season-preseason", { seasonPhase: "preseason" }],
  ["season-peak", { seasonPhase: "peak" }],
  ["season-postseason", { seasonPhase: "postseason" }],
  // Injury / physio precedence (spec law)
  [
    "injury-severe-sprint",
    {
      activeRestrictions: {
        restrictsSprint: true,
        severity: "severe",
        regions: ["hamstring"],
      },
    },
  ],
  [
    "injury-throwing-qb",
    {
      position: "qb",
      activeRestrictions: {
        restrictsSprint: false,
        restrictsThrowing: true,
        severity: "moderate",
        regions: ["shoulder"],
      },
    },
  ],
  // Weather guard
  ["weather-heat", { weather: HEAT }],
  ["weather-cold", { weather: COLD }],
  ["weather-storm", { weather: STORM }],
  ["weather-storm-coach-override", { weather: STORM, coachOverride: true }],
  ["acclimatization-heat-arrival", { weather: HEAT, acclimatizationDay: 1 }],
  // Arrival-day cap (V2.4)
  ["arrival-day-long-trip", { arrivalDayTravelHours: 5 }],
  // CNS recovery spacing — age-scaled window
  [
    "cns-recent-sprint-young",
    {
      ageYears: 19,
      recentSessions: [{ at: "2026-07-14T18:00:00Z", type: "sprint", rpe: 8 }],
    },
  ],
  [
    "cns-recent-sprint-older",
    {
      ageYears: 38,
      recentSessions: [{ at: "2026-07-14T18:00:00Z", type: "sprint", rpe: 8 }],
    },
  ],
  // Practice day
  ["practice-day", { isTeamPractice: true }],
];

export const CASES = RAW_CASES.map(([name, overrides]) => ({
  name,
  input: { ...BASE, ...overrides },
}));
