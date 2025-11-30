// Netlify Function: Notifications
// Returns user notifications using Supabase

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

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is not set!");
  throw new Error("JWT_SECRET environment variable is required for security");
}

exports.handler = async (event, context) => {
  logFunctionCall('Notifications', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Get authorization header
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    let userId = null;

    // Handle authentication - allow unauthenticated requests for notifications
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract and verify token
      const token = authHeader.substring(7);
      let decoded;

      try {
        decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtError) {
        // Invalid token - continue without authentication
        console.warn("Invalid token provided, returning fallback notifications");
      }
    }

    // Check environment variables
    checkEnvVars();

    // If no user ID, return fallback notifications
    if (!userId) {
      return createSuccessResponse(getFallbackNotifications());
    }

    if (event.httpMethod === "GET") {
      // Get notifications for user
      const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 20;

      try {
        const notifications = await db.notifications.getUserNotifications(
          userId,
          limit,
        );
        return createSuccessResponse(notifications);
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Return fallback notifications if database query fails
        return createSuccessResponse(getFallbackNotifications());
      }
    } else if (event.httpMethod === "POST") {
      // Mark notification as read
      const body = JSON.parse(event.body || "{}");
      const notificationId = body.notificationId;

      if (!notificationId) {
        return handleValidationError("notificationId is required");
      }

      try {
        await db.notifications.markAsRead(userId, notificationId);
        return createSuccessResponse(null, 200, "Notification marked as read");
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse("Failed to update notification", 500, 'database_error');
      }
    } else {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }
  } catch (error) {
    return handleServerError(error, 'Notifications');
  }
};

// Fallback notifications if database is unavailable
function getFallbackNotifications() {
  return [
    {
      id: 1,
      type: "training",
      title: "Training Session Reminder",
      message: "Speed & Agility training starts in 30 minutes",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "achievement",
      title: "New Achievement Unlocked",
      message: "You've completed 10 training sessions this month!",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "team",
      title: "Team Update",
      message: "New team member joined: Alex Johnson",
      time: "2 hours ago",
      read: false,
    },
  ];
}
