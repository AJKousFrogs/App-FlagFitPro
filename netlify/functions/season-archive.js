import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

/**
 * Season Archive Function
 * Archives season data and generates summary reports
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse, createSuccessResponse, handleValidationError } from "./utils/error-handler.js";
import { hasAnyRole, COACH_ROUTE_ROLES } from "./utils/role-sets.js";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "season-archive",
    allowedMethods: ["POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (event, context, { userId }) => {
      const userRole = await getUserRole(userId);

      // Only coaches/admins can archive seasons
      if (!hasAnyRole(userRole, COACH_ROUTE_ROLES)) {
        return createErrorResponse(
          "Only authorized team staff can archive seasons",
          403,
          "authorization_error",
        );
      }

      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
      if (!isPlainObject(body)) {
        return handleValidationError("Request body must be an object");
      }
      const { season_id } = body;

      if (!isUuid(season_id)) {
        return handleValidationError("season_id must be a valid UUID");
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
        return createErrorResponse("Failed to archive season", 500, "server_error");
      }
    },
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
