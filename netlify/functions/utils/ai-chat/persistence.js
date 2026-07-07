import { supabaseAdmin } from "../../supabase-client.js";
import { createLogger } from "../structured-logger.js";
import { RISK_LEVELS, INTENT_TYPES } from "../ai-safety-classifier.js";
import {
  createYouthParentNotification,
  saveClassificationHistory,
} from "./youth-safety.js";

const logger = createLogger({ service: "netlify.ai-chat" });

/**
 * Save chat message to database
 * Phase 1: intent and user_state_snapshot
 * Phase 3: youth interaction flags, classification confidence, parent notifications
 */
export async function saveChatMessage(
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
    logger.error("ai_chat_message_save_failed", error, {
      user_id: userId,
      session_id: sessionId,
    });
    // Don't fail the request if saving fails
    return null;
  }
}

/**
 * Log recommendation for tracking
 */
export async function logRecommendation(userId, sessionId, recommendation) {
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
    logger.error("ai_chat_recommendation_log_failed", error, {
      user_id: userId,
      session_id: sessionId,
      recommendation_type: recommendation?.type,
    });
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
export function determineCoachReviewNeed(classification, stateGates) {
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
export async function createCoachInboxItem(
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
      logger.info("ai_chat_coach_inbox_skip_no_team", {
        user_id: userId,
      });
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
      logger.info("ai_chat_coach_inbox_skip_no_coaches", {
        user_id: userId,
        team_ids: teamIds,
      });
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
      user_id: userId,
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
      logger.error("ai_chat_coach_inbox_insert_failed", error, {
        user_id: userId,
        inbox_type: reviewNeed.inboxType,
        priority: reviewNeed.priority,
      });
    } else {
      logger.info("ai_chat_coach_inbox_items_created", {
        user_id: userId,
        count: inboxItems.length,
        inbox_type: reviewNeed.inboxType,
        priority: reviewNeed.priority,
      });
    }
  } catch (error) {
    logger.error("ai_chat_coach_inbox_handler_failed", error, {
      user_id: userId,
    });
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
export async function analyzeContext(context, userContext) {
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
    // env.temperature is °C (weather.js requests metric) — heat caution ≥28 °C,
    // cold caution ≤4 °C, per WEATHER_LOGIC.md.
    if (env.temperature && env.temperature >= 28) {
      insights.push({
        id: "heat-warning",
        type: "Safety",
        message:
          "High temperature detected. Stay hydrated and take more breaks.",
        icon: "pi pi-sun",
        priority: "high",
      });
    } else if (env.temperature && env.temperature <= 4) {
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
