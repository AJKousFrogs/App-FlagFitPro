import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./utils/supabase-client.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Push Notifications API
// Handles push notification registration, preferences, and sending
//
// Implements Web Push Protocol (RFC 8030) with VAPID authentication
// https://datatracker.ietf.org/doc/html/rfc8030

// Web Push library for sending notifications (optional dep)
let webpush = null;
try {
  const wp = await import("web-push");
  webpush = wp.default;
} catch {
  // web-push not installed, will use fallback
}

// Initialize VAPID keys if available
function initializeWebPush() {
  if (!webpush) {
    return { initialized: false, reason: "web-push library not installed" };
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT || "mailto:notifications@flagfitpro.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      initialized: false,
      reason:
        "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.",
      generateKeys: "Run: npx web-push generate-vapid-keys",
    };
  }

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    return { initialized: true };
  } catch (error) {
    return { initialized: false, reason: error.message };
  }
}

// Get VAPID public key for client subscription
function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

const ALLOWED_DEVICE_TYPES = new Set(["web", "ios", "android"]);
const ALLOWED_PREFERENCE_KEYS = new Set(["push_enabled", "categories", "quiet_hours"]);
const ALLOWED_CATEGORY_KEYS = new Set([
  "team_announcements",
  "game_reminders",
  "practice_reminders",
  "stats_updates",
  "training_reminders",
  "chat_mentions",
  "coach_feedback",
]);
const ALLOWED_SENDER_ROLES = new Set(["coach", "assistant_coach", "admin", "staff"]);
const QUIET_HOURS_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateRegisterPayload(tokenData) {
  const errors = [];
  if (!tokenData || typeof tokenData !== "object" || Array.isArray(tokenData)) {
    return ["Request body must be an object"];
  }

  const { token, device_type, device_name, subscription } = tokenData;
  const hasToken = typeof token === "string" && token.trim().length > 0;
  const hasSubscription =
    subscription &&
    typeof subscription === "object" &&
    !Array.isArray(subscription) &&
    typeof subscription.endpoint === "string" &&
    subscription.endpoint.trim().length > 0;

  if (!hasToken && !hasSubscription) {
    errors.push("token or subscription.endpoint is required");
  }

  if (token !== undefined && (typeof token !== "string" || token.trim().length === 0)) {
    errors.push("token must be a non-empty string when provided");
  }

  if (device_type !== undefined && !ALLOWED_DEVICE_TYPES.has(device_type)) {
    errors.push("device_type must be one of: web, ios, android");
  }

  if (
    device_name !== undefined &&
    (typeof device_name !== "string" || device_name.trim().length === 0)
  ) {
    errors.push("device_name must be a non-empty string when provided");
  }

  if (subscription !== undefined) {
    if (!subscription || typeof subscription !== "object" || Array.isArray(subscription)) {
      errors.push("subscription must be an object");
    } else {
      if (typeof subscription.endpoint !== "string" || subscription.endpoint.trim().length === 0) {
        errors.push("subscription.endpoint is required");
      }
      if (!subscription.keys || typeof subscription.keys !== "object") {
        errors.push("subscription.keys is required");
      } else {
        if (typeof subscription.keys.p256dh !== "string" || subscription.keys.p256dh.trim().length === 0) {
          errors.push("subscription.keys.p256dh is required");
        }
        if (typeof subscription.keys.auth !== "string" || subscription.keys.auth.trim().length === 0) {
          errors.push("subscription.keys.auth is required");
        }
      }
    }
  }

  return errors;
}

