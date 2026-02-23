import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Create Notification
// Creates a notification in the database (for push notifications to sync with in-app)

import { db } from "./utils/supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

const VALID_PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const MAX_MESSAGE_LENGTH = 2000;

const handler = async (event, context) => {
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

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return createErrorResponse(
          "Request body must be an object",
          422,
          "validation_error",
          requestId,
        );
      }

      const { type, message, priority } = body;

      if (
        typeof type !== "string" ||
        type.trim().length === 0 ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        return createErrorResponse(
          "type and message are required and must be non-empty strings",
          422,
          "validation_error",
          requestId,
        );
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        return createErrorResponse(
          `message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
          422,
          "validation_error",
          requestId,
        );
      }
      if (priority !== undefined && !VALID_PRIORITIES.has(priority)) {
        return createErrorResponse(
          `priority must be one of: ${Array.from(VALID_PRIORITIES).join(", ")}`,
          422,
          "validation_error",
          requestId,
        );
      }

      try {
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
      } catch (error) {
        if (
          error.message?.includes("Invalid notification type") ||
          error.message?.includes("priority must be one of")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
