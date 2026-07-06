/**
 * Game-format × position volume & load model — the reference the engine reads to
 * periodise each player for the WORST CASE without over/under-loading them.
 *
 * THIS IS TUNABLE REFERENCE DATA, never magic numbers buried in the prescription
 * logic. A single documented source; the engine reads it. Numbers are defensible
 * defaults synthesised by an S&C design panel from the head coach's anchors —
 * override per athlete/team as your squad's reality differs.
 *
 * Three independent scales (the coach's key correction):
 *   - perSession      training-session targets (e.g. QB 40–60 throws/session)
 *   - perGameWorstCase per-GAME volume at the IFAF 2×20 BASELINE; lighter formats
 *                      scale DOWN by the format's relativeLoadFactor
 *   - perWeek          weekly targets (e.g. WR ~1000 catches/week)
 *   - per-TOURNAMENT   totals stack games (e.g. QB ~320 throws across 6–8 games)
 *
 * GAME FORMAT changes load a lot and scales everything:
 *   domestic_2x12_stop (0.68) — central STOP clock, dense max-effort plays, lowest
 *     cumulative load but highest per-play intensity
 *   running_2x15 (0.78)       — RUNNING clock, continuous, denies recovery
 *   ifaf_2x20 (1.00 BASELINE)  — Continental / World / Olympic, the worst case
 */

export interface RangeDemand {
  min: number;
  max: number;
}

export type GameFormatKey = "domestic_2x12_stop" | "running_2x15" | "ifaf_2x20";

export interface GameFormat {
  key: GameFormatKey;
  label: string;
  halves: number;
  halfMinutes: number;
  clock: "stop" | "running" | "mixed";
  /** practice | domestic | continental | world | olympic context band. */
  context: string;
  /** Multiplier vs the IFAF 2×20 baseline (=1.0). Lighter formats < 1. */
  relativeLoadFactor: number;
  /** Estimated internal session-RPE load (AU) for ONE game — feeds ACWR. */
  estGameLoadAu: number;
  estPlaysPerGame: number;
  rationale: string;
}

/** The three formats. IFAF 2×20 is the baseline everything scales from. */
export const GAME_FORMATS: Record<GameFormatKey, GameFormat> = {
  domestic_2x12_stop: {
    key: "domestic_2x12_stop",
    label: "Domestic / League — 2×12 min, central STOP clock",
    halves: 2,
    halfMinutes: 12,
    clock: "stop",
    context: "domestic",
    relativeLoadFactor: 0.68,
    estGameLoadAu: 300,
    estPlaysPerGame: 42,
    rationale:
      "24 game-minutes but the clock stops constantly, so real time stretches to 45–60 min and play count stays high (~42). Stoppages return micro-recovery — highest per-play intensity, lowest cumulative load.",
  },
  running_2x15: {
    key: "running_2x15",
    label: "Continuous — 2×15 min, RUNNING clock",
    halves: 2,
    halfMinutes: 15,
    clock: "running",
    context: "continental",
    relativeLoadFactor: 0.78,
    estGameLoadAu: 350,
    estPlaysPerGame: 44,
    rationale:
      "30 continuous game-minutes; the clock rarely stops, so the athlete never banks free recovery. More cumulative aerobic-glycolytic load than the stop-clock game despite a similar play count.",
  },
  ifaf_2x20: {
    key: "ifaf_2x20",
    label: "IFAF Championship — 2×20 min (Continental / World / Olympic)",
    halves: 2,
    halfMinutes: 20,
    clock: "mixed",
    context: "world",
    relativeLoadFactor: 1,
    estGameLoadAu: 450,
    estPlaysPerGame: 55,
    rationale:
      "BASELINE 1.0. 40 game-minutes, longest effective playing time, highest snap count (~55), most high-speed running and the highest single-game load, against the best opponents inside multi-game tournament days.",
  },
};

/**
 * Resolve a game format from what the schedule actually carries. Prefers an
 * explicit per-event format; else maps the competition level; else defaults
 * CONSERVATIVELY to the heaviest format so an unknown game is never under-loaded
 * (the safe direction for ACWR + worst-case prep).
 */
export function resolveGameFormat(
  explicit?: string | null,
  competitionLevel?: string | null,
): GameFormat {
  if (explicit && explicit in GAME_FORMATS) {
    return GAME_FORMATS[explicit as GameFormatKey];
  }
  const lvl = (competitionLevel ?? "").toLowerCase();
  if (lvl === "international") {
    return GAME_FORMATS.ifaf_2x20;
  }
  if (lvl === "national" || lvl === "club") {
    return GAME_FORMATS.domestic_2x12_stop;
  }
  return GAME_FORMATS.ifaf_2x20; // unknown → heaviest (conservative)
}

