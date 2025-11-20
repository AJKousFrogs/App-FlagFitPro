// Netlify Function: Notifications
// Returns user notifications using Supabase

const jwt = require("jsonwebtoken");
const { db, checkEnvVars } = require("./supabase-client.cjs");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is not set!");
  throw new Error("JWT_SECRET environment variable is required for security");
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    };
  }

  try {
    // Get authorization header
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    let userId = null;

    // Handle authentication - allow unauthenticated requests for notifications
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract and verify token
      const token = authHeader.substring(7);
      let decoded;

      try {
        decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtError) {
        // Invalid token - continue without authentication
        console.warn("Invalid token provided, returning fallback notifications");
      }
    }

    // Check environment variables
    checkEnvVars();

    // If no user ID, return fallback notifications
    if (!userId) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          data: getFallbackNotifications(),
        }),
      };
    }

    if (event.httpMethod === "GET") {
      // Get notifications for user
      const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : 20;

      try {
        const notifications = await db.notifications.getUserNotifications(
          userId,
          limit,
        );

        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            data: notifications,
          }),
        };
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Return fallback notifications if database query fails
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            data: getFallbackNotifications(),
          }),
        };
      }
    } else if (event.httpMethod === "POST") {
      // Mark notification as read
      const body = JSON.parse(event.body || "{}");
      const notificationId = body.notificationId;

      if (!notificationId) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: false,
            error: "notificationId is required",
          }),
        };
      }

      try {
        await db.notifications.markAsRead(userId, notificationId);
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
          }),
        };
      } catch (dbError) {
        console.error("Database error:", dbError);
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: false,
            error: "Failed to update notification",
          }),
        };
      }
    } else {
      return {
        statusCode: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Method not allowed",
        }),
      };
    }
  } catch (error) {
    console.error("Notifications error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        // Return fallback notifications on error
        data: getFallbackNotifications(),
      }),
    };
  }
};

// Fallback notifications if database is unavailable
function getFallbackNotifications() {
  return [
    {
      id: 1,
      type: "training",
      title: "Training Session Reminder",
      message: "Speed & Agility training starts in 30 minutes",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "achievement",
      title: "New Achievement Unlocked",
      message: "You've completed 10 training sessions this month!",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "team",
      title: "Team Update",
      message: "New team member joined: Alex Johnson",
      time: "2 hours ago",
      read: false,
    },
  ];
}
