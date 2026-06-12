
// Netlify Function: Enhanced Training Statistics API
// Centralized endpoint for aggregating training statistics with ACWR, REP, volume, intensity
// Always filters data up to and including today's date
// This is the single source of truth for training stats calculations

import { supabaseAdmin } from "./supabase-client.js";
import { computeAcwrAt, computeSessionLoad, classifyAcwrZone } from "./utils/acwr.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

/**
 * Get today's date for inclusive filtering
 * Returns date in YYYY-MM-DD format (UTC)
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const ACWR_ZONE_MESSAGES = {
  detraining: "ACWR below optimal range - risk of detraining",
  safe: "ACWR in optimal range",
  caution: "ACWR elevated - monitor closely",
  danger: "ACWR in danger zone - high injury risk, reduce load",
  critical: "ACWR critical - immediate load reduction required",
};

function calculateACWR(sessions, referenceDate = new Date()) {
  const today =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const todayStr = today.toISOString().split("T")[0];

  const dailyLoads = new Map();
  for (const s of sessions || []) {
    const rawDate = s.session_date || s.date;
    if (!rawDate || String(rawDate).split("T")[0] > todayStr) {
      continue;
    }
    const dayKey = String(rawDate).split("T")[0];
    const load = computeSessionLoad(s);
    if (load > 0) {
      dailyLoads.set(dayKey, (dailyLoads.get(dayKey) || 0) + load);
    }
  }

  if (dailyLoads.size === 0) {
    return { acwr: null, acuteLoad: 0, chronicLoad: 0, riskZone: "insufficient_data", message: "Insufficient data to calculate ACWR" };
  }

  const result = computeAcwrAt(dailyLoads, today);

  if (result.acwr === null || result.lowConfidence) {
    return { acwr: null, acuteLoad: Math.round(result.acuteLoad), chronicLoad: Math.round(result.chronicLoad), riskZone: "insufficient_data", message: "Insufficient data to calculate ACWR (need at least 7 days)" };
  }

  const zone = classifyAcwrZone(result.acwr);
  return {
    acwr: Math.round(result.acwr * 100) / 100,
    acuteLoad: Math.round(result.acuteLoad),
    chronicLoad: Math.round(result.chronicLoad),
    riskZone: zone ?? "insufficient_data",
    message: ACWR_ZONE_MESSAGES[zone] ?? "",
  };
}

/**
 * Calculate weekly volume (total load for current week)
 */
function calculateWeeklyVolume(sessions, referenceDate = new Date()) {
  const today =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
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
    (sum, s) => sum + computeSessionLoad(s),
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
      (sum, s) => sum + computeSessionLoad(s),
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
      sessionsByType[type].totalLoad += computeSessionLoad(session);
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

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-stats-enhanced",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      try {
        const queryParams = event.queryStringParameters || {};
        const options = {
          startDate: queryParams.startDate,
          endDate: queryParams.endDate,
        };

        const trainingStats = await getTrainingStats(userId, options);
        return createSuccessResponse(trainingStats, requestId);
      } catch (error) {
        console.error("[training-stats-enhanced] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to fetch training stats",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
