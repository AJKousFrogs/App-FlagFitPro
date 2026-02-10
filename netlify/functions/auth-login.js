import { getSupabaseClient } from "./utils/auth-helper.js";
import { validateRequestBody } from "./validation.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Login
// Authenticates user with email and password via Supabase

export const handler = async (event, context) => {
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

      // Initialize Supabase client
      const supabase = getSupabaseClient();

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error.message);
        return createErrorResponse(
          error.message,
          401,
          "auth_failed",
          requestId,
        );
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
        requestId,
      );
    },
  });
};
