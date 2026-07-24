import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.alert-preferences" });

const ALERT_TYPES = ["critical", "high", "medium", "low"];
const VALID_CHANNELS = ["in_app", "push", "email", "sms"];

const DEFAULTS = {
  critical: { enabled: true, channels: ["in_app", "push"] },
  high: { enabled: true, channels: ["in_app"] },
  medium: { enabled: true, channels: ["in_app"] },
  low: { enabled: false, channels: [] },
};

/**
 * User Alert Preferences Endpoint
 * - GET /api/alert-preferences: Fetch the caller's preferences (one row per alert_type)
 * - PATCH /api/alert-preferences: Upsert the caller's preferences
 *
 * Self-service only -- a user can only read/write their own preferences.
 * user_id is always taken from the authenticated caller, never from the body.
 */

async function getPreferences(supabase, userId, requestLogger) {
  const { data, error } = await supabase
    .from("alert_preferences")
    .select(
      "id, user_id, alert_type, enabled, channels, quiet_hours_start, quiet_hours_end, timezone"
    )
    .eq("user_id", userId);

  if (error) {
    requestLogger.error("DB error fetching alert preferences", {
      code: error.code,
    });
    return createErrorResponse("Failed to fetch alert preferences", 500);
  }

  const byType = new Map((data || []).map((row) => [row.alert_type, row]));
  const merged = ALERT_TYPES.map(
    (alertType) =>
      byType.get(alertType) || {
        user_id: userId,
        alert_type: alertType,
        enabled: DEFAULTS[alertType].enabled,
        channels: DEFAULTS[alertType].channels,
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: "UTC",
      }
  );

  return createSuccessResponse(merged);
}

function validatePreference(pref) {
  if (!ALERT_TYPES.includes(pref.alert_type)) {
    return `Invalid alert_type: ${pref.alert_type}`;
  }
  if (pref.channels !== undefined) {
    if (!Array.isArray(pref.channels)) {
      return "channels must be an array";
    }
    for (const channel of pref.channels) {
      if (!VALID_CHANNELS.includes(channel)) {
        return `Invalid channel: ${channel}`;
      }
    }
  }
  return null;
}

async function savePreferences(supabase, userId, preferences, requestLogger) {
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return handleValidationError("preferences must be a non-empty array");
  }

  for (const pref of preferences) {
    const validationError = validatePreference(pref);
    if (validationError) {
      return handleValidationError(validationError);
    }
  }

  const rows = preferences.map((pref) => ({
    user_id: userId,
    alert_type: pref.alert_type,
    enabled: pref.enabled ?? true,
    channels: pref.channels ?? ["in_app"],
    quiet_hours_start: pref.quiet_hours_start || null,
    quiet_hours_end: pref.quiet_hours_end || null,
    timezone: pref.timezone || "UTC",
  }));

  const { data, error } = await supabase
    .from("alert_preferences")
    .upsert(rows, { onConflict: "user_id,alert_type" })
    .select(
      "id, user_id, alert_type, enabled, channels, quiet_hours_start, quiet_hours_end, timezone"
    );

  if (error) {
    requestLogger.error("DB error saving alert preferences", {
      code: error.code,
    });
    return createErrorResponse("Failed to save alert preferences", 500);
  }

  return createSuccessResponse(data);
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "alert-preferences",
    allowedMethods: ["GET", "PATCH"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "UPDATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));
      const supabase = getSupabaseClient();

      if (event.httpMethod === "GET") {
        return getPreferences(supabase, userId, requestLogger);
      }

      // PATCH
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse("Invalid JSON body", 400);
      }

      return savePreferences(
        supabase,
        userId,
        body.preferences,
        requestLogger
      );
    },
  });

export { handler };
