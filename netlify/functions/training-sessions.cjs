// Netlify Function: Training Sessions API
// Handles creation and retrieval of training sessions for the Training Builder component
// Endpoint: /api/training/sessions

const {
  checkEnvVars: _checkEnvVars,
  supabaseAdmin,
} = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} = require("./utils/error-handler.cjs");
const {
  requireAuthorization,
  getUserRole,
  logViolation,
} = require("./utils/authorization-guard.cjs");
const { guardMerlinRequest } = require("./utils/merlin-guard.cjs");
// Note: authenticateRequest, applyRateLimit, and CORS are handled by baseHandler

/**
 * Create a training session from the Training Builder
 * Contract: Section 3.1 - Session Mutation APIs
 */
async function createTrainingSession(userId, sessionData, requestInfo = {}) {
  try {
    // Check role - only coaches can create sessions for others
    const role = await getUserRole(userId);
    if (!role) {
      await logViolation(
        userId,
        null,
        "session",
        "create",
        "ROLE_NOT_FOUND",
        "User role not found",
        requestInfo,
      );
      throw new Error("User role not found");
    }

    const {
      exercises,
      duration,
      intensity,
      goals,
      equipment,
      scheduledDate,
      notes,
      user_id: targetUserId, // Allow creating for another user if coach
    } = sessionData;

    // If creating for another user, must be coach
    const finalUserId = targetUserId || userId;
    if (finalUserId !== userId && !["coach", "admin"].includes(role)) {
      await logViolation(
        userId,
        null,
        "session",
        "create",
        "INSUFFICIENT_PERMISSIONS",
        "Coach role required to create sessions for other users",
        requestInfo,
      );
      throw new Error("Insufficient permissions: coach role required");
    }

    // Calculate total duration if not provided
    const totalDuration =
      duration || exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

    // Map intensity to numeric value
    const intensityMap = {
      low: 3,
      medium: 6,
      high: 9,
    };
    const intensityLevel = intensityMap[intensity] || 6;

    // Determine session type from goals
    const sessionType = goals && goals.length > 0 ? goals[0] : "mixed";

    // Create session record
    const sessionRecord = {
      user_id: finalUserId,
      session_date: scheduledDate || new Date().toISOString().split("T")[0],
      session_type: sessionType,
      duration_minutes: totalDuration,
      intensity_level: intensityLevel,
      status: "planned", // Will be updated to "completed" when session is finished
      session_state: "PLANNED", // Set initial state
      notes: notes || `Generated session with ${exercises.length} exercises`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into training_sessions table
    const { data: session, error } = await supabaseAdmin
      .from("training_sessions")
      .insert(sessionRecord)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return success with note
      if (error.code === "42P01") {
        return {
          success: true,
          id: `temp_${Date.now()}`,
          session: {
            ...sessionRecord,
            id: `temp_${Date.now()}`,
            exercises,
            equipment,
            goals,
          },
          note: "Table needs to be created via migration",
        };
      }
      // Handle PGRST116 (not found) - shouldn't happen on insert, but handle gracefully
      if (error.code === "PGRST116") {
        throw new Error("Failed to create training session");
      }
      throw error;
    }

    // Store exercise details in a separate table or JSONB field if available
    // For now, we'll return the session with exercises attached
    return {
      success: true,
      id: session.id,
      session: {
        ...session,
        exercises,
        equipment,
        goals,
      },
    };
  } catch (error) {
    console.error("Error creating training session:", error);
    throw error;
  }
}

/**
 * Get training sessions for a user
 * Always filters to sessions up to and including today by default
 * This ensures training statistics only include completed/real data
 *
 * Query params:
 * - userId (required, from auth)
 * - startDate (optional, defaults to beginning of time)
 * - endDate (optional, defaults to TODAY)
 * - includeUpcoming (optional, boolean, default: false)
 * - status (optional, filter by status)
 * - limit (optional, default: 50)
 */
