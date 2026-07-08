import { CompetitionEvent, CompetitionPhase } from "../models/schedule.models";
import {
  DailyPrescription,
  NutritionTargets,
  PeriodizationInputs,
  PrescriptionIntent,
  RecoveryEmphasis,
  SeasonPhase,
  SeasonWindow,
  WeatherAdjustment,
  WeatherInput,
} from "../models/prescription.models";
import {
  POSITION_VOLUME,
  type PositionKey,
  type RangeDemand,
} from "../config/position-volume.config";

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
/** Games in a single day that count as a congested (tournament) day. */
const DENSITY_CONGESTED_DAY_GAMES = 3;

const INTENT_LABELS: Record<PrescriptionIntent, string> = {
  rest: "Rest + daily mobility",
  recovery: "Active recovery",
  mobility: "Mobility & technique",
  technical: "Skills focus",
  sprint: "Sprint focus",
  strength: "Strength session",
  mixed: "Mixed session",
  "taper-prime": "Pre-game prime",
  competition: "Game day",
  travel: "Travel day",
};

/** High-CNS intents that need recovery spacing between sessions. */
const HIGH_CNS_INTENTS: ReadonlySet<PrescriptionIntent> =
  new Set<PrescriptionIntent>(["sprint", "mixed"]);

/**
 * Minimum hours between high-CNS (sprint / plyometric / max-velocity) sessions.
 * Conservative default treats sprint work as max-velocity (48h). Sub-max speed
 * could justify 24h — kept at the safe 48h default rather than guessing intensity
 * from `session_type`. Scaled UP with age (never down) — see {@link cnsRecoveryHoursForAge}.
 */
const CNS_RECOVERY_HOURS = 48;

/**
 * Age-scaled CNS recovery window. Older athletes recover neuromuscular and
 * connective-tissue fatigue more slowly, so the spacing between max-velocity /
 * plyometric days lengthens with age. MONOTONIC and floored at the 48h base —
 * a younger athlete is never told to rest *less* than before this existed.
 * Bands (conservative calibration; masters S&C consensus): <35 → 48h, 35–39 →
 * 60h, 40+ → 72h. A missing/implausible age falls back to the 48h base.
 */
function cnsRecoveryHoursForAge(ageYears?: number | null): number {
  if (
    typeof ageYears !== "number" ||
    !Number.isFinite(ageYears) ||
    ageYears < 16
  ) {
    return CNS_RECOVERY_HOURS;
  }
  if (ageYears >= 40) return 72;
  if (ageYears >= 35) return 60;
  return CNS_RECOVERY_HOURS;
}

/**
 * Flag-football drill patterns that qualify as high-CNS when performed at
 * meaningful intensity. Routes, evasion, and flag-pulls are repeated max-effort
 * acceleration-and-cut sequences that stress the same neuromuscular pathways as
 * sprinting (NSCA-TSAC flag-football guidelines). At sub-threshold intensity
 * they are fine pre-sprint, but at RPE ≥ 6 they warrant the same CNS spacing.
 */
const FLAG_DRILL_HIGH_CNS_PATTERN =
  /\b(?:route|routes|post|fade|hook|evade|evasion|flag.?pull)\b/i;

/**
 * Detect a high-CNS session from its raw `session_type`/`drill_type` and optional
 * RPE. Standard high-CNS types (sprint/plyo/accel etc.) are always high-CNS.
 * Flag-football drill types are high-CNS only when performed at significant
 * intensity (RPE ≥ 6) or when RPE is unknown — conservative to prevent
 * under-firing the guard due to missing data.
 */
export function isHighCnsSessionType(
  type: string,
  rpe?: number | null,
): boolean {
  const t = type || "";
  // `competition` = a game: maximal CNS load, always spacing-worthy. (Included so
  // the server cns-spacing guard, which consumes this, agrees with the engine.)
  if (/sprint|plyo|speed|max.?velocity|accel|agility|bound|competition/i.test(t))
    return true;
  if (FLAG_DRILL_HIGH_CNS_PATTERN.test(t)) {
    // Unknown RPE → conservative (treat as high-CNS).
    return rpe == null || rpe >= 6;
  }
  return false;
}

/**
 * CNS recovery spacing: if the engine chose a high-CNS day but the athlete did
 * sprint/plyo work within the (age-scaled) CNS recovery window, downgrade to
 * mobility + technique so back-to-back high-CNS days can't happen. Records
 * `cnsRecoveryAdjustment` for traceability. Lowest-precedence guard — weather/
 * physio override it.
 */
function applySprintRecoveryGuard(
  p: DailyPrescription,
  recentSessions: PeriodizationInputs["recentSessions"],
  date: Date,
  ageYears?: number | null,
): DailyPrescription {
  if (!HIGH_CNS_INTENTS.has(p.intent)) return p;
  if (!recentSessions || recentSessions.length === 0) return p;

  const windowHours = cnsRecoveryHoursForAge(ageYears);
  const now = date.getTime();
  const windowMs = windowHours * 3_600_000;
  let mostRecent: number | null = null;
  for (const s of recentSessions) {
    if (!isHighCnsSessionType(s.type, s.rpe ?? null)) continue;
    const t = new Date(s.at).getTime();
    if (!Number.isFinite(t) || t >= now) continue; // future / invalid ignored
    if (now - t > windowMs) continue; // outside the recovery window
    if (mostRecent === null || t > mostRecent) mostRecent = t;
  }
  if (mostRecent === null) return p; // no recent high-CNS session

  const hoursSince = Math.round((now - mostRecent) / 3_600_000);
  return {
    ...p,
    intent: "technical",
    intentLabel: "Mobility & technique",
    sprintReps: 0,
    targetRpe: p.targetRpe != null ? Math.min(p.targetRpe, 5) : p.targetRpe,
    reasoning: `Sprinted ${hoursSince}h ago — ${windowHours}h CNS recovery; today is mobility + technique.`,
    cnsRecoveryAdjustment: {
      hoursSinceLastHighCns: hoursSince,
      windowHours,
      originalIntent: p.intent,
    },
  };
}

/**
 * Public entry point. Picks the base prescription (game day → taper → safety →
 * phase/season defaults), then layers guards. Precedence (highest wins):
 * physio ▷ **weather** ▷ CNS-spacing ▷ engine. CNS-spacing constrains the
 * engine's chosen high-CNS intent but yields to weather and physio above it.
 */
export function prescribeFor(inputs: PeriodizationInputs): DailyPrescription {
  const base = decideBasePrescription(inputs);
  // CNS recovery spacing (lowest-precedence guard): no back-to-back sprint days.
  // The window lengthens with the athlete's age (older = more recovery).
  const spaced = applySprintRecoveryGuard(
    base,
    inputs.recentSessions ?? null,
    inputs.date,
    inputs.ageYears ?? null,
  );
  const guarded = applyWeatherGuard(
    spaced,
    inputs.weather ?? null,
    inputs.coachOverride ?? false,
    inputs.acclimatizationDay ?? null,
  );
  // V2.4 — a ≥3h same-day arrival caps the session to activation only, no
  // new fatigue stacked on top of the travel itself. Runs after weather (a
  // storm's "stop" is more restrictive and should win outright) but before
  // injury/physio, which stays the highest-precedence guard.
  const arrivalGuarded = applyArrivalDayGuard(
    guarded,
    inputs.arrivalDayTravelHours ?? null,
  );
  // Injury/physio precedence over training (spec law): runs last so the affected
  // region's sprint/high-intensity work is removed regardless of the base plan.
  const physioGuarded = applyInjuryGuard(
    arrivalGuarded,
    inputs.activeRestrictions ?? null,
  );
  // Position-specific accessory/prehab emphasis — additive guidance only, never
  // changes the chosen intent or load. Throwing/upper restrictions override the
  // QB/center emphasis into a protect-the-arm message.
  return withPositionEmphasis(
    physioGuarded,
    inputs.position ?? null,
    inputs.activeRestrictions?.restrictsThrowing ?? false,
  );
}

/**
 * Position bucket from a raw primary_position string. Recognises the five roles
 * (qb / wr / db / center / blitzer) plus the legacy both-ways "wr_db" combined
 * bucket. Order matters: the combined token and specific roles are checked
 * before broad ones.
 */
function positionBucket(position: string | null): PositionKey | null {
  const p = (position ?? "").toLowerCase();
  if (!p) return null;
  if (/\bqb\b|quarterback/.test(p)) return "qb";
  if (/center|long.?snap|snapper/.test(p)) return "center";
  if (/blitz|rush/.test(p)) return "blitzer";
  if (/wr.?db|wr\/db|both.?way|hybrid|two.?way/.test(p)) return "wr_db";
  if (/\bwr\b|receiver|wide.?out|wideout/.test(p)) return "wr";
  if (/\bdb\b|corner|safety|defensive.?back|cornerback/.test(p)) return "db";
  return null;
}

