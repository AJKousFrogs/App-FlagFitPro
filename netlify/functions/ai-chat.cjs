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

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const {
  classifyRiskLevel,
  generateSafeResponse,
  filterContent,
  filterSourcesByEvidence,
  // getDisclaimer - available but not currently used
  RISK_LEVELS,
} = require("./utils/ai-safety-classifier.cjs");
const {
  isGroqConfigured,
  generateCoachingResponse,
  // GROQ_MODELS - available but not currently used
} = require("./utils/groq-client.cjs");

// =====================================================
// CONSTANTS
// =====================================================

const MAX_QUERY_LENGTH = 1000;
// const MAX_CONTEXT_MESSAGES = 10; // Reserved for future use
// const CACHE_TTL_SECONDS = 300; // Reserved for future use (5 minutes)

// ACWR Safety Thresholds (Gabbett 2016)
const ACWR_THRESHOLDS = {
  SWEET_SPOT_LOW: 0.8,   // Below this = detraining risk
  SWEET_SPOT_HIGH: 1.3,  // Optimal zone upper bound
  CAUTION: 1.5,          // Elevated risk - monitor closely
  DANGER: 1.5,           // High injury risk - block high-intensity
  CRITICAL: 1.8,         // Very high risk - immediate load reduction
};

// Keywords that indicate high-intensity training requests
const HIGH_INTENSITY_KEYWORDS = [
  "sprint", "explosive", "plyometric", "max effort", "maximum",
  "high intensity", "hiit", "tabata", "power", "speed work",
  "all out", "100%", "full speed", "intense", "hard workout",
  "heavy", "max weight", "1rm", "pr attempt", "personal record",
  "competition", "game day", "match prep", "peak performance",
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
      .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
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
    const sessionsWithLoad = sessions.map(s => ({
      ...s,
      load: (s.duration_minutes || 60) * (s.rpe || s.intensity_level || 5),
      date: new Date(s.session_date),
    }));

    // Split into acute (7 days) and chronic (28 days)
    const acuteSessions = sessionsWithLoad.filter(
      s => s.date >= acuteStartDate && s.date <= today
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
        message: acuteLoad > 0 
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
  return HIGH_INTENSITY_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
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
  };

  try {
    // Get active injuries
    const { data: injuries } = await supabaseAdmin
      .from("injuries")
      .select("type, severity, body_part, status")
      .eq("user_id", userId)
      .in("status", ["active", "recovering", "monitoring"])
      .order("severity", { ascending: false })
      .limit(5);

    context.injuries = injuries || [];

    // Calculate ACWR for safety checks
    context.acwr = await calculateUserACWR(userId);

    // Get recent load summary (from ACWR calculation)
    if (context.acwr && context.acwr.acuteLoad > 0) {
      context.recentLoad = {
        weeklyLoad: context.acwr.acuteLoad,
        sessionCount: context.acwr.sessionCount || 0,
        avgRPE: context.acwr.acuteLoad / (context.acwr.sessionCount || 1) / 60, // Estimate
      };
    }

    // Get user profile info
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("position, role, height_cm, weight_kg")
      .eq("user_id", userId)
      .single();

    if (profile) {
      context.position = profile.position;
      context.role = profile.role;
      context.bodyStats = {
        height: profile.height_cm,
        weight: profile.weight_kg,
      };
    }

    // Get team membership
    const { data: teamMembership } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (teamMembership) {
      context.teamId = teamMembership.team_id;
      context.role = context.role || teamMembership.role;
    }
  } catch (error) {
    console.error("Error fetching user context:", error);
    // Continue with partial context
  }

  return context;
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
  const acwr = userContext.acwr;
  
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
  console.log(`[AI Chat] ACWR SAFETY OVERRIDE: Athlete ACWR is ${acwr.acwr} (${acwr.riskZone}), blocking high-intensity recommendation`);

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
 * Search knowledge base for relevant content
 */
async function searchKnowledgeBase(query, riskLevel, limit = 5) {
  try {
    // Search curated knowledge base using correct column names
    const { data: entries, error } = await supabaseAdmin
      .from("knowledge_base_entries")
      .select(`
        id,
        title,
        content,
        category,
        subcategory,
        source_type,
        evidence_grade,
        risk_level,
        requires_professional,
        source_quality_score
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
      .eq("is_active", true)
      .order("source_quality_score", { ascending: false, nullsFirst: false })
      .limit(limit * 2); // Get more, then filter by evidence

    if (error) {
      console.error("Knowledge base search error:", error);
      return [];
    }

    // Transform to standard format
    const sources = (entries || []).map((e) => ({
      id: e.id,
      content: e.content,
      topic: e.title,
      category: e.category,
      source_type: e.source_type || "curated",
      source_title: e.title,
      source_quality_score: e.source_quality_score || 0.8,
      evidence_grade: e.evidence_grade || "C",
      risk_level: e.risk_level,
      requires_professional: e.requires_professional,
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
 */
async function generateAIResponse(query, knowledge, userContext, riskLevel) {
  // Check if Groq is configured
  if (isGroqConfigured()) {
    try {
      console.log("[AI Chat] Using Groq LLM for response generation");
      
      const groqResponse = await generateCoachingResponse({
        query,
        riskLevel,
        userContext,
        knowledgeSources: knowledge,
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
      console.error("[AI Chat] Groq API error, falling back to knowledge base:", error.message);
      // Fall through to knowledge base fallback
    }
  } else {
    console.log("[AI Chat] Groq not configured, using knowledge base synthesis");
  }

  // Fallback: Synthesize from knowledge base
  if (knowledge.length === 0) {
    return {
      answer:
        "I don't have specific information about this topic in my knowledge base. " +
        "For personalized advice, please consult with your coach or a qualified professional.",
      source: "fallback",
    };
  }

  // Use the most relevant knowledge entry
  const primarySource = knowledge[0];
  let answer = primarySource.content;

  // Add personalization based on context
  if (userContext.position && riskLevel === RISK_LEVELS.LOW) {
    answer += `\n\nAs a ${userContext.position}, you may want to focus on position-specific applications of this advice.`;
  }

  if (userContext.injuries.length > 0 && riskLevel !== RISK_LEVELS.HIGH) {
    const injuryNote = userContext.injuries
      .map((i) => i.type || i.body_part)
      .join(", ");
    answer += `\n\n⚠️ Note: Given your current condition (${injuryNote}), please modify exercises as needed and consult your healthcare provider if symptoms persist.`;
  }

  // Filter content based on risk level
  answer = filterContent(answer, riskLevel);

  return {
    answer,
    source: "knowledge_base",
  };
}

/**
 * Generate response when ACWR safety override blocks high-intensity recommendations
 * Provides alternative low-intensity suggestions and explains the safety rationale
 * 
 * @param {string} query - Original user query
 * @param {Object} classification - Classification with ACWR override data
 * @param {Object} userContext - User context
 * @returns {Object} Safe response with recovery-focused alternatives
 */
function generateACWRBlockedResponse(query, classification, userContext) {
  const acwr = classification.acwrData;
  const riskZone = acwr?.riskZone || "danger";
  
  // Build personalized safety message
  let answer = `## ⚠️ Training Load Alert\n\n`;
  answer += `I understand you're asking about high-intensity training, but I need to prioritize your safety.\n\n`;
  answer += `**Your current ACWR is ${acwr?.acwr || "elevated"} (${riskZone} zone)**\n\n`;
  answer += `Based on sports science research (Gabbett 2016), athletes with ACWR above 1.5 have significantly increased injury risk. `;
  answer += `The optimal "sweet spot" is between 0.8 and 1.3.\n\n`;

  // Add specific recommendations based on risk zone
  if (riskZone === "critical") {
    answer += `### 🚨 Immediate Action Required\n`;
    answer += `Your workload ratio is critically elevated. I strongly recommend:\n`;
    answer += `- **Complete rest** for 1-2 days\n`;
    answer += `- **Active recovery only** (walking, light stretching)\n`;
    answer += `- **Consult your coach** about adjusting your training plan\n\n`;
  } else {
    answer += `### 🔄 Recommended Alternatives\n`;
    answer += `Instead of high-intensity work, consider:\n`;
    answer += `- **Low-intensity technique drills** (50-60% effort)\n`;
    answer += `- **Mobility and flexibility work**\n`;
    answer += `- **Recovery activities** (foam rolling, light swimming)\n`;
    answer += `- **Mental training** (film study, visualization)\n\n`;
  }

  // Add position-specific recovery if available
  if (userContext.position) {
    answer += `### Position-Specific Recovery (${userContext.position})\n`;
    const positionRecovery = getPositionSpecificRecovery(userContext.position);
    answer += positionRecovery + "\n\n";
  }

  // Add timeline estimate
  answer += `### 📅 When Can You Train Hard Again?\n`;
  answer += `Once your ACWR returns to the 0.8-1.3 range (typically 3-7 days with proper load management), `;
  answer += `you can safely resume high-intensity training. I'll be happy to help with your workout then!\n\n`;

  // Add injury context if relevant
  if (userContext.injuries && userContext.injuries.length > 0) {
    answer += `### ⚕️ Note About Your Current Condition\n`;
    answer += `You have ${userContext.injuries.length} active/recovering injury(ies). `;
    answer += `This makes load management even more critical. Please prioritize recovery.\n\n`;
  }

  return {
    answer,
    source: "acwr-safety-override",
    acwrBlocked: true,
  };
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
    quarterback: "Focus on arm care (light band work), footwork drills at low intensity, and film study of defensive coverages.",
    wr: "Work on route visualization, light cone drills, and hand-eye coordination exercises.",
    receiver: "Work on route visualization, light cone drills, and hand-eye coordination exercises.",
    rb: "Light agility ladder work, vision drills, and hip mobility exercises.",
    running: "Light agility ladder work, vision drills, and hip mobility exercises.",
    db: "Backpedal technique at low intensity, hip mobility, and coverage film study.",
    defensive: "Backpedal technique at low intensity, hip mobility, and coverage film study.",
    lb: "Light movement patterns, reaction drills at reduced speed, and tackling technique review.",
    linebacker: "Light movement patterns, reaction drills at reduced speed, and tackling technique review.",
    ol: "Stance work, hand placement drills, and lower body mobility.",
    line: "Stance work, hand placement drills, and lower body mobility.",
    center: "Snap technique practice, stance mobility, and blocking angle visualization.",
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
 */
function generateSuggestedActions(query, answer, userContext, riskLevel) {
  const actions = [];

  // High-risk: always suggest professional consultation
  if (riskLevel === RISK_LEVELS.HIGH) {
    actions.push({
      type: "ask_coach",
      reason: "High-risk topic requires professional guidance",
      label: "Consult Healthcare Provider",
    });
  }

  // Medium-risk with injuries: suggest recovery exercises
  if (riskLevel === RISK_LEVELS.MEDIUM && userContext.injuries.length > 0) {
    actions.push({
      type: "add_exercise",
      reason: "Add injury prevention exercises to your routine",
      label: "View Recovery Exercises",
      data: {
        injuryType: userContext.injuries[0]?.type,
      },
    });
  }

  // High load detected: suggest recovery
  if (userContext.recentLoad && userContext.recentLoad.avgRPE > 7) {
    actions.push({
      type: "create_session",
      reason: "High recent training load - recovery recommended",
      label: "Schedule Recovery Session",
    });
  }

  // General training query: suggest related content
  if (riskLevel === RISK_LEVELS.LOW) {
    actions.push({
      type: "read_article",
      reason: "Learn more about this topic",
      label: "View Related Articles",
    });
  }

  return actions;
}

/**
 * Save chat message to database
 */
async function saveChatMessage(sessionId, userId, message, response, classification) {
  try {
    // Save user message
    await supabaseAdmin.from("ai_messages").insert({
      session_id: sessionId,
      user_id: userId,
      role: "user",
      content: message,
      metadata: {
        classification,
      },
    });

    // Save assistant response
    const { data: assistantMessage } = await supabaseAdmin
      .from("ai_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: "assistant",
        content: response.answer,
        metadata: {
          riskLevel: response.riskLevel,
          citations: response.citations,
          suggestedActions: response.suggestedActions,
        },
      })
      .select()
      .single();

    return assistantMessage?.id;
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
      message: "You've been training for over an hour. Great work! Consider recovery.",
      icon: "pi pi-clock",
      priority: "medium",
    });
  }

  // Analyze fatigue
  if (context.userFatigue && context.userFatigue > 7) {
    insights.push({
      id: "fatigue-high",
      type: "Recovery",
      message: "You're showing signs of fatigue. Rest is important for performance.",
      icon: "pi pi-exclamation-triangle",
      priority: "high",
    });
  }

  // Analyze ACWR if available
  if (userContext && userContext.acwr) {
    const acwr = userContext.acwr;
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
    const activeInjuries = userContext.injuries.filter(i => i.status === "active");
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
      .filter(p => p.score !== undefined)
      .map(p => p.score);
    
    if (recentScores.length > 0) {
      const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;

      if (recentAvg > 85) {
        insights.push({
          id: "performance-excellent",
          type: "Motivation",
          message: "Your recent performance has been excellent! Keep up the great work!",
          icon: "pi pi-star",
          priority: "low",
        });
      } else if (recentAvg < 50) {
        insights.push({
          id: "performance-struggling",
          type: "Support",
          message: "Your recent performance suggests you might need extra recovery or support.",
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
        message: "High temperature detected. Stay hydrated and take more breaks.",
        icon: "pi pi-sun",
        priority: "high",
      });
    } else if (env.temperature && env.temperature < 5) {
      insights.push({
        id: "cold-warning",
        type: "Safety",
        message: "Cold conditions. Ensure proper warm-up before intense activity.",
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

exports.handler = async (event, context) => {
  // Extract sub-path to determine which endpoint is being called
  const path = event.path.replace("/.netlify/functions/ai-chat", "");
  const isAnalyzeContext = path.includes("/analyze-context") || event.path.includes("/api/ai/analyze-context");

  return baseHandler(event, context, {
    functionName: "ai-chat",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE", // More restrictive rate limiting for AI
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

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
            requestId
          );
        }

        // Parse request body
        let analysisContext;
        try {
          analysisContext = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId
          );
        }

        try {
          // Get user context for enhanced analysis
          const userContext = await getUserContext(userId);
          
          // Analyze context and generate insights
          const insights = await analyzeContext(analysisContext, userContext);

          return createSuccessResponse(
            insights,
            requestId
          );
        } catch (error) {
          console.error("[AI Chat] Error analyzing context:", error);
          return createErrorResponse(
            "Failed to analyze context",
            500,
            "internal_error",
            requestId
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
          requestId
        );
      }

      // Parse request body
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "invalid_json",
          requestId
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
          requestId
        );
      }

      if (message.length > MAX_QUERY_LENGTH) {
        return createErrorResponse(
          `Message too long (max ${MAX_QUERY_LENGTH} characters)`,
          400,
          "validation_error",
          requestId
        );
      }

      try {
        // 1. Classify intent and risk level (keyword-based)
        const baseClassification = classifyRiskLevel(message);
        console.log(`[AI Chat] Query classified as ${baseClassification.riskLevel} risk`, {
          intent: baseClassification.intent,
          requestId,
        });

        // 2. Get or create chat session
        const session = await getOrCreateSession(userId, session_id);

        // 3. Build user context (includes ACWR calculation)
        const userContext = await getUserContext(userId);
        if (team_id) userContext.teamId = team_id;

        // 4. Apply ACWR safety override if athlete is in danger zone
        const classification = applyACWRSafetyOverride(baseClassification, userContext, message);
        
        if (classification.acwrOverride) {
          console.log(`[AI Chat] ACWR Override applied - escalated from ${classification.originalRiskLevel} to ${classification.riskLevel}`, {
            acwr: classification.acwrData?.acwr,
            riskZone: classification.acwrData?.riskZone,
            requestId,
          });
        }

        // 5. Search knowledge base with evidence filtering
        const knowledge = await searchKnowledgeBase(
          message,
          classification.riskLevel,
          5
        );

        // 6. Generate AI response (modified if ACWR blocked)
        let aiResponse;
        if (classification.acwrOverride) {
          // Generate safety-first response for ACWR-blocked queries
          aiResponse = generateACWRBlockedResponse(message, classification, userContext);
        } else {
          aiResponse = await generateAIResponse(
            message,
            knowledge,
            userContext,
            classification.riskLevel
          );
        }

        // 7. Generate suggested actions
        const suggestedActions = generateSuggestedActions(
          message,
          aiResponse.answer,
          userContext,
          classification.riskLevel
        );

        // Add ACWR-specific actions if in danger zone
        if (classification.acwrOverride) {
          suggestedActions.unshift({
            type: "reduce_load",
            reason: classification.acwrBlockReason,
            label: "View Recovery Plan",
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
          }
        );

        // Add suggested actions to response
        response.suggestedActions = [
          ...(response.suggestedActions || []),
          ...suggestedActions,
        ];

        // 8. Save message and response
        const messageId = await saveChatMessage(
          session.id,
          userId,
          message,
          response,
          classification
        );

        // 9. Log recommendations for tracking
        for (const action of response.suggestedActions) {
          await logRecommendation(userId, session.id, action);
        }

        // 11. Return response
        return createSuccessResponse(
          {
            answer_markdown: response.answer,
            citations: response.citations,
            risk_level: response.riskLevel,
            disclaimer: response.disclaimer,
            suggested_actions: response.suggestedActions,
            chat_session_id: session.id,
            message_id: messageId,
            // ACWR safety information
            acwr_safety: classification.acwrOverride ? {
              blocked: true,
              reason: classification.acwrBlockReason,
              current_acwr: classification.acwrData?.acwr,
              risk_zone: classification.acwrData?.riskZone,
              original_risk_level: classification.originalRiskLevel,
            } : null,
            metadata: {
              ...response.metadata,
              source: aiResponse.source,
              model: aiResponse.model || null,
              usage: aiResponse.usage || null,
              acwr: classification.acwrData ? {
                ratio: classification.acwrData.acwr,
                riskZone: classification.acwrData.riskZone,
                canRecommendHighIntensity: classification.acwrData.canRecommendHighIntensity,
              } : null,
            },
          },
          requestId
        );
      } catch (error) {
        console.error("[AI Chat] Error processing request:", error);
        return createErrorResponse(
          "Failed to process chat request",
          500,
          "internal_error",
          requestId
        );
      }
    },
  });
};

