/**
 * Notifications Routes
 * Handles user notifications and notification preferences
 *
 * @module routes/notifications
 * @version 2.2.0
 */

import express from "express";
import { supabase } from "./utils/database.js";
import { serverLogger } from "./utils/server-logger.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import {
  authenticateToken,
  optionalAuth,
} from "./middleware/auth.middleware.js";
import { sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "notifications";

// Helper to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "2.2.0"));

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * GET /
 * Get notifications for a user
 */
router.get("/", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, []);
  }

  try {
    const userId = req.userId || req.query.userId;
    const limit = parseInt(req.query.limit) || 20;

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    return sendSuccess(res, notifications || []);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get notifications error:`, error);
    return sendSuccess(res, []);
  }
});

/**
 * GET /count
 * Get notification counts
 */
router.get("/count", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, { count: 0, unread: 0 });
  }

  try {
    const userId = req.userId || req.query.userId;

    let totalQuery = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });

    let unreadQuery = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    if (userId && isValidUUID(userId)) {
      totalQuery = totalQuery.eq("user_id", userId);
      unreadQuery = unreadQuery.eq("user_id", userId);
    }

    const [{ count: total }, { count: unread }] = await Promise.all([
      totalQuery,
      unreadQuery,
    ]);

    return sendSuccess(res, {
      count: total || 0,
      unread: unread || 0,
    });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Count error:`, error);
    return sendSuccess(res, { count: 0, unread: 0 });
  }
});

/**
 * POST /mark-read
 * Mark notifications as read
 */
router.post(
  "/mark-read",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, null, "Marked as read");
    }

    try {
      const { notificationId, ids } = req.body || {};
      const { userId } = req;

      if (notificationId === "all") {
        // Mark all user's notifications as read
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false);
      } else if (Array.isArray(ids) && ids.length > 0) {
        // Mark specific notifications as read
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .in("id", ids);
      } else if (notificationId) {
        // Mark single notification as read
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("id", notificationId);
      }

      return sendSuccess(res, null, "Notifications marked as read");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Mark read error:`, error);
      return sendSuccess(res, null, "Marked as read");
    }
  },
);

/**
 * DELETE /:id
 * Delete a notification
 */
router.delete(
  "/:id",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, null, "Deleted");
    }

    try {
      const { id } = req.params;
      const { userId } = req;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return sendSuccess(res, null, "Notification deleted");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Delete error:`, error);
      return sendError(
        res,
        "Failed to delete notification",
        "DELETE_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /preferences
 * Get notification preferences
 */
router.get(
  "/preferences",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, {
        email: true,
        push: true,
        training_reminders: true,
        wellness_reminders: true,
        team_updates: true,
        achievements: true,
      });
    }

    try {
      const { userId } = req;

      const { data: preferences, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return sendSuccess(
        res,
        preferences || {
          email: true,
          push: true,
          training_reminders: true,
          wellness_reminders: true,
          team_updates: true,
          achievements: true,
        },
      );
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Get preferences error:`, error);
      return sendError(res, "Failed to get preferences", "FETCH_ERROR", 500);
    }
  },
);

/**
 * PUT /preferences
 * Update notification preferences
 */
router.put(
  "/preferences",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, req.body, "Preferences updated");
    }

    try {
      const { userId } = req;

      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: userId,
            ...req.body,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, data, "Preferences updated");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Update preferences error:`, error);
      return sendError(
        res,
        "Failed to update preferences",
        "UPDATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Notifications endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

export default router;