export type PositionKey = "qb" | "wr" | "db" | "center" | "blitzer" | "wr_db";

export interface PositionVolume {
  position: PositionKey;
  label: string;
  /** Training-session targets. */
  perSession: Partial<Record<string, number | RangeDemand>>;
  /** Per-GAME volumes at the IFAF 2×20 baseline (scaled by format factor). */
  perGameWorstCase: Partial<Record<string, number>>;
  /** Weekly targets. */
  perWeek: Partial<Record<string, number | RangeDemand>>;
  /** One-line worst-case statement. */
  worstCase: string;
  /** How to build toward the demand across the season. */
  periodization: string;
  primaryInjuryRisk: string;
}

/**
 * Per-position model. wr_db is the combined both-ways bucket (flag football is
 * small-sided; many play offence AND defence) — it carries the worst case of
 * both, and is the fallback for the legacy merged "wr_db" stored position.
 */
export const POSITION_VOLUME: Record<PositionKey, PositionVolume> = {
  qb: {
    position: "qb",
    label: "Quarterback",
    perSession: { throws: { min: 40, max: 60 }, sprints: 8 },
    perGameWorstCase: { throws: 53, snaps: 55, sprints: 12 },
    perWeek: { throws: { min: 200, max: 280 } },
    worstCase:
      "~40–60 throws/session; ~320 throws across a 6–8 game tournament (≈40–53/game). The cumulative tournament throw count is the real worst case — not any single game.",
    periodization:
      "Off-season rebuild from ~80–120 throws/wk (no max-velocity); pre-season overload ~10%/wk toward 55–60/session and rehearse back-to-back high-throw days for tournament arm load; in-season maintain 40–50/session, deload throws 48–72h pre-game; taper ~30–40% the week before a tournament so the arm banks ~320 throws fresh.",
    primaryInjuryRisk:
      "Cumulative throwing load to the shoulder (cuff, posterior capsule, labrum) and medial elbow (UCL). Budget by TOURNAMENT total + acute:chronic throw tracking, not single-game limits.",
  },
  wr: {
    position: "wr",
    label: "Wide Receiver",
    perSession: { catches: { min: 120, max: 180 }, sprints: 25 },
    perGameWorstCase: { sprints: 35, catches: 14, decels: 40 },
    perWeek: { catches: 1000, sprints: { min: 150, max: 200 } },
    worstCase:
      "~1000 catches/week and 30–35 sprints/game × up to 8 games/day. The binding game load is high-speed sprint + deceleration, not catch count.",
    periodization:
      "Off-season build max sprint speed + eccentric hamstring (Nordics) from low volume; pre-season ramp catches toward ~1000/wk and accumulate high-speed running so game sprints sit inside trained range; in-season hold catches but cap max-velocity reps near game day (keep 1–2 top-speed exposures/wk); taper running but retain a short max-velocity exposure ~3–4 days out.",
    primaryInjuryRisk:
      "Hamstring strain from max-velocity sprinting + decelerations; ankle/knee on cuts. Periodise sprint volume SEPARATELY from catches — different tissues.",
  },
  db: {
    position: "db",
    label: "Defensive Back",
    perSession: { backpedals: { min: 200, max: 320 }, sprints: 25 },
    perGameWorstCase: { sprints: 35, backpedals: 70, decels: 40 },
    perWeek: {
      backpedals: { min: 800, max: 1200 },
      sprints: { min: 150, max: 200 },
    },
    worstCase:
      "Up to ~320 backpedals/session (5–10 yd) plus WR-like 30–35 sprints/game. The backpedal-to-sprint hip-flip transition is the highest-strain action — count transitions, not just backpedals.",
    periodization:
      "Off-season develop hip mobility, posterior-chain/COD strength, eccentric hamstring + adductor capacity; pre-season load backpedal volume toward ~320/session and chain backpedal→plant→turn-and-run; in-season distribute the ceiling across 3–4 sessions (progressive, not spiky), cap near game day.",
    primaryInjuryRisk:
      "Hamstring + adductor on the hip-flip transition and max-velocity sprint; ankle/knee on plant-and-drive.",
  },
  center: {
    position: "center",
    label: "Center (snapper)",
    perSession: {
      catches: { min: 120, max: 180 },
      snaps: { min: 50, max: 80 },
      sprints: 22,
    },
    perGameWorstCase: { snaps: 55, sprints: 35, catches: 12 },
    perWeek: { catches: 1000, snaps: { min: 300, max: 450 } },
    worstCase:
      "~1000 catches/week, snaps on essentially every play (~55/game, 50–80/session), AND WR-level 30–35 sprints/game. A dual one-arm-snap + sprint/route load.",
    periodization:
      "Off-season condition the one-arm snapping chain (wrist flexors, forearm, posterior shoulder/scapular) + anti-rotation/lumbar from a low base, plus WR catch & base speed; pre-season progressively overload snap volume like a throwing pattern; in-season maintain, protect the arm, keep snap reps progressive.",
    primaryInjuryRisk:
      "Repetitive one-arm snapping: wrist/forearm, posterior shoulder, medial elbow, and repeated lumbar flexion. Load the snap like a throw — count reps, build tolerance.",
  },
  blitzer: {
    position: "blitzer",
    label: "Blitzer / Rusher",
    perSession: {
      explosiveSprints: { min: 25, max: 35 },
      changeOfDirection: 50,
    },
    perGameWorstCase: { explosiveSprints: 42, decels: 45, maxAccels: 42 },
    perWeek: { explosiveSprints: { min: 120, max: 180 } },
    worstCase:
      "Highest count of true max-effort accelerations of any position (~42/game) — nearly every defensive snap triggers a rush or pursuit. A high-CNS channel that fatigues faster than it feels.",
    periodization:
      "Off-season max strength/power (squat/hinge/jumps, accel mechanics), eccentric hamstring base, reactive plyometrics, low-volume accelerations; pre-season load explosive-start volume + repeated-sprint ability with FULL recovery between max efforts; in-season cap weekly max-effort accelerations as the primary monitored metric.",
    primaryInjuryRisk:
      "Hamstring + calf on repeated max-effort starts; knee/ankle on hard braking. Acceleration/deceleration COUNT is the limiting load — quality over count.",
  },
  wr_db: {
    position: "wr_db",
    label: "Receiver / Defensive back (both ways)",
    perSession: {
      catches: { min: 120, max: 180 },
      backpedals: { min: 200, max: 320 },
      sprints: 25,
    },
    perGameWorstCase: { sprints: 35, catches: 14, backpedals: 70, decels: 40 },
    perWeek: {
      catches: 1000,
      backpedals: { min: 800, max: 1200 },
      sprints: { min: 150, max: 200 },
    },
    worstCase:
      "Plays BOTH ways: ~1000 catches/week, up to ~320 backpedals/session, and 30–35 sprints/game × up to 8 games/day. The most running- and cutting-loaded role.",
    periodization:
      "Combine the WR and DB plans: build eccentric hamstring + adductor + COD capacity off-season; ramp catch and backpedal volume pre-season; in-season cap max-velocity near game day. Sprint volume is the shared limiter.",
    primaryInjuryRisk:
      "Hamstring/adductor from sprinting, decelerating and the backpedal-to-sprint transition; ankle/knee on cuts.",
  },
};

