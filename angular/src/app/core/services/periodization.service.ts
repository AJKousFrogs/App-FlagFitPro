import {
  Injectable,
  Signal,
  computed,
  inject,
} from "@angular/core";

import {
  CompetitionEvent,
} from "../models/schedule.models";
import {
  DailyPrescription,
  NutritionTargets,
  PeriodizationInputs,
  PrescriptionIntent,
} from "../models/prescription.models";
import { AcwrService } from "./acwr.service";
import { ReadinessService } from "./readiness.service";
import { ScheduleService } from "./schedule.service";
import { SupabaseService } from "./supabase.service";

/**
 * PeriodizationService — turns the schedule into prescriptions.
 *
 * The lazy-athlete contract: open the app, see exactly what to do today and
 * why. The algorithm is responsible for making the right call given:
 *   schedule × ACWR × readiness × bodyweight × density.
 *
 * The class is a thin Angular wrapper around pure functions. Logic lives in
 * `prescribeFor` so it can be tested without DI and mirrored server-side
 * later.
 */
@Injectable({ providedIn: "root" })
export class PeriodizationService {
  private readonly schedule = inject(ScheduleService);
  private readonly acwrService = inject(AcwrService);
  private readonly readinessService = inject(ReadinessService);
  private readonly supabase = inject(SupabaseService);

  /**
   * Today's prescription. Reactive — updates whenever the schedule, ACWR,
   * or readiness change.
   */
  readonly today: Signal<DailyPrescription | null> = computed(() => {
    const snap = this.schedule.snapshot();
    if (!snap) {
      return null;
    }
    return prescribeFor({
      date: new Date(),
      phase: snap.currentPhase,
      upcoming: snap.upcoming,
      lastEvent: snap.lastEvent,
      acwr: this.readAcwr(),
      readiness: this.readReadiness(),
      bodyweightKg: this.readBodyweight(),
      density14d: snap.density14d
        ? {
            totalGames: snap.density14d.totalGames,
            hasPeakImportance: snap.density14d.hasPeakImportance,
          }
        : null,
    });
  });

