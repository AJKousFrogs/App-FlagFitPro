/**
 * Daily Prescription Models
 *
 * v10 mechanic: every day the athlete opens the app, they see a single
 * prescription — what to do, how hard, how long, why. The prescription is
 * deterministic given (schedule, ACWR, readiness, bodyweight). No options,
 * no decisions. Lazy athletes do what they're told; the algorithm is
 * responsible for making the right call.
 *
 * Computed by `PeriodizationService` (client) and mirrored server-side for
 * cross-device consistency.
 */

import { CompetitionEvent, CompetitionPhase } from "./schedule.models";

/**
 * What the athlete should do today. Mutually exclusive — one intent per day.
 */
export type PrescriptionIntent =
  | "rest" // Full rest. No structured movement.
  | "recovery" // Active recovery: walk / mobility / pool. RPE ≤ 3.
  | "mobility" // Mobility + light technical. RPE ≤ 4.
  | "technical" // Skills, throwing, route running. Low CV load.
  | "sprint" // Speed/agility focus. Quality over volume.
  | "strength" // Resistance / power.
  | "mixed" // Combined sprint + technical, lower volume.
  | "taper-prime" // Pre-game opener: short, sharp, primed.
  | "competition"; // Game day. Warm up, play, recover.

/**
 * Carb / protein / hydration targets for the day, in absolute amounts.
 * Computed from bodyweight × per-kg targets that vary by phase.
 */
export interface NutritionTargets {
  carbsG: number;
  proteinG: number;
  /** Total fluid target including game-day sweat replacement, in liters. */
  hydrationL: number;
  /** Why these targets — short, single-sentence rationale. */
  rationale: string;
}

/**
 * Recovery emphasis for the day. Drives whether sleep/cold/sauna nudges
 * appear and how aggressively.
 */
export type RecoveryEmphasis = "low" | "medium" | "high" | "critical";

/**
 * One day's complete prescription. Pure data — no signals, no observables.
 * Same inputs → same output, every time.
 */
export interface DailyPrescription {
  date: string; // ISO date (YYYY-MM-DD), local
  phase: CompetitionPhase;
  intent: PrescriptionIntent;
  /** Display label, e.g. "Pre-game taper". */
  intentLabel: string;
  /** Target perceived effort, 0–10. Null on rest days. */
  targetRpe: number | null;
  /** Target session duration in minutes (whole-number guidance). */
  targetMinutes: number;
  /** Sprint volume — number of high-intensity reps. 0 if not a sprint day. */
  sprintReps: number;
  /** Strength volume — number of working sets. 0 if not a strength day. */
  strengthSets: number;
  /** Why this prescription, in one sentence the athlete can scan in 2 seconds. */
  reasoning: string;
  recoveryEmphasis: RecoveryEmphasis;
  nutrition: NutritionTargets;
  /** The event driving today's decisions, if any. Null on transition days. */
  driverEvent: CompetitionEvent | null;
  /** Hours until the next event. Null if nothing scheduled. */
  hoursUntilNextEvent: number | null;
  /** ACWR snapshot at prescription time. Null if no ACWR data. */
  acwrAtIssue: number | null;
}

/**
 * Inputs to the periodization function. Plain data so the algorithm is
 * trivially testable without Angular DI.
 */
export interface PeriodizationInputs {
  date: Date;
  phase: CompetitionPhase;
  upcoming: CompetitionEvent[];
  lastEvent: CompetitionEvent | null;
  /** Most recent ACWR; falls back to safe defaults when null. */
  acwr: number | null;
  /** 0–100 readiness; falls back to 70 when null. */
  readiness: number | null;
  /** Athlete bodyweight in kg. Falls back to 80kg if not set. */
  bodyweightKg: number | null;
  /** Density of upcoming load over 14 days. Used for week-scale modulation. */
  density14d: { totalGames: number; hasPeakImportance: boolean } | null;
}
