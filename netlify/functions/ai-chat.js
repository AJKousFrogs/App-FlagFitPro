import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { classifyRiskLevel, classifyIntent as _classifyIntent, generateSafeResponse, filterContent, filterSourcesByEvidence, RISK_LEVELS, INTENT_TYPES, classifyWithConfidence, applyYouthRestrictions as _applyYouthRestrictions, generateBlockedYouthResponse, AGE_GROUPS as _AGE_GROUPS, YOUTH_RESTRICTED_TOPICS as _YOUTH_RESTRICTED_TOPICS } from "./utils/ai-safety-classifier.js";
import { isGroqConfigured, generateCoachingResponse, generateClarifyingQuestion as _generateClarifyingQuestion } from "./utils/groq-client.js";
import { processSmartQuery, searchKnowledgeHybrid, recordFeedbackWithLearning as _recordFeedbackWithLearning, getLearnedPreferences as _getLearnedPreferences, getPendingCheckins as _getPendingCheckins, updateCheckinStatus, buildCheckinMessage, summarizeConversation as _summarizeConversation, ROUTING_ACTIONS } from "./utils/smart-ai-service.js";
import { isEmbeddingServiceAvailable } from "./utils/embedding-service.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

/**
 * Netlify Function: AI Chat
 *
 * Implements the AI coaching system with safety tiers:
 * - Tier 1 (Low Risk): General training info - full guidance
 * - Tier 2 (Medium Risk): Injury prevention - with disclaimers
 * - Tier 3 (High Risk): Supplements/medical - strong disclaimers, no dosing
 * - ACWR Override: Blocks high-intensity recommendations when ACWR > 1.5
 *
 * Pipeline:
 * 1. Classify intent + risk level
 * 2. Build user context (injuries, load, role, position, ACWR)
 * 3. Apply ACWR safety override if athlete in danger zone
 * 4. Retrieve knowledge sources with scoring
 * 5. Generate response with safety template
 * 6. Store message + citations + risk score
 * 7. Return response + suggested actions
 *
 * Based on: AI_COACHING_SYSTEM_REVAMP.md
 * ACWR Thresholds: Gabbett, T.J. (2016) - The training-injury prevention paradox
 */

// =====================================================
// CONSTANTS
// =====================================================

const MAX_QUERY_LENGTH = 1000;
// const MAX_CONTEXT_MESSAGES = 10; // Reserved for future use
// const CACHE_TTL_SECONDS = 300; // Reserved for future use (5 minutes)

// ACWR Safety Thresholds (Gabbett 2016)
const ACWR_THRESHOLDS = {
  SWEET_SPOT_LOW: 0.8, // Below this = detraining risk
  SWEET_SPOT_HIGH: 1.3, // Optimal zone upper bound
  CAUTION: 1.5, // Elevated risk - monitor closely
  DANGER: 1.5, // High injury risk - block high-intensity
  CRITICAL: 1.8, // Very high risk - immediate load reduction
};

// Keywords that indicate high-intensity training requests
const HIGH_INTENSITY_KEYWORDS = [
  "sprint",
  "explosive",
  "plyometric",
  "max effort",
  "maximum",
  "high intensity",
  "hiit",
  "tabata",
  "power",
  "speed work",
  "all out",
  "100%",
  "full speed",
  "intense",
  "hard workout",
  "heavy",
  "max weight",
  "1rm",
  "pr attempt",
  "personal record",
  "competition",
  "game day",
  "match prep",
  "peak performance",
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get or create a chat session
 */
async function getOrCreateSession(userId, sessionId = null) {
  if (sessionId) {
    const { data: existingSession } = await supabaseAdmin
      .from("ai_chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (existingSession) {
      return existingSession;
    }
  }

  // Create new session
  const { data: newSession, error } = await supabaseAdmin
    .from("ai_chat_sessions")
    .insert({
      user_id: userId,
      started_at: new Date().toISOString(),
      context_snapshot: {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat session:", error);
    throw new Error("Failed to create chat session");
  }

  return newSession;
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio) for a user
 * Based on Gabbett (2016) - The training-injury prevention paradox
 *
 * @param {string} userId - User ID
 * @returns {Object} ACWR data with ratio, risk zone, and recommendations
 */
async function calculateUserACWR(userId) {
  const today = new Date();
  const acuteStartDate = new Date(today);
  acuteStartDate.setDate(acuteStartDate.getDate() - 7);
  const chronicStartDate = new Date(today);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);

  try {
    // Get all sessions in chronic window (28 days)
    const { data: sessions } = await supabaseAdmin
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, intensity_level")
      .eq("athlete_id", userId)
      .gte("session_date", chronicStartDate.toISOString().split("T")[0])
      .lte("session_date", today.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (!sessions || sessions.length === 0) {
      return {
        acwr: null,
        riskZone: "insufficient_data",
        acuteLoad: 0,
        chronicLoad: 0,
        message: "No training data available for ACWR calculation.",
        canRecommendHighIntensity: true, // Allow recommendations if no data
      };
    }

    // Calculate session loads (RPE × duration)
    const sessionsWithLoad = sessions.map((s) => ({
      ...s,
      load: (s.duration_minutes || 60) * (s.rpe || s.intensity_level || 5),
      date: new Date(s.session_date),
    }));

    // Split into acute (7 days) and chronic (28 days)
    const acuteSessions = sessionsWithLoad.filter(
      (s) => s.date >= acuteStartDate && s.date <= today,
    );
    const chronicSessions = sessionsWithLoad; // All sessions in 28-day window

    // Calculate loads
    const acuteLoad = acuteSessions.reduce((sum, s) => sum + s.load, 0);
    const chronicLoad = chronicSessions.reduce((sum, s) => sum + s.load, 0);

    // Calculate averages (weekly for acute, 4-week average for chronic)
    const acuteAverage = acuteLoad; // Sum of 7 days
    const chronicAverage = chronicLoad / 4; // Average per week over 4 weeks

    if (chronicAverage === 0) {
      return {
        acwr: acuteLoad > 0 ? Infinity : 0,
        riskZone: acuteLoad > 0 ? "danger" : "insufficient_data",
        acuteLoad,
        chronicLoad: 0,
        message:
          acuteLoad > 0
            ? "No chronic baseline - training spike detected."
            : "No training data available.",
        canRecommendHighIntensity: false,
      };
    }

    const acwr = acuteAverage / chronicAverage;

    // Determine risk zone and recommendation capability
    let riskZone, message, canRecommendHighIntensity;

    if (acwr < ACWR_THRESHOLDS.SWEET_SPOT_LOW) {
      riskZone = "detraining";
      message = `ACWR ${acwr.toFixed(2)} - Training load too low, consider gradual increase.`;
      canRecommendHighIntensity = true; // Can recommend more training
    } else if (acwr <= ACWR_THRESHOLDS.SWEET_SPOT_HIGH) {
      riskZone = "optimal";
      message = `ACWR ${acwr.toFixed(2)} - Optimal training zone (sweet spot).`;
      canRecommendHighIntensity = true;
    } else if (acwr <= ACWR_THRESHOLDS.CAUTION) {
      riskZone = "caution";
      message = `ACWR ${acwr.toFixed(2)} - Elevated load, monitor closely.`;
      canRecommendHighIntensity = true; // Allow with caution
    } else if (acwr <= ACWR_THRESHOLDS.CRITICAL) {
      riskZone = "danger";
      message = `ACWR ${acwr.toFixed(2)} - HIGH INJURY RISK. Reduce training load.`;
      canRecommendHighIntensity = false; // BLOCK high-intensity
    } else {
      riskZone = "critical";
      message = `ACWR ${acwr.toFixed(2)} - CRITICAL INJURY RISK. Immediate load reduction needed.`;
      canRecommendHighIntensity = false; // BLOCK high-intensity
    }

    return {
      acwr: parseFloat(acwr.toFixed(2)),
      riskZone,
      acuteLoad,
      chronicLoad: parseFloat(chronicAverage.toFixed(2)),
      sessionCount: sessions.length,
      message,
      canRecommendHighIntensity,
    };
  } catch (error) {
    console.error("[AI Chat] Error calculating ACWR:", error);
    return {
      acwr: null,
      riskZone: "error",
      message: "Could not calculate ACWR.",
      canRecommendHighIntensity: true, // Don't block on error
    };
  }
}

/**
 * Check if a query is requesting high-intensity training
 * @param {string} query - User's message
 * @returns {boolean} True if query is about high-intensity training
 */
function isHighIntensityQuery(query) {
  const lowerQuery = query.toLowerCase();
  return HIGH_INTENSITY_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword),
  );
}

/**
 * Get user context for personalization
 */
async function getUserContext(userId) {
  const context = {
    injuries: [],
    recentLoad: null,
    position: null,
    role: null,
    teamId: null,
    bodyStats: null,
    acwr: null, // NEW: ACWR data for safety checks
    todayProtocol: null, // NEW: Current day's prescription
    recentSessions: [], // NEW: Last few sessions for context
    latestWellness: null, // NEW: Sleep, energy, etc
  };

  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Get active injuries
    const { data: injuries } = await supabaseAdmin
      .from("injuries")
      .select("type, severity, body_part, status")
      .eq("user_id", userId)
      .in("status", ["active", "recovering", "monitoring"])
      .order("severity", { ascending: false })
      .limit(5);

    context.injuries = injuries || [];

    // 2. Calculate ACWR for safety checks
    context.acwr = await calculateUserACWR(userId);

    // 3. Get recent load summary
    if (context.acwr && context.acwr.acuteLoad > 0) {
      context.recentLoad = {
        weeklyLoad: context.acwr.acuteLoad,
        sessionCount: context.acwr.sessionCount || 0,
        avgRPE: context.acwr.acuteLoad / (context.acwr.sessionCount || 1) / 60,
        acwr: context.acwr.acwr,
        riskZone: context.acwr.riskZone,
      };
    }

    // 4. Get today's protocol and exercises
    const { data: protocol } = await supabaseAdmin
      .from("daily_protocols")
      .select(
        `
        *,
        exercises:protocol_exercises(
          exercise_id,
          block_type,
          status,
          prescribed_sets,
          prescribed_reps,
          ai_note,
          exercises(name)
        )
      `,
      )
      .eq("user_id", userId)
      .eq("protocol_date", today)
      .single();

    if (protocol) {
      context.todayProtocol = {
        focus: protocol.training_focus,
        progress: protocol.overall_progress,
        rationale: protocol.ai_rationale,
        exercises: protocol.exercises?.map((e) => ({
          name: e.exercises?.name,
          block: e.block_type,
          status: e.status,
          sets: e.prescribed_sets,
          reps: e.prescribed_reps,
          note: e.ai_note,
        })),
      };
    }

    // 5. Get recent session history (last 3)
    const { data: recentSessions } = await supabaseAdmin
      .from("training_sessions")
      .select(
        "session_date, session_type, duration_minutes, intensity_level, performance_score",
      )
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(3);

    context.recentSessions = recentSessions || [];

    // 6. Get latest wellness entry
    const { data: wellness } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();

    context.latestWellness = wellness;

    // 6a. Get yesterday's wellness for recovery context
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayWellness } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .select("calculated_readiness")
      .eq("user_id", userId)
      .eq("checkin_date", yesterdayStr)
      .maybeSingle();

    if (yesterdayWellness && yesterdayWellness.calculated_readiness < 40) {
      context.yesterdayWellness = {
        readiness_score: yesterdayWellness.calculated_readiness,
      };
    }

    // 6b. Get recent games (last 7 days) for temporal context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentGames } = await supabaseAdmin
      .from("games")
      .select("game_date, our_score, opponent_score")
      .or(
        `player_id.eq.${userId},team_id.in.(SELECT team_id FROM team_members WHERE user_id.eq.${userId})`,
      )
      .gte("game_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("game_date", { ascending: false })
      .limit(3);

    context.recentGames = recentGames || [];

    // 6c. Get active recovery protocols
    const { data: activeRecovery } = await supabaseAdmin
      .from("recovery_blocks")
      .select("protocol_type, block_date, max_load_percent, focus")
      .eq("player_id", userId)
      .eq("block_date", today)
      .maybeSingle();

    if (activeRecovery) {
      context.activeRecovery = {
        type: activeRecovery.protocol_type,
        maxLoad: activeRecovery.max_load_percent / 100,
        focus: activeRecovery.focus,
      };
    }

    // 6d. Get active load cap
    const { data: loadCap } = await supabaseAdmin
      .from("load_caps")
      .select("sessions_remaining, max_load_percent, reason")
      .eq("player_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loadCap) {
      context.activeRecovery = {
        type: "load_cap",
        sessionsRemaining: loadCap.sessions_remaining,
        maxLoad: loadCap.max_load_percent / 100,
        reason: loadCap.reason,
      };
    }

    // 6e. Calculate data confidence
    const missingInputs = [];
    const staleData = [];
    let confidenceScore = 1.0;

    // Check wellness data completeness
    if (!wellness) {
      missingInputs.push("wellness_checkin");
      confidenceScore *= 0.7;
    } else {
      // Check if wellness has all metrics
      const requiredMetrics = [
        "sleep_quality",
        "energy_level",
        "soreness",
        "stress_level",
        "mood",
      ];
      const missingMetrics = requiredMetrics.filter(
        (metric) => !wellness[metric] && wellness[metric] !== 0,
      );
      if (missingMetrics.length > 0) {
        missingInputs.push(...missingMetrics.map((m) => `wellness_${m}`));
        confidenceScore *= 1 - missingMetrics.length / requiredMetrics.length;
      }
    }

    // Check training data completeness (for ACWR)
    if (context.recentSessions.length < 10) {
      missingInputs.push(
        `${10 - context.recentSessions.length} training_sessions`,
      );
      confidenceScore *= Math.min(context.recentSessions.length / 10, 1.0);
    }

    // Check if wellness is stale (older than 2 days)
    if (wellness && wellness.state_date) {
      const wellnessDate = new Date(wellness.state_date);
      const daysSince =
        (new Date().getTime() - wellnessDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 2) {
        staleData.push("wellness");
        confidenceScore *= 0.8;
      }
    }

    context.dataConfidence = {
      score: Math.max(0, Math.min(1, confidenceScore)),
      missingInputs: [...new Set(missingInputs)],
      staleData,
    };

    // 7. Get user profile and body comp
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("position, role, height_cm, weight_kg")
      .eq("user_id", userId)
      .single();

    if (profile) {
      context.position = profile.position;
      context.role = profile.role;

      // Get latest body measurement
      const { data: measurement } = await supabaseAdmin
        .from("physical_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("measurement_date", { ascending: false })
        .limit(1)
        .single();

      context.bodyStats = {
        height: profile.height_cm,
        weight: measurement?.weight_kg || profile.weight_kg,
        bodyFat: measurement?.body_fat_percentage,
        muscleMass: measurement?.muscle_mass_kg,
        hydration: wellness?.hydration_level,
      };
    }

    // 8. Get team membership
    const { data: teamMembership } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (teamMembership) {
      context.teamId = teamMembership.team_id;
      context.role ||= teamMembership.role;
    }
  } catch (error) {
    console.error("Error fetching user context:", error);
  }

  return context;
}

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
async function getActiveConversationContexts(userId, limit = 5) {
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
      console.error("[AI Chat] Error fetching conversation contexts:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[AI Chat] Error in getActiveConversationContexts:", error);
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
async function saveConversationContext(userId, contextData) {
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
      console.error("[AI Chat] Error saving conversation context:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[AI Chat] Error in saveConversationContext:", error);
    return null;
  }
}

/**
 * Mark a context as referenced (updates updated_at timestamp)
 *
 * @param {string} contextId - Context ID
 */
async function markContextReferenced(contextId) {
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
    console.log(
      "[AI Chat] Could not mark context as referenced:",
      error.message,
    );
  }
}

