import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

/**
 * Netlify Function: Response Feedback
 *
 * Phase 4: API for collecting feedback on AI responses
 *
 * Endpoints:
 * - POST /api/response-feedback - Submit feedback (athlete thumbs up/down)
 * - POST /api/response-feedback/coach - Submit coach classification feedback
 * - GET /api/response-feedback/message/:id - Get feedback for a message
 * - GET /api/response-feedback/stats - Get feedback statistics (coach only)
 */

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Submit athlete feedback (simple helpful/not helpful)
 * @param {string} messageId - AI message ID
 * @param {string} userId - User ID
 * @param {boolean} wasHelpful - Whether response was helpful
 * @param {string} feedbackText - Optional feedback text
 * @param {string[]} categories - Optional feedback categories
 * @returns {Object} - Created feedback
 */
async function submitAthleteFeedback(
  messageId,
  userId,
  wasHelpful,
  feedbackText = null,
  categories = [],
) {
  // First, get the message to capture original values
  const { data: message, error: msgError } = await supabaseAdmin
    .from("ai_messages")
    .select("risk_level, intent_type, classification_confidence, session_id")
    .eq("id", messageId)
    .single();

  if (msgError) {
    throw new Error("Message not found");
  }

  // Create feedback record
  const { data: feedback, error } = await supabaseAdmin
    .from("ai_response_feedback")
    .insert({
      message_id: messageId,
      user_id: userId,
      session_id: message.session_id,
      feedback_source: "athlete",
      was_helpful: wasHelpful,
      feedback_text: feedbackText,
      feedback_categories: categories,
      original_risk_level: message.risk_level,
      original_intent: message.intent_type,
      original_confidence: message.classification_confidence,
    })
    .select()
    .single();

  if (error) {
    console.error("[Response Feedback] Error creating feedback:", error);
    throw error;
  }

  // Update the message to mark feedback received
  await supabaseAdmin
    .from("ai_messages")
    .update({
      feedback_received: true,
      feedback_helpful: wasHelpful,
    })
    .eq("id", messageId);

  // Update user preferences based on feedback
  await updateUserPreferencesFromFeedback(userId, wasHelpful);

  // Check for achievements
  await checkFeedbackAchievements(userId);

  return feedback;
}

/**
 * Submit coach feedback (detailed classification review)
 * @param {string} messageId - AI message ID
 * @param {string} coachId - Coach user ID
 * @param {Object} feedbackData - Coach feedback data
 * @returns {Object} - Created feedback
 */
async function submitCoachFeedback(messageId, coachId, feedbackData) {
  const {
    classificationAccuracy,
    suggestedRiskLevel,
    suggestedIntent,
    feedbackText,
  } = feedbackData;

  // Verify coach has access to this message (team member)
  const { data: message, error: msgError } = await supabaseAdmin
    .from("ai_messages")
    .select(
      `
      risk_level, 
      intent_type, 
      classification_confidence, 
      session_id,
      user_id
    `,
    )
    .eq("id", messageId)
    .single();

  if (msgError) {
    throw new Error("Message not found");
  }

  // Verify coach is on same team as athlete
  const { data: coachTeams } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", coachId)
    .in("role", ["coach", "assistant_coach"]);

  const { data: athleteTeam } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", message.user_id)
    .single();

  const coachTeamIds = (coachTeams || []).map((t) => t.team_id);
  if (athleteTeam && !coachTeamIds.includes(athleteTeam.team_id)) {
    throw new Error("Not authorized to review this message");
  }

  // Create feedback record
  const { data: feedback, error } = await supabaseAdmin
    .from("ai_response_feedback")
    .insert({
      message_id: messageId,
      user_id: coachId,
      session_id: message.session_id,
      feedback_source: "coach",
      classification_accuracy: classificationAccuracy,
      suggested_risk_level: suggestedRiskLevel,
      suggested_intent: suggestedIntent,
      feedback_text: feedbackText,
      original_risk_level: message.risk_level,
      original_intent: message.intent_type,
      original_confidence: message.classification_confidence,
    })
    .select()
    .single();

  if (error) {
    console.error("[Response Feedback] Error creating coach feedback:", error);
    throw error;
  }

  // Mark message as coach reviewed if not already
  await supabaseAdmin
    .from("ai_messages")
    .update({
      coach_reviewed_at: new Date().toISOString(),
      coach_reviewed_by: coachId,
      feedback_received: true,
    })
    .eq("id", messageId)
    .is("coach_reviewed_at", null);

  return feedback;
}

