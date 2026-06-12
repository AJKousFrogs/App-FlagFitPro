
/**
 * Season Archive Function
 * Archives season data and generates summary reports
 */

import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createErrorResponse, createSuccessResponse, handleValidationError } from "./utils/error-handler.js";
import { tryParseJsonObjectBody, isUuid } from "./utils/input-validator.js";
import { hasAnyRole, COACH_ROUTE_ROLES } from "./utils/role-sets.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.season-archive" });

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
        logger.error("season_archive_failed", error, {});
        return createErrorResponse("Failed to archive season", 500, "server_error");
      }
    },
  });

export const testHandler = handler;
export { handler };
