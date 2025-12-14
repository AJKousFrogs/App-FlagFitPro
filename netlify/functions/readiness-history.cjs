// Netlify Function: Readiness History
// Retrieves historical readiness scores for an athlete
// Endpoint: /api/readiness-history

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

/**
 * Get readiness history for an athlete
 */
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ""
    };
  }

  logFunctionCall("readiness-history", event.httpMethod);

  try {
    checkEnvVars();

    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET to retrieve readiness history.",
        405,
        'method_not_allowed'
      );
    }

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Parse query parameters
    // If athleteId not provided, use authenticated user's ID
    // NOTE: In production, verify user has permission to view requested athleteId
    const athleteId = event.queryStringParameters?.athleteId || userId;
    const days = parseInt(event.queryStringParameters?.days || "7", 10);

    if (!athleteId) {
      return handleValidationError("athleteId query parameter is required");
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get readiness scores
    const { data, error } = await supabaseAdmin
      .from("readiness_scores")
      .select("day, score, level, suggestion, acwr")
      .eq("athlete_id", athleteId)
      .gte("day", startDate.toISOString().slice(0, 10))
      .lte("day", endDate.toISOString().slice(0, 10))
      .order("day", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to retrieve readiness history: ${error.message}`
      );
    }

    return createSuccessResponse({
      data: data || []
    });
  } catch (error) {
    return handleServerError(error, "readiness-history");
  }
};

