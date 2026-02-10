// Netlify Function: Notifications Count
// Returns unread notification count for the current user using Supabase authentication
//
// REFACTORED: Uses base-handler for standardized authentication and error handling

import { db } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { successObjectResponse } from "./utils/response-helper.js";

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "notifications-count",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for notification data
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
