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

const logger = createLogger({ service: "netlify.alert-dashboard" });

/**
 * Alert Dashboard Endpoint
 * GET /api/alert-dashboard?days=7
 *
 * Staff-protected endpoint. Returns aggregated alert metrics.
 * - Summary: total, by severity, acknowledged status
 * - 7-day history: daily alert counts by severity
 * - Top rules: most frequently triggered alert rules
 */

async function getAlertDashboard(supabase, teamId, days, requestLogger) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all alerts for team members in date range
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (!teamMembers || teamMembers.length === 0) {
      return createSuccessResponse({
        success: true,
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          acknowledged: 0,
          unacknowledged: 0,
        },
        history: [],
        topRules: [],
      });
    }

    const athleteIds = teamMembers.map((m) => m.user_id);

    // Fetch all alerts in date range
    const { data: alerts, error: alertsError } = await supabase
      .from("generated_alerts")
      .select(
        "id, alert_type, status, acknowledged, created_at, rule_id"
      )
      .in("user_id", athleteIds)
      .gte("created_at", cutoffDate.toISOString());

    if (alertsError) {
      requestLogger.error("DB error fetching alerts", {
        code: alertsError.code,
      });
      return createErrorResponse("Failed to fetch alerts", 500);
    }

    // Calculate summary
    const alertList = alerts || [];
    const summary = {
      total: alertList.length,
      critical: alertList.filter((a) => a.alert_type === "critical").length,
      high: alertList.filter((a) => a.alert_type === "high").length,
      medium: alertList.filter((a) => a.alert_type === "medium").length,
      low: alertList.filter((a) => a.alert_type === "low").length,
      acknowledged: alertList.filter((a) => a.acknowledged).length,
      unacknowledged: alertList.filter((a) => !a.acknowledged).length,
    };

    // Calculate 7-day history
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayAlerts = alertList.filter((a) => {
        const alertDate = a.created_at.split("T")[0];
        return alertDate === dateStr;
      });

      history.push({
        date: dateStr,
        critical: dayAlerts.filter((a) => a.alert_type === "critical").length,
        high: dayAlerts.filter((a) => a.alert_type === "high").length,
        medium: dayAlerts.filter((a) => a.alert_type === "medium").length,
        low: dayAlerts.filter((a) => a.alert_type === "low").length,
      });
    }

    // Get top rules
    const { data: rules, error: rulesError } = await supabase
      .from("alert_rules")
      .select("id, name, alert_type");

    if (rulesError) {
      requestLogger.warn("DB error fetching rules", {
        code: rulesError.code,
      });
    }

    const ruleMap = (rules || []).reduce((acc, rule) => {
      acc[rule.id] = { name: rule.name, type: rule.alert_type };
      return acc;
    }, {});

    const ruleCounts = {};
    alertList.forEach((alert) => {
      const ruleInfo = ruleMap[alert.rule_id];
      if (ruleInfo) {
        const key = ruleInfo.name;
        if (!ruleCounts[key]) {
          ruleCounts[key] = { count: 0, alertType: ruleInfo.type };
        }
        ruleCounts[key].count++;
      }
    });

    const topRules = Object.entries(ruleCounts)
      .map(([ruleName, data]) => ({
        ruleName,
        count: data.count,
        alertType: data.alertType,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return createSuccessResponse({
      success: true,
      summary,
      history,
      topRules,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getAlertDashboard", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-dashboard",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to view alert dashboard", 403);
      }

      const { teamId } = await getUserTeam(userId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      const queryString = event.rawQueryString || "";
      const params = new URLSearchParams(queryString);
      const days = Math.min(parseInt(params.get("days")) || 7, 90);

      const supabase = getSupabaseClient();
      return getAlertDashboard(supabase, teamId, days, requestLogger);
    },
  });

export { handler };
