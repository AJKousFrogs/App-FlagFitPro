// Netlify Function: Get Current User
// Returns current user information from Supabase JWT token

const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");

exports.handler = async (event, _context) => {
  // Log function call
  logFunctionCall("Auth-Me", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  try {
    // Get authorization header
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse(
        "Authentication required",
        401,
        "unauthorized",
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Verify token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Supabase auth error:", authError);
      return createErrorResponse(
        "Invalid or expired token",
        401,
        "unauthorized",
      );
    }

    // Return user data from Supabase
    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "player",
      name: user.user_metadata?.name || user.email,
      email_verified: user.email_confirmed_at !== null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      user_metadata: user.user_metadata,
    };

    return createSuccessResponse({ user: safeUser });
  } catch (error) {
    console.error("Error in auth-me function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, "Auth-Me");
  }
};
