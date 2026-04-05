import { supabaseAdmin } from "../utils/supabase-client.js";
import { generateEmbedding, generateEmbeddings as _generateEmbeddings, cosineSimilarity as _cosineSimilarity, isEmbeddingServiceAvailable } from "./embedding-service.js";
import { generateCoachingResponse as _generateCoachingResponse, generateClarifyingQuestion } from "./groq-client.js";
import { createLogger } from "./structured-logger.js";

/**
 * Smart AI Service
 *
 * Comprehensive intelligence layer for the AI Coach:
 * 1. RAG (Retrieval-Augmented Generation) pipeline
 * 2. Intent confidence routing
 * 3. Multi-turn conversation memory
 * 4. Proactive follow-ups
 * 5. Feedback-based learning
 *
 * This service orchestrates all smart features to create
 * intelligent, contextual conversations.
 */

const logger = createLogger({ service: "netlify.smart-ai-service" });

// =============================================================================
// CONSTANTS
// =============================================================================

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8, // Answer directly
  MEDIUM: 0.6, // Answer but confirm understanding
  LOW: 0.4, // Ask clarifying question
  VERY_LOW: 0.25, // Definitely need clarification
};

const ROUTING_ACTIONS = {
  ANSWER_DIRECTLY: "answer_directly",
  ANSWER_WITH_CONFIRM: "answer_with_confirm",
  ASK_CLARIFICATION: "ask_clarification",
  ESCALATE: "escalate",
};

// =============================================================================
// 1. RAG PIPELINE - SEMANTIC KNOWLEDGE RETRIEVAL
// =============================================================================

/**
 * Search knowledge base using semantic similarity
 * Falls back to keyword search if embeddings unavailable
 */
async function searchKnowledgeSemantic(query, options = {}) {
  const {
    limit = 5,
    minSimilarity = 0.65,
    category = null,
    riskLevel = null,
  } = options;

  // Check if semantic search is available
  if (!isEmbeddingServiceAvailable()) {
    logger.info("smart_ai_embeddings_unavailable_fallback_to_keyword");
    return searchKnowledgeKeyword(query, { limit, category, riskLevel });
  }

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query, { isQuery: true });

    if (!queryEmbedding) {
      return searchKnowledgeKeyword(query, { limit, category, riskLevel });
    }

    // Format embedding for PostgreSQL
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Use the semantic search function
    const { data: results, error } = await supabaseAdmin.rpc(
      "search_knowledge_semantic",
      {
        query_embedding: embeddingStr,
        match_threshold: minSimilarity,
        match_count: limit,
        filter_category: category,
        filter_risk_level: riskLevel,
      },
    );

    if (error) {
      logger.error("smart_ai_semantic_search_error", error, {
        query,
      });
      return searchKnowledgeKeyword(query, { limit, category, riskLevel });
    }

    logger.debug("smart_ai_semantic_search_completed", {
      query,
      result_count: results?.length || 0,
    });
    return results || [];
  } catch (error) {
    logger.error("smart_ai_semantic_search_failed", error, {
      query,
    });
    return searchKnowledgeKeyword(query, { limit, category, riskLevel });
  }
}

/**
 * Keyword-based fallback search
 */
async function searchKnowledgeKeyword(query, options = {}) {
  const { limit = 5, category = null, riskLevel = null } = options;

  // Extract keywords
  const keywords = extractKeywords(query);
  const searchCondition = keywords
    .map(
      (kw) =>
        `topic.ilike.%${kw}%,question.ilike.%${kw}%,answer.ilike.%${kw}%,summary.ilike.%${kw}%,entry_type.ilike.%${kw}%`,
    )
    .join(",");

  let queryBuilder = supabaseAdmin
    .from("knowledge_base_entries")
    .select(
      `
      id, entry_type, topic, question, answer, summary,
      evidence_strength, consensus_level, supporting_articles, updated_at
    `,
    )
    .eq("is_merlin_approved", true)
    .or(searchCondition);

  if (category) {
    queryBuilder = queryBuilder.eq("entry_type", category);
  }
  if (riskLevel) {
    queryBuilder = queryBuilder.eq("consensus_level", riskLevel);
  }

  const { data, error } = await queryBuilder
    .order("query_count", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.error("smart_ai_keyword_search_failed", error, {
      query,
    });
    return [];
  }

  return (data || []).map((entry) => ({
    id: entry.id,
    title: entry.topic || entry.question || "Knowledge Entry",
    content: entry.answer || entry.summary || entry.question || "",
    category: entry.entry_type || "general",
    subcategory: null,
    source_type: "knowledge_base",
    evidence_grade:
      typeof entry.evidence_strength === "string"
        ? entry.evidence_strength
        : "C",
    risk_level: null,
    source_url: Array.isArray(entry.supporting_articles)
      ? entry.supporting_articles[0] || null
      : null,
    source_quality_score:
      entry.consensus_level === "high"
        ? 0.9
        : entry.consensus_level === "moderate"
          ? 0.7
          : 0.5,
  }));
}

