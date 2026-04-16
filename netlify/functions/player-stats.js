import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseAthleteId } from "./utils/db-query-helper.js";
import { baseHandler } from "./utils/base-handler.js";
import { hasAnyRole, COACH_ROUTE_ROLES } from "./utils/role-sets.js";

// Netlify Function: Player Statistics API
// Centralized endpoint for aggregating player statistics across all games
// Always filters data up to and including today's date

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

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePlayerStatsPath(pathname = "") {
  return pathname
    .replace(/^\/\.netlify\/functions\/player-stats\/?/, "")
    .replace(/^\/api\/player-stats\/?/, "")
    .replace(/^\/+|\/+$/g, "");
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
    const stats = aggregateStatsFromPlays(uniquePlays, games, playerId);

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
function aggregateStatsFromPlays(plays, games, playerId) {
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
    const isPrimaryPlayer = play.primary_player_id === playerId;
    const secondaryPlayerIds = Array.isArray(play.secondary_player_ids)
      ? play.secondary_player_ids
      : [];
    const isSecondaryPlayer = secondaryPlayerIds.includes(playerId);
    const yardsGained = toFiniteNumber(play.yards_gained);
    const receivingYards = toFiniteNumber(play.receiving_yards);
    const yardsAfterCatch = toFiniteNumber(play.yards_after_catch);

    // Passing stats only for the primary passer.
    if ((playType === "pass" || playType === "throw") && isPrimaryPlayer) {
      stats.passAttempts++;

      if (playResult === "completion") {
        stats.completions++;
      } else if (playResult === "interception") {
        stats.interceptions++;
      }

      if (yardsGained !== null) {
        stats.passingYards += yardsGained;
        stats.totalYards += yardsGained;
      }

      if (playResult === "touchdown") {
        stats.touchdowns++;
      }
    }

    // Receiving stats only when player is the receiving participant.
    const isReceivingContext =
      playType === "reception" ||
      ((playType === "pass" || playType === "throw") && isSecondaryPlayer);
    if (isReceivingContext) {
      stats.targets++;
      if (playResult === "completion" || playType === "reception") {
        stats.receptions++;
      } else if (playResult === "drop") {
        stats.drops++;
      }

      const creditedReceivingYards = receivingYards ?? yardsGained;
      if (creditedReceivingYards !== null) {
        stats.receivingYards += creditedReceivingYards;
        stats.totalYards += creditedReceivingYards;
      }

      if (yardsAfterCatch !== null) {
        stats.yardsAfterCatch += yardsAfterCatch;
      }

      if (playResult === "touchdown") {
        stats.receivingTouchdowns++;
      }
    }

    // Rushing stats
    if ((playType === "run" || playType === "rush") && isPrimaryPlayer) {
      stats.rushingAttempts++;

      if (yardsGained !== null) {
        stats.rushingYards += yardsGained;
        stats.totalYards += yardsGained;
      }

      if (playResult === "touchdown") {
        stats.rushingTouchdowns++;
      }
    }

    // Defensive stats
    const isDefensiveParticipant = isPrimaryPlayer || isSecondaryPlayer;

    if (
      (playType === "flag_pull" || playType === "tackle") &&
      isDefensiveParticipant
    ) {
      stats.flagPullAttempts++;

      if (playResult === "flag_pull" || play.is_successful) {
        stats.flagPulls++;
      } else {
        stats.missedFlagPulls++;
      }
    }

    if (
      playType === "defense" &&
      playResult === "defended_pass" &&
      isDefensiveParticipant
    ) {
      stats.defendedPasses++;
    }

    if (
      playType === "defense" &&
      playResult === "interception" &&
      isDefensiveParticipant
    ) {
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
    badThrows: 0,
    throwAways: 0,
    sacks: 0,
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
    rushingAttempts: 0,
    rushingYards: 0,
    rushingTouchdowns: 0,
    yardsPerCarry: 0,
    brokenTackles: 0,
    longestRun: 0,
    flagPullAttempts: 0,
    flagPulls: 0,
    flagPullSuccessRate: 0,
    missedFlagPulls: 0,
    defendedPasses: 0,
    interceptionsDef: 0,
    tacklesForLoss: 0,
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

    return aggregateStatsFromPlays(uniquePlays, games, playerId);
  } catch (error) {
    console.error("Error getting player stats by date range:", error);
    throw error;
  }
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "player-stats",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // P0-001: Explicitly require authentication
    handler: async (event, _context, { userId }) => {
      const queryParams = event.queryStringParameters || {};
      const path = normalizePlayerStatsPath(event.path);

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

      // P0-013: IDOR Protection - Verify user can access this player's stats
      if (playerId !== userId) {
        // Check if requesting user is a coach with consent
        const { data: teamMember } = await supabaseAdmin
          .from("team_members")
          .select("role")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        const isCoach = hasAnyRole(teamMember?.role, COACH_ROUTE_ROLES);

        if (!isCoach) {
          return createErrorResponse(
            "You can only view your own stats",
            403,
            "authorization_denied",
          );
        }

        // Check consent for coaches
        const { data: consent } = await supabaseAdmin
          .from("player_stats_consent")
          .select("id")
          .eq("coach_id", userId)
          .eq("player_id", playerId)
          .eq("consent_granted", true)
          .is("revoked_at", null)
          .maybeSingle();

        if (!consent) {
          return createErrorResponse(
            "You don't have consent to view this player's stats",
            403,
            "consent_required",
          );
        }
      }

      if (!playerId) {
        return createErrorResponse(
          "Player ID is required",
          422,
          "validation_error",
        );
      }

      let result;

      // Route handling
      if (path === "" || path === "aggregated") {
        const { season } = queryParams;
        const { teamId } = queryParams;
        result = await getPlayerAggregatedStats(playerId, { season, teamId });
      } else if (path === "date-range") {
        const startDate = queryParams.startDate
          ? new Date(queryParams.startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = queryParams.endDate
          ? new Date(queryParams.endDate)
          : new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return createErrorResponse(
            "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
            422,
            "validation_error",
          );
        }
        if (startDate > endDate) {
          return createErrorResponse(
            "startDate must be before or equal to endDate",
            422,
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

export const testHandler = handler;
export { handler };
