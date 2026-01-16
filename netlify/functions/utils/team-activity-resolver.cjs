/**
 * Team Activity Source of Truth Resolver
 *
 * Pure deterministic function that resolves ONE authoritative team activity
 * for each athlete-day (practice / film room / cancelled / none).
 *
 * Priority rules (hard):
 * 1) rehab_protocol (athlete-specific) => participation = excluded
 * 2) coach-created team activity (practice/film) => authoritative
 * 3) weather override is ONLY a coach action flag, never AI auto-replace
 * 4) no record => null
 *
 * Contract: PROMPT_2_10_TEAM_ACTIVITY_SOT
 */

/**
 * Resolve team activity for athlete-day
 *
 * @param {Object} supabase - Supabase client
 * @param {string} athleteId - Athlete user ID
 * @param {string} teamId - Team ID (optional, will lookup if not provided)
 * @param {string} dateLocal - ISO date string (YYYY-MM-DD) in athlete's local timezone
 * @returns {Promise<Object>} Resolution result
 */
async function resolveTeamActivityForAthleteDay(
  supabase,
  athleteId,
  teamId,
  dateLocal,
) {
  const audit = {
    athleteId,
    teamId: teamId || null,
    dateLocal,
    resolvedAt: new Date().toISOString(),
    steps: [],
  };

  // Step 1: Get team_id if not provided
  if (!teamId) {
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", athleteId)
      .eq("status", "active")
      .maybeSingle();

    if (teamError) {
      audit.steps.push({ step: "team_lookup", error: teamError.message });
      return {
        exists: false,
        activity: null,
        participation: null,
        source: "none",
        audit,
      };
    }

    if (!teamMember) {
      audit.steps.push({ step: "team_lookup", result: "no_team" });
      return {
        exists: false,
        activity: null,
        participation: null,
        source: "none",
        audit,
      };
    }

    teamId = teamMember.team_id;
    audit.teamId = teamId;
    audit.steps.push({ step: "team_lookup", result: "found", teamId });
  }

  // Step 2: Check for active rehab protocol (PRIORITY 1)
  const { data: wellnessCheckin } = await supabase
    .from("daily_wellness_checkin")
    .select("soreness_areas, pain_level")
    .eq("user_id", athleteId)
    .lte("checkin_date", dateLocal)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActiveRehab =
    wellnessCheckin?.soreness_areas &&
    wellnessCheckin.soreness_areas.length > 0;

  if (hasActiveRehab) {
    audit.steps.push({
      step: "rehab_check",
      result: "active_rehab",
      injuries: wellnessCheckin.soreness_areas,
    });
  } else {
    audit.steps.push({ step: "rehab_check", result: "no_rehab" });
  }

  // Step 3: Get team activity for this date
  const { data: teamActivity, error: activityError } = await supabase
    .from("team_activities")
    .select("*")
    .eq("team_id", teamId)
    .eq("date", dateLocal)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activityError) {
    audit.steps.push({ step: "activity_lookup", error: activityError.message });
    return {
      exists: false,
      activity: null,
      participation: hasActiveRehab ? "excluded" : null,
      source: "none",
      audit,
    };
  }

  if (!teamActivity) {
    audit.steps.push({ step: "activity_lookup", result: "no_activity" });
    return {
      exists: false,
      activity: null,
      participation: hasActiveRehab ? "excluded" : null,
      source: "none",
      audit,
    };
  }

  audit.steps.push({
    step: "activity_lookup",
    result: "found",
    activityId: teamActivity.id,
    activityType: teamActivity.type,
  });

  // Step 4: Get athlete's participation status
  const { data: attendance, error: attendanceError } = await supabase
    .from("team_activity_attendance")
    .select("participation, exclusion_reason")
    .eq("activity_id", teamActivity.id)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  let participation = "required"; // Default if no attendance record

  if (attendanceError) {
    audit.steps.push({
      step: "attendance_lookup",
      error: attendanceError.message,
    });
  } else if (attendance) {
    participation = attendance.participation;
    audit.steps.push({
      step: "attendance_lookup",
      result: "found",
      participation,
      exclusionReason: attendance.exclusion_reason,
    });
  } else {
    audit.steps.push({ step: "attendance_lookup", result: "default_required" });
  }

  // Step 5: Apply rehab protocol override (PRIORITY 1 - highest)
  if (hasActiveRehab) {
    participation = "excluded";
    audit.steps.push({
      step: "rehab_override",
      result: "applied",
      finalParticipation: "excluded",
      reason: "active_rehab_protocol",
    });
  }

  // Step 6: Get coach name for attribution
  let createdByCoachName = null;
  if (teamActivity.created_by_coach_id) {
    const { data: coach } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", teamActivity.created_by_coach_id)
      .maybeSingle();

    if (coach) {
      createdByCoachName = coach.full_name;
    }
  }

  // Step 7: Build response
  const result = {
    exists: true,
    activity: {
      id: teamActivity.id,
      type: teamActivity.type,
      startTimeLocal: teamActivity.start_time_local,
      endTimeLocal: teamActivity.end_time_local,
      location: teamActivity.location,
      note: teamActivity.note,
      replacesSession: teamActivity.replaces_session,
      createdByCoachId: teamActivity.created_by_coach_id,
      createdByCoachName,
      createdAt: teamActivity.created_at,
      updatedAt: teamActivity.updated_at,
      weatherOverride: teamActivity.weather_override,
    },
    participation,
    source: "coach_calendar",
    audit,
  };

  audit.steps.push({ step: "resolution_complete", result: "success" });
  return result;
}

/**
 * Batch resolve team activities for multiple dates
 *
 * @param {Object} supabase - Supabase client
 * @param {string} athleteId - Athlete user ID
 * @param {string} teamId - Team ID (optional)
 * @param {string[]} dates - Array of ISO date strings
 * @returns {Promise<Map<string, Object>>} Map of date -> resolution result
 */
async function batchResolveTeamActivities(supabase, athleteId, teamId, dates) {
  const results = new Map();

  await Promise.all(
    dates.map(async (date) => {
      const result = await resolveTeamActivityForAthleteDay(
        supabase,
        athleteId,
        teamId,
        date,
      );
      results.set(date, result);
    }),
  );

  return results;
}

module.exports = {
  resolveTeamActivityForAthleteDay,
  batchResolveTeamActivities,
};
