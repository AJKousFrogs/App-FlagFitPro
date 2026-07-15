// Within-athlete readiness baselines (2026-07-15, audit C6/§4.2).
//
// The absolute cut-points (55/75) score a chronically-8-hour sleeper and a
// chronically-6-hour sleeper on the same ruler — the docs have said "teams
// should calibrate" since day one, and nothing ever did. This module makes the
// CUT-POINTS personal via an empirical-Bayes-style shrinkage blend:
//
//   personalCut = w · individualEstimate + (1 − w) · cohortPrior
//   w = n / (n + k),  k = 14  (half-personal after two weeks of daily scores)
//
// where the individual estimates are z-cuts on the athlete's own trailing
// 28-day score distribution: low at mean − 1.5σ, high at mean + 0.5σ (the
// audit's z ≤ −1.5 "low" / relative-flag design). Day 1 the athlete gets the
// cohort's cut-points; as history accrues, their own distribution takes over.
//
// Safety properties (deliberate):
//  - σ is floored (a monotone athlete's cuts must not collapse onto the mean)
//    and the cuts are clamped to sane absolute ranges with a minimum gap, so
//    personalization can never produce a degenerate "always push" or
//    "always deload" ruler.
//  - The SCORE itself is untouched — only the level/suggestion boundaries
//    personalize. The engine's day-0 demotion keeps the ABSOLUTE 55 floor
//    (READINESS_LOW): a deep absolute collapse always demotes the day, no
//    matter how low the athlete's personal normal is. Personal cuts add
//    relative sensitivity on top, never subtract the absolute safety net.
//  - Fewer than MIN_OBSERVATIONS scores → pure cohort cuts (no fabricated
//    statistics from a thin history — Law #7).

export const BASELINE_DEFAULTS = Object.freeze({
  windowDays: 28,
  minObservations: 10,
  shrinkageK: 14,
  lowZ: -1.5,
  highZ: 0.5,
  sdFloor: 5,
  lowCutClamp: Object.freeze({ min: 40, max: 65 }),
  highCutClamp: Object.freeze({ min: 65, max: 85 }),
  minGap: 10,
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Personal readiness cut-points from a trailing score history.
 *
 * @param {number[]} scores - readiness scores (0-100) from the trailing window
 * @param {{ low: number, high: number }} cohortCuts - the population priors (55/75)
 * @param {object} [opts] - overrides of BASELINE_DEFAULTS (tests)
 * @returns {{ low: number, high: number, personalized: boolean,
 *             n: number, mean: number|null, sd: number|null }}
 */
export function computePersonalCutoffs(scores, cohortCuts, opts = {}) {
  const cfg = { ...BASELINE_DEFAULTS, ...opts };
  const clean = (scores ?? []).filter(
    (s) => typeof s === "number" && Number.isFinite(s),
  );
  const n = clean.length;
  if (n < cfg.minObservations) {
    return {
      low: cohortCuts.low,
      high: cohortCuts.high,
      personalized: false,
      n,
      mean: null,
      sd: null,
    };
  }

  const mean = clean.reduce((a, b) => a + b, 0) / n;
  const variance =
    clean.reduce((acc, s) => acc + (s - mean) ** 2, 0) / Math.max(1, n - 1);
  const sd = Math.max(cfg.sdFloor, Math.sqrt(variance));

  const w = n / (n + cfg.shrinkageK);
  const individualLow = mean + cfg.lowZ * sd;
  const individualHigh = mean + cfg.highZ * sd;

  let low = clamp(
    w * individualLow + (1 - w) * cohortCuts.low,
    cfg.lowCutClamp.min,
    cfg.lowCutClamp.max,
  );
  let high = clamp(
    w * individualHigh + (1 - w) * cohortCuts.high,
    cfg.highCutClamp.min,
    cfg.highCutClamp.max,
  );
  // Preserve a sane band: never let the cuts pinch together.
  if (high - low < cfg.minGap) {
    const mid = (high + low) / 2;
    low = clamp(mid - cfg.minGap / 2, cfg.lowCutClamp.min, cfg.lowCutClamp.max);
    high = clamp(
      mid + cfg.minGap / 2,
      cfg.highCutClamp.min,
      cfg.highCutClamp.max,
    );
  }

  return {
    low: Math.round(low),
    high: Math.round(high),
    personalized: true,
    n,
    mean: Math.round(mean * 10) / 10,
    sd: Math.round(sd * 10) / 10,
  };
}

/**
 * Trailing readiness scores for an athlete (excluding today — today's score
 * is the value being classified). Non-fatal: any failure → empty history →
 * cohort cuts.
 */
export async function fetchBaselineScores(
  supabase,
  athleteId,
  dayStr,
  opts = {},
) {
  const cfg = { ...BASELINE_DEFAULTS, ...opts };
  try {
    const since = new Date(
      new Date(`${dayStr}T00:00:00Z`).getTime() - cfg.windowDays * 86_400_000,
    )
      .toISOString()
      .slice(0, 10);
    const { data, error } = await supabase
      .from("readiness_scores")
      .select("score, day")
      .eq("user_id", athleteId)
      .gte("day", since)
      .lt("day", dayStr)
      .order("day", { ascending: false })
      .limit(cfg.windowDays);
    if (error || !Array.isArray(data)) {
      return [];
    }
    return data.map((r) => Number(r.score)).filter((s) => Number.isFinite(s));
  } catch {
    return [];
  }
}
