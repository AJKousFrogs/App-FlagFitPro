// Netlify Function: Player Statistics API
// Centralized endpoint for aggregating player statistics across all games
// Always filters data up to and including today's date

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { parseAthleteId } = require("./utils/db-query-helper.cjs");
// Note: authenticateRequest, applyRateLimit are handled by baseHandler

/**
 * Get today's date at end of day (23:59:59) for inclusive filtering
 * This ensures we include all data up to and including today
 */
function getTodayEndOfDay() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
}

/**
 * Get player aggregated statistics across all games up to and including today
 * This is the single source of truth for player stats
 */
const getPlayerAggregatedStats = async (playerId, options = {}) => {
  try {
    checkEnvVars();

    const todayEndOfDay = getTodayEndOfDay();
    const { season, teamId } = options;

    // Build query for games up to and including today
    let gamesQuery = supabaseAdmin
      .from("games")
      .select("game_id, game_date")
      .lte("game_date", todayEndOfDay)
      .order("game_date", { ascending: false });

    if (season) {
      gamesQuery = gamesQuery.eq("season", season);
    }

    if (teamId) {
      gamesQuery = gamesQuery.eq("team_id", teamId);
    }

    const { data: games, error: gamesError } = await gamesQuery;

    if (gamesError) {
      throw gamesError;
    }

    if (!games || games.length === 0) {
      return getEmptyStats();
    }

    const gameIds = games.map((g) => g.game_id);

    // Get all game events for this player across all games up to today
    const { data: primaryPlays, error: primaryError } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .in("game_id", gameIds)
      .eq("primary_player_id", playerId);

    if (primaryError) {
      throw primaryError;
    }

    const { data: secondaryPlays, error: secondaryError } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .in("game_id", gameIds)
      .contains("secondary_player_ids", [playerId]);

    if (secondaryError) {
      throw secondaryError;
    }

    // Combine and deduplicate plays
    const allPlays = [...(primaryPlays || []), ...(secondaryPlays || [])];
    const uniquePlays = Array.from(
      new Map(allPlays.map((p) => [p.id, p])).values(),
    );

    // Aggregate statistics from all plays
    const stats = aggregateStatsFromPlays(uniquePlays, games);

    return stats;
  } catch (error) {
    console.error("Error getting player aggregated stats:", error);
    throw error;
  }
};

/**
 * Aggregate statistics from game events/plays
 * Uses consistent mathematical logic for all calculations
 */
function aggregateStatsFromPlays(plays, games) {
  const stats = {
    // Game counts
    gamesPlayed: new Set(plays.map((p) => p.game_id)).size,
    totalGames: games.length,

    // Passing stats
    passAttempts: 0,
    completions: 0,
    passingYards: 0,
    touchdowns: 0,
    interceptions: 0,
    completionPercentage: 0,
    avgYardsPerAttempt: 0,
    badThrows: 0,
    throwAways: 0,
    sacks: 0,

    // Receiving stats
    targets: 0,
    receptions: 0,
    receivingYards: 0,
    receivingTouchdowns: 0,
    drops: 0,
    dropRate: 0,
    yardsAfterCatch: 0,
    avgYardsPerReception: 0,
    contestedCatches: 0,
    longestReception: 0,

    // Rushing stats
    rushingAttempts: 0,
    rushingYards: 0,
    rushingTouchdowns: 0,
    yardsPerCarry: 0,
    brokenTackles: 0,
    longestRun: 0,

    // Defensive stats
    flagPullAttempts: 0,
    flagPulls: 0,
    flagPullSuccessRate: 0,
    missedFlagPulls: 0,
    defendedPasses: 0,
    interceptionsDef: 0,
    tacklesForLoss: 0,

    // Efficiency metrics
    totalYards: 0,
    totalPlays: plays.length,
  };

  // Aggregate from plays
  plays.forEach((play) => {
    const playType = play.play_type?.toLowerCase();
    const playResult = play.play_result?.toLowerCase();

    // Passing stats
    if (playType === "pass" || playType === "throw") {
      stats.passAttempts++;
      stats.targets++;

      if (playResult === "completion") {
        stats.completions++;
        stats.receptions++;
      } else if (playResult === "interception") {
        stats.interceptions++;
      } else if (playResult === "drop") {
        stats.drops++;
      }

      if (play.yards_gained) {
        stats.passingYards += play.yards_gained;
        stats.totalYards += play.yards_gained;
      }

      if (playResult === "touchdown") {
        stats.touchdowns++;
      }
    }

    // Receiving stats (from receiving_stats table or game_events)
    if (playType === "reception" || playResult === "completion") {
      stats.targets++;
      stats.receptions++;

      if (play.receiving_yards) {
        stats.receivingYards += play.receiving_yards;
        stats.totalYards += play.receiving_yards;
      }

      if (play.yards_after_catch) {
        stats.yardsAfterCatch += play.yards_after_catch;
      }

      if (playResult === "touchdown") {
        stats.receivingTouchdowns++;
      }
    }

    // Rushing stats
    if (playType === "run" || playType === "rush") {
      stats.rushingAttempts++;

      if (play.yards_gained) {
        stats.rushingYards += play.yards_gained;
        stats.totalYards += play.yards_gained;
      }

      if (playResult === "touchdown") {
        stats.rushingTouchdowns++;
      }
    }

    // Defensive stats
    if (playType === "flag_pull" || playType === "tackle") {
      stats.flagPullAttempts++;

      if (playResult === "flag_pull" || play.is_successful) {
        stats.flagPulls++;
      } else {
        stats.missedFlagPulls++;
      }
    }

    if (playResult === "defended_pass") {
      stats.defendedPasses++;
    }

    if (playResult === "interception" && playType === "defense") {
      stats.interceptionsDef++;
    }
  });

  // Calculate derived metrics using consistent formulas
  // These formulas match the StatisticsCalculationService for consistency
  if (stats.passAttempts > 0) {
    // Completion percentage: (completions / attempts) * 100, rounded to 1 decimal
    const completionPct = (stats.completions / stats.passAttempts) * 100;
    stats.completionPercentage = Number(
      (Math.round(completionPct * 10) / 10).toFixed(1),
    );

    // Average yards per attempt: passing yards / attempts, rounded to 2 decimals
    stats.avgYardsPerAttempt = Number(
      (stats.passingYards / stats.passAttempts).toFixed(2),
    );
  } else {
    stats.completionPercentage = 0;
    stats.avgYardsPerAttempt = 0;
  }

  if (stats.targets > 0) {
    // Drop rate: (drops / targets) * 100, rounded to 1 decimal
    const dropRatePct = (stats.drops / stats.targets) * 100;
    stats.dropRate = Number((Math.round(dropRatePct * 10) / 10).toFixed(1));

    // Average yards per reception: receiving yards / receptions, rounded to 2 decimals
    if (stats.receptions > 0) {
      stats.avgYardsPerReception = Number(
        (stats.receivingYards / stats.receptions).toFixed(2),
      );
    } else {
      stats.avgYardsPerReception = 0;
    }
  } else {
    stats.dropRate = 0;
    stats.avgYardsPerReception = 0;
  }

  if (stats.rushingAttempts > 0) {
    // Yards per carry: rushing yards / attempts, rounded to 2 decimals
    stats.yardsPerCarry = Number(
      (stats.rushingYards / stats.rushingAttempts).toFixed(2),
    );
  } else {
    stats.yardsPerCarry = 0;
  }

  if (stats.flagPullAttempts > 0) {
    // Flag pull success rate: (successes / attempts) * 100, rounded to 1 decimal
    const successRatePct = (stats.flagPulls / stats.flagPullAttempts) * 100;
    stats.flagPullSuccessRate = Number(
      (Math.round(successRatePct * 10) / 10).toFixed(1),
    );
  } else {
    stats.flagPullSuccessRate = 0;
  }

  return stats;
}

