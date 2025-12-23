// Netlify Function: Create Notification
// Creates a notification in the database (for push notifications to sync with in-app)

const { db, checkEnvVars } = require("./supabase-client.cjs");
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

exports.handler = async (event, context) => {
  logFunctionCall("NotificationsCreate", event);

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

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { type, message, priority } = body;

      if (!type || !message) {
        return handleValidationError("type and message are required");
      }

      // Check user preferences - don't create if muted
      const preferences = await db.notifications.getUserPreferences(userId);
      const typePrefs = preferences[type];

      if (typePrefs && typePrefs.muted) {
        // Still create in DB but don't show push notification
        // This allows users to see muted notifications in history
        const notification = await db.notifications.createNotification(userId, {
          type,
          message,
          priority: priority || "medium",
        });

        return createSuccessResponse({
          ...notification,
          muted: true,
          message: "Notification created but muted per user preferences",
        });
      }

      try {
        const notification = await db.notifications.createNotification(userId, {
          type,
          message,
          priority: priority || "medium",
        });

        return createSuccessResponse(notification);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse(
          "Failed to create notification",
          500,
          "database_error",
        );
      }
    } else {
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
    }
  } catch (error) {
    console.error("Error in notifications-create function:", error);
    return handleServerError(error, "NotificationsCreate");
  }
};