function validatePreferencesPayload(preferences) {
  const errors = [];
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
    return ["preferences must be an object"];
  }

  for (const key of Object.keys(preferences)) {
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) {
      errors.push(`Unknown preference field: ${key}`);
    }
  }

  if (
    preferences.push_enabled !== undefined &&
    typeof preferences.push_enabled !== "boolean"
  ) {
    errors.push("push_enabled must be a boolean");
  }

  if (preferences.categories !== undefined) {
    if (
      !preferences.categories ||
      typeof preferences.categories !== "object" ||
      Array.isArray(preferences.categories)
    ) {
      errors.push("categories must be an object");
    } else {
      for (const [category, enabled] of Object.entries(preferences.categories)) {
        if (!ALLOWED_CATEGORY_KEYS.has(category)) {
          errors.push(`Unknown category: ${category}`);
          continue;
        }
        if (typeof enabled !== "boolean") {
          errors.push(`categories.${category} must be a boolean`);
        }
      }
    }
  }

  if (preferences.quiet_hours !== undefined && preferences.quiet_hours !== null) {
    if (
      typeof preferences.quiet_hours !== "object" ||
      Array.isArray(preferences.quiet_hours)
    ) {
      errors.push("quiet_hours must be an object or null");
    } else {
      const { start, end, timezone } = preferences.quiet_hours;
      if (typeof start !== "string" || !QUIET_HOURS_REGEX.test(start)) {
        errors.push("quiet_hours.start must use HH:MM 24-hour format");
      }
      if (typeof end !== "string" || !QUIET_HOURS_REGEX.test(end)) {
        errors.push("quiet_hours.end must use HH:MM 24-hour format");
      }
      if (timezone !== undefined && (typeof timezone !== "string" || timezone.trim().length === 0)) {
        errors.push("quiet_hours.timezone must be a non-empty string when provided");
      }
    }
  }

  return errors;
}

async function canSendNotificationToTargetUser(senderUserId, targetUserId) {
  const { data: senderMemberships, error: senderMembershipError } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", senderUserId)
    .eq("status", "active")
    .in("role", Array.from(ALLOWED_SENDER_ROLES));

  if (senderMembershipError) {
    throw senderMembershipError;
  }

  if (!senderMemberships || senderMemberships.length === 0) {
    return false;
  }

  const senderTeamIds = senderMemberships
    .map((membership) => membership.team_id)
    .filter(Boolean);
  if (senderTeamIds.length === 0) {
    return false;
  }

  const { data: targetMembership, error: targetMembershipError } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .eq("user_id", targetUserId)
    .eq("status", "active")
    .in("team_id", senderTeamIds)
    .limit(1)
    .single();

  if (targetMembershipError && targetMembershipError.code !== "PGRST116") {
    throw targetMembershipError;
  }

  return Boolean(targetMembership);
}