/**
 * Get feedback for a message
 * @param {string} messageId - AI message ID
 * @returns {Array} - Feedback records
 */
async function getMessageFeedback(messageId) {
  const { data, error } = await supabaseAdmin
    .from("ai_response_feedback")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Response Feedback] Error fetching feedback:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get feedback statistics for coach
 * @param {string} coachId - Coach user ID
 * @param {string} teamId - Team ID (optional)
 * @param {Object} options - Query options
 * @returns {Object} - Feedback statistics
 */
async function getFeedbackStats(coachId, teamId = null, options = {}) {
  const { dateFrom, dateTo } = options;

  // Get team members if team specified
  let teamMemberIds = [];
  if (teamId) {
    const { data: members } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("status", "active");
    teamMemberIds = (members || []).map((m) => m.user_id);
  } else {
    // Get all teams where coach is a coach
    const { data: coachTeams } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", coachId)
      .in("role", ["coach", "assistant_coach"]);

    if (coachTeams && coachTeams.length > 0) {
      const { data: members } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .in(
          "team_id",
          coachTeams.map((t) => t.team_id),
        )
        .eq("status", "active");
      teamMemberIds = (members || []).map((m) => m.user_id);
    }
  }

  // Build query for feedback
  let query = supabaseAdmin.from("ai_response_feedback").select("*");

  if (teamMemberIds.length > 0) {
    query = query.in("user_id", teamMemberIds);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data: feedback, error } = await query;

  if (error) {
    console.error("[Response Feedback] Error fetching stats:", error);
    throw error;
  }

  // Calculate statistics
  const stats = {
    total: feedback?.length || 0,
    bySource: {
      athlete: 0,
      coach: 0,
      parent: 0,
    },
    athleteFeedback: {
      helpful: 0,
      notHelpful: 0,
      helpfulRate: 0,
    },
    coachFeedback: {
      appropriate: 0,
      tooStrict: 0,
      tooLenient: 0,
      wrongIntent: 0,
      accuracyRate: 0,
    },
    topCategories: {},
    recentFeedback: [],
  };

  for (const fb of feedback || []) {
    // By source
    stats.bySource[fb.feedback_source] =
      (stats.bySource[fb.feedback_source] || 0) + 1;

    // Athlete feedback
    if (fb.feedback_source === "athlete") {
      if (fb.was_helpful === true) {
        stats.athleteFeedback.helpful++;
      } else if (fb.was_helpful === false) {
        stats.athleteFeedback.notHelpful++;
      }
    }

    // Coach feedback
    if (fb.feedback_source === "coach" && fb.classification_accuracy) {
      stats.coachFeedback[camelCase(fb.classification_accuracy)]++;
    }

    // Categories
    if (fb.feedback_categories) {
      for (const cat of fb.feedback_categories) {
        stats.topCategories[cat] = (stats.topCategories[cat] || 0) + 1;
      }
    }
  }

  // Calculate rates
  const totalAthlete =
    stats.athleteFeedback.helpful + stats.athleteFeedback.notHelpful;
  if (totalAthlete > 0) {
    stats.athleteFeedback.helpfulRate = Math.round(
      (stats.athleteFeedback.helpful / totalAthlete) * 100,
    );
  }

  const totalCoach =
    stats.coachFeedback.appropriate +
    stats.coachFeedback.tooStrict +
    stats.coachFeedback.tooLenient +
    stats.coachFeedback.wrongIntent;
  if (totalCoach > 0) {
    stats.coachFeedback.accuracyRate = Math.round(
      (stats.coachFeedback.appropriate / totalCoach) * 100,
    );
  }

  // Recent feedback (last 10)
  stats.recentFeedback = (feedback || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return stats;
}

/**
 * Update user preferences based on feedback
 * @param {string} userId - User ID
 * @param {boolean} wasHelpful - Whether response was helpful
 */
async function updateUserPreferencesFromFeedback(userId, wasHelpful) {
  try {
    const updateField = wasHelpful
      ? "helpful_responses"
      : "dismissed_responses";

    // Use raw SQL for increment
    await supabaseAdmin.rpc("increment_preference_counter", {
      p_user_id: userId,
      p_field: updateField,
    });
  } catch (error) {
    // Log but don't fail - preferences table might not exist yet
    console.log(
      "[Response Feedback] Could not update preferences:",
      error.message,
    );
  }
}

/**
 * Check and award feedback-related achievements
 * @param {string} userId - User ID
 */
async function checkFeedbackAchievements(userId) {
  try {
    // Count total feedback given
    const { count } = await supabaseAdmin
      .from("ai_response_feedback")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Award achievements based on feedback count
    if (count === 1) {
      await awardAchievement(
        userId,
        "first_feedback",
        "Voice Heard",
        "Gave your first AI response feedback",
        "learning",
        5,
      );
    } else if (count === 10) {
      await awardAchievement(
        userId,
        "feedback_10",
        "Feedback Champion",
        "Gave feedback on 10 AI responses",
        "learning",
        20,
      );
    }
  } catch (error) {
    console.log(
      "[Response Feedback] Could not check achievements:",
      error.message,
    );
  }
}

/**
 * Award an achievement to user
 */
async function awardAchievement(
  userId,
  achievementType,
  name,
  description,
  category,
  points,
) {
  try {
    await supabaseAdmin.from("athlete_achievements").upsert(
      {
        user_id: userId,
        achievement_type: achievementType,
        achievement_name: name,
        achievement_description: description,
        category,
        points_awarded: points,
        progress_target: 1,
        progress_current: 1,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,achievement_type",
        ignoreDuplicates: true,
      },
    );
  } catch (error) {
    console.log(
      "[Response Feedback] Could not award achievement:",
      error.message,
    );
  }
}

/**
 * Convert snake_case to camelCase
 */
function camelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "response-feedback",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "WRITE",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?response-feedback\/?/, "")
        .split("/")
        .filter(Boolean);
      const resource = pathParts[0] || "";
      const resourceId = pathParts[1] || null;

      try {
        // POST /api/response-feedback - Submit athlete feedback
        if (method === "POST" && !resource) {
          let body;
          try {
            body = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON",
              400,
              "invalid_json",
              requestId,
            );
          }

          const { messageId, wasHelpful, feedbackText, categories } = body;

          if (!messageId) {
            return createErrorResponse(
              "messageId is required",
              400,
              "validation_error",
              requestId,
            );
          }

          if (typeof wasHelpful !== "boolean") {
            return createErrorResponse(
              "wasHelpful must be boolean",
              400,
              "validation_error",
              requestId,
            );
          }

          const feedback = await submitAthleteFeedback(
            messageId,
            userId,
            wasHelpful,
            feedbackText,
            categories || [],
          );

          return createSuccessResponse(
            {
              feedback,
              message: "Feedback submitted successfully",
            },
            requestId,
          );
        }

        // POST /api/response-feedback/coach - Submit coach feedback
        if (method === "POST" && resource === "coach") {
          let body;
          try {
            body = JSON.parse(event.body || "{}");
          } catch {
            return createErrorResponse(
              "Invalid JSON",
              400,
              "invalid_json",
              requestId,
            );
          }

          const {
            messageId,
            classificationAccuracy,
            suggestedRiskLevel,
            suggestedIntent,
            feedbackText,
          } = body;

          if (!messageId) {
            return createErrorResponse(
              "messageId is required",
              400,
              "validation_error",
              requestId,
            );
          }

          if (!classificationAccuracy) {
            return createErrorResponse(
              "classificationAccuracy is required",
              400,
              "validation_error",
              requestId,
            );
          }

          const validAccuracies = [
            "appropriate",
            "too_strict",
            "too_lenient",
            "wrong_intent",
          ];
          if (!validAccuracies.includes(classificationAccuracy)) {
            return createErrorResponse(
              `classificationAccuracy must be one of: ${validAccuracies.join(", ")}`,
              400,
              "validation_error",
              requestId,
            );
          }

          const feedback = await submitCoachFeedback(messageId, userId, {
            classificationAccuracy,
            suggestedRiskLevel,
            suggestedIntent,
            feedbackText,
          });

          return createSuccessResponse(
            {
              feedback,
              message: "Coach feedback submitted successfully",
            },
            requestId,
          );
        }

        // GET /api/response-feedback/message/:id - Get feedback for message
        if (method === "GET" && resource === "message" && resourceId) {
          const feedback = await getMessageFeedback(resourceId);
          return createSuccessResponse({ feedback }, requestId);
        }

        // GET /api/response-feedback/stats - Get feedback statistics
        if (method === "GET" && resource === "stats") {
          const params = event.queryStringParameters || {};
          const stats = await getFeedbackStats(userId, params.team_id, {
            dateFrom: params.date_from,
            dateTo: params.date_to,
          });
          return createSuccessResponse(stats, requestId);
        }

        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        console.error("[Response Feedback] Error:", error);
        return createErrorResponse(
          error.message || "Failed to process feedback",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};
