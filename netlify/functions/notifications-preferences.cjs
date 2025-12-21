// Netlify Function: Notification Preferences
// Manages user notification preferences (mute categories, push/in-app settings)

const { db, checkEnvVars } = require("./supabase-client.cjs");
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

exports.handler = async (event, context) => {
  logFunctionCall('NotificationsPreferences', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    checkEnvVars();

    // SECURITY: Apply rate limiting
    const rateLimitType = event.httpMethod === "GET" ? "READ" : "CREATE";
    const rateLimitResponse = applyRateLimit(event, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    if (event.httpMethod === "GET") {
      try {
        const preferences = await db.notifications.getUserPreferences(userId);
        return createSuccessResponse(preferences);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse("Failed to get preferences", 500, 'database_error');
      }
    } else if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");
      const { preferences } = body;

      if (!preferences || typeof preferences !== 'object') {
        return handleValidationError("preferences object is required");
      }

      try {
        const updated = await db.notifications.updateUserPreferences(userId, preferences);
        return createSuccessResponse(updated);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse("Failed to update preferences", 500, 'database_error');
      }
    } else {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }
  } catch (error) {
    console.error("Error in notifications-preferences function:", error);
    return handleServerError(error, 'NotificationsPreferences');
  }
};

