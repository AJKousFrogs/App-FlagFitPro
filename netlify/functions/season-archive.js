import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

/**
 * Season Archive Function
 * Archives season data and generates summary reports
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse, createSuccessResponse, handleValidationError } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { hasAnyRole, COACH_ROUTE_ROLES } from "./utils/role-sets.js";

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

      const parsedBody = tryParseJsonObjectBody(event.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      const body = parsedBody.data;
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
