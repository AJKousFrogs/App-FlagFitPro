/**
 * CNS spacing guard — prevents back-to-back max-effort sprint/speed sessions.
 *
 * Canonical spacing window: age-scaled (see {@link cnsSpacingHoursForAge}), same
 * bands as the client's periodization.service.ts cnsRecoveryHoursForAge() so the
 * intent the athlete sees on "today" and the protocol the server actually
 * generates never silently disagree. The client-side AcwrService.shouldSkipSprints()
 * is a coarse proxy (riskZone + day-of-week); this is the server-side authority
 * that checks actual session recency against the DB.
 */

/**
 * Age-scaled CNS recovery window, hours. MONOTONIC and floored at 48h — a
 * younger athlete is never given less spacing than the base. Bands mirror
 * periodization.service.ts's cnsRecoveryHoursForAge (masters S&C consensus):
 * <35 → 48h, 35-39 → 60h, 40+ → 72h. Missing/implausible age → 48h base.
 * @param {number|null|undefined} ageYears
 * @returns {number}
 */
export function cnsSpacingHoursForAge(ageYears) {
  if (typeof ageYears !== "number" || !Number.isFinite(ageYears) || ageYears < 16) {
    return 48;
  }
  if (ageYears >= 40) return 72;
  if (ageYears >= 35) return 60;
  return 48;
}

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
