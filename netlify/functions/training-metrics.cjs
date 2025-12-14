// Netlify Function: Training Metrics
// Retrieves flag-football metrics for an athlete
// Endpoint: /api/training-metrics

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
 * Get training metrics for an athlete
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

  logFunctionCall("training-metrics", event.httpMethod);

  try {
    // Check environment variables
    checkEnvVars();

    // Only allow GET
    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET to retrieve metrics.",
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
    const athleteId = event.queryStringParameters?.athleteId || userId;
    const startDate = event.queryStringParameters?.startDate;

    // Validate required fields
    if (!athleteId) {
      return handleValidationError("athleteId query parameter is required");
    }

    // Build query
    let query = supabaseAdmin
      .from("sessions")
      .select("date, total_volume, high_speed_distance, sprint_count")
      .eq("athlete_id", athleteId)
      .order("date", { ascending: false });

    if (startDate) {
      query = query.gte("date", startDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to retrieve metrics: ${error.message}`
      );
    }

    return createSuccessResponse({
      data: data || []
    });
  } catch (error) {
    return handleServerError(error, "training-metrics");
  }
};

