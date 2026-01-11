/**
 * Training Routes
 * Handles training sessions, programs, and workout logging
 *
 * @module routes/training
 * @version 2.3.0
 */

import express from "express";
import {
    authenticateToken,
    optionalAuth,
} from "./middleware/auth.middleware.js";
import { invalidateCacheOn, withCache } from "./utils/cache.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import {
    isValidUUID,
    sanitizeText,
    sendError,
    sendSuccess,
    validateDate,
    validateDuration,
    validateRPE
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "training";

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
      .select(
        `
        id,
        user_id,
        session_date,
        session_type,
        duration_minutes,
        rpe,
        status,
        notes,
        created_at
      `,
      )
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
 * Get training suggestions based on user's training history
 */
router.get("/suggestions", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, {
      suggestions: [
        {
          type: "recovery",
          message: "Based on your recent training load, consider a recovery day",
          priority: "medium",
        },
      ],
    });
  }

  try {
    const userId = req.userId || req.query.userId;
    const suggestions = [];

    if (userId && isValidUUID(userId)) {
      // Get recent training data to generate smart suggestions
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentSessions } = await supabase
        .from("training_sessions")
        .select("session_date, rpe, duration_minutes, session_type")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("session_date", sevenDaysAgo.toISOString().split("T")[0])
        .order("session_date", { ascending: false });

      const sessionCount = recentSessions?.length || 0;
      const avgRpe = sessionCount > 0
        ? recentSessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessionCount
        : 0;

      // Generate suggestions based on data
      if (sessionCount === 0) {
        suggestions.push({
          type: "motivation",
          message: "You haven't trained in a while. Start with a light session to get back on track!",
          priority: "high",
        });
      } else if (avgRpe > 7) {
        suggestions.push({
          type: "recovery",
          message: "Your average RPE is high. Consider a recovery or deload session.",
          priority: "high",
        });
      } else if (avgRpe < 5 && sessionCount >= 3) {
        suggestions.push({
          type: "intensity",
          message: "Your RPE has been low - you may be ready to increase intensity.",
          priority: "medium",
        });
      }

      if (sessionCount >= 5) {
        suggestions.push({
          type: "consistency",
          message: "Great consistency this week! Keep up the momentum.",
          priority: "low",
        });
      }
    }

    // Add default suggestion if none generated
    if (suggestions.length === 0) {
      suggestions.push({
        type: "general",
        message: "Log your training sessions to receive personalized suggestions.",
        priority: "low",
      });
    }

    return sendSuccess(res, { suggestions });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Suggestions error:`, error);
    return sendSuccess(res, {
      suggestions: [
        {
          type: "general",
          message: "Keep training consistently for best results.",
          priority: "low",
        },
      ],
    });
  }
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
// TRAINING PROGRAMS (Annual/Periodized Programs)
// =============================================================================

/**
 * GET /programs
 * Get all training programs (optionally filtered by position)
 */
router.get("/programs", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { position_id, active_only } = req.query;

    let query = supabase
      .from("training_programs")
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        is_active,
        position_id,
        positions(name, display_name),
        created_at
      `)
      .order("start_date", { ascending: false });

    if (position_id && isValidUUID(position_id)) {
      query = query.eq("position_id", position_id);
    }

    if (active_only === "true") {
      query = query.eq("is_active", true);
    }

    const { data: programs, error } = await query;

    if (error) {
      throw error;
    }

    return sendSuccess(res, { programs: programs || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get programs error:`, error);
    return sendError(res, "Failed to load programs", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/:id
 * Get a specific training program with full details
 */
router.get("/programs/:id", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendError(res, "Invalid program ID", "INVALID_ID", 400);
    }

    const { data: program, error } = await supabase
      .from("training_programs")
      .select(`
        *,
        positions(name, display_name),
        training_phases(
          id, name, description, start_date, end_date, phase_order, focus_areas
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    if (!program) {
      return sendError(res, "Program not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, { program });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get program error:`, error);
    return sendError(res, "Failed to load program", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/:id/phases
 * Get phases for a training program
 */
router.get("/programs/:id/phases", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendError(res, "Invalid program ID", "INVALID_ID", 400);
    }

    const { data: phases, error } = await supabase
      .from("training_phases")
      .select("*")
      .eq("program_id", id)
      .order("phase_order", { ascending: true });

    if (error) {
      throw error;
    }

    return sendSuccess(res, { phases: phases || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get phases error:`, error);
    return sendError(res, "Failed to load phases", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/:id/weeks
 * Get all weeks for a training program (across all phases)
 */
router.get("/programs/:id/weeks", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { id } = req.params;
    const { phase_id } = req.query;

    if (!isValidUUID(id)) {
      return sendError(res, "Invalid program ID", "INVALID_ID", 400);
    }

    // First get phases for this program
    let phasesQuery = supabase
      .from("training_phases")
      .select("id")
      .eq("program_id", id);

    if (phase_id && isValidUUID(phase_id)) {
      phasesQuery = phasesQuery.eq("id", phase_id);
    }

    const { data: phases } = await phasesQuery;
    const phaseIds = phases?.map(p => p.id) || [];

    if (phaseIds.length === 0) {
      return sendSuccess(res, { weeks: [] });
    }

    const { data: weeks, error } = await supabase
      .from("training_weeks")
      .select(`
        *,
        training_phases(name, phase_order)
      `)
      .in("phase_id", phaseIds)
      .order("start_date", { ascending: true });

    if (error) {
      throw error;
    }

    return sendSuccess(res, { weeks: weeks || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get weeks error:`, error);
    return sendError(res, "Failed to load weeks", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/current-week
 * Get the current week's training plan for the user
 */
router.get("/programs/current-week", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
    const today = new Date().toISOString().split("T")[0];

    // Find active program assignment for user
    let programId = null;

    if (userId && isValidUUID(userId)) {
      const { data: assignment } = await supabase
        .from("player_programs")
        .select("program_id")
        .eq("player_id", userId)
        .eq("is_active", true)
        .single();

      programId = assignment?.program_id;
    }

    // Fallback to any active program
    if (!programId) {
      const { data: activeProgram } = await supabase
        .from("training_programs")
        .select("id")
        .eq("is_active", true)
        .single();

      programId = activeProgram?.id;
    }

    if (!programId) {
      return sendSuccess(res, {
        currentWeek: null,
        message: "No active training program found",
      });
    }

    // Get phases for program
    const { data: phases } = await supabase
      .from("training_phases")
      .select("id")
      .eq("program_id", programId);

    const phaseIds = phases?.map(p => p.id) || [];

    if (phaseIds.length === 0) {
      return sendSuccess(res, {
        currentWeek: null,
        message: "No phases defined for program",
      });
    }

    // Find current week
    const { data: currentWeek, error } = await supabase
      .from("training_weeks")
      .select(`
        *,
        training_phases(name, phase_order, focus_areas)
      `)
      .in("phase_id", phaseIds)
      .lte("start_date", today)
      .gte("end_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return sendSuccess(res, {
      currentWeek: currentWeek || null,
      message: currentWeek ? null : "No training week scheduled for today",
    });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get current week error:`, error);
    return sendError(res, "Failed to load current week", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/:programId/sessions
 * Get training sessions for a program (templates)
 */
router.get("/programs/:programId/sessions", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { programId } = req.params;
    const { week_id } = req.query;

    if (!isValidUUID(programId)) {
      return sendError(res, "Invalid program ID", "INVALID_ID", 400);
    }

    // Get phases for program
    const { data: phases } = await supabase
      .from("training_phases")
      .select("id")
      .eq("program_id", programId);

    const phaseIds = phases?.map(p => p.id) || [];

    if (phaseIds.length === 0) {
      return sendSuccess(res, { sessions: [] });
    }

    // Get weeks for phases
    let weeksQuery = supabase
      .from("training_weeks")
      .select("id")
      .in("phase_id", phaseIds);

    if (week_id && isValidUUID(week_id)) {
      weeksQuery = weeksQuery.eq("id", week_id);
    }

    const { data: weeks } = await weeksQuery;
    const weekIds = weeks?.map(w => w.id) || [];

    if (weekIds.length === 0) {
      return sendSuccess(res, { sessions: [] });
    }

    const { data: sessions, error } = await supabase
      .from("training_sessions")
      .select(`
        *,
        training_weeks(week_number, focus)
      `)
      .in("week_id", weekIds)
      .order("day_of_week", { ascending: true })
      .order("session_order", { ascending: true });

    if (error) {
      throw error;
    }

    return sendSuccess(res, { sessions: sessions || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get program sessions error:`, error);
    return sendError(res, "Failed to load sessions", "FETCH_ERROR", 500);
  }
});

/**
 * GET /programs/:programId/exercises
 * Get exercises for a program's sessions
 */
router.get("/programs/:programId/exercises", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { programId } = req.params;
    const { session_id } = req.query;

    if (!isValidUUID(programId)) {
      return sendError(res, "Invalid program ID", "INVALID_ID", 400);
    }

    // If session_id provided, get exercises for that session
    if (session_id && isValidUUID(session_id)) {
      const { data: exercises, error } = await supabase
        .from("session_exercises")
        .select(`
          *,
          exercises(name, category, movement_pattern, description, video_url)
        `)
        .eq("session_id", session_id)
        .order("exercise_order", { ascending: true });

      if (error) {
        throw error;
      }

      return sendSuccess(res, { exercises: exercises || [] });
    }

    // Otherwise get all exercises in the exercises library
    const { data: exercises, error } = await supabase
      .from("exercises")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return sendSuccess(res, { exercises: exercises || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get program exercises error:`, error);
    return sendError(res, "Failed to load exercises", "FETCH_ERROR", 500);
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Catch-all 404 handler (must be last route)
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Training endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

// =============================================================================
// EXERCISE LIBRARY
// =============================================================================

/**
 * GET /exercises
 * Get exercise library with optional filtering
 */
router.get(
  "/exercises",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { category, position, search } = req.query;

      let query = supabase.from("exercises").select("*").eq("active", true);

      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      if (position) {
        query = query.contains("position_specific", [position]);
      }
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data: exercises, error } = await query.order("name").limit(200);
      if (error) {
        throw error;
      }

      return sendSuccess(res, exercises || []);
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Exercises error:`, error);
      return sendError(res, "Failed to load exercises", "FETCH_ERROR", 500);
    }
  },
);

export default router;
