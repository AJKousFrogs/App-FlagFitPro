// Netlify Function: Readiness History
// Retrieves historical readiness scores for an athlete
// Endpoint: /api/readiness-history
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 97 lines to 48 lines (51% reduction)

const { supabaseAdmin } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  executeQuery,
  parseAthleteId,
  parseIntParam,
  calculateDateRange,
} = require("./utils/db-query-helper.cjs");
const { successResponse } = require("./utils/response-helper.cjs");

/**
 * Get readiness history for an athlete
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "readiness-history",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      // Parse query parameters
      // NOTE: In production, verify user has permission to view requested athleteId
      const { valid, athleteId, error } = parseAthleteId(event, userId);
      if (!valid) {
        return error;
      }

      const days = parseIntParam(event, "days", 7, 1, 365);
      const { startDate, endDate } = calculateDateRange(days, false); // Backward-looking

      // Get readiness scores
      const query = supabaseAdmin
        .from("readiness_scores")
        .select("day, score, level, suggestion, acwr")
        .eq("athlete_id", athleteId)
        .gte("day", startDate.toISOString().slice(0, 10))
        .lte("day", endDate.toISOString().slice(0, 10))
        .order("day", { ascending: false });

      const result = await executeQuery(
        query,
        "Failed to retrieve readiness history",
      );
      if (!result.success) {
        return result.error;
      }

      return successResponse(result.data);
    },
  });
};
