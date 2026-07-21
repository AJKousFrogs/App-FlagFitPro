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

const logger = createLogger({ service: "netlify.alert-resolve" });

/**
 * Resolve Alert Endpoint
 * PATCH /api/alerts/:alertId/resolve
 *
 * Staff-only endpoint. Resolves an alert (marks as complete/investigated).
 * Sets resolved status and optional resolution notes.
 * Clears related automation flags.
 */

async function resolveAlert(
  supabase,
  alertId,
  userId,
  resolutionNotes,
  teamId,
  requestLogger
) {
  try {
    // Get alert to verify team access and gather context
    const { data: alert, error: getError } = await supabase
      .from("generated_alerts")
      .select(
        "id, user_id, rule_id, status, trigger_data, related_injury_id"
      )
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
      return createErrorResponse("Not authorized to resolve this alert", 403);
    }

    // Update alert resolution
    const { data: updated, error: updateError } = await supabase
      .from("generated_alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        acknowledged_by: userId,
        acknowledged_note: resolutionNotes || null,
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alertId)
      .select("id, status, resolved_at");

    if (updateError) {
      requestLogger.error("DB error updating alert", {
        code: updateError.code,
      });
      return createErrorResponse("Failed to resolve alert", 500);
    }

    if (!updated || updated.length === 0) {
      return createErrorResponse("Failed to resolve alert", 500);
    }

    // Clear automation flags based on alert type
    await clearAutomationFlags(supabase, alert, requestLogger);

    requestLogger.info("Alert resolved", {
      alertId,
      resolverId: userId,
    });

    return createSuccessResponse({
      success: true,
      message: "Alert resolved",
      data: {
        alertId: updated[0].id,
        status: updated[0].status,
        resolvedAt: updated[0].resolved_at,
        resolutionNotes,
      },
    });
  } catch (err) {
    requestLogger.error("Unexpected error in resolveAlert", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function clearAutomationFlags(supabase, alert, requestLogger) {
  try {
    const triggerData = alert.trigger_data || {};

    // If injury alert → ensure RTP isn't flagged as paused
    if (alert.related_injury_id) {
      await supabase
        .from("athlete_injuries")
        .update({
          rtp_paused: false,
          rtp_pause_reason: null,
        })
        .eq("id", alert.related_injury_id);
    }

    // If load alert → clear load restriction flags
    if (triggerData.acwr || triggerData.acute_load) {
      const { data: snapshot } = await supabase
        .from("acwr_snapshots")
        .select("id")
        .eq("athlete_id", alert.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (snapshot) {
        await supabase
          .from("acwr_snapshots")
          .update({
            safety_alert: false,
            load_restriction_active: false,
          })
          .eq("id", snapshot.id);
      }
    }
  } catch (err) {
    requestLogger.warn("Error clearing automation flags", {
      alertId: alert.id,
      error: err.message,
    });
    // Don't fail the resolution; just log the attempt
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-resolve",
    allowedMethods: ["PATCH"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = buildRequestLogContext(logger, event);

      const role = await getUserRole(userId);
      if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
        return createErrorResponse("Not authorized to resolve alerts", 403);
      }

      const { teamId } = await getUserTeam(userId);
      if (!teamId) {
        return createErrorResponse("User is not part of any team", 403);
      }

      // Extract alertId from path
      const pathMatch = event.path?.match(/\/alerts\/([^/?]+)\/resolve/);
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

      const { resolutionNotes } = body;

      const supabase = getSupabaseClient();
      return resolveAlert(
        supabase,
        alertId,
        userId,
        resolutionNotes,
        teamId,
        requestLogger
      );
    },
  });

export { handler };
