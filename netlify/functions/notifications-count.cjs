// Netlify Function: Notifications Count
// Returns unread notification count for the current user using Supabase authentication

const { createClient } = require("@supabase/supabase-js");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

exports.handler = async (event, context) => {
  logFunctionCall('NotificationsCount', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Check environment variables first
    checkEnvVars();

    // Get authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse("Authentication required", 401, 'unauthorized');
    }

    // Extract token
    const token = authHeader.substring(7);

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Supabase auth error:", authError);
      return createErrorResponse("Invalid or expired token", 401, 'unauthorized');
    }

    const userId = user.id;

    if (!userId) {
      return createErrorResponse("User ID not found", 401, 'unauthorized');
    }

    if (event.httpMethod === "GET") {
      try {
        // Get unread count (already filters muted types)
        const unreadCount = await db.notifications.getUnreadCount(userId);

        // Also get last opened timestamp
        const lastOpenedAt = await db.notifications.getLastOpenedAt(userId);

        return createSuccessResponse({
          unreadCount,
          lastOpenedAt
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return createErrorResponse("Failed to get notification count", 500, 'database_error');
      }
    } else {
      return createErrorResponse("Method not allowed", 405, 'method_not_allowed');
    }
  } catch (error) {
    console.error("Error in notifications-count function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'NotificationsCount');
  }
};
