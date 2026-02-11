/**
 * Account Pause Function
 * Handles account pause and resume
 */

import { baseHandler } from "./utils/base-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "account-pause",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
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

          return createSuccessResponse(
            { pause_id: data },
            200,
            "Account paused successfully",
          );
        } catch (error) {
          console.error("[AccountPause] Error:", error);
          return createErrorResponse(
            "Failed to pause account",
            500,
            "server_error",
            { details: error.message },
          );
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
            return createErrorResponse(
              "No active pause found",
              400,
              "validation_error",
            );
          }

          return createSuccessResponse({}, 200, "Account resumed successfully");
        } catch (error) {
          console.error("[AccountPause] Error:", error);
          return createErrorResponse(
            "Failed to resume account",
            500,
            "server_error",
            { details: error.message },
          );
        }
      }

      return createErrorResponse(
        "Action must be 'pause' or 'resume'",
        400,
        "validation_error",
      );
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });
