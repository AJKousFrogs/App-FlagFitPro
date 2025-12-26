// Netlify Function: Notification Preferences
// Manages user notification preferences (mute categories, push/in-app settings)

const { db } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

exports.handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";

  return baseHandler(event, context, {
    functionName: "notifications-preferences",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      if (event.httpMethod === "GET") {
        const preferences = await db.notifications.getUserPreferences(userId);
        return createSuccessResponse(preferences, requestId);
      }

      // POST or PUT
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId
        );
      }

      const { preferences } = body;

      if (!preferences || typeof preferences !== "object") {
        return createErrorResponse(
          "preferences object is required",
          400,
          "validation_error",
          requestId
        );
      }

      const updated = await db.notifications.updateUserPreferences(
        userId,
        preferences
      );
      return createSuccessResponse(updated, requestId);
    },
  });
};
