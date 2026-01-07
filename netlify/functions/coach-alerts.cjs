/**
 * Coach Alerts API
 *
 * Endpoints:
 * - POST /api/coach-alerts/:alertId/acknowledge - Acknowledge a coach alert
 *
 * Contract Compliance:
 * - Authorization & Guardrails Contract v1
 * - Coach Authority & Visibility Contract v1
 * - Backend Truthfulness Contract
 */

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

/**
 * Acknowledge a coach alert
 * 
 * Rules:
 * - Must enforce role/ownership (athlete can acknowledge only their own alert)
 * - Must be idempotent (2nd call returns success without duplicating)
 * - Must log audit event (who, when, alertId, sessionDate)
 * - Must update any "ack_required" gate so TODAY unlocks immediately after success
 * - Must never silently fail (return {success:false, error, code})
 */
async function acknowledgeCoachAlert(supabase, userId, alertId, sessionDate) {
  // Step 1: Verify alert exists and belongs to this athlete
  // For now, we'll check daily_protocols table for coach alerts
  // In the future, this might be a separate coach_alerts table
  
  const { data: protocol, error: protocolError } = await supabaseAdmin
    .from("daily_protocols")
    .select("id, user_id, protocol_date, coach_alert_active, coach_alert_requires_acknowledgment, coach_acknowledged")
    .eq("id", alertId)
    .eq("user_id", userId)
    .single();

  if (protocolError || !protocol) {
    return {
      success: false,
      error: "Coach alert not found or access denied",
      code: "ALERT_NOT_FOUND",
    };
  }

  // Step 2: Check if alert is active and requires acknowledgment
  if (!protocol.coach_alert_active) {
    return {
      success: false,
      error: "Coach alert is not active",
      code: "ALERT_NOT_ACTIVE",
    };
  }

  if (!protocol.coach_alert_requires_acknowledgment) {
    return {
      success: false,
      error: "This alert does not require acknowledgment",
      code: "ACK_NOT_REQUIRED",
    };
  }

  // Step 3: Check if already acknowledged (idempotent)
  if (protocol.coach_acknowledged) {
    // Already acknowledged - return success (idempotent)
    return {
      success: true,
      data: {
        alertId: alertId,
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
        message: "Alert already acknowledged",
      },
    };
  }

  // Step 4: Update protocol to mark as acknowledged
  const { data: updatedProtocol, error: updateError } = await supabaseAdmin
    .from("daily_protocols")
    .update({
      coach_acknowledged: true,
      coach_acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("[coach-alerts] Error updating acknowledgment:", updateError);
    return {
      success: false,
      error: "Failed to acknowledge alert",
      code: "UPDATE_FAILED",
    };
  }

  // Step 5: Log audit event
  // Create audit log entry in a coach_alert_acknowledgments table or audit_log table
  // For now, we'll use a simple approach - in production, use proper audit table
  try {
    // Check if audit table exists, if not, we'll log to console
    const { error: auditError } = await supabaseAdmin
      .from("coach_alert_acknowledgments")
      .insert({
        protocol_id: alertId,
        user_id: userId,
        protocol_date: protocol.protocol_date || sessionDate,
        acknowledged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (auditError) {
      // Table might not exist - log to console for now
      console.log("[coach-alerts] Audit log (table may not exist):", {
        protocol_id: alertId,
        user_id: userId,
        protocol_date: protocol.protocol_date || sessionDate,
        acknowledged_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Audit logging failed - log to console
    console.log("[coach-alerts] Audit log (fallback):", {
      protocol_id: alertId,
      user_id: userId,
      protocol_date: protocol.protocol_date || sessionDate,
      acknowledged_at: new Date().toISOString(),
    });
  }

  return {
    success: true,
    data: {
      alertId: alertId,
      acknowledged: true,
      acknowledgedAt: updatedProtocol.coach_acknowledged_at || new Date().toISOString(),
      message: "Alert acknowledged successfully",
    },
  };
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "coach-alerts",
    allowedMethods: ["POST", "OPTIONS"],
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/\.netlify\/functions\/coach-alerts\/?/, "")
        .replace(/^\/api\/coach-alerts\/?/, "");

      const method = event.httpMethod;
      const body = event.body ? JSON.parse(event.body) : {};

      try {
        // POST /api/coach-alerts/:alertId/acknowledge
        const acknowledgeMatch = path.match(/^([^/]+)\/acknowledge$/);
        if (method === "POST" && acknowledgeMatch) {
          const alertId = acknowledgeMatch[1];
          const sessionDate = body.sessionDate || new Date().toISOString().split("T")[0];

          // Verify user is athlete (not coach trying to acknowledge for athlete)
          // This is enforced by checking user_id matches in acknowledgeCoachAlert

          const result = await acknowledgeCoachAlert(
            supabaseAdmin,
            userId,
            alertId,
            sessionDate
          );

          if (!result.success) {
            return createErrorResponse(
              result.error || "Failed to acknowledge alert",
              400,
              result.code || "ACKNOWLEDGE_FAILED"
            );
          }

          return createSuccessResponse(result.data);
        }

        return createErrorResponse("Endpoint not found", 404, "NOT_FOUND");
      } catch (error) {
        console.error("[coach-alerts] Error:", error);
        return createErrorResponse(
          error.message || "Internal server error",
          500,
          "SERVER_ERROR"
        );
      }
    },
  });
};

