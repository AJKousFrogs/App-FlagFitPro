import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { getUserTeam } from "./utils/team-scope.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.injury-analytics" });

/**
 * Injury Analytics Endpoints
 * - GET /api/injury-analytics: Fetch season injury statistics and trends
 *
 * Provides coaches with injury summary (total, active, recovering, returned),
 * RTP rates by injury type, and timeline visualization of injury statuses.
 */

async function getInjuryAnalytics(supabase, teamId, requestLogger) {
  try {
    // Get all injuries for the team this season
    const currentSeason = new Date().getFullYear();
    const seasonStart = new Date(`${currentSeason}-01-01`);

    const { data: injuries, error: injuriesError } = await supabase
      .from("athlete_injuries")
      .select("*, athlete_id, injury_type, status, date_injured, return_to_play_date")
      .eq("team_id", teamId)
      .gte("date_injured", seasonStart.toISOString());

    if (injuriesError) {
      requestLogger.error("DB error fetching injuries", {
        code: injuriesError.code,
      });
      return createErrorResponse("Failed to fetch injury data", 500);
    }

    if (!injuries || injuries.length === 0) {
      return createSuccessResponse({
        success: true,
        stats: {
          total_injuries: 0,
          currently_active: 0,
          recovering: 0,
          returned: 0,
          avg_rtp_timeline_days: 0,
          rtp_rate_percent: 0,
          most_common: [],
        },
        rtpRatesByType: [],
        timeline: [],
        season: currentSeason.toString(),
      });
    }

    // Calculate summary statistics
    const stats = {
      total_injuries: injuries.length,
      currently_active: injuries.filter((i) => i.status === "active").length,
      recovering: injuries.filter((i) => i.status === "recovering").length,
      returned: injuries.filter((i) => i.status === "returned").length,
      avg_rtp_timeline_days: 0,
      rtp_rate_percent: 0,
      most_common: [],
    };

    // Calculate RTP timeline
    const rtpTimelines = injuries
      .filter((i) => i.return_to_play_date)
      .map((i) => {
        const injured = new Date(i.date_injured);
        const returned = new Date(i.return_to_play_date);
        return Math.floor((returned - injured) / (1000 * 60 * 60 * 24));
      });

    stats.avg_rtp_timeline_days =
      rtpTimelines.length > 0
        ? Math.round(
            rtpTimelines.reduce((a, b) => a + b, 0) / rtpTimelines.length
          )
        : 0;

    stats.rtp_rate_percent =
      stats.returned > 0
        ? Math.round((stats.returned / stats.total_injuries) * 100)
        : 0;

    // Find most common injuries
    const injuryTypeCounts = {};
    injuries.forEach((i) => {
      const type = i.injury_type || "Unknown";
      injuryTypeCounts[type] = (injuryTypeCounts[type] || 0) + 1;
    });

    stats.most_common = Object.entries(injuryTypeCounts)
      .map(([type, count]) => ({ injury_type: type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate RTP rates by injury type
    const rtpRatesByType = Object.entries(injuryTypeCounts)
      .map(([type]) => {
        const typeInjuries = injuries.filter((i) => i.injury_type === type);
        const returned = typeInjuries.filter(
          (i) => i.status === "returned"
        ).length;
        return {
          injury_type: type,
          rtp_rate_percent:
            typeInjuries.length > 0
              ? Math.round((returned / typeInjuries.length) * 100)
              : 0,
          count: typeInjuries.length,
          avg_days:
            rtpTimelines.length > 0
              ? Math.round(rtpTimelines.reduce((a, b) => a + b, 0) / rtpTimelines.length)
              : 0,
        };
      })
      .sort((a, b) => b.rtp_rate_percent - a.rtp_rate_percent);

    // Build timeline for heatmap visualization
    const monthlyData = {};
    injuries.forEach((injury) => {
      const date = new Date(injury.date_injured);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }

      monthlyData[month].push({
        athlete_id: injury.athlete_id,
        athlete_name: injury.athlete_name || "Unknown",
        injury_type: injury.injury_type,
        status: injury.status,
      });
    });

    const timeline = Object.entries(monthlyData)
      .map(([month, athletes]) => ({
        month,
        athletes,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return createSuccessResponse({
      success: true,
      stats,
      rtpRatesByType,
      timeline,
      season: currentSeason.toString(),
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getInjuryAnalytics", {
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
          "Not authorized to view injury analytics",
          403
        );
      }

      const { teamId } = await getUserTeam(requestUserId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      return getInjuryAnalytics(supabase, teamId, requestLogger);
    },
    requestLogger
  );
}

export { handler };
