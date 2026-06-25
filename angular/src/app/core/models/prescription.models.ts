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
 * event-proximity micro-phases. Athlete-declared (see SeasonWindow):
 *   offseason  — general prep: build strength & conditioning base (volume-led)
 *   preseason  — accumulation/build-up toward competition (progressive)
 *   inseason   — in competition: maintain + skill (moderate, quality-led)
 *   peak       — peaking block for the most important competitions: sharp, low
 *                volume, high quality, freshness prioritised
 *   postseason — after the competitive block: active regeneration / down-weeks
 *   transition — legacy alias for an active-rest block (treated like postseason)
 *
 * Athletes can declare MULTIPLE windows — a split season (e.g. a spring in-season
 * block, a mid-season off gap, then a second in-season block, a post-season, and
 * a winter off-season) is just several windows; {@link macroPhaseFor} returns the
 * first window that contains the day.
 */
export type SeasonPhase =
  | "offseason"
  | "preseason"
  | "inseason"
  | "peak"
  | "postseason"
  | "transition";

/**
 * One athlete-declared season window. `from`/`to` are either a specific span
 * ("YYYY-MM-DD") or a recurring annual one ("MM-DD"); recurring windows may wrap
 * the year end (e.g. "09-01" → "04-30"). Stored on
 * `athlete_training_config.season_calendar`. NOTHING is hardcoded — the player
 * is the source of truth, and may declare several windows for a split season.
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
  /** City / location name resolved by the weather endpoint (team home_city). */
  location?: string | null;
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
  /**
   * Optional PM / afternoon session on a double-training day. Present only in
   * pre-season accumulation or early off-season when readiness ≥ 75 and ACWR
   * is in the safe sweet spot (≤ 1.2). Always a DIFFERENT energy system from
   * the AM intent (strength AM → sprint or technical PM; never the same system
   * twice). Minimum 6 h gap assumed between sessions.
   * Null on all other days — in-season, peak, taper, competition, rest.
   */
  secondSession?: {
    intent: PrescriptionIntent;
    intentLabel: string;
    /** Target RPE for the PM session (typically 1 lower than AM to manage fatigue). */
    targetRpe: number;
    /** Target duration in minutes. */
    targetMinutes: number;
    reasoning: string;
  } | null;
  /**
   * Position-specific accessory / prehab focus layered on the session. Does NOT
   * change the core intent or load magnitude — it tells a QB to protect the
   * throwing shoulder, a WR/DB to prioritise hamstring + deceleration work, a
   * center/rusher to care for the snapping wrist/shoulder + brace the trunk.
   * Null when no position is set.
   */
  positionEmphasis?: {
    position: string;
    label: string;
    focus: string[];
    note: string;
    /** True when a throwing/upper-body restriction has overridden the emphasis
     * into a protect-the-arm message (e.g. a QB shoulder issue). */
    restricted?: boolean;
    /** Worst-case on-field volume the role must be prepared for (from the
     * tunable position-volume reference). Surfaced so the plan states the
     * demand, head-coach style. */
    volume?: { worstCase: string; targets: string[] } | null;
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
  /**
   * Density of upcoming load over 14 days. Used for week-scale modulation.
   * `peakDayGameCount` = the most games on any single day in the window — a
   * tournament's congested day (e.g. 4 games/day) that the 14-day total misses.
   */
  density14d: {
    totalGames: number;
    hasPeakImportance: boolean;
    peakDayGameCount?: number;
  } | null;
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
    /** Throwing/loaded-upper restricted (shoulder, elbow, wrist, core). Lets the
     * engine pull throwing/snapping guidance even when running is fine. */
    restrictsThrowing?: boolean;
    severity: "minor" | "moderate" | "severe" | null;
    regions: string[];
  } | null;
  /**
   * Recently-completed sessions (last ~3 days) for high-CNS recovery spacing.
   * After a sprint/plyo/max-velocity session the engine suppresses a new
   * high-CNS day within the configured window. Empty/undefined → no spacing.
   */
  recentSessions?: RecentSession[] | null;
  /**
   * Athlete age in years (from date_of_birth). Lengthens the CNS recovery window
   * for older athletes — a 38yo gets more spacing between max-velocity days than
   * a 19yo. Never shortens it. Null/undefined → the 48h base for everyone.
   */
  ageYears?: number | null;
  /**
   * Athlete playing position (athlete_training_config.primary_position), e.g.
   * "qb", "wr_db", "center_rusher". Drives position-specific accessory/prehab
   * emphasis only — it does not change the core session intent or load.
   */
  position?: string | null;
  /**
   * Schedule-aware intent pre-planned by weekAhead()'s planWeekIntents pass.
   * When set, replaces the day-of-week array lookup in pickAccumulationIntent
   * and seasonShapedIntent for free accumulation days. All higher-priority
   * guards (competition, taper, recovery, ACWR-danger, injury, weather) still
   * apply on top of this hint. Only used in weekAhead(); never set for the
   * live "today" signal (which has no full-week context available).
   */
  weeklyIntentHint?: PrescriptionIntent | null;
}