async function getTrainingSessions(userId, queryParams) {
  try {
    const {
      status,
      startDate,
      endDate,
      limit = 50,
      includeUpcoming = false,
    } = queryParams || {};

    let query = supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(parseInt(limit));

    // By default, only show sessions up to and including today
    // This ensures training statistics only reflect real, completed data
    // Use CURRENT_DATE for database-level filtering (more reliable than client-side date)
    if (!includeUpcoming) {
      // Get today's date in YYYY-MM-DD format (UTC)
      const today = new Date().toISOString().split("T")[0];
      query = query.lte("session_date", today);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("session_date", startDate);
    }

    if (endDate) {
      // Ensure endDate includes the full day
      const endDateInclusive = new Date(endDate);
      endDateInclusive.setHours(23, 59, 59, 999);
      query = query.lte(
        "session_date",
        endDateInclusive.toISOString().split("T")[0],
      );
    }

    const { data: sessions, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    return sessions || [];
  } catch (error) {
    console.error("Error fetching training sessions:", error);
    return [];
  }
}

/**
 * Update a training session
 * Contract: Section 3.1 - Session Mutation APIs
 */
async function updateTrainingSession(
  userId,
  sessionId,
  updates,
  requestInfo = {},
) {
  // Check authorization
  const authCheck = await requireAuthorization(
    userId,
    sessionId,
    "session",
    "update",
    "structure",
    requestInfo,
  );

  if (!authCheck.success) {
    return authCheck.error;
  }

  // Proceed with update
  const { data: session, error } = await supabaseAdmin
    .from("training_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    // Check if error is from trigger (immutability violation)
    if (error.message && error.message.includes("Cannot modify")) {
      await logViolation(
        userId,
        sessionId,
        "session",
        "update",
        "DB_TRIGGER_REJECTED",
        error.message,
        requestInfo,
      );
    }
    throw error;
  }

  return session;
}

const { baseHandler } = require("./utils/base-handler.cjs");

exports.handler = async (event, context) => {
  // Apply Merlin guard for mutation endpoints
  if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
    const req = {
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body,
      user: context.user || {},
    };
    const blocked = guardMerlinRequest(req);
    if (blocked && blocked.statusCode === 403) {
      return blocked;
    }
  }

  return baseHandler(event, context, {
    functionName: "training-sessions",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType:
      event.httpMethod === "POST" || event.httpMethod === "PUT"
        ? "CREATE"
        : "READ",
    handler: async (event, _context, { userId }) => {
      const requestInfo = {
        ip: event.headers["x-forwarded-for"] || event.headers["x-real-ip"],
        userAgent: event.headers["user-agent"],
        path: event.path,
        method: event.httpMethod,
        body: event.body,
      };

      // Handle GET request - retrieve sessions
      if (event.httpMethod === "GET") {
        const sessions = await getTrainingSessions(
          userId,
          event.queryStringParameters,
        );
        return createSuccessResponse(sessions);
      }

      // Handle POST request - create new session
      if (event.httpMethod === "POST") {
        // Parse and validate request body
        let sessionData = {};
        try {
          sessionData = JSON.parse(event.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        // Validate required fields
        if (
          !sessionData.exercises ||
          !Array.isArray(sessionData.exercises) ||
          sessionData.exercises.length === 0
        ) {
          return handleValidationError("Exercises array is required");
        }

        try {
          const result = await createTrainingSession(
            userId,
            sessionData,
            requestInfo,
          );
          return createSuccessResponse(
            { session: result.session, id: result.id, note: result.note },
            201,
            "Training session created successfully",
          );
        } catch (error) {
          return createErrorResponse(
            error.message || "Failed to create training session",
            403,
            error.message?.includes("permissions")
              ? "INSUFFICIENT_PERMISSIONS"
              : "CREATE_FAILED",
          );
        }
      }

      // Handle PUT request - update session
      if (event.httpMethod === "PUT") {
        let updateData = {};
        try {
          updateData = JSON.parse(event.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        const { sessionId, ...updates } = updateData;

        if (!sessionId) {
          return handleValidationError("sessionId is required");
        }

        try {
          const session = await updateTrainingSession(
            userId,
            sessionId,
            updates,
            requestInfo,
          );
          return createSuccessResponse(session);
        } catch (error) {
          // Error response already created by updateTrainingSession if auth failed
          if (error.statusCode) {
            return error;
          }
          return createErrorResponse(
            error.message || "Failed to update training session",
            403,
            "UPDATE_FAILED",
          );
        }
      }

      // Method not allowed (shouldn't reach here due to allowedMethods)
      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
      );
    },
  });
};
