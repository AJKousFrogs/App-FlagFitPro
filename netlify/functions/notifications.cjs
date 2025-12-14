// Netlify Function: Notifications
// Returns user notifications using Supabase

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

    // Check environment variables first
    checkEnvVars();

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;
      } catch (jwtError) {
        // Invalid token - continue without authentication
        console.warn("Invalid token provided, returning fallback notifications");
      }
    }

    // If no user ID, return fallback notifications
    if (!userId) {
      return createSuccessResponse(getFallbackNotifications());
    }

    if (event.httpMethod === "GET") {
      // Get notifications for user with query params
      const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 20;
      const page = event.queryStringParameters?.page
        ? parseInt(event.queryStringParameters.page, 10)
        : 1;
      const onlyUnread = event.queryStringParameters?.onlyUnread === "true";
      const lastOpenedAt = event.queryStringParameters?.lastOpenedAt || null;

      try {
        const notifications = await db.notifications.getUserNotifications(
          userId,
          { limit, page, onlyUnread, lastOpenedAt }
        );
        return createSuccessResponse(notifications);
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Return fallback notifications if database query fails
        return createSuccessResponse(getFallbackNotifications());
      }
    } else if (event.httpMethod === "PATCH") {
      // Check if this is a last-opened update request
      // Handle both path-based and query-based detection
      const path = event.path || event.rawPath || '';
      const isLastOpened = path.includes('/last-opened') || 
                           event.queryStringParameters?.action === 'last-opened' ||
                           (event.body && JSON.parse(event.body || '{}').action === 'last-opened');
      
      if (isLastOpened) {
        // Update last opened timestamp
        try {
          await db.notifications.updateLastOpenedAt(userId);
          return createSuccessResponse(null, 200, "Last opened timestamp updated");
        } catch (dbError) {
          console.error("Database error:", dbError);
          return createErrorResponse("Failed to update last opened timestamp", 500, 'database_error');
        }
      } else {
        return createErrorResponse("Invalid PATCH endpoint", 404, 'not_found');
      }
    } else if (event.httpMethod === "POST") {
      // Mark notification(s) as read - supports single, bulk, or all
      const body = JSON.parse(event.body || "{}");
      const notificationId = body.notificationId;
      const ids = body.ids;

      // Handle bulk operations
      if (notificationId === "all") {
        // Mark all notifications as read
        try {
          await db.notifications.markAllAsRead(userId);
          return createSuccessResponse(null, 200, "All notifications marked as read");
        } catch (dbError) {
          console.error("Database error:", dbError);
          return createErrorResponse("Failed to mark all notifications as read", 500, 'database_error');
        }
      } else if (Array.isArray(ids) && ids.length > 0) {
        // Mark multiple notifications as read
        try {
          await db.notifications.markManyAsRead(userId, ids);
          return createSuccessResponse(null, 200, `${ids.length} notifications marked as read`);
        } catch (dbError) {
          console.error("Database error:", dbError);
          return createErrorResponse("Failed to mark notifications as read", 500, 'database_error');
        }
      } else if (notificationId) {
        // Mark single notification as read
        try {
          await db.notifications.markAsRead(userId, notificationId);
          return createSuccessResponse(null, 200, "Notification marked as read");
        } catch (dbError) {
          console.error("Database error:", dbError);
          return createErrorResponse("Failed to update notification", 500, 'database_error');
        }
      } else {
        return handleValidationError("notificationId or ids array is required");
      }
    } else {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }
  } catch (error) {
    console.error("Error in notifications function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
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
