import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { db } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.notifications" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

// Netlify Function: Notifications
// Returns user notifications using Supabase

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "notifications",
    allowedMethods: ["GET", "POST", "PATCH"],
rateLimitType,
    requireAuth: true, // SECURITY: Explicit auth for notifications
    handler: async (event, _context, { userId, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      const parseStrictPositiveInt = (raw, field, { min = 1, max = Number.POSITIVE_INFINITY } = {}) => {
        if (raw === undefined || raw === null || raw === "") {
          return null;
        }
        if (!/^\d+$/.test(String(raw))) {
          throw new Error(`${field} must be a positive integer`);
        }
        const parsed = Number.parseInt(String(raw), 10);
        if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
          if (Number.isFinite(max)) {
            throw new Error(`${field} must be an integer between ${min} and ${max}`);
          }
          throw new Error(`${field} must be an integer >= ${min}`);
        }
        return parsed;
      };

      const validateNotificationId = (value, fieldName = "notificationId") => {
        if (typeof value !== "string" || value.trim().length === 0) {
          throw new Error(`${fieldName} must be a non-empty string`);
        }
        if (value.trim().length > 200) {
          throw new Error(`${fieldName} is too long`);
        }
        return value.trim();
      };

      let parsedBody = null;
      if (event.body) {
        try {
          parsedBody = parseJsonObjectBody(event.body);
        } catch (error) {
          if (
            error?.code === "INVALID_JSON_BODY" &&
            error?.message === "Invalid JSON in request body"
          ) {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
            );
          }
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
          );
        }
      }

      if (event.httpMethod === "GET") {
        let limit = 20;
        let page = 1;
        let onlyUnread = false;
        let lastOpenedAt = null;
        try {
          const parsedLimit = parseStrictPositiveInt(
            event.queryStringParameters?.limit,
            "limit",
            { min: 1, max: 100 },
          );
          const parsedPage = parseStrictPositiveInt(
            event.queryStringParameters?.page,
            "page",
            { min: 1 },
          );
          limit = parsedLimit ?? 20;
          page = parsedPage ?? 1;

          const onlyUnreadParam = event.queryStringParameters?.onlyUnread;
          if (onlyUnreadParam !== undefined) {
            if (onlyUnreadParam !== "true" && onlyUnreadParam !== "false") {
              throw new Error("onlyUnread must be true or false");
            }
            onlyUnread = onlyUnreadParam === "true";
          }

          const lastOpenedAtParam = event.queryStringParameters?.lastOpenedAt;
          if (lastOpenedAtParam) {
            const parsed = new Date(lastOpenedAtParam);
            if (Number.isNaN(parsed.getTime())) {
              throw new Error("lastOpenedAt must be a valid date");
            }
            lastOpenedAt = lastOpenedAtParam;
          }
        } catch (validationError) {
          return createErrorResponse(
            validationError.message,
            422,
            "validation_error",
          );
        }

        try {
          const notifications = await db.notifications.getUserNotifications(
            userId,
            { limit, page, onlyUnread, lastOpenedAt },
          );
          return createSuccessResponse(notifications);
          } catch (dbError) {
            requestLogger.error(
              "notifications_list_query_failed",
              dbError,
              {
                user_id: userId,
                limit,
                page,
                only_unread: onlyUnread,
              },
            );
            return createSuccessResponse([]);
          }
      }

      if (event.httpMethod === "PATCH") {
        const path = event.path || event.rawPath || "";
        const isLastOpened =
          path.includes("/last-opened") ||
          event.queryStringParameters?.action === "last-opened" ||
          parsedBody?.action === "last-opened";

        if (isLastOpened) {
          try {
            await db.notifications.updateLastOpenedAt(userId);
            return createSuccessResponse(
              null,
              200,
              "Last opened timestamp updated",
            );
          } catch (dbError) {
            requestLogger.error(
              "notifications_update_last_opened_failed",
              dbError,
              {
                user_id: userId,
              },
            );
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
        const body = parsedBody || {};
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
            requestLogger.error(
              "notifications_mark_all_failed",
              dbError,
              { user_id: userId },
            );
            return createErrorResponse(
              "Failed to mark all notifications as read",
              500,
              "database_error",
            );
          }
        }

        if (Array.isArray(ids) && ids.length > 0) {
          const normalizedIds = [];
          for (const id of ids) {
            try {
              normalizedIds.push(validateNotificationId(id, "ids[]"));
            } catch (validationError) {
              return createErrorResponse(
                validationError.message,
                422,
                "validation_error",
              );
            }
          }
          const uniqueIds = [...new Set(normalizedIds)];
          if (uniqueIds.length === 0) {
            return createErrorResponse(
              "ids must contain at least one non-empty notification id",
              422,
              "validation_error",
            );
          }
          if (uniqueIds.length > 100) {
            return createErrorResponse(
              "ids cannot contain more than 100 notification ids",
              422,
              "validation_error",
            );
          }
          try {
            await db.notifications.markManyAsRead(userId, uniqueIds);
            return createSuccessResponse(
              null,
              200,
              `${uniqueIds.length} notifications marked as read`,
            );
          } catch (dbError) {
            requestLogger.error(
              "notifications_mark_many_failed",
              dbError,
              { user_id: userId, count: uniqueIds.length },
            );
            return createErrorResponse(
              "Failed to mark notifications as read",
              500,
              "database_error",
            );
          }
        }

        if (notificationId) {
          let normalizedNotificationId;
          try {
            normalizedNotificationId = validateNotificationId(notificationId);
          } catch (validationError) {
            return createErrorResponse(
              validationError.message,
              422,
              "validation_error",
            );
          }
          try {
            await db.notifications.markAsRead(userId, normalizedNotificationId);
            return createSuccessResponse(
              null,
              200,
              "Notification marked as read",
            );
          } catch (dbError) {
            requestLogger.error(
              "notifications_mark_one_failed",
              dbError,
              {
                user_id: userId,
                notification_id: normalizedNotificationId,
              },
            );
            return createErrorResponse(
              "Failed to update notification",
              500,
              "database_error",
            );
          }
        }

        return handleValidationError("notificationId or ids array is required");
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
