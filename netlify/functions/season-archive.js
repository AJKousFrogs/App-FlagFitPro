/**
 * Season Archive Function
 * Archives season data and generates summary reports
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { getSupabaseClient, supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse, createSuccessResponse, handleValidationError } from "./utils/error-handler.js";

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "season-archive",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, context, { userId }) => {
    const supabase = getSupabaseClient();
    const userRole = await getUserRole(userId);

    // Only coaches/admins can archive seasons
    if (
      !["coach", "head_coach", "assistant_coach", "admin"].includes(userRole)
    ) {
      return createErrorResponse(
        "Only coaches can archive seasons",
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
      const { season_id } = body;

      if (!season_id) {
        return handleValidationError("season_id is required");
      }

      try {
        // Archive season data using database function
        const { data: _data, error } = await supabaseAdmin.rpc(
          "archive_season_data",
          {
            p_season_id: season_id,
          },
        );

        if (error) {
          throw error;
        }

        return createSuccessResponse({}, 200, "Season data archived successfully");
      } catch (error) {
        console.error("[SeasonArchive] Error:", error);
        return createErrorResponse("Failed to archive season", 500, "server_error", {
          details: error.message,
        });
      }
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });
