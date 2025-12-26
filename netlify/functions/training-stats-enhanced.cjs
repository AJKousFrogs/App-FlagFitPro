// Netlify Function: Enhanced Training Statistics API
// Centralized endpoint for aggregating training statistics with ACWR, REP, volume, intensity
// Always filters data up to and including today's date
// This is the single source of truth for training stats calculations

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

/**
 * Get today's date for inclusive filtering
 * Returns date in YYYY-MM-DD format (UTC)
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate session load in arbitrary units (AU)
 * Formula: Duration (minutes) × RPE (1-10)
 * Falls back to Duration × Intensity if RPE not available
 */
function calculateSessionLoad(session) {
  const duration = session.duration_minutes || 0;
  const rpe = session.rpe || session.intensity_level || 5; // Default to 5 if missing
  return duration * rpe;
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio)
 * - Acute Load: Sum of last 7 days total load
 * - Chronic Load: Average weekly load over last 28 days
 * - ACWR = Acute / Chronic
 *
 * Target: 0.8-1.3 (sweet spot: 1.0-1.2)
 * Risk zones: > 1.5 (high injury risk), < 0.8 (detraining risk)
 */
function calculateACWR(sessions, referenceDate = new Date()) {
  const today =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const todayStr = today.toISOString().split("T")[0];

  // Filter sessions up to and including today
  const validSessions = sessions.filter((s) => {
    const sessionDate = s.session_date || s.date;
    return sessionDate && sessionDate <= todayStr;
  });

  if (validSessions.length === 0) {
    return {
      acwr: null,
      acuteLoad: 0,
      chronicLoad: 0,
      acuteDays: 0,
      chronicDays: 0,
      riskZone: "insufficient_data",
      message: "Insufficient data to calculate ACWR (need at least 7 days)",
    };
  }

  // Calculate acute load (last 7 days)
  const acuteStartDate = new Date(today);
  acuteStartDate.setDate(acuteStartDate.getDate() - 7);
  const acuteStartStr = acuteStartDate.toISOString().split("T")[0];

  const acuteSessions = validSessions.filter((s) => {
    const sessionDate = s.session_date || s.date;
    return sessionDate >= acuteStartStr && sessionDate <= todayStr;
  });

  const acuteLoad = acuteSessions.reduce(
    (sum, s) => sum + calculateSessionLoad(s),
    0,
  );

  // Calculate chronic load (last 28 days, average weekly load)
  const chronicStartDate = new Date(today);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);
  const chronicStartStr = chronicStartDate.toISOString().split("T")[0];

  const chronicSessions = validSessions.filter((s) => {
    const sessionDate = s.session_date || s.date;
    return sessionDate >= chronicStartStr && sessionDate <= todayStr;
  });

  const chronicTotalLoad = chronicSessions.reduce(
    (sum, s) => sum + calculateSessionLoad(s),
    0,
  );
  const chronicLoad = chronicTotalLoad / 4; // Average weekly load over 4 weeks

  // Calculate ACWR
  let acwr = null;
  let riskZone = "insufficient_data";
  let message = "";

  if (chronicLoad > 0) {
    acwr = acuteLoad / chronicLoad;

    if (acwr < 0.8) {
      riskZone = "detraining";
      message = "ACWR below optimal range - risk of detraining";
    } else if (acwr >= 0.8 && acwr <= 1.3) {
      riskZone = "optimal";
      message = "ACWR in optimal range";
    } else if (acwr > 1.3 && acwr <= 1.5) {
      riskZone = "elevated";
      message = "ACWR elevated - monitor closely";
    } else {
      riskZone = "danger";
      message = "ACWR in danger zone - high injury risk, reduce load";
    }
  } else {
    message = "Insufficient chronic load data (need at least 28 days)";
  }

  return {
    acwr: acwr ? Math.round(acwr * 100) / 100 : null,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    acuteDays: acuteSessions.length,
    chronicDays: chronicSessions.length,
    riskZone,
    message,
  };
}

/**
 * Calculate weekly volume (total load for current week)
 */
