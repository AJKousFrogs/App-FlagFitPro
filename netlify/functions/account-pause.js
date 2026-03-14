import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

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
import { parseJsonObjectBody } from "./utils/input-validator.js";

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "account-pause",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
    if (event.httpMethod === "POST") {
      let body = {};
      try {
        body = parseJsonObjectBody(event.body);
      } catch (error) {
        return handleValidationError(
          error.message === "Request body must be an object"
            ? error.message
            : "Invalid JSON in request body",
        );
      }
      const { action, paused_until, reason } = body;

      if (typeof action !== "string" || !action.trim()) {
        return handleValidationError("action is required");
      }
      if (!["pause", "resume"].includes(action)) {
        return handleValidationError("action must be 'pause' or 'resume'");
      }
      if (reason !== undefined && reason !== null) {
        if (typeof reason !== "string" || reason.trim().length > 1000) {
          return handleValidationError(
            "reason must be a string up to 1000 characters",
          );
        }
      }
      if (paused_until !== undefined && paused_until !== null) {
        if (typeof paused_until !== "string") {
          return handleValidationError("paused_until must be an ISO date string");
        }
        const parsed = new Date(paused_until);
        if (Number.isNaN(parsed.getTime())) {
          return handleValidationError("paused_until must be a valid date");
        }
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
          );
        }
      }
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
