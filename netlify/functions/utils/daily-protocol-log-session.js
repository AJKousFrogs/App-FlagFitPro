import { createLogger } from "./structured-logger.js";

const logger = createLogger({ service: "netlify.daily-protocol" });

/**
 * POST /api/daily-protocol/log-session
 * Log the main session RPE and duration
 */
async function logSession(supabase, userId, payload, headers, log = logger) {
  const { protocolId, actualDurationMinutes, actualRpe, sessionNotes } =
    payload;

  if (!protocolId || !actualDurationMinutes || !actualRpe) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "protocolId, actualDurationMinutes, and actualRpe required",
      }),
    };
  }

  // Calculate session load (duration × RPE)
  const actualLoadAu = actualDurationMinutes * actualRpe;

  // Get the protocol to retrieve the date
  const { data: protocol, error: fetchError } = await supabase
    .from("daily_protocols")
    .select("protocol_date, training_focus")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Update the protocol
  const { error: updateError } = await supabase
    .from("daily_protocols")
    .update({
      actual_duration_minutes: actualDurationMinutes,
      actual_rpe: actualRpe,
      actual_load_au: actualLoadAu,
      session_notes: sessionNotes,
      main_session_status: "complete",
      main_session_completed_at: new Date().toISOString(),
    })
    .eq("id", protocolId)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  // Detect late logging
  const sessionDate = new Date(protocol.protocol_date);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

  let logStatus = "on_time";
  let requiresApproval = false;
  let hoursDelayed = null;

  if (hoursDiff > 48) {
    logStatus = "retroactive";
    requiresApproval = true;
    hoursDelayed = Math.floor(hoursDiff);
  } else if (hoursDiff > 24) {
    logStatus = "late";
    hoursDelayed = Math.floor(hoursDiff);
  }

  // Detect conflicts: RPE vs session type
  const conflicts = [];
  const sessionType = protocol.training_focus || "general";
  const sessionTypeIntensity = {
    recovery: { max: 4 },
    light: { max: 5 },
    moderate: { max: 7 },
    intense: { min: 7 },
  };

  const typeRules = sessionTypeIntensity[sessionType];
  if (typeRules && actualRpe) {
    if (typeRules.max && actualRpe > typeRules.max) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
    if (typeRules.min && actualRpe < typeRules.min) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
  }

  // Log to training_sessions table for ACWR calculation
  try {
    await supabase.from("training_sessions").insert({
      user_id: userId,
      session_date: protocol.protocol_date,
      session_type: sessionType,
      duration_minutes: actualDurationMinutes,
      rpe: actualRpe,
      workload: actualLoadAu,
      notes: sessionNotes,
      session_state: "COMPLETED", // Execution logging creates completed session
      coach_locked: false, // Execution logs are not coach-locked
      log_status: logStatus,
      requires_coach_approval: requiresApproval,
      hours_delayed: hoursDelayed,
      conflicts: conflicts.length > 0 ? conflicts : null,
    });

    // If retroactive, notify coach for approval
    if (requiresApproval) {
      // Get coach for this player
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "player")
        .maybeSingle();

      if (teamMember) {
        const { data: coaches } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamMember.team_id)
          .eq("role", "coach")
          .limit(1);

        if (coaches && coaches.length > 0) {
          await supabase.from("notifications").insert({
            user_id: coaches[0].user_id,
            notification_type: "training",
            message: `Player logged training session ${hoursDelayed} hours late - approval required`,
            priority: "high",
            metadata: { playerId: userId, sessionDate: protocol.protocol_date },
          });
        }
      }
    }
  } catch (sessionError) {
    log.warn(
      "daily_protocol_training_session_log_failed",
      {
        user_id: userId,
        protocol_id: protocolId,
        session_date: protocol.protocol_date,
      },
      sessionError,
    );
    // Non-fatal - continue
  }

  // (Removed: a dead .rpc("compute_acwr") recalc trigger — that Postgres proc was retired
  // when ACWR moved to the JS pipeline (utils/acwr.js). The completed session is already
  // logged to training_sessions above, the canonical load source ACWR reads on demand.)

  // (Removed: a dead duplicate write of training_load/duration/rpe to wellness_logs.
  // The completed session is already logged to training_sessions above — the canonical
  // load source for ACWR — so this was write-only dead data. wellness_logs is retired.)

  // Update training streak
  let streakResult = null;
  try {
    const { data: streakData, error: streakError } = await supabase.rpc(
      "update_player_streak",
      {
        p_user_id: userId,
        p_streak_type: "training",
        p_activity_date: protocol.protocol_date,
      },
    );

    if (!streakError && streakData && streakData.length > 0) {
      streakResult = streakData[0];

      // Award any streak achievements
      const unlocked = streakResult.achievements_unlocked || [];
      for (const slug of unlocked) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: slug,
          p_context: JSON.stringify({ streak_length: streakResult.new_streak }),
        });
      }
    }
  } catch (streakError) {
    log.warn(
      "daily_protocol_training_streak_update_failed",
      {
        user_id: userId,
        protocol_id: protocolId,
      },
      streakError,
    );
  }

  // Update player_training_stats
  try {
    const currentMonth = protocol.protocol_date.substring(0, 7); // YYYY-MM

    // Check if stats exist
    const { data: existingStats } = await supabase
      .from("player_training_stats")
      .select(
        "id, total_sessions, total_training_minutes, total_load_au, month_sessions, month_load_au, current_month",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (existingStats) {
      const monthReset = existingStats.current_month !== currentMonth;
      await supabase
        .from("player_training_stats")
        .update({
          total_sessions: existingStats.total_sessions + 1,
          total_training_minutes:
            existingStats.total_training_minutes + actualDurationMinutes,
          total_load_au: existingStats.total_load_au + actualLoadAu,
          month_sessions: monthReset ? 1 : existingStats.month_sessions + 1,
          month_load_au: monthReset
            ? actualLoadAu
            : existingStats.month_load_au + actualLoadAu,
          current_month: currentMonth,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("player_training_stats").insert({
        user_id: userId,
        total_sessions: 1,
        total_training_minutes: actualDurationMinutes,
        total_load_au: actualLoadAu,
        month_sessions: 1,
        month_load_au: actualLoadAu,
        current_month: currentMonth,
      });
    }
  } catch (statsError) {
    log.warn(
      "daily_protocol_training_stats_update_failed",
      {
        user_id: userId,
        protocol_id: protocolId,
      },
      statsError,
    );
  }

  // Check for session milestone achievements
  try {
    const { data: stats } = await supabase
      .from("player_training_stats")
      .select("total_sessions")
      .eq("user_id", userId)
      .maybeSingle();

    if (stats) {
      const sessionsCount = stats.total_sessions;
      // Check milestone achievements
      const milestones = [
        { count: 1, slug: "protocol_first" },
        { count: 10, slug: "sessions_10" },
        { count: 50, slug: "sessions_50" },
        { count: 100, slug: "sessions_100" },
        { count: 365, slug: "sessions_365" },
      ];

      for (const milestone of milestones) {
        if (sessionsCount >= milestone.count) {
          await supabase.rpc("award_achievement", {
            p_user_id: userId,
            p_achievement_slug: milestone.slug,
            p_context: JSON.stringify({ sessions: sessionsCount }),
          });
        }
      }
    }
  } catch (achievementError) {
    log.warn(
      "daily_protocol_achievement_check_failed",
      {
        user_id: userId,
        protocol_id: protocolId,
      },
      achievementError,
    );
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      actualLoadAu,
      streak: streakResult
        ? {
            newStreak: streakResult.new_streak,
            isNewRecord: streakResult.is_new_record,
          }
        : null,
    }),
  };
}

export { logSession };