/**
 * Return empty stats structure
 */
function getEmptyStats() {
  return {
    gamesPlayed: 0,
    totalGames: 0,
    passAttempts: 0,
    completions: 0,
    passingYards: 0,
    touchdowns: 0,
    interceptions: 0,
    completionPercentage: 0,
    avgYardsPerAttempt: 0,
    targets: 0,
    receptions: 0,
    receivingYards: 0,
    drops: 0,
    dropRate: 0,
    rushingAttempts: 0,
    rushingYards: 0,
    flagPullAttempts: 0,
    flagPulls: 0,
    flagPullSuccessRate: 0,
    totalPlays: 0,
    totalYards: 0,
  };
}

/**
 * Get player stats for a specific date range
 */
const getPlayerStatsByDateRange = async (playerId, startDate, endDate) => {
  try {
    checkEnvVars();

    // Ensure endDate includes the full day
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setHours(23, 59, 59, 999);

    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("game_id, game_date")
      .gte("game_date", startDate.toISOString())
      .lte("game_date", endDateInclusive.toISOString())
      .order("game_date", { ascending: false });

    if (gamesError) {
      throw gamesError;
    }

    if (!games || games.length === 0) {
      return getEmptyStats();
    }

    const gameIds = games.map((g) => g.game_id);

    const { data: primaryPlays, error: primaryError } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .in("game_id", gameIds)
      .eq("primary_player_id", playerId);

    if (primaryError) {
      throw primaryError;
    }

    const { data: secondaryPlays, error: secondaryError } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .in("game_id", gameIds)
      .contains("secondary_player_ids", [playerId]);

    if (secondaryError) {
      throw secondaryError;
    }

    const allPlays = [...(primaryPlays || []), ...(secondaryPlays || [])];
    const uniquePlays = Array.from(
      new Map(allPlays.map((p) => [p.id, p])).values(),
    );

    return aggregateStatsFromPlays(uniquePlays, games);
  } catch (error) {
    console.error("Error getting player stats by date range:", error);
    throw error;
  }
};

const { baseHandler } = require("./utils/base-handler.cjs");

// Main handler
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "player-stats",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, _context, { userId }) => {
      const queryParams = event.queryStringParameters || {};
      const path = event.path.replace("/.netlify/functions/player-stats", "");

      // Get player ID (defaults to authenticated user)
      const {
        valid,
        athleteId,
        error: athleteError,
      } = parseAthleteId(event, userId, false);
      if (!valid) {
        return athleteError;
      }

      const playerId = queryParams.playerId || athleteId;

      if (!playerId) {
        return createErrorResponse(
          "Player ID is required",
          400,
          "validation_error",
        );
      }

      let result;

      // Route handling
      if (
        path.includes("/aggregated") ||
        path.endsWith("/aggregated") ||
        path === "" ||
        path === "/"
      ) {
        const season = queryParams.season;
        const teamId = queryParams.teamId;
        result = await getPlayerAggregatedStats(playerId, { season, teamId });
      } else if (path.includes("/date-range") || path.endsWith("/date-range")) {
        const startDate = queryParams.startDate
          ? new Date(queryParams.startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = queryParams.endDate
          ? new Date(queryParams.endDate)
          : new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return createErrorResponse(
            "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
            400,
            "validation_error",
          );
        }

        result = await getPlayerStatsByDateRange(playerId, startDate, endDate);
      } else {
        return createErrorResponse("Endpoint not found", 404, "not_found");
      }

      return createSuccessResponse(result);
    },
  });
};
