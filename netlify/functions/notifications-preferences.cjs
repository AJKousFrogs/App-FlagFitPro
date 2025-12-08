// Netlify Function: Notification Preferences
// Manages user notification preferences (mute categories, push/in-app settings)

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

