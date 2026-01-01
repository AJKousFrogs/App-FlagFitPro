// Netlify Function: Create Notification
// Creates a notification in the database (for push notifications to sync with in-app)

const { db } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "notifications-create",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId,
        );
      }

      const { type, message, priority } = body;

      if (!type || !message) {
        return createErrorResponse(
          "type and message are required",
          400,
          "validation_error",
          requestId,
        );
      }

      // Check user preferences - don't create if muted
      const preferences = await db.notifications.getUserPreferences(userId);
      const typePrefs = preferences[type];

      if (typePrefs && typePrefs.muted) {
        // Still create in DB but don't show push notification
        const notification = await db.notifications.createNotification(userId, {
          type,
          message,
          priority: priority || "medium",
        });

        return createSuccessResponse(
          {
            ...notification,
            muted: true,
            message: "Notification created but muted per user preferences",
          },
          requestId,
        );
      }

      const notification = await db.notifications.createNotification(userId, {
        type,
        message,
        priority: priority || "medium",
      });

      return createSuccessResponse(notification, requestId);
    },
  });
};
