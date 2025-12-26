// Netlify Function: Login
// Authenticates user with email and password via Supabase

const { getSupabaseClient } = require("./utils/auth-helper.cjs");
const { validateRequestBody } = require("./validation.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-login",
    allowedMethods: ["POST"],
    rateLimitType: "AUTH",
    requireAuth: false, // Login doesn't require prior auth
    handler: async (event, _context, { requestId }) => {
      // Validate request body
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
        return createSuccessResponse(
          {
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
          },
          requestId
        );
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
        return createErrorResponse(error.message, 401, "auth_failed", requestId);
      }

      // Return success response with user and session data
      return createSuccessResponse(
        {
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
        },
        requestId
      );
    },
  });
};
