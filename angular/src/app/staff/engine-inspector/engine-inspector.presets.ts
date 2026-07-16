import type {
  PeriodizationInputs,
  DailyPrescription,
} from "../../core/models/prescription.models";
import type { CompetitionPhase } from "../../core/models/schedule.models";
import { planWeek } from "../../core/services/periodization-engine";

/**
 * Synthetic scenarios for the engine inspector. Each builds a real
 * `PeriodizationInputs[]` and runs the SAME `planWeek` the app and server run —
 * nothing is faked, the inspector just feeds the engine known inputs so staff can
 * see which guards fire and in what order. Pure + deterministic (testable).
 */
export type ScenarioKey =
  | "heatwave"
  | "rtp"
  | "travel-low-readiness"
  | "storm-practice";

export interface Scenario {
  key: ScenarioKey;
  label: string;
  description: string;
  /** Guards this scenario is designed to demonstrate (for the UI caption). */
  demonstrates: string[];
}

export const SCENARIOS: readonly Scenario[] = [
  {
    key: "heatwave",
    label: "Heatwave training week",
    description:
      "35°C, 60% humidity for the first three days. The WBGT heat guard stops or scales OUTDOOR field sessions on the hot days — gym (strength) days are indoors and left alone, which is exactly what the plan shows.",
    demonstrates: ["Weather / WBGT heat guard", "Field-vs-gym distinction"],
  },
  {
    key: "rtp",
    label: "Return-to-play (hamstring)",
    description:
      "An active moderate hamstring restriction all week. Injury/physio precedence overrides the base plan — every day is held at recovery until the restriction clears.",
    demonstrates: ["Injury / tightness precedence"],
  },
  {
    key: "travel-low-readiness",
    label: "Travel day + low readiness",
    description:
      "Landed today after a 5-hour trip with readiness at 48. Day 0 is forced down to recovery — the low-readiness demotion and the arrival-day travel cap both point the same way (see the day's reasoning).",
    demonstrates: ["Low-readiness demotion", "Arrival-day travel cap"],
  },
  {
    key: "storm-practice",
    label: "Thunderstorm on a practice day",
    description:
      "Team practice mid-week with a thunderstorm forecast. The weather guard overrides even a scheduled practice — you don't run drills in lightning — and stops the session.",
    demonstrates: ["Weather overrides practice", "Thunderstorm safety stop"],
  },
];

const DAY_MS = 86_400_000;

function makeDay(
  date: Date,
  phase: CompetitionPhase,
  over: Partial<PeriodizationInputs>,
): PeriodizationInputs {
  return {
    date,
    phase,
    upcoming: [],
    lastEvent: null,
    acwr: 1.0,
    readiness: 75,
    bodyweightKg: 78,
    density14d: null,
    ...over,
  };
}

export interface ScenarioRun {
  scenario: Scenario;
  week: DailyPrescription[];
  todayReadiness: number | null;
  todayAcwr: number | null;
}

/** Build the 7-day inputs for a scenario and run the real engine over them. */
export function runScenario(key: ScenarioKey): ScenarioRun {
  const scenario = SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const dates = Array.from(
    { length: 7 },
    (_, i) => new Date(base.getTime() + i * DAY_MS),
  );
  const phases: CompetitionPhase[] = dates.map(() => "accumulation");
  const teamPractice = dates.map(() => false);

  let todayReadiness: number | null = 75;
  const todayAcwr: number | null = 1.0;
  let dayInputs: PeriodizationInputs[];

  switch (key) {
    case "heatwave": {
      const heat = {
        tempC: 35,
        apparentC: 38,
        humidityPct: 60,
        condition: "Clear",
        weatherCode: 0,
        precipMm: 0,
        windKmh: 6,
      };
      dayInputs = dates.map((d, i) =>
        makeDay(d, "accumulation", {
          weather: i < 3 ? heat : null,
          preferredTrainingHour: 14,
        }),
      );
      break;
    }
    case "rtp": {
      const restriction = {
        restrictsSprint: true,
        restrictsThrowing: false,
        severity: "moderate" as const,
        regions: ["hamstring"],
      };
      todayReadiness = 68;
      dayInputs = dates.map((d, i) =>
        makeDay(d, "accumulation", {
          readiness: i === 0 ? 68 : 75,
          activeRestrictions: restriction,
        }),
      );
      break;
    }
    case "travel-low-readiness": {
      todayReadiness = 48;
      dayInputs = dates.map((d, i) =>
        makeDay(d, i === 0 ? "travel" : "accumulation", {
          readiness: i === 0 ? 48 : 72,
          arrivalDayTravelHours: i === 0 ? 5 : null,
          acclimatizationDay: i === 0 ? 1 : null,
        }),
      );
      break;
    }
    case "storm-practice":
    default: {
      const storm = {
        tempC: 18,
        apparentC: 18,
        humidityPct: 80,
        condition: "Thunderstorm",
        weatherCode: 95,
        precipMm: 12,
        windKmh: 30,
      };
      teamPractice[2] = true;
      dayInputs = dates.map((d, i) =>
        makeDay(d, "accumulation", {
          isTeamPractice: i === 2,
          weather: i === 2 ? storm : null,
        }),
      );
      break;
    }
  }

  const week = planWeek(
    dayInputs,
    teamPractice,
    phases,
    todayReadiness,
    todayAcwr,
  );
  return { scenario, week, todayReadiness, todayAcwr };
}
