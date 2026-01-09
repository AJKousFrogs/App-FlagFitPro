/**
 * Training Routes
 * Handles training sessions, programs, and workout logging
 *
 * @module routes/training
 * @version 2.3.0
 */

import express from "express";
import { supabase } from "./utils/database.js";
import { serverLogger } from "./utils/server-logger.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { withCache, invalidateCacheOn } from "./utils/cache.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import {
  authenticateToken,
  optionalAuth,
} from "./middleware/auth.middleware.js";
import {
  validateUserId,
  validateRPE,
  validateDuration,
  validateDate,
  sanitizeText,
  sanitizeFields,
  sendError,
  sendSuccess,
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "training";

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
// TRAINING STATS
// =============================================================================

/**
 * GET /stats
 * Get training statistics for a user
 * Cached for 1 minute with ETag support
 */
router.get(
  "/stats",
  rateLimit("READ"),
  withCache("STATS"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from("training_sessions")
        .select(
          "id, user_id, session_date, duration_minutes, rpe, status, session_type",
        )
        .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(50);

      if (userId && isValidUUID(userId)) {
        query = query.eq("user_id", userId);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw error;
      }

      const totalMinutes =
        sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const avgRpe =
        sessions?.length > 0
          ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length
          : 0;

      // Calculate this week's sessions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const thisWeekSessions =
        sessions?.filter((s) => new Date(s.session_date) >= weekStart) || [];

      return sendSuccess(res, {
        totalSessions: sessions?.length || 0,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        averageRpe: Math.round(avgRpe * 10) / 10,
        weeklyGoal: {
          target: 5,
          completed: thisWeekSessions.length,
        },
        recentSessions: sessions?.slice(0, 5) || [],
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Stats error:`, error);
      return sendError(
        res,
        "Failed to load training stats",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /stats-enhanced
 * Get enhanced training statistics with trends
 * Cached for 1 minute with ETag support
 */
router.get(
  "/stats-enhanced",
  rateLimit("READ"),
  withCache("STATS"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from("training_sessions")
        .select("session_date, duration_minutes, rpe, session_type")
        .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
        .eq("status", "completed")
        .order("session_date");

      if (userId && isValidUUID(userId)) {
        query = query.eq("user_id", userId);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw error;
      }

      // Weekly trends
      const weeklyData = {};
      sessions?.forEach((s) => {
        const date = new Date(s.session_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { sessions: 0, minutes: 0, load: 0 };
        }
        weeklyData[weekKey].sessions++;
        weeklyData[weekKey].minutes += s.duration_minutes || 0;
        weeklyData[weekKey].load += (s.rpe || 5) * (s.duration_minutes || 60);
      });

      // Session type distribution
      const typeDistribution = {};
      sessions?.forEach((s) => {
        const type = s.session_type || "General";
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });

      return sendSuccess(res, {
        stats: {
          totalSessions: sessions?.length || 0,
          totalHours:
            Math.round(
              ((sessions?.reduce(
                (sum, s) => sum + (s.duration_minutes || 0),
                0,
              ) || 0) /
                60) *
                10,
            ) / 10,
        },
        trends: Object.entries(weeklyData).map(([week, data]) => ({
          week,
          ...data,
        })),
        distribution: Object.entries(typeDistribution).map(([type, count]) => ({
          type,
          count,
        })),
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Enhanced stats error:`, error);
      return sendError(
        res,
        "Failed to load enhanced stats",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// TRAINING SESSIONS
// =============================================================================

/**
 * GET /sessions
 * Get training sessions for a user
 */
router.get("/sessions", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
    const limit = parseInt(req.query.limit) || 20;

    let query = supabase
      .from("training_sessions")
      .select(`
        id,
        user_id,
        session_date,
        session_type,
        duration_minutes,
        rpe,
        status,
        notes,
        created_at
      `)
      .order("session_date", { ascending: false })
      .limit(limit);

    if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    return sendSuccess(res, { sessions: sessions || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Sessions error:`, error);
    return sendError(res, "Failed to load sessions", "FETCH_ERROR", 500);
  }
});

/**
 * POST /session
 * Create a new training session
 */
router.post(
  "/session",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      // VALIDATE RPE if provided
      if (req.body.rpe !== undefined) {
        const rpeValidation = validateRPE(req.body.rpe);
        if (!rpeValidation.isValid) {
          return sendError(res, rpeValidation.error, "INVALID_RPE", 400);
        }
        req.body.rpe = rpeValidation.rpe;
      }

      // VALIDATE DURATION if provided
      if (req.body.duration_minutes !== undefined) {
        const durationValidation = validateDuration(req.body.duration_minutes);
        if (!durationValidation.isValid) {
          return sendError(
            res,
            durationValidation.error,
            "INVALID_DURATION",
            400,
          );
        }
        req.body.duration_minutes = durationValidation.duration;
      }

      // VALIDATE DATE if provided
      if (req.body.session_date !== undefined) {
        const dateValidation = validateDate(req.body.session_date);
        if (!dateValidation.isValid) {
          return sendError(res, dateValidation.error, "INVALID_DATE", 400);
        }
        req.body.session_date = dateValidation.date.split("T")[0]; // YYYY-MM-DD
      }

      const sessionData = { ...req.body, user_id: req.userId };
      const { data: session, error } = await supabase
        .from("training_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, { session }, "Session created successfully");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Create session error:`, error);
      return sendError(res, "Failed to create session", "CREATE_ERROR", 500);
    }
  },
);

/**
 * POST /complete
 * Mark a training session as complete
 * Invalidates training stats cache on success
 */
router.post(
  "/complete",
  rateLimit("CREATE"),
  authenticateToken,
  invalidateCacheOn("STATS:*/training/stats*"),
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, null, "Logged (offline mode)");
    }

    try {
      const { sessionId, rpe, duration, notes } = req.body;

      // VALIDATE RPE
      const rpeValidation = validateRPE(rpe);
      if (!rpeValidation.isValid) {
        return sendError(res, rpeValidation.error, "INVALID_RPE", 400);
      }

      // VALIDATE DURATION
      const durationValidation = validateDuration(duration);
      if (!durationValidation.isValid) {
        return sendError(
          res,
          durationValidation.error,
          "INVALID_DURATION",
          400,
        );
      }

      // SANITIZE notes to prevent XSS
      const sanitizedNotes = notes ? sanitizeText(notes) : "Completed via API";

      const targetUserId = req.userId;

      // Update training session status if sessionId provided
      if (sessionId && sessionId !== "demo-session" && isValidUUID(sessionId)) {
        await supabase
          .from("training_sessions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("user_id", targetUserId); // Authorization check already included
      }

      // Insert into workout_logs with validated values
      const { data, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          player_id: targetUserId,
          session_id:
            sessionId && sessionId !== "demo-session" && isValidUUID(sessionId)
              ? sessionId
              : null,
          completed_at: new Date().toISOString(),
          rpe: rpeValidation.rpe, // Use validated value
          duration_minutes: durationValidation.duration, // Use validated value
          notes: sanitizedNotes, // Use sanitized notes
        })
        .select();

      if (logError) {
        if (logError.code === "23503") {
          return sendSuccess(
            res,
            null,
            "Logged (without DB persistence due to user mismatch)",
          );
        }
        throw logError;
      }

      return sendSuccess(res, data, "Training session marked as complete");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Complete error:`, error);
      return sendError(
        res,
        "Failed to complete training",
        "COMPLETE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// WORKOUTS
// =============================================================================

/**
 * GET /workouts/:id
 * Get a specific workout by ID
 */
router.get("/workouts/:id", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { data: session, error } = await supabase
      .from("training_sessions")
      .select("*, exercises:session_exercises(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      throw error;
    }

    return sendSuccess(res, session || { id: req.params.id, exercises: [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get workout error:`, error);
    return sendError(res, "Failed to load workout", "FETCH_ERROR", 500);
  }
});

