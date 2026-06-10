/**
 * Position volume demands — the worst-case on-field volumes each flag-football
 * position must be PREPARED for, so the plan conditions the athlete for the
 * hardest realistic week / tournament day rather than an average one.
 *
 * THIS IS TUNABLE REFERENCE DATA, not magic numbers buried in the prescription
 * logic — a single documented source (the engine reads it, never hard-codes the
 * figures). The defaults below reflect competitive flag-football demands the
 * coach described; override them per athlete/team as your squad's reality
 * differs (a future per-athlete override on athlete_training_config can shadow
 * these, with these as the fallback baseline). Numbers are deliberately the
 * WORST CASE, because that is what you must train to survive uninjured.
 *
 * Flag football is small-sided and most players go BOTH ways, so the default
 * skill bucket (wr_db) carries BOTH receiving and defensive-back demands.
 */

export interface BackpedalDemand {
  reps: number;
  yardsMin: number;
  yardsMax: number;
}
export interface RangeDemand {
  min: number;
  max: number;
}

export interface PositionVolume {
  /** Bucket key (matches the engine's positionBucket). */
  position: "qb" | "wr_db" | "center";
  label: string;
  /** Ball-handling volume to be conditioned for. */
  weeklyCatches?: number; // receivers / centers
  throwsPerTrainingDayMax?: number; // QB — worst-case throwing volume in a session
  snapsPerTrainingDayMax?: number; // center — repeated one-arm snaps
  backpedalsPerDay?: BackpedalDemand; // defensive-back transitions, 5–10 yd
  sprintsPerGame?: RangeDemand; // high-speed efforts per game
  /** One-line statement of what the worst case is for this role. */
  worstCase: string;
}

/**
 * A tournament day can stack many games with their own warm-ups — the coach
 * cited kickoffs at 08:00, 11:30, 13:00, 15:00, 16:00, 19:00. The plan must
 * assume a re-warm before EACH game and between-game recovery, not one warm-up.
 */
export const TOURNAMENT_DAY = {
  maxGamesPerDay: 8, // worst case to prepare for
  rewarmupBeforeEveryGame: true,
  note: "Re-warm before every game and recover between games — a 6-game day means 6 warm-ups, not one.",
} as const;

/**
 * Adaptive throwing policy (QB). High error/interception rates are a fatigue or
 * mechanics signal — back the throwing volume off and bias toward quality/rest
 * rather than grinding more reps. Applied once throw + interception logging is
 * wired into the engine; the THRESHOLD is reference data, tunable.
 */
export const QB_THROW_ADAPTATION = {
  /** Interception rate (INT ÷ throws) above which to reduce the throw target. */
  highInterceptionRate: 0.1,
  /** Multiply the throw target by this when the error rate is high. */
  reducedVolumeFactor: 0.6,
  note: "If interception/error rate is high, reduce throwing volume and prioritise mechanics + rest — more bad reps ingrain the fault and add arm load for no gain.",
} as const;

/** Per-position worst-case volume reference. Tunable defaults. */
export const POSITION_VOLUME: Record<PositionVolume["position"], PositionVolume> = {
  qb: {
    position: "qb",
    label: "Quarterback",
    throwsPerTrainingDayMax: 320,
    sprintsPerGame: { min: 8, max: 15 },
    worstCase:
      "Up to ~320 throws in a heavy session. The arm is the load — periodise throw count like sprint volume, and ramp arm capacity in the off/pre-season.",
  },
  wr_db: {
    position: "wr_db",
    label: "Receiver / Defensive back",
    weeklyCatches: 1000,
    backpedalsPerDay: { reps: 320, yardsMin: 5, yardsMax: 10 },
    sprintsPerGame: { min: 30, max: 35 },
    worstCase:
      "~1000 catches/week, up to ~320 backpedals (5–10 yd) in a session, and 30–35 sprints per game × up to 8 games/day. The most running- and cutting-loaded role — condition hamstrings, calves and decel for it.",
  },
  center: {
    position: "center",
    label: "Center / Rusher",
    weeklyCatches: 1000,
    snapsPerTrainingDayMax: 320,
    sprintsPerGame: { min: 30, max: 35 },
    worstCase:
      "~1000 catches/week, up to ~320 one-arm snaps in a session, and 30–35 sprints per game × up to 8 games/day. Build snapping-arm and wrist capacity progressively — repeated one-arm snaps are a real load.",
  },
};
