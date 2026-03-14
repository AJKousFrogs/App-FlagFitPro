import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Notification Preferences
// Manages user notification preferences (mute categories, push/in-app settings)

import { db } from "./supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

const VALID_NOTIFICATION_TYPES = new Set([
  "training",
  "achievement",
  "team",
  "wellness",
  "general",
  "game",
  "tournament",
  "injury_risk",
  "weather",
]);
const VALID_CONFIG_KEYS = new Set(["muted", "pushEnabled", "inAppEnabled"]);

function validatePreferencesPayload(preferences) {
  const errors = [];
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
    errors.push("preferences object is required");
    return errors;
  }

  for (const [type, config] of Object.entries(preferences)) {
    if (!VALID_NOTIFICATION_TYPES.has(type)) {
      errors.push(`Invalid notification type: ${type}`);
      continue;
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      errors.push(`preferences.${type} must be an object`);
      continue;
    }
    for (const key of Object.keys(config)) {
      if (!VALID_CONFIG_KEYS.has(key)) {
        errors.push(`preferences.${type}.${key} is not allowed`);
      }
    }
    if (config.muted !== undefined && typeof config.muted !== "boolean") {
      errors.push(`preferences.${type}.muted must be boolean`);
    }
    if (
      config.pushEnabled !== undefined &&
      typeof config.pushEnabled !== "boolean"
    ) {
      errors.push(`preferences.${type}.pushEnabled must be boolean`);
    }
    if (
      config.inAppEnabled !== undefined &&
      typeof config.inAppEnabled !== "boolean"
    ) {
      errors.push(`preferences.${type}.inAppEnabled must be boolean`);
    }
  }
  return errors;
}

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";

  return baseHandler(event, context, {
    functionName: "notifications-preferences",
    allowedMethods: ["GET", "POST", "PUT"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      if (event.httpMethod === "GET") {
        const preferences = await db.notifications.getUserPreferences(userId);
        return createSuccessResponse(preferences, requestId);
      }

      // POST or PUT
      let body;
      try {
        body = parseJsonObjectBody(event.body);
      } catch (error) {
        const isObjectError = error.message === "Request body must be an object";
        return createErrorResponse(
          isObjectError ? error.message : "Invalid JSON in request body",
          isObjectError ? 422 : 400,
          isObjectError ? "validation_error" : "invalid_json",
          requestId,
        );
      }

      const { preferences } = body;
      const errors = validatePreferencesPayload(preferences);
      if (errors.length > 0) {
        return createErrorResponse(
          errors.join("; "),
          422,
          "validation_error",
          requestId,
        );
      }

      const updated = await db.notifications.updateUserPreferences(
        userId,
        preferences,
      );
      return createSuccessResponse(updated, requestId);
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
