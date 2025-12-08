// Netlify Function: Notifications Count
// Returns unread notification count for the current user

const jwt = require("jsonwebtoken");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// JWT_SECRET will be checked at runtime, not module load time
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

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
    
    // Get JWT_SECRET
    const JWT_SECRET = getJWTSecret();

    // Get authorization header
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse("Authentication required", 401, 'unauthorized');
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    let decoded;
    let userId = null;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (jwtError) {
      return createErrorResponse("Invalid or expired token", 401, 'unauthorized');
    }

    if (!userId) {
      return createErrorResponse("User ID not found in token", 401, 'unauthorized');
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

