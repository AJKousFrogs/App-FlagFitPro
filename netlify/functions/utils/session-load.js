/**
 * Foster session-RPE training load (AU) — the ONE place this formula lives.
 *
 *   workload (AU) = duration (minutes) × session RPE, rounded to an integer.
 *
 * Every session-logging path (manual log, data imports, weekend-game self-report)
 * computes stored `training_sessions.workload` through this, so the value that feeds
 * ACWR is identical no matter how the session was entered. AU is a whole number by
 * convention — fractional "AU" is meaningless precision.
 */
export function sessionWorkload(durationMinutes, rpe) {
  const d = Number(durationMinutes);
  const r = Number(rpe);
  if (!Number.isFinite(d) || !Number.isFinite(r)) {
    return 0;
  }
  return Math.round(d * r);
}
