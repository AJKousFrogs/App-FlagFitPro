// Netlify Function: Fixtures
// Retrieves upcoming game fixtures for an athlete
// Endpoint: /api/fixtures
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 94 lines to 45 lines (52% reduction)

import { supabaseAdmin } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { executeQuery, parseAthleteId, parseIntParam, calculateDateRange } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";

/**
 * Get upcoming fixtures for an athlete
 */
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "fixtures",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for user fixture data
    handler: async (event, context, { userId, requestId }) => {
      try {
        // Parse query parameters
        const { valid, athleteId, error } = parseAthleteId(event, userId);
        if (!valid) {
          return error;
        }

        const days = parseIntParam(event, "days", 14, 1, 365);
        const { endDate } = calculateDateRange(days, true); // Forward-looking

        // Get fixtures (either athlete-specific or team-based)
        const query = supabaseAdmin
          .from("fixtures")
          .select("*")
          .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
          .gte("game_start", new Date().toISOString())
          .lte("game_start", endDate.toISOString())
          .order("game_start", { ascending: true });

        const result = await executeQuery(query, "Failed to retrieve fixtures");
        if (!result.success) {
          return result.error;
        }

        return successResponse(result.data);
      } catch (error) {
        console.error("[fixtures] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to retrieve fixtures",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};
