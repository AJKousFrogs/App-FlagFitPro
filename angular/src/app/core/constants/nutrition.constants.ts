/**
 * Nutrition constants — tournament-day between-games refuelling.
 *
 * ─── Evidence base (recalculated 2026-07-17, PubMed) ───────────────────────
 *
 * For rapid glycogen restoration when the next effort is soon (<4–8 h), the
 * consensus is a RATE of ~1.0–1.2 g/kg/h of high-GI carbohydrate, dosed
 * FREQUENTLY (every 15–30 min), for as long as the window demands up to ~4 h:
 *   - ISSN position stand (Kerksick 2017): "<4 h recovery → aggressive
 *     carbohydrate refeeding (1.2 g/kg/h), high-GI".
 *     doi.org/10.1186/s12970-017-0189-4
 *   - Systematic review + meta-analysis, 29 biopsy trials (Craven 2021):
 *     CHO ~1.0 g/kg/h maximises resynthesis, and dosing FREQUENCY correlates
 *     positively with the rate (spread it out, don't bolus).
 *     doi.org/10.1186/s40798-020-00297-0
 *   - Betts & Williams 2010: "≥1 g/kg/h ingested at 15–30 min intervals".
 *     doi.org/10.2165/11536900-000000000-00000
 *
 * So carbohydrate for a between-games gap is a RATE × the window, NOT a single
 * flat per-meal number. This file previously hard-coded flat per-occasion
 * literals (1.25 / 1 g/kg) that presented ONE number with no per-hour framing;
 * for a 3 h gap that told an 80 kg athlete "100 g" when the evidence supports
 * ~240 g dosed across the window. In an app whose explicit stance is anti-
 * under-fuelling (see the RED-S screen's FORBIDDEN_OUTPUT guard), silently
 * under-advising carbohydrate is the wrong-direction error. The medium/long
 * doses now derive from the shared rate; see `gapPlanFor` in
 * tournament-plan.service.ts.
 *
 * The two SHORT windows stay GI-limited on purpose, and the evidence agrees:
 * within ~75 min of the next kickoff the binding constraint is gut tolerance,
 * not the resynthesis rate — glucose absorption saturates ~1.2 g/min and
 * exceeding it causes GI distress (Gonzalez 2017, doi.org/10.3390/nu9040344),
 * which mid-tournament means a worse next game. Fast liquid/simple carbs only.
 *
 * PROTEIN (~0.3 g/kg co-ingested): the same meta-analysis (Craven 2021) found
 * co-ingested protein does NOT increase glycogen resynthesis once carbohydrate
 * is adequate — so protein is here for muscle repair / MPS (ISSN: 0.25–0.40
 * g/kg per feeding), NOT for glycogen. The 0.3 g/kg sits mid-band. It genuinely
 * IS the same constant in both runtimes; the server owns it
 * (`REFUEL.PROTEIN_G_PER_KG`) and this is a mirror, guarded by
 * tests/unit/refuel-protein-parity.test.js (the two runtimes can't share an
 * import — same arrangement as WELLNESS.SORENESS_PAIN_TRIGGER).
 */
export const NUTRITION = {
  /**
   * MIRROR of the canonical server constant `REFUEL.PROTEIN_G_PER_KG`
   * (netlify/functions/utils/nutrition-protocols.js). Do not edit one without
   * the other — refuel-protein-parity.test.js enforces it. ~0.3 g/kg is the
   * ISSN 0.25–0.40 g/kg-per-feeding band; for MPS/repair, not glycogen.
   */
  PROTEIN_G_PER_KG: 0.3,

  /**
   * MIRROR of the canonical server rate `REFUEL.CARB_G_PER_KG_PER_H` (1.0
   * g/kg/h) and window cap `REFUEL.CARB_WINDOW_CAP_H` (4 h). The client now
   * derives medium/long-gap carbohydrate from this rate exactly as the server
   * does, so the two can never present different numbers for the same window.
   * Guarded by refuel-protein-parity.test.js. 1.0 is the conservative end of
   * the cited 1.0–1.2 g/kg/h band.
   */
  REFUEL_CARB_G_PER_KG_PER_H: 1.0,
  REFUEL_CARB_WINDOW_CAP_H: 4,
} as const;

/**
 * The two SHORT-window doses that stay GI-limited (see header — gut tolerance,
 * not resynthesis rate, is the constraint this close to the next kickoff).
 * These are per-occasion, not rates.
 */
export const TOURNAMENT_GAP_FUEL = {
  /**
   * Flat grams (NOT per-kg — under 30 min the gut ceiling doesn't scale with
   * bodyweight; a 100 kg athlete can't take a bigger gel than a 70 kg one in
   * the same half-hour). Half a gel.
   */
  TURNAROUND_FAST_CARB_G: 12,
  /**
   * <75 min: fast carbs only (gel / sports drink / ripe banana), off the feet.
   * 0.4 g/kg is a deliberately GI-safe single dose, well under the rate — you
   * play again too soon to absorb more.
   */
  SHORT_CARB_G_PER_KG: 0.4,
} as const;

/**
 * Post-final-whistle recovery, when there is no next game to protect the gut
 * for. 1.2 g/kg in the first hour IS the ISSN upper rate (1.2 g/kg/h) applied
 * to a 1 h window — the one moment the aggressive figure is fully justified,
 * because nothing downstream constrains the gut.
 */
export const POST_DAY_RECOVERY = {
  CARB_G_PER_KG: 1.2,
} as const;
