// Netlify Function: Training Complete API
// Handles marking training sessions as completed
// Endpoint: /api/training/complete

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

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

    // Calculate workload if not provided
    // Workload = duration_minutes * intensity_level / 10
    const duration = completionData.duration || session.duration_minutes || 60;
    const intensity = completionData.intensity || session.intensity_level || 6;
    const workload =
      completionData.workload || Math.round((duration * intensity) / 10);

    // Update session with completion data
    const updateData = {
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workload: workload,
      // Update duration and intensity if provided
      ...(completionData.duration && {
        duration_minutes: completionData.duration,
      }),
      ...(completionData.intensity && {
        intensity_level: completionData.intensity,
      }),
      // Store completion notes if provided
      ...(completionData.notes && {
        notes: `${session.notes || ""}\n\nCompleted: ${completionData.notes}`,
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

    return {
      success: true,
      session: updatedSession,
      workload: workload,
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

    // Parse request body
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (_parseError) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    // Validate required fields
    if (!body.sessionId && !body.session_id) {
      return createErrorResponse("sessionId is required", 400);
    }

    const sessionId = body.sessionId || body.session_id;

    // Complete the session
    const result = await completeTrainingSession(userId, sessionId, {
      duration: body.duration,
      intensity: body.intensity,
      workload: body.workload,
      notes: body.notes,
      metrics: body.metrics,
    });

    if (!result.success) {
      return createErrorResponse(
        result.error || "Failed to complete training session",
        400,
      );
    }

    return createSuccessResponse({
      session: result.session,
      workload: result.workload,
      message: "Training session completed successfully",
    });
  } catch (error) {
    console.error("Error in training-complete handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Training-Complete",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: handleRequest,
  });
};