/**
 * Get pending follow-ups for a user
 *
 * @param {string} userId - User ID
 * @returns {Array} Pending follow-ups
 */
async function getPendingFollowups(userId) {
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
      console.error("[AI Chat] Error fetching follow-ups:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[AI Chat] Error in getPendingFollowups:", error);
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
async function createFollowup(userId, followupData) {
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
      console.error("[AI Chat] Error creating follow-up:", error);
      return null;
    }

    console.log(
      `[AI Chat] Created follow-up for user ${userId}: ${followupType}`,
    );
    return data;
  } catch (error) {
    console.error("[AI Chat] Error in createFollowup:", error);
    return null;
  }
}

/**
 * Mark a follow-up as triggered (sent)
 *
 * @param {string} followupId - Follow-up ID
 */
async function markFollowupTriggered(followupId) {
  try {
    await supabaseAdmin
      .from("ai_followups")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", followupId);
  } catch (error) {
    console.error("[AI Chat] Error marking follow-up triggered:", error);
  }
}

/**
 * Complete a follow-up with response
 *
 * @param {string} followupId - Follow-up ID
 * @param {string} messageId - Response message ID
 * @param {string} responseSummary - Summary of user's response
 */
async function _completeFollowup(followupId, messageId, responseSummary) {
  try {
    // First get current metadata to preserve it
    const { data: current } = await supabaseAdmin
      .from("ai_followups")
      .select("metadata")
      .eq("id", followupId)
      .single();

    await supabaseAdmin
      .from("ai_followups")
      .update({
        status: "completed",
        response: responseSummary,
        metadata: {
          ...(current?.metadata || {}),
          response_message_id: messageId,
        },
      })
      .eq("id", followupId);
  } catch (error) {
    console.error("[AI Chat] Error completing follow-up:", error);
  }
}

/**
 * Build conversation memory prompt from active contexts
 *
 * @param {Array} contexts - Active conversation contexts
 * @param {Array} followups - Pending follow-ups
 * @returns {string} Memory prompt for AI
 */
function buildConversationMemoryPrompt(contexts, followups) {
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
function determineContextToCreate(query, classification, userContext) {
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

// =====================================================
// PHASE 3: USER PREFERENCE LEARNING
// =====================================================

/**
 * Get or create user AI preferences
 *
 * @param {string} userId - User ID
 * @returns {Object} User preferences with normalized fields
 */
async function getUserAIPreferences(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_ai_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[AI Chat] Error fetching user preferences:", error);
    }

    if (data) {
      // Normalize DB schema to expected format
      return {
        ...data,
        preferred_detail_level: data.verbosity || "balanced",
        preferred_tone: data.tone || "friendly",
        favorite_topics: data.focus_areas || [],
        // These fields are stored in metadata or defaults
        include_citations: true,
        include_warnings: true,
        total_interactions: 0,
        helpful_responses: 0,
        dismissed_responses: 0,
        completed_sessions: 0,
      };
    }

    // Create default preferences if none exist
    const defaultDBPreferences = {
      user_id: userId,
      tone: "friendly",
      verbosity: "balanced",
      proactive_suggestions: true,
      reminder_frequency: "moderate",
      focus_areas: [],
      avoided_topics: [],
      language_preference: "en",
    };

    const { data: newPrefs, error: insertError } = await supabaseAdmin
      .from("user_ai_preferences")
      .insert(defaultDBPreferences)
      .select()
      .single();

    if (insertError) {
      console.error("[AI Chat] Error creating user preferences:", insertError);
      // Return normalized defaults even if insert fails
      return {
        ...defaultDBPreferences,
        preferred_detail_level: "balanced",
        preferred_tone: "friendly",
        favorite_topics: [],
        include_citations: true,
        include_warnings: true,
        total_interactions: 0,
        helpful_responses: 0,
        dismissed_responses: 0,
        completed_sessions: 0,
      };
    }

    return {
      ...newPrefs,
      preferred_detail_level: newPrefs?.verbosity || "balanced",
      preferred_tone: newPrefs?.tone || "friendly",
      favorite_topics: newPrefs?.focus_areas || [],
      include_citations: true,
      include_warnings: true,
      total_interactions: 0,
      helpful_responses: 0,
      dismissed_responses: 0,
      completed_sessions: 0,
    };
  } catch (error) {
    console.error("[AI Chat] Error in getUserAIPreferences:", error);
    return null;
  }
}

/**
 * Update user preferences based on interaction
 * Learns from user behavior to improve future responses
 * Note: Some tracking fields are stored in metadata since DB schema is limited
 *
 * @param {string} userId - User ID
 * @param {Object} interaction - Interaction data
 */
