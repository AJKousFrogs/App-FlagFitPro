// Netlify Function: Create Notification
// Creates a notification in the database (for push notifications to sync with in-app)

const jwt = require("jsonwebtoken");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

exports.handler = async (event, context) => {
  logFunctionCall('NotificationsCreate', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    checkEnvVars();
    const JWT_SECRET = getJWTSecret();

    // Get authorization header
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse("Authentication required", 401, 'unauthorized');
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    let decoded;
    let userId = null;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (jwtError) {
      return createErrorResponse("Invalid or expired token", 401, 'unauthorized');
    }

    if (!userId) {
      return createErrorResponse("User ID not found in token", 401, 'unauthorized');
    }

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
          priority: priority || 'medium'
        });
        
        return createSuccessResponse({
          ...notification,
          muted: true,
          message: "Notification created but muted per user preferences"
        });
      }

      try {
        const notification = await db.notifications.createNotification(userId, {
          type,
          message,
          priority: priority || 'medium'
        });

        return createSuccessResponse(notification);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse("Failed to create notification", 500, 'database_error');
      }
    } else {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }
  } catch (error) {
    console.error("Error in notifications-create function:", error);
    return handleServerError(error, 'NotificationsCreate');
  }
};

