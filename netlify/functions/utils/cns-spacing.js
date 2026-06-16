/**
 * CNS spacing guard — prevents back-to-back max-effort sprint/speed sessions.
 *
 * Canonical spacing window = spacingHoursHighImpact (72h) from
 * training-modalities.config.ts. The client-side AcwrService.shouldSkipSprints()
 * is a coarse proxy (riskZone + day-of-week); this is the server-side authority
 * that checks actual session recency against the DB.
 */

/**
 * Returns the ISO timestamp of the most recent sprint/speed/competition session
 * within the spacing window, or null if the athlete is clear to sprint.
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId
 * @param {string} date - ISO date string (YYYY-MM-DD) for "today"
 * @param {number} spacingHours - Minimum hours required between high-CNS sessions
 * @returns {string|null} completed_at timestamp of blocking session, or null if clear
 */
export async function getLastHighCnsSession(supabase, userId, date, spacingHours) {
  if (!userId) return null;
  const since = new Date(
    new Date(`${date}T00:00:00Z`).getTime() - spacingHours * 3_600_000,
  ).toISOString();
  const { data, error } = await supabase
    .from("training_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .in("session_type", ["sprint", "speed", "competition", "max_velocity"])
    .gte("completed_at", since)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.completed_at;
}
