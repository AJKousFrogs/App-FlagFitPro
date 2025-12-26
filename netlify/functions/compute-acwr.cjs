// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

/**
 * Compute ACWR for an athlete
 */
exports.handler = async (event, context) => {
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
          requestId
        );
      }

      // If athleteId not provided, use authenticated user's ID
      const { athleteId = userId } = body;

      if (!athleteId) {
        return createErrorResponse(
          "athleteId is required",
          400,
          "validation_error",
          requestId
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
          requestId
        );
      }

      return createSuccessResponse({ data: data || [] }, requestId);
    },
  });
};