  /**
   * 7-day forward prescription view. Useful for a week-at-a-glance UI;
   * each day resolved independently against the cached schedule snapshot.
   */
  weekAhead(): DailyPrescription[] {
    const snap = this.schedule.snapshot();
    if (!snap) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const acwr = this.readAcwr();
    const readiness = this.readReadiness();
    const bodyweight = this.readBodyweight();

    const out: DailyPrescription[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const phase = this.schedule.phaseFor(date);
      out.push(
        prescribeFor({
          date,
          phase,
          upcoming: snap.upcoming,
          lastEvent: snap.lastEvent,
          acwr,
          readiness,
          bodyweightKg: bodyweight,
          density14d: snap.density14d
            ? {
                totalGames: snap.density14d.totalGames,
                hasPeakImportance: snap.density14d.hasPeakImportance,
              }
            : null,
        }),
      );
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Service-internal accessors. Defensive against null/undefined.
  // ---------------------------------------------------------------------------
  private readAcwr(): number | null {
    // Prefer the server's ACWR (already embedded in the readiness response);
    // fall back to the local EWMA when no server check-in exists yet.
    const serverAcwr = this.readinessService.current?.()?.acwr;
    if (typeof serverAcwr === "number" && Number.isFinite(serverAcwr) && serverAcwr > 0) {
      return serverAcwr;
    }
    const localAcwr = this.acwrService.acwrRatio?.();
    return typeof localAcwr === "number" && Number.isFinite(localAcwr) && localAcwr > 0
      ? localAcwr
      : null;
  }

  private readReadiness(): number | null {
    const value = this.readinessService.current?.()?.score;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private readBodyweight(): number | null {
    // Bodyweight lives on the user profile. We try a couple of common shapes
    // gracefully — the periodization function falls back to 80kg if null.
    const user = this.supabase.currentUser?.();
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta["weight_kg"],
      meta["bodyweight_kg"],
      meta["weight"],
    ];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : Number(c);
      if (Number.isFinite(n) && n > 30 && n < 200) {
        return n;
      }
    }
    return null;
  }
}

// =============================================================================
// PURE PERIODIZATION ALGORITHM
//
// Same inputs → same output. Tested without DI. Server-mirror friendly.
// =============================================================================

const FALLBACK_BODYWEIGHT_KG = 80;
const FALLBACK_READINESS = 70;
const ACWR_DANGER = 1.5;
const ACWR_ELEVATED = 1.3;
const ACWR_UNDER = 0.8;
const READINESS_LOW = 55;
const DENSITY_HEAVY_GAMES_14D = 10;

const INTENT_LABELS: Record<PrescriptionIntent, string> = {
  rest: "Rest day",
  recovery: "Active recovery",
  mobility: "Mobility & technique",
  technical: "Skills focus",
  sprint: "Sprint focus",
  strength: "Strength session",
  mixed: "Mixed session",
  "taper-prime": "Pre-game prime",
  competition: "Game day",
};

/**
 * The core decision. Read top-to-bottom: highest-priority overrides first
 * (game day, taper, recovery, ACWR safety), then phase defaults.
 */
export function prescribeFor(inputs: PeriodizationInputs): DailyPrescription {
  const {
    date,
    phase,
    upcoming,
    lastEvent,
    acwr,
    readiness,
    bodyweightKg,
    density14d,
  } = inputs;

  const driverEvent = pickDriverEvent(date, upcoming, lastEvent);
  const hoursUntilNext = nextEventHours(date, upcoming);
  const bodyweight = bodyweightKg ?? FALLBACK_BODYWEIGHT_KG;
  const effectiveReadiness = readiness ?? FALLBACK_READINESS;
  const heavyDensity =
    !!density14d && density14d.totalGames >= DENSITY_HEAVY_GAMES_14D;

  // 1. Currently inside a competition window → game day.
  if (phase === "competition") {
    return finalize({
      date,
      phase,
      intent: "competition",
      targetRpe: null,
      targetMinutes: 60,
      sprintReps: 0,
      strengthSets: 0,
      reasoning:
        "Game day. Activate, play, refuel between games, sleep tonight.",
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("competition", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 2. Within 24h of a game → taper-prime (very short, sharp, no fatigue).
  if (hoursUntilNext !== null && hoursUntilNext <= 24) {
    return finalize({
      date,
      phase,
      intent: "taper-prime",
      targetRpe: 4,
      targetMinutes: 25,
      sprintReps: 4,
      strengthSets: 0,
      reasoning:
        "Game inside 24 hours. Stay loose and primed — no new fatigue.",
      recoveryEmphasis: "high",
      nutrition: nutritionFor("taper-prime", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 3. ACWR danger zone overrides phase — safety first.
  if (acwr !== null && acwr > ACWR_DANGER) {
    return finalize({
      date,
      phase,
      intent: "rest",
      targetRpe: null,
      targetMinutes: 0,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `ACWR ${acwr.toFixed(2)} is in the danger zone. Full rest today.`,
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("rest", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4. Readiness collapse → switch to recovery regardless of phase.
  if (effectiveReadiness < READINESS_LOW) {
    return finalize({
      date,
      phase,
      intent: "recovery",
      targetRpe: 3,
      targetMinutes: 30,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `Readiness ${Math.round(effectiveReadiness)}/100 is low. Active recovery only.`,
      recoveryEmphasis: "high",
      nutrition: nutritionFor("recovery", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 5. Phase-driven defaults.
  switch (phase) {
    case "recovery":
      return finalize({
        date,
        phase,
        intent: "recovery",
        targetRpe: 3,
        targetMinutes: 30,
        sprintReps: 0,
        strengthSets: 0,
        reasoning: postEventReasoning(lastEvent),
        recoveryEmphasis: "high",
        nutrition: nutritionFor("recovery", bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "taper": {
      // Inside taper window: keep CNS sharp, drop volume.
      const dayOfTaper = hoursUntilNext !== null
        ? Math.max(1, Math.ceil(hoursUntilNext / 24))
        : 7;
      // Closer to the event = lighter.
      const isFinalThird = dayOfTaper <= 2;
      return finalize({
        date,
        phase,
        intent: isFinalThird ? "mobility" : "sprint",
        targetRpe: isFinalThird ? 4 : 6,
        targetMinutes: isFinalThird ? 30 : 45,
        sprintReps: isFinalThird ? 4 : 6,
        strengthSets: 0,
        reasoning: taperReasoning(driverEvent, dayOfTaper),
        recoveryEmphasis: "medium",
        nutrition: nutritionFor("taper", bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });
    }

    case "transition":
      return finalize({
        date,
        phase,
        intent: heavyDensity ? "mobility" : "mixed",
        targetRpe: 5,
        targetMinutes: 45,
        sprintReps: 0,
        strengthSets: 3,
        reasoning:
          "Off-season window. Maintain GPP base — easy aerobic + lift.",
        recoveryEmphasis: "low",
        nutrition: nutritionFor("transition", bodyweight, false),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "accumulation":
    default: {
      // Choose intent by day of week to give the week a shape.
      const intent = pickAccumulationIntent(date, acwr, heavyDensity);
      return finalize({
        date,
        phase,
        intent,
        targetRpe: intent === "strength" ? 7 : intent === "sprint" ? 8 : 6,
        targetMinutes: intent === "rest" ? 0 : intent === "sprint" ? 60 : 75,
        sprintReps: intent === "sprint" ? 10 : intent === "mixed" ? 6 : 0,
        strengthSets: intent === "strength" ? 18 : intent === "mixed" ? 8 : 0,
        reasoning: accumulationReasoning(intent, acwr, heavyDensity),
        recoveryEmphasis: heavyDensity ? "medium" : "low",
        nutrition: nutritionFor(intent, bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });
    }
  }
}

// =============================================================================
// HELPERS — kept tiny and orthogonal so they're easy to unit-test.
// =============================================================================

function finalize(
  partial: Omit<DailyPrescription, "date" | "intentLabel"> & { date: Date },
): DailyPrescription {
  return {
    ...partial,
    date: toIsoDate(partial.date),
    intentLabel: INTENT_LABELS[partial.intent],
  };
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function pickDriverEvent(
  date: Date,
  upcoming: CompetitionEvent[],
  lastEvent: CompetitionEvent | null,
): CompetitionEvent | null {
  // Future events take priority — what we're preparing for.
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime(),
  );
  if (next) {
    return next;
  }
  return lastEvent;
}

function nextEventHours(
  date: Date,
  upcoming: CompetitionEvent[],
): number | null {
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime(),
  );
  if (!next) {
    return null;
  }
  const diffMs = new Date(next.startsAt).getTime() - date.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.round(diffMs / 3_600_000);
}

function postEventReasoning(lastEvent: CompetitionEvent | null): string {
  if (!lastEvent) {
    return "Recovery focus today — light blood flow only.";
  }
  const games = lastEvent.expectedGameCount ?? 1;
  const eventName = lastEvent.competitionShortName ?? lastEvent.competitionName;
  return `Just played ${games} game${games === 1 ? "" : "s"} at ${eventName}. Body is repairing — easy day.`;
}

function taperReasoning(
  event: CompetitionEvent | null,
  daysOut: number,
): string {
  if (!event) {
    return "Taper week. Keep nervous system sharp at low volume.";
  }
  const games = event.expectedGameCount ?? 1;
  const eventName = event.competitionShortName ?? event.competitionName;
  return `${daysOut} day${daysOut === 1 ? "" : "s"} to ${eventName} (${games} games). Sharp, not heavy.`;
}

function accumulationReasoning(
  intent: PrescriptionIntent,
  acwr: number | null,
  heavyDensity: boolean,
): string {
  if (heavyDensity) {
    return "Dense competition window ahead — modulating load now to arrive fresh.";
  }
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    return `ACWR ${acwr.toFixed(2)} is elevated — reduced volume on a ${intent} focus.`;
  }
  if (acwr !== null && acwr < ACWR_UNDER) {
    return `Under-trained (ACWR ${acwr.toFixed(2)}) — building load with a ${intent} session.`;
  }
  return `Build phase. Today is a ${intent} day.`;
}

function pickAccumulationIntent(
  date: Date,
  acwr: number | null,
  heavyDensity: boolean,
): PrescriptionIntent {
  // Standard week shape: Mon strength, Tue sprint, Wed technical/mobility,
  // Thu strength, Fri sprint, Sat mixed, Sun rest. Day-of-week 0 = Sunday.
  const dow = date.getDay();
  const standard: PrescriptionIntent[] = [
    "rest",      // Sun
    "strength",  // Mon
    "sprint",    // Tue
    "mobility",  // Wed
    "strength",  // Thu
    "sprint",    // Fri
    "mixed",     // Sat
  ];
  let intent = standard[dow];

  // Modulate when load is elevated or density is heavy.
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") {
      intent = "mobility";
    } else if (intent === "mixed") {
      intent = "technical";
    }
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}

// =============================================================================
// NUTRITION TARGETS
//
// Per-kg ranges from current sport-nutrition consensus (rough mid-points):
//   Carbs:    rest 3, easy 4, moderate 5, hard/strength 6, comp/heavy 8
//   Protein:  steady 1.8 g/kg/day across phases
//   Fluid:    base 35 ml/kg/day; competition adds ~1.5L; heat adds ~0.5L
// =============================================================================

const CARB_PER_KG: Record<PrescriptionIntent, number> = {
  rest: 3,
  recovery: 4,
  mobility: 4,
  technical: 4.5,
  sprint: 6,
  strength: 6,
  mixed: 5.5,
  "taper-prime": 7,
  competition: 8,
};

const PROTEIN_PER_KG = 1.8;
const FLUID_BASE_ML_PER_KG = 35;
const FLUID_COMPETITION_BONUS_L = 1.5;

function nutritionFor(
  intent: PrescriptionIntent | "taper" | "transition",
  bodyweightKg: number,
  heavyDensity: boolean,
): NutritionTargets {
  // Map non-Intent labels onto a real bucket
  const key: PrescriptionIntent =
    intent === "taper"
      ? "sprint"
      : intent === "transition"
        ? "mixed"
        : (intent as PrescriptionIntent);

  const carbsG = Math.round(CARB_PER_KG[key] * bodyweightKg);
  const proteinG = Math.round(PROTEIN_PER_KG * bodyweightKg);
  let hydrationL = (FLUID_BASE_ML_PER_KG * bodyweightKg) / 1000;
  if (key === "competition") {
    hydrationL += FLUID_COMPETITION_BONUS_L;
  }
  if (heavyDensity && key !== "rest") {
    hydrationL += 0.5;
  }

  return {
    carbsG,
    proteinG,
    hydrationL: Math.round(hydrationL * 10) / 10,
    rationale:
      key === "competition"
        ? "Game-day fueling: carbs every game, hydrate aggressively, protein after final game."
        : key === "rest"
          ? "Lower carb day. Protein steady to support repair."
          : key === "taper-prime"
            ? "Top up glycogen tonight. Hydrate well — game window opens soon."
            : `Daily targets at ${CARB_PER_KG[key]}g/kg carbs, ${PROTEIN_PER_KG}g/kg protein.`,
  };
}

// Convenience exports for testing and for any callers that want the same
// reasoning logic without creating a service.
export const __periodization__ = {
  prescribeFor,
  nutritionFor,
  pickAccumulationIntent,
  CARB_PER_KG,
};
