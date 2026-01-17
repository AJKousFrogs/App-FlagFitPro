/**
 * Account Pause Function
 * Handles account pause and resume
 */

const { createHandler } = require("./utils/handler-factory.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");
const { handleValidationError } = require("./utils/error-handler.cjs");

exports.handler = createHandler({
  functionName: "account-pause",
  handler: async (event, _context, { userId }) => {
    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
      const { action, paused_until, reason } = body;

      if (!action) {
        return handleValidationError("action is required");
      }

      if (action === "pause") {
        try {
          // Pause account using database function
          const { data, error } = await supabaseAdmin.rpc("pause_account", {
            p_user_id: userId,
            p_paused_until: paused_until || null,
            p_reason: reason || null,
          });

          if (error) {
            throw error;
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              pause_id: data,
              message: "Account paused successfully",
            }),
          };
        } catch (error) {
          console.error("[AccountPause] Error:", error);
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: "Failed to pause account",
              message: error.message,
            }),
          };
        }
      } else if (action === "resume") {
        try {
          // Resume account using database function
          const { data, error } = await supabaseAdmin.rpc("resume_account", {
            p_user_id: userId,
          });

          if (error) {
            throw error;
          }

          if (!data) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: "No active pause found",
              }),
            };
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              message: "Account resumed successfully",
            }),
          };
        } catch (error) {
          console.error("[AccountPause] Error:", error);
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: "Failed to resume account",
              message: error.message,
            }),
          };
        }
      }

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid action",
          message: "Action must be 'pause' or 'resume'",
        }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed",
      }),
    };
  },
});
