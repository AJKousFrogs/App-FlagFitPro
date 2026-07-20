/**
 * Competition game-load model — the single place that turns "how it went" inputs
 * (games, format, one-way vs both-ways, players available, surface) into the
 * load-equivalent minutes fed to the Foster session-RPE ACWR pipeline
 * (`event-participation` → `record_event_participation` → competition
 * `training_sessions` row; workload = minutes × sRPE).
 *
 * CLAUDE.md §4 (single source for calculations): this util is the ONLY place the
 * competition-load multiplier is computed — the component imports it, and its
 * numbers are locked by `competition-load.util.spec.ts`.
 *
 * The three multipliers are OWNER-SET product decisions (2026-07-19), deliberately
 * conservative and tunable here in one place:
 *
 *  - way: a both-ways player is on the field for ~every snap; a one-way player only
 *    for their unit. Owner chose a 1.5× both-vs-one ratio. Baseline is both-ways = 1.0
 *    (full game clock, the app's prior behaviour); one-way = 1/1.5 ≈ 0.667. This only
 *    ever LOWERS a one-way player's load below the old flat-minutes model — the safe
 *    direction (never silently inflates anyone above what shipped before).
 *  - bench: fewer players on the day → less rest between snaps/games → higher load.
 *    +0.10 per player below a 7-deep rotation, capped at +0.30 (a bare 5-player squad
 *    plays everything). ≥7 available → neutral.
 *  - surface: artificial turf carries ~15% higher mechanical load than natural grass
 *    (owner override 2026-07-19 of the app's prior "surface is advisory-only"
 *    stance — see SOURCE_OF_TRUTH §6). Unknown surface → neutral (never inferred).
 *
 * NOTE (semantics): the multiplier is folded into `totalMinutes` because the fixed
 * `record_event_participation` RPC scores load as minutes × RPE, so the stored
 * competition `duration_minutes` is LOAD-EQUIVALENT minutes, not wall-clock. A
 * migration-based `p_load_multiplier` would keep clock minutes separate — deferred.
 */

export type PlayingWay = "one_way" | "both_ways";
// Mirrors the canonical PlayingSurface in schedule.models.ts ('grass' | 'turf' | null).
export type PlayingSurface = "grass" | "turf" | null;

/** both-ways baseline 1.0; one-way = 1/1.5 so both:one ≈ 1.5 (owner-set). */
export const WAY_FACTOR: Record<PlayingWay, number> = {
  both_ways: 1,
  one_way: 2 / 3,
};

export const BENCH_FULL_ROTATION = 7; // ≥ this many available → no rest-deprivation load
export const BENCH_PER_MISSING = 0.1; // +10% per player below full rotation
export const BENCH_MAX_FACTOR = 1.3; // cap (~a bare 5-player squad)

export const SURFACE_TURF_FACTOR = 1.15;

/** Rest-deprivation multiplier from how many players actually showed up. */
export function benchFactor(playersPresent: number | null | undefined): number {
  if (
    playersPresent == null ||
    !Number.isFinite(playersPresent) ||
    playersPresent >= BENCH_FULL_ROTATION
  ) {
    return 1;
  }
  // A legal 5-on-5 squad is ≥5; clamp so absurd inputs can't explode the factor.
  const present = Math.max(1, Math.floor(playersPresent));
  const missing = BENCH_FULL_ROTATION - present;
  return Math.min(BENCH_MAX_FACTOR, 1 + missing * BENCH_PER_MISSING);
}

export function surfaceFactor(surface: PlayingSurface): number {
  return surface === "turf" ? SURFACE_TURF_FACTOR : 1;
}

/** Combined competition-load multiplier (way × bench × surface). */
export function competitionLoadFactor(
  way: PlayingWay,
  playersPresent: number | null | undefined,
  surface: PlayingSurface,
): number {
  return WAY_FACTOR[way] * benchFactor(playersPresent) * surfaceFactor(surface);
}

/**
 * Load-equivalent minutes for the ACWR feed: raw game-clock minutes scaled by the
 * exposure multiplier, rounded to a whole minute. Never negative.
 */
export function effectiveGameMinutes(
  games: number,
  minutesPerGame: number,
  way: PlayingWay,
  playersPresent: number | null | undefined,
  surface: PlayingSurface,
): number {
  const rawMinutes = Math.max(0, games) * Math.max(0, minutesPerGame);
  return Math.round(
    rawMinutes * competitionLoadFactor(way, playersPresent, surface),
  );
}
