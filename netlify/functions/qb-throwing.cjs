/**
 * QB Throwing Tracker API
 *
 * Endpoints:
 * - GET /api/qb-throwing - Get progression status, weekly stats, recent sessions
 * - POST /api/qb-throwing - Log a new throwing session
 * - POST /api/qb-throwing/arm-care - Mark arm care as complete for a session
 */

const { supabaseAdmin } = require("./supabase-client.cjs");

const getSupabase = (_authHeader) => {
  // Use shared admin client
  return supabaseAdmin;
};

exports.handler = async (event) => {
  const { httpMethod, path, body, headers } = event;
  const authHeader = headers.authorization || headers.Authorization;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Authorization required" }),
    };
  }

  // Extract the JWT token from "Bearer <token>"
  const token = authHeader.substring(7);
  const supabase = getSupabase(authHeader);

  // Get user from token - MUST pass token to getUser() when using admin client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("[qb-throwing] Auth error:", authError?.message);
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid authentication" }),
    };
  }

  try {
    const endpoint = path.split("/").pop();

    if (httpMethod === "GET") {
      return await getThrowingData(supabase, user.id, corsHeaders);
    }

    if (httpMethod === "POST") {
      const payload = body ? JSON.parse(body) : {};

      if (endpoint === "arm-care") {
        return await markArmCareDone(supabase, user.id, payload, corsHeaders);
      }

      return await logThrowingSession(supabase, user.id, payload, corsHeaders);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error("QB throwing error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
    };
  }
};

/**
 * GET /api/qb-throwing
 * Get QB throwing progression, weekly stats, and recent sessions
 */
async function getThrowingData(supabase, userId, headers) {
  // Get progression status using the function
  const { data: progressionData } = await supabase.rpc(
    "get_qb_throwing_progression",
    {
      p_user_id: userId,
    },
  );

  let progression = null;
  if (progressionData && progressionData.length > 0) {
    const p = progressionData[0];
    progression = {
      currentWeekAvg: p.current_week_avg || 0,
      targetThrows: p.target_throws || 150,
      progressionPhase: p.progression_phase || "Foundation",
      daysSinceLastSession: p.days_since_last_session || 999,
      weeklyCompliancePct: p.weekly_compliance_pct || 0,
      recommendation: p.recommendation || "Start tracking your throws!",
    };
  } else {
    // Default for new users
    progression = {
      currentWeekAvg: 0,
      targetThrows: 150,
      progressionPhase: "Foundation (100-150/session)",
      daysSinceLastSession: 999,
      weeklyCompliancePct: 0,
      recommendation:
        "Start tracking your throws to build toward tournament capacity!",
    };
  }

  // Get weekly stats (last 8 weeks)
  const { data: weeklyData } = await supabase
    .from("qb_throwing_sessions")
    .select(
      "session_date, total_throws, pre_throwing_warmup_done, post_throwing_arm_care_done, ice_applied, arm_feeling_after",
    )
    .eq("user_id", userId)
    .gte(
      "session_date",
      new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    )
    .order("session_date", { ascending: false });

  // Group by week
  const weeklyStats = [];
  if (weeklyData && weeklyData.length > 0) {
    const weekMap = new Map();

    weeklyData.forEach((session) => {
      const date = new Date(session.session_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart: weekKey,
          weeklyThrows: 0,
          sessionsCount: 0,
          totalArmFeeling: 0,
          warmupCount: 0,
          armCareCount: 0,
          iceSessions: 0,
        });
      }

      const week = weekMap.get(weekKey);
      week.weeklyThrows += session.total_throws || 0;
      week.sessionsCount += 1;
      week.totalArmFeeling += session.arm_feeling_after || 0;
      if (session.pre_throwing_warmup_done) {
        week.warmupCount += 1;
      }
      if (session.post_throwing_arm_care_done) {
        week.armCareCount += 1;
      }
      if (session.ice_applied) {
        week.iceSessions += 1;
      }
    });

    // Convert to array and calculate averages
    weekMap.forEach((week) => {
      weeklyStats.push({
        weekStart: week.weekStart,
        weeklyThrows: week.weeklyThrows,
        sessionsCount: week.sessionsCount,
        avgArmFeeling:
          week.sessionsCount > 0
            ? Math.round((week.totalArmFeeling / week.sessionsCount) * 10) / 10
            : 0,
        warmupCompliancePct:
          week.sessionsCount > 0
            ? Math.round((week.warmupCount / week.sessionsCount) * 100)
            : 0,
        armCareCompliancePct:
          week.sessionsCount > 0
            ? Math.round((week.armCareCount / week.sessionsCount) * 100)
            : 0,
        iceSessions: week.iceSessions,
      });
    });

    // Sort by week (most recent first)
    weeklyStats.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
  }

  // Get recent sessions
  const { data: sessionsData } = await supabase
    .from("qb_throwing_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(10);

  const recentSessions = (sessionsData || []).map((s) => ({
    id: s.id,
    sessionDate: s.session_date,
    totalThrows: s.total_throws,
    shortThrows: s.short_throws,
    mediumThrows: s.medium_throws,
    longThrows: s.long_throws,
    sessionType: s.session_type,
    location: s.location,
    armFeelingBefore: s.arm_feeling_before,
    armFeelingAfter: s.arm_feeling_after,
    preThrowingWarmupDone: s.pre_throwing_warmup_done,
    postThrowingArmCareDone: s.post_throwing_arm_care_done,
    iceApplied: s.ice_applied,
    warmupDurationMinutes: s.warmup_duration_minutes,
    throwingDurationMinutes: s.throwing_duration_minutes,
    armCareDurationMinutes: s.arm_care_duration_minutes,
    notes: s.notes,
    mechanicsFocus: s.mechanics_focus,
    fatigueLevel: s.fatigue_level,
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        progression,
        weeklyStats: weeklyStats.slice(0, 8), // Last 8 weeks
        recentSessions,
      },
    }),
  };
}

