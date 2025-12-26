// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

/**
 * Compute ACWR for an athlete
 */
exports.handler = async (event, _context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  logFunctionCall("compute-acwr", event.httpMethod);

  try {
    // Check environment variables
    checkEnvVars();

    // Only allow POST
    if (event.httpMethod !== "POST") {
      return createErrorResponse(
        "Method not allowed. Use POST to compute ACWR.",
        405,
        "method_not_allowed",
      );
    }

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "CREATE");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (_e) {
      return handleValidationError("Invalid JSON in request body");
    }

    // If athleteId not provided, use authenticated user's ID
    const { athleteId = userId } = body;

    // Validate required fields
    if (!athleteId) {
      return handleValidationError("athleteId is required");
    }

    // Call the stored procedure
    const { data, error } = await supabaseAdmin.rpc("compute_acwr", {
      athlete: athleteId,
    });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to compute ACWR: ${error.message}`,
      );
    }

    return createSuccessResponse({
      data: data || [],
    });
  } catch (error) {
    return handleServerError(error, "compute-acwr");
  }
};
