import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Training Complete API
// Handles marking training sessions as completed
// Endpoint: /api/training/complete

import { baseHandler } from "./utils/base-handler.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./utils/supabase-client.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";

function parseJsonObjectBody(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    const error = new Error("Invalid JSON in request body");
    error.code = "invalid_json";
    throw error;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be an object");
  }
  return parsed;
}

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
async function awardTrainingPoints(userId, duration, intensity) {
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

    console.log(
      `[Training Complete] Awarded ${totalPoints} points to user ${userId}`,
    );
    return { points: totalPoints };
  } catch (error) {
    console.warn("[Training Complete] Could not award points:", error.message);
    return { points: 0 };
  }
}

/**
 * Create a notification for training completion
 */
async function createCompletionNotification(userId, sessionType, points) {
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
    console.warn(
      "[Training Complete] Could not create notification:",
      error.message,
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
) {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("workout_logs")
      .select("id")
      .eq("player_id", userId)
      .eq("source_session_id", sessionId)
      .maybeSingle();

    if (fetchError) {
      console.warn(
        "[Training Complete] Failed to check workout log:",
        fetchError.message,
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
      console.warn(
        "[Training Complete] Failed to sync workout log:",
        insertError.message,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Training Complete] Workout log sync error:", error.message);
    return false;
  }
}

/**
 * Mark a training session as completed
 * Updates session status and calculates workload
 */
async function completeTrainingSession(userId, sessionId, completionData) {
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
      // Store performance metrics if provided
      ...(completionData.metrics && { metrics: completionData.metrics }),
    };

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from("training_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating training session:", updateError);
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
    );

    // Award points for completing the session
    const pointsResult = await awardTrainingPoints(
      userId,
      duration || 0,
      intensity || 0,
    );

    // Create completion notification
    await createCompletionNotification(
      userId,
      session.workout_type,
      pointsResult.points,
    );

    return {
      success: true,
      session: updatedSession,
      workload: computedWorkload,
      pointsEarned: pointsResult.points,
    };
  } catch (error) {
    console.error("Error completing training session:", error);
    throw error;
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId }) {
  try {
    // Only POST is allowed for completing sessions
    if (event.httpMethod !== "POST") {
      return createErrorResponse("Method not allowed. Use POST.", 405);
    }

    // Parse and validate request body
    let parsedPayload;
    try {
      parsedPayload = parseCompletionPayload(parseJsonObjectBody(event.body));
    } catch (validationError) {
      if (validationError.code === "invalid_json") {
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
    );

    if (!result.success) {
      return createErrorResponse(
        result.error || "Failed to complete training session",
        result.statusCode || 400,
      );
    }

    return createSuccessResponse({
      session: result.session,
      workload: result.workload,
      pointsEarned: result.pointsEarned || 0,
      message: "Training session completed successfully",
    });
  } catch (error) {
    console.error("Error in training-complete handler:", error);
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
export default createRuntimeV2Handler(handler);
