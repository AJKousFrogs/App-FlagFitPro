// Netlify Function: AI Human Review Workflow API
// Handles flagging, reviewing, and managing AI decisions that require human oversight
//
// Implements:
// - AI decision flagging for review
// - Human review workflow
// - Audit trail for AI decisions
// - Review queue management
//
// =============================================================================

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

// =============================================================================
// REVIEW CRITERIA AND THRESHOLDS
// =============================================================================

// Criteria that trigger automatic flagging for human review
const AUTO_FLAG_CRITERIA = {
  // High-impact recommendations
  highImpact: {
    description: "Recommendations that significantly affect training or health",
    examples: [
      "Training intensity changes > 30%",
      "Dietary restrictions",
      "Recovery protocol changes",
      "Injury-related advice",
    ],
  },
  // Sensitive topics - ALWAYS refer to professionals
  sensitiveTopics: {
    description: "Topics requiring professional referral - NOT for AI to handle",
    keywords: [
      // Mental health - refer to psychologist/counselor
      "suicide", "suicidal", "kill myself", "end my life", "don't want to live",
      "self-harm", "cutting", "hurt myself",
      "depression", "depressed", "hopeless", "worthless",
      "anxiety", "panic attack", "can't cope",
      "eating disorder", "anorexia", "bulimia", "binge",
      "mental health", "therapy", "counselor",
      "dark thoughts", "dark place",
      
      // Physical injury - refer to doctor/physiotherapist
      "injury", "injured", "hurt", "pain", "painful",
      "broken", "fracture", "sprain", "strain", "torn",
      "swelling", "swollen", "bruise",
      "can't move", "can't walk", "limping",
      "concussion", "head injury", "dizzy", "blacked out",
      
      // Medical - refer to doctor
      "medical", "doctor", "hospital", "emergency",
      "medication", "medicine", "prescription", "drug",
      "supplement", "steroids", "performance enhancing",
      "chest pain", "heart", "breathing problem",
      "allergic", "allergy",
      
      // Rehabilitation - refer to physiotherapist
      "rehabilitation", "rehab", "physical therapy", "physiotherapy",
      "recovery from surgery", "post-surgery",
    ],
    referralGuidance: {
      mentalHealth: "Please speak with a licensed psychologist, counselor, or mental health professional.",
      injury: "Please consult a doctor or sports medicine physician before continuing training.",
      physiotherapy: "Please work with a licensed physiotherapist for proper rehabilitation.",
      medical: "Please consult your doctor or healthcare professional for medical advice.",
      emergency: "If this is an emergency, please call emergency services immediately.",
    },
  },
  // Minor users
  minorUsers: {
    description: "All AI decisions for users under 18 with certain topics",
    topics: ["nutrition", "training_intensity", "psychological", "health"],
  },
  // Uncertainty threshold
  uncertainty: {
    description: "AI confidence below threshold",
    threshold: 0.7, // Flag if confidence < 70%
  },
  // Anomaly detection
  anomaly: {
    description: "Unusual patterns in user data or requests",
    examples: [
      "Sudden performance changes",
      "Unusual request patterns",
      "Data inconsistencies",
    ],
  },
};

