// Netlify Function: Training Metrics
// Retrieves flag-football metrics for an athlete
// Endpoint: /api/training-metrics
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 98 lines to 50 lines (49% reduction)

import { supabaseAdmin } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { executeQuery, parseAthleteId, parseDateParam } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";

/**
 * Get training metrics for an athlete
 */
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-metrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for training metrics
    handler: async (event, context, { userId, requestId }) => {
      try {
        // Parse query parameters
        const { valid, athleteId, error } = parseAthleteId(event, userId);
        if (!valid) {
          return error;
        }

        const startDate = parseDateParam(event, "startDate", null);

        // Build query
        let query = supabaseAdmin
          .from("sessions")
          .select("date, total_volume, high_speed_distance, sprint_count")
          .eq("athlete_id", athleteId)
          .order("date", { ascending: false });

        if (startDate) {
          query = query.gte("date", startDate.toISOString().slice(0, 10));
        }

        const result = await executeQuery(query, "Failed to retrieve metrics");
        if (!result.success) {
          return result.error;
        }

        return successResponse(result.data);
      } catch (error) {
        console.error("[training-metrics] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to retrieve metrics",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};
