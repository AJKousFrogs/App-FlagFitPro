// Netlify Function: Compute ACWR
// Computes ACWR using the stored procedure
// Endpoint: /api/compute-acwr

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
 * Compute ACWR for an athlete
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

  logFunctionCall("compute-acwr", event.httpMethod);

  try {
    // Check environment variables
    checkEnvVars();

    // Only allow POST
    if (event.httpMethod !== "POST") {
      return createErrorResponse(
        405,
        "Method not allowed. Use POST to compute ACWR."
      );
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return handleValidationError("Invalid JSON in request body");
    }

    const { athleteId } = body;

    // Validate required fields
    if (!athleteId) {
      return handleValidationError("athleteId is required");
    }

    // Call the stored procedure
    const { data, error } = await supabaseAdmin.rpc("compute_acwr", {
      athlete: athleteId
    });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        500,
        `Failed to compute ACWR: ${error.message}`
      );
    }

    return createSuccessResponse({
      data: data || []
    });
  } catch (error) {
    return handleServerError(error, "compute-acwr");
  }
};