/**
 * Extract meaningful keywords from query
 */
function extractKeywords(query) {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "can",
    "may",
    "might",
    "must",
    "i",
    "me",
    "my",
    "we",
    "our",
    "you",
    "your",
    "he",
    "she",
    "it",
    "they",
    "them",
    "what",
    "which",
    "who",
    "how",
    "when",
    "where",
    "why",
    "this",
    "that",
    "these",
    "those",
    "to",
    "for",
    "of",
    "with",
    "on",
    "at",
    "by",
    "from",
    "in",
    "out",
    "about",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !stopWords.has(word));
}

/**
 * Hybrid search combining semantic and keyword
 */
async function searchKnowledgeHybrid(query, options = {}) {
  const { limit = 5, semanticWeight = 0.7 } = options;

  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    searchKnowledgeSemantic(query, { limit: limit * 2 }),
    searchKnowledgeKeyword(query, { limit: limit * 2 }),
  ]);

  // Combine and deduplicate
  const seenIds = new Set();
  const combined = [];

  // Score and merge
  for (const result of semanticResults) {
    if (!seenIds.has(result.id)) {
      seenIds.add(result.id);
      combined.push({
        ...result,
        combinedScore: (result.similarity || 0.5) * semanticWeight,
        source: "semantic",
      });
    }
  }

  for (const result of keywordResults) {
    if (!seenIds.has(result.id)) {
      seenIds.add(result.id);
      combined.push({
        ...result,
        combinedScore: 0.5 * (1 - semanticWeight),
        source: "keyword",
      });
    } else {
      // Boost score for results found in both
      const existing = combined.find((c) => c.id === result.id);
      if (existing) {
        existing.combinedScore += 0.3;
        existing.source = "hybrid";
      }
    }
  }

  // Sort by combined score
  combined.sort((a, b) => b.combinedScore - a.combinedScore);

  return combined.slice(0, limit);
}

// =============================================================================
// 2. INTENT CONFIDENCE ROUTING
// =============================================================================

/**
 * Determine routing action based on intent confidence
 */
function determineRoutingAction(confidence, riskLevel, hasAmbiguity) {
  // High risk topics should always have higher threshold
  const effectiveThreshold =
    riskLevel === "high"
      ? { ...CONFIDENCE_THRESHOLDS, HIGH: 0.85, MEDIUM: 0.7 }
      : CONFIDENCE_THRESHOLDS;

  if (confidence >= effectiveThreshold.HIGH && !hasAmbiguity) {
    return ROUTING_ACTIONS.ANSWER_DIRECTLY;
  }

  if (confidence >= effectiveThreshold.MEDIUM) {
    return ROUTING_ACTIONS.ANSWER_WITH_CONFIRM;
  }

  if (confidence >= effectiveThreshold.LOW) {
    return ROUTING_ACTIONS.ASK_CLARIFICATION;
  }

  return ROUTING_ACTIONS.ASK_CLARIFICATION;
}

/**
 * Check if query is ambiguous (could mean multiple things)
 */
function checkQueryAmbiguity(query, classification) {
  const ambiguityIndicators = {
    // Very short queries
    tooShort: query.split(/\s+/).length <= 2,

    // Contains ambiguous pronouns
    vaguePronouns:
      /\b(it|this|that|they|them)\b/i.test(query) && query.length < 50,

    // Multiple possible intents detected
    multipleIntents:
      classification.alternativeIntents?.length > 1 &&
      classification.alternativeIntents[0].confidence > 0.3,

    // Generic terms without specifics
    genericTerms:
      /\b(help|advice|tips|better|improve|good|bad)\b/i.test(query) &&
      !/\b(how|what|when|where|which)\b/i.test(query),
  };

  const ambiguityScore =
    Object.values(ambiguityIndicators).filter(Boolean).length;

  return {
    isAmbiguous: ambiguityScore >= 2,
    reasons: Object.entries(ambiguityIndicators)
      .filter(([, v]) => v)
      .map(([k]) => k),
  };
}

