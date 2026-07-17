/**
 * Nutrition constants — tournament-day fuelling.
 *
 * ─── Why two carb models exist (they are NOT the same number) ───────────────
 *
 * The server's `betweenGamesRefuel` (netlify/functions/utils/nutrition-protocols.js)
 * answers: **"how much carbohydrate total should this athlete take in across the
 * whole recovery window?"** — a RATE (`REFUEL.CARB_G_PER_KG_PER_H` = 1.0 g/kg/h,
 * ACSM/IOC, Burke 2017) multiplied by the window, capped at 4 h. For an 80 kg
 * athlete with a 3 h gap that's 1.0 × 80 × 3 = **240 g cumulative**.
 *
 * This file answers a different question: **"what should this athlete eat at
 * THIS point in the tournament timeline, without being sick on the field?"** —
 * a single per-eating-occasion dose, chosen by gap class. For the same 3 h gap
 * ("long") that's 1.25 × 80 = **100 g in one meal**.
 *
 * Both are correct; they are different questions. The per-occasion doses below
 * are deliberately BELOW the cumulative rate — an athlete with a 30-minute
 * turnaround physically cannot absorb 0.5 g/kg without GI distress, and GI
 * comfort beats theoretical completeness when you're playing again in half an
 * hour. Read as a rate, `long` (1.25 g/kg spread over a ≥2.5 h gap) is ≈0.5
 * g/kg/h — conservative against the 1.0–1.2 band, not over it.
 *
 * `docs/SOURCE_OF_TRUTH.md` §6 previously described these as "evidence-consistent
 * (both ACSM 1.0–1.2 g/kg/h)", which conflated the two models — they don't share
 * a unit. That note is corrected; this comment is the durable version.
 *
 * ─── What is shared, and therefore mirrored ────────────────────────────────
 *
 * `PROTEIN_G_PER_KG` genuinely IS the same constant in both runtimes (~0.3 g/kg
 * co-ingested, ≈20–40 g). The server owns it (`REFUEL.PROTEIN_G_PER_KG`); this
 * is a mirror, because the two runtimes can't share an import.
 * `tests/unit/refuel-protein-parity.test.js` fails if they ever diverge — the
 * same pattern as `WELLNESS.SORENESS_PAIN_TRIGGER` mirroring
 * `PAIN_TRIGGER_THRESHOLD`.
 */
export const NUTRITION = {
  /**
   * MIRROR of the canonical server constant `REFUEL.PROTEIN_G_PER_KG` in
   * netlify/functions/utils/nutrition-protocols.js. Do not edit one without the
   * other — refuel-protein-parity.test.js enforces it.
   */
  PROTEIN_G_PER_KG: 0.3,
} as const;

/**
 * Per-eating-occasion carbohydrate dose (g per kg bodyweight) for one gap in a
 * tournament day, by gap class. NOT a rate — see the header above.
 *
 * `turnaround` is the exception: it is a flat gram figure, not per-kg. Under 30
 * minutes the limit is what the gut will tolerate before the next kickoff, and
 * that ceiling does not scale with bodyweight — a 100 kg athlete cannot take a
 * bigger gel than a 70 kg one in the same 30 minutes.
 */
export const TOURNAMENT_GAP_FUEL = {
  /** Flat grams (see above — deliberately not per-kg). Half a gel. */
  TURNAROUND_FAST_CARB_G: 12,
  /** <75 min: fast carbs only (gel / sports drink / ripe banana). */
  SHORT_CARB_G_PER_KG: 0.4,
  /** <150 min: light solid food, finished ≥60 min before the next kickoff. */
  MEDIUM_CARB_G_PER_KG: 1,
  /** ≥150 min: a real meal, finished ≥75 min before the next kickoff. */
  LONG_CARB_G_PER_KG: 1.25,
} as const;

/**
 * Post-final-whistle recovery, when there is no next game to protect the gut
 * for. 1.2 g/kg inside the first hour IS the ACSM/IOC 1.0–1.2 g/kg/h rate
 * applied to a 1 h window — so unlike the gap doses above, this one is a rate
 * and the band's upper bound is the right read.
 */
export const POST_DAY_RECOVERY = {
  CARB_G_PER_KG: 1.2,
} as const;