async function updateUserPreferences(userId, interaction) {
  try {
    const { topic, wasDismissed } = interaction;

    // Get current preferences
    const prefs = await getUserAIPreferences(userId);
    if (!prefs) {
      return;
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    // Update focus_areas (favorite topics) - maps to DB column
    if (topic && !wasDismissed) {
      const currentFocusAreas = prefs.focus_areas || [];
      if (!currentFocusAreas.includes(topic) && currentFocusAreas.length < 10) {
        updates.focus_areas = [...currentFocusAreas, topic];
      }
    }

    // Track avoided topics (dismissed multiple times) - maps to DB column
    if (topic && wasDismissed) {
      const currentAvoided = prefs.avoided_topics || [];
      if (!currentAvoided.includes(topic) && currentAvoided.length < 10) {
        updates.avoided_topics = [...currentAvoided, topic];
      }
    }

    // Only update if there are changes beyond timestamp
    if (Object.keys(updates).length > 1) {
      await supabaseAdmin
        .from("user_ai_preferences")
        .update(updates)
        .eq("user_id", userId);
    }
  } catch (error) {
    console.error("[AI Chat] Error updating user preferences:", error);
  }
}

/**
 * Get position-specific focus areas for personalized recommendations
 *
 * @param {string} position - User's position
 * @returns {Object} Position-specific focus areas
 */
function getPositionFocusAreas(position) {
  const focusAreas = {
    QB: {
      primary: [
        "arm_care",
        "footwork",
        "pocket_presence",
        "throwing_mechanics",
      ],
      secondary: ["decision_making", "leadership", "field_vision"],
      recovery: ["arm_recovery", "hip_mobility", "shoulder_stability"],
    },
    WR: {
      primary: ["route_running", "catching", "acceleration", "separation"],
      secondary: ["blocking", "field_awareness", "contested_catches"],
      recovery: ["hip_flexibility", "ankle_stability", "hamstring_care"],
    },
    RB: {
      primary: ["agility", "vision", "cutting", "ball_security"],
      secondary: ["receiving", "pass_protection", "endurance"],
      recovery: ["knee_stability", "hip_mobility", "core_strength"],
    },
    TE: {
      primary: ["blocking", "receiving", "route_running", "strength"],
      secondary: ["field_awareness", "versatility"],
      recovery: ["shoulder_stability", "hip_mobility", "back_care"],
    },
    OL: {
      primary: ["blocking", "footwork", "hand_placement", "strength"],
      secondary: ["communication", "endurance"],
      recovery: ["hip_mobility", "knee_stability", "shoulder_care"],
    },
    DL: {
      primary: ["pass_rush", "run_stopping", "hand_fighting", "explosiveness"],
      secondary: ["conditioning", "technique_variety"],
      recovery: ["shoulder_stability", "back_care", "hip_mobility"],
    },
    LB: {
      primary: ["tackling", "coverage", "blitzing", "field_reading"],
      secondary: ["leadership", "versatility"],
      recovery: ["knee_stability", "hip_mobility", "shoulder_care"],
    },
    DB: {
      primary: ["coverage", "ball_skills", "tackling", "speed"],
      secondary: ["film_study", "communication", "return_game"],
      recovery: ["hip_flexibility", "hamstring_care", "ankle_stability"],
    },
    K: {
      primary: ["kicking_mechanics", "consistency", "mental_focus"],
      secondary: ["leg_strength", "flexibility"],
      recovery: ["hip_flexibility", "leg_recovery", "back_care"],
    },
    P: {
      primary: ["punting_mechanics", "hang_time", "directional_punting"],
      secondary: ["leg_strength", "consistency"],
      recovery: ["hip_flexibility", "leg_recovery", "core_stability"],
    },
  };

  // Default for general/unknown positions
  const defaultFocus = {
    primary: ["speed", "agility", "conditioning", "technique"],
    secondary: ["strength", "flexibility", "mental_focus"],
    recovery: ["full_body_mobility", "sleep", "nutrition"],
  };

  return focusAreas[position?.toUpperCase()] || defaultFocus;
}

/**
 * Build personalized prompt additions based on user preferences
 *
 * @param {Object} preferences - User AI preferences
 * @param {Object} userContext - User context
 * @returns {string} Personalization prompt addition
 */
function buildPersonalizationPrompt(preferences, userContext) {
  const additions = [];

  if (!preferences) {
    return "";
  }

  // Adjust detail level
  if (preferences.preferred_detail_level === "brief") {
    additions.push("Keep responses concise and to the point.");
  } else if (preferences.preferred_detail_level === "detailed") {
    additions.push("Provide comprehensive, detailed explanations.");
  }

  // Adjust tone
  if (preferences.preferred_tone === "professional") {
    additions.push("Use a professional, technical tone.");
  } else if (preferences.preferred_tone === "casual") {
    additions.push("Use a friendly, casual tone.");
  }

  // Position-specific focus
  if (userContext.position) {
    const focus = getPositionFocusAreas(userContext.position);
    additions.push(
      `Consider position-specific needs for ${userContext.position}: focus on ${focus.primary.slice(0, 2).join(", ")}.`,
    );
  }

  // Consider favorite topics
  if (preferences.favorite_topics?.length > 0) {
    additions.push(
      `User frequently asks about: ${preferences.favorite_topics.slice(0, 3).join(", ")}.`,
    );
  }

  // Consider avoided topics
  if (preferences.avoided_topics?.length > 0) {
    additions.push(
      `User has shown less interest in: ${preferences.avoided_topics.slice(0, 3).join(", ")}.`,
    );
  }

  return additions.length > 0
    ? `\n\nPersonalization notes:\n${additions.map((a) => `- ${a}`).join("\n")}`
    : "";
}

// =====================================================
// PHASE 1: ENHANCED STATE GATING
// =====================================================

/**
 * Build comprehensive athlete state gates for safety decisions
 * Combines ACWR, injuries, age, daily state, and upcoming games
 *
 * @param {string} userId - User ID
 * @returns {Object} State gates with risk escalation level
 */
async function buildAthleteStateGates(userId) {
  const gates = {
    acwr: null,
    injuries: [],
    ageGroup: "adult",
    ageYears: null,
    dailyState: null,
    upcomingGame: null,
    position: null,
    userName: null, // Athlete's first name for personalization
    riskEscalation: 0, // 0-3 levels to add to base risk
    escalationReasons: [],
  };

  try {
    // 1. ACWR (existing calculation)
    gates.acwr = await calculateUserACWR(userId);

    // 2. Recent injuries (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: injuries } = await supabaseAdmin
      .from("injuries")
      .select("id, type, severity, body_part, status, start_date")
      .eq("user_id", userId)
      .in("status", ["active", "recovering", "monitoring"])
      .gte("start_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("severity", { ascending: false });
    gates.injuries = injuries || [];

    // 3. Age group from view
    const { data: ageData } = await supabaseAdmin
      .from("user_age_groups")
      .select("age_group, age_years")
      .eq("user_id", userId)
      .single();

    if (ageData) {
      gates.ageGroup = ageData.age_group || "adult";
      gates.ageYears = ageData.age_years;
    }

    // 4. Today's daily state (readiness check)
    const today = new Date().toISOString().split("T")[0];
    const { data: dailyState } = await supabaseAdmin
      .from("daily_wellness_checkin")
      .select("*, readiness_score:calculated_readiness")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();
    gates.dailyState = dailyState;

    // 5. Upcoming game (next 48 hours)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: upcomingGame } = await supabaseAdmin
      .from("games")
      .select("game_id, game_date, opponent_team_name, game_time")
      .gte("game_date", today)
      .lte("game_date", twoDaysFromNow.toISOString().split("T")[0])
      .order("game_date", { ascending: true })
      .limit(1)
      .single();
    gates.upcomingGame = upcomingGame;

    // 6. Get user position and name
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("position, full_name, first_name")
      .eq("id", userId)
      .single();
    gates.position = userProfile?.position;
    // Extract first name for personalized conversation
    if (userProfile?.first_name) {
      gates.userName = userProfile.first_name;
    } else if (userProfile?.full_name) {
      gates.userName = userProfile.full_name.split(" ")[0];
    }

    // Calculate risk escalation (0-3 levels)
    // Each factor can add to the escalation

    // ACWR in danger/critical zone
    if (
      gates.acwr?.riskZone === "danger" ||
      gates.acwr?.riskZone === "critical"
    ) {
      gates.riskEscalation += 1;
      gates.escalationReasons.push(
        `ACWR ${gates.acwr.acwr} (${gates.acwr.riskZone} zone)`,
      );
    }

    // Severe injury (7+ severity)
    if (gates.injuries.some((i) => i.severity >= 7)) {
      gates.riskEscalation += 1;
      const severeInjury = gates.injuries.find((i) => i.severity >= 7);
      gates.escalationReasons.push(
        `Severe injury: ${severeInjury.type || severeInjury.body_part} (severity ${severeInjury.severity})`,
      );
    }

    // High pain reported today (7+)
    if (gates.dailyState?.pain_level >= 7) {
      gates.riskEscalation += 1;
      gates.escalationReasons.push(
        `High pain level today: ${gates.dailyState.pain_level}/10`,
      );
    }

    // Youth athletes always get extra caution
    if (gates.ageGroup === "youth") {
      gates.riskEscalation += 1;
      gates.escalationReasons.push(
        `Youth athlete (age ${gates.ageYears || "<16"})`,
      );
    }

    console.log(`[AI Chat] State gates built for user ${userId}:`, {
      ageGroup: gates.ageGroup,
      acwrZone: gates.acwr?.riskZone,
      injuryCount: gates.injuries.length,
      dailyPain: gates.dailyState?.pain_level,
      riskEscalation: gates.riskEscalation,
      escalationReasons: gates.escalationReasons,
    });
  } catch (error) {
    console.error("[AI Chat] Error building state gates:", error);
    // Return partial gates, don't block on error
  }

  return gates;
}

// =====================================================
// PHASE 3: YOUTH HELPER FUNCTIONS
// =====================================================

/**
 * Get youth-specific settings for a user
 *
 * @param {string} userId - User ID
 * @returns {Object|null} Youth settings or null if not found
 */
async function getYouthSettings(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("youth_athlete_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[AI Chat] Error fetching youth settings:", error);
    }

    return data || null;
  } catch (error) {
    console.error("[AI Chat] Error in getYouthSettings:", error);
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
async function getConversationHistory(sessionId, limit = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_messages")
      .select("role, content, created_at, intent, risk_level")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[AI Chat] Error fetching conversation history:", error);
      return [];
    }

    // Return in chronological order
    return (data || []).reverse();
  } catch (error) {
    console.error("[AI Chat] Error in getConversationHistory:", error);
    return [];
  }
}

async function getSessionMessages(userId, sessionId) {
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("ai_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    console.error("[AI Chat] Error fetching session:", sessionError);
    throw new Error("Failed to load chat session");
  }

  if (!session) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("ai_messages")
    .select("id, role, content, created_at, risk_level, metadata")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("[AI Chat] Error fetching session messages:", messagesError);
    throw new Error("Failed to load chat messages");
  }

  return (messages || []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.created_at,
    riskLevel: message.risk_level || null,
    metadata: message.metadata || null,
  }));
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
async function createYouthParentNotification(
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
      .eq("youth_id", youthId)
      .eq("status", "verified");

    if (parentsError || !parents || parents.length === 0) {
      console.log("[AI Chat] No verified parents found for youth notification");
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
        console.error(
          "[AI Chat] Error creating parent notifications:",
          insertError,
        );
      } else {
        console.log(
          `[AI Chat] Created ${notifications.length} parent notification(s) for youth ${youthId}`,
        );
      }
    }
  } catch (error) {
    console.error("[AI Chat] Error in createYouthParentNotification:", error);
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
async function saveClassificationHistory(
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
      console.error("[AI Chat] Error saving classification history:", error);
    }
  } catch (error) {
    console.error("[AI Chat] Error in saveClassificationHistory:", error);
  }
}

// =====================================================
// STATE GATE ESCALATION
// =====================================================

/**
 * Apply state gate escalation to base classification
 * Escalates risk level based on athlete's current state
 *
 * @param {Object} baseClassification - Original risk classification
 * @param {Object} stateGates - Athlete state gates
 * @returns {Object} Modified classification with escalation applied
 */
function applyStateGateEscalation(baseClassification, stateGates) {
  let escalatedRisk = baseClassification.riskLevel;
  const escalationReasons = [...(stateGates.escalationReasons || [])];

  // Escalate based on cumulative risk factors
  if (stateGates.riskEscalation >= 2 && escalatedRisk === RISK_LEVELS.LOW) {
    escalatedRisk = RISK_LEVELS.MEDIUM;
    escalationReasons.push("Elevated to MEDIUM due to multiple risk factors");
  }
  if (stateGates.riskEscalation >= 3 && escalatedRisk === RISK_LEVELS.MEDIUM) {
    escalatedRisk = RISK_LEVELS.HIGH;
    escalationReasons.push("Elevated to HIGH due to critical risk state");
  }

  // Youth-specific escalations
  if (stateGates.ageGroup === "youth") {
    // Supplement/medical topics always HIGH for youth
    if (
      baseClassification.intent === INTENT_TYPES.DOSAGE ||
      baseClassification.intent === "supplement_medical"
    ) {
      escalatedRisk = RISK_LEVELS.HIGH;
      escalationReasons.push(
        "Youth athlete - supplement/dosage topics require guardian/coach approval",
      );
    }

    // Pain/injury topics elevated for youth
    if (
      baseClassification.intent === "pain_injury" &&
      escalatedRisk === RISK_LEVELS.LOW
    ) {
      escalatedRisk = RISK_LEVELS.MEDIUM;
      escalationReasons.push(
        "Youth athlete - injury topics require extra caution",
      );
    }
  }

  // Game day proximity warning
  if (stateGates.upcomingGame) {
    const gameDate = new Date(stateGates.upcomingGame.game_date);
    const today = new Date();
    const daysUntilGame = Math.ceil((gameDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilGame <= 1 && stateGates.dailyState?.pain_level >= 5) {
      if (escalatedRisk === RISK_LEVELS.LOW) {
        escalatedRisk = RISK_LEVELS.MEDIUM;
      }
      escalationReasons.push(
        `Game in ${daysUntilGame} day(s) with pain level ${stateGates.dailyState.pain_level}`,
      );
    }
  }

  const wasEscalated = escalatedRisk !== baseClassification.riskLevel;

  if (wasEscalated) {
    console.log(
      `[AI Chat] Risk escalated from ${baseClassification.riskLevel} to ${escalatedRisk}:`,
      escalationReasons,
    );
  }

  return {
    ...baseClassification,
    riskLevel: escalatedRisk,
    originalRiskLevel: baseClassification.riskLevel,
    stateGateEscalation: wasEscalated,
    escalationReasons,
    stateGates,
  };
}

/**
 * Apply ACWR safety override to classification
 * Escalates risk level if athlete is in danger zone and asking about high-intensity training
 *
 * @param {Object} classification - Original risk classification
 * @param {Object} userContext - User context with ACWR data
 * @param {string} query - Original user query
 * @returns {Object} Modified classification with ACWR override if applicable
 */
function applyACWRSafetyOverride(classification, userContext, query) {
  const { acwr } = userContext;

  // No override needed if:
  // - No ACWR data available
  // - ACWR allows high-intensity recommendations
  // - Query is not about high-intensity training
  if (!acwr || acwr.canRecommendHighIntensity || !isHighIntensityQuery(query)) {
    return {
      ...classification,
      acwrOverride: false,
      acwrData: acwr,
    };
  }

  // ACWR SAFETY OVERRIDE: Block high-intensity recommendations
  console.log(
    `[AI Chat] ACWR SAFETY OVERRIDE: Athlete ACWR is ${acwr.acwr} (${acwr.riskZone}), blocking high-intensity recommendation`,
  );

  return {
    ...classification,
    riskLevel: RISK_LEVELS.HIGH, // Escalate to high risk
    acwrOverride: true,
    acwrData: acwr,
    acwrBlockReason: `Your current ACWR is ${acwr.acwr} (${acwr.riskZone} zone). High-intensity training is not recommended until your workload ratio returns to the safe range (0.8-1.3).`,
    originalRiskLevel: classification.riskLevel,
    requiresProfessional: true,
  };
}

/**
 * Extract meaningful search keywords from a query
 * Handles nutrition topics, supplements, minerals, etc.
 */
function extractSearchKeywords(query) {
  const lowerQuery = query.toLowerCase();

  // Nutrition/supplement keywords mapping
  const nutritionKeywords = {
    iron: ["iron", "mineral", "nutrition", "supplement", "anemia", "ferrous"],
    vitamin: ["vitamin", "nutrition", "supplement"],
    protein: ["protein", "nutrition", "muscle", "recovery"],
    creatine: ["creatine", "supplement", "performance"],
    caffeine: ["caffeine", "supplement", "energy", "pre-workout"],
    carb: ["carbohydrate", "nutrition", "energy", "fuel"],
    hydrat: ["hydration", "water", "electrolyte", "fluid"],
    calcium: ["calcium", "mineral", "bone", "nutrition"],
    magnesium: ["magnesium", "mineral", "recovery", "nutrition"],
    zinc: ["zinc", "mineral", "immune", "nutrition"],
    omega: ["omega", "fish oil", "fat", "nutrition"],
    "pre-game": ["pre-game", "nutrition", "meal", "eating"],
    "post-game": ["post-game", "recovery", "nutrition", "refuel"],
    eat: ["nutrition", "meal", "diet", "eating"],
    food: ["nutrition", "meal", "diet", "eating"],
    diet: ["nutrition", "meal", "diet", "eating"],
    supplement: ["supplement", "nutrition", "vitamin", "mineral"],
  };

  // Check for nutrition-related terms
  const expandedKeywords = new Set();
  for (const [keyword, expansions] of Object.entries(nutritionKeywords)) {
    if (lowerQuery.includes(keyword)) {
      expansions.forEach((exp) => expandedKeywords.add(exp));
    }
  }

  // If we found nutrition keywords, return them
  if (expandedKeywords.size > 0) {
    return Array.from(expandedKeywords);
  }

  // Otherwise extract significant words (3+ chars, not common words)
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "how",
    "what",
    "can",
    "should",
    "would",
    "could",
    "this",
    "that",
    "have",
    "are",
    "was",
    "were",
    "been",
    "being",
    "will",
    "does",
    "did",
    "about",
    "need",
    "want",
    "know",
    "take",
    "taking",
  ]);
  const words = lowerQuery
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  return words.length > 0 ? words : [query];
}

