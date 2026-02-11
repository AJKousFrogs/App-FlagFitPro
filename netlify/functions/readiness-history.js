// Netlify Function: Readiness History
// Retrieves historical readiness scores for an athlete
// Endpoint: /api/readiness-history
//
// REFACTORED: Uses base-handler, db-query-helper, and response-helper utilities
// Reduced from 97 lines to 48 lines (51% reduction)

import { supabaseAdmin } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { executeQuery, parseAthleteId, parseIntParam, calculateDateRange } from "./utils/db-query-helper.js";
import { successResponse } from "./utils/response-helper.js";
import { canCoachViewReadiness, filterReadinessForCoach } from "./utils/consent-guard.js";
import { getUserRole } from "./utils/authorization-guard.js";

/**
 * Get readiness history for an athlete
 */
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "readiness-history",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // SECURITY: Explicit auth for readiness history
    handler: async (event, context, { userId, requestId }) => {
      try {
        // Parse query parameters
        // NOTE: In production, verify user has permission to view requested athleteId
        const { valid, athleteId, error } = parseAthleteId(event, userId);
        if (!valid) {
          return error;
        }

        const days = parseIntParam(event, "days", 7, 1, 365);
        const { startDate, endDate } = calculateDateRange(days, false); // Backward-looking

        // Check if coach requesting another athlete's data
        const role = await getUserRole(userId);
        const isCoach = ["coach", "admin"].includes(role);

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

        // Filter data for coach if consent not granted
        if (isCoach && athleteId !== userId && result.data) {
          const consentCheck = await canCoachViewReadiness(userId, athleteId);
          const filteredData = result.data.map((item) =>
            filterReadinessForCoach(
              item,
              consentCheck.allowed && consentCheck.reason === "CONSENT_GRANTED",
              consentCheck.safetyOverride,
            ),
          );
          return successResponse(filteredData);
        }

        return successResponse(result.data);
      } catch (error) {
        console.error("[readiness-history] Unexpected handler error:", error);
        return createErrorResponse(
          "Failed to retrieve readiness history",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};
