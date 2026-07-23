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

const logger = createLogger({ service: "netlify.alert-acknowledge" });

/**
 * Acknowledge Alert Endpoint
 * PATCH /api/alerts/:alertId/acknowledge
 *
 * Staff-only endpoint. Acknowledges an alert (marks as read by staff).
 * Optionally includes acknowledgment notes.
 * Triggers automation rules if configured.
 */

async function acknowledgeAlert(
  supabase,
  alertId,
  userId,
  note,
  teamId,
  requestLogger
) {
  try {
    // Get alert to verify team access
    const { data: alert, error: getError } = await supabase
      .from("generated_alerts")
      .select("user_id, rule_id, status")
      .eq("id", alertId)
      .single();

    if (getError || !alert) {
      requestLogger.error("Alert not found", { alertId });
      return createErrorResponse("Alert not found", 404);
    }

    // Verify athlete is in user's team
    const { data: teamCheck } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("user_id", alert.user_id)
      .single();

    if (!teamCheck) {
      return createErrorResponse("Not authorized to acknowledge this alert", 403);
    }

    // Update alert acknowledgment
    const { data: updated, error: updateError } = await supabase
      .from("generated_alerts")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
        acknowledged_note: note || null,
      })
      .eq("id", alertId)
      .select("id, user_id, rule_id, status, trigger_data");

    if (updateError) {
      requestLogger.error("DB error updating alert", {
        code: updateError.code,
      });
      return createErrorResponse("Failed to acknowledge alert", 500);
    }

    if (!updated || updated.length === 0) {
      return createErrorResponse("Failed to acknowledge alert", 500);
    }

    const acknowledgment = updated[0];

    // Trigger automation rules based on alert type
    await triggerAutomationRules(
      supabase,
      alertId,
      acknowledgment,
      requestLogger
    );

    return createSuccessResponse({
      success: true,
      message: "Alert acknowledged",
      data: {
        alertId: acknowledgment.id,
        status: "acknowledged",
        acknowledgedAt: acknowledgment.acknowledged_at,
        note: acknowledgment.acknowledged_note,
      },
    });
  } catch (err) {
    requestLogger.error("Unexpected error in acknowledgeAlert", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function triggerAutomationRules(supabase, alertId, alert, requestLogger) {
  try {
    // Placeholder: automation rules (auto-suggest load reduction, recovery, etc.)
    // will be implemented as a separate scheduled service.
    // This function is reserved for future automation triggers.
  } catch (err) {
    requestLogger.warn("Automation rule trigger failed", {
      alertId,
      error: err.message,
    });
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-acknowledge",
    allowedMethods: ["PATCH"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to acknowledge alerts", 403);
      }

      const { teamId } = await getUserTeam(userId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      // Extract alertId from path
      const pathMatch = event.path?.match(/\/alerts\/([^/?]+)\/acknowledge/);
      const alertId = pathMatch?.[1];

      if (!alertId) {
        return createErrorResponse("Missing alertId in path", 400);
      }

      // Parse request body
      let body = {};
      try {
        if (event.body) {
          body = JSON.parse(event.body);
        }
      } catch {
        return createErrorResponse("Invalid JSON in request body", 400);
      }

      const { note } = body;

      const supabase = getSupabaseClient();
      return acknowledgeAlert(
        supabase,
        alertId,
        userId,
        note,
        teamId,
        requestLogger
      );
    },
  });

export { handler };
