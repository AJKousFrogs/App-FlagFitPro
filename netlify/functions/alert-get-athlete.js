import { getSupabaseClient } from "./utils/auth-helper.js";
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

const logger = createLogger({ service: "netlify.alert-get-athlete" });

/**
 * Get Athlete Alerts Endpoint
 * GET /api/alerts/athlete/:athleteId?status=active&limit=20&offset=0
 *
 * Staff-protected endpoint. Returns paginated alerts for single athlete.
 * Filters by status and applies user's alert preferences.
 */

async function getAthleteAlerts(
  supabase,
  athleteId,
  status,
  limit,
  offset,
  userId,
  requestLogger
) {
  try {
    let query = supabase
      .from("generated_alerts")
      .select(
        "id, user_id, rule_id, alert_type, title, description, trigger_data, related_injury_id, status, acknowledged, acknowledged_at, acknowledged_note, created_at",
        { count: "exact" }
      )
      .eq("user_id", athleteId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: alerts, error: alertsError, count } = await query;

    if (alertsError) {
      requestLogger.error("DB error fetching athlete alerts", {
        code: alertsError.code,
        athleteId,
      });
      return createErrorResponse("Failed to fetch alerts", 500);
    }

    // Enrich alerts with rule names and delivery status
    const enrichedAlerts = await Promise.all(
      (alerts || []).map(async (alert) => {
        const { data: rule } = await supabase
          .from("alert_rules")
          .select("name")
          .eq("id", alert.rule_id)
          .single();

        const { data: deliveries } = await supabase
          .from("alert_delivery_logs")
          .select("channel, delivery_status")
          .eq("generated_alert_id", alert.id);

        return {
          ...alert,
          ruleName: rule?.name || "Unknown Rule",
          deliveryChannels: (deliveries || []).map((d) => ({
            channel: d.channel,
            status: d.delivery_status,
          })),
        };
      })
    );

    return createSuccessResponse({
      success: true,
      data: enrichedAlerts,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getAthleteAlerts", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-get-athlete",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to view alerts", 403);
      }

      const { teamId } = await getUserTeam(userId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      // Extract athleteId from path
      const pathMatch = event.path?.match(/\/alerts\/athlete\/([^/?]+)/);
      const athleteId = pathMatch?.[1];

      if (!athleteId) {
        return createErrorResponse("Missing athleteId in path", 400);
      }

      // Verify user can access this athlete's team
      const supabase = getSupabaseClient();
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("user_id", athleteId)
        .single();

      if (!teamMembers) {
        return createErrorResponse(
          "Athlete is not part of your team",
          403
        );
      }

      const queryString = event.rawQueryString || "";
      const params = new URLSearchParams(queryString);
      const status = params.get("status") || "active";
      const limit = Math.min(parseInt(params.get("limit")) || 20, 100);
      const offset = parseInt(params.get("offset")) || 0;

      return getAthleteAlerts(
        supabase,
        athleteId,
        status,
        limit,
        offset,
        userId,
        requestLogger
      );
    },
  });

export { handler };