/**
 * Search knowledge base for relevant content
 */
async function _searchKnowledgeBase(query, riskLevel, limit = 5) {
  try {
    // Extract meaningful keywords from the query
    const keywords = extractSearchKeywords(query);
    console.log("[Knowledge Search] Query:", query, "Keywords:", keywords);

    // Build OR conditions for each keyword
    const searchConditions = keywords
      .slice(0, 5) // Limit to 5 keywords
      .map(
        (kw) =>
          `topic.ilike.%${kw}%,question.ilike.%${kw}%,answer.ilike.%${kw}%,summary.ilike.%${kw}%,entry_type.ilike.%${kw}%`,
      )
      .join(",");

    // Search curated knowledge base using correct column names
    const { data: entries, error } = await supabaseAdmin
      .from("knowledge_base_entries")
      .select(
        `
        id,
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        safety_warnings,
        best_practices,
        query_count,
        updated_at
      `,
      )
      .eq("is_merlin_approved", true)
      .or(searchConditions)
      .order("query_count", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(limit * 3); // Get more, then filter and rank

    if (error) {
      console.error("Knowledge base search error:", error);
      return [];
    }

    console.log("[Knowledge Search] Found entries:", entries?.length || 0);

    // Score entries by relevance (how many keywords match)
    const scoredEntries = (entries || []).map((e) => {
      const title = e.topic || e.question || "";
      const content = e.answer || e.summary || "";
      const category = e.entry_type || "";
      const text = `${title} ${content} ${category}`.toLowerCase();
      let matchScore = 0;
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          // Title matches are worth more
          if (title.toLowerCase().includes(kw.toLowerCase())) {
            matchScore += 3;
          } else if (category.toLowerCase().includes(kw.toLowerCase())) {
            matchScore += 2;
          } else {
            matchScore += 1;
          }
        }
      }
      return { ...e, matchScore };
    });

    // Sort by match score first, then by quality score
    scoredEntries.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (b.query_count || 0) - (a.query_count || 0);
    });

    // Transform to standard format
    const sources = scoredEntries.map((e) => ({
      id: e.id,
      content: e.answer || e.summary || e.question || "",
      topic: e.topic || e.question || "Knowledge Entry",
      category: e.entry_type || "general",
      source_type: "knowledge_base",
      source_title: e.topic || e.question || "Knowledge Entry",
      source_quality_score:
        e.consensus_level === "high"
          ? 0.9
          : e.consensus_level === "moderate"
            ? 0.7
            : 0.5,
      evidence_grade: mapEvidenceStrength(e.evidence_strength),
      risk_level: null,
      requires_professional: false,
      url: Array.isArray(e.supporting_articles)
        ? e.supporting_articles[0] || null
        : null,
      source_url: Array.isArray(e.supporting_articles)
        ? e.supporting_articles[0] || null
        : null,
    }));

    // Filter by evidence grade based on risk level
    const filtered = filterSourcesByEvidence(sources, riskLevel);

    return filtered.slice(0, limit);
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
}

/**
 * Map evidence strength to grade
 * @param {number|null} strength - Evidence strength score
 * @returns {string} Grade letter (A, B, or C)
 */
function mapEvidenceStrength(strength) {
  if (!strength) {
    return "C";
  }
  if (typeof strength === "string") {
    const normalized = strength.trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(normalized)) {
      return normalized;
    }
    if (normalized.includes("HIGH")) {
      return "A";
    }
    if (normalized.includes("MODERATE") || normalized.includes("MEDIUM")) {
      return "B";
    }
    return "C";
  }
  if (strength >= 8) {
    return "A";
  }
  if (strength >= 5) {
    return "B";
  }
  return "C";
}

// Export for testing if needed
void mapEvidenceStrength;

/**
 * Generate AI response using Groq LLM (FREE tier: 14,400 requests/day)
 * Falls back to knowledge base synthesis if Groq is not configured
 *
 * @param {string} query - User's question
 * @param {Array} knowledge - Knowledge base entries
 * @param {Object} userContext - Full user context including conversation history
 * @param {string} riskLevel - Risk classification
 * @returns {Promise<Object>} - AI response with answer and metadata
 */
async function generateAIResponse(query, knowledge, userContext, riskLevel) {
  // Check if Groq is configured
  if (isGroqConfigured()) {
    try {
      console.log("[AI Chat] Using Groq LLM for conversational response");

      // Extract conversation history from context if available
      const conversationHistory = userContext.conversationHistory || [];

      const groqResponse = await generateCoachingResponse({
        query,
        riskLevel,
        userContext: {
          ...userContext,
          // Include athlete's name if available
          athleteName: userContext.userName || null,
          // Include daily state for readiness context
          dailyState: userContext.dailyState || null,
          // Include upcoming game info
          upcomingGame: userContext.upcomingGame || null,
        },
        knowledgeSources: knowledge,
        conversationHistory,
      });

      // Filter content based on risk level (additional safety layer)
      const filteredAnswer = filterContent(groqResponse.answer, riskLevel);

      return {
        answer: filteredAnswer,
        source: "groq-ai",
        model: groqResponse.model,
        usage: groqResponse.usage,
      };
    } catch (error) {
      console.error(
        "[AI Chat] Groq API error, falling back to knowledge base:",
        error.message,
      );
      // Fall through to knowledge base fallback
    }
  } else {
    console.log(
      "[AI Chat] Groq not configured, using knowledge base synthesis",
    );
  }

  // Fallback: Synthesize from knowledge base with conversational tone
  if (knowledge.length === 0) {
    return {
      answer:
        "Hey, that's a great question! I don't have specific info on this in my playbook right now. " +
        "I'd recommend checking with your coach or a sports medicine professional who can give you personalized guidance. " +
        "\n\nIs there something else I can help you with in the meantime?",
      source: "fallback",
    };
  }

  // Use the most relevant knowledge entry with conversational wrapper
  const primarySource = knowledge[0];
  let answer = "";

  // Add conversational opening
  const openings = [
    "Great question! ",
    "Good thinking! ",
    "I'm glad you asked! ",
    "Let me help you with that. ",
  ];
  answer += openings[Math.floor(Math.random() * openings.length)];

  // Add the content
  answer += primarySource.content;

  // Add personalization based on context
  if (userContext.position && riskLevel === RISK_LEVELS.LOW) {
    answer += `\n\nAs a ${userContext.position}, you'll want to pay extra attention to how this applies to your role on the field.`;
  }

  if (
    userContext.injuries &&
    userContext.injuries.length > 0 &&
    riskLevel !== RISK_LEVELS.HIGH
  ) {
    const injuryNote = userContext.injuries
      .map((i) => i.type || i.body_part)
      .join(", ");
    answer += `\n\n⚠️ **Heads up:** Since you're dealing with ${injuryNote}, make sure to modify as needed. If anything doesn't feel right, ease off and check with your trainer.`;
  }

  // Add conversational closing
  answer +=
    "\n\nDoes that help? Let me know if you want me to go deeper on any part of this!";

  // Filter content based on risk level
  answer = filterContent(answer, riskLevel);

  return {
    answer,
    source: "knowledge_base",
  };
}

// =====================================================
// EVIDENCE GRADE EXPLANATIONS (Phase 1)
// =====================================================

const EVIDENCE_GRADE_EXPLANATIONS = {
  A: "Systematic review or meta-analysis of high-quality studies",
  B: "Well-designed study with moderate sample size",
  C: "Coaching best practice or limited research",
  D: "Expert opinion or extrapolated evidence",
};

/**
 * Add evidence grade explanation to response
 * @param {Object} response - Response object with citations
 * @returns {Object} Response with evidenceGradeExplanation added
 */
function addEvidenceExplanation(response) {
  if (response.citations && response.citations.length > 0) {
    const primaryGrade =
      response.citations[0].evidence_grade ||
      response.citations[0].evidenceGrade ||
      "C";
    response.evidenceGradeExplanation =
      EVIDENCE_GRADE_EXPLANATIONS[primaryGrade] ||
      EVIDENCE_GRADE_EXPLANATIONS["C"];
  }
  return response;
}

// =====================================================
// SWAP PLAN RESPONSE (Phase 1)
// =====================================================

/**
 * Generate swap plan response when ACWR blocks high-intensity
 * Fetches recovery alternatives from knowledge base
 *
 * @param {string} query - Original user query
 * @param {Object} classification - Classification with ACWR override data
 * @param {Object} userContext - User context with stateGates
 * @returns {Object} Supportive swap plan response with KB-sourced alternatives
 */
