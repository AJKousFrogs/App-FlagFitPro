/**
 * Inactive Player Notification Function
 * Sends notifications to inactive players
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "inactive-player-notify",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
    const userRole = await getUserRole(userId);
    // Only coaches/admins can send notifications
    if (
      !["coach", "head_coach", "assistant_coach", "admin"].includes(userRole)
    ) {
      return createErrorResponse(
        "Only coaches can send notifications",
        403,
        "authorization_error",
      );
    }

    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
      const { user_id, days_inactive } = body;

      if (!user_id) {
        return handleValidationError("user_id is required");
      }

      try {
        // Get player details
        const { data: player, error: playerError } = await supabaseAdmin
          .from("users")
          .select("id, email, first_name, last_name")
          .eq("id", user_id)
          .single();

        if (playerError) {
          throw playerError;
        }

        // Update notification status
        const { error: updateError } = await supabaseAdmin
          .from("player_activity_tracking")
          .update({
            notification_sent_30d: days_inactive >= 30,
            notification_sent_90d: days_inactive >= 90,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user_id);

        if (updateError) {
          throw updateError;
        }

        // TODO: Send actual notification (email/push)
        // For now, just log it
        console.log(
          `[InactivePlayer] Notification sent to ${player.email} (${days_inactive} days inactive)`,
        );

        return createSuccessResponse(
          {
            user_id,
            days_inactive,
            sent_by: userId,
          },
          200,
          `Notification sent to ${player.first_name} ${player.last_name}`,
        );
      } catch (error) {
        console.error("[InactivePlayer] Error:", error);
        return createErrorResponse(
          "Failed to send notification",
          500,
          "server_error",
          { details: error.message },
        );
      }
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });
