/**
 * Condition-aware playing-surface advisory (2026-07-18).
 *
 * Pure and TestBed-free, like today/unlogged-practice.ts.
 *
 * WHAT THIS IS NOT: a blanket "turf is dangerous" warning. The best available
 * synthesis does not support one — what it supports is a SHIFTED DISTRIBUTION.
 *   Gould HP, Lostetter SJ, Samuelson ER, Guyton GP (2022) "Lower Extremity
 *   Injury Rates on Artificial Turf Versus Natural Grass Playing Surfaces: A
 *   Systematic Review", Am J Sports Med 51(6):1615-1621 —
 *   https://doi.org/10.1177/03635465211069562
 * Across 53 studies: on new-generation turf most articles (13/18) found
 * SIMILAR overall injury rates, but the largest share of articles reported a
 * HIGHER FOOT AND ANKLE injury rate on turf. Knee and hip rates were similar
 * for soccer — however football players, particularly at high levels of
 * competition, were MORE likely to sustain a knee injury on turf. That
 * football-specific knee finding is why the knee and patellar tendon sit in
 * the sensitive set below alongside the foot/ankle complex, rather than the
 * looser "same landing load" reasoning.
 *
 * NOT UNANIMOUS, and the note is worded to stay inside that uncertainty: more
 * recent single-league NFL data found a higher overall lower-extremity injury
 * rate on turf (1.42 vs 1.22 injuries/game) and higher odds of season-ending
 * surgery (OR 1.60) — Venishetty N et al. (2024) Orthop J Sports Med —
 * https://doi.org/10.1177/23259671241265378. Gould also notes the few studies
 * reporting the opposite (more injuries on grass) were all turf-industry
 * funded.
 *
 * So the app stays quiet for a healthy athlete on turf (saying anything would
 * be scaremongering beyond what this justifies) and speaks up only where the
 * shifted distribution actually meets an athlete it can affect: someone
 * ALREADY carrying a foot/ankle/lower-leg/knee-tendon restriction, on a KNOWN
 * turf event, on a MULTI-GAME day where back-to-backs stack the exposure.
 *
 * ADVISORY ONLY — it changes no training dose, no prescription, no macro
 * target. It is a note. The engine's injury precedence (applyInjuryGuard)
 * remains the only thing that down-regulates work.
 *
 * Unknown surface (null) produces nothing: the honest default is silence, not
 * a guess.
 */

import type { PlayingSurface } from "../core/models/schedule.models";

/**
 * Regions where the turf/grass difference is actually supported: the
 * foot/ankle complex (Gould's headline finding) and the knee — which is in
 * here on the strength of the football-specific result above, not by analogy.
 * The adjacent lower-leg tissues (Achilles, calf, shin, plantar/heel) are
 * included because they are the load path into that same foot/ankle complex.
 *
 * Matched as case-insensitive substrings because `region` is a loose taxonomy:
 * it can arrive from the chat tightness detector ("achilles", "calf", "ankle",
 * "knee", "shin") or from free-text clinical entry ("left achilles
 * tendinopathy", "patellar tendon").
 */
export const SURFACE_SENSITIVE_REGION_PATTERNS = [
  "achilles",
  "ankle",
  "foot",
  "heel",
  "plantar",
  "calf",
  "shin",
  "knee",
  "patell",
] as const;

export interface SurfaceAdvisory {
  /** The athlete's flagged regions that triggered this note, as given. */
  matchedRegions: string[];
  /** Athlete-facing note. Already complete — render as-is. */
  note: string;
}

function matchesSensitiveRegion(region: string): boolean {
  const r = region.toLowerCase();
  return SURFACE_SENSITIVE_REGION_PATTERNS.some((p) => r.includes(p));
}

/** "achilles" | "achilles and ankle" | "achilles, ankle and knee" */
function joinRegions(regions: string[]): string {
  if (regions.length === 1) return regions[0];
  return `${regions.slice(0, -1).join(", ")} and ${regions[regions.length - 1]}`;
}

/**
 * Build the surface advisory, or null when it shouldn't fire.
 *
 * Fires only when ALL THREE hold:
 *   1. the event's surface is known to be 'turf' (null/grass → silence),
 *   2. the day carries more than one game (back-to-back exposure), and
 *   3. the athlete has at least one active surface-sensitive restriction.
 *
 * @param surface       event surface; null = unknown → no advisory
 * @param injuryRegions regions of ALL currently-active injuries — pass
 *                      InjuryService.active().map(i => i.region), NOT
 *                      restrictions().regions: the latter is null unless an
 *                      injury formally restricts sprint/throwing, which would
 *                      silently exclude the still-playing niggle (inflamed
 *                      Achilles, runner's knee) this advisory exists for.
 * @param gameCount     games scheduled that day
 */
export function surfaceAdvisory({
  surface,
  injuryRegions,
  gameCount,
}: {
  surface: PlayingSurface;
  injuryRegions: readonly string[];
  gameCount: number;
}): SurfaceAdvisory | null {
  if (surface !== "turf") return null;
  if (!Number.isFinite(gameCount) || gameCount <= 1) return null;

  const matchedRegions = injuryRegions.filter(
    (r) =>
      typeof r === "string" && r.trim() !== "" && matchesSensitiveRegion(r),
  );
  if (matchedRegions.length === 0) return null;

  const regions = joinRegions(matchedRegions);
  const note =
    `Turf today, ${gameCount} games — and your ${regions} is flagged. ` +
    `Artificial turf loads the foot and ankle a little harder than grass, and ` +
    `back-to-back games stack that load. Give every game its own full warm-up — ` +
    `especially the last one, on tired legs — and check the area between games. ` +
    `If it turns from a niggle into real pain, stop and tell your coach rather ` +
    `than playing it out.`;

  return { matchedRegions, note };
}
