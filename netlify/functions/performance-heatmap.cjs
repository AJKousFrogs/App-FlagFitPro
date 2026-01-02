// Netlify Function: Performance Heatmap API
// Returns training load data for the Training Heatmap component
// Endpoint: /api/performance/heatmap

const { supabaseAdmin } = require("./supabase-client.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

/**
 * Calculate intensity level from training session data
 */
function calculateIntensity(duration, intensityLevel, sessionType) {
  // Base intensity calculation
  const baseIntensity = intensityLevel || 5;

  // Adjust based on session type
  const typeMultipliers = {
    speed: 1.2,
    strength: 1.1,
    agility: 1.0,
    endurance: 0.9,
    recovery: 0.5,
    technical: 0.8,
  };

  const multiplier = typeMultipliers[sessionType] || 1.0;
  const adjustedIntensity = baseIntensity * multiplier;

  // Scale to 0-7 range for heatmap
  return Math.min(7, Math.max(0, Math.round(adjustedIntensity)));
}

/**
 * Get training load heatmap data
 */
async function getHeatmapData(userId, timeRange) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 6);
    }

    // Get training sessions in date range (handle both athlete_id and user_id columns)
    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .or(`athlete_id.eq.${userId},user_id.eq.${userId}`)
      .gte("session_date", startDate.toISOString().split("T")[0])
      .lte("session_date", endDate.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    if (error && error.code !== "42P01") {
      console.error("[performance-heatmap] Error fetching sessions:", error);
      throw error;
    }

    const trainingSessions = sessions || [];
    console.log(
      `[performance-heatmap] Found ${trainingSessions.length} sessions for user ${userId}`,
    );

    // Group sessions by date
    const sessionsByDate = {};
    trainingSessions.forEach((session) => {
      const date = session.session_date || session.completed_at?.split("T")[0];
      if (!date) {
        return;
      }

      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });

    // Generate heatmap cells
    const cells = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const daySessions = sessionsByDate[dateStr] || [];

      if (daySessions.length > 0) {
        // Calculate aggregate metrics
        const totalDuration = daySessions.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0,
        );

        const avgIntensity =
          daySessions.reduce((sum, s) => sum + (s.intensity_level || 5), 0) /
          daySessions.length;

        const intensity = calculateIntensity(
          totalDuration,
          avgIntensity,
          daySessions[0]?.session_type || "mixed",
        );

        // Calculate value (intensity * 10 for display, or total duration for volume)
        const value = intensity * 10;

        cells.push({
          date: dateStr,
          value: Math.round(value),
          intensity,
          sessions: daySessions.length,
          duration: totalDuration,
        });
      } else {
        // No sessions on this date
        cells.push({
          date: dateStr,
          value: 0,
          intensity: 0,
          sessions: 0,
          duration: 0,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return cells;
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    // Return empty data on error
    return [];
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "performance-heatmap",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const timeRange = event.queryStringParameters?.timeRange || "6months";

      // Get heatmap data
      const cells = await getHeatmapData(userId, timeRange);

      // Return real data (even if empty) - no mock data fallback
      // This ensures the frontend shows accurate state
      const hasTrainingData = cells.some((cell) => cell.sessions > 0);

      return createSuccessResponse({
        cells,
        timeRange,
        hasData: hasTrainingData,
        totalSessions: cells.reduce((sum, c) => sum + c.sessions, 0),
        message: hasTrainingData
          ? null
          : "No training sessions found. Log sessions to see your training heatmap.",
      });
    },
  });
};