/**
 * POST /api/qb-throwing
 * Log a new throwing session
 */
async function logThrowingSession(supabase, userId, payload, headers) {
  const {
    sessionType,
    totalThrows,
    shortThrows,
    mediumThrows,
    longThrows,
    location,
    armFeelingBefore,
    armFeelingAfter,
    preThrowingWarmupDone,
    postThrowingArmCareDone,
    iceApplied,
    warmupDurationMinutes,
    throwingDurationMinutes,
    armCareDurationMinutes,
    notes,
    mechanicsFocus,
    fatigueLevel,
    sessionDate,
  } = payload;

  if (!sessionType || !totalThrows) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "sessionType and totalThrows required" }),
    };
  }

  const today = sessionDate || new Date().toISOString().split("T")[0];

  // Check if session already exists for this date/type
  const { data: existing } = await supabase
    .from("qb_throwing_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("session_date", today)
    .eq("session_type", sessionType)
    .single();

  let result;

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("qb_throwing_sessions")
      .update({
        total_throws: totalThrows,
        short_throws: shortThrows || 0,
        medium_throws: mediumThrows || 0,
        long_throws: longThrows || 0,
        location,
        arm_feeling_before: armFeelingBefore,
        arm_feeling_after: armFeelingAfter,
        pre_throwing_warmup_done: preThrowingWarmupDone || false,
        post_throwing_arm_care_done: postThrowingArmCareDone || false,
        ice_applied: iceApplied || false,
        warmup_duration_minutes: warmupDurationMinutes,
        throwing_duration_minutes: throwingDurationMinutes,
        arm_care_duration_minutes: armCareDurationMinutes,
        notes,
        mechanics_focus: mechanicsFocus,
        fatigue_level: fatigueLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("qb_throwing_sessions")
      .insert({
        user_id: userId,
        session_date: today,
        session_type: sessionType,
        total_throws: totalThrows,
        short_throws: shortThrows || 0,
        medium_throws: mediumThrows || 0,
        long_throws: longThrows || 0,
        location,
        arm_feeling_before: armFeelingBefore,
        arm_feeling_after: armFeelingAfter,
        pre_throwing_warmup_done: preThrowingWarmupDone || false,
        post_throwing_arm_care_done: postThrowingArmCareDone || false,
        ice_applied: iceApplied || false,
        warmup_duration_minutes: warmupDurationMinutes,
        throwing_duration_minutes: throwingDurationMinutes,
        arm_care_duration_minutes: armCareDurationMinutes,
        notes,
        mechanics_focus: mechanicsFocus,
        fatigue_level: fatigueLevel,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  }

  // Check if ice reminder needed
  let iceReminder = null;
  if (totalThrows >= 100 && !iceApplied) {
    iceReminder =
      "You threw 100+ balls. Consider icing your arm for 15-20 minutes.";
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result,
      iceReminder,
      message: existing ? "Session updated" : "Session logged",
    }),
  };
}

/**
 * POST /api/qb-throwing/arm-care
 * Mark arm care as complete for a session
 */
async function markArmCareDone(supabase, userId, payload, headers) {
  const { sessionId } = payload;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "sessionId required" }),
    };
  }

  const { error } = await supabase
    .from("qb_throwing_sessions")
    .update({
      post_throwing_arm_care_done: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: "Arm care marked as complete",
    }),
  };
}