async function generateSwapPlanResponse(query, classification, userContext) {
  const acwr = classification.acwrData;
  const riskZone = acwr?.riskZone || "danger";
  const position = userContext.position || "ALL";

  // Fetch recovery alternatives from knowledge base
  let alternatives = [];
  try {
    const { data: kbAlternatives } = await supabaseAdmin
      .from("knowledge_base_entries")
      .select(
        "id, topic, question, answer, summary, entry_type, evidence_strength, supporting_articles, query_count",
      )
      .eq("is_merlin_approved", true)
      .in("entry_type", [
        "recovery",
        "injury_prevention",
        "training",
        "recovery_method",
        "training_method",
        "injury",
      ])
      .or(
        "topic.ilike.%recovery%,question.ilike.%recovery%,answer.ilike.%recovery%,summary.ilike.%recovery%",
      )
      .order("query_count", { ascending: false, nullsFirst: false })
      .limit(10);

    if (kbAlternatives && kbAlternatives.length > 0) {
      alternatives = kbAlternatives
        .map((a) => ({
          id: a.id,
          title: a.topic || a.question || "Recovery option",
          content: a.answer || a.summary || "",
          category: a.entry_type,
          evidence_grade: mapEvidenceStrength(a.evidence_strength),
          source_type: "knowledge_base",
          intensity_level: "low",
          position_relevance: [position, "ALL"],
          source_url: Array.isArray(a.supporting_articles)
            ? a.supporting_articles[0] || null
            : null,
        }))
        .slice(0, 5);
    }
  } catch (error) {
    console.error("[AI Chat] Error fetching recovery alternatives:", error);
  }

  // Build the swap plan response
  let answer = `## Training Load Alert\n\n`;
  answer += `Your current ACWR is **${acwr?.acwr || "elevated"}** (${riskZone} zone). `;
  answer += `I need to prioritize your safety.\n\n`;

  // What we can do today
  answer += `### What we can do today\n`;
  if (alternatives.length > 0) {
    const lowIntensityAlts = alternatives
      .filter(
        (a) => a.intensity_level === "low" || a.intensity_level === "rest",
      )
      .slice(0, 3);

    if (lowIntensityAlts.length > 0) {
      for (const alt of lowIntensityAlts) {
        const contentPreview = alt.content.substring(0, 80).replace(/\n/g, " ");
        answer += `- **${alt.title}**: ${contentPreview}...\n`;
      }
    } else {
      // Fallback if no low-intensity alternatives found
      answer += `- **Low-intensity technique drills** (50-60% effort)\n`;
      answer += `- **Mobility and flexibility work**\n`;
      answer += `- **Recovery activities** (foam rolling, light stretching)\n`;
    }
  } else {
    // Fallback when KB has no alternatives
    answer += `- **Low-intensity technique drills** (50-60% effort)\n`;
    answer += `- **Mobility and flexibility work**\n`;
    answer += `- **Recovery activities** (foam rolling, light stretching)\n`;
    answer += `- **Mental training** (film study, visualization)\n`;
  }
  answer += `\n`;

  // What to avoid
  answer += `### What to avoid today\n`;
  answer += `High-intensity work including: sprints, plyometrics, max-effort drills, and competitive scrimmages.\n\n`;

  // What to monitor
  answer += `### What to monitor\n`;
  answer += `- Pain levels (report if > 5/10)\n`;
  answer += `- Fatigue and sleep quality\n`;
  answer += `- Any new soreness\n\n`;

  // Position-specific recovery
  if (position && position !== "ALL") {
    answer += `### Position-Specific Recovery (${position})\n`;
    answer += `${getPositionSpecificRecovery(position)}\n\n`;
  }

  // When you can return
  answer += `### When you can return to intensity\n`;
  answer += `Once your ACWR returns to 0.8-1.3 range (typically 3-7 days with proper load management).\n\n`;

  // Build citations from alternatives
  const citations = alternatives.map((a) => ({
    id: a.id,
    title: a.title,
    source_type: a.source_type || "curated",
    evidence_grade: a.evidence_grade || "C",
  }));

  // Add evidence grade explanation
  const primaryGrade = citations[0]?.evidence_grade || "C";
  const evidenceGradeExplanation = EVIDENCE_GRADE_EXPLANATIONS[primaryGrade];

  return {
    answer,
    citations,
    evidenceGradeExplanation,
    suggestedActions: [
      {
        type: "log_recovery",
        label: "Log Recovery Session",
        reason: "Track your low-intensity work today",
      },
      {
        type: "check_tomorrow",
        label: "Check Again Tomorrow",
        reason: "ACWR updates daily based on your load",
      },
    ],
    isSwapPlan: true,
    source: "swap-plan",
  };
}

/**
 * Generate response when ACWR safety override blocks high-intensity recommendations
 * Now uses generateSwapPlanResponse for KB-sourced alternatives
 *
 * @param {string} query - Original user query
 * @param {Object} classification - Classification with ACWR override data
 * @param {Object} userContext - User context
 * @returns {Object} Safe response with recovery-focused alternatives
 */
async function generateACWRBlockedResponse(query, classification, userContext) {
  // Use the new swap plan response that fetches from KB
  return generateSwapPlanResponse(query, classification, userContext);
}

/**
 * Get position-specific recovery recommendations
 * @param {string} position - Player position
 * @returns {string} Recovery recommendations
 */
function getPositionSpecificRecovery(position) {
  const positionLower = (position || "").toLowerCase();

  const recommendations = {
    qb: "Focus on arm care (light band work), footwork drills at low intensity, and film study of defensive coverages.",
    quarterback:
      "Focus on arm care (light band work), footwork drills at low intensity, and film study of defensive coverages.",
    wr: "Work on route visualization, light cone drills, and hand-eye coordination exercises.",
    receiver:
      "Work on route visualization, light cone drills, and hand-eye coordination exercises.",
    rb: "Light agility ladder work, vision drills, and hip mobility exercises.",
    running:
      "Light agility ladder work, vision drills, and hip mobility exercises.",
    db: "Backpedal technique at low intensity, hip mobility, and coverage film study.",
    defensive:
      "Backpedal technique at low intensity, hip mobility, and coverage film study.",
    lb: "Light movement patterns, reaction drills at reduced speed, and tackling technique review.",
    linebacker:
      "Light movement patterns, reaction drills at reduced speed, and tackling technique review.",
    ol: "Stance work, hand placement drills, and lower body mobility.",
    line: "Stance work, hand placement drills, and lower body mobility.",
    center:
      "Snap technique practice, stance mobility, and blocking angle visualization.",
  };

  // Find matching position
  for (const [key, rec] of Object.entries(recommendations)) {
    if (positionLower.includes(key)) {
      return rec;
    }
  }

  return "Focus on position-specific technique work at low intensity, mobility exercises, and mental preparation.";
}

/**
 * Generate suggested actions based on response
 * Phase 2: Returns micro-session structured objects with time/equipment/steps
 */
function generateSuggestedActions(
  query,
  answer,
  userContext,
  riskLevel,
  intent,
) {
  const actions = [];
  const position = userContext.position || "ALL";

  // High-risk: always suggest professional consultation (not a micro-session)
  if (riskLevel === RISK_LEVELS.HIGH) {
    actions.push({
      type: "ask_coach",
      reason: "High-risk topic requires professional guidance",
      label: "Consult Healthcare Provider",
      isMicroSession: false,
    });
  }

  // Medium-risk with injuries: suggest recovery micro-session
  if (
    riskLevel === RISK_LEVELS.MEDIUM &&
    userContext.injuries &&
    userContext.injuries.length > 0
  ) {
    const injuryType =
      userContext.injuries[0]?.type ||
      userContext.injuries[0]?.body_part ||
      "general";
    actions.push({
      type: "micro_session",
      reason: "Targeted recovery for your current condition",
      label: "Start Recovery Session",
      isMicroSession: true,
      microSession: {
        title: `${injuryType.charAt(0).toUpperCase() + injuryType.slice(1)} Recovery Protocol`,
        description: `Gentle exercises to support recovery from ${injuryType}`,
        session_type: "recovery",
        estimated_duration_minutes: 8,
        equipment_needed: ["foam roller", "resistance band"],
        intensity_level: "low",
        position_relevance: [position],
        steps: [
          {
            order: 1,
            instruction:
              "Light foam rolling on affected area (avoid direct pressure on injury)",
            duration_seconds: 120,
          },
          {
            order: 2,
            instruction: "Gentle range of motion exercises",
            duration_seconds: 90,
          },
          {
            order: 3,
            instruction: "Isometric holds (low intensity)",
            duration_seconds: 90,
          },
          { order: 4, instruction: "Light stretching", duration_seconds: 90 },
        ],
        coaching_cues: [
          "Keep movements slow and controlled",
          "Stop if pain increases",
          "Focus on quality over intensity",
        ],
        safety_notes:
          "Stop immediately if pain exceeds 5/10. Do not push through sharp or sudden pain.",
        follow_up_prompt:
          "How does the affected area feel now? (0-10, where 10 is worst pain)",
      },
    });
  }

  // High load detected: suggest active recovery micro-session
  if (userContext.recentLoad && userContext.recentLoad.avgRPE > 7) {
    actions.push({
      type: "micro_session",
      reason: "Your training load is elevated - active recovery recommended",
      label: "Active Recovery Session",
      isMicroSession: true,
      microSession: {
        title: "Active Recovery Flow",
        description:
          "Light movement to promote recovery without adding training stress",
        session_type: "recovery",
        estimated_duration_minutes: 10,
        equipment_needed: ["none"],
        intensity_level: "rest",
        position_relevance: [position],
        steps: [
          {
            order: 1,
            instruction: "Light walking or slow jogging in place (2 min)",
            duration_seconds: 120,
          },
          {
            order: 2,
            instruction: "Dynamic stretching - leg swings, arm circles",
            duration_seconds: 90,
          },
          {
            order: 3,
            instruction: "Hip mobility flow - 90/90, hip circles",
            duration_seconds: 120,
          },
          {
            order: 4,
            instruction: "Spine mobility - cat-cow, thoracic rotations",
            duration_seconds: 90,
          },
          {
            order: 5,
            instruction: "Deep breathing and relaxation",
            duration_seconds: 90,
          },
        ],
        coaching_cues: [
          "Keep heart rate low",
          "Focus on relaxation",
          "Breathe deeply",
        ],
        safety_notes: null,
        follow_up_prompt:
          "How do you feel after this recovery session? (0-10, where 10 is fully recovered)",
      },
    });
  }

  // Pain reported in daily state: suggest pain management micro-session
  if (userContext.stateGates?.dailyState?.pain_level >= 5) {
    actions.push({
      type: "micro_session",
      reason: "Help manage today's reported pain",
      label: "Pain Relief Routine",
      isMicroSession: true,
      microSession: {
        title: "Gentle Pain Relief Routine",
        description: "Low-impact movements to help manage discomfort",
        session_type: "recovery",
        estimated_duration_minutes: 6,
        equipment_needed: ["none"],
        intensity_level: "rest",
        position_relevance: ["ALL"],
        steps: [
          {
            order: 1,
            instruction: "Diaphragmatic breathing - 4 counts in, 6 counts out",
            duration_seconds: 90,
          },
          {
            order: 2,
            instruction: "Gentle neck rolls and shoulder shrugs",
            duration_seconds: 60,
          },
          {
            order: 3,
            instruction: "Seated spinal twists (hold 30 sec each side)",
            duration_seconds: 60,
          },
          {
            order: 4,
            instruction: "Supine figure-4 stretch (hold 45 sec each side)",
            duration_seconds: 90,
          },
          {
            order: 5,
            instruction: "Progressive muscle relaxation",
            duration_seconds: 60,
          },
        ],
        coaching_cues: [
          "Never push into pain",
          "Move slowly and mindfully",
          "Listen to your body",
        ],
        safety_notes:
          "Skip any movement that increases pain. Consult a professional if pain persists.",
        follow_up_prompt: "Has your pain level changed? (0-10)",
      },
    });
  }

  // Technique correction intent: suggest technique drill
  if (
    intent === "technique_correction" ||
    intent === INTENT_TYPES.TECHNIQUE_CORRECTION
  ) {
    actions.push({
      type: "micro_session",
      reason: "Practice the technique we discussed",
      label: "Technique Drill",
      isMicroSession: true,
      microSession: {
        title: "Technique Focus Session",
        description:
          "Deliberate practice at low intensity to refine movement patterns",
        session_type: "technique",
        estimated_duration_minutes: 8,
        equipment_needed: ["none"],
        intensity_level: "low",
        position_relevance: [position],
        steps: [
          {
            order: 1,
            instruction: "Mental rehearsal - visualize the correct movement",
            duration_seconds: 60,
          },
          {
            order: 2,
            instruction: "Slow-motion practice (25% speed)",
            duration_seconds: 120,
          },
          {
            order: 3,
            instruction: "Moderate speed practice (50% speed)",
            duration_seconds: 120,
          },
          {
            order: 4,
            instruction: "Full speed practice (75% speed, focus on form)",
            duration_seconds: 120,
          },
          {
            order: 5,
            instruction: "Review - what felt different?",
            duration_seconds: 60,
          },
        ],
        coaching_cues: [
          "Quality over speed",
          "Feel the difference",
          "One cue at a time",
        ],
        safety_notes: null,
        follow_up_prompt:
          "Did you notice improvement in your technique? (0-10)",
      },
    });
  }

  // General training query: suggest related content and simple warm-up
  if (riskLevel === RISK_LEVELS.LOW && actions.length < 2) {
    actions.push({
      type: "micro_session",
      reason: "Quick warm-up before practice",
      label: "5-Min Warm-Up",
      isMicroSession: true,
      microSession: {
        title: "Quick Dynamic Warm-Up",
        description:
          "Get your body ready for training with this efficient warm-up",
        session_type: "warm_up",
        estimated_duration_minutes: 5,
        equipment_needed: ["none"],
        intensity_level: "low",
        position_relevance: ["ALL"],
        steps: [
          {
            order: 1,
            instruction: "Light jogging in place",
            duration_seconds: 60,
          },
          {
            order: 2,
            instruction: "High knees and butt kicks",
            duration_seconds: 45,
          },
          {
            order: 3,
            instruction: "Leg swings (forward/back, side/side)",
            duration_seconds: 45,
          },
          {
            order: 4,
            instruction: "Arm circles and trunk rotations",
            duration_seconds: 45,
          },
          {
            order: 5,
            instruction: "A-skips and carioca",
            duration_seconds: 45,
          },
        ],
        coaching_cues: [
          "Gradually increase intensity",
          "Stay light on your feet",
        ],
        safety_notes: null,
        follow_up_prompt: "Do you feel warmed up and ready? (0-10)",
      },
    });
  }

  return actions;
}

