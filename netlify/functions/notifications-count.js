import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Notifications Count
// Returns unread notification count for the current user using Supabase authentication
//
// REFACTORED: Uses base-handler for standardized authentication and error handling

import { db } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { successObjectResponse } from "./utils/response-helper.js";

function normalizeUnreadCount(value) {
  if (!Number.isInteger(value) || value < 0) {
    return 0;
  }
  return value;
}

function normalizeLastOpenedAt(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return value;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "notifications-count",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // Explicit auth requirement for notification data
    handler: async (event, context, { userId, requestId }) => {
      try {
        // Get unread count (already filters muted types)
        const unreadCount = normalizeUnreadCount(
          await db.notifications.getUnreadCount(userId),
        );

        // Also get last opened timestamp
        const lastOpenedAt = normalizeLastOpenedAt(
          await db.notifications.getLastOpenedAt(userId),
        );

        return successObjectResponse({
          unreadCount,
          lastOpenedAt,
        });
      } catch (dbError) {
        if (dbError?.code) {
          console.error("Database error in notifications-count", { code: dbError.code });
        } else {
          console.error("Database error in notifications-count");
        }
        return createErrorResponse(
          "Failed to get notification count",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
