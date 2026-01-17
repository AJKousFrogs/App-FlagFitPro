/**
 * Inactive Player Notification Function
 * Sends notifications to inactive players
 */

const { createHandler } = require("./utils/handler-factory.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");
const { handleValidationError } = require("./utils/error-handler.cjs");

exports.handler = createHandler({
  functionName: "inactive-player-notify",
  handler: async (event, _context, { userId, userRole }) => {
    // Only coaches/admins can send notifications
    if (
      !["coach", "head_coach", "assistant_coach", "admin"].includes(userRole)
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Unauthorized",
          message: "Only coaches can send notifications",
        }),
      };
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

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: `Notification sent to ${player.first_name} ${player.last_name}`,
          }),
        };
      } catch (error) {
        console.error("[InactivePlayer] Error:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Failed to send notification",
            message: error.message,
          }),
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed",
      }),
    };
  },
});
