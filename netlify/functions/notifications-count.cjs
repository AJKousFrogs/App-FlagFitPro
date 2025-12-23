// Netlify Function: Notifications Count
// Returns unread notification count for the current user using Supabase authentication
//
// REFACTORED: Uses base-handler for standardized authentication and error handling

const { db } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const { successObjectResponse } = require("./utils/response-helper.cjs");

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "notifications-count",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      try {
        // Get unread count (already filters muted types)
        const unreadCount = await db.notifications.getUnreadCount(userId);

        // Also get last opened timestamp
        const lastOpenedAt = await db.notifications.getLastOpenedAt(userId);

        return successObjectResponse({
          unreadCount,
          lastOpenedAt,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to get notification count");
      }
    },
  });
};
