/**
 * CNS spacing guard — prevents back-to-back max-effort sprint/speed sessions.
 *
 * Canonical spacing window = spacingHoursHighImpact (72h) from
 * training-modalities.config.ts. The client-side AcwrService.shouldSkipSprints()
 * is a coarse proxy (riskZone + day-of-week); this is the server-side authority
 * that checks actual session recency against the DB.
 *
 * "High-CNS?" is classified by the ONE canonical classifier — `isHighCnsSessionType`
 * from the periodization engine (utils/periodization-engine.js, generated from the TS
 * source). This guard and the prescription engine's applySprintRecoveryGuard now agree
 * on what counts as a high-CNS session, instead of two divergent definitions (the old
 * SQL `session_type IN (...)` list missed plyo/accel/agility/flag-drills; the engine
 * had, in turn, been missing `competition`).
 */

import { isHighCnsSessionType } from "./periodization-engine.js";

/**
 * Returns the ISO timestamp of the most recent high-CNS session within the spacing
 * window, or null if the athlete is clear to sprint.
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId
 * @param {string} date - ISO date string (YYYY-MM-DD) for "today"
 * @param {number} spacingHours - Minimum hours required between high-CNS sessions
 * @returns {string|null} completed_at timestamp of blocking session, or null if clear
 */
export async function getLastHighCnsSession(
  supabase,
  userId,
  date,
  spacingHours,
) {
  if (!userId) {
    return null;
  }
  const since = new Date(
    new Date(`${date}T00:00:00Z`).getTime() - spacingHours * 3_600_000,
  ).toISOString();
  // Fetch every completed session in the window (a 72h window is a handful of rows)
  // and classify in JS with the canonical classifier — a SQL `IN (...)` prefilter
  // can't apply the regex + RPE rule, so it would silently miss high-CNS work.
  const { data, error } = await supabase
    .from("training_sessions")
    .select("completed_at, session_type, rpe")
    .eq("user_id", userId)
    .gte("completed_at", since)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });
  if (error || !data) {
    return null;
  }
  const blocking = data.find((s) =>
    isHighCnsSessionType(s.session_type || "", s.rpe ?? null),
  );
  return blocking ? blocking.completed_at : null;
}
