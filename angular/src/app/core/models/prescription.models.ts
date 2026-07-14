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
 * The curated `taper_rules` vocabulary (5 tournament levels). The 7-value
 * `CompetitionLevel` maps onto these (club→local, continental→international,
 * olympic→world) via the engine's `taperLevelFor`.
 */
export type TaperTournamentLevel =
  | "local"
  | "regional"
  | "national"
  | "international"
  | "world";

/** One tournament level's taper policy (mirrors a `taper_rules` row). */
export interface TaperLevelRule {
  /** Fraction of baseline VOLUME (minutes/reps) retained, 0–1. Lower = deeper
   * taper. Bosquet 2007: a full taper cuts volume 41–60% (floor 0.40–0.60). */
  volumeFloorPct: number;
  /** Fraction of baseline INTENSITY (RPE) retained, 0–1. Kept ≥ 0.90 so the
   * taper never detrains (rubric B6 — Mujika & Padilla 2003). */
  intensityRetention: number;
  /** Calendar length of the taper for this level, in days (informational — the
   * WHEN a taper starts is owned by `resolvePhase`, not this). */
  taperDays: number;
}

/**
 * A normalized, versioned taper policy the engine runs against. Two-layer model:
 * the engine is deterministic and consumes ONLY this materialized object — never
 * raw DB rows. The embedded default (`EMBEDDED_TAPER_RULES`) guarantees pure,
 * offline, versioned behavior; the server may hydrate a live/override ruleset
 * into this exact shape and pass it in. `source`/`version` give the app
 * provenance ("what is happening") without the engine ever depending on a read.
 */
export interface TaperRuleset {
  /** Version tag; the live layer can detect a newer ruleset vs the embedded one. */
  version: string;
  /** Provenance of the resolved ruleset. */
  source: "embedded" | "live" | "override";
  /** Policy keyed by the curated tournament-level vocabulary. */
  byLevel: Record<TaperTournamentLevel, TaperLevelRule>;
}

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
  | "competition" // Game day. Warm up, play, recover.
  | "travel"; // Travel day inside a tournament window. Rest, arrive fresh.

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
  /**
   * Relative humidity %. Feeds the WBGT-approx heat metric (Phase 5). Null →
   * WBGT can't be computed, so the guard falls back to the apparent-temp path
   * and says so (no fabricated humidity). Open-Meteo always returns this, so in
   * practice it's present; the fallback is only for degraded/missing data.
   */
  humidityPct?: number | null;
  condition: string | null;
  /** Open-Meteo WMO weather code (95–99 = thunderstorm, ≥61 = rain). */
  weatherCode: number | null;
  precipMm: number | null;
  windKmh: number | null;
  suitability?: "excellent" | "good" | "fair" | "poor" | null;
  /** City / location name resolved by the weather endpoint (team home_city). */
  location?: string | null;
  /**
   * Hourly forecast (venue-local time strings, today + tomorrow) for the Phase 5b
   * cooler-hour time-shift. Undefined/empty → no time-shift suggested (the guard
   * still applies from the current conditions).
   */
  hourly?: HourlyWeatherPoint[] | null;
}

/** One hour of forecast — venue-local ISO time + the fields WBGT needs. */
export interface HourlyWeatherPoint {
  /** Venue-local ISO string, e.g. "2026-07-13T20:00" (Open-Meteo timezone=auto). */
  time: string;
  tempC: number | null;
  humidityPct: number | null;
  apparentC: number | null;
  weatherCode: number | null;
  windKmh: number | null;
  precipMm: number | null;
}

/**
 * A "train later, when it's cooler" suggestion (Phase 5b). Present only when the
 * heat guard fired AND the hourly forecast has a materially cooler hour later
 * today. Hours are venue-local (0–23). Advisory only — it does not change the
 * session's prescribed load, just when to do it.
 */