// Review priority levels
const PRIORITY_LEVELS = {
  critical: {
    level: 1,
    description: "Requires immediate review (health/safety)",
    slaHours: 1,
  },
  high: {
    level: 2,
    description: "Should be reviewed within 4 hours",
    slaHours: 4,
  },
  medium: {
    level: 3,
    description: "Should be reviewed within 24 hours",
    slaHours: 24,
  },
  low: {
    level: 4,
    description: "Can be reviewed within 72 hours",
    slaHours: 72,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if content contains sensitive keywords
 */
function containsSensitiveKeywords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return AUTO_FLAG_CRITERIA.sensitiveTopics.keywords.some(keyword => 
    lowerText.includes(keyword)
  );
}

/**
 * Determine review priority based on context
 */
function determinePriority(context) {
  const { topic, isMinor, confidence, containsSensitive, impactLevel } = context;
  
  // Critical: Health/safety concerns for minors
  if (isMinor && (containsSensitive || topic === 'health' || topic === 'injury')) {
    return 'critical';
  }
  
  // High: Any health-related or low confidence
  if (containsSensitive || confidence < 0.5 || impactLevel === 'high') {
    return 'high';
  }
  
  // Medium: Minor users or moderate impact
  if (isMinor || impactLevel === 'medium' || confidence < 0.7) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Check if AI decision should be flagged for review
 */
function shouldFlagForReview(decision) {
  const {
    userId,
    userAge,
    topic,
    recommendation,
    confidence = 1.0,
    impactLevel = 'low',
  } = decision;
  
  const reasons = [];
  const isMinor = userAge && userAge < 18;
  const containsSensitive = containsSensitiveKeywords(recommendation);
  
  // Check each criterion
  if (confidence < AUTO_FLAG_CRITERIA.uncertainty.threshold) {
    reasons.push(`Low confidence: ${(confidence * 100).toFixed(0)}%`);
  }
  
  if (containsSensitive) {
    reasons.push('Contains sensitive health/safety keywords');
  }
  
  if (isMinor && AUTO_FLAG_CRITERIA.minorUsers.topics.includes(topic)) {
    reasons.push('Sensitive topic for minor user');
  }
  
  if (impactLevel === 'high') {
    reasons.push('High-impact recommendation');
  }
  
  return {
    shouldFlag: reasons.length > 0,
    reasons,
    priority: determinePriority({
      topic,
      isMinor,
      confidence,
      containsSensitive,
      impactLevel,
    }),
  };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Create a review request for an AI decision
 */
async function createReviewRequest(data) {
  const {
    userId,
    coachId,
    interactionId,
    decisionType,
    topic,
    aiRecommendation,
    context,
    reasons,
    priority,
  } = data;
  
  const slaHours = PRIORITY_LEVELS[priority]?.slaHours || 24;
  const dueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);
  
  const { data: review, error } = await supabaseAdmin
    .from("ai_coach_interactions")
    .update({
      requires_review: true,
      review_reason: reasons.join('; '),
    })
    .eq("id", interactionId)
    .select()
    .single();
  
  if (error && error.code !== "PGRST116") {
    // If interaction doesn't exist, create a review record separately
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("ai_review_queue")
      .insert({
        user_id: userId,
        coach_id: coachId,
        interaction_id: interactionId,
        decision_type: decisionType,
        topic,
        ai_recommendation: aiRecommendation,
        context,
        flag_reasons: reasons,
        priority,
        status: "pending",
        due_at: dueAt.toISOString(),
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    return newReview;
  }
  
  return review;
}

/**
 * Get pending reviews (for reviewers/admins)
 */
async function getPendingReviews(filters = {}) {
  const { priority, status = 'pending', limit = 50 } = filters;
  
  let query = supabaseAdmin
    .from("ai_coach_interactions")
    .select(`
      *,
      users:user_id (id, first_name, last_name, email),
      ai_coaches:coach_id (id, name, personality_type)
    `)
    .eq("requires_review", true)
    .is("reviewed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

/**
 * Submit a review for an AI decision
 */
async function submitReview(reviewData) {
  const {
    interactionId,
    reviewerId,
    outcome, // 'approved', 'modified', 'rejected'
    reviewNotes,
    modifiedRecommendation,
  } = reviewData;
  
  const { data, error } = await supabaseAdmin
    .from("ai_coach_interactions")
    .update({
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_outcome: outcome,
      review_notes: reviewNotes,
      modified_recommendation: modifiedRecommendation,
    })
    .eq("id", interactionId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log the review action
  await supabaseAdmin.from("privacy_audit_log").insert({
    user_id: reviewerId,
    action: "ai_decision_reviewed",
    affected_table: "ai_coach_interactions",
    affected_data: {
      interaction_id: interactionId,
      outcome,
      has_modification: !!modifiedRecommendation,
    },
  });
  
  return data;
}

/**
 * Get review statistics
 */
async function getReviewStats() {
  // Get counts by status
  const { data: pendingCount } = await supabaseAdmin
    .from("ai_coach_interactions")
    .select("id", { count: "exact", head: true })
    .eq("requires_review", true)
    .is("reviewed_at", null);
  
  const { data: reviewedCount } = await supabaseAdmin
    .from("ai_coach_interactions")
    .select("id", { count: "exact", head: true })
    .eq("requires_review", true)
    .not("reviewed_at", "is", null);
  
  // Get outcome breakdown
  const { data: outcomes } = await supabaseAdmin
    .from("ai_coach_interactions")
    .select("review_outcome")
    .eq("requires_review", true)
    .not("reviewed_at", "is", null);
  
  const outcomeBreakdown = {
    approved: 0,
    modified: 0,
    rejected: 0,
  };
  
  outcomes?.forEach(o => {
    if (o.review_outcome && outcomeBreakdown.hasOwnProperty(o.review_outcome)) {
      outcomeBreakdown[o.review_outcome]++;
    }
  });
  
  return {
    pending: pendingCount || 0,
    reviewed: reviewedCount || 0,
    total: (pendingCount || 0) + (reviewedCount || 0),
    outcomes: outcomeBreakdown,
    priorityLevels: PRIORITY_LEVELS,
  };
}

/**
 * Get review history for a user
 */
async function getUserReviewHistory(userId, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("ai_coach_interactions")
    .select(`
      id,
      interaction_type,
      topic,
      coach_response,
      requires_review,
      review_reason,
      reviewed_at,
      review_outcome,
      created_at
    `)
    .eq("user_id", userId)
    .eq("requires_review", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

/**
 * Flag an existing interaction for review
 */
async function flagInteractionForReview(interactionId, reason, flaggedBy) {
  const { data, error } = await supabaseAdmin
    .from("ai_coach_interactions")
    .update({
      requires_review: true,
      review_reason: reason,
    })
    .eq("id", interactionId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log the flagging action
  await supabaseAdmin.from("privacy_audit_log").insert({
    user_id: flaggedBy,
    action: "ai_decision_flagged",
    affected_table: "ai_coach_interactions",
    affected_data: {
      interaction_id: interactionId,
      reason,
    },
  });
  
  return data;
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId, user }) {
  const path = event.path
    .replace("/.netlify/functions/ai-review", "")
    .replace(/^\/api\/ai-review\/?/, "")
    .replace(/^\//, "") || "";
  
  let body = {};
  if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return createErrorResponse("Invalid JSON body", 400, "invalid_json");
    }
  }

  // Check if user is admin/reviewer for certain endpoints
  const isAdmin = user?.role === "admin" || user?.user_metadata?.role === "admin";
  const isReviewer = user?.role === "reviewer" || user?.user_metadata?.role === "reviewer" || isAdmin;

  try {
    // Check if decision should be flagged (public endpoint for AI system)
    if (event.httpMethod === "POST" && path === "check") {
      const result = shouldFlagForReview(body);
      return createSuccessResponse(result);
    }

    // Flag an interaction for review
    if (event.httpMethod === "POST" && path === "flag") {
      const { interactionId, reason } = body;
      if (!interactionId) {
        return createErrorResponse("Interaction ID required", 400, "missing_id");
      }
      const flagged = await flagInteractionForReview(interactionId, reason, userId);
      return createSuccessResponse(flagged);
    }

    // Get pending reviews (reviewers only)
    if (event.httpMethod === "GET" && path === "queue") {
      if (!isReviewer) {
        return createErrorResponse("Reviewer access required", 403, "forbidden");
      }
      const params = event.queryStringParameters || {};
      const reviews = await getPendingReviews({
        priority: params.priority,
        status: params.status,
        limit: parseInt(params.limit) || 50,
      });
      return createSuccessResponse(reviews);
    }

    // Submit a review (reviewers only)
    if (event.httpMethod === "POST" && path === "submit") {
      if (!isReviewer) {
        return createErrorResponse("Reviewer access required", 403, "forbidden");
      }
      const review = await submitReview({
        ...body,
        reviewerId: userId,
      });
      return createSuccessResponse(review);
    }

    // Get review statistics (reviewers only)
    if (event.httpMethod === "GET" && path === "stats") {
      if (!isReviewer) {
        return createErrorResponse("Reviewer access required", 403, "forbidden");
      }
      const stats = await getReviewStats();
      return createSuccessResponse(stats);
    }

    // Get user's own review history
    if (event.httpMethod === "GET" && path === "history") {
      const params = event.queryStringParameters || {};
      const history = await getUserReviewHistory(userId, parseInt(params.limit) || 20);
      return createSuccessResponse(history);
    }

    // Get flagging criteria (public)
    if (event.httpMethod === "GET" && path === "criteria") {
      return createSuccessResponse({
        autoFlagCriteria: AUTO_FLAG_CRITERIA,
        priorityLevels: PRIORITY_LEVELS,
      });
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");

  } catch (error) {
    console.error("AI Review API error:", error);
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "ai-review",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "DEFAULT",
    requireAuth: !event.path.includes("/criteria") && !event.path.includes("/check"),
    handler: handleRequest,
  });
};

// Export for use in AI chat function
exports.shouldFlagForReview = shouldFlagForReview;
exports.createReviewRequest = createReviewRequest;