/**
 * PUT /workouts/:id
 * Update a workout
 */
router.put(
  "/workouts/:id",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      // VALIDATE RPE if provided
      if (req.body.rpe !== undefined) {
        const rpeValidation = validateRPE(req.body.rpe);
        if (!rpeValidation.isValid) {
          return sendError(res, rpeValidation.error, "INVALID_RPE", 400);
        }
        req.body.rpe = rpeValidation.rpe;
      }

      // VALIDATE DURATION if provided
      if (req.body.duration_minutes !== undefined) {
        const durationValidation = validateDuration(req.body.duration_minutes);
        if (!durationValidation.isValid) {
          return sendError(
            res,
            durationValidation.error,
            "INVALID_DURATION",
            400,
          );
        }
        req.body.duration_minutes = durationValidation.duration;
      }

      const { data: session, error } = await supabase
        .from("training_sessions")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("user_id", req.userId) // ADD AUTHORIZATION CHECK
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!session) {
        return sendError(
          res,
          "Training session not found or you don't have permission to update it",
          "NOT_FOUND",
          404,
        );
      }

      return sendSuccess(res, { session }, "Workout updated successfully");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Update workout error:`, error);
      return sendError(res, "Failed to update workout", "UPDATE_ERROR", 500);
    }
  },
);

// =============================================================================
// DELETE ENDPOINT
// =============================================================================

/**
 * DELETE /session/:id
 * Soft delete a training session
 */
router.delete(
  "/session/:id",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { data, error } = await supabase
        .from("training_sessions")
        .update({
          status: "deleted",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", req.params.id)
        .eq("user_id", req.userId) // AUTHORIZATION CHECK
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return sendError(
          res,
          "Training session not found or you don't have permission to delete it",
          "NOT_FOUND",
          404,
        );
      }

      return sendSuccess(res, null, "Training session deleted successfully");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Delete session error:`, error);
      return sendError(res, "Failed to delete session", "DELETE_ERROR", 500);
    }
  },
);

// =============================================================================
// TRAINING SUGGESTIONS
// =============================================================================

/**
 * GET /suggestions
 * Get training suggestions
 */
router.get("/suggestions", rateLimit("READ"), async (req, res) => {
  return sendSuccess(res, {
    suggestions: [
      {
        type: "recovery",
        message: "Based on your recent training load, consider a recovery day",
        priority: "medium",
      },
      {
        type: "intensity",
        message: "Your RPE has been consistent - ready to increase intensity",
        priority: "low",
      },
    ],
  });
});

/**
 * POST /suggestions
 * Submit training feedback for better suggestions
 */
router.post(
  "/suggestions",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    // Store feedback for ML model training
    serverLogger.info(
      `[${ROUTE_NAME}] Suggestion feedback from ${req.userId}:`,
      req.body,
    );
    return sendSuccess(res, null, "Feedback recorded");
  },
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Training endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

export default router;