export interface WeatherTimeShift {
  /** The hour the athlete would otherwise train (preferred time or now). */
  fromHour: number;
  /** The suggested cooler hour later today. */
  toHour: number;
  /** WBGT (°C) at the from-hour vs the to-hour. */
  fromWbgt: number;
  toWbgt: number;
  /** Athlete-facing one-liner, e.g. "32°C WBGT now — train at 20:00 (~27°)". */
  message: string;
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
  /** Target session duration in minutes (whole-number guidance). For quality
   * sessions (sprint/strength/mixed/build-technical) this is the FULL session
   * — warm-up and injury-prevention (DOP) blocks included — targeting ~90 min
   * (coach directive 2026-07-14), matching the realization layer's honest
   * rest-inclusive block estimates. */
  targetMinutes: number;
  /** Sprint volume — number of high-intensity reps. 0 if not a sprint day. */
  sprintReps: number;
  /** Strength volume — number of working sets. 0 if not a strength day. */
  strengthSets: number;
  /** Why this prescription, in one sentence the athlete can scan in 2 seconds. */
  reasoning: string;
  recoveryEmphasis: RecoveryEmphasis;
  /** Null when no real bodyweight exists — per-kg targets are never computed
   * from a fabricated default (Law #7, audit C7 2026-07-14). UI shows an
   * explicit "add your weight" state. */
  nutrition: NutritionTargets | null;
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
   * "Train later, when it's cooler" suggestion (Phase 5b). Present only when the
   * heat guard fired and the hourly forecast has a materially cooler hour later
   * today. Advisory — the prescribed load is unchanged; this only moves WHEN.
   */
  timeShift?: WeatherTimeShift | null;
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
   * Post-congested-tournament recovery guard applied on day +1 and day +2 after
   * a tournament with ≥ 4 games. Present when the engine forced recovery or
   * mobility instead of the originally planned accumulation session.
   *
   * Day +1 → intent: "recovery" (RPE 3 / 30 min) — neuromuscular repair.
   * Day +2 → intent: "mobility"  (RPE 4 / 45 min) — stiffness clearance.
   *
   * Evidence: Nédélec et al. (2014) post-match fatigue; Bompa & Buzzichelli (2018)
   * congestion-week management; NSCA-TSAC tournament load guidelines.
   */
  tournamentRecoveryAdjustment?: {
    dayAfterTournament: number;
    gamesPlayed: number;
    tournamentName: string | null;
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
  /**
   * Actual RPE logged for this session. Used to classify flag-football-specific
   * drill types (routes, evasion, flag pulls) as high-CNS only when performed
   * at meaningful intensity (≥ RPE 6). Null/undefined → unknown → conservative:
   * treat as high-CNS so the guard never under-fires due to missing data.
   */
  rpe?: number | null;
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
  /** Athlete bodyweight in kg. Null → nutrition targets are null (no per-kg
   * dosing from a fabricated default — Law #7; the old 80 kg fallback
   * over-prescribed a 45 kg athlete by ~78%, audit C7). */
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
   * Days since arrival at the current travel destination (0 = arrival day),
   * from the athlete's most recent `athlete_travel_log` leg covering today
   * (V2.4). Heat/cold acclimatization takes ~10-14 days — an athlete from
   * Ljubljana landing in American Samoa (or from Samoa landing in Mongolia
   * in January) is at materially higher heat/cold-illness risk in the first
   * days after arrival than the raw apparent temperature alone would
   * suggest. Null/undefined → no acclimatization adjustment (same as V1).
   */
  acclimatizationDay?: number | null;
  /**
   * Seated-travel hours for a leg that arrived TODAY specifically (V2.4,
   * from `EventTravelService.arrivalDayTravelHours`). ≥3h caps the day's
   * session to activation only — no new fatigue stacked on top of a long
   * trip. Null/undefined → no cap (same as V1/no travel declared).
   */
  arrivalDayTravelHours?: number | null;
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
   * apply on top of this hint. The hint always passes through the same ACWR /
   * density / weekly-progression safety modulation via modulateIntentForLoad().
   */
  weeklyIntentHint?: PrescriptionIntent | null;
  /**
   * True when the current week's cumulative training load already exceeds the
   * safe weekly progression cap (typically 10–15%, Gabbett 2016). When set,
   * any planned sprint / strength / mixed session is downgraded to technical
   * or mobility to avoid spiking the ACWR further. Read from
   * AcwrService.weeklyProgression().isSafe at the service level and passed as a
   * boolean so the pure algorithm stays dependency-free and testable.
   */
  weeklyProgressionUnsafe?: boolean | null;
  /**
   * Materialized taper policy (two-layer model). The engine runs the taper on
   * this object — never on raw DB rows. Null/undefined → the engine's embedded
   * `EMBEDDED_TAPER_RULES` default (pure/offline). The server hydrates the live
   * `taper_rules` (active version / coach override) into this exact shape when
   * available, so client and server share one deterministic computation.
   */
  taperRuleset?: TaperRuleset | null;
  /**
   * The athlete's preferred training hour (0–23, venue-local), from
   * `team_training_days.time`. The Phase 5b time-shift measures "now vs a cooler
   * hour" from here. Null/undefined → the guard uses `date`'s hour instead (no
   * fabricated default — it's their planned time or the current time).
   */
  preferredTrainingHour?: number | null;
}
