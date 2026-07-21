import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { getUserTeam } from "./utils/team-scope.js";
import {
  tryParseJsonObjectBody,
  isFiniteNumber,
} from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.team-acwr" });

/**
 * Team ACWR Heatmap Endpoints
 * - GET /api/team-acwr?dateRange=7d&position=all: Fetch squad load status
 *
 * Real-time ACWR monitoring for all squad athletes, grouped by position.
 * ACWR < 0.8 = Underload (safe), 0.8-1.3 = Optimal, > 1.3 = High Risk
 */

async function getTeamAcwr(supabase, teamId, dateRange, position, requestLogger) {
  try {
    const daysBack = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: athletes, error: athletesError } = await supabase
      .from("team_members")
      .select("athlete_id, position")
      .eq("team_id", teamId)
      .neq("position", null);

    if (athletesError) {
      requestLogger.error("DB error fetching team members", {
        code: athletesError.code,
      });
      return createErrorResponse("Failed to fetch team data", 500);
    }

    if (!athletes || athletes.length === 0) {
      return createSuccessResponse({
        success: true,
        data: [],
        count: 0,
        teamSummary: { totalAthletes: 0, safeCount: 0, cautionCount: 0, highRiskCount: 0 },
      });
    }

    const filteredAthletes =
      position && position !== "all"
        ? athletes.filter((a) => a.position === position)
        : athletes;

    const athleteIds = filteredAthletes.map((a) => a.athlete_id);

    const { data: loads, error: loadsError } = await supabase
      .from("daily_load_score")
      .select("athlete_id, acwr_ratio, acute_load, chronic_load")
      .in("athlete_id", athleteIds)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false });

    if (loadsError) {
      requestLogger.error("DB error fetching loads", {
        code: loadsError.code,
      });
      return createErrorResponse("Failed to fetch load data", 500);
    }

    // Calculate latest ACWR per athlete
    const latestLoads = {};
    (loads || []).forEach((load) => {
      if (!latestLoads[load.athlete_id]) {
        latestLoads[load.athlete_id] = load;
      }
    });

    // Build athlete summary
    const athleteData = filteredAthletes.map((athlete) => {
      const load = latestLoads[athlete.athlete_id] || {
        acwr_ratio: 0,
        acute_load: 0,
        chronic_load: 0,
      };

      const acwrRatio = load.acwr_ratio || 0;
      let status = "safe";
      if (acwrRatio > 1.3) status = "high-risk";
      else if (acwrRatio > 0.8) status = "caution";
      else if (acwrRatio < 0.5) status = "underload";

      return {
        athlete_id: athlete.athlete_id,
        position: athlete.position,
        acwr_ratio: acwrRatio,
        acute_load: load.acute_load || 0,
        chronic_load: load.chronic_load || 0,
        status,
      };
    });

    // Calculate team summary
    const teamSummary = {
      totalAthletes: athleteData.length,
      safeCount: athleteData.filter((a) => a.status === "safe").length,
      cautionCount: athleteData.filter((a) => a.status === "caution").length,
      highRiskCount: athleteData.filter((a) => a.status === "high-risk").length,
      underloadCount: athleteData.filter((a) => a.status === "underload").length,
    };

    return createSuccessResponse({
      success: true,
      data: athleteData,
      count: athleteData.length,
      teamSummary,
      dateRange,
      position: position || "all",
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getTeamAcwr", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function handler(event, context) {
  const requestLogger = buildRequestLogContext(logger, event);

  return baseHandler(
    event,
    context,
    async (supabase, requestUserId) => {
      if (event.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405);
      }

      const role = await getUserRole(requestUserId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse(
          "Not authorized to view team ACWR data",
          403
        );
      }

      const { teamId } = await getUserTeam(requestUserId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      const queryString = event.rawQueryString || "";
      const params = new URLSearchParams(queryString);
      const dateRange = params.get("dateRange") || "7d";
      const position = params.get("position") || "all";

      return getTeamAcwr(supabase, teamId, dateRange, position, requestLogger);
    },
    requestLogger
  );
}

export { handler };