function calculateWeeklyVolume(sessions, referenceDate = new Date()) {
  const today =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const _todayStr = today.toISOString().split("T")[0];

  // Get ISO week start (Monday)
  const getISOWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getISOWeekStart(today);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const weekSessions = sessions.filter((s) => {
    const sessionDate = s.session_date || s.date;
    return (
      sessionDate && sessionDate >= weekStartStr && sessionDate <= weekEndStr
    );
  });

  const totalLoad = weekSessions.reduce(
    (sum, s) => sum + calculateSessionLoad(s),
    0,
  );
  const totalDuration = weekSessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0,
  );
  const avgIntensity =
    weekSessions.length > 0
      ? weekSessions.reduce(
          (sum, s) => sum + (s.rpe || s.intensity_level || 5),
          0,
        ) / weekSessions.length
      : 0;

  return {
    totalLoad: Math.round(totalLoad),
    totalDuration: Math.round(totalDuration),
    sessionCount: weekSessions.length,
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
  };
}

/**
 * Get aggregated training statistics for a user
 * Filters to sessions up to and including today
 */
async function getTrainingStats(userId, options = {}) {
  try {
    checkEnvVars();

    const today = getTodayDate();
    const { startDate, endDate } = options;

    // Build query - always filter to today by default
    let query = supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .lte("session_date", today) // Default: up to and including today
      .order("session_date", { ascending: false });

    if (startDate) {
      query = query.gte("session_date", startDate);
    }

    if (endDate) {
      query = query.lte("session_date", endDate);
    }

    const { data: sessions, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    const validSessions = (sessions || []).filter((s) => {
      const sessionDate = s.session_date || s.date;
      return sessionDate && sessionDate <= today;
    });

    // Calculate ACWR
    const acwrData = calculateACWR(validSessions);

    // Calculate weekly volume
    const weeklyVolume = calculateWeeklyVolume(validSessions);

    // Calculate overall stats
    const totalSessions = validSessions.length;
    const totalDuration = validSessions.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    );
    const totalLoad = validSessions.reduce(
      (sum, s) => sum + calculateSessionLoad(s),
      0,
    );
    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const avgLoad = totalSessions > 0 ? totalLoad / totalSessions : 0;

    // Calculate current streak (consecutive days with training)
    let currentStreak = 0;
    const todayDate = new Date(today);
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(todayDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasSessionOnDate = validSessions.some((s) => {
        const sessionDate = s.session_date || s.date;
        return sessionDate === dateStr;
      });

      if (hasSessionOnDate) {
        currentStreak++;
      } else if (i > 0) {
        // Don't break streak on first day (today) if no session yet
        break;
      }
    }

    // Group by type
    const sessionsByType = {};
    validSessions.forEach((session) => {
      const type = session.session_type || session.type || "unknown";
      if (!sessionsByType[type]) {
        sessionsByType[type] = {
          count: 0,
          totalDuration: 0,
          totalLoad: 0,
        };
      }
      sessionsByType[type].count++;
      sessionsByType[type].totalDuration += session.duration_minutes || 0;
      sessionsByType[type].totalLoad += calculateSessionLoad(session);
    });

    return {
      // Overall stats
      totalSessions,
      totalDuration: Math.round(totalDuration),
      totalLoad: Math.round(totalLoad),
      avgDuration: Math.round(avgDuration),
      avgLoad: Math.round(avgLoad),
      currentStreak,

      // ACWR metrics
      acwr: acwrData.acwr,
      acuteLoad: acwrData.acuteLoad,
      chronicLoad: acwrData.chronicLoad,
      acwrRiskZone: acwrData.riskZone,
      acwrMessage: acwrData.message,

      // Weekly volume
      weeklyVolume: weeklyVolume.totalLoad,
      weeklyDuration: weeklyVolume.totalDuration,
      weeklySessions: weeklyVolume.sessionCount,
      weeklyAvgIntensity: weeklyVolume.avgIntensity,

      // Breakdown by type
      sessionsByType,

      // Date range
      dateRange: {
        startDate:
          validSessions.length > 0
            ? validSessions[validSessions.length - 1].session_date ||
              validSessions[validSessions.length - 1].date
            : null,
        endDate:
          validSessions.length > 0
            ? validSessions[0].session_date || validSessions[0].date
            : null,
        filteredToToday: today,
      },
    };
  } catch (error) {
    console.error("Error getting training stats:", error);
    throw error;
  }
}

exports.handler = async (event, _context) => {
  logFunctionCall("Training-Stats-Enhanced", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Check environment variables
    checkEnvVars();

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Handle GET request - return training stats
    if (event.httpMethod === "GET") {
      const queryParams = event.queryStringParameters || {};
      const options = {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      };

      const trainingStats = await getTrainingStats(userId, options);
      return createSuccessResponse(trainingStats);
    }

    // Method not allowed
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  } catch (error) {
    console.error("Error in training-stats-enhanced function:", error);
    return handleServerError(error, "Training-Stats-Enhanced");
  }
};
