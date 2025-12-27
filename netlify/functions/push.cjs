// Netlify Function: Push Notifications API
// Handles push notification registration and preferences

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

// Register a push notification token
const registerToken = async (userId, tokenData) => {
  checkEnvVars();

  const { token, device_type, device_name } = tokenData;

  // Deactivate any existing tokens with the same value
  await supabaseAdmin
    .from("user_notification_tokens")
    .update({ is_active: false })
    .eq("token", token);

  const { data, error } = await supabaseAdmin
    .from("user_notification_tokens")
    .upsert(
      {
        user_id: userId,
        token,
        device_type: device_type || "web",
        device_name,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Unregister token for current user
const unregisterToken = async (userId) => {
  checkEnvVars();

  const { error } = await supabaseAdmin
    .from("user_notification_tokens")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("device_type", "web");

  if (error) throw error;
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

  if (error && error.code !== "PGRST116") throw error;

  // Return defaults if no preferences set
  return data || {
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
  };
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
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
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

  if (error) throw error;
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

  if (error) throw error;
  return { success: true };
};

// Send test notification (placeholder - would integrate with web-push)
const sendTestNotification = async (userId) => {
  checkEnvVars();

  // Get user's active tokens
  const { data: tokens } = await supabaseAdmin
    .from("user_notification_tokens")
    .select("token, device_type")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!tokens || tokens.length === 0) {
    throw new Error("No registered devices found");
  }

  // In production, this would use web-push library to send actual notifications
  // For now, just log and return success
  console.log(`Would send test notification to ${tokens.length} device(s) for user ${userId}`);

  return { success: true, devices_notified: tokens.length };
};

// Main handler
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "push",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    handler: async (event, _context, { userId }) => {
      const path = event.path.replace(/^\/api\/push\/?/, "").replace(/^\/\.netlify\/functions\/push\/?/, "");

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
          const result = await registerToken(userId, body);
          return createSuccessResponse(result, null, 201);
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