/**
 * Per-game volume for a position at a given format — the IFAF baseline worst case
 * scaled DOWN by the format's relativeLoadFactor. Pure; the engine surfaces this.
 */
export function perGameForFormat(
  position: PositionKey,
  formatKey: GameFormatKey,
): Partial<Record<string, number>> {
  const base = POSITION_VOLUME[position]?.perGameWorstCase ?? {};
  const factor = GAME_FORMATS[formatKey]?.relativeLoadFactor ?? 1;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === "number") {
      out[k] = Math.round(v * factor);
    }
  }
  return out;
}

/**
 * A tournament day stacks games with their own warm-ups (kickoffs e.g. 08:00,
 * 11:30, 13:00, 15:00, 16:00, 19:00). Treat it as ONE multi-bout endurance event:
 * full warm-up before game 1, abbreviated RE-warm-ups (re-prime, not re-fatigue)
 * before games 2–8, and between-game refuel + off-feet recovery. The late game on
 * tired legs is the highest hamstring-injury window of the day.
 */
export const TOURNAMENT_DAY = {
  maxGamesPerDay: 8,
  rewarmupBeforeEveryGame: true,
  note: "Re-warm before every game (full warm-up game 1, short re-prime games 2–8) and recover between games — refuel carbs+fluid within 20–30 min, get off your feet, keep legs fresh. A 6-game day means 6 warm-ups, not one.",
  lateGameWarning:
    "The last game of the day, on tired legs, is the highest hamstring-injury window — prioritise the between-game routine before it.",
} as const;

/**
 * Adaptive throwing policy (QB). A high interception/error rate is a fatigue or
 * mechanics signal — back the throw volume off and bias to quality/rest rather
 * than grinding bad reps. Tunable; applied once throw + interception logging is
 * wired into the engine.
 */
export const QB_THROW_ADAPTATION = {
  highInterceptionRate: 0.1,
  reducedVolumeFactor: 0.6,
  note: "If interception/error rate is high, reduce throwing volume and prioritise mechanics + rest — more bad reps ingrain the fault and add arm load for no gain.",
} as const;
