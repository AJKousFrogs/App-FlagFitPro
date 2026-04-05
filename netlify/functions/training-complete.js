import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Training Complete API
// Handles marking training sessions as completed
// Endpoint: /api/training/complete

import { baseHandler } from "./utils/base-handler.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.training-complete" });

function parseOptionalBoundedNumber(value, { field, min, max, integer = false }) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`${field} must be a number between ${min} and ${max}`);
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${field} must be a number between ${min} and ${max}`);
  }
  if (integer && !Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseCompletionPayload(body) {
  const sessionIdRaw = body.sessionId ?? body.session_id;
  if (
    sessionIdRaw === undefined ||
    sessionIdRaw === null ||
    String(sessionIdRaw).trim().length === 0
  ) {
    throw new Error("sessionId is required");
  }

  const sessionId = String(sessionIdRaw).trim();
  const duration = parseOptionalBoundedNumber(body.duration, {
    field: "duration",
    min: 1,
    max: 600,
    integer: true,
  });
  const intensity = parseOptionalBoundedNumber(body.intensity, {
    field: "intensity",
    min: 1,
    max: 10,
  });
  const rpe = parseOptionalBoundedNumber(body.rpe, {
    field: "rpe",
    min: 1,
    max: 10,
  });
  const workload = parseOptionalBoundedNumber(body.workload, {
    field: "workload",
    min: 1,
    max: 10000,
  });
  const notes =
    body.notes === undefined || body.notes === null ? undefined : body.notes;
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 2000)) {
    throw new Error("notes must be a string up to 2000 characters");
  }
  if (
    body.metrics !== undefined &&
    (body.metrics === null ||
      typeof body.metrics !== "object" ||
      Array.isArray(body.metrics))
  ) {
    throw new Error("metrics must be an object when provided");
  }

  return {
    sessionId,
    completionData: {
      duration,
      intensity,
      workload,
      rpe,
      notes,
      metrics: body.metrics,
    },
  };
}

/**
 * Award points for completing a training session
 * Points are based on duration and intensity
 */
async function awardTrainingPoints(userId, duration, intensity, log = logger) {
  // Base points: 5 per 15 minutes + bonus for high intensity
  const basePoints = Math.floor(duration / 15) * 5;
  const intensityBonus = intensity >= 7 ? 10 : intensity >= 5 ? 5 : 0;
  const totalPoints = basePoints + intensityBonus;

  if (totalPoints <= 0) {
    return { points: 0 };
  }

  try {
    // Check if user has sponsor_rewards record
    const { data: existing } = await supabaseAdmin
      .from("sponsor_rewards")
      .select("id, available_points")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing record
      await supabaseAdmin
        .from("sponsor_rewards")
        .update({
          available_points: existing.available_points + totalPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new record
      await supabaseAdmin.from("sponsor_rewards").insert({
        user_id: userId,
        available_points: totalPoints,
        current_tier: "BRONZE",
        tier_progress_percentage: 0,
      });
    }

    log.info("training_points_awarded", {
      user_id: userId,
      duration_minutes: duration,
      intensity,
      points_awarded: totalPoints,
    });
    return { points: totalPoints };
  } catch (error) {
    log.warn(
      "training_points_award_failed",
      {
        user_id: userId,
      },
      error,
    );
    return { points: 0 };
  }
}

/**
 * Create a notification for training completion
 */
async function createCompletionNotification(
  userId,
  sessionType,
  points,
  log = logger,
) {
  try {
    const message =
      points > 0
        ? `🎉 Great job completing your ${sessionType || "training"} session! You earned ${points} points.`
        : `🎉 Great job completing your ${sessionType || "training"} session!`;

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      notification_type: "training",
      message,
      priority: "normal",
    });
  } catch (error) {
    log.warn(
      "training_completion_notification_failed",
      {
        user_id: userId,
        session_type: sessionType,
      },
      error,
    );
  }
}

/**
 * Ensure workout_logs entry exists for ACWR calculations
 */
async function syncWorkoutLog(
  userId,
  sessionId,
  workoutType,
  plannedDate,
  completedAt,
  rpe,
  durationMinutes,
  log = logger,
) {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("workout_logs")
      .select("id")
      .eq("player_id", userId)
      .eq("source_session_id", sessionId)
      .maybeSingle();

    if (fetchError) {
      log.warn(
        "training_workout_log_check_failed",
        {
          user_id: userId,
          session_id: sessionId,
        },
        fetchError,
      );
      return false;
    }

    if (existing) {
      return false;
    }

    const { error: insertError } = await supabaseAdmin
      .from("workout_logs")
      .insert({
        player_id: userId,
        source_session_id: sessionId,
        workout_type: workoutType || "scheduled",
        planned_date: plannedDate || completedAt.slice(0, 10),
        completed_at: completedAt,
        rpe: rpe ?? null,
        duration_minutes: durationMinutes,
      });

    if (insertError) {
      log.warn(
        "training_workout_log_sync_failed",
        {
          user_id: userId,
          session_id: sessionId,
        },
        insertError,
      );
      return false;
    }

    log.info("training_workout_log_synced", {
      user_id: userId,
      session_id: sessionId,
    });
    return true;
  } catch (error) {
    log.warn(
      "training_workout_log_sync_exception",
      {
        user_id: userId,
        session_id: sessionId,
      },
      error,
    );
    return false;
  }
}

async function completeTrainingSessionViaRpc(userId, sessionId, completionData) {
  const { data, error } = await supabaseAdmin.rpc("complete_training_session", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_duration_minutes: completionData.duration ?? null,
    p_intensity_level: completionData.intensity ?? null,
    p_rpe: completionData.rpe ?? null,
    p_workload: completionData.workload ?? null,
    p_notes: completionData.notes ?? null,
  });

  if (error) {
    return { data: null, error };
  }

  return {
    data: Array.isArray(data) ? data[0] || null : data,
    error: null,
  };
}

/**
 * Mark a training session as completed
 * Updates session status and calculates workload
 */
async function completeTrainingSession(
  userId,
  sessionId,
  completionData,
  log = logger,
) {
  try {
    // Get the session first to verify ownership
    const { data: session, error: fetchError } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: "Training session not found or access denied",
      };
    }

    // Calculate workload if not provided.
    // Prefer explicit completion payload, then session values.
    const duration = completionData.duration ?? session.duration_minutes ?? null;
    const intensity =
      completionData.intensity ?? session.intensity_level ?? null;
    const rpe =
      completionData.rpe !== undefined && completionData.rpe !== null
        ? completionData.rpe
        : session.rpe;

    const workloadFromPayload =
      completionData.workload !== undefined && completionData.workload !== null
        ? completionData.workload
        : null;
    const computedWorkload =
      workloadFromPayload !== null
        ? workloadFromPayload
        : rpe !== undefined && rpe !== null && duration !== null
          ? Math.round(rpe * duration)
          : duration !== null && intensity !== null
            ? Math.round((duration * intensity) / 10)
            : null;

    if (computedWorkload === null) {
      return {
        success: false,
        statusCode: 422,
        error:
          "Unable to compute workload. Provide workload, or provide duration with rpe/intensity.",
      };
    }

    const rpcResult = await completeTrainingSessionViaRpc(
      userId,
      sessionId,
      completionData,
    );

    if (!rpcResult.error) {
      const { data: updatedSession, error: refreshError } = await supabaseAdmin
        .from("training_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (refreshError || !updatedSession) {
        throw refreshError || new Error("Failed to reload completed session");
      }

      const pointsResult = await awardTrainingPoints(
        userId,
        duration || 0,
        intensity || 0,
        log,
      );

      await createCompletionNotification(
        userId,
        updatedSession.session_type,
        pointsResult.points,
        log,
      );

      log.info("training_completion_rpc_succeeded", {
        user_id: userId,
        session_id: sessionId,
        workload: rpcResult.data?.workload ?? computedWorkload,
      });

      return {
        success: true,
        session: updatedSession,
        workload: rpcResult.data?.workload ?? computedWorkload,
        pointsEarned: pointsResult.points,
      };
    }

    if (rpcResult.error.code !== "PGRST202") {
      log.error("training_completion_rpc_failed", rpcResult.error, {
        user_id: userId,
        session_id: sessionId,
      });
      throw rpcResult.error;
    }

    // Update session with completion data
    const completedAt = new Date().toISOString();
    const updateData = {
      status: "completed",
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
      workload: computedWorkload,
      // Update duration and intensity if provided
      ...(completionData.duration !== undefined && {
        duration_minutes: completionData.duration,
      }),
      ...(completionData.intensity !== undefined && {
        intensity_level: completionData.intensity,
      }),
      // Store completion notes if provided
      ...(completionData.notes && {
        notes: `${session.notes || ""}\n\nCompleted: ${completionData.notes}`,
      }),
      ...(rpe !== undefined &&
        rpe !== null && {
          rpe,
        }),
    };

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from("training_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      log.error("training_session_update_failed", updateError, {
        user_id: userId,
        session_id: sessionId,
      });
      throw updateError;
    }

    // Ensure workout_logs entry exists for ACWR calculations
    await syncWorkoutLog(
      userId,
      sessionId,
      session.session_type,
      session.session_date,
      completedAt,
      rpe,
      duration,
      log,
    );

    // Award points for completing the session
    const pointsResult = await awardTrainingPoints(
      userId,
      duration || 0,
      intensity || 0,
      log,
    );

    // Create completion notification
    await createCompletionNotification(
      userId,
      session.workout_type,
      pointsResult.points,
      log,
    );

    log.info("training_completion_fallback_succeeded", {
      user_id: userId,
      session_id: sessionId,
      workload: computedWorkload,
      points_earned: pointsResult.points,
    });

    return {
      success: true,
      session: updatedSession,
      workload: computedWorkload,
      pointsEarned: pointsResult.points,
    };
  } catch (error) {
    log.error("training_completion_failed", error, {
      user_id: userId,
      session_id: sessionId,
    });
    throw error;
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId, requestId, correlationId }) {
  const requestLogger = logger.child(
    buildRequestLogContext(event, {
      function_name: "training-complete",
      user_id: userId,
      request_id: requestId,
      correlation_id: correlationId,
      trace_id: correlationId,
    }),
  );

  try {
    requestLogger.info("training_completion_request_started", {
      body_length: event.body?.length,
    });

    // Only POST is allowed for completing sessions
    if (event.httpMethod !== "POST") {
      return createErrorResponse("Method not allowed. Use POST.", 405);
    }

    // Parse and validate request body
    let parsedPayload;
    try {
      parsedPayload = parseCompletionPayload(parseJsonObjectBody(event.body));
    } catch (validationError) {
      if (
        validationError?.code === "INVALID_JSON_BODY" &&
        validationError?.message === "Invalid JSON in request body"
      ) {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
        );
      }
      return createErrorResponse(
        validationError.message,
        422,
        "validation_error",
      );
    }
    const { sessionId, completionData } = parsedPayload;

    // Complete the session
    const result = await completeTrainingSession(
      userId,
      sessionId,
      completionData,
      requestLogger.child({
        session_id: sessionId,
      }),
    );

    if (!result.success) {
      return createErrorResponse(
        result.error || "Failed to complete training session",
        result.statusCode || 400,
      );
    }

    requestLogger.info("training_completion_request_succeeded", {
      session_id: sessionId,
      points_earned: result.pointsEarned || 0,
      workload: result.workload,
    });

    return createSuccessResponse({
      session: result.session,
      workload: result.workload,
      pointsEarned: result.pointsEarned || 0,
      message: "Training session completed successfully",
    });
  } catch (error) {
    requestLogger.error("training_completion_request_failed", error, {
      user_id: userId,
    });
    throw error;
  }
}

const handler = async (event, context) => {
  // Apply Merlin guard - POST is mutation
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

  return baseHandler(event, context, {
    functionName: "Training-Complete",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: handleRequest,
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