/**
 * Generate clarifying question based on ambiguity
 */
async function generateClarification(query, ambiguityReasons, userContext) {
  const clarificationPrompts = {
    tooShort: `The query "${query}" is quite brief. Let me understand better what you need.`,
    vaguePronouns: `You mentioned "${query}" - can you help me understand what specifically you're referring to?`,
    multipleIntents: `"${query}" could mean a few different things. Let me clarify what you're looking for.`,
    genericTerms: `I'd love to help you improve! To give you the best advice, I need a bit more detail.`,
  };

  const primaryReason = ambiguityReasons[0] || "tooShort";

  try {
    const clarification = await generateClarifyingQuestion({
      query,
      intent: "unknown",
      userContext,
    });
    return clarification.answer;
  } catch {
    // Fallback to template
    return `${clarificationPrompts[primaryReason]} Can you tell me more about what you're trying to achieve?`;
  }
}

// =============================================================================
// 3. MULTI-TURN CONVERSATION MEMORY
// =============================================================================

/**
 * Get relevant conversation context from memory
 */
async function getConversationMemory(userId, query, options = {}) {
  const { maxResults = 3 } = options;

  // Get recent conversation context
  const { data: recentContexts } = await supabaseAdmin
    .from("conversation_context")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("last_referenced_at", { ascending: false, nullsFirst: false })
    .limit(5);

  // Get conversation summaries if embeddings available
  let relevantSummaries = [];
  if (isEmbeddingServiceAvailable()) {
    try {
      const queryEmbedding = await generateEmbedding(query, { isQuery: true });
      if (queryEmbedding) {
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        const { data } = await supabaseAdmin.rpc(
          "get_relevant_conversation_context",
          {
            p_user_id: userId,
            p_query_embedding: embeddingStr,
            p_max_results: maxResults,
          },
        );

        relevantSummaries = data || [];
      }
    } catch (error) {
      logger.error("smart_ai_conversation_memory_fetch_failed", error, {
        user_id: userId,
      });
    }
  }

  // Build memory context
  const memory = {
    activeContexts: recentContexts || [],
    relevantHistory: relevantSummaries,
    hasMemory:
      (recentContexts?.length || 0) > 0 || relevantSummaries.length > 0,
  };

  // Extract key information
  memory.activeInjuries = memory.activeContexts
    .filter((c) => c.context_type === "injury")
    .map((c) => c.context_summary);

  memory.activeGoals = memory.activeContexts
    .filter((c) => c.context_type === "goal")
    .map((c) => c.context_summary);

  memory.recentTopics = memory.activeContexts
    .filter((c) => c.context_type === "technique")
    .map((c) => c.context_key);

  return memory;
}

/**
 * Create a conversation summary after a session
 */
async function summarizeConversation(sessionId, userId) {
  // Get all messages from the session
  const { data: messages } = await supabaseAdmin
    .from("ai_messages")
    .select("role, content, intent, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length < 3) {
    return null; // Not enough to summarize
  }

  // Extract key information
  const topics = new Set();
  const intents = new Set();
  const goals = [];
  const injuries = [];

  for (const msg of messages) {
    if (msg.intent) {
      intents.add(msg.intent);
    }

    // Extract mentions (simplified - could use NLP)
    const content = msg.content?.toLowerCase() || "";

    if (
      content.includes("goal") ||
      content.includes("want to") ||
      content.includes("trying to")
    ) {
      goals.push(msg.content.substring(0, 200));
    }

    if (
      content.includes("injury") ||
      content.includes("hurt") ||
      content.includes("pain")
    ) {
      injuries.push(msg.content.substring(0, 200));
    }
  }

  // Create summary
  const summaryText = `Session with ${messages.length} messages covering: ${Array.from(intents).join(", ")}`;

  // Generate embedding for the summary
  let summaryEmbedding = null;
  if (isEmbeddingServiceAvailable()) {
    try {
      summaryEmbedding = await generateEmbedding(summaryText, {
        isQuery: false,
      });
    } catch {
      // Continue without embedding
    }
  }

  // Save summary
  const { data: summary, error } = await supabaseAdmin
    .from("conversation_summaries")
    .insert({
      user_id: userId,
      session_id: sessionId,
      summary_text: summaryText,
      summary_type: "session",
      topics_discussed: Array.from(topics),
      goals_mentioned:
        goals.length > 0 ? goals.map((g) => ({ text: g })) : null,
      injuries_mentioned:
        injuries.length > 0 ? injuries.map((i) => ({ text: i })) : null,
      summary_embedding: summaryEmbedding
        ? `[${summaryEmbedding.join(",")}]`
        : null,
      period_start: messages[0].created_at,
      period_end: messages[messages.length - 1].created_at,
      message_count: messages.length,
    })
    .select()
    .single();

  if (error) {
    logger.error("smart_ai_summary_save_failed", error, {
      session_id: sessionId,
      user_id: userId,
    });
  }

  return summary;
}

