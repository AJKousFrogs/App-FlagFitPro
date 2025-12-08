// Netlify Function: Fixtures
// Retrieves upcoming game fixtures for an athlete
// Endpoint: /api/fixtures

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  validateJWT,
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

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
        405,
        "Method not allowed. Use GET to retrieve fixtures."
      );
    }

    // Parse query parameters
    const athleteId = event.queryStringParameters?.athleteId;
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