/**
 * Save chat message to database
 * Phase 1: intent and user_state_snapshot
 * Phase 3: youth interaction flags, classification confidence, parent notifications
 */
async function saveChatMessage(
  sessionId,
  userId,
  message,
  response,
  classification,
) {
  try {
    // Build user state snapshot for context preservation
    const userStateSnapshot = classification.stateGates
      ? {
          acwr: classification.stateGates.acwr?.acwr,
          acwrZone: classification.stateGates.acwr?.riskZone,
          ageGroup: classification.stateGates.ageGroup,
          injuryCount: classification.stateGates.injuries?.length || 0,
          dailyPain: classification.stateGates.dailyState?.pain_level,
          dailyFatigue: classification.stateGates.dailyState?.fatigue_level,
          readinessScore: classification.stateGates.dailyState?.readiness_score,
          riskEscalation: classification.stateGates.riskEscalation,
          upcomingGame: classification.stateGates.upcomingGame ? true : false,
        }
      : {};

    // Phase 3: Determine youth-specific fields
    const isYouthInteraction = classification.isYouthUser || false;
    const youthRestrictionsApplied =
      classification.youthRestrictions?.restrictionsApplied || [];
    const requiresApproval =
      classification.youthRestrictions?.requiresParentApproval || false;

    // Save user message with intent and state
    await supabaseAdmin.from("ai_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "user",
      content: message,
      intent: classification.intent,
      risk_level: classification.riskLevel,
      metadata: {
        // Phase 3 fields stored in metadata
        is_youth_interaction: isYouthInteraction,
        youth_restrictions_applied: youthRestrictionsApplied,
        classification_confidence: classification.confidence || null,
        requires_approval: requiresApproval,
        classification: {
          ...classification,
          stateGates: undefined, // Don't duplicate in metadata
          signals: undefined, // Too verbose for metadata
        },
      },
    });

    // Save assistant response with evidence explanation
    const { data: assistantMessage } = await supabaseAdmin
      .from("ai_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: response.answer,
        risk_level: response.riskLevel,
        intent: classification.intent,
        citations: response.citations || null,
        metadata: {
          // Phase 3 fields stored in metadata
          is_youth_interaction: isYouthInteraction,
          youth_restrictions_applied: youthRestrictionsApplied,
          classification_confidence: classification.confidence || null,
          riskLevel: response.riskLevel,
          suggestedActions: response.suggestedActions,
          stateGateEscalation: classification.stateGateEscalation,
          escalationReasons: classification.escalationReasons,
          confidenceLevel: classification.confidenceLevel,
          evidenceGradeExplanation: response.evidenceGradeExplanation || null,
        },
      })
      .select()
      .single();

    const messageId = assistantMessage?.id;

    // Phase 3: Save classification history for learning
    if (messageId) {
      await saveClassificationHistory(
        messageId,
        userId,
        sessionId,
        message,
        classification,
      );
    }

    // Phase 3: Create parent notification if youth and requires notification
    if (isYouthInteraction && classification.youthRestrictions?.notifyParent) {
      await createYouthParentNotification(
        userId,
        classification.riskLevel === RISK_LEVELS.HIGH
          ? "high_risk_query"
          : classification.youthRestrictions?.restrictionsApplied?.some((r) =>
                r.includes("injury"),
              )
            ? "injury_topic"
            : classification.youthRestrictions?.restrictionsApplied?.some((r) =>
                  r.includes("supplement"),
                )
              ? "supplement_topic"
              : "safety_concern",
        `AI Coach interaction: ${classification.intent}`,
        classification.youthRestrictions.notificationReason ||
          `Youth athlete query: ${message.substring(0, 100)}...`,
        messageId,
      );
    }

    return messageId;
  } catch (error) {
    console.error("Error saving chat message:", error);
    // Don't fail the request if saving fails
    return null;
  }
}

/**
 * Log recommendation for tracking
 */
async function logRecommendation(userId, sessionId, recommendation) {
  try {
    await supabaseAdmin.from("ai_recommendations").insert({
      user_id: userId,
      chat_session_id: sessionId,
      recommendation_type: recommendation.type,
      reason: recommendation.reason,
      recommendation_data: recommendation.data || {},
      status: "pending",
    });
  } catch (error) {
    console.error("Error logging recommendation:", error);
  }
}

// =====================================================
// PHASE 1: COACH INBOX ITEM CREATION
// =====================================================

/**
 * Determine if a message needs coach review and what type
 * @param {Object} classification - Risk classification with state gates
 * @param {Object} stateGates - Athlete state gates
 * @returns {Object|null} - { needsReview, inboxType, priority } or null
 */
function determineCoachReviewNeed(classification, stateGates) {
  const { riskLevel, intent, acwrOverride, stateGateEscalation } =
    classification;

  // Safety alerts: HIGH risk, ACWR override, high pain with injury intent
  if (riskLevel === RISK_LEVELS.HIGH || acwrOverride) {
    return {
      needsReview: true,
      inboxType: "safety_alert",
      priority: "critical",
    };
  }

  // Safety alerts: Pain/injury intent with elevated state
  if (intent === INTENT_TYPES.PAIN_INJURY || intent === "pain_injury") {
    if (
      stateGates.dailyState?.pain_level >= 7 ||
      stateGates.injuries?.length > 0
    ) {
      return {
        needsReview: true,
        inboxType: "safety_alert",
        priority: "high",
      };
    }
  }

  // Review needed: MEDIUM risk or state gate escalation
  if (riskLevel === RISK_LEVELS.MEDIUM || stateGateEscalation) {
    return {
      needsReview: true,
      inboxType: "review_needed",
      priority: stateGates.dailyState?.pain_level >= 5 ? "high" : "medium",
    };
  }

  // Review needed: Recovery readiness questions
  if (
    intent === INTENT_TYPES.RECOVERY_READINESS ||
    intent === "recovery_readiness"
  ) {
    return {
      needsReview: true,
      inboxType: "review_needed",
      priority: "medium",
    };
  }

  // Review needed: Plan requests (coach may want to customize)
  if (intent === INTENT_TYPES.PLAN_REQUEST || intent === "plan_request") {
    return {
      needsReview: true,
      inboxType: "review_needed",
      priority: "low",
    };
  }

  // Youth athletes: supplement topics always need review
  if (
    stateGates.ageGroup === "youth" &&
    (intent === INTENT_TYPES.SUPPLEMENT_MEDICAL ||
      intent === "supplement_medical")
  ) {
    return {
      needsReview: true,
      inboxType: "safety_alert",
      priority: "high",
    };
  }

  return null;
}

/**
 * Create coach inbox items for relevant athlete queries
 * Notifies all coaches on the athlete's teams in real-time
 *
 * @param {string} messageId - The saved message ID
 * @param {string} userId - Athlete user ID
 * @param {string} message - Original message content
 * @param {Object} classification - Risk classification
 * @param {Object} stateGates - Athlete state gates
 */
async function createCoachInboxItem(
  messageId,
  userId,
  message,
  classification,
  stateGates,
) {
  // Determine if this needs coach review
  const reviewNeed = determineCoachReviewNeed(classification, stateGates);

  if (!reviewNeed || !reviewNeed.needsReview) {
    return; // No coach review needed
  }

  try {
    // Find athlete's active team memberships
    const { data: teamMemberships } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!teamMemberships || teamMemberships.length === 0) {
      console.log(
        `[AI Chat] Athlete ${userId} not on any teams, skipping inbox creation`,
      );
      return;
    }

    const teamIds = teamMemberships.map((t) => t.team_id);

    // Find all coaches for these teams
    const { data: coaches } = await supabaseAdmin
      .from("team_members")
      .select("user_id, team_id, role")
      .in("team_id", teamIds)
      .in("role", ["coach", "assistant_coach"])
      .eq("status", "active");

    if (!coaches || coaches.length === 0) {
      console.log(`[AI Chat] No coaches found for athlete's teams`);
      return;
    }

    // Build athlete context snapshot
    const athleteContext = {
      injuries: (stateGates.injuries || []).map((i) => ({
        type: i.type,
        severity: i.severity,
        body_part: i.body_part,
      })),
      daily_pain: stateGates.dailyState?.pain_level,
      daily_fatigue: stateGates.dailyState?.fatigue_level,
      readiness_score: stateGates.dailyState?.readiness_score,
      age_group: stateGates.ageGroup,
      acwr: stateGates.acwr?.acwr,
      acwr_zone: stateGates.acwr?.riskZone,
      position: stateGates.position,
    };

    // Format title based on intent and risk
    const intentLabels = {
      [INTENT_TYPES.PAIN_INJURY]: "Pain/Injury",
      [INTENT_TYPES.RECOVERY_READINESS]: "Recovery Check",
      [INTENT_TYPES.PLAN_REQUEST]: "Training Plan",
      [INTENT_TYPES.SUPPLEMENT_MEDICAL]: "Supplement",
      [INTENT_TYPES.TECHNIQUE_CORRECTION]: "Technique",
      pain_injury: "Pain/Injury",
      recovery_readiness: "Recovery Check",
      plan_request: "Training Plan",
      supplement_medical: "Supplement",
      technique_correction: "Technique",
    };

    const intentLabel = intentLabels[classification.intent] || "Query";
    const riskLabel = classification.riskLevel.toUpperCase();
    const title = `${intentLabel} - ${riskLabel} risk`;

    // Create summary (truncate message)
    const summary =
      message.length > 200 ? `${message.substring(0, 200)}...` : message;

    // Create inbox item for each coach
    const inboxItems = coaches.map((coach) => ({
      coach_id: coach.user_id,
      team_id: coach.team_id,
      player_id: userId,
      item_type: reviewNeed.inboxType,
      priority: reviewNeed.priority,
      source: "ai_message",
      title,
      message: summary,
      status: "unread",
      action_required: reviewNeed.priority === "urgent",
      metadata: {
        source_id: messageId,
        risk_level: classification.riskLevel,
        acwr_value: stateGates.acwr?.acwr,
        acwr_zone: stateGates.acwr?.riskZone,
        intent: classification.intent,
        athlete_context: athleteContext,
      },
    }));

    // Insert all inbox items
    const { error } = await supabaseAdmin
      .from("coach_inbox_items")
      .insert(inboxItems);

    if (error) {
      console.error("[AI Chat] Error creating coach inbox items:", error);
    } else {
      console.log(
        `[AI Chat] Created ${inboxItems.length} coach inbox items (${reviewNeed.inboxType}, ${reviewNeed.priority})`,
      );
    }
  } catch (error) {
    console.error("[AI Chat] Error in createCoachInboxItem:", error);
    // Don't fail the request if inbox creation fails
  }
}

// =====================================================
// CONTEXT ANALYSIS
// =====================================================

/**
 * Analyze training context and generate insights
 * POST /api/ai/analyze-context
 */
