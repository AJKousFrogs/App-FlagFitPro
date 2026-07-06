import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getWeekNumber } from "./utils/date-utils.js";
import { parseBoundedInt } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.trends" });

// Netlify Function: Trends
// Provides trend data for dashboards:
// - Change of direction sessions (last 4 weeks)
// - Sprint volume trends
// - Game-to-game performance metrics
// Endpoint: /api/trends/:type

/**
 * Get change of direction sessions trend
 */
async function getChangeOfDirectionTrend(athleteId, weeks = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Change-of-direction / agility sessions from the live training_sessions table
  // (the legacy per-athlete `sessions` table was retired). training_sessions carries
  // both drill_type and session_type, keyed on user_id + session_date.
  const { data, error } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, drill_type, session_type")
    .eq("user_id", athleteId)
    .gte("session_date", startDate.toISOString().split("T")[0])
    .lte("session_date", endDate.toISOString().split("T")[0])
    .or(
      "drill_type.ilike.%change%,drill_type.ilike.%cod%,drill_type.ilike.%agility%,session_type.ilike.%agility%",
    );

  if (error) {
    throw error;
  }

  // Group by week
  const weeklyCounts = new Map();
  const sessions = data || [];

  sessions.forEach((session) => {
    const date = new Date(session.session_date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
  });

  const weeksData = Array.from(weeklyCounts.entries())
    .map(([week, count]) => ({
      week,
      count,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Calculate current (last 2 weeks) vs previous (2 weeks before)
  const current = weeksData.slice(-2).reduce((sum, w) => sum + w.count, 0);
  const previous = weeksData.slice(-4, -2).reduce((sum, w) => sum + w.count, 0);

  return {
    current,
    previous,
    change:
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100,
    weeks: weeksData,
  };
}

/**
 * Get sprint volume trend
 */
async function getSprintVolumeTrend(athleteId, weeks = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Sprint/speed training volume from the live training_sessions table. The retired
  // `sessions` table had a numeric sprint_count; training_sessions doesn't, so volume is
  // the count of speed-oriented sessions per week (by drill_type/session_type).
  const { data, error } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, drill_type, session_type")
    .eq("user_id", athleteId)
    .gte("session_date", startDate.toISOString().split("T")[0])
    .lte("session_date", endDate.toISOString().split("T")[0])
    .or(
      "drill_type.ilike.%sprint%,drill_type.ilike.%speed%,session_type.ilike.%sprint%,session_type.ilike.%speed%",
    );

  if (error) {
    throw error;
  }

  // Group by week
  const weeklyVolumes = new Map();
  const sessions = data || [];

  sessions.forEach((session) => {
    const date = new Date(session.session_date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyVolumes.set(weekKey, (weeklyVolumes.get(weekKey) || 0) + 1);
  });

  const weeksData = Array.from(weeklyVolumes.entries())
    .map(([week, volume]) => ({
      week,
      volume,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Calculate current (last 2 weeks) vs previous (2 weeks before)
  const current = weeksData.slice(-2).reduce((sum, w) => sum + w.volume, 0);
  const previous = weeksData
    .slice(-4, -2)
    .reduce((sum, w) => sum + w.volume, 0);

  return {
    current,
    previous,
    change:
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100,
    weeks: weeksData,
  };
}

/**
 * Get game performance trend
 */
async function getGamePerformanceTrend(athleteId, games = 5) {
  try {
    let data = null;
    let error = null;

    // Query games table
    const gamesResult = await supabaseAdmin
      .from("games")
      .select("*")
      .or(`athlete_id.eq.${athleteId},user_id.eq.${athleteId}`)
      .order("game_date", { ascending: false })
      .limit(games);

    if (!gamesResult.error) {
      ({ data } = gamesResult);
    } else {
      ({ error } = gamesResult);
    }

    if (error) {
      logger.warn("games_fetch_failed", { message: error.message });
      // Return empty but valid response instead of throwing
      return {
        games: [],
        averagePerformance: 0,
        trend: "stable",
        message: "No game data available yet",
      };
    }

    if (!data || data.length === 0) {
      return {
        games: [],
        averagePerformance: 0,
        trend: "stable",
        message: "No games recorded yet",
      };
    }

    const gameData = (data || []).map((game) => ({
      date: game.game_date || game.date,
      opponent: game.opponent || game.opponent_name || "Unknown",
      performance:
        game.performance_score || game.performance || game.rating || 0,
      metrics: {
        touchdowns: game.touchdowns || 0,
        completions: game.completions || 0,
        yards: game.yards || game.total_yards || 0,
        ...(game.metrics || {}),
      },
    }));

    const performances = gameData
      .map((g) => g.performance)
      .filter((p) => p > 0);
    const averagePerformance =
      performances.length > 0
        ? performances.reduce((sum, p) => sum + p, 0) / performances.length
        : 0;

    // Determine trend
    let trend = "stable";
    if (performances.length >= 2) {
      const recent = performances.slice(0, Math.ceil(performances.length / 2));
      const older = performances.slice(Math.ceil(performances.length / 2));
      const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
      const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length;

      if (recentAvg > olderAvg * 1.05) {
        trend = "improving";
      } else if (recentAvg < olderAvg * 0.95) {
        trend = "declining";
      }
    }

    return {
      games: gameData,
      averagePerformance,
      trend,
    };
  } catch (err) {
    logger.warn("game_performance_trend_error", { message: err.message });
    return {
      games: [],
      averagePerformance: 0,
      trend: "stable",
      message: "Unable to load game data",
    };
  }
}

/**
 * Main handler
 */
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "trends",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      try {
        // Parse path parameters
        const pathParts = event.path.split("/").filter((p) => p);
        const trendType = pathParts[pathParts.length - 1];

        // Parse query parameters
        const athleteId = event.queryStringParameters?.athleteId || userId;
        let weeks = 4;
        let games = 5;
        const weeksParam = event.queryStringParameters?.weeks;
        const gamesParam = event.queryStringParameters?.games;

        if (weeksParam !== undefined) {
          weeks = parseBoundedInt(String(weeksParam), "weeks", {
            min: 1,
            max: 52,
          });
        }
        if (gamesParam !== undefined) {
          games = parseBoundedInt(String(gamesParam), "games", {
            min: 1,
            max: 50,
          });
        }

        if (athleteId !== userId) {
          return createErrorResponse(
            "Not authorized to view another athlete's trends",
            403,
            "authorization_error",
            requestId,
          );
        }
        let result;

        switch (trendType) {
          case "change-of-direction":
            result = await getChangeOfDirectionTrend(athleteId, weeks);
            break;
          case "sprint-volume":
            result = await getSprintVolumeTrend(athleteId, weeks);
            break;
          case "game-performance":
            result = await getGamePerformanceTrend(athleteId, games);
            break;
          default:
            return createErrorResponse(
              `Unknown trend type: ${trendType}. Supported: change-of-direction, sprint-volume, game-performance`,
              400,
              "invalid_trend_type",
            );
        }

        return createSuccessResponse(result);
      } catch (error) {
        if (error?.message?.includes("must be an integer between")) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