function fmtDemand(v: number | RangeDemand | undefined): string | null {
  if (v == null) return null;
  return typeof v === "number" ? `${v}` : `${v.min}–${v.max}`;
}

/**
 * Worst-case volume targets for a position, read from the tunable position-volume
 * reference (never hard-coded here). Surfaces the training demand (per-session +
 * per-week) and the per-game worst case so the plan states what to be ready for.
 */
function volumeFor(bucket: PositionKey): {
  worstCase: string;
  targets: string[];
} {
  const v = POSITION_VOLUME[bucket];
  const targets: string[] = [];
  const wkCatches = fmtDemand(v.perWeek["catches"]);
  if (wkCatches) targets.push(`~${wkCatches} catches/week`);
  const throws = fmtDemand(v.perSession["throws"]);
  if (throws) targets.push(`${throws} throws/session`);
  const snaps = fmtDemand(v.perSession["snaps"]);
  if (snaps) targets.push(`${snaps} snaps/session`);
  const backped = fmtDemand(v.perSession["backpedals"]);
  if (backped) targets.push(`up to ${backped} backpedals/session`);
  const sprints = fmtDemand(v.perGameWorstCase["sprints"]);
  if (sprints) targets.push(`up to ${sprints} sprints/game`);
  const accels = fmtDemand(v.perGameWorstCase["explosiveSprints"]);
  if (accels) targets.push(`~${accels} max sprints/game`);
  if (bucket === "qb") targets.push("~320 throws/tournament");
  return { worstCase: v.worstCase, targets };
}

/**
 * Layer the position-specific accessory/prehab focus onto the prescription.
 * Conservative and additive — it informs WHAT to protect (from the position
 * model's primary injury risk), never the chosen intent or load. On a rest day
 * there is nothing to emphasise.
 */
function withPositionEmphasis(
  p: DailyPrescription,
  position: string | null,
  restrictsThrowing = false,
): DailyPrescription {
  const bucket = positionBucket(position);
  if (!bucket || p.intent === "rest") {
    return { ...p, positionEmphasis: null };
  }
  const volume = volumeFor(bucket);
  const pv = POSITION_VOLUME[bucket];
  // A flagged throwing/upper-body issue overrides the QB/center emphasis into a
  // protect-the-arm message — these are the positions that throw or snap.
  if (restrictsThrowing && (bucket === "qb" || bucket === "center")) {
    const verb = bucket === "qb" ? "throwing" : "snapping";
    return {
      ...p,
      positionEmphasis: {
        position: bucket,
        label: pv.label,
        focus: [
          "Protect the arm/shoulder",
          "Gentle pain-free ROM only",
          `No ${verb} reps today`,
        ],
        note: `Your ${verb} arm/shoulder is flagged — skip ${verb} work today and protect it. Lower-body and trunk work is fine if pain-free.`,
        restricted: true,
        volume,
      },
    };
  }
  // Prehab focus per role (presentation); the WHY comes from the model's
  // primaryInjuryRisk so the numbers/risk stay single-sourced in the config.
  const focusByPosition: Record<PositionKey, string[]> = {
    qb: [
      "Rotator-cuff & scapular control",
      "Thoracic rotation mobility",
      "Rotational core power",
    ],
    wr: [
      "Eccentric hamstring (Nordic)",
      "Deceleration & landing mechanics",
      "Ankle & calf resilience",
    ],
    db: [
      "Eccentric hamstring & adductor",
      "Backpedal-to-sprint hip-flip control",
      "Deceleration mechanics",
    ],
    center: [
      "Wrist & forearm care",
      "Shoulder & scapular control",
      "Anti-rotation core brace",
    ],
    blitzer: [
      "Max-effort accel mechanics",
      "Eccentric hamstring & calf",
      "Hard-braking deceleration",
    ],
    wr_db: [
      "Eccentric hamstring & adductor",
      "Deceleration & cut mechanics",
      "Ankle & calf resilience",
    ],
  };
  return {
    ...p,
    positionEmphasis: {
      position: bucket,
      label: pv.label,
      focus: focusByPosition[bucket],
      note: pv.primaryInjuryRisk,
      volume,
    },
  };
}

// =============================================================================
// ARRIVAL-DAY LOAD CAP (V2.4) — long-haul travel is itself a fatigue cost
// =============================================================================

/** Hours of same-day seated travel that triggers the arrival-day cap. */
const ARRIVAL_DAY_LOAD_CAP_HOURS = 3;
/** Session already at/below activation level, or organiser/taper-owned — leave alone. */
const ARRIVAL_DAY_EXEMPT_INTENTS: ReadonlySet<PrescriptionIntent> =
  new Set<PrescriptionIntent>([
    "rest",
    "recovery",
    "mobility",
    "taper-prime",
    "competition",
  ]);

/**
 * A ≥3h same-day arrival (from `EventTravelService.arrivalDayTravelHours`,
 * V2.4) caps the day's session to activation only — the travel itself is a
 * fatigue cost the plan hasn't otherwise accounted for. Exempt intents are
 * already at/below activation level or owned by a higher-precedence guard
 * (game day, the taper-prime opener). Returns `rx` unchanged when there was
 * no long same-day arrival.
 */
function applyArrivalDayGuard(
  rx: DailyPrescription,
  arrivalDayTravelHours: number | null,
): DailyPrescription {
  if (
    arrivalDayTravelHours === null ||
    arrivalDayTravelHours < ARRIVAL_DAY_LOAD_CAP_HOURS
  ) {
    return rx;
  }
  if (ARRIVAL_DAY_EXEMPT_INTENTS.has(rx.intent)) {
    return rx;
  }
  return {
    ...rx,
    intent: "mobility",
    intentLabel: "Arrival-day activation",
    targetRpe: rx.targetRpe === null ? null : Math.min(rx.targetRpe, 4),
    targetMinutes: Math.min(rx.targetMinutes, 30),
    sprintReps: 0,
    strengthSets: 0,
    reasoning: `${Math.round(arrivalDayTravelHours)}h of travel today — activation only, no new fatigue on top of the trip. ${rx.reasoning}`,
  };
}

/**
 * Down-regulate the plan for an active injury / self-reported tightness affecting
 * a region used by sprint/high-intensity work. Severity-scaled; never overrides a
 * game day. Records `injuryAdjustment` so the change is traceable.
 */
/**
 * How an active injury/tightness down-regulates the session, by severity. The
 * caps are tunable data (Class 3) rather than literals in the guard logic.
 * Values are unchanged from the prior inline numbers.
 */
const INJURY_RESPONSE = {
  severe: { rpe: 3, minutes: 30, sets: 0 },
  moderate: { rpe: 3, maxMinutes: 40, maxSets: 3 },
  minor: { maxRpe: 6 },
} as const;

function applyInjuryGuard(
  p: DailyPrescription,
  restr: PeriodizationInputs["activeRestrictions"],
): DailyPrescription {
  if (!restr || !restr.restrictsSprint) return p;
  if (p.intent === "competition" || p.intent === "travel") return p;

  const severe = restr.severity === "severe";
  const moderate = restr.severity === "moderate";
  const hasSprintWork = p.sprintReps > 0 || p.intent === "sprint";
  // Minor tightness on a day with no sprint/high-intensity work: nothing to pull.
  if (!hasSprintWork && !severe && !moderate) return p;

  const regionLabel = restr.regions.length
    ? restr.regions.join(", ")
    : "soft tissue";
  let intent = p.intent;
  let intentLabel = p.intentLabel;
  let targetRpe = p.targetRpe;
  let targetMinutes = p.targetMinutes;
  let strengthSets = p.strengthSets;
  let reasoning = p.reasoning;

  if (severe) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = INJURY_RESPONSE.severe.rpe;
    targetMinutes = INJURY_RESPONSE.severe.minutes;
    strengthSets = INJURY_RESPONSE.severe.sets;
    reasoning = `Reported ${regionLabel} issue — recovery only today. Injury precedence over training.`;
  } else if (moderate) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = INJURY_RESPONSE.moderate.rpe;
    targetMinutes = Math.min(
      p.targetMinutes,
      INJURY_RESPONSE.moderate.maxMinutes,
    );
    strengthSets = Math.min(p.strengthSets, INJURY_RESPONSE.moderate.maxSets);
    reasoning = `Reported ${regionLabel} tightness — sprints pulled, easy session only. Injury precedence over training.`;
  } else {
    // minor: keep the day's shape but remove the sprint/high-intensity work
    intent = p.intent === "sprint" ? "mobility" : p.intent;
    intentLabel =
      p.intent === "sprint"
        ? "Mobility & technique"
        : `${p.intentLabel} (modified)`;
    targetRpe =
      p.targetRpe != null
        ? Math.min(p.targetRpe, INJURY_RESPONSE.minor.maxRpe)
        : p.targetRpe;
    reasoning = `${regionLabel} tightness — sprint/high-intensity work pulled for that region; keep it controlled.`;
  }

  return {
    ...p,
    intent,
    intentLabel,
    targetRpe,
    targetMinutes,
    sprintReps: 0,
    strengthSets,
    reasoning,
    injuryAdjustment: {
      regions: restr.regions,
      severity: restr.severity ?? "minor",
      summary: `${p.intentLabel} → ${intentLabel}; sprints ${p.sprintReps}→0`,
    },
  };
}

