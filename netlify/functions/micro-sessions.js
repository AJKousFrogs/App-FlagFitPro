/**
 * Netlify Function: Micro-Sessions
 *
 * Phase 2: Trackable micro-workout sessions from AI suggestions
 *
 * Endpoints:
 * - GET /api/micro-sessions - List user's micro-sessions
 * - GET /api/micro-sessions/today - Get today's pending sessions
 * - GET /api/micro-sessions/:id - Get single session detail
 * - POST /api/micro-sessions - Create a new micro-session
 * - PATCH /api/micro-sessions/:id - Update session (start, complete, skip)
 * - POST /api/micro-sessions/:id/follow-up - Submit follow-up response
 * - GET /api/micro-sessions/analytics - Get completion analytics
 *
 * Micro-sessions transform suggested actions into trackable activities:
 * - Time estimate (3-8 min)
 * - Equipment needed
 * - Step-by-step instructions
 * - Completion button + timer
 * - Follow-up prompt
 */

import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";

import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a micro-session from an AI suggestion
 * @param {Object} sessionData - Session data
 * @param {string} userId - User ID
 * @returns {Object} - Created session
 */
async function createMicroSession(sessionData, userId) {
  const {
    title,
    description,
    session_type = "recovery",
    estimated_duration_minutes = 5,
    equipment_needed = [],
    source_type = "ai_suggestion",
    source_id = null,
    source_message_id = null,
    position_relevance = ["ALL"],
    intensity_level = "low",
    steps = [],
    coaching_cues = [],
    safety_notes = null,
    assigned_date = new Date().toISOString().split("T")[0],
    follow_up_prompt = "How do you feel after completing this? (0-10)",
  } = sessionData;

  const { data, error } = await supabaseAdmin
    .from("micro_sessions")
    .insert({
      user_id: userId,
      title,
      description,
      session_type,
      estimated_duration_minutes,
      equipment_needed,
      source_type,
      source_id,
      source_message_id,
      position_relevance,
      intensity_level,
      steps,
      coaching_cues,
      safety_notes,
      assigned_date,
      follow_up_prompt,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[Micro-Sessions] Error creating session:", error);
    throw error;
  }

  return data;
}

/**
 * Get micro-sessions for a user with filters
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Array} - Micro-sessions
 */
async function getMicroSessions(userId, filters = {}) {
  const {
    status,
    session_type,
    date_from,
    date_to,
    limit = 50,
    offset = 0,
  } = filters;

  let query = supabaseAdmin
    .from("micro_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("assigned_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (session_type) {
    query = query.eq("session_type", session_type);
  }
  if (date_from) {
    query = query.gte("assigned_date", date_from);
  }
  if (date_to) {
    query = query.lte("assigned_date", date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Micro-Sessions] Error fetching sessions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get today's pending micro-sessions
 * @param {string} userId - User ID
 * @returns {Array} - Today's pending sessions
 */
async function getTodaySessions(userId) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("micro_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("assigned_date", today)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Micro-Sessions] Error fetching today's sessions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single micro-session by ID
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Object|null} - Session or null
 */
async function getMicroSessionById(sessionId, userId) {
  const { data, error } = await supabaseAdmin
    .from("micro_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    } // Not found
    console.error("[Micro-Sessions] Error fetching session:", error);
    throw error;
  }

  return data;
}

/**
 * Update a micro-session status
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated session
 */
async function updateMicroSession(sessionId, userId, updates) {
  const { status, started_at, completed_at, actual_duration_minutes } = updates;

  const updateData = {};

  if (status) {
    updateData.status = status;

    // Auto-set timestamps based on status
    if (status === "in_progress" && !started_at) {
      updateData.started_at = new Date().toISOString();
    }
    if (status === "completed" && !completed_at) {
      updateData.completed_at = new Date().toISOString();
    }
  }

  if (started_at) {
    updateData.started_at = started_at;
  }
  if (completed_at) {
    updateData.completed_at = completed_at;
  }
  if (actual_duration_minutes !== undefined) {
    updateData.actual_duration_minutes = actual_duration_minutes;
  }

  const { data, error } = await supabaseAdmin
    .from("micro_sessions")
    .update(updateData)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[Micro-Sessions] Error updating session:", error);
    throw error;
  }

  return data;
}

/**
 * Submit follow-up response for a completed session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {Object} followUpData - Follow-up response data
 * @returns {Object} - Updated session
 */
async function submitFollowUp(sessionId, userId, followUpData) {
  const { rating, notes } = followUpData;

  const { data, error } = await supabaseAdmin
    .from("micro_sessions")
    .update({
      follow_up_response: {
        rating,
        notes,
        submitted_at: new Date().toISOString(),
      },
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[Micro-Sessions] Error submitting follow-up:", error);
    throw error;
  }

  return data;
}

/**
 * Get completion analytics for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} - Analytics data
 */
async function getCompletionAnalytics(userId, options = {}) {
  const { weeks = 4 } = options;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Get aggregated stats from the view
  const { data: weeklyStats, error: statsError } = await supabaseAdmin
    .from("micro_session_analytics")
    .select("*")
    .eq("user_id", userId)
    .gte("week_start", startDate.toISOString().split("T")[0])
    .order("week_start", { ascending: false });

  if (statsError) {
    console.error("[Micro-Sessions] Error fetching analytics:", statsError);
    throw statsError;
  }

  // Get overall totals
  const { data: totals, error: totalsError } = await supabaseAdmin
    .from("micro_sessions")
    .select("status")
    .eq("user_id", userId)
    .gte("assigned_date", startDate.toISOString().split("T")[0]);

  if (totalsError) {
    console.error("[Micro-Sessions] Error fetching totals:", totalsError);
    throw totalsError;
  }

  const totalCompleted = totals.filter((t) => t.status === "completed").length;
  const totalAssigned = totals.length;
  const totalSkipped = totals.filter((t) => t.status === "skipped").length;

  // Calculate streaks
  const { data: recentSessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("assigned_date, status")
    .eq("user_id", userId)
    .order("assigned_date", { ascending: false })
    .limit(30);

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const session of recentSessions || []) {
    if (session.status === "completed") {
      const sessionDate = new Date(session.assigned_date).toDateString();
      if (prevDate === null || sessionDate !== prevDate) {
        tempStreak++;
        prevDate = sessionDate;
      }
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 0;
      prevDate = null;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);
  currentStreak = tempStreak;

  return {
    weekly_breakdown: weeklyStats || [],
    totals: {
      total_assigned: totalAssigned,
      total_completed: totalCompleted,
      total_skipped: totalSkipped,
      completion_rate:
        totalAssigned > 0
          ? Math.round(
              (totalCompleted / (totalCompleted + totalSkipped)) * 100,
            ) || 0
          : 0,
    },
    streaks: {
      current: currentStreak,
      best: maxStreak,
    },
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "micro-sessions",
    allowedMethods: ["GET", "POST", "PATCH"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?micro-sessions\/?/, "")
        .split("/")
        .filter(Boolean);
      const subPath = pathParts[0] || "";
      const sessionId =
        pathParts[0] && !["today", "analytics"].includes(pathParts[0])
          ? pathParts[0]
          : null;
      const action = pathParts[1] || null;

      try {
        // GET /api/micro-sessions/today - Today's pending sessions
        if (method === "GET" && subPath === "today") {
          const sessions = await getTodaySessions(userId);
          return createSuccessResponse(
            {
              sessions,
              total: sessions.length,
            },
            requestId,
          );
        }

        // GET /api/micro-sessions/analytics - Completion analytics
        if (method === "GET" && subPath === "analytics") {
          const { weeks } = event.queryStringParameters || {};
          const analytics = await getCompletionAnalytics(userId, {
            weeks: weeks ? parseInt(weeks) : 4,
          });
          return createSuccessResponse(analytics, requestId);
        }

        // GET /api/micro-sessions/:id - Single session detail
        if (method === "GET" && sessionId) {
          const session = await getMicroSessionById(sessionId, userId);
          if (!session) {
            return createErrorResponse(
              "Micro-session not found",
              404,
              "not_found",
              requestId,
            );
          }
          return createSuccessResponse(session, requestId);
        }

        // GET /api/micro-sessions - List sessions
        if (method === "GET") {
          const filters = event.queryStringParameters || {};
          const sessions = await getMicroSessions(userId, filters);
          return createSuccessResponse(
            {
              sessions,
              total: sessions.length,
              filters,
            },
            requestId,
          );
        }

        // POST /api/micro-sessions/:id/follow-up - Submit follow-up
        if (method === "POST" && sessionId && action === "follow-up") {
          let body;
          try {
            body = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }

          // Validate rating
          if (
            body.rating === undefined ||
            body.rating < 0 ||
            body.rating > 10
          ) {
            return createErrorResponse(
              "Rating is required and must be between 0 and 10",
              400,
              "validation_error",
              requestId,
            );
          }

          const session = await submitFollowUp(sessionId, userId, body);
          return createSuccessResponse(session, requestId);
        }

        // POST /api/micro-sessions - Create new session
        if (method === "POST" && !sessionId) {
          let body;
          try {
            body = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }

          // Validate required fields
          if (!body.title) {
            return createErrorResponse(
              "Title is required",
              400,
              "validation_error",
              requestId,
            );
          }

          const session = await createMicroSession(body, userId);
          return createSuccessResponse(session, requestId);
        }

        // PATCH /api/micro-sessions/:id - Update session
        if (method === "PATCH" && sessionId) {
          let body;
          try {
            body = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }

          // Validate status if provided
          const validStatuses = [
            "pending",
            "in_progress",
            "completed",
            "skipped",
          ];
          if (body.status && !validStatuses.includes(body.status)) {
            return createErrorResponse(
              `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
              400,
              "invalid_status",
              requestId,
            );
          }

          const session = await updateMicroSession(sessionId, userId, body);
          return createSuccessResponse(session, requestId);
        }

        // Method not allowed
        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        console.error("[Micro-Sessions] Error:", error);
        return createErrorResponse(
          "Failed to process request",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};
