// Netlify Function: Login
// Authenticates user with email and password via Supabase

const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { applyCSRFProtection } = require("./utils/csrf-protection.cjs");
const { validateRequestBody } = require("./validation.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");

exports.handler = async (event, _context) => {
  // Log function call
  logFunctionCall("Auth-Login", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  // SECURITY: Apply rate limiting - 10 login attempts per 15 minutes
  const rateLimitError = applyRateLimit(event, 10, 900000);
  if (rateLimitError) {
    rateLimitError.headers = { ...rateLimitError.headers, ...CORS_HEADERS };
    return rateLimitError;
  }

  // SECURITY: Apply CSRF protection
  const csrfError = applyCSRFProtection(event);
  if (csrfError) {
    csrfError.headers = { ...csrfError.headers, ...CORS_HEADERS };
    return csrfError;
  }

  try {
    // SECURITY: Validate request body
    const validation = validateRequestBody(event.body, "login");
    if (!validation.valid) {
      return validation.response;
    }

    const { email, password } = validation.data;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check for demo token in development
    if (
      process.env.NODE_ENV === "development" &&
      normalizedEmail === "demo@flagfit.pro" &&
      password === "demo-token"
    ) {
      return createSuccessResponse({
        user: {
          id: "demo-user-id",
          email: "demo@flagfit.pro",
          role: "player",
          name: "Demo User",
        },
        session: {
          access_token: "demo-token",
          expires_in: 3600,
        },
      });
    }

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error.message);
      return createErrorResponse(error.message, 401, "auth_failed");
    }

    // Return success response with user and session data
    return createSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || "player",
        name: data.user.user_metadata?.name || data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch (error) {
    console.error("Error in auth-login function:", error);
    return handleServerError(error, "Auth-Login");
  }
};
