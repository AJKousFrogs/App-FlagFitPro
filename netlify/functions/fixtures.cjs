// Netlify Function: Fixtures
// Retrieves upcoming game fixtures for an athlete
// Endpoint: /api/fixtures

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
 * Get upcoming fixtures for an athlete
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

  logFunctionCall("fixtures", event.httpMethod);

  try {
    checkEnvVars();

    if (event.httpMethod !== "GET") {
      return createErrorResponse(
        "Method not allowed. Use GET to retrieve fixtures.",
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
    const days = parseInt(event.queryStringParameters?.days || "14", 10);

    if (!athleteId) {
      return handleValidationError("athleteId query parameter is required");
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Get fixtures (either athlete-specific or team-based)
    const { data, error } = await supabaseAdmin
      .from("fixtures")
      .select("*")
      .or(`athlete_id.eq.${athleteId},athlete_id.is.null`)
      .gte("game_start", new Date().toISOString())
      .lte("game_start", endDate.toISOString())
      .order("game_start", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to retrieve fixtures: ${error.message}`
      );
    }

    return createSuccessResponse({
      data: data || []
    });
  } catch (error) {
    return handleServerError(error, "fixtures");
  }
};

