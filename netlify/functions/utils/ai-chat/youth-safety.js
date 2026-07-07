import { supabaseAdmin } from "../../supabase-client.js";
import { createLogger } from "../structured-logger.js";
import { RISK_LEVELS } from "../ai-safety-classifier.js";

const logger = createLogger({ service: "netlify.ai-chat" });

// =====================================================
// PHASE 3: YOUTH HELPER FUNCTIONS
// =====================================================

/**
 * Get youth-specific settings for a user
 *
 * @param {string} userId - User ID
 * @returns {Object|null} Youth settings or null if not found
 */
export async function getYouthSettings(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("youth_athlete_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("ai_chat_youth_settings_fetch_failed", error, {
        user_id: userId,
      });
    }

    return data || null;
  } catch (error) {
    logger.error("ai_chat_youth_settings_handler_failed", error, {
      user_id: userId,
    });
    return null;
  }
}

/**
 * Get conversation history for pattern analysis
 *
 * @param {string} sessionId - Chat session ID
 * @param {number} limit - Max messages to retrieve
 * @returns {Array} Conversation history
 */
export async function getConversationHistory(sessionId, limit = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_messages")
      .select("role, content, created_at, intent, risk_level")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("ai_chat_conversation_history_fetch_failed", error, {
        session_id: sessionId,
      });
      return [];
    }

    // Return in chronological order
    return (data || []).reverse();
  } catch (error) {
    logger.error("ai_chat_conversation_history_handler_failed", error, {
      session_id: sessionId,
    });
    return [];
  }
}

export async function getSessionMessages(userId, sessionId) {
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("ai_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    logger.error("ai_chat_session_fetch_failed", sessionError, {
      session_id: sessionId,
      user_id: userId,
    });
    throw new Error("Failed to load chat session");
  }

  if (!session) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("ai_messages")
    .select(
      "id, role, content, created_at, risk_level, intent, citations, feedback_helpful, coach_reviewed_at, coach_reviewed_by, metadata",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    logger.error("ai_chat_session_messages_fetch_failed", messagesError, {
      session_id: sessionId,
      user_id: userId,
    });
    throw new Error("Failed to load chat messages");
  }

  return (messages || []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.created_at,
    riskLevel: message.risk_level || null,
    intent: message.intent || null,
    citations: Array.isArray(message.citations) ? message.citations : null,
    feedbackHelpful:
      typeof message.feedback_helpful === "boolean"
        ? message.feedback_helpful
        : null,
    coachReviewedAt: message.coach_reviewed_at || null,
    coachReviewedBy: message.coach_reviewed_by || null,
    metadata: message.metadata || null,
  }));
}

