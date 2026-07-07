import { supabaseAdmin } from "../../supabase-client.js";
import { createLogger } from "../structured-logger.js";

const logger = createLogger({ service: "netlify.ai-chat" });

// =====================================================
// PHASE 4: CONVERSATION CONTEXT & FOLLOW-UP TRACKING
// =====================================================

/**
 * Get active conversation contexts for a user
 * Used to provide cross-session memory to the AI
 *
 * @param {string} userId - User ID
 * @param {number} limit - Max contexts to retrieve
 * @returns {Array} Active conversation contexts
 */
export async function getActiveConversationContexts(userId, limit = 5) {
  try {
    const { data, error } = await supabaseAdmin
      .from("conversation_context")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("ai_chat_conversation_contexts_fetch_failed", error, {
        user_id: userId,
      });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("ai_chat_conversation_contexts_handler_failed", error, {
      user_id: userId,
    });
    return [];
  }
}

/**
 * Save or update a conversation context
 * Creates cross-session memory for important topics
 *
 * @param {string} userId - User ID
 * @param {Object} contextData - Context to save
 * @returns {Object} Saved context
 */
export async function saveConversationContext(userId, contextData) {
  try {
    const {
      contextType,
      contextKey,
      contextSummary,
      contextDetails = {},
      sessionId,
      messageId,
      expiresInDays = null,
    } = contextData;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Store all context details in context_data JSONB column
    const { data, error } = await supabaseAdmin
      .from("conversation_context")
      .insert({
        user_id: userId,
        session_id: sessionId,
        context_type: contextType,
        context_data: {
          key: contextKey,
          summary: contextSummary,
          details: contextDetails,
          message_id: messageId,
        },
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error("ai_chat_conversation_context_save_failed", error, {
        user_id: userId,
        context_type: contextType,
      });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("ai_chat_conversation_context_save_handler_failed", error, {
      user_id: userId,
    });
    return null;
  }
}

/**
 * Mark a context as referenced (updates updated_at timestamp)
 *
 * @param {string} contextId - Context ID
 */
export async function markContextReferenced(contextId) {
  try {
    // Get current context_data to update reference count
    const { data: current } = await supabaseAdmin
      .from("conversation_context")
      .select("context_data")
      .eq("id", contextId)
      .single();

    const currentData = current?.context_data || {};
    const refCount = (currentData.reference_count || 0) + 1;

    await supabaseAdmin
      .from("conversation_context")
      .update({
        updated_at: new Date().toISOString(),
        context_data: {
          ...currentData,
          reference_count: refCount,
          last_referenced_at: new Date().toISOString(),
        },
      })
      .eq("id", contextId);
  } catch (error) {
    // Non-critical, just log
    logger.warn("ai_chat_context_reference_increment_failed", error, {
      context_id: contextId,
    });
  }
}

/**
 * Get pending follow-ups for a user
 *
 * @param {string} userId - User ID
 * @returns {Array} Pending follow-ups
 */
export async function getPendingFollowups(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_followups")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(3);

    if (error) {
      logger.error("ai_chat_followups_fetch_failed", error, {
        user_id: userId,
      });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("ai_chat_followups_handler_failed", error, {
      user_id: userId,
    });
    return [];
  }
}

/**
 * Create a follow-up for later
 *
 * @param {string} userId - User ID
 * @param {Object} followupData - Follow-up details
 * @returns {Object} Created follow-up
 */
export async function createFollowup(userId, followupData) {
  try {
    const {
      followupType,
      followupPrompt,
      context = {},
      scheduledFor,
      sourceType = null,
      sourceId = null,
      sessionId = null,
    } = followupData;

    const { data, error } = await supabaseAdmin
      .from("ai_followups")
      .insert({
        user_id: userId,
        session_id: sessionId,
        followup_type: followupType,
        message: followupPrompt,
        scheduled_for: scheduledFor,
        status: "pending",
        metadata: {
          context,
          source_type: sourceType,
          source_id: sourceId,
        },
      })
      .select()
      .single();

    if (error) {
      logger.error("ai_chat_followup_create_failed", error, {
        user_id: userId,
        followup_type: followupType,
      });
      return null;
    }

    logger.info("ai_chat_followup_created", {
      user_id: userId,
      followup_type: followupType,
      followup_id: data?.id,
    });
    return data;
  } catch (error) {
    logger.error("ai_chat_followup_creation_handler_failed", error, {
      user_id: userId,
    });
    return null;
  }
}

/**
 * Mark a follow-up as triggered (sent)
 *
 * @param {string} followupId - Follow-up ID
 */
export async function markFollowupTriggered(followupId) {
  try {
    await supabaseAdmin
      .from("ai_followups")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", followupId);
  } catch (error) {
    logger.error("ai_chat_followup_trigger_marker_failed", error, {
      followup_id: followupId,
    });
  }
}

/**
 * Build conversation memory prompt from active contexts
 *
 * @param {Array} contexts - Active conversation contexts
 * @param {Array} followups - Pending follow-ups
 * @returns {string} Memory prompt for AI
 */
export function buildConversationMemoryPrompt(contexts, followups) {
  const parts = [];

  if (contexts.length > 0) {
    parts.push("## Conversation Memory");
    parts.push("Remember these ongoing topics from previous conversations:");

    for (const ctx of contexts) {
      const typeLabel =
        {
          injury_followup: "🩹 Injury",
          goal_tracking: "🎯 Goal",
          program_progress: "📋 Program",
          technique_focus: "⚡ Technique",
          recovery_protocol: "💚 Recovery",
          general_context: "💬 Context",
        }[ctx.context_type] || "📝 Note";

      parts.push(`- ${typeLabel}: ${ctx.context_summary}`);
    }
    parts.push("");
  }

  if (followups.length > 0) {
    parts.push("## Pending Check-ins");
    parts.push("The athlete has these pending follow-ups to address:");

    for (const followup of followups) {
      parts.push(`- ${followup.followup_prompt}`);
    }
    parts.push("");
    parts.push(
      "Consider naturally incorporating these check-ins into your response if relevant.",
    );
  }

  return parts.join("\n");
}

/**
 * Determine if the query should create a conversation context
 *
 * @param {string} query - User query
 * @param {Object} classification - Classification result
 * @param {Object} userContext - User context
 * @returns {Object|null} Context to create, or null
 */
export function determineContextToCreate(query, classification, userContext) {
  const { intent } = classification;
  const lowerQuery = query.toLowerCase();

  // Injury-related context
  if (
    intent === "pain_injury" ||
    classification.entities?.injuries?.length > 0 ||
    classification.entities?.bodyParts?.length > 0
  ) {
    const bodyPart = classification.entities?.bodyParts?.[0] || "general";
    const injury = classification.entities?.injuries?.[0] || "discomfort";

    return {
      contextType: "injury_followup",
      contextKey: `${bodyPart}_${injury}_${Date.now()}`,
      contextSummary: `Reported ${injury} in ${bodyPart}`,
      contextDetails: {
        bodyPart,
        injury,
        reportedAt: new Date().toISOString(),
        originalQuery: query.substring(0, 200),
      },
      expiresInDays: 14, // Injury contexts expire after 2 weeks
      createFollowup: {
        type: "injury_check",
        prompt: `How's your ${bodyPart} feeling today? Any improvement since you mentioned the ${injury}?`,
        delayDays: 2,
      },
    };
  }

  // Technique focus context
  if (intent === "technique_correction") {
    const technique =
      lowerQuery.match(/(?:my|the)\s+(\w+(?:\s+\w+)?)/)?.[1] || "technique";

    return {
      contextType: "technique_focus",
      contextKey: `technique_${technique.replace(/\s+/g, "_")}_${Date.now()}`,
      contextSummary: `Working on improving ${technique}`,
      contextDetails: {
        technique,
        startedAt: new Date().toISOString(),
      },
      expiresInDays: 30,
    };
  }

  // Recovery readiness context
  if (
    intent === "recovery_readiness" &&
    userContext.dailyState?.pain_level >= 5
  ) {
    return {
      contextType: "recovery_protocol",
      contextKey: `recovery_${Date.now()}`,
      contextSummary: `Monitoring recovery - pain level ${userContext.dailyState.pain_level}/10`,
      contextDetails: {
        painLevel: userContext.dailyState.pain_level,
        fatigueLevel: userContext.dailyState.fatigue_level,
        checkedAt: new Date().toISOString(),
      },
      expiresInDays: 7,
      createFollowup: {
        type: "recovery_check",
        prompt: "How are you feeling today? Is the pain or fatigue any better?",
        delayDays: 1,
      },
    };
  }

  // Plan request context
  if (intent === "plan_request") {
    return {
      contextType: "program_progress",
      contextKey: `program_${Date.now()}`,
      contextSummary: "Started a new training program",
      contextDetails: {
        requestedAt: new Date().toISOString(),
        originalQuery: query.substring(0, 200),
      },
      expiresInDays: 30,
      createFollowup: {
        type: "goal_checkin",
        prompt:
          "How's the training program going? Any exercises working well or causing issues?",
        delayDays: 7,
      },
    };
  }

  return null;
}
