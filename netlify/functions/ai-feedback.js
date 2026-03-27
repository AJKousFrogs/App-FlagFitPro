import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

/**
 * Netlify Function: AI Feedback
 *
 * Handles user feedback on AI responses for continuous improvement.
 * Stores feedback in the ai_feedback table for analysis.
 */

// Valid feedback types
const VALID_FEEDBACK_TYPES = [
  "thumbs_up",
  "thumbs_down",
  "helpful",
  "not_helpful",
  "incorrect",
  "unsafe",
  "irrelevant",
];

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "ai-feedback",
    allowedMethods: ["POST", "GET"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const method = event.httpMethod;

      if (method === "POST") {
        return handleCreateFeedback(event, userId, requestId);
      }

      if (method === "GET") {
        return handleGetFeedback(event, userId, requestId);
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
        requestId,
      );
    },
  });
};

/**
 * Create feedback for an AI message
 */
async function handleCreateFeedback(event, userId, requestId) {
  let body;
  try {
    body = parseJsonObjectBody(event.body);
  } catch (error) {
    if (error?.message === "Request body must be an object") {
      return createErrorResponse(
        "Request body must be an object",
        422,
        "validation_error",
        requestId,
      );
    }
    return createErrorResponse("Invalid JSON", 400, "invalid_json", requestId);
  }

  const {
    message_id,
    chat_session_id,
    feedback_type,
    feedback_reason,
    outcome,
  } = body;

  // Validate required fields
  if (typeof message_id !== "string" || !message_id.trim()) {
    return createErrorResponse(
      "message_id is required and must be a non-empty string",
      422,
      "validation_error",
      requestId,
    );
  }

  if (!feedback_type || !VALID_FEEDBACK_TYPES.includes(feedback_type)) {
    return createErrorResponse(
      `Invalid feedback_type. Must be one of: ${VALID_FEEDBACK_TYPES.join(", ")}`,
      422,
      "validation_error",
      requestId,
    );
  }

  try {
    // Ensure the feedback target message belongs to the caller.
    const { data: targetMessage, error: targetMessageError } = await supabaseAdmin
      .from("ai_messages")
      .select("id, user_id")
      .eq("id", message_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (targetMessageError) {
      console.error("[AI Feedback] Message ownership check error:", targetMessageError);
      return createErrorResponse(
        "Failed to validate message",
        500,
        "database_error",
        requestId,
      );
    }
    if (!targetMessage) {
      return createErrorResponse(
        "Not authorized to submit feedback for this message",
        403,
        "authorization_error",
        requestId,
      );
    }

    // Check if user already submitted feedback for this message
    const { data: existingFeedback } = await supabaseAdmin
      .from("ai_feedback")
      .select("id")
      .eq("message_id", message_id)
      .eq("user_id", userId)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("ai_feedback")
        .update({
          feedback_type,
          feedback_reason: feedback_reason || null,
          outcome: outcome || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFeedback.id)
        .select()
        .single();

      if (updateError) {
        console.error("[AI Feedback] Update error:", updateError);
        return createErrorResponse(
          "Failed to update feedback",
          500,
          "database_error",
          requestId,
        );
      }

      return createSuccessResponse(
        {
          id: updated.id,
          message: "Feedback updated successfully",
        },
        requestId,
      );
    }

    // Insert new feedback
    const { data: feedback, error: insertError } = await supabaseAdmin
      .from("ai_feedback")
      .insert({
        user_id: userId,
        message_id,
        chat_session_id: chat_session_id || null,
        feedback_type,
        feedback_reason: feedback_reason || null,
        outcome: outcome || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[AI Feedback] Insert error:", insertError);
      return createErrorResponse(
        "Failed to save feedback",
        500,
        "database_error",
        requestId,
      );
    }

    // Log for analytics
    console.log(
      `[AI Feedback] New feedback: ${feedback_type} for message ${message_id}`,
    );

    return createSuccessResponse(
      {
        id: feedback.id,
        message: "Feedback submitted successfully",
      },
      requestId,
    );
  } catch (error) {
    console.error("[AI Feedback] Error:", error);
    return createErrorResponse(
      "Failed to process feedback",
      500,
      "internal_error",
      requestId,
    );
  }
}

/**
 * Get feedback statistics (for admin/analytics)
 */
async function handleGetFeedback(event, userId, requestId) {
  const params = event.queryStringParameters || {};
  const { message_id, session_id, stats } = params;

  try {
    // If requesting stats
    if (stats === "true") {
      const { data: feedbackStats, error: statsError } = await supabaseAdmin
        .rpc("get_ai_feedback_stats", { p_user_id: userId })
        .single();

      if (statsError) {
        // Fallback to manual aggregation if RPC doesn't exist
        const { data: allFeedback, error: fetchError } = await supabaseAdmin
          .from("ai_feedback")
          .select("feedback_type")
          .eq("user_id", userId);

        if (fetchError) {
          return createErrorResponse(
            "Failed to fetch feedback stats",
            500,
            "database_error",
            requestId,
          );
        }

        const stats = {
          total: allFeedback?.length || 0,
          thumbs_up:
            allFeedback?.filter((f) => f.feedback_type === "thumbs_up")
              .length || 0,
          thumbs_down:
            allFeedback?.filter((f) => f.feedback_type === "thumbs_down")
              .length || 0,
          helpful:
            allFeedback?.filter((f) => f.feedback_type === "helpful").length ||
            0,
          not_helpful:
            allFeedback?.filter((f) => f.feedback_type === "not_helpful")
              .length || 0,
          incorrect:
            allFeedback?.filter((f) => f.feedback_type === "incorrect")
              .length || 0,
          unsafe:
            allFeedback?.filter((f) => f.feedback_type === "unsafe").length ||
            0,
          irrelevant:
            allFeedback?.filter((f) => f.feedback_type === "irrelevant")
              .length || 0,
        };

        return createSuccessResponse({ stats }, requestId);
      }

      return createSuccessResponse({ stats: feedbackStats }, requestId);
    }

    // Get feedback for specific message
    if (message_id) {
      const { data: feedback, error } = await supabaseAdmin
        .from("ai_feedback")
        .select("*")
        .eq("message_id", message_id)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        return createErrorResponse(
          "Failed to fetch feedback",
          500,
          "database_error",
          requestId,
        );
      }

      return createSuccessResponse({ feedback: feedback || null }, requestId);
    }

    // Get feedback for session
    if (session_id) {
      const { data: feedbackList, error } = await supabaseAdmin
        .from("ai_feedback")
        .select("*")
        .eq("chat_session_id", session_id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return createErrorResponse(
          "Failed to fetch feedback",
          500,
          "database_error",
          requestId,
        );
      }

      return createSuccessResponse({ feedback: feedbackList || [] }, requestId);
    }

    // Default: return recent feedback
    const { data: recentFeedback, error } = await supabaseAdmin
      .from("ai_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return createErrorResponse(
        "Failed to fetch feedback",
        500,
        "database_error",
        requestId,
      );
    }

    return createSuccessResponse({ feedback: recentFeedback || [] }, requestId);
  } catch (error) {
    console.error("[AI Feedback] Error:", error);
    return createErrorResponse(
      "Failed to process request",
      500,
      "internal_error",
      requestId,
    );
  }
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