export async function getRecentSessions(userId, limit = 5) {
  const safeLimit = Math.max(1, Math.min(limit, 10));
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from("ai_chat_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(safeLimit);

  if (sessionsError) {
    logger.error("ai_chat_recent_sessions_fetch_failed", sessionsError, {
      user_id: userId,
    });
    throw new Error("Failed to load recent chat sessions");
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("ai_messages")
    .select("id, session_id, role, content, created_at, intent")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    logger.error(
      "ai_chat_recent_session_messages_fetch_failed",
      messagesError,
      {
        user_id: userId,
      },
    );
    throw new Error("Failed to load recent chat sessions");
  }

  const previewBySession = new Map();
  const countBySession = new Map();
  const topicIntentBySession = new Map();

  for (const message of messages || []) {
    countBySession.set(
      message.session_id,
      (countBySession.get(message.session_id) || 0) + 1,
    );

    if (!previewBySession.has(message.session_id)) {
      previewBySession.set(message.session_id, message);
    }

    if (
      message.role === "assistant" &&
      message.intent &&
      !topicIntentBySession.has(message.session_id)
    ) {
      topicIntentBySession.set(message.session_id, message.intent);
    }
  }

  return sessions.map((session) => {
    const preview = previewBySession.get(session.id);
    return {
      id: session.id,
      startedAt: session.started_at,
      messageCount: countBySession.get(session.id) || 0,
      preview: preview?.content || "",
      previewRole: preview?.role || null,
      previewIntent:
        topicIntentBySession.get(session.id) || preview?.intent || null,
      previewCreatedAt: preview?.created_at || null,
    };
  });
}

/**
 * Create parent notification for youth athlete interactions
 *
 * @param {string} youthId - Youth user ID
 * @param {string} notificationType - Type of notification
 * @param {string} title - Notification title
 * @param {string} summary - Notification summary
 * @param {string} sourceId - Source message/item ID
 */
export async function createYouthParentNotification(
  youthId,
  notificationType,
  title,
  summary,
  sourceId = null,
) {
  try {
    // Get verified parents for this youth
    const { data: parents, error: parentsError } = await supabaseAdmin
      .from("parent_guardian_links")
      .select(
        "parent_id, can_view_ai_chats, alert_on_high_risk, alert_on_supplement_topics, alert_on_injury_topics",
      )
      .eq("user_id", youthId)
      .eq("verified", true);

    if (parentsError || !parents || parents.length === 0) {
      logger.info("ai_chat_no_youth_parents_found", {
        youth_id: youthId,
        notification_type: notificationType,
      });
      return;
    }

    // Determine priority based on notification type
    let priority = "medium";
    if (
      notificationType === "blocked_topic" ||
      notificationType === "high_risk_query"
    ) {
      priority = "high";
    } else if (notificationType === "safety_concern") {
      priority = "urgent";
    }

    // Create notification for each eligible parent
    const notifications = [];
    for (const parent of parents) {
      // Check if parent wants this type of notification
      if (
        notificationType === "high_risk_query" &&
        !parent.alert_on_high_risk
      ) {
        continue;
      }
      if (
        notificationType === "supplement_topic" &&
        !parent.alert_on_supplement_topics
      ) {
        continue;
      }
      if (
        notificationType === "injury_topic" &&
        !parent.alert_on_injury_topics
      ) {
        continue;
      }
      if (!parent.can_view_ai_chats) {
        continue;
      }

      notifications.push({
        parent_id: parent.parent_id,
        youth_id: youthId,
        notification_type: notificationType,
        priority,
        title,
        summary,
        source_type: sourceId ? "ai_message" : null,
        source_id: sourceId,
        details: {
          timestamp: new Date().toISOString(),
        },
        status: "unread",
        delivery_method: "in_app",
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
      });
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("parent_notifications")
        .insert(notifications);

      if (insertError) {
        logger.error(
          "ai_chat_parent_notifications_insert_failed",
          insertError,
          {
            youth_id: youthId,
            notification_type: notificationType,
          },
        );
      } else {
        logger.info("ai_chat_parent_notifications_created", {
          youth_id: youthId,
          notification_count: notifications.length,
        });
      }
    }
  } catch (error) {
    logger.error("ai_chat_youth_parent_notification_failed", error, {
      youth_id: youthId,
      notification_type: notificationType,
    });
  }
}

/**
 * Save classification history for learning and analysis
 *
 * @param {string} messageId - AI message ID
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {string} query - User query
 * @param {Object} classification - Enhanced classification result
 */
export async function saveClassificationHistory(
  messageId,
  userId,
  sessionId,
  query,
  classification,
) {
  try {
    const historyRecord = {
      message_id: messageId,
      user_id: userId,
      session_id: sessionId,
      query_text: query,
      query_length: query.length,
      detected_intent: classification.intent,
      intent_confidence: classification.signals?.keyword?.confidence || null,
      detected_tier:
        classification.riskLevel === RISK_LEVELS.HIGH
          ? 3
          : classification.riskLevel === RISK_LEVELS.MEDIUM
            ? 2
            : 1,
      tier_confidence: classification.confidence,
      keyword_signals: classification.signals?.keyword || {},
      context_signals: classification.signals?.context || {},
      pattern_signals: classification.signals?.pattern || {},
      final_risk_level: classification.riskLevel,
      escalation_applied: classification.escalated || false,
      escalation_reasons: classification.escalationReasons || [],
      is_youth_user: classification.isYouthUser || false,
      youth_restrictions_applied:
        classification.youthRestrictions?.restrictionsApplied || [],
      parent_notification_triggered:
        classification.youthRestrictions?.notifyParent || false,
      processing_time_ms: classification.processingTimeMs,
      model_version: "v3.0",
    };

    const { error } = await supabaseAdmin
      .from("classification_history")
      .insert(historyRecord);

    if (error) {
      logger.error("ai_chat_classification_history_save_failed", error, {
        user_id: userId,
        session_id: sessionId,
        message_id: messageId,
      });
    }
  } catch (error) {
    logger.error("ai_chat_classification_history_handler_failed", error, {
      user_id: userId,
      session_id: sessionId,
      message_id: messageId,
    });
  }
}