// Register a push notification token/subscription
const registerToken = async (userId, tokenData) => {
  checkEnvVars();

  const { token, device_type, device_name, subscription } = tokenData;

  // Use endpoint as the unique identifier if full subscription provided
  const tokenValue = subscription?.endpoint || token;

  // Deactivate any existing tokens with the same value
  await supabaseAdmin
    .from("user_notification_tokens")
    .update({ is_active: false })
    .eq("token", tokenValue);

  const { data, error } = await supabaseAdmin
    .from("user_notification_tokens")
    .upsert(
      {
        user_id: userId,
        token: tokenValue,
        device_type: device_type || "web",
        device_name,
        is_active: true,
        last_used_at: new Date().toISOString(),
        // Store full subscription data for web-push
        subscription_data: subscription || null,
      },
      { onConflict: "user_id,token" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    vapidPublicKey: getVapidPublicKey(),
  };
};

// Unregister token for current user
const unregisterToken = async (userId) => {
  checkEnvVars();

  const { error } = await supabaseAdmin
    .from("user_notification_tokens")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("device_type", "web");

  if (error) {
    throw error;
  }
  return { success: true };
};

// Get user's notification preferences
const getPreferences = async (userId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("push_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  // Return defaults if no preferences set
  return (
    data || {
      push_enabled: true,
      categories: {
        team_announcements: true,
        game_reminders: true,
        practice_reminders: true,
        stats_updates: true,
        training_reminders: true,
        chat_mentions: true,
        coach_feedback: true,
      },
      quiet_hours: null,
    }
  );
};

// Update user's notification preferences
const updatePreferences = async (userId, preferences) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("push_notification_preferences")
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Get registered devices for user
const getDevices = async (userId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("user_notification_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_used_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data || [];
};

// Remove a specific device
const removeDevice = async (userId, tokenId) => {
  checkEnvVars();

  const { error } = await supabaseAdmin
    .from("user_notification_tokens")
    .update({ is_active: false })
    .eq("id", tokenId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
  return { success: true };
};

/**
 * Send a push notification to a specific subscription
 * @param {Object} subscription - Push subscription object with endpoint, keys
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Send result
 */
const sendPushNotification = async (subscription, payload) => {
  const pushInit = initializeWebPush();

  if (!pushInit.initialized) {
    return {
      success: false,
      error: pushInit.reason,
      setupRequired: true,
      instructions: pushInit.generateKeys,
    };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: payload.urgency || "normal", // very-low, low, normal, high
        topic: payload.topic || undefined, // For notification replacement
      },
    );

    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    // Handle specific web-push errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid - should be removed
      return { success: false, expired: true, error: "Subscription expired" };
    }
    if (error.statusCode === 413) {
      return { success: false, error: "Payload too large" };
    }
    throw error;
  }
};

/**
 * Send notification to all active devices for a user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification content
 * @returns {Promise<Object>} Send results
 */
const sendNotificationToUser = async (userId, notification) => {
  checkEnvVars();

  // Get user's active tokens with full subscription data
  const { data: tokens, error: fetchError } = await supabaseAdmin
    .from("user_notification_tokens")
    .select("id, token, device_type, subscription_data")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (fetchError) {
    throw fetchError;
  }

  if (!tokens || tokens.length === 0) {
    throw new Error("No registered devices found");
  }

  const results = {
    sent: 0,
    failed: 0,
    expired: 0,
    errors: [],
  };

  // Prepare notification payload
  const payload = {
    title: notification.title || "FlagFit Pro",
    body: notification.body || notification.message,
    icon: notification.icon || "/icons/icon-192x192.png",
    badge: notification.badge || "/icons/badge-72x72.png",
    tag: notification.tag || `notification-${Date.now()}`,
    data: {
      url: notification.url || "/",
      type: notification.type || "general",
      timestamp: new Date().toISOString(),
      ...notification.data,
    },
    actions: notification.actions || [],
    requireInteraction: notification.requireInteraction || false,
    silent: notification.silent || false,
    urgency: notification.urgency || "normal",
  };

  // Send to each device
  for (const tokenRecord of tokens) {
    try {
      // Build subscription object
      const subscription = tokenRecord.subscription_data || {
        endpoint: tokenRecord.token,
        // If we only have the token, we can't send via web-push
        // This is for backwards compatibility with older registrations
      };

      if (!subscription.endpoint || !subscription.keys) {
        // Old-style token without full subscription data
        // Mark as needing re-registration
        results.errors.push({
          tokenId: tokenRecord.id,
          error: "Subscription needs re-registration with full keys",
        });
        results.failed++;
        continue;
      }

      const sendResult = await sendPushNotification(subscription, payload);

      if (sendResult.success) {
        results.sent++;

        // Update last used timestamp
        await supabaseAdmin
          .from("user_notification_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", tokenRecord.id);
      } else if (sendResult.expired) {
        results.expired++;

        // Deactivate expired subscription
        await supabaseAdmin
          .from("user_notification_tokens")
          .update({
            is_active: false,
            deactivated_reason: "subscription_expired",
          })
          .eq("id", tokenRecord.id);
      } else if (sendResult.setupRequired) {
        // Web push not configured - return setup instructions
        return {
          success: false,
          setupRequired: true,
          message: sendResult.error,
          instructions: sendResult.instructions,
        };
      } else {
        results.failed++;
        results.errors.push({
          tokenId: tokenRecord.id,
          error: sendResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        tokenId: tokenRecord.id,
        error: "Delivery attempt failed",
      });
    }
  }

  return {
    success: results.sent > 0,
    ...results,
    message: `Sent to ${results.sent}/${tokens.length} devices`,
  };
};

/**
 * Send test notification to verify push is working
 */
const sendTestNotification = async (userId) => {
  checkEnvVars();

  const notification = {
    title: "🏈 Test Notification",
    body: "Push notifications are working! You'll receive updates about training, games, and team announcements.",
    icon: "/icons/icon-192x192.png",
    tag: "test-notification",
    type: "test",
    url: "/settings/notifications",
    requireInteraction: false,
  };

  return sendNotificationToUser(userId, notification);
};

/**
 * Send notification to multiple users (for team announcements, etc.)
 */
const _sendBulkNotification = async (userIds, notification) => {
  checkEnvVars();

  const results = {
    totalUsers: userIds.length,
    usersNotified: 0,
    devicesSent: 0,
    devicesFailed: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const userResult = await sendNotificationToUser(userId, notification);

      if (userResult.setupRequired) {
        // Web push not configured - return immediately
        return userResult;
      }

      if (userResult.sent > 0) {
        results.usersNotified++;
        results.devicesSent += userResult.sent;
      }
      results.devicesFailed += userResult.failed || 0;
    } catch (error) {
      results.errors.push({ userId, error: "Notification dispatch failed" });
    }
  }

  return {
    success: results.usersNotified > 0,
    ...results,
    message: `Notified ${results.usersNotified}/${userIds.length} users (${results.devicesSent} devices)`,
  };
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "push",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    requireAuth: true, // SECURITY: Explicit auth for push notification management
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/push\/?/, "")
        .replace(/^\/\.netlify\/functions\/push\/?/, "");

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = JSON.parse(event.body);
        } catch {
          return createErrorResponse("Invalid JSON", 400, "invalid_json");
        }
      }

      try {
        // Register token
        if (event.httpMethod === "POST" && path === "register") {
          const errors = validateRegisterPayload(body);
          if (errors.length > 0) {
            return createErrorResponse(errors.join("; "), 422, ErrorType.VALIDATION);
          }

          const result = await registerToken(userId, body);
          return createSuccessResponse(result, 201);
        }

        // Unregister token
        if (event.httpMethod === "DELETE" && path === "unregister") {
          const result = await unregisterToken(userId);
          return createSuccessResponse(result);
        }

        // Preferences
        if (path === "preferences") {
          if (event.httpMethod === "GET") {
            const result = await getPreferences(userId);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "PUT") {
            const errors = validatePreferencesPayload(body);
            if (errors.length > 0) {
              return createErrorResponse(errors.join("; "), 422, ErrorType.VALIDATION);
            }

            const result = await updatePreferences(userId, body);
            return createSuccessResponse(result);
          }
        }

        // Devices
        if (event.httpMethod === "GET" && path === "devices") {
          const result = await getDevices(userId);
          return createSuccessResponse(result);
        }

        const deviceMatch = path.match(/^devices\/([^/]+)$/);
        if (deviceMatch && event.httpMethod === "DELETE") {
          const result = await removeDevice(userId, deviceMatch[1]);
          return createSuccessResponse(result);
        }

        // Test notification
        if (event.httpMethod === "POST" && path === "test") {
          const result = await sendTestNotification(userId);
          return createSuccessResponse(result);
        }

        // Send notification to self (for testing)
        if (event.httpMethod === "POST" && path === "send") {
          const result = await sendNotificationToUser(userId, body);
          return createSuccessResponse(result);
        }

        // Send notification to another user (for ACWR alerts, etc.)
        // Requires: targetUserId in body, and caller must be authorized (coach, admin, etc.)
        if (event.httpMethod === "POST" && path === "send-to-user") {
          const { targetUserId, ...notification } = body;

          if (typeof targetUserId !== "string" || targetUserId.trim().length === 0) {
            return createErrorResponse(
              "targetUserId is required",
              422,
              ErrorType.VALIDATION,
            );
          }

          if (targetUserId !== userId) {
            const authorized = await canSendNotificationToTargetUser(
              userId,
              targetUserId,
            );
            if (!authorized) {
              return createErrorResponse(
                "Unauthorized: insufficient permissions for target user",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
          }

          const result = await sendNotificationToUser(
            targetUserId,
            notification,
          );
          return createSuccessResponse(result);
        }

        // Get VAPID public key for client subscription
        if (event.httpMethod === "GET" && path === "vapid-key") {
          const publicKey = getVapidPublicKey();
          const pushInit = initializeWebPush();

          return createSuccessResponse({
            vapidPublicKey: publicKey,
            configured: pushInit.initialized,
            message: pushInit.initialized
              ? "Web Push is configured and ready"
              : pushInit.reason,
            setupInstructions: !pushInit.initialized
              ? [
                  "1. Generate VAPID keys: npx web-push generate-vapid-keys",
                  "2. Set VAPID_PUBLIC_KEY environment variable",
                  "3. Set VAPID_PRIVATE_KEY environment variable",
                  "4. Optionally set VAPID_SUBJECT (mailto: URL)",
                ]
              : undefined,
          });
        }

        // Check push notification status
        if (event.httpMethod === "GET" && path === "status") {
          const pushInit = initializeWebPush();
          const devices = await getDevices(userId);
          const preferences = await getPreferences(userId);

          return createSuccessResponse({
            configured: pushInit.initialized,
            configurationMessage: pushInit.initialized
              ? "Ready"
              : pushInit.reason,
            registeredDevices: devices.length,
            preferences: {
              enabled: preferences.push_enabled,
              categories: preferences.categories,
            },
          });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        if (error.message.includes("No registered devices")) {
          return createErrorResponse(error.message, 400, "no_devices");
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
