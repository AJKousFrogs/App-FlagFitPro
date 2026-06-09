/**
 * Daily Prescription Models
 *
 * v11 mechanic: every day the athlete opens the app, they see a single
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
 * Macro season phase — the annual periodization layer that sits above the
 * event-proximity micro-phases. Athlete-declared (see SeasonWindow); off-season
 * biases toward strength & conditioning, in-season toward maintain + skill.
 */
export type SeasonPhase = "offseason" | "preseason" | "inseason" | "transition";

/**
 * One athlete-declared season window. `from`/`to` are either a specific span
 * ("YYYY-MM-DD") or a recurring annual one ("MM-DD"); recurring windows may wrap
 * the year end (e.g. "09-01" → "04-30"). Stored on
 * `athlete_training_config.season_calendar`. NOTHING is hardcoded — the player
 * is the source of truth.
 */
export interface SeasonWindow {
  phase: SeasonPhase;
  from: string;
  to: string;
}

/**
 * Live weather the guard reasons over. Temps °C, wind km/h, precip mm.
 * Any null field = unknown → the guard fails safe (warns, never green-lights
 * intense outdoor work in unknown weather).
 */
export interface WeatherInput {
  tempC: number | null;
  /** Feels-like / apparent temperature — the value the guard prefers. */
  apparentC: number | null;
  condition: string | null;
  /** Open-Meteo WMO weather code (95–99 = thunderstorm, ≥61 = rain). */
  weatherCode: number | null;
  precipMm: number | null;
  windKmh: number | null;
  suitability?: "excellent" | "good" | "fair" | "poor" | null;
}

/**
 * What the weather guard did to today's intent. Present only when weather was
 * provided. `action`:
 *  - none      → advisory only (hydration / warm-up / wind), intent unchanged
 *  - scale     → same intent, volume cut + heat load-scaling applied
 *  - substitute→ swapped to a weather-safe intent (e.g. rain: sprint → strength)
 *  - relocate  → moved indoors (e.g. ≥35 °C: sprint → indoor mobility/skills)
 *  - stop      → outdoor unsafe (thunderstorm / extreme heat) → indoor/rest
 */
export interface WeatherAdjustment {
  applied: boolean;
  action: "none" | "relocate" | "substitute" | "scale" | "stop";
  originalIntent: PrescriptionIntent;
  adjustedIntent: PrescriptionIntent;
  /** Internal-load multiplier for heat (1.0 = none) — feeds workload at port. */
  heatLoadFactor: number;
  reason: string;
}

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
  /** Macro season phase that shaped a non-event week, if one was supplied. */
  seasonPhase?: SeasonPhase | null;
  /** Weather guard result, present only when weather was supplied. */
  weatherAdjustment?: WeatherAdjustment | null;
  /**
   * Injury/tightness down-regulation applied on top of the base plan, if any.
   * Traceability for the self-report → recalc loop: what was changed and why.
   */
  injuryAdjustment?: {
    regions: string[];
    severity: string;
    summary: string;
  } | null;
  /**
   * High-CNS recovery spacing applied on top of the base plan, if any. Present
   * when a recent sprint/plyo session suppressed today's high-CNS intent.
   */
  cnsRecoveryAdjustment?: {
    hoursSinceLastHighCns: number;
    windowHours: number;
    originalIntent: PrescriptionIntent;
  } | null;
}

/**
 * A recently-completed training session, for high-CNS recovery spacing. Sourced
 * from `training_sessions` (completed sessions).
 */
export interface RecentSession {
  /** Completion timestamp (`completed_at`) or session date. */
  at: string | Date;
  /** Raw `session_type` / `drill_type` — used to detect high-CNS (sprint/plyo) work. */
  type: string;
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
  /**
   * Macro season phase for `date` (from `macroPhaseFor` over the athlete's
   * declared `season_calendar`). Refines the generic "build" week when no
   * event micro-phase is active. Null/undefined → current generic default.
   */
  seasonPhase?: SeasonPhase | null;
  /**
   * Live weather at the venue / athlete location. Null/undefined → no guard
   * (unknown weather is left unguarded here; the caller may warn separately).
   */
  weather?: WeatherInput | null;
  /**
   * Coach "we train/play regardless" — bypasses the weather guard's
   * intent changes (a thunderstorm still warns). Default false.
   */
  coachOverride?: boolean;
  /**
   * True when the athlete has flag-football team practice on `date` (recurring
   * weekday or a one-off). On a practice day with no event micro-phase, practice
   * IS the session — the plan prescribes only light complementary work. Event
   * windows (competition/taper/recovery) and safety guards take precedence.
   */
  isTeamPractice?: boolean;
  /**
   * Active injury/tightness restrictions for `date` (from athlete_injuries via
   * InjuryService). When `restrictsSprint`, the plan's sprint/high-intensity work
   * for the affected region is down-regulated (severity-scaled). Injury/physio
   * precedence over training is a spec law.
   */
  activeRestrictions?: {
    restrictsSprint: boolean;
    severity: "minor" | "moderate" | "severe" | null;
    regions: string[];
  } | null;
  /**
   * Recently-completed sessions (last ~3 days) for high-CNS recovery spacing.
   * After a sprint/plyo/max-velocity session the engine suppresses a new
   * high-CNS day within the configured window. Empty/undefined → no spacing.
   */
  recentSessions?: RecentSession[] | null;
}
