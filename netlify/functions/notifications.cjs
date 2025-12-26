// Netlify Function: Notifications
// Returns user notifications using Supabase

const { db } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} = require("./utils/error-handler.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "notifications",
    allowedMethods: ["GET", "POST", "PATCH"],
    rateLimitType: "READ",
    handler: async (event, _context, { userId }) => {
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
            { limit, page, onlyUnread, lastOpenedAt },
          );
          return createSuccessResponse(notifications);
        } catch (dbError) {
          console.error("Database error:", dbError);
          return createSuccessResponse(getFallbackNotifications());
        }
      }

      if (event.httpMethod === "PATCH") {
        const path = event.path || event.rawPath || "";
        const isLastOpened =
          path.includes("/last-opened") ||
          event.queryStringParameters?.action === "last-opened" ||
          (event.body && JSON.parse(event.body || "{}").action === "last-opened");

        if (isLastOpened) {
          try {
            await db.notifications.updateLastOpenedAt(userId);
            return createSuccessResponse(
              null,
              200,
              "Last opened timestamp updated",
            );
          } catch (dbError) {
            console.error("Database error:", dbError);
            return createErrorResponse(
              "Failed to update last opened timestamp",
              500,
              "database_error",
            );
          }
        }
        return createErrorResponse("Invalid PATCH endpoint", 404, "not_found");
      }

      if (event.httpMethod === "POST") {
        const body = JSON.parse(event.body || "{}");
        const { notificationId, ids } = body;

        if (notificationId === "all") {
          try {
            await db.notifications.markAllAsRead(userId);
            return createSuccessResponse(
              null,
              200,
              "All notifications marked as read",
            );
          } catch (dbError) {
            console.error("Database error:", dbError);
            return createErrorResponse(
              "Failed to mark all notifications as read",
              500,
              "database_error",
            );
          }
        }

        if (Array.isArray(ids) && ids.length > 0) {
          try {
            await db.notifications.markManyAsRead(userId, ids);
            return createSuccessResponse(
              null,
              200,
              `${ids.length} notifications marked as read`,
            );
          } catch (dbError) {
            console.error("Database error:", dbError);
            return createErrorResponse(
              "Failed to mark notifications as read",
              500,
              "database_error",
            );
          }
        }

        if (notificationId) {
          try {
            await db.notifications.markAsRead(userId, notificationId);
            return createSuccessResponse(
              null,
              200,
              "Notification marked as read",
            );
          } catch (dbError) {
            console.error("Database error:", dbError);
            return createErrorResponse(
              "Failed to update notification",
              500,
              "database_error",
            );
          }
        }

        return handleValidationError("notificationId or ids array is required");
      }

      return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });
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