// =============================================================================
// 4. PROACTIVE FOLLOW-UPS
// =============================================================================

/**
 * Get pending proactive check-ins for a user
 */
async function getPendingCheckins(userId) {
  const { data, error } = await supabaseAdmin
    .from("proactive_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(3);

  if (error) {
    logger.error("smart_ai_pending_checkins_fetch_failed", error, {
      user_id: userId,
    });
    return [];
  }

  return data || [];
}

/**
 * Generate proactive check-ins for a user
 */
async function generateUserCheckins(userId) {
  try {
    const { data: count } = await supabaseAdmin.rpc(
      "generate_proactive_checkins",
      {
        p_user_id: userId,
      },
    );

    logger.info("smart_ai_proactive_checkins_generated", {
      user_id: userId,
      count,
    });
    return count;
  } catch (error) {
    logger.error("smart_ai_proactive_checkins_generation_failed", error, {
      user_id: userId,
    });
    return 0;
  }
}

/**
 * Mark a check-in as engaged or dismissed
 */
async function updateCheckinStatus(checkinId, status, engagedAt = null) {
  const { error } = await supabaseAdmin
    .from("proactive_checkins")
    .update({
      status,
      engaged_at:
        status === "engaged" ? engagedAt || new Date().toISOString() : null,
    })
    .eq("id", checkinId);

  if (error) {
    logger.error("smart_ai_checkin_update_failed", error, {
      checkin_id: checkinId,
      status,
    });
  }
}

/**
 * Build check-in message from template
 */
function buildCheckinMessage(checkin) {
  let message = checkin.message_template;

  if (checkin.personalization_data) {
    for (const [key, value] of Object.entries(checkin.personalization_data)) {
      message = message.replace(`{${key}}`, value);
    }
  }

  return message;
}

// =============================================================================
// 5. FEEDBACK LEARNING LOOP
// =============================================================================

/**
 * Record feedback and update learning
 */
async function recordFeedbackWithLearning(feedbackData) {
  const {
    messageId,
    userId,
    wasHelpful,
    feedbackText,
    knowledgeSourcesUsed,
    responseLength,
    topic,
  } = feedbackData;

  // Save feedback
  const { data: feedback, error } = await supabaseAdmin
    .from("ai_response_feedback")
    .insert({
      message_id: messageId,
      user_id: userId,
      was_helpful: wasHelpful,
      feedback_text: feedbackText,
      knowledge_sources_used: knowledgeSourcesUsed,
      feedback_source: "athlete",
    })
    .select()
    .single();

  if (error) {
    logger.error("smart_ai_feedback_save_failed", error, {
      message_id: messageId,
      user_id: userId,
    });
    return null;
  }

  // Learn user preferences from this interaction
  try {
    await supabaseAdmin.rpc("learn_user_preferences", {
      p_user_id: userId,
      p_interaction_data: {
        response_was_helpful: wasHelpful,
        response_length: responseLength,
        topic,
      },
    });
  } catch (err) {
    logger.error("smart_ai_preference_learning_failed", err, {
      user_id: userId,
    });
  }

  return feedback;
}

/**
 * Get learned preferences for a user
 */
async function getLearnedPreferences(userId) {
  const { data, error } = await supabaseAdmin
    .from("learned_user_preferences")
    .select("*")
    .eq("user_id", userId)
    .gte("confidence_score", 0.5)
    .order("confidence_score", { ascending: false });

  if (error) {
    logger.error("smart_ai_preferences_fetch_failed", error, {
      user_id: userId,
    });
    return {};
  }

  // Convert to usable format
  const preferences = {};
  for (const pref of data || []) {
    if (!preferences[pref.preference_type]) {
      preferences[pref.preference_type] = {};
    }
    preferences[pref.preference_type][pref.preference_key] = {
      value: pref.preference_value,
      confidence: pref.confidence_score,
    };
  }

  return preferences;
}

// =============================================================================
// 6. UNIFIED SMART RESPONSE PIPELINE
// =============================================================================

/**
 * Process a query through the full smart AI pipeline
 *
 * @param {Object} params - Query parameters
 * @param {string} params.query - User's query
 * @param {string} params.userId - User ID
 * @param {Object} params.classification - Intent classification result
 * @param {Object} params.userContext - User context
 * @param {Array} params.conversationHistory - Recent messages
 * @returns {Object} - Smart response with knowledge, routing decision, and context
 */
async function processSmartQuery({
  query,
  userId,
  classification,
  userContext,
  conversationHistory = [],
}) {
  const startTime = Date.now();

  // 1. Check for ambiguity and determine routing
  const ambiguity = checkQueryAmbiguity(query, classification);
  const routingAction = determineRoutingAction(
    classification.confidence || 0.5,
    classification.riskLevel,
    ambiguity.isAmbiguous,
  );

  logger.debug("smart_ai_routing_decision", {
    routing_action: routingAction,
    confidence: classification.confidence,
    ambiguous: ambiguity.isAmbiguous,
  });

  // 2. If too ambiguous, return clarification request
  if (
    routingAction === ROUTING_ACTIONS.ASK_CLARIFICATION &&
    ambiguity.isAmbiguous
  ) {
    const clarification = await generateClarification(
      query,
      ambiguity.reasons,
      userContext,
    );

    return {
      shouldAskClarification: true,
      clarificationQuestion: clarification,
      routingAction,
      confidence: classification.confidence,
      ambiguityReasons: ambiguity.reasons,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // 3. Get conversation memory
  const memory = await getConversationMemory(userId, query);

  // 4. Search knowledge base (hybrid: semantic + keyword)
  const knowledge = await searchKnowledgeHybrid(query, {
    limit: 5,
    semanticWeight: 0.7,
  });

  // 5. Get pending proactive check-ins
  const pendingCheckins = await getPendingCheckins(userId);

  // 6. Get learned preferences
  const learnedPreferences = await getLearnedPreferences(userId);

  // 7. Build enhanced context
  const enhancedContext = {
    ...userContext,
    memory,
    learnedPreferences,
    pendingCheckins: pendingCheckins.length > 0 ? pendingCheckins[0] : null,
    conversationHistory,
  };

  // 8. Build memory prompt
  const memoryPrompt = buildMemoryPrompt(memory, pendingCheckins);

  return {
    shouldAskClarification: false,
    routingAction,
    confidence: classification.confidence,
    knowledge,
    enhancedContext,
    memoryPrompt,
    memory,
    pendingCheckins,
    learnedPreferences,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Build memory prompt for the AI
 */
function buildMemoryPrompt(memory, pendingCheckins) {
  const parts = [];

  if (memory.activeInjuries?.length > 0) {
    parts.push(
      `Remember: The athlete mentioned these injuries recently - ${memory.activeInjuries.join(", ")}. Be mindful of these.`,
    );
  }

  if (memory.activeGoals?.length > 0) {
    parts.push(`Their current goals: ${memory.activeGoals.join(", ")}.`);
  }

  if (memory.recentTopics?.length > 0) {
    parts.push(`They've been working on: ${memory.recentTopics.join(", ")}.`);
  }

  if (pendingCheckins?.length > 0) {
    const checkin = pendingCheckins[0];
    if (checkin.checkin_type === "injury_followup") {
      parts.push(
        `Check in on their ${checkin.personalization_data?.injury_type || "injury"} since you haven't asked in a while.`,
      );
    }
  }

  return parts.length > 0 ? parts.join("\n") : "";
}

// =============================================================================
// EXPORTS
// =============================================================================

export { // RAG Pipeline
  searchKnowledgeSemantic,
  searchKnowledgeKeyword,
  searchKnowledgeHybrid,

  // Intent Routing
  determineRoutingAction,
  checkQueryAmbiguity,
  generateClarification,
  ROUTING_ACTIONS,
  CONFIDENCE_THRESHOLDS,

  // Conversation Memory
  getConversationMemory,
  summarizeConversation,

  // Proactive Follow-ups
  getPendingCheckins,
  generateUserCheckins,
  updateCheckinStatus,
  buildCheckinMessage,

  // Feedback Learning
  recordFeedbackWithLearning,
  getLearnedPreferences,

  // Main Pipeline
  processSmartQuery,
  buildMemoryPrompt, };
