import { getSupabaseClient } from "./utils/auth-helper.js";
import { validateRequestBody } from "./validation.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.auth-login" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

// Netlify Function: Login
// Authenticates user with email and password via Supabase

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "auth-login",
    allowedMethods: ["POST"],
    rateLimitType: "AUTH",
    requireAuth: false, // Login doesn't require prior auth
    handler: async (event, _context, { requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, { requestId, correlationId });
      // Validate request body
      const validation = validateRequestBody(event.body, "login");
      if (!validation.valid) {
        return validation.response;
      }

      const { email, password } = validation.data;

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Initialize Supabase client
      let supabase;
      try {
        supabase = getSupabaseClient();
      } catch (error) {
        return createErrorResponse(
          error.message || "Authentication service is unavailable",
          503,
          "service_unavailable",
          requestId,
        );
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        requestLogger.error("supabase_login_failed", error, {
          email: normalizedEmail,
        });
        return createErrorResponse(
          error.message,
          401,
          "auth_failed",
          requestId,
        );
      }

      if (!data?.user || !data?.session) {
        return createErrorResponse(
          "Login service returned an invalid response",
          502,
          "auth_response_invalid",
          {
            requestId,
            details: [
              `hasUser=${Boolean(data?.user)}`,
              `hasSession=${Boolean(data?.session)}`,
            ],
          },
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

export const testHandler = handler;
export { handler };
