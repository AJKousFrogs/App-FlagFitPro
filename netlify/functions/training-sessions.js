import { parseJsonObjectBody, validateInput } from "./utils/input-validator.js";
import { createSuccessResponse, createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { requireAuthorization, getUserRole, logViolation } from "./utils/authorization-guard.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";
import { prepareStateTransition } from "./utils/session-state-helper.js";
import { baseHandler } from "./utils/base-handler.js";
import { hasAnyRole, TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";

// Netlify Function: Training Sessions API
// Handles creation and retrieval of training sessions for the Training Builder component
// Endpoint: /api/training/sessions

// Note: authenticateRequest, applyRateLimit, and CORS are handled by baseHandler
const TRAINING_SESSION_UPDATE_FIELDS = new Set([
  "session_date",
  "session_type",
  "duration_minutes",
  "intensity_level",
  "status",
  "session_state",
  "notes",
  "rpe",
  "metadata",
  "transition_reason",
]);
const VALID_SESSION_STATUSES = new Set([
  "planned",
  "in_progress",
  "completed",
  "skipped",
  "deleted",
]);

function parseBoundedInt(value, fieldName, { min, max }) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function sanitizeSessionUpdates(updates = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(updates)) {
    if (TRAINING_SESSION_UPDATE_FIELDS.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Create a training session from the Training Builder
 * Contract: Section 3.1 - Session Mutation APIs
 */
async function createTrainingSession(
  userId,
  sessionData,
  requestInfo = {},
  supabase,
) {
  try {
    if (!supabase) {
      throw new Error("Supabase client is required for RLS enforcement");
    }
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

    const validation = validateTrainingBuilderPayload(sessionData);
    if (!validation.valid) {
      throw buildValidationError(validation.errors);
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
    if (finalUserId !== userId && !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
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
    const computedDuration = exercises.reduce(
      (sum, ex) => sum + (ex.duration || 0),
      0,
    );
    const totalDuration = duration || computedDuration || 60;

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
    const { data: session, error } = await supabase
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

function normalizeTrainingLogPayload(sessionData = {}) {
  const sessionDateRaw =
    sessionData.session_date || sessionData.sessionDate || sessionData.date;
  const sessionType =
    sessionData.session_type || sessionData.sessionType || sessionData.type;
  const durationRaw =
    sessionData.duration_minutes ||
    sessionData.durationMinutes ||
    sessionData.duration;
  const rpeRaw =
    sessionData.rpe ?? sessionData.sessionRpe ?? sessionData.actualRpe;
  const notes = sessionData.notes ?? sessionData.sessionNotes ?? null;
  const status = sessionData.status || "completed";

  const sessionDate = sessionDateRaw
    ? new Date(sessionDateRaw).toISOString().split("T")[0]
    : null;
  const durationMinutes =
    durationRaw !== undefined && durationRaw !== null
      ? Number(durationRaw)
      : null;
  const rpe = rpeRaw !== undefined && rpeRaw !== null ? Number(rpeRaw) : null;

  return {
    sessionDate,
    sessionType,
    durationMinutes,
    rpe,
    notes,
    status,
  };
}

function isTrainingLogPayload(sessionData = {}) {
  const normalized = normalizeTrainingLogPayload(sessionData);
  return (
    Boolean(normalized.sessionDate) &&
    Boolean(normalized.sessionType) &&
    normalized.durationMinutes !== null
  );
}

function validateTrainingLogPayload(payload) {
  const schema = {
    sessionDate: { type: "date", required: true },
    sessionType: {
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 120,
    },
    durationMinutes: {
      type: "number",
      required: true,
      min: 1,
      max: 600,
      integer: true,
    },
    rpe: { type: "number", min: 0, max: 10 },
    notes: { type: "string", maxLength: 2000 },
    status: {
      type: "enum",
      values: ["completed", "in_progress", "planned"],
    },
  };

  const result = validateInput(payload, schema);
  return {
    valid: result.valid,
    errors: result.errors,
    cleaned: result.cleaned,
  };
}

function validateTrainingBuilderPayload(sessionData = {}) {
  const errors = [];
  const schema = {
    intensity: { type: "enum", values: ["low", "medium", "high"] },
    duration: { type: "number", min: 1, max: 600, integer: true },
    scheduledDate: { type: "date" },
    notes: { type: "string", maxLength: 2000 },
    user_id: { type: "uuid" },
  };

  const baseValidation = validateInput(sessionData, schema);
  if (!baseValidation.valid) {
    errors.push(...baseValidation.errors);
  }

  if (
    !Array.isArray(sessionData.exercises) ||
    sessionData.exercises.length === 0
  ) {
    errors.push("exercises must be a non-empty array");
  } else if (sessionData.exercises.length > 50) {
    errors.push("exercises must have at most 50 items");
  } else {
    sessionData.exercises.forEach((exercise, index) => {
      if (
        typeof exercise !== "object" ||
        exercise === null ||
        Array.isArray(exercise)
      ) {
        errors.push(`exercises[${index}] must be an object`);
        return;
      }
      const durationValue =
        exercise.duration ??
        exercise.duration_minutes ??
        exercise.durationMinutes;
      const durationNumber =
        typeof durationValue === "string"
          ? Number(durationValue)
          : durationValue;
      if (
        durationValue !== undefined &&
        (typeof durationNumber !== "number" ||
          Number.isNaN(durationNumber) ||
          durationNumber < 1 ||
          durationNumber > 240)
      ) {
        errors.push(`exercises[${index}].duration must be between 1 and 240`);
      }
      const nameValue =
        exercise.name ?? exercise.title ?? exercise.exercise_name ?? null;
      if (
        nameValue &&
        typeof nameValue === "string" &&
        nameValue.length > 200
      ) {
        errors.push(`exercises[${index}].name must be at most 200 characters`);
      }
    });
  }

  if (sessionData.goals !== undefined) {
    if (!Array.isArray(sessionData.goals)) {
      errors.push("goals must be an array");
    } else if (sessionData.goals.length > 10) {
      errors.push("goals must have at most 10 items");
    } else {
      sessionData.goals.forEach((goal, index) => {
        if (typeof goal !== "string" || goal.trim().length === 0) {
          errors.push(`goals[${index}] must be a non-empty string`);
        } else if (goal.length > 120) {
          errors.push(`goals[${index}] must be at most 120 characters`);
        }
      });
    }
  }

  if (sessionData.equipment !== undefined) {
    if (!Array.isArray(sessionData.equipment)) {
      errors.push("equipment must be an array");
    } else if (sessionData.equipment.length > 20) {
      errors.push("equipment must have at most 20 items");
    } else {
      sessionData.equipment.forEach((item, index) => {
        if (typeof item !== "string" || item.trim().length === 0) {
          errors.push(`equipment[${index}] must be a non-empty string`);
        } else if (item.length > 120) {
          errors.push(`equipment[${index}] must be at most 120 characters`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function buildValidationError(errors) {
  const error = new Error("Validation failed");
  error.details = errors;
  return error;
}

async function createTrainingLogSession(
  userId,
  sessionData,
  requestInfo = {},
  supabase,
) {
  try {
    if (!supabase) {
      throw new Error("Supabase client is required for RLS enforcement");
    }
    const payload = normalizeTrainingLogPayload(sessionData);

    const validation = validateTrainingLogPayload(payload);
    if (!validation.valid) {
      throw buildValidationError(validation.errors);
    }
    const { cleaned } = validation;

    const sessionRecord = {
      user_id: userId,
      session_date: cleaned.sessionDate,
      session_type: cleaned.sessionType,
      duration_minutes: cleaned.durationMinutes,
      rpe: cleaned.rpe ?? null,
      notes: cleaned.notes ?? null,
      status: cleaned.status || "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: session, error } = await supabase
      .from("training_sessions")
      .insert(sessionRecord)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        return {
          success: true,
          session: {
            ...sessionRecord,
            id: `temp_${Date.now()}`,
          },
          note: "Table needs to be created via migration",
          workoutLogSynced: false,
        };
      }
      throw error;
    }

    let workoutLogSynced = false;
    if (session?.id) {
      const completedAt = payload.sessionDate
        ? new Date(payload.sessionDate).toISOString()
        : new Date().toISOString();
      const { error: logError } = await supabase.from("workout_logs").insert({
        player_id: userId,
        source_session_id: session.id,
        workout_type: payload.sessionType || "scheduled",
        planned_date: payload.sessionDate || completedAt.slice(0, 10),
        completed_at: completedAt,
        rpe: payload.rpe ?? null,
        duration_minutes: payload.durationMinutes,
      });
      if (!logError) {
        workoutLogSynced = true;
      }
    }

    return { success: true, session, workoutLogSynced };
  } catch (error) {
    if (error.message) {
      await logViolation(
        userId,
        null,
        "session",
        "create",
        "TRAINING_LOG_FAILED",
        error.message,
        requestInfo,
      );
    }
    throw error;
  }
}

function extractSessionIdFromPath(path = "") {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  const last = parts[parts.length - 1];
  return last && last !== "training-sessions" ? last : null;
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
async function getTrainingSessions(userId, queryParams, supabase) {
  const { limit = 50 } = queryParams || {};
  const parsedLimit = parseBoundedInt(limit, "limit", { min: 1, max: 200 }) || 50;

  try {
    if (!supabase) {
      throw new Error("Supabase client is required for RLS enforcement");
    }
    const {
      status,
      startDate,
      endDate,
      includeUpcoming = false,
    } = queryParams || {};

    let query = supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(parsedLimit);

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
  supabase,
) {
  if (!supabase) {
    throw new Error("Supabase client is required for RLS enforcement");
  }
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

  // Prepare state transition metadata if state is being changed
  const sanitizedUpdates = sanitizeSessionUpdates(updates);
  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error("No valid updatable fields provided");
  }
  if (
    sanitizedUpdates.status !== undefined &&
    !VALID_SESSION_STATUSES.has(sanitizedUpdates.status)
  ) {
    throw new Error(
      `Invalid status. Allowed: ${Array.from(VALID_SESSION_STATUSES).join(", ")}`,
    );
  }
  let updatePayload = {
    ...sanitizedUpdates,
    updated_at: new Date().toISOString(),
  };

  // If session_state is being updated, add transition metadata
  if (sanitizedUpdates.session_state) {
    const role = await getUserRole(userId);
    const actorRole =
      role === "coach" ? "coach" : role === "admin" ? "admin" : "athlete";

    const stateTransition = prepareStateTransition({
      newState: updates.session_state,
      actorRole,
      actorId: userId,
      reason: sanitizedUpdates.transition_reason || "Session state updated",
      metadata: sanitizedUpdates.metadata || {},
    });

    updatePayload = {
      ...updatePayload,
      session_state: stateTransition.session_state,
      metadata: stateTransition.metadata,
    };
  }

  // Proceed with update
  const { data: session, error } = await supabase
    .from("training_sessions")
    .update(updatePayload)
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

const handler = async (event, context) => {
  // Apply Merlin guard for mutation endpoints
  if (
    event.httpMethod === "POST" ||
    event.httpMethod === "PUT" ||
    event.httpMethod === "DELETE"
  ) {
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
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType:
      event.httpMethod === "POST" ||
      event.httpMethod === "PUT" ||
      event.httpMethod === "DELETE"
        ? "CREATE"
        : "READ",
    requireAuth: true, // SECURITY: Explicit auth for training sessions
    handler: async (event, _context, { userId, supabase }) => {
      const requestInfo = {
        ip: event.headers["x-forwarded-for"] || event.headers["x-real-ip"],
        userAgent: event.headers["user-agent"],
        path: event.path,
        method: event.httpMethod,
        body: event.body,
      };

      // Handle GET request - retrieve sessions
      if (event.httpMethod === "GET") {
        try {
          const sessions = await getTrainingSessions(
            userId,
            event.queryStringParameters,
            supabase,
          );
          return createSuccessResponse(sessions);
        } catch (error) {
          if (error.message?.includes("must be an integer between")) {
            return handleValidationError(error.message);
          }
          throw error;
        }
      }

      // Handle POST request - create new session
      if (event.httpMethod === "POST") {
        // Parse and validate request body
        let sessionData = {};
        try {
          sessionData = parseJsonObjectBody(event.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        try {
          if (isTrainingLogPayload(sessionData)) {
            const result = await createTrainingLogSession(
              userId,
              sessionData,
              requestInfo,
              supabase,
            );
            return createSuccessResponse(
              {
                session: result.session,
                workoutLogSynced: result.workoutLogSynced,
                note: result.note,
              },
              201,
              "Training session logged successfully",
            );
          }

          // Validate required fields for builder sessions
          if (
            !sessionData.exercises ||
            !Array.isArray(sessionData.exercises) ||
            sessionData.exercises.length === 0
          ) {
            return handleValidationError("Exercises array is required");
          }

          const result = await createTrainingSession(
            userId,
            sessionData,
            requestInfo,
            supabase,
          );
          return createSuccessResponse(
            { session: result.session, id: result.id, note: result.note },
            201,
            "Training session created successfully",
          );
        } catch (error) {
          if (error.details) {
            return handleValidationError(error.details);
          }
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
          updateData = parseJsonObjectBody(event.body);
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
            supabase,
          );
          return createSuccessResponse(session);
        } catch (error) {
          // Error response already created by updateTrainingSession if auth failed
          if (error.statusCode) {
            return error;
          }
          if (
            error.message?.includes("No valid updatable fields") ||
            error.message?.includes("Invalid status. Allowed")
          ) {
            return handleValidationError(error.message);
          }
          return createErrorResponse(
            error.message || "Failed to update training session",
            403,
            "UPDATE_FAILED",
          );
        }
      }

      if (event.httpMethod === "DELETE") {
        let deletePayload = {};
        try {
          deletePayload = parseJsonObjectBody(event.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        const sessionId =
          deletePayload.sessionId ||
          deletePayload.session_id ||
          event.queryStringParameters?.sessionId ||
          event.queryStringParameters?.session_id ||
          extractSessionIdFromPath(event.path);

        if (!sessionId) {
          return handleValidationError("sessionId is required");
        }

        try {
          const { data: session, error: fetchError } = await supabase
            .from("training_sessions")
            .select("id, user_id, coach_locked")
            .eq("id", sessionId)
            .maybeSingle();

          if (fetchError) {
            throw fetchError;
          }

          if (!session || session.user_id !== userId) {
            return createErrorResponse(
              "Training session not found or you don't have permission to delete it",
              404,
              "NOT_FOUND",
            );
          }

          if (session.coach_locked) {
            return createErrorResponse(
              "Cannot delete: session is coach_locked",
              403,
              "COACH_LOCKED",
            );
          }

          const { error: updateError } = await supabase
            .from("training_sessions")
            .update({
              status: "deleted",
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("user_id", userId);

          if (updateError) {
            throw updateError;
          }

          return createSuccessResponse(
            { sessionId },
            200,
            "Training session deleted successfully",
          );
        } catch (error) {
          return createErrorResponse(
            error.message || "Failed to delete training session",
            500,
            "DELETE_FAILED",
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

export const testHandler = handler;
export { handler };
