// Netlify Function: Trends
// Provides trend data for dashboards:
// - Change of direction sessions (last 4 weeks)
// - Sprint volume trends
// - Game-to-game performance metrics
// Endpoint: /api/trends/:type

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { getWeekNumber } = require("./utils/date-utils.cjs");

/**
 * Get change of direction sessions trend
 */
async function getChangeOfDirectionTrend(athleteId, weeks = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Query sessions with change of direction drills
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
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
    const date = new Date(session.date);
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

  // Query sessions with sprint data
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("sprint_count, date")
    .eq("athlete_id", athleteId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .not("sprint_count", "is", null);

  if (error) {
    throw error;
  }

  // Group by week
  const weeklyVolumes = new Map();
  const sessions = data || [];

  sessions.forEach((session) => {
    const date = new Date(session.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyVolumes.set(
      weekKey,
      (weeklyVolumes.get(weekKey) || 0) + (session.sprint_count || 0),
    );
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
  // Query game performance data
  // Note: This assumes a games/performance table exists
  // Adjust based on your actual schema
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("game_date", { ascending: false })
    .limit(games);

  if (error) {
    // If games table doesn't exist, return mock data structure
    console.warn("Games table not found, returning empty trend");
    return {
      games: [],
      averagePerformance: 0,
      trend: "stable",
    };
  }

  const gameData = (data || []).map((game) => ({
    date: game.game_date || game.date,
    opponent: game.opponent || game.opponent_name || "Unknown",
    performance: game.performance_score || game.performance || 0,
    metrics: {
      touchdowns: game.touchdowns || 0,
      completions: game.completions || 0,
      yards: game.yards || 0,
      ...(game.metrics || {}),
    },
  }));

  const performances = gameData.map((g) => g.performance).filter((p) => p > 0);
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
}

/**
 * Main handler
 */
exports.handler = async (event, _context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  logFunctionCall("trends", event.httpMethod);

  try {
    checkEnvVars();

    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET to retrieve trends.",
        405,
        "method_not_allowed",
      );
    }

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

    // Parse path parameters
    const pathParts = event.path.split("/").filter((p) => p);
    const trendType = pathParts[pathParts.length - 1]; // e.g., 'change-of-direction', 'sprint-volume', 'game-performance'

    // Parse query parameters
    // If athleteId not provided, use authenticated user's ID
    const athleteId = event.queryStringParameters?.athleteId || userId;
    const weeks = parseInt(event.queryStringParameters?.weeks || "4", 10);
    const games = parseInt(event.queryStringParameters?.games || "5", 10);

    if (!athleteId) {
      return handleValidationError("athleteId query parameter is required");
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
          400,
          `Unknown trend type: ${trendType}. Supported: change-of-direction, sprint-volume, game-performance`,
        );
    }

    return createSuccessResponse(result);
  } catch (error) {
    return handleServerError(error, "trends");
  }
};