async function analyzeContext(context, userContext) {
  const insights = [];

  // Analyze heart rate
  if (context.heartRate) {
    if (context.heartRate > 180) {
      insights.push({
        id: "hr-high",
        type: "Performance",
        message: "Your heart rate is elevated. Consider taking a short break.",
        icon: "pi pi-heart",
        priority: "high",
      });
    } else if (
      context.heartRate < 100 &&
      context.timeInSession &&
      context.timeInSession > 10
    ) {
      insights.push({
        id: "hr-low",
        type: "Performance",
        message: "Your heart rate suggests you can increase intensity.",
        icon: "pi pi-arrow-up",
        priority: "medium",
      });
    }
  }

  // Analyze session duration
  if (context.timeInSession && context.timeInSession > 60) {
    insights.push({
      id: "duration-long",
      type: "Recovery",
      message:
        "You've been training for over an hour. Great work! Consider recovery.",
      icon: "pi pi-clock",
      priority: "medium",
    });
  }

  // Analyze fatigue
  if (context.userFatigue && context.userFatigue > 7) {
    insights.push({
      id: "fatigue-high",
      type: "Recovery",
      message:
        "You're showing signs of fatigue. Rest is important for performance.",
      icon: "pi pi-exclamation-triangle",
      priority: "high",
    });
  }

  // Analyze ACWR if available
  if (userContext && userContext.acwr) {
    const { acwr } = userContext;
    if (acwr.riskZone === "danger" || acwr.riskZone === "critical") {
      insights.push({
        id: "acwr-danger",
        type: "Safety",
        message: `Your ACWR is ${acwr.acwr} (${acwr.riskZone} zone). Consider reducing training load.`,
        icon: "pi pi-exclamation-circle",
        priority: "high",
      });
    } else if (acwr.riskZone === "detraining") {
      insights.push({
        id: "acwr-low",
        type: "Training",
        message: `Your ACWR is ${acwr.acwr}. Consider gradually increasing your training load.`,
        icon: "pi pi-info-circle",
        priority: "medium",
      });
    }
  }

  // Analyze injuries
  if (userContext && userContext.injuries && userContext.injuries.length > 0) {
    const activeInjuries = userContext.injuries.filter(
      (i) => i.status === "active",
    );
    if (activeInjuries.length > 0) {
      insights.push({
        id: "injury-warning",
        type: "Safety",
        message: `You have ${activeInjuries.length} active injury(ies). Modify exercises accordingly.`,
        icon: "pi pi-exclamation-triangle",
        priority: "high",
      });
    }
  }

  // Analyze performance trends
  if (context.previousPerformance && context.previousPerformance.length > 0) {
    const recentScores = context.previousPerformance
      .slice(-3)
      .filter((p) => p.score !== undefined)
      .map((p) => p.score);

    if (recentScores.length > 0) {
      const recentAvg =
        recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;

      if (recentAvg > 85) {
        insights.push({
          id: "performance-excellent",
          type: "Motivation",
          message:
            "Your recent performance has been excellent! Keep up the great work!",
          icon: "pi pi-star",
          priority: "low",
        });
      } else if (recentAvg < 50) {
        insights.push({
          id: "performance-struggling",
          type: "Support",
          message:
            "Your recent performance suggests you might need extra recovery or support.",
          icon: "pi pi-heart",
          priority: "medium",
        });
      }
    }
  }

  // Add environmental insights if available
  if (context.environmentalFactors) {
    const env = context.environmentalFactors;
    if (env.temperature && env.temperature > 30) {
      insights.push({
        id: "heat-warning",
        type: "Safety",
        message:
          "High temperature detected. Stay hydrated and take more breaks.",
        icon: "pi pi-sun",
        priority: "high",
      });
    } else if (env.temperature && env.temperature < 5) {
      insights.push({
        id: "cold-warning",
        type: "Safety",
        message:
          "Cold conditions. Ensure proper warm-up before intense activity.",
        icon: "pi pi-cloud",
        priority: "medium",
      });
    }
  }

  return insights;
}

// =====================================================
// MAIN HANDLER
// =====================================================

/**
 * Check if user has AI processing enabled in privacy settings
 * Returns true if enabled or if no settings exist (default to enabled)
 */
async function checkAiProcessingConsent(userId) {
  const { data: settings } = await supabaseAdmin
    .from("privacy_settings")
    .select("ai_processing_enabled")
    .eq("user_id", userId)
    .single();

  // Default to enabled if no settings exist
  return settings?.ai_processing_enabled ?? true;
}