/**
 * How an event/season PHASE modifies a team-practice session. Day-type
 * (practice) is resolved first; the phase is a DATA-DRIVEN modifier looked up
 * here — the RPE/volume values are config, not control flow. The set of keys
 * defines WHICH phases a practice day owns; phases deliberately absent
 * (competition, recovery) are the ones practice yields to. Adding a future
 * phase (deload, multi-game weekend) is a NEW ROW here — never a new branch.
 */
interface PracticePhaseModifier {
  /** Session intent the practice is logged as (e.g. "mixed", or "recovery" on a
   * post-game day). Data-driven so a new phase row sets it without code changes. */
  intent: PrescriptionIntent;
  rpe: number;
  minutes: number;
  recoveryEmphasis: RecoveryEmphasis;
  /** Intent passed to nutritionFor — must be a valid CARB_PER_KG key. */
  nutritionIntent: PrescriptionIntent;
  /** "own" = practice is the day; "sharp" = taper-style; "recovery" = post-game. */
  framing: "own" | "sharp" | "recovery";
}

const PRACTICE_PHASE_MODIFIERS: Record<string, PracticePhaseModifier> = {
  accumulation: {
    intent: "mixed",
    rpe: 7,
    minutes: 90,
    recoveryEmphasis: "low",
    nutritionIntent: "mixed",
    framing: "own",
  },
  transition: {
    intent: "mixed",
    rpe: 7,
    minutes: 90,
    recoveryEmphasis: "low",
    nutritionIntent: "mixed",
    framing: "own",
  },
  // Sharp practice a few days out: still a real session → fuel as 'mixed', NOT a
  // glycogen top-up (top-up is only the final day, handled by the taper branch).
  taper: {
    intent: "mixed",
    rpe: 6,
    minutes: 60,
    recoveryEmphasis: "medium",
    nutritionIntent: "mixed",
    framing: "sharp",
  },
  // Final 48h of a taper → lighter walkthrough/activation + begin glycogen top-up.
  taper_final: {
    intent: "mixed",
    rpe: 5,
    minutes: 45,
    recoveryEmphasis: "medium",
    nutritionIntent: "taper-prime",
    framing: "sharp",
  },
  // Post-tournament recovery day that is ALSO a declared practice day: honour the
  // practice (the athlete is going) but at recovery intensity — the calendar fact
  // is modified by the recovery context, not discarded (audit finding 1.1). Same
  // RPE3/30min as the recovery default, so intensity is unchanged; only the label
  // and framing now acknowledge the practice.
  recovery: {
    intent: "recovery",
    rpe: 3,
    minutes: 30,
    recoveryEmphasis: "high",
    nutritionIntent: "recovery",
    framing: "recovery",
  },
};

/**
 * Resolve the practice modifier for a phase (and taper proximity). Returns null
 * when a practice day does NOT own this phase (e.g. competition / recovery),
 * so the caller falls through to the phase-driven defaults.
 */
/**
 * Taper timing windows + the individual (non-practice) taper session targets,
 * centralised so taper timing/shape is tuned in ONE place rather than scattered
 * across the taper-prime gate, the practice modifier, and the standalone taper
 * case. Values are unchanged from the prior inline literals.
 */
const TAPER_CONFIG = {
  /** ≤ this many hours to the game → taper-prime (very short, sharp). */
  taperPrimeHours: 24,
  /** ≤ this many days out = the lighter "final third" of a taper. */
  finalThirdDaysOut: 2,
  /** Default day-of-taper when hours-to-event is unknown. */
  defaultDayOfTaper: 7,
  /** Individual (non-practice) taper session targets. */
  individual: {
    regular: {
      intent: "sprint" as PrescriptionIntent,
      rpe: 6,
      minutes: 45,
      sprintReps: 6,
    },
    final: {
      intent: "mobility" as PrescriptionIntent,
      rpe: 4,
      minutes: 30,
      sprintReps: 4,
    },
  },
} as const;

function practiceModifierFor(
  phase: CompetitionPhase,
  daysOut: number | null,
): PracticePhaseModifier | null {
  const key =
    phase === "taper" &&
    daysOut !== null &&
    daysOut <= TAPER_CONFIG.finalThirdDaysOut
      ? "taper_final"
      : phase;
  return PRACTICE_PHASE_MODIFIERS[key] ?? null;
}

/** Minimum game count in a recently-completed event to trigger tournament recovery. */
const TOURNAMENT_RECOVERY_GAMES = 4;
/** Days after a congested tournament during which the engine forces recovery. */
const TOURNAMENT_RECOVERY_WINDOW_DAYS = 2;

/**
 * Returns 1 or 2 if `date` falls within the forced recovery window after a
 * congested tournament (≥ TOURNAMENT_RECOVERY_GAMES games), else null.
 *
 * "Day 1" = the calendar day immediately after the tournament ended.
 * "Day 2" = two calendar days after.
 *
 * Evidence: Nédélec et al. (2014) post-match fatigue markers persist 72 h after
 * a multi-game tournament; Bompa & Buzzichelli (2018) congestion-week management.
 */
function detectTournamentRecoveryDay(
  lastEvent: CompetitionEvent | null,
  date: Date,
): number | null {
  if (!lastEvent) return null;
  if ((lastEvent.expectedGameCount ?? 0) < TOURNAMENT_RECOVERY_GAMES)
    return null;
  const eventEnd = new Date(lastEvent.endsAt ?? lastEvent.startsAt);
  const msAfterEnd = date.getTime() - eventEnd.getTime();
  if (msAfterEnd <= 0) return null; // event still active or in future
  const dayAfterEnd = Math.ceil(msAfterEnd / 86_400_000);
  return dayAfterEnd <= TOURNAMENT_RECOVERY_WINDOW_DAYS ? dayAfterEnd : null;
}

/**
 * Builds the forced recovery/mobility prescription for day +1 and day +2 after
 * a congested tournament. Only called for non-practice days; practice days are
 * handled by switching their PRACTICE_PHASE_MODIFIERS key to "recovery".
 */
function applyPostTournamentRecovery(
  inputs: PeriodizationInputs,
  dayAfterTournament: number,
): DailyPrescription {
  const { date, bodyweightKg, acwr, seasonPhase, upcoming, lastEvent } = inputs;
  const bodyweight = bodyweightKg ?? FALLBACK_BODYWEIGHT_KG;
  const gameCount = lastEvent!.expectedGameCount ?? 0;
  const eventName =
    lastEvent!.competitionShortName ??
    lastEvent!.competitionName ??
    "your tournament";
  const hoursUntilNext = nextEventHours(date, upcoming);
  const intent: PrescriptionIntent =
    dayAfterTournament === 1 ? "recovery" : "mobility";
  return finalize({
    date,
    phase: inputs.phase,
    intent,
    targetRpe: dayAfterTournament === 1 ? 3 : 4,
    targetMinutes: dayAfterTournament === 1 ? 30 : 45,
    sprintReps: 0,
    strengthSets: 0,
    reasoning:
      dayAfterTournament === 1
        ? `Day 1 after ${eventName} (${gameCount} games) — recovery only. Acute neuromuscular damage is still being repaired; no sprint or strength today.`
        : `Day 2 after ${eventName} (${gameCount} games) — light mobility only; neuromuscular recovery is still active.`,
    recoveryEmphasis: dayAfterTournament === 1 ? "critical" : "high",
    nutrition: nutritionFor("recovery", bodyweight, false, false),
    driverEvent: lastEvent!,
    hoursUntilNextEvent: hoursUntilNext,
    acwrAtIssue: acwr,
    seasonPhase: seasonPhase ?? null,
    tournamentRecoveryAdjustment: {
      dayAfterTournament,
      gamesPlayed: gameCount,
      tournamentName: eventName,
    },
  });
}

/**
 * Applies ACWR / density / weekly-progression safety modulation to a hint
 * produced by planWeekIntents(). This makes the schedule-aware hint path
 * receive the same safety layering that pickAccumulationIntent() and
 * seasonShapedIntent() apply inline to their DOW fallback results.
 */
