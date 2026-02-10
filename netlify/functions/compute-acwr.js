// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

import { supabaseAdmin } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

/**
 * Compute ACWR for an athlete
 */
export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "compute-acwr",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId,
        );
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId } = body;

      if (!athleteId) {
        return createErrorResponse(
          "athleteId is required",
          400,
          "validation_error",
          requestId,
        );
      }

      // Call the stored procedure
      const { data, error } = await supabaseAdmin.rpc("compute_acwr", {
        athlete: athleteId,
      });

      if (error) {
        console.error("Database error:", error);
        return createErrorResponse(
          `Failed to compute ACWR: ${error.message}`,
          500,
          "database_error",
          requestId,
        );
      }

      return createSuccessResponse({ data: data || [] }, requestId);
    },
  });
};