const handler = async (event, context) => {
  // Extract sub-path to determine which endpoint is being called
  const path = event.path.replace("/.netlify/functions/ai-chat", "");
  const isAnalyzeContext =
    path.includes("/analyze-context") ||
    event.path.includes("/api/ai/analyze-context");
  const isSessionFetch =
    event.httpMethod === "GET" &&
    (path.includes("/session/") || event.path.includes("/api/ai/chat/session/"));
  const sessionMatch = path.match(/\/session\/([^/]+)$/);

  if (event.httpMethod === "POST") {
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
    functionName: "ai-chat",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "CREATE", // More restrictive rate limiting for AI
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      if (event.httpMethod === "GET") {
        if (!isSessionFetch || !sessionMatch?.[1]) {
          return createErrorResponse(
            "GET is only supported for /api/ai/chat/session/:sessionId",
            405,
            "method_not_allowed",
            requestId,
          );
        }

        try {
          const messages = await getSessionMessages(userId, sessionMatch[1]);
          if (!messages) {
            return createErrorResponse(
              "Chat session not found",
              404,
              "not_found",
              requestId,
            );
          }

          return createSuccessResponse({ messages }, requestId);
        } catch (error) {
          return createErrorResponse(
            error.message || "Failed to load chat session",
            500,
            "server_error",
            requestId,
          );
        }
      }

      // Handle /api/ai/analyze-context endpoint
      if (isAnalyzeContext) {
        // PRIVACY ENFORCEMENT: Check if user has opted out of AI processing
        const aiProcessingEnabled = await checkAiProcessingConsent(userId);
        if (!aiProcessingEnabled) {
          return createErrorResponse(
            "AI processing is disabled in your privacy settings. " +
              "To use AI features, please enable AI processing in Settings > Privacy Controls.",
            403,
            "ai_processing_disabled",
            requestId,
          );
        }

        // Parse request body
        let analysisContext;
        try {
          analysisContext = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
              requestId,
            );
          }
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId,
          );
        }

        try {
          // Get user context for enhanced analysis
          const userContext = await getUserContext(userId);

          // Analyze context and generate insights
          const insights = await analyzeContext(analysisContext, userContext);

          return createSuccessResponse(insights, requestId);
        } catch (error) {
          console.error("[AI Chat] Error analyzing context:", error);
          return createErrorResponse(
            "Failed to analyze context",
            500,
            "internal_error",
            requestId,
          );
        }
      }

      // PRIVACY ENFORCEMENT: Check if user has opted out of AI processing
      const aiProcessingEnabled = await checkAiProcessingConsent(userId);
      if (!aiProcessingEnabled) {
        return createErrorResponse(
          "AI processing is disabled in your privacy settings. " +
            "To use AI features, please enable AI processing in Settings > Privacy Controls.",
          403,
          "ai_processing_disabled",
          requestId,
        );
      }

      // Parse request body
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
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId,
        );
      }

      const { message, session_id, team_id } = body;
      // goal and time_horizon reserved for future personalization features

      // Validate message
      if (!message || typeof message !== "string") {
        return createErrorResponse(
          "Message is required and must be a string",
          400,
          "validation_error",
          requestId,
        );
      }
      const normalizedMessage = message.trim();
      if (!normalizedMessage) {
        return createErrorResponse(
          "Message cannot be empty",
          422,
          "validation_error",
          requestId,
        );
      }

      if (normalizedMessage.length > MAX_QUERY_LENGTH) {
        return createErrorResponse(
          `Message too long (max ${MAX_QUERY_LENGTH} characters)`,
          400,
          "validation_error",
          requestId,
        );
      }

      try {
        // 1. Get or create chat session first (needed for conversation history)
        const session = await getOrCreateSession(userId, session_id);

        // 2. Build comprehensive state gates (ACWR, injuries, age, daily state, games)
        const stateGates = await buildAthleteStateGates(userId);

        // 3. Build user context for personalization
        const userContext = await getUserContext(userId);
        if (team_id) {
          userContext.teamId = team_id;
        }
        userContext.stateGates = stateGates;
        userContext.position = stateGates.position || userContext.position;
        userContext.ageGroup = stateGates.ageGroup;

        // 4. Phase 3: Get youth settings if applicable
        let youthSettings = null;
        const isYouthUser =
          stateGates.ageGroup && stateGates.ageGroup !== "adult";
        if (isYouthUser) {
          youthSettings = await getYouthSettings(userId);
        }

        // 5. Phase 3: Get conversation history for pattern analysis
        const conversationHistory = await getConversationHistory(
          session.id,
          10,
        );

        // 5b. Phase 4: Get conversation contexts and pending follow-ups for memory
        const [conversationContexts, pendingFollowups] = await Promise.all([
          getActiveConversationContexts(userId, 5),
          getPendingFollowups(userId),
        ]);

        // Build conversation memory prompt
        const memoryPrompt = buildConversationMemoryPrompt(
          conversationContexts,
          pendingFollowups,
        );
        userContext.memoryPrompt = memoryPrompt;
        userContext.hasMemory =
          conversationContexts.length > 0 || pendingFollowups.length > 0;

        console.log(
          `[AI Chat] Phase 4: Loaded ${conversationContexts.length} contexts, ${pendingFollowups.length} follow-ups`,
          { requestId },
        );

        // 6. Phase 3: Enhanced multi-signal classification with confidence scoring
        const enhancedClassification = classifyWithConfidence(
          normalizedMessage,
          {
            acwr: stateGates.acwr,
            injuries: stateGates.injuries,
            dailyState: stateGates.dailyState,
            ageGroup: stateGates.ageGroup,
            upcomingGame: stateGates.upcomingGame,
          },
          conversationHistory,
          youthSettings,
        );

        console.log(
          `[AI Chat] Phase 3 Classification: ${enhancedClassification.riskLevel} risk (confidence: ${enhancedClassification.confidence})`,
          {
            intent: enhancedClassification.intent,
            isYouthUser: enhancedClassification.isYouthUser,
            escalated: enhancedClassification.escalated,
            requestId,
          },
        );

        // 7. Phase 3: Check for blocked youth topics
        if (enhancedClassification.youthRestrictions?.isBlocked) {
          console.log(
            `[AI Chat] Youth topic blocked: ${enhancedClassification.youthRestrictions.blockedReason}`,
            {
              requestId,
            },
          );

          // Generate blocked response
          const blockedResponse = generateBlockedYouthResponse(
            enhancedClassification.youthRestrictions.blockedReason,
            enhancedClassification.entities,
          );

          // Save the blocked interaction
          const savedMessageId = await saveChatMessage(
            session.id,
            userId,
            normalizedMessage,
            blockedResponse,
            enhancedClassification,
          );

          // Create parent notification for blocked topic
          if (isYouthUser) {
            await createYouthParentNotification(
              userId,
              "blocked_topic",
              `Blocked query: ${normalizedMessage.substring(0, 50)}...`,
              enhancedClassification.youthRestrictions.blockedReason,
              savedMessageId,
            );
          }

          return createSuccessResponse(
            {
              chat_session_id: session.id,
              answer_markdown: blockedResponse.answer,
              risk_level: RISK_LEVELS.HIGH,
              citations: [],
              suggested_actions: blockedResponse.suggestedActions || [],
              disclaimer: blockedResponse.disclaimer || null,
              message_id: savedMessageId,
              is_blocked: true,
              blocked_reason:
                enhancedClassification.youthRestrictions.blockedReason,
            },
            requestId,
          );
        }

        // 8. Build classification object for backward compatibility
        const baseClassification = classifyRiskLevel(normalizedMessage);
        baseClassification.intent = enhancedClassification.intent;

        // Apply state gate escalation
        const stateEscalatedClassification = applyStateGateEscalation(
          baseClassification,
          stateGates,
        );

        // Apply ACWR safety override
        const classification = applyACWRSafetyOverride(
          stateEscalatedClassification,
          userContext,
          normalizedMessage,
        );

        // Phase 3: Merge enhanced classification data
        classification.confidence = enhancedClassification.confidence;
        classification.confidenceLevel = enhancedClassification.confidenceLevel;
        classification.isYouthUser = enhancedClassification.isYouthUser;
        classification.youthRestrictions =
          enhancedClassification.youthRestrictions;
        classification.signals = enhancedClassification.signals;
        classification.processingTimeMs =
          enhancedClassification.processingTimeMs;

        // Escalate risk level if enhanced classification detected higher risk
        if (
          enhancedClassification.riskLevel === RISK_LEVELS.HIGH &&
          classification.riskLevel !== RISK_LEVELS.HIGH
        ) {
          classification.riskLevel = RISK_LEVELS.HIGH;
          classification.escalationReasons = [
            ...(classification.escalationReasons || []),
            ...(enhancedClassification.escalationReasons || []),
          ];
        }

        if (classification.acwrOverride) {
          console.log(
            `[AI Chat] ACWR Override applied - escalated from ${classification.originalRiskLevel} to ${classification.riskLevel}`,
            {
              acwr: classification.acwrData?.acwr,
              riskZone: classification.acwrData?.riskZone,
              requestId,
            },
          );
        }

        // 9. Phase 3: Get user preferences for personalization
        const userPreferences = await getUserAIPreferences(userId);
        userContext.preferences = userPreferences;

        // Build personalization prompt if preferences exist
        const personalizationPrompt = buildPersonalizationPrompt(
          userPreferences,
          userContext,
        );

        // 10. SMART AI: Process query through intelligent pipeline
        const smartResult = await processSmartQuery({
          query: normalizedMessage,
          userId,
          classification,
          userContext,
          conversationHistory,
        });

        console.log(
          `[AI Chat] Smart AI: Routing=${smartResult.routingAction}, Confidence=${smartResult.confidence?.toFixed(2)}, Memory=${smartResult.memory?.hasMemory}`,
          { requestId },
        );

        // 10a. SMART AI: Handle clarification requests
        if (smartResult.shouldAskClarification) {
          console.log(
            `[AI Chat] Smart AI: Asking clarification - ${smartResult.ambiguityReasons?.join(", ")}`,
            { requestId },
          );

          const clarificationResponse = {
            answer: smartResult.clarificationQuestion,
            source: "clarification",
            isClarification: true,
          };

          // Save as a clarification message
          const messageId = await saveChatMessage(
            session.id,
            userId,
            normalizedMessage,
            {
              answer: clarificationResponse.answer,
              citations: [],
              riskLevel: "low",
            },
            { ...classification, isClarification: true },
          );

          return createSuccessResponse(
            {
              answer_markdown: clarificationResponse.answer,
              citations: [],
              risk_level: "low",
              disclaimer: null,
              suggested_actions: [],
              chat_session_id: session.id,
              message_id: messageId,
              is_clarification: true,
              clarification_reasons: smartResult.ambiguityReasons,
              metadata: {
                routingAction: smartResult.routingAction,
                confidence: smartResult.confidence,
              },
            },
            requestId,
          );
        }

        // 10b. Use smart hybrid search (semantic + keyword) for knowledge
        const knowledge =
          smartResult.knowledge ||
          (await searchKnowledgeHybrid(normalizedMessage, {
            limit: 5,
            semanticWeight: isEmbeddingServiceAvailable() ? 0.7 : 0,
          }));

        // 10c. Add learned preferences and memory to context
        userContext.learnedPreferences = smartResult.learnedPreferences;
        userContext.conversationMemory = smartResult.memory;
        userContext.memoryPrompt = smartResult.memoryPrompt;

        // 11. Generate AI response (modified if ACWR blocked or youth restricted)
        let aiResponse;
        if (classification.acwrOverride) {
          // Generate safety-first swap plan response for ACWR-blocked queries
          aiResponse = await generateACWRBlockedResponse(
            normalizedMessage,
            classification,
            userContext,
          );
        } else {
          // Include full context for conversational AI with smart features
          const enhancedContext = {
            ...userContext,
            personalizationPrompt,
            // Add conversation history for context continuity
            conversationHistory: conversationHistory.map((h) => ({
              role: h.role,
              content: h.content,
            })),
            // Add user name for personalization
            userName: stateGates.userName || null,
            // Add daily state for readiness-aware responses
            dailyState: stateGates.dailyState || null,
            // Add upcoming game for time-sensitive advice
            upcomingGame: stateGates.upcomingGame || null,
            // Smart AI: Add memory prompt
            memoryPrompt: smartResult.memoryPrompt || "",
            // Smart AI: Add learned preferences
            learnedPreferences: smartResult.learnedPreferences || {},
            // Smart AI: Routing action for response style
            routingAction: smartResult.routingAction,
          };

          aiResponse = await generateAIResponse(
            normalizedMessage,
            knowledge,
            enhancedContext,
            classification.riskLevel,
          );

          // Add evidence grade explanation to non-swap responses
          aiResponse = addEvidenceExplanation(aiResponse);

          // Smart AI: Add confirmation if medium confidence
          if (
            smartResult.routingAction === ROUTING_ACTIONS.ANSWER_WITH_CONFIRM
          ) {
            aiResponse.answer +=
              "\n\n*Did I understand your question correctly? Let me know if you meant something different!*";
          }
        }

        // 11a. Smart AI: Handle proactive check-ins
        if (
          smartResult.pendingCheckins?.length > 0 &&
          !classification.acwrOverride
        ) {
          const checkin = smartResult.pendingCheckins[0];
          const checkinMessage = buildCheckinMessage(checkin);

          // Prepend check-in to response
          aiResponse.answer = `💬 **Quick check-in:** ${checkinMessage}\n\n---\n\n${aiResponse.answer}`;

          // Mark check-in as sent
          updateCheckinStatus(checkin.id, "sent").catch((err) =>
            console.error("[AI Chat] Error updating checkin:", err),
          );
        }

        // 12. Phase 3: Update user preferences based on interaction
        updateUserPreferences(userId, {
          intent: classification.intent,
          topic:
            enhancedClassification.signals?.keyword?.categories?.[0] ||
            classification.intent,
          position: userContext.position,
        }).catch((err) =>
          console.error("[AI Chat] Error updating preferences:", err),
        );

        // 13. Phase 4: Create conversation context if applicable
        const contextToCreate = determineContextToCreate(
          normalizedMessage,
          classification,
          userContext,
        );
        if (contextToCreate) {
          // Save the conversation context
          saveConversationContext(userId, {
            contextType: contextToCreate.contextType,
            contextKey: contextToCreate.contextKey,
            contextSummary: contextToCreate.contextSummary,
            contextDetails: contextToCreate.contextDetails,
            sessionId: session.id,
            expiresInDays: contextToCreate.expiresInDays,
          }).catch((err) =>
            console.error("[AI Chat] Error saving context:", err),
          );

          // Create follow-up if specified
          if (contextToCreate.createFollowup) {
            const scheduledFor = new Date();
            scheduledFor.setDate(
              scheduledFor.getDate() + contextToCreate.createFollowup.delayDays,
            );

            createFollowup(userId, {
              followupType: contextToCreate.createFollowup.type,
              followupPrompt: contextToCreate.createFollowup.prompt,
              context: contextToCreate.contextDetails,
              scheduledFor: scheduledFor.toISOString(),
              sourceType: "ai_message",
            }).catch((err) =>
              console.error("[AI Chat] Error creating follow-up:", err),
            );
          }
        }

        // 14. Phase 4: Mark any triggered follow-ups
        if (pendingFollowups.length > 0) {
          // Mark first pending follow-up as triggered since we're responding
          markFollowupTriggered(pendingFollowups[0].id).catch((err) =>
            console.error("[AI Chat] Error marking follow-up:", err),
          );
        }

        // 15. Phase 4: Mark referenced contexts
        for (const ctx of conversationContexts) {
          markContextReferenced(ctx.id);
        }

        // 16. Generate suggested actions (Phase 2: micro-session structured)
        const suggestedActions = generateSuggestedActions(
          normalizedMessage,
          aiResponse.answer,
          userContext,
          classification.riskLevel,
          classification.intent,
        );

        // Add ACWR-specific actions if in danger zone
        if (classification.acwrOverride) {
          suggestedActions.unshift({
            type: "reduce_load",
            reason: classification.acwrBlockReason,
            label: "View Recovery Plan",
            isMicroSession: false,
            data: {
              currentACWR: classification.acwrData?.acwr,
              targetACWR: 1.0,
            },
          });
        }

        // 8. Build safe response with disclaimers
        const response = generateSafeResponse(
          classification.riskLevel,
          aiResponse.answer,
          knowledge,
          {
            requiresProfessional: classification.requiresProfessional,
            requiresLabs: classification.requiresLabs,
            evidenceLevel: knowledge[0]?.evidence_grade || "limited",
            acwrOverride: classification.acwrOverride,
            acwrData: classification.acwrData,
          },
        );

        // Add suggested actions to response
        response.suggestedActions = [
          ...(response.suggestedActions || []),
          ...suggestedActions,
        ];

        // 9. Save message and response
        const messageId = await saveChatMessage(
          session.id,
          userId,
          normalizedMessage,
          response,
          classification,
        );

        // 10. Create coach inbox items for safety alerts and review needs
        if (messageId) {
          await createCoachInboxItem(
            messageId,
            userId,
            normalizedMessage,
            classification,
            stateGates,
          );
        }

        // 11. Log recommendations for tracking
        for (const action of response.suggestedActions) {
          await logRecommendation(userId, session.id, action);
        }

        // 12. Return response with all enhancements
        return createSuccessResponse(
          {
            answer_markdown: response.answer,
            citations: response.citations,
            risk_level: response.riskLevel,
            disclaimer: response.disclaimer,
            suggested_actions: response.suggestedActions,
            chat_session_id: session.id,
            message_id: messageId,
            // Phase 1: Evidence grade explanation
            evidence_grade_explanation:
              aiResponse.evidenceGradeExplanation ||
              response.evidenceGradeExplanation ||
              null,
            // Phase 1: Intent classification
            intent: classification.intent,
            // Phase 1: Swap plan indicator
            is_swap_plan: aiResponse.isSwapPlan || false,
            // ACWR safety information
            acwr_safety: classification.acwrOverride
              ? {
                  blocked: true,
                  reason: classification.acwrBlockReason,
                  current_acwr: classification.acwrData?.acwr,
                  risk_zone: classification.acwrData?.riskZone,
                  original_risk_level: classification.originalRiskLevel,
                }
              : null,
            // Phase 1: State gate escalation info
            state_gate_escalation: classification.stateGateEscalation
              ? {
                  escalated: true,
                  original_risk: classification.originalRiskLevel,
                  escalated_risk: classification.riskLevel,
                  reasons: classification.escalationReasons,
                }
              : null,
            // Smart AI: Intelligence metadata
            smart_ai: {
              routing_action: smartResult.routingAction,
              confidence: smartResult.confidence,
              has_memory: smartResult.memory?.hasMemory || false,
              semantic_search_used: isEmbeddingServiceAvailable(),
              knowledge_sources_count: knowledge.length,
              proactive_checkin_included:
                smartResult.pendingCheckins?.length > 0,
              processing_time_ms: smartResult.processingTimeMs,
            },
            metadata: {
              ...response.metadata,
              source: aiResponse.source,
              model: aiResponse.model || null,
              usage: aiResponse.usage || null,
              acwr: classification.acwrData
                ? {
                    ratio: classification.acwrData.acwr,
                    riskZone: classification.acwrData.riskZone,
                    canRecommendHighIntensity:
                      classification.acwrData.canRecommendHighIntensity,
                  }
                : null,
              // Phase 1: Include state gates summary in metadata
              stateGates: stateGates
                ? {
                    ageGroup: stateGates.ageGroup,
                    injuryCount: stateGates.injuries?.length || 0,
                    dailyPain: stateGates.dailyState?.pain_level,
                    readinessScore: stateGates.dailyState?.readiness_score,
                    upcomingGame: stateGates.upcomingGame ? true : false,
                    riskEscalation: stateGates.riskEscalation,
                  }
                : null,
            },
          },
          requestId,
        );
      } catch (error) {
        console.error("[AI Chat] Error processing request:", error);
        return createErrorResponse(
          "Failed to process chat request",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