function modulateIntentForLoad(
  intent: PrescriptionIntent,
  acwr: number | null,
  heavyDensity: boolean,
  weeklyProgressionUnsafe: boolean,
): PrescriptionIntent {
  let i = intent;
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (i === "sprint" || i === "strength") i = "mobility";
    else if (i === "mixed") i = "technical";
  }
  if (heavyDensity && i !== "rest") {
    if (i === "strength") i = "technical";
    if (i === "mixed") i = "mobility";
  }
  // Weekly progression cap: if this week's cumulative load already exceeds the
  // safe increase threshold, pull back high-intensity work for the rest of the week.
  if (
    weeklyProgressionUnsafe &&
    (i === "sprint" || i === "strength" || i === "mixed")
  ) {
    i = "technical";
  }
  return i;
}

/**
 * The core decision. Read top-to-bottom: highest-priority overrides first
 * (game day, taper, recovery, ACWR safety), then phase/season defaults.
 */
function decideBasePrescription(
  inputs: PeriodizationInputs,
): DailyPrescription {
  const {
    date,
    phase,
    upcoming,
    lastEvent,
    acwr,
    readiness,
    bodyweightKg,
    density14d,
    seasonPhase = null,
  } = inputs;

  const driverEvent = pickDriverEvent(date, upcoming, lastEvent);
  const hoursUntilNext = nextEventHours(date, upcoming);
  const bodyweight = bodyweightKg ?? FALLBACK_BODYWEIGHT_KG;
  const effectiveReadiness = readiness ?? FALLBACK_READINESS;
  // Heavy density = a high 14-day game total OR a single congested day. A
  // tournament of 8 games over 2 days (4/day) never reaches the 10-games/14d
  // total, yet it is the highest-risk congestion there is — so a peak-day game
  // count at or above DENSITY_CONGESTED_DAY_GAMES also trips it.
  const heavyDensity =
    !!density14d &&
    (density14d.totalGames >= DENSITY_HEAVY_GAMES_14D ||
      (density14d.peakDayGameCount ?? 0) >= DENSITY_CONGESTED_DAY_GAMES);
  // Hot day → higher sweat/fluid need. Uses the same heat threshold the weather
  // guard does (apparent ≥ 28°C). Adds fluid to the nutrition target.
  const apparentTemp =
    inputs.weather?.apparentC ?? inputs.weather?.tempC ?? null;
  const hotDay =
    typeof apparentTemp === "number" && apparentTemp >= HEAT_CAUTION_C;

  // 1a. Currently inside a competition window → game day.
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
      nutrition: nutritionFor("competition", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 2. Within 24h of a game → taper-prime (very short, sharp, no fatigue).
  if (
    hoursUntilNext !== null &&
    hoursUntilNext <= TAPER_CONFIG.taperPrimeHours
  ) {
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
      nutrition: nutritionFor("taper-prime", bodyweight, heavyDensity, hotDay),
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
      targetRpe: 2,
      targetMinutes: 15,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `ACWR ${acwr.toFixed(2)} is in the danger zone — full rest today. Gentle 15-min mobility and stretching only; no cardio or loading.`,
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("rest", bodyweight, heavyDensity, hotDay),
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
      nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4.5 Detect post-congested-tournament context. Checked before the practice
  // path so we can override the practice modifier to recovery intensity AND gate
  // non-practice days uniformly.
  const tournamentRecoveryDay = detectTournamentRecoveryDay(lastEvent, date);
  // 4.5. Travel day — inside a club/national event window but not a game day.
  // Deliberately placed AFTER the ACWR-danger and readiness-collapse guards
  // (unlike competition/taper-prime, a travel day is not a fixed commitment —
  // an athlete in the danger zone must still get the "critical" rest framing,
  // not the generic travel message).
  if (phase === "travel") {
    return finalize({
      date,
      phase,
      intent: "travel",
      targetRpe: null,
      targetMinutes: 0,
      sprintReps: 0,
      strengthSets: 0,
      reasoning:
        "Travel day. Rest, stay hydrated, keep legs moving between transit. Arrive fresh.",
      recoveryEmphasis: "high",
      nutrition: nutritionFor("travel", bodyweight, false, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4.6 DAY TYPE = team practice. Resolved from the calendar FIRST (you're going
  // to practice regardless), then the event/season PHASE is applied as a
  // data-driven modifier (PRACTICE_PHASE_MODIFIERS) — the RPE/volume/fuel are
  // config, not control flow. A null modifier means a practice day does NOT own
  // this phase (only competition now — the game is the session) → fall through.
  // Post-tournament override: practice is still attended but at recovery intensity
  // (we don't skip practice, we just cap the load at the "recovery" row).
  const practiceDaysOut =
    hoursUntilNext !== null
      ? Math.max(1, Math.ceil(hoursUntilNext / 24))
      : null;
  const practiceMod = inputs.isTeamPractice
    ? tournamentRecoveryDay !== null
      ? PRACTICE_PHASE_MODIFIERS["recovery"]
      : practiceModifierFor(phase, practiceDaysOut)
    : null;
  if (practiceMod) {
    const eventName = driverEvent
      ? (driverEvent.competitionShortName ?? driverEvent.competitionName)
      : null;
    const practiceReasoning =
      tournamentRecoveryDay !== null
        ? `Practice today, but you're in post-tournament recovery (day ${tournamentRecoveryDay} after ${eventName ?? "your tournament"}) — active recovery and mobility only; no hard reps.`
        : practiceMod.framing === "recovery"
          ? "Practice today, but you're in post-game recovery — keep it very light: active recovery and mobility only, no hard reps."
          : practiceMod.framing === "sharp"
            ? `Practice today is your session${
                practiceDaysOut !== null
                  ? ` — ${practiceDaysOut} day${practiceDaysOut === 1 ? "" : "s"} to ${eventName ?? "your next game"}`
                  : ""
              }. Keep it sharp, not heavy: crisp reps, full recovery, no grinding.`
            : "Team practice today — that's your main session. Keep any extra individual work light (mobility / activation).";
    return finalize({
      date,
      phase,
      intent: practiceMod.intent,
      intentLabel: "Flag football practice",
      targetRpe: practiceMod.rpe,
      targetMinutes: practiceMod.minutes,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: practiceReasoning,
      recoveryEmphasis: practiceMod.recoveryEmphasis,
      nutrition: nutritionFor(
        practiceMod.nutritionIntent,
        bodyweight,
        heavyDensity,
        hotDay,
      ),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
      seasonPhase: seasonPhase ?? null,
      tournamentRecoveryAdjustment:
        tournamentRecoveryDay !== null
          ? {
              dayAfterTournament: tournamentRecoveryDay,
              gamesPlayed: lastEvent?.expectedGameCount ?? 0,
              tournamentName: eventName,
            }
          : null,
    });
  }

  // 4.8 Non-practice post-tournament recovery: for free accumulation/transition
  // days within 2 days of a congested tournament, force recovery regardless of
  // phase. Practice days are already handled by the "recovery" modifier above.
  if (tournamentRecoveryDay !== null && !inputs.isTeamPractice) {
    return applyPostTournamentRecovery(inputs, tournamentRecoveryDay);
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
        nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "taper": {
      // Inside taper window: keep CNS sharp, drop volume. Targets are config
      // (TAPER_CONFIG.individual); closer to the event = the lighter "final" row.
      const dayOfTaper =
        hoursUntilNext !== null
          ? Math.max(1, Math.ceil(hoursUntilNext / 24))
          : TAPER_CONFIG.defaultDayOfTaper;
      const t =
        dayOfTaper <= TAPER_CONFIG.finalThirdDaysOut
          ? TAPER_CONFIG.individual.final
          : TAPER_CONFIG.individual.regular;
      return finalize({
        date,
        phase,
        intent: t.intent,
        targetRpe: t.rpe,
        targetMinutes: t.minutes,
        sprintReps: t.sprintReps,
        strengthSets: 0,
        reasoning: taperReasoning(driverEvent, dayOfTaper),
        recoveryEmphasis: "medium",
        nutrition: nutritionFor("taper", bodyweight, heavyDensity, hotDay),
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
        nutrition: nutritionFor("transition", bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "accumulation":
    default: {
      // No event micro-phase is driving the week. Use the schedule-aware intent
      // hint from weekAhead()'s planWeekIntents pass when available — it places
      // sessions relative to actual practices and games rather than by DOW.
      // When a hint is provided, apply the same ACWR / density / weekly-progression
      // modulation that pickAccumulationIntent() and seasonShapedIntent() apply
      // inline, via modulateIntentForLoad(). This closes the bypass bug where a
      // schedule-aware hint could slip past safety guards.
      const weekHint = inputs.weeklyIntentHint ?? null;
      const weeklyUnsafe = inputs.weeklyProgressionUnsafe ?? false;

      if (seasonPhase && seasonPhase !== "preseason") {
        let intent =
          weekHint !== null
            ? modulateIntentForLoad(weekHint, acwr, heavyDensity, weeklyUnsafe)
            : seasonShapedIntent(date, seasonPhase, acwr, heavyDensity);
        // Also apply the weekly progression cap to the DOW fallback (ACWR/density
        // already applied inside seasonShapedIntent).
        if (
          weekHint === null &&
          weeklyUnsafe &&
          (intent === "sprint" || intent === "strength" || intent === "mixed")
        ) {
          intent = "technical";
        }
        const t = baseTargets(intent);
        return finalize({
          date,
          phase,
          intent,
          targetRpe: t.targetRpe,
          targetMinutes: t.targetMinutes,
          sprintReps: t.sprintReps,
          strengthSets: t.strengthSets,
          reasoning: seasonReasoning(seasonPhase, intent),
          recoveryEmphasis: heavyDensity ? "medium" : "low",
          nutrition: nutritionFor(intent, bodyweight, heavyDensity, hotDay),
          driverEvent,
          hoursUntilNextEvent: hoursUntilNext,
          acwrAtIssue: acwr,
          seasonPhase,
        });
      }

      let intent =
        weekHint !== null
          ? modulateIntentForLoad(weekHint, acwr, heavyDensity, weeklyUnsafe)
          : pickAccumulationIntent(date, acwr, heavyDensity);
      // Apply the weekly progression cap to the DOW fallback as well.
      if (
        weekHint === null &&
        weeklyUnsafe &&
        (intent === "sprint" || intent === "strength" || intent === "mixed")
      ) {
        intent = "technical";
      }
      const t = buildTargets(intent);
      return finalize({
        date,
        phase,
        intent,
        targetRpe: t.targetRpe,
        targetMinutes: t.targetMinutes,
        sprintReps: t.sprintReps,
        strengthSets: t.strengthSets,
        reasoning: accumulationReasoning(intent, acwr, heavyDensity),
        recoveryEmphasis: heavyDensity ? "medium" : "low",
        nutrition: nutritionFor(intent, bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
        seasonPhase: seasonPhase ?? null,
      });
    }
  }
}

// =============================================================================
// MACRO SEASON PHASE — annual periodization (athlete-declared, no hardcoded months)
// =============================================================================

/**
 * Resolve the athlete's macro season phase for a date from their declared
 * `season_calendar` windows. Supports specific spans ("YYYY-MM-DD") and recurring
 * annual ones ("MM-DD", may wrap the year end). First matching window wins.
 * Returns null when no window covers the date (caller falls back to a generic
 * build). NOTHING is hardcoded — the windows are 100% the player's data.
 */
export function macroPhaseFor(
  date: Date,
  windows: SeasonWindow[] | null | undefined,
): SeasonPhase | null {
  if (!windows || windows.length === 0) {
    return null;
  }
  const iso = toIsoDate(date); // YYYY-MM-DD
  const md = iso.slice(5); // MM-DD
  for (const w of windows) {
    if (w && w.from && w.to && inSeasonWindow(iso, md, w.from, w.to)) {
      return w.phase;
    }
  }
  return null;
}

function inSeasonWindow(
  iso: string,
  md: string,
  from: string,
  to: string,
): boolean {
  const recurring = from.length === 5 && to.length === 5; // "MM-DD"
  if (recurring) {
    return from <= to ? md >= from && md <= to : md >= from || md <= to;
  }
  const f = from.slice(0, 10);
  const t = to.slice(0, 10);
  return f <= t ? iso >= f && iso <= t : iso >= f || iso <= t;
}

// =============================================================================
// SCHEDULE-AWARE WEEK PLANNING
//
// The day-of-week array approach (Mon=strength, Tue=sprint, Wed=rest, …) is
// fundamentally wrong for a real athlete's week: if practices fall on Mon/Wed/Thu
// you can't give sprints on those days, and you can't hardcode rest to Wednesday
// if practice IS Wednesday. The correct approach:
//
//  1. Identify "locked" days (practices, games, taper, post-game recovery) —
//     prescribeFor already handles these correctly.
//  2. For the remaining free "accumulation" days, place sessions based on
//     PROXIMITY to locked high-load anchors (not by weekday):
//       • Day adjacent to a game/competition → rest (mandatory buffer)
//       • Day immediately before a practice → technical (complement; save legs)
//       • Day immediately after a practice → strength (different stimulus)
//       • Day with ≥ 2 days buffer from any practice → quality session (strength
//         or sprint, alternating to avoid same-type back-to-back)
//       • Any remaining free days beyond the 5-session cap → rest
//  3. Spread sessions: never assign consecutive free training days when non-
//     consecutive slots are available (avoids Fri+Sat strength+strength on top
//     of Thu practice).
//
// Evidence: Bompa & Buzzichelli (2018) periodization principles; NSCA-TSAC
// flag-football guidelines; Gabbett (2016) BJSM ACWR load management.
// =============================================================================

/**
 * Plans the full 7-day intent assignment for free accumulation days, using the
 * actual schedule (practices, games, tournaments) rather than day-of-week arrays.
 * Returns null for days already owned by prescribeFor (practices, competition,
 * taper, recovery). Non-null values are passed as `weeklyIntentHint` into
 * prescribeFor, where modulateIntentForLoad() applies ACWR / density / weekly-
 * progression safety modulation before the intent reaches the prescription.
 */
export function planWeekIntents(
  teamPracticeFlags: boolean[],
  phases: CompetitionPhase[],
): (PrescriptionIntent | null)[] {
  const intents: (PrescriptionIntent | null)[] = new Array(7).fill(null);

  // Game-type days mandate rest on adjacent free days.
  const isGameDay = phases.map(
    (p) => p === "competition" || p === "taper" || p === "recovery",
  );

  // Locked days: prescribeFor already handles these correctly.
  const isLocked = Array.from(
    { length: 7 },
    (_, i) => teamPracticeFlags[i] || isGameDay[i],
  );

  // Only plan free accumulation days — everything else keeps a null hint.
  const freeDays = Array.from({ length: 7 }, (_, i) => i).filter(
    (i) => !isLocked[i] && phases[i] === "accumulation",
  );
  if (!freeDays.length) return intents;

  const nearestBefore = (idx: number, flags: boolean[]): number => {
    for (let d = 1; d <= idx; d++) if (flags[idx - d]) return d;
    return 99;
  };
  const nearestAfter = (idx: number, flags: boolean[]): number => {
    for (let d = 1; d < 7 - idx; d++) if (flags[idx + d]) return d;
    return 99;
  };

  interface Slot {
    idx: number;
    gameB: number;
    gameA: number;
    pracB: number;
    pracA: number;
    quality: number;
  }

  const slots: Slot[] = freeDays.map((idx) => {
    const gameB = nearestBefore(idx, isGameDay);
    const gameA = nearestAfter(idx, isGameDay);
    const pracB = nearestBefore(idx, teamPracticeFlags);
    const pracA = nearestAfter(idx, teamPracticeFlags);
    const minGame = Math.min(gameB, gameA);
    const minPrac = Math.min(pracB, pracA);
    const maxPrac = Math.max(pracB, pracA);
    // Quality: game buffer dominates; practice buffer breaks ties.
    const quality = minGame * 1000 + minPrac * 10 + maxPrac;
    return { idx, gameB, gameA, pracB, pracA, quality };
  });

  // Budget: max 5 active days total; mandatory days already claimed.
  const mandatoryCount = isLocked.filter(Boolean).length;
  const budget = Math.max(0, 5 - mandatoryCount);

  // Select training slots greedily: best quality first; avoid consecutive days
  // (Fri+Sat back-to-back after Thu practice is a common trap).
  const sorted = [...slots].sort((a, b) => b.quality - a.quality);
  const trainingIdxs = new Set<number>();

  for (const { idx } of sorted) {
    if (trainingIdxs.size >= budget) break;
    if ([...trainingIdxs].some((t) => Math.abs(t - idx) === 1)) continue;
    trainingIdxs.add(idx);
  }

  // Assign REST to non-selected free days.
  for (const { idx } of slots) {
    if (!trainingIdxs.has(idx)) intents[idx] = "rest";
  }

  // Assign training intents chronologically (earlier days first).
  let strengthAssigned = 0;
  let sprintAssigned = 0;
  for (const idx of [...trainingIdxs].sort((a, b) => a - b)) {
    const s = slots.find((sl) => sl.idx === idx)!;
    const minGameDist = Math.min(s.gameB, s.gameA);

    // Shouldn't happen (we require minGameDist > 0 in slot selection), but guard.
    if (minGameDist <= 1) {
      intents[idx] = "rest";
      continue;
    }

    // Day immediately before a practice → technical (complement practice; don't
    // pre-fatigue legs with strength or sprint before the practice).
    if (s.pracA === 1) {
      intents[idx] = "technical";
      continue;
    }

    // Day immediately after a practice → strength (different neuromuscular
    // stimulus; the adaptation window from practice is still open).
    if (s.pracB === 1) {
      intents[idx] = "strength";
      strengthAssigned++;
      continue;
    }

    // Good buffer from practices on both sides (≥ 2 days): quality session.
    // Alternate strength and sprint; cap sprint at 2 per week.
    if (Math.min(s.pracB, s.pracA) >= 2) {
      if (sprintAssigned < strengthAssigned && sprintAssigned < 2) {
        intents[idx] = "sprint";
        sprintAssigned++;
      } else {
        intents[idx] = "strength";
        strengthAssigned++;
      }
      continue;
    }

    // Sandwiched between practices (both ≤ 2 days) with no single "after" or
    // "before" adjacency: technical is the safest complementary choice.
    intents[idx] = "technical";
  }

  return intents;
}

// =============================================================================
// WEEKLY REST ENFORCEMENT
//
// Evidence (Bompa & Buzzichelli 2018; NSCA-TSAC; Gabbett 2016 BJSM):
//   – Minimum 2 full rest days per week is non-negotiable for soft-tissue
//     recovery and nervous-system adaptation in team-sport athletes.
//   – Max 5 active training days caps weekly load before injury risk spikes.
//   – Two-a-day (double) sessions are preseason/offseason only: different
//     energy systems, ≥ 6 h apart, readiness ≥ 75, ACWR ≤ 1.2.
// =============================================================================

/** Demotion priority when the weekly cap forces rest: lowest disruption first. */
// Sessions are demoted to rest from the front of this list when the week has
// fewer than 2 rest days. "taper-prime" leads because in a loaded week the
// day immediately before a game is the most natural rest slot — mandatory rest
// trumps a pre-game primer. Regular training sessions follow in ascending
// load/disruption order (mobility first, strength last).
const DEMOTION_PRIORITY: PrescriptionIntent[] = [
  "taper-prime",
  "mobility",
  "technical",
  "mixed",
  "sprint",
  "strength",
];

/**
 * Post-processing pass: ensures ≥ 2 full rest days in the 7-day window.
 * Team-practice days, game days, and already-rest/recovery days are never
 * demoted. Taper-prime IS demotable — in a loaded week the pre-game slot is
 * the most natural rest day (see DEMOTION_PRIORITY). Converts the lowest-
 * priority eligible session(s) to rest, least disruptive first.
 */
export function enforceWeeklyRestMinimum(
  prescriptions: DailyPrescription[],
  teamPracticeFlags: boolean[],
): DailyPrescription[] {
  const MIN_REST = 2;
  const restCount = prescriptions.filter((p) => p.intent === "rest").length;
  if (restCount >= MIN_REST) return prescriptions;

  const needed = MIN_REST - restCount;
  const demotable = prescriptions
    .map((p, i) => ({ i, p, priority: DEMOTION_PRIORITY.indexOf(p.intent) }))
    .filter(
      ({ p, i, priority }) =>
        !teamPracticeFlags[i] &&
        p.intent !== "rest" &&
        p.intent !== "recovery" &&
        p.intent !== "competition" &&
        priority !== -1,
      // taper-prime is no longer excluded — in a loaded week the pre-game slot
      // is the most natural rest day. DEMOTION_PRIORITY already ranks it first,
      // so it's only chosen when there's truly no better candidate.
    )
    .sort((a, b) => a.priority - b.priority);

  const toRest = new Set(demotable.slice(0, needed).map((d) => d.i));
  return prescriptions.map((p, i) =>
    toRest.has(i)
      ? {
          ...p,
          intent: "rest" as PrescriptionIntent,
          intentLabel: INTENT_LABELS["rest"],
          targetRpe: 2,
          targetMinutes: 15,
          sprintReps: 0,
          strengthSets: 0,
          reasoning:
            "Rest day — 2 full rest days per week are non-negotiable for adaptation. Complete your 15-min daily mobility and stretching routine.",
          recoveryEmphasis: "low" as RecoveryEmphasis,
          secondSession: null,
        }
      : p,
  );
}

/**
 * Adds a PM second session to eligible strength days in the week view.
 *
 * Rules (Stone et al. 2007; NSCA-TSAC two-a-day guidelines):
 *  – Phase: preseason or early offseason only
 *  – Slot: any strength day that is ≥ 2 days from the nearest game/taper/recovery
 *    (schedule-aware — no longer locked to Mon/Thu)
 *  – Energy systems must differ — strength AM drives sprint or technical PM,
 *    never the same system twice
 *  – PM is technical (not sprint) when a practice follows the next day, to
 *    avoid stacking two high-CNS sessions within ~18 h
 *  – Not on team-practice days (practice IS the primary session)
 *  – Today (i=0): gated on readiness ≥ 75 AND ACWR ≤ 1.2
 *  – Future days (i>0): shown as eligible without live gates
 */
export function addSecondSessions(
  prescriptions: DailyPrescription[],
  teamPracticeFlags: boolean[],
  competitionPhases: CompetitionPhase[],
  todayReadiness: number | null,
  todayAcwr: number | null,
): DailyPrescription[] {
  // Days whose competition phase demands ≥ 2 days buffer before two-a-days.
  // Stacking a PM session ≤ 1 day from game/taper/recovery compromises
  // match-day readiness (Stone et al. 2007; NSCA-TSAC two-a-day guidelines).
  const isHighLoad = competitionPhases.map(
    (p) => p === "competition" || p === "taper" || p === "recovery",
  );

  return prescriptions.map((p, i) => {
    const phase = p.seasonPhase;
    if (phase !== "preseason" && phase !== "offseason") return p;
    if (teamPracticeFlags[i]) return p;
    if (p.intent !== "strength") return p;
    if (p.targetRpe === null) return p; // already a rest/recovery override

    // Require ≥ 2 days gap to the nearest high-load day — schedule-aware,
    // not weekday-based. This replaces the Mon/Thu DOW hard-lock.
    const nearestHighLoad = Array.from({ length: 7 }, (_, j) =>
      isHighLoad[j] ? Math.abs(i - j) : 99,
    ).reduce((min, d) => Math.min(min, d), 99);
    if (nearestHighLoad < 2) return p;

    // Apply live readiness/ACWR safety gates for today only.
    if (i === 0) {
      if ((todayReadiness ?? 70) < 75) return p;
      if (todayAcwr !== null && todayAcwr > 1.2) return p;
    }

    // Energy-system diversification: prefer technical PM when a practice follows
    // tomorrow (avoids stacking two high-CNS sessions within ~18 h); otherwise
    // sprint PM capitalises on the strength-primed CNS state.
    const practiceFollowsTomorrow = i + 1 < 7 && teamPracticeFlags[i + 1];
    const secondIntent: PrescriptionIntent = practiceFollowsTomorrow
      ? "technical"
      : "sprint";

    return {
      ...p,
      secondSession: {
        intent: secondIntent,
        intentLabel: INTENT_LABELS[secondIntent],
        targetRpe: Math.max(5, (p.targetRpe ?? 7) - 1),
        targetMinutes: secondIntent === "sprint" ? 40 : 45,
        reasoning:
          secondIntent === "sprint"
            ? "PM speed session — 6 h after morning strength. Short, high-quality sprints while CNS is primed and pre-fatigue is low."
            : "PM technical session — skills and route running at low metabolic cost; capitalises on strength stimulus without CNS overlap.",
      },
    };
  });
}

/**
 * Day-of-week week shape biased by macro season phase. Off-season is
 * strength/conditioning-led; in-season maintains strength + sharpens skills;
 * transition is active-rest/base. Pre-season uses the generic build shape.
 * Safety modulation (elevated ACWR / heavy density) mirrors accumulation.
 */
function seasonShapedIntent(
  date: Date,
  season: SeasonPhase,
  acwr: number | null,
  heavyDensity: boolean,
): PrescriptionIntent {
  const dow = date.getDay(); // 0 = Sun
  let week: PrescriptionIntent[];
  // All arrays: Sun=0 is rest, Wed=3 is rest — two mandatory full rest days.
  // Max 5 active days satisfies the 7-session / 2-days-off spec law.
  switch (season) {
    case "offseason": // GPP — build strength and aerobic base
      //       Sun      Mon         Tue     Wed     Thu          Fri          Sat
      week = [
        "rest",
        "strength",
        "mixed",
        "rest",
        "strength",
        "technical",
        "mixed",
      ];
      break;
    case "inseason": // maintain strength; sharpen skill; no 2-a-days
      //       Sun      Mon          Tue          Wed     Thu           Fri         Sat
      week = [
        "rest",
        "strength",
        "technical",
        "rest",
        "technical",
        "strength",
        "mixed",
      ];
      break;
    case "peak": // peaking: sharp, low volume, 2 rest days, no 2-a-days
      //       Sun      Mon        Tue          Wed     Thu           Fri        Sat
      week = [
        "rest",
        "sprint",
        "technical",
        "rest",
        "technical",
        "sprint",
        "recovery",
      ];
      break;
    case "postseason": // active regeneration; easy movement only
    case "transition": // active-rest / aerobic base (legacy alias)
      //       Sun      Mon          Tue          Wed     Thu          Fri          Sat
      week = [
        "rest",
        "recovery",
        "mobility",
        "rest",
        "mobility",
        "recovery",
        "mobility",
      ];
      break;
    case "preseason":
    default:
      return pickAccumulationIntent(date, acwr, heavyDensity);
  }
  let intent = week[dow];
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") intent = "mobility";
    else if (intent === "mixed") intent = "technical";
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}

function seasonReasoning(
  season: SeasonPhase,
  intent: PrescriptionIntent,
): string {
  switch (season) {
    case "offseason":
      return `Off-season · strength & conditioning block. Today is a ${intent} day.`;
    case "inseason":
      return `In-season · maintain strength and sharpen skills. Today is a ${intent} day.`;
    case "peak":
      return `Peak season · stay sharp and fresh — quality over quantity. Today is a ${intent} day.`;
    case "postseason":
      return `Post-season · active regeneration and aerobic base. Today is a ${intent} day.`;
    case "transition":
      return `Transition · active rest and aerobic base. Today is a ${intent} day.`;
    case "preseason":
    default:
      return `Pre-season build — progressing load toward the season. Today is a ${intent} day.`;
  }
}

// =============================================================================
// WEATHER GUARD — constrains the chosen intent for safe outdoor training
// =============================================================================

// Spec defaults (°C apparent, km/h, mm) — team-configurable later, like the
// ACWR/readiness thresholds. See WEATHER_LOGIC.md.
const HEAT_CAUTION_C = 28;
const HEAT_REDUCE_C = 32;
const HEAT_AVOID_C = 35;
const HEAT_STOP_C = 38;
const COLD_CAUTION_C = 4;
const COLD_AVOID_C = -5;
const WIND_UNRELIABLE_KMH = 40;
const RAIN_PRECIP_MM = 0.5;
const RAIN_WEATHER_CODE = 61;
const STORM_CODE_MIN = 95;
const STORM_CODE_MAX = 99;
const HEAT_LOAD_FACTOR_REDUCE = 1.1;
const HEAT_LOAD_FACTOR_AVOID = 1.2;
const HEAT_VOLUME_CUT = 0.8;

// V2.4 — heat/cold ACCLIMATIZATION. The same 32°C affects a Ljubljana athlete
// landing in American Samoa yesterday very differently than a Samoan native —
// unacclimatized athletes carry materially higher heat/cold-illness risk in
// the first ~10-14 days at a new climate (evidence-based: heat acclimatization
// is largely complete by ~14 days, most benefit in the first week). Rather
// than requiring a computed home-vs-destination temperature delta (data this
// app doesn't have — no "home climate baseline"), the guard tightens EVERY
// threshold symmetrically (heat thresholds down, cold thresholds up) while
// `acclimatizationDay` (days since arrival, from athlete_travel_log) is
// inside the window — this correctly protects a hot-destination arrival AND
// a cold-destination arrival with one mechanism, and decays linearly to zero
// adjustment by day 14 (fully acclimatized, matches raw V1 behaviour).
const ACCLIMATIZATION_WINDOW_DAYS = 14;
const ACCLIMATIZATION_MAX_SHIFT_C = 4;

function acclimatizationShiftC(acclimatizationDay: number | null): number {
  if (
    acclimatizationDay === null ||
    acclimatizationDay < 0 ||
    acclimatizationDay >= ACCLIMATIZATION_WINDOW_DAYS
  ) {
    return 0;
  }
  return (
    ACCLIMATIZATION_MAX_SHIFT_C *
    (1 - acclimatizationDay / ACCLIMATIZATION_WINDOW_DAYS)
  );
}

// Intense + outdoor intents → subject to the guard. Strength (indoor), mobility,
// technical, recovery, rest, and competition (organiser's call) are agnostic.
const OUTDOOR_INTENSE: ReadonlySet<PrescriptionIntent> =
  new Set<PrescriptionIntent>(["sprint", "mixed", "taper-prime"]);

function substituteForWet(intent: PrescriptionIntent): PrescriptionIntent {
  // Wet grass kills sprints/cuts; move to an indoor session.
  return intent === "taper-prime" ? "mobility" : "strength";
}

/**
 * Apply the weather guard to a base prescription. Returns the prescription
 * unchanged (no `weatherAdjustment`) when weather is unknown, the intent is
 * weather-agnostic, or conditions are benign. A coach override keeps the planned
 * session but records the call (a thunderstorm still warns).
 */
export function applyWeatherGuard(
  rx: DailyPrescription,
  weather: WeatherInput | null,
  coachOverride: boolean,
  acclimatizationDay: number | null = null,
): DailyPrescription {
  if (!weather || !OUTDOOR_INTENSE.has(rx.intent)) {
    return rx;
  }

  const apparent =
    typeof weather.apparentC === "number"
      ? weather.apparentC
      : typeof weather.tempC === "number"
        ? weather.tempC
        : null;
  const code = weather.weatherCode;
  const storm =
    code !== null && code >= STORM_CODE_MIN && code <= STORM_CODE_MAX;
  const wet =
    (code !== null && code >= RAIN_WEATHER_CODE && code < STORM_CODE_MIN) ||
    (weather.precipMm !== null && weather.precipMm > RAIN_PRECIP_MM);
  const wind = weather.windKmh;

  // Unacclimatized shift: tightens heat thresholds down and cold thresholds
  // up while the athlete is newly arrived at a different climate (0 once
  // acclimatized/no travel declared — byte-identical to V1 behaviour then).
  const shift = acclimatizationShiftC(acclimatizationDay);
  const acclimatizing = shift > 0;
  const heatStopEff = HEAT_STOP_C - shift;
  const heatAvoidEff = HEAT_AVOID_C - shift;
  const heatReduceEff = HEAT_REDUCE_C - shift;
  const heatCautionEff = HEAT_CAUTION_C - shift;
  const coldAvoidEff = COLD_AVOID_C + shift;
  const coldCautionEff = COLD_CAUTION_C + shift;
  const acclimNote = acclimatizing
    ? ` Still acclimatizing (day ${acclimatizationDay} at this climate) — extra caution applied.`
    : "";

  const original = rx.intent;
  const heatLoadFactor =
    apparent === null
      ? 1
      : apparent >= heatAvoidEff
        ? HEAT_LOAD_FACTOR_AVOID
        : apparent >= heatReduceEff
          ? HEAT_LOAD_FACTOR_REDUCE
          : 1;
  const t = (n: number) => Math.round(n);

  let action: WeatherAdjustment["action"] = "none";
  let adjusted = original;
  let reason = "";

  if (storm) {
    action = "stop";
    adjusted = "recovery";
    reason =
      "Thunderstorm — lightning risk. Outdoor training stopped; move indoors or rest.";
  } else if (apparent !== null && apparent >= heatStopEff) {
    action = "stop";
    adjusted = "recovery";
    reason = `${t(apparent)}°C feels-like — too hot to train outdoors. Indoor recovery or rest today.${acclimNote}`;
  } else if (apparent !== null && apparent >= heatAvoidEff) {
    action = "relocate";
    adjusted = "mobility";
    reason = `${t(apparent)}°C feels-like — no intense outdoor work. Moved to indoor mobility & skills; hydrate hard.${acclimNote}`;
  } else if (wet) {
    action = "substitute";
    adjusted = substituteForWet(original);
    reason =
      "Wet grass — slip/ACL risk on sprints & cuts. Moved indoors to a tempo + strength session.";
  } else if (apparent !== null && apparent <= coldAvoidEff) {
    action = "substitute";
    adjusted = "mobility";
    reason = `${t(apparent)}°C feels-like — no outdoor max-effort in the cold. Indoor low-intensity mobility instead.${acclimNote}`;
  } else if (apparent !== null && apparent >= heatReduceEff) {
    action = "scale";
    reason = `${t(apparent)}°C feels-like — cut intense volume ~20%, train in the cooler hour, hydrate. Expect RPE to feel ~1 higher; log what you actually felt.${acclimNote}`;
  } else if (apparent !== null && apparent >= heatCautionEff) {
    reason = `${t(apparent)}°C — warm. Add hydration and breaks; session unchanged.${acclimNote}`;
  } else if (apparent !== null && apparent <= coldCautionEff) {
    reason = `${t(apparent)}°C — cold muscles. Extend your warm-up; ease into max-velocity work.${acclimNote}`;
  } else if (wind !== null && wind >= WIND_UNRELIABLE_KMH) {
    reason = `${t(wind)} km/h wind — throwing accuracy and sprint timing are unreliable; deprioritise testing.`;
  } else {
    return rx; // benign weather
  }

  // Coach override: keep the planned session; record the call. Storm still warns.
  if (coachOverride) {
    const note = storm
      ? "Coach override: training as planned — but lightning is present, take shelter if it nears."
      : `Coach override: training as planned despite conditions — ${reason}`;
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason: note,
      },
    };
  }

  if (action === "none") {
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason,
      },
    };
  }

  if (action === "scale") {
    // Same intent, reduced volume; heat load-scaling reflects true strain at port.
    return {
      ...rx,
      targetMinutes: t(rx.targetMinutes * HEAT_VOLUME_CUT),
      sprintReps: t(rx.sprintReps * HEAT_VOLUME_CUT),
      reasoning: `${reason} ${rx.reasoning}`,
      weatherAdjustment: {
        applied: true,
        action,
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason,
      },
    };
  }

  // relocate / substitute / stop → swap intent + targets (nutrition stays as the
  // day's plan; a lighter indoor session is safely over-fuelled, not under).
  const nt = baseTargets(adjusted);
  return {
    ...rx,
    intent: adjusted,
    intentLabel: INTENT_LABELS[adjusted],
    targetRpe: nt.targetRpe,
    targetMinutes: nt.targetMinutes,
    sprintReps: nt.sprintReps,
    strengthSets: nt.strengthSets,
    reasoning: `${reason} ${rx.reasoning}`,
    weatherAdjustment: {
      applied: true,
      action,
      originalIntent: original,
      adjustedIntent: adjusted,
      heatLoadFactor,
      reason,
    },
  };
}

/** Canonical target bundle per intent (single source for season + weather paths). */
function baseTargets(intent: PrescriptionIntent): {
  targetRpe: number | null;
  targetMinutes: number;
  sprintReps: number;
  strengthSets: number;
} {
  switch (intent) {
    case "rest":
      // No structured training, but daily 15-min mobility + stretching is always
      // prescribed — it maintains range of motion and accelerates tissue recovery
      // (Behm & Chaouachi 2011; NSCA-TSAC general prep guidelines).
      return {
        targetRpe: 2,
        targetMinutes: 15,
        sprintReps: 0,
        strengthSets: 0,
      };
    case "recovery":
      return {
        targetRpe: 3,
        targetMinutes: 30,
        sprintReps: 0,
        strengthSets: 0,
      };
    case "mobility":
      return {
        targetRpe: 4,
        targetMinutes: 45,
        sprintReps: 0,
        strengthSets: 0,
      };
    case "technical":
      return {
        targetRpe: 5,
        targetMinutes: 60,
        sprintReps: 0,
        strengthSets: 0,
      };
    case "sprint":
      return {
        targetRpe: 8,
        targetMinutes: 60,
        sprintReps: 10,
        strengthSets: 0,
      };
    case "strength":
      return {
        targetRpe: 7,
        targetMinutes: 75,
        sprintReps: 0,
        strengthSets: 18,
      };
    case "mixed":
      return {
        targetRpe: 6,
        targetMinutes: 75,
        sprintReps: 6,
        strengthSets: 8,
      };
    case "taper-prime":
      return {
        targetRpe: 4,
        targetMinutes: 25,
        sprintReps: 4,
        strengthSets: 0,
      };
    case "competition":
      return {
        targetRpe: null,
        targetMinutes: 60,
        sprintReps: 0,
        strengthSets: 0,
      };
    case "travel":
      return {
        targetRpe: null,
        targetMinutes: 0,
        sprintReps: 0,
        strengthSets: 0,
      };
  }
}

type SessionTarget = ReturnType<typeof baseTargets>;

/**
 * Session targets for the generic / PRE-SEASON build block. Per the coach's rule,
 * a build block (no games) can carry more volume on the LIGHTER intents than
 * in-season — e.g. mobility RPE 6/75 in pre-season vs RPE 4/45 in-season. So the
 * in-season baseline is {@link baseTargets}; these rows override the light intents
 * heavier for the build week. `rest` is intentionally 0 minutes / null RPE — it
 * always matches {@link baseTargets}'s rest case (a rest day isn't heavier in
 * a build block); listed explicitly for symmetry with mobility/technical.
 */
const BUILD_TARGET_OVERRIDES: Partial<
  Record<PrescriptionIntent, SessionTarget>
> = {
  // rest is rest in any phase: no structured training, just daily mobility.
  // Previous value (RPE 6) was a stale pre-refactor literal and is corrected here.
  rest: { targetRpe: 2, targetMinutes: 15, sprintReps: 0, strengthSets: 0 },
  mobility: { targetRpe: 6, targetMinutes: 75, sprintReps: 0, strengthSets: 0 },
  technical: {
    targetRpe: 6,
    targetMinutes: 75,
    sprintReps: 0,
    strengthSets: 0,
  },
};

function buildTargets(intent: PrescriptionIntent): SessionTarget {
  return BUILD_TARGET_OVERRIDES[intent] ?? baseTargets(intent);
}

// =============================================================================
// HELPERS — kept tiny and orthogonal so they're easy to unit-test.
// =============================================================================

function finalize(
  partial: Omit<DailyPrescription, "date" | "intentLabel"> & {
    date: Date;
    intentLabel?: string;
  },
): DailyPrescription {
  return {
    ...partial,
    date: toIsoDate(partial.date),
    intentLabel: partial.intentLabel ?? INTENT_LABELS[partial.intent],
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
  if (intent === "rest") {
    return "Build phase rest day — no structured training. Complete your 15-min daily mobility and stretching routine.";
  }
  return `Build phase. Today is a ${intent} day.`;
}

function pickAccumulationIntent(
  date: Date,
  acwr: number | null,
  heavyDensity: boolean,
): PrescriptionIntent {
  // Fallback DOW shape — reached only when planWeekIntents() returned null for
  // this day (no schedule anchor in the 7-day window to place the session
  // relative to). Both today and weekAhead() prefer the schedule-aware hint;
  // this array is the last resort. Two rest days (Sun + Wed) per NSCA-TSAC /
  // Bompa 2018; max 5 active days.
  const dow = date.getDay();
  const standard: PrescriptionIntent[] = [
    "rest", // Sun — post-week full rest
    "strength", // Mon — neuromuscular block
    "sprint", // Tue — speed / agility quality
    "rest", // Wed — mid-week full rest
    "strength", // Thu — second neuromuscular block
    "technical", // Fri — skills / routes (low CNS demand)
    "mixed", // Sat — integrated flag-football session
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
// Carbohydrate is periodised to the day's ENERGY EXPENDITURE, not just its
// intensity (IOC 2018 / ACSM-AND-DC consensus; Burke carbohydrate guidelines).
// Flag-football sessions are SHORT (≤60–75 min) and intermittent, so even a
// high-intensity sprint day is low-VOLUME and sits in the light–moderate band
// (3–5 g/kg/day), NOT the 6–10 g/kg endurance/loading band. Elevated carbs are
// reserved for genuine glycogen demand: the pre-game top-up (taper-prime, ≤24h
// out) and game/tournament days (multiple games + between-game refuel).
//   Light/skill     3–5 g/kg/day   ·  Moderate ~1h   5–7   ·  Endurance 6–10
//   Protein:  steady 1.8 g/kg/day (within the 1.6–2.2 consensus range)
//   Fluid:    base 35 ml/kg/day; competition adds ~1.5L; heat/density adds ~0.5L
// Previously sprint/strength were a flat 6 g/kg → 480g for an 80kg athlete on a
// 45-min sprint day, i.e. glycogen-loading carbs for a short session.
// =============================================================================

const CARB_PER_KG: Record<PrescriptionIntent, number> = {
  rest: 3,
  recovery: 3.5,
  mobility: 3.5,
  technical: 4,
  sprint: 4.5, // short, high-intensity, low-volume → light–moderate band
  strength: 4.5,
  mixed: 5, // skill + conditioning, more total work
  "taper-prime": 6, // deliberate glycogen top-up, ≤24h to competition
  competition: 7, // game/tournament day: multiple games + refuel between
  travel: 3.5, // travel day: light carbs, hydration focus
};

const PROTEIN_PER_KG = 1.8;
const FLUID_BASE_ML_PER_KG = 35;
const FLUID_COMPETITION_BONUS_L = 1.5;

function nutritionFor(
  intent: PrescriptionIntent | "taper" | "transition",
  bodyweightKg: number,
  heavyDensity: boolean,
  hotDay = false,
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
  // Heat raises sweat losses — add fluid on a hot day (the comment above
  // promised this; it was previously never applied). Independent of density.
  if (hotDay && key !== "rest") {
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
  macroPhaseFor,
  applyWeatherGuard,
  seasonShapedIntent,
  baseTargets,
  CARB_PER_KG,
  cnsRecoveryHoursForAge,
  isHighCnsSessionType,
  planWeekIntents,
  detectTournamentRecoveryDay,
  modulateIntentForLoad,
};
