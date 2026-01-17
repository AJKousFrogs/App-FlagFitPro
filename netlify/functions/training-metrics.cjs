// Netlify Function: Training Metrics
// Retrieves flag-football metrics for an athlete
// Endpoint: /api/training-metrics
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 98 lines to 50 lines (49% reduction)

const { supabaseAdmin } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  executeQuery,
  parseAthleteId,
  parseDateParam,
} = require("./utils/db-query-helper.cjs");
const { successResponse } = require("./utils/response-helper.cjs");

/**
 * Get training metrics for an athlete
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-metrics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for training metrics
    handler: async (event, context, { userId }) => {
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
    },
  });
};
