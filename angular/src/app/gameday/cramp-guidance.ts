/**
 * Cramp guidance for hot multi-game days (2026-07-18).
 *
 * Pure and TestBed-free, like surface-advisory.ts.
 *
 * WHY THIS EXISTS: the popular model — "you cramp because you sweated out your
 * electrolytes" — is not what the evidence supports, and an app that repeats it
 * sends a cramping athlete to reach for salt when the actual driver is fatigue.
 * Exercise-associated muscle cramping (EAMC) is best explained by ALTERED
 * NEUROMUSCULAR CONTROL in fatigued muscle: excitatory muscle-spindle drive
 * rises while inhibitory Golgi-tendon-organ drive falls, so the motor neuron
 * pool runs away. Serum electrolyte and hydration status largely fail to
 * separate crampers from non-crampers in field studies.
 *   Schwellnus MP (2009 BJSM, online 2008) "Cause of exercise associated muscle
 *   cramps (EAMC) — altered neuromuscular control, dehydration or electrolyte
 *   depletion?" — https://doi.org/10.1136/bjsm.2008.050401
 *   Nelson NL & Churilla JR (2016) Muscle Nerve, narrative review —
 *   https://doi.org/10.1002/mus.25176
 *   Troyer W et al. (2020) Curr Rev Musculoskelet Med —
 *   https://doi.org/10.1007/s12178-020-09662-8
 *
 * Hence the ORDERING this module enforces, which is the whole point of it:
 *   1. fatigue framing + passive static stretch (the acute lever that works —
 *      stretch raises GTO inhibition and breaks the cramp),
 *   2. sodium only as a SECOND lever, and only for the subgroup where it is
 *      defensible: repeat crampers with heavy, visibly salty sweat in heat.
 *
 * Sodium is not dismissed — it is ranked. Both notes ship together so the
 * hierarchy is visible; never render the sodium line alone.
 *
 * ADVISORY ONLY — changes no dose, no macro target, no hydration number. The
 * canonical fluid/sodium figures stay in nutrition-protocols.js / REFUEL and
 * are NOT restated here (§4 single-source).
 */

export interface CrampGuidance {
  /** Primary: fatigue framing + what to actually do in the moment. */
  note: string;
  /** Secondary lever, explicitly conditional. Render below {@link note}. */
  sodiumNote: string;
}

/**
 * Guidance for a hot multi-game day, or null when it doesn't apply.
 *
 * Scoped to hot AND multi-game deliberately: that is the window where cramping
 * actually clusters, and firing on every game day would make it wallpaper.
 *
 * @param hot       is the day flagged hot by the weather guard
 * @param gameCount games scheduled today
 */
export function crampGuidance({
  hot,
  gameCount,
}: {
  hot: boolean;
  gameCount: number;
}): CrampGuidance | null {
  if (!hot) return null;
  if (!Number.isFinite(gameCount) || gameCount <= 1) return null;

  return {
    note:
      `Cramping late in a hot multi-game day is mostly a fatigue signal, not a ` +
      `salt one — tired muscle loses its normal reflex control. If one bites: ` +
      `stop, stretch the cramping muscle gently and hold it until it lets go, ` +
      `then re-warm before you go back on. Across the day, pace your efforts ` +
      `and keep fuelling and drinking to your plan rather than trying to ` +
      `out-drink it.`,
    sodiumNote:
      `Sodium is a second lever, not the first: worth trying only if you cramp ` +
      `repeatedly across hot tournaments and sweat heavily with visible salt ` +
      `stains. For everyone else, adding salt won't beat being better ` +
      `conditioned for back-to-backs.`,
  };
}
