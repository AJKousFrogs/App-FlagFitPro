import { wrapHandler } from "./utils/lambda-compat.js";
import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import {
  classifyRiskLevel,
  generateSafeResponse,
  filterContent,
  filterSourcesByEvidence,
  RISK_LEVELS,
  INTENT_TYPES,
  classifyWithConfidence,
  generateBlockedYouthResponse,
} from "./utils/ai-safety-classifier.js";
import {
  isGroqConfigured,
  generateCoachingResponse,
  generateCoachingResponseStream,
} from "./utils/groq-client.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import {
  processSmartQuery,
  searchKnowledgeHybrid,
  updateCheckinStatus,
  buildCheckinMessage,
  ROUTING_ACTIONS,
} from "./utils/smart-ai-service.js";
import { isEmbeddingServiceAvailable } from "./utils/embedding-service.js";
import { guardMerlinRequest } from "./utils/merlin-guard.js";
import { computeAcwrAt } from "./utils/acwr.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.ai-chat" });

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
    logger.error("ai_chat_session_create_failed", error, { user_id: userId });
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
  const chronicStartDate = new Date(today);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);

  try {
    // Get all sessions in chronic window (28 days)
    const { data: sessions } = await supabaseAdmin
      .from("training_sessions")
      .select("session_date, duration_minutes, rpe, intensity_level")
      .eq("user_id", userId)
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

    // Canonical EWMA + uncoupled ACWR (utils/acwr.js — the single source of
    // truth, shared with calc-readiness/compute-acwr). The previous hand-rolled
    // ratio was COUPLED (the chronic window included the acute days), which
    // mathematically suppresses high ratios and UNDER-reports spike risk — the
    // dangerous direction for a safety gate feeding Merlin's recommendations.
    const loadsByDay = new Map();
    for (const s of sessions) {
      const rpe = s.rpe ?? s.intensity_level;
      const dur = s.duration_minutes;
      if (!s.session_date || !dur || rpe === null || rpe === undefined) {
        continue;
      }
      loadsByDay.set(
        s.session_date,
        (loadsByDay.get(s.session_date) || 0) + dur * rpe,
      );
    }
    const acwrResult = computeAcwrAt(loadsByDay, today);
    const acwr = acwrResult.acwr;
    const acuteLoad = acwrResult.acuteLoad;
    const chronicLoad = acwrResult.chronicLoad;

    if (acwr === null || acwr === undefined) {
      return {
        acwr: null,
        riskZone: "insufficient_data",
        acuteLoad,
        chronicLoad,
        sessionCount: sessions.length,
        message: "Not enough training history yet for a reliable ACWR.",
        canRecommendHighIntensity: true,
      };
    }

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
      chronicLoad,
      sessionCount: sessions.length,
      message,
      canRecommendHighIntensity,
    };
  } catch (error) {
    logger.error("ai_chat_acwr_calculation_failed", error, { user_id: userId });
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
    nutritionPlan: null, // NEW: Active nutrition targets for grounded fueling advice
  };

  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    // Resolved ahead of the batch below because the games query needs it as a
    // filter value. games has no player_id/user_id column (real columns:
    // team_id/team_score, see games-core.js normalizeGameRecord) — personal
    // (non-team) games use the synthetic team_id `TEAM_<userId>` convention
    // from games-core.js's getPersonalGameTeamId, so both must be checked.
    const { data: teamMembership } = await supabaseAdmin
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const personalGameTeamId = `TEAM_${userId}`;
    const gameTeamIds = teamMembership?.team_id
      ? [teamMembership.team_id, personalGameTeamId]
      : [personalGameTeamId];

    // Every read below keys only on userId (+ constant date windows) and is independent of
    // the others — fetch them all concurrently (~13 sequential round-trips -> 1). All
    // derivation (recentLoad, dataConfidence, bodyStats, ...) is in-memory after the fetch.
    // This runs on every Merlin message, so the latency win is large.
    const [
      acwrResult,
      { data: injuries },
      { data: protocol },
      { data: recentSessions },
      { data: wellness },
      { data: yesterdayWellness },
      { data: recentGames },
      { data: nutritionPlan },
      { data: activeRecovery },
      { data: loadCap },
      { data: profile },
      { data: measurement },
    ] = await Promise.all([
      calculateUserACWR(userId),
      // v_injuries_unified maps the clinical athlete_injuries table onto the legacy injuries
      // column shape, incl. injury_grade -> numeric severity.
      supabaseAdmin
        .from("v_injuries_unified")
        .select("type:injury_type, severity, body_part, status")
        .eq("user_id", userId)
        .in("status", ["active", "recovering", "monitoring"])
        .order("severity", { ascending: false })
        .limit(5),
      supabaseAdmin
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
        .single(),
      supabaseAdmin
        .from("training_sessions")
        .select(
          "session_date, session_type, duration_minutes, intensity_level, performance_score",
        )
        .eq("user_id", userId)
        .order("session_date", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("daily_wellness_checkin")
        .select("*")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .single(),
      supabaseAdmin
        .from("daily_wellness_checkin")
        .select("calculated_readiness")
        .eq("user_id", userId)
        .eq("checkin_date", yesterdayStr)
        .maybeSingle(),
      supabaseAdmin
        .from("games")
        .select("game_date, team_score, opponent_score")
        .in("team_id", gameTeamIds)
        .gte("game_date", sevenDaysAgoStr)
        .order("game_date", { ascending: false })
        .limit(3),
      supabaseAdmin
        .from("nutrition_plans")
        .select(
          "plan_name, target_calories, protein_g, carbs_g, fat_g, hydration_goal_liters, meal_timing_notes",
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("recovery_blocks")
        .select(
          "block_type, block_start_date, block_end_date, max_load_percent, focus",
        )
        .eq("user_id", userId)
        .lte("block_start_date", today)
        .gte("block_end_date", today)
        .maybeSingle(),
      Promise.resolve({ data: null }),
      supabaseAdmin
        .from("users")
        .select("position, height_cm, weight_kg")
        .eq("id", userId)
        .single(),
      supabaseAdmin
        .from("physical_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    // In-memory assembly (order + semantics preserved from the original sequential code).
    context.injuries = injuries || [];

    context.acwr = acwrResult;
    if (context.acwr && context.acwr.acuteLoad > 0) {
      context.recentLoad = {
        weeklyLoad: context.acwr.acuteLoad,
        sessionCount: context.acwr.sessionCount || 0,
        avgRPE: context.acwr.acuteLoad / (context.acwr.sessionCount || 1) / 60,
        acwr: context.acwr.acwr,
        riskZone: context.acwr.riskZone,
      };
    }

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

    context.recentSessions = recentSessions || [];
    context.latestWellness = wellness;

    if (yesterdayWellness && yesterdayWellness.calculated_readiness < 40) {
      context.yesterdayWellness = {
        readiness_score: yesterdayWellness.calculated_readiness,
      };
    }

    context.recentGames = recentGames || [];
    context.nutritionPlan = nutritionPlan || null;

    if (activeRecovery) {
      context.activeRecovery = {
        type: activeRecovery.protocol_type,
        maxLoad: activeRecovery.max_load_percent / 100,
        focus: activeRecovery.focus,
      };
    }

    // load_cap overrides the recovery-block activeRecovery when both exist (order preserved)
    if (loadCap) {
      context.activeRecovery = {
        type: "load_cap",
        sessionsRemaining: loadCap.sessions_remaining,
        maxLoad: loadCap.max_load_percent / 100,
        reason: loadCap.reason,
      };
    }

    // Data confidence
    const missingInputs = [];
    const staleData = [];
    let confidenceScore = 1.0;

    if (!wellness) {
      missingInputs.push("wellness_checkin");
      confidenceScore *= 0.7;
    } else {
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

    if (context.recentSessions.length < 10) {
      missingInputs.push(
        `${10 - context.recentSessions.length} training_sessions`,
      );
      confidenceScore *= Math.min(context.recentSessions.length / 10, 1.0);
    }

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

    if (profile) {
      context.position = profile.position;
      context.role = profile.role;

      context.bodyStats = {
        height: profile.height_cm,
        weight: measurement?.weight_kg || profile.weight_kg,
        bodyFat: measurement?.body_fat_percentage,
        muscleMass: measurement?.muscle_mass_kg,
        hydration: wellness?.hydration_level,
      };
    }

    if (teamMembership) {
      context.teamId = teamMembership.team_id;
      context.role ||= teamMembership.role;
    }
  } catch (error) {
    logger.error("ai_chat_user_context_fetch_failed", error, {
      user_id: userId,
    });
  }

  return context;
}

import {
  getActiveConversationContexts,
  saveConversationContext,
  markContextReferenced,
  getPendingFollowups,
  createFollowup,
  markFollowupTriggered,
  buildConversationMemoryPrompt,
  determineContextToCreate,
} from "./utils/ai-chat/conversation-context.js";

import {
  getUserAIPreferences,
  updateUserPreferences,
  buildPersonalizationPrompt,
} from "./utils/ai-chat/user-preferences.js";

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
    // Athlete-state gates: ACWR + injuries + age group + today's readiness + upcoming
    // game + profile all read by userId (+ constant date windows) and are independent —
    // fetch concurrently (6 sequential round-trips -> 1).
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split("T")[0];
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const [
      acwrResult,
      { data: injuries },
      { data: ageData },
      { data: dailyState },
      { data: upcomingGame },
      { data: userProfile },
    ] = await Promise.all([
      calculateUserACWR(userId),
      // clinical injuries via the compat view (see safety-context read above)
      supabaseAdmin
        .from("v_injuries_unified")
        .select(
          "id, type:injury_type, severity, body_part, status, start_date:injury_date",
        )
        .eq("user_id", userId)
        .in("status", ["active", "recovering", "monitoring"])
        .gte("injury_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("severity", { ascending: false }),
      supabaseAdmin
        .from("user_age_groups")
        .select("age_group, age_years")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("daily_wellness_checkin")
        .select("*, readiness_score:calculated_readiness")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .single(),
      supabaseAdmin
        .from("games")
        .select("game_id, game_date, opponent_team_name, game_time")
        .gte("game_date", today)
        .lte("game_date", twoDaysFromNow.toISOString().split("T")[0])
        .order("game_date", { ascending: true })
        .limit(1)
        .single(),
      supabaseAdmin
        .from("users")
        .select("position, full_name, first_name")
        .eq("id", userId)
        .single(),
    ]);

    gates.acwr = acwrResult;
    gates.injuries = injuries || [];

    if (ageData) {
      gates.ageGroup = ageData.age_group || "adult";
      gates.ageYears = ageData.age_years;
    }

    gates.dailyState = dailyState;
    gates.upcomingGame = upcomingGame;

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

    logger.info("ai_chat_state_gates_built", {
      ageGroup: gates.ageGroup,
      acwrZone: gates.acwr?.riskZone,
      injuryCount: gates.injuries.length,
      dailyPain: gates.dailyState?.pain_level,
      riskEscalation: gates.riskEscalation,
      escalationReasons: gates.escalationReasons,
      user_id: userId,
    });
  } catch (error) {
    logger.error("ai_chat_state_gates_build_failed", error, {
      user_id: userId,
    });
    // Return partial gates, don't block on error
  }

  return gates;
}

import {
  getYouthSettings,
  getConversationHistory,
  getSessionMessages,
  getRecentSessions,
  createYouthParentNotification,
} from "./utils/ai-chat/youth-safety.js";

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
    logger.info("ai_chat_state_gate_risk_escalated", {
      user_id: stateGates.userId || null,
      from_risk: baseClassification.riskLevel,
      to_risk: escalatedRisk,
      escalation_reasons: escalationReasons,
    });
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
  logger.info("ai_chat_acwr_safety_override_applied", {
    acwr_value: acwr.acwr,
    acwr_zone: acwr.riskZone,
  });

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

function detectKnowledgeBias(goalFocus, query) {
  const lowerQuery = query.toLowerCase();

  if (
    goalFocus === "nutrition_guidance" ||
    /(nutrition|meal|food|hydrate|hydration|supplement|protein|carb|electrolyte|fuel)/.test(
      lowerQuery,
    )
  ) {
    return {
      categories: ["nutrition", "supplement", "recovery", "recovery_method"],
      semanticWeight: 0.35,
    };
  }

  if (
    goalFocus === "recovery_guidance" ||
    /(recovery|sleep|sore|fatigue|pain|injury prevention)/.test(lowerQuery)
  ) {
    return {
      categories: [
        "recovery",
        "recovery_method",
        "injury_prevention",
        "injury",
      ],
      semanticWeight: 0.45,
    };
  }

  if (goalFocus === "training_guidance") {
    return {
      categories: ["training", "training_method", "technique"],
      semanticWeight: isEmbeddingServiceAvailable() ? 0.7 : 0,
    };
  }

  return {
    categories: [],
    semanticWeight: isEmbeddingServiceAvailable() ? 0.7 : 0,
  };
}

async function getCategoryBiasedKnowledge(
  query,
  categories,
  riskLevel,
  limit = 5,
) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  const keywords = extractSearchKeywords(query);
  const searchConditions = keywords
    .slice(0, 5)
    .map(
      (kw) =>
        `topic.ilike.%${kw}%,question.ilike.%${kw}%,answer.ilike.%${kw}%,summary.ilike.%${kw}%`,
    )
    .join(",");

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
      query_count,
      updated_at
    `,
    )
    .eq("is_merlin_approved", true)
    .in("entry_type", categories)
    .or(searchConditions)
    .order("query_count", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit * 2);

  if (error) {
    logger.warn("ai_chat_category_biased_knowledge_failed", error, {
      categories,
      query,
    });
    return [];
  }

  const sources = (entries || []).map((e) => ({
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

  return filterSourcesByEvidence(sources, riskLevel).slice(0, limit);
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
      logger.info("ai_chat_using_groq_llm", {
        query,
        risk_level: riskLevel,
      });

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
      logger.error("ai_chat_groq_api_error", error, {
        query,
        risk_level: riskLevel,
        message: error?.message,
      });
      // Fall through to knowledge base fallback
    }
  } else {
    logger.info("ai_chat_groq_not_configured", {
      query,
      risk_level: riskLevel,
    });
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
  if (userContext.goalFocusPrompt) {
    answer += `\n\n${userContext.goalFocusPrompt}`;
  }

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

function normalizeConversationGoal(goal) {
  if (typeof goal !== "string") {
    return null;
  }

  const normalized = goal.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const allowedGoals = new Set([
    "nutrition_guidance",
    "training_guidance",
    "recovery_guidance",
    "coach_strategy",
    "performance_guidance",
  ]);

  return allowedGoals.has(normalized) ? normalized : null;
}

function normalizeTimeHorizon(timeHorizon) {
  if (typeof timeHorizon !== "string") {
    return "immediate";
  }

  const normalized = timeHorizon.trim().toLowerCase();
  return ["immediate", "weekly", "monthly", "seasonal"].includes(normalized)
    ? normalized
    : "immediate";
}

function buildGoalFocusPrompt(goalFocus, timeHorizon) {
  const horizonLabel =
    {
      immediate: "right now",
      weekly: "over the next 7 days",
      monthly: "over the next few weeks",
      seasonal: "over the current season",
    }[timeHorizon] || "right now";

  switch (goalFocus) {
    case "nutrition_guidance":
      return `Keep the answer grounded in fueling, hydration, recovery nutrition, and approved evidence. Prioritize actions the athlete can use ${horizonLabel}.`;
    case "training_guidance":
      return `Focus on session structure, drills, training progression, and workload decisions. Emphasize what to do ${horizonLabel}.`;
    case "recovery_guidance":
      return `Prioritize recovery, soreness management, sleep, hydration, and safe return-to-training guidance ${horizonLabel}.`;
    case "coach_strategy":
      return `Frame the answer like a coach workflow: team planning, prioritization, roster decisions, and practical next actions ${horizonLabel}.`;
    case "performance_guidance":
      return `Focus on improving performance with specific, practical next steps ${horizonLabel}.`;
    default:
      return "";
  }
}

function buildKnowledgeSearchQuery(message, goalFocus, timeHorizon) {
  const expansions = [];

  if (goalFocus === "nutrition_guidance") {
    expansions.push("nutrition hydration fueling recovery");
  } else if (goalFocus === "training_guidance") {
    expansions.push("training drills workload session planning");
  } else if (goalFocus === "recovery_guidance") {
    expansions.push("recovery soreness sleep hydration injury prevention");
  } else if (goalFocus === "coach_strategy") {
    expansions.push("coach strategy planning roster practice");
  } else if (goalFocus === "performance_guidance") {
    expansions.push("performance speed agility conditioning");
  }

  if (timeHorizon && timeHorizon !== "immediate") {
    expansions.push(timeHorizon);
  }

  return [message, ...expansions].filter(Boolean).join(" ");
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
    logger.error("ai_chat_recovery_alternatives_fetch_failed", error, {
      position,
    });
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
  const normalizedQuery = (query || "").toLowerCase();
  const isNutritionQuery =
    userContext.goalFocus === "nutrition_guidance" ||
    /(eat|meal|nutrition|hydrate|hydration|protein|carb|calories|fuel|supplement|snack)/.test(
      normalizedQuery,
    );
  const isHydrationFocused = /hydrate|hydration|fluids|electrolyte|drink/.test(
    normalizedQuery,
  );

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

  // Nutrition and fueling guidance: turn Merlin answers into product follow-through.
  if (isNutritionQuery) {
    if (userContext.nutritionPlan) {
      actions.push({
        type: "review_nutrition_targets",
        reason:
          "Use your saved backend targets to turn guidance into a daily plan",
        label: "Review Nutrition Targets",
        isMicroSession: false,
      });
    }

    actions.push({
      type: "build_fueling_day",
      reason: "Convert this advice into a practical fueling routine for today",
      label: "Build Fueling Day",
      isMicroSession: false,
    });

    actions.push({
      type: "review_hydration_plan",
      reason: isHydrationFocused
        ? "Track hydration and electrolytes in your recovery flow"
        : "Turn fueling guidance into a hydration plan",
      label: "Review Hydration Plan",
      isMicroSession: false,
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

  return actions.slice(0, 3);
}

import {
  saveChatMessage,
  logRecommendation,
  createCoachInboxItem,
  analyzeContext,
} from "./utils/ai-chat/persistence.js";

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
  const isSessionListFetch =
    event.httpMethod === "GET" &&
    (path === "/sessions" || event.path.includes("/api/ai/chat/sessions"));
  const isSessionFetch =
    event.httpMethod === "GET" &&
    (path.includes("/session/") ||
      event.path.includes("/api/ai/chat/session/"));
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
      if (event.httpMethod === "GET") {
        if (isSessionListFetch) {
          try {
            const sessions = await getRecentSessions(userId);
            return createSuccessResponse({ sessions }, requestId);
          } catch (error) {
            return createErrorResponse(
              error.message || "Failed to load recent chat sessions",
              500,
              "server_error",
              requestId,
            );
          }
        }

        if (!isSessionFetch || !sessionMatch?.[1]) {
          return createErrorResponse(
            "GET is only supported for /api/ai/chat/sessions or /api/ai/chat/session/:sessionId",
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
        const parsedBody = tryParseJsonObjectBody(event.body, { requestId });
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        analysisContext = parsedBody.data;

        try {
          // Get user context for enhanced analysis
          const userContext = await getUserContext(userId);

          // Analyze context and generate insights
          const insights = await analyzeContext(analysisContext, userContext);

          return createSuccessResponse(insights, requestId);
        } catch (error) {
          logger.error("ai_chat_context_analysis_failed", error, {
            user_id: userId,
          });
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
      const parsedBody = tryParseJsonObjectBody(event.body, { requestId });
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;

      const { message, session_id, team_id, goal, time_horizon } = body;

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
        const goalFocus = normalizeConversationGoal(goal);
        const timeHorizon = normalizeTimeHorizon(time_horizon);
        if (team_id) {
          userContext.teamId = team_id;
        }
        userContext.stateGates = stateGates;
        userContext.position = stateGates.position || userContext.position;
        userContext.ageGroup = stateGates.ageGroup;
        userContext.goalFocus = goalFocus;
        userContext.timeHorizon = timeHorizon;
        userContext.goalFocusPrompt = buildGoalFocusPrompt(
          goalFocus,
          timeHorizon,
        );

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

        logger.info("ai_chat_phase4_memory_loaded", {
          request_id: requestId,
          contexts: conversationContexts.length,
          pending_followups: pendingFollowups.length,
        });

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

        logger.info("ai_chat_phase3_classification", {
          request_id: requestId,
          risk_level: enhancedClassification.riskLevel,
          confidence: enhancedClassification.confidence,
          intent: enhancedClassification.intent,
          is_youth_user: enhancedClassification.isYouthUser,
          escalated: enhancedClassification.escalated,
        });

        // 7. Phase 3: Check for blocked youth topics
        if (enhancedClassification.youthRestrictions?.isBlocked) {
          logger.warn("ai_chat_youth_topic_blocked", {
            request_id: requestId,
            reason: enhancedClassification.youthRestrictions.blockedReason,
          });

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
          logger.info("ai_chat_acwr_override_logged", {
            request_id: requestId,
            from_risk: classification.originalRiskLevel,
            to_risk: classification.riskLevel,
            acwr_value: classification.acwrData?.acwr,
            acwr_zone: classification.acwrData?.riskZone,
          });
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

        logger.info("ai_chat_smart_ai_routing", {
          request_id: requestId,
          routing_action: smartResult.routingAction,
          confidence: smartResult.confidence,
          has_memory: Boolean(smartResult.memory?.hasMemory),
        });

        // 10a. SMART AI: Handle clarification requests
        if (smartResult.shouldAskClarification) {
          logger.info("ai_chat_smart_ai_asking_clarification", {
            request_id: requestId,
            ambiguity_reasons: smartResult.ambiguityReasons,
          });

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
        const knowledgeQuery = buildKnowledgeSearchQuery(
          normalizedMessage,
          goalFocus,
          timeHorizon,
        );
        const knowledgeBias = detectKnowledgeBias(goalFocus, normalizedMessage);
        const biasedKnowledge = await getCategoryBiasedKnowledge(
          knowledgeQuery,
          knowledgeBias.categories,
          classification.riskLevel,
          5,
        );
        const fallbackKnowledge =
          smartResult.knowledge ||
          (await searchKnowledgeHybrid(knowledgeQuery, {
            limit: 5,
            semanticWeight: knowledgeBias.semanticWeight,
          }));
        const knowledge = [...biasedKnowledge, ...(fallbackKnowledge || [])]
          .filter(
            (entry, index, array) =>
              array.findIndex((candidate) => candidate.id === entry.id) ===
              index,
          )
          .slice(0, 5);

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
            logger.error("ai_chat_checkin_update_failed", err, {
              user_id: userId,
              checkin_id: checkin.id,
            }),
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
          logger.error("ai_chat_user_preferences_update_failed", err, {
            user_id: userId,
          }),
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
            logger.error("ai_chat_conversation_context_save_failed", err, {
              user_id: userId,
              context_key: contextToCreate.contextKey,
            }),
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
              logger.error("ai_chat_followup_creation_failed", err, {
                user_id: userId,
                followup_type: contextToCreate.createFollowup.type,
              }),
            );
          }
        }

        // 14. Phase 4: Mark any triggered follow-ups
        if (pendingFollowups.length > 0) {
          // Mark first pending follow-up as triggered since we're responding
          markFollowupTriggered(pendingFollowups[0].id).catch((err) =>
            logger.error("ai_chat_followup_mark_failed", err, {
              followup_id: pendingFollowups[0].id,
            }),
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
        logger.error("ai_chat_request_processing_failed", error, {
          request_id: requestId,
          user_id: userId,
        });
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

// ─── Native Netlify Functions v2 handler ─────────────────────────────────────
//
// POST requests with `Accept: text/event-stream` are handled here with
// real-time SSE streaming (tokens appear as Groq generates them).
//
// All other requests (GET, non-streaming POST) fall through to the legacy
// Lambda-style handler via the runtime-v2-adapter, preserving backward
// compatibility with zero code changes in the business logic.
//
// SSE event format:
//   data: {"type":"token","token":"…"}     — one per Groq token
//   data: {"type":"done","payload":{…}}    — final payload (citations, actions…)
//   data: {"type":"error","message":"…"}   — on failure
// ─────────────────────────────────────────────────────────────────────────────

const STREAM_CORS_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // disable Nginx buffering on Netlify infra
};

/**
 * Encode an SSE event line.
 * @param {object} payload
 * @returns {Uint8Array}
 */
function sseEvent(payload) {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Run all pre-processing for a chat POST (auth, context, safety, knowledge).
 * Returns the same data that the legacy handler assembles before calling
 * generateAIResponse — extracted inline here to avoid duplicating logic.
 *
 * Returns null + streams an error event on failure.
 */
async function runPreProcessing(req, controller) {
  // 1. Auth
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    controller.enqueue(
      sseEvent({ type: "error", message: "Authorization token required" }),
    );
    controller.close();
    return null;
  }

  const fakeEvent = { headers: { authorization: authHeader } };
  const authResult = await authenticateRequest(fakeEvent);
  if (!authResult.success) {
    controller.enqueue(
      sseEvent({ type: "error", message: "Invalid or expired token" }),
    );
    controller.close();
    return null;
  }

  return { userId: authResult.user.id, token };
}

export default async (req) => {
  const isStreamRequest =
    req.method === "POST" &&
    (req.headers.get("accept") || "").includes("text/event-stream");

  if (!isStreamRequest) {
    // ── Non-streaming path: delegate to legacy Lambda handler ────────────────
    return wrapHandler(handler)(req);
  }

  // ── Streaming POST path ───────────────────────────────────────────────────
  const encoder = new TextEncoder();
  let controllerRef = null;

  const stream = new ReadableStream({
    async start(controller) {
      controllerRef = controller;

      try {
        // Step 1: Auth
        const auth = await runPreProcessing(req, controller);
        if (!auth) {
          return;
        } // error already sent

        const { userId } = auth;

        // Step 2: Parse body
        let body;
        try {
          body = await req.json();
        } catch {
          controller.enqueue(
            sseEvent({ type: "error", message: "Invalid JSON body" }),
          );
          controller.close();
          return;
        }

        const { message, session_id, team_id, goal, time_horizon } = body;
        if (!message || typeof message !== "string" || !message.trim()) {
          controller.enqueue(
            sseEvent({ type: "error", message: "Message is required" }),
          );
          controller.close();
          return;
        }

        const normalizedMessage = message.trim().substring(0, MAX_QUERY_LENGTH);

        // Step 3: Merlin guard
        const guardReq = {
          method: "POST",
          path: req.url,
          headers: Object.fromEntries(req.headers),
          body: JSON.stringify(body),
        };
        const blocked = guardMerlinRequest(guardReq);
        if (blocked?.statusCode === 403) {
          controller.enqueue(
            sseEvent({ type: "error", message: "Request blocked" }),
          );
          controller.close();
          return;
        }

        // Step 4: Check AI consent
        const consent = await checkAiProcessingConsent(userId);
        if (!consent) {
          controller.enqueue(
            sseEvent({
              type: "error",
              message: "AI processing consent not granted",
            }),
          );
          controller.close();
          return;
        }

        // Step 5: Session + context (parallel where possible)
        const [session, stateGates, userContext] = await Promise.all([
          getOrCreateSession(userId, session_id || null),
          buildAthleteStateGates(userId),
          getUserContext(userId),
        ]);

        // Step 6: Conversation history + contexts
        const [conversationHistory, conversationContexts, pendingFollowups] =
          await Promise.all([
            getConversationHistory(session.id, 10),
            getActiveConversationContexts(userId, 5),
            getPendingFollowups(userId),
          ]);

        // Step 7: Youth settings
        const isYouthUser = stateGates.ageGroup !== "adult";
        const youthSettings = isYouthUser
          ? await getYouthSettings(userId)
          : null;

        // Step 8: Classification + safety
        // userContext.ageGroup must be set (not just nested under stateGates) —
        // classifyWithConfidence's isYouth check reads userContext.ageGroup
        // directly (utils/ai-safety-classifier.js), the same as the
        // non-streaming path does at "userContext.ageGroup = stateGates.ageGroup"
        // above. Without this, youth restrictions never even evaluate here,
        // regardless of the athlete's real age.
        userContext.ageGroup = stateGates.ageGroup;
        const enhancedClassification = await classifyWithConfidence(
          normalizedMessage,
          { ...userContext, stateGates, youthSettings },
        );

        // classifyWithConfidence returns youthRestrictions.isBlocked, not a
        // top-level isYouthBlocked — that field never existed, so this check
        // was always false and no youth topic was ever blocked on the
        // streaming path. Mirrors the non-streaming path's block handling
        // (log, save the blocked interaction, notify the parent) as closely
        // as the SSE response shape allows.
        if (enhancedClassification.youthRestrictions?.isBlocked) {
          // This streaming path has no requestId (only the legacy non-streaming
          // handler receives one from baseHandler) — session.id is the closest
          // in-scope correlation key.
          logger.warn("ai_chat_youth_topic_blocked", {
            session_id: session.id,
            reason: enhancedClassification.youthRestrictions.blockedReason,
          });

          const blockedResponse = generateBlockedYouthResponse(
            enhancedClassification.youthRestrictions.blockedReason,
            enhancedClassification.entities,
          );

          const savedMessageId = await saveChatMessage(
            session.id,
            userId,
            normalizedMessage,
            blockedResponse,
            enhancedClassification,
          );

          if (isYouthUser) {
            await createYouthParentNotification(
              userId,
              "blocked_topic",
              `Blocked query: ${normalizedMessage.substring(0, 50)}...`,
              enhancedClassification.youthRestrictions.blockedReason,
              savedMessageId,
            );
          }

          controller.enqueue(
            sseEvent({
              type: "error",
              message: "This topic is restricted for your age group",
            }),
          );
          controller.close();
          return;
        }

        let classification = classifyRiskLevel(normalizedMessage, userContext);
        classification = applyStateGateEscalation(classification, stateGates);
        classification = applyACWRSafetyOverride(
          classification,
          userContext,
          normalizedMessage,
        );

        // Step 9: ACWR blocked — swap plan (not streamed, it's a special response)
        if (classification.acwrOverride) {
          const swapResponse = await generateACWRBlockedResponse(
            normalizedMessage,
            classification,
            userContext,
          );
          const safeResponse = generateSafeResponse(
            classification.riskLevel,
            swapResponse.answer,
            swapResponse.citations || [],
            {
              requiresProfessional: true,
              acwrOverride: true,
              acwrData: classification.acwrData,
            },
          );
          const messageId = await saveChatMessage(
            session.id,
            userId,
            normalizedMessage,
            safeResponse,
            classification,
          );
          if (messageId) {
            await createCoachInboxItem(
              messageId,
              userId,
              normalizedMessage,
              classification,
              stateGates,
            );
          }
          controller.enqueue(
            sseEvent({
              type: "done",
              payload: {
                answer_markdown: safeResponse.answer,
                citations: safeResponse.citations || [],
                risk_level: safeResponse.riskLevel,
                disclaimer: safeResponse.disclaimer || null,
                suggested_actions: safeResponse.suggestedActions || [],
                chat_session_id: session.id,
                message_id: messageId || null,
                is_swap_plan: true,
                acwr_safety: {
                  blocked: true,
                  reason: classification.acwrBlockReason,
                  current_acwr: classification.acwrData?.acwr,
                  risk_zone: classification.acwrData?.riskZone,
                },
              },
            }),
          );
          controller.close();
          return;
        }

        // Step 10: Smart AI routing + knowledge
        const memoryPrompt = conversationContexts
          .map((c) => c.context_summary)
          .filter(Boolean)
          .slice(0, 3)
          .join(" | ");

        const smartResult = await processSmartQuery(normalizedMessage, {
          userId,
          userContext,
          conversationHistory,
          sessionId: session.id,
        });

        const [knowledgeFromBias, knowledgeFromHybrid] = await Promise.all([
          getCategoryBiasedKnowledge(
            normalizedMessage,
            [classification.intent],
            classification.riskLevel,
            3,
          ),
          searchKnowledgeHybrid(normalizedMessage, {
            userId,
            riskLevel: classification.riskLevel,
            limit: 5,
          }),
        ]);

        const knowledgeSeen = new Set();
        const knowledge = [...knowledgeFromBias, ...(knowledgeFromHybrid || [])]
          .filter(
            (k) => k?.id && !knowledgeSeen.has(k.id) && knowledgeSeen.add(k.id),
          )
          .slice(0, 5);

        const enhancedContext = {
          ...userContext,
          conversationHistory: conversationHistory.map((h) => ({
            role: h.role,
            content: h.content,
          })),
          userName: stateGates.userName || null,
          dailyState: stateGates.dailyState || null,
          upcomingGame: stateGates.upcomingGame || null,
          memoryPrompt,
          goal,
          time_horizon,
          team_id,
        };

        // ── Step 11: Stream Groq tokens ──────────────────────────────────────
        const groqGen = generateCoachingResponseStream({
          query: normalizedMessage,
          riskLevel: classification.riskLevel,
          userContext: {
            ...enhancedContext,
            athleteName: enhancedContext.userName,
          },
          knowledgeSources: knowledge,
          conversationHistory: enhancedContext.conversationHistory,
        });

        let fullAnswer = "";
        let streamModel = null;
        let streamUsage = null;

        // Manually iterate to capture the generator's return value
        // (the {model, usage} object returned after the last yield)
        while (true) {
          const { value, done } = await groqGen.next();
          if (done) {
            // Return value of the generator — { model, usage }
            if (value) {
              streamModel = value.model ?? null;
              streamUsage = value.usage ?? null;
            }
            break;
          }
          fullAnswer += value;
          controller.enqueue(sseEvent({ type: "token", token: value }));
        }

        // ── Step 12: Fire-and-forget post-processing ──────────────────────────
        const filteredAnswer = filterContent(
          fullAnswer,
          classification.riskLevel,
        );
        const aiResponse = {
          answer: filteredAnswer,
          source: "groq-ai",
          model: streamModel,
          usage: streamUsage,
        };
        const finalAiResponse = addEvidenceExplanation(aiResponse);

        const safeResponse = generateSafeResponse(
          classification.riskLevel,
          finalAiResponse.answer,
          knowledge,
          {
            requiresProfessional: classification.requiresProfessional,
            requiresLabs: classification.requiresLabs,
            evidenceLevel: knowledge[0]?.evidence_grade || "limited",
            acwrData: classification.acwrData,
          },
        );

        const suggestedActions = generateSuggestedActions(
          normalizedMessage,
          finalAiResponse.answer,
          userContext,
          classification.riskLevel,
          classification.intent,
        );
        safeResponse.suggestedActions = [
          ...(safeResponse.suggestedActions || []),
          ...suggestedActions,
        ];

        // DB operations — fire-and-forget (don't block the stream close)
        (async () => {
          try {
            const messageId = await saveChatMessage(
              session.id,
              userId,
              normalizedMessage,
              safeResponse,
              classification,
            );
            if (messageId) {
              await createCoachInboxItem(
                messageId,
                userId,
                normalizedMessage,
                classification,
                stateGates,
              );
              for (const action of safeResponse.suggestedActions) {
                await logRecommendation(userId, session.id, action);
              }
              // Send the final done event with message_id from DB
              controller.enqueue(
                sseEvent({
                  type: "done",
                  payload: {
                    answer_markdown: safeResponse.answer,
                    citations: safeResponse.citations || [],
                    risk_level: safeResponse.riskLevel,
                    disclaimer: safeResponse.disclaimer || null,
                    suggested_actions: safeResponse.suggestedActions || [],
                    chat_session_id: session.id,
                    message_id: messageId,
                    intent: classification.intent,
                    is_swap_plan: false,
                    acwr_safety: null,
                    state_gate_escalation: classification.stateGateEscalation
                      ? {
                          escalated: true,
                          original_risk: classification.originalRiskLevel,
                          escalated_risk: classification.riskLevel,
                          reasons: classification.escalationReasons,
                        }
                      : null,
                    smart_ai: {
                      routing_action: smartResult.routingAction,
                      confidence: smartResult.confidence,
                      knowledge_sources_count: knowledge.length,
                    },
                    metadata: {
                      source: finalAiResponse.source,
                      model: streamModel,
                      usage: streamUsage,
                    },
                  },
                }),
              );
            }
          } catch (postErr) {
            logger.error("ai_chat_stream_post_processing_failed", postErr, {
              user_id: userId,
            });
          } finally {
            controller.close();
          }
        })();

        // Side effects — fire-and-forget
        updateUserPreferences(userId, {
          intent: classification.intent,
          position: userContext.position,
        }).catch((e) =>
          logger.error("ai_chat_stream_prefs_update_failed", e, {
            user_id: userId,
          }),
        );

        for (const ctx of conversationContexts) {
          markContextReferenced(ctx.id);
        }

        if (pendingFollowups.length > 0) {
          markFollowupTriggered(pendingFollowups[0].id).catch(() => {});
        }
      } catch (err) {
        logger.error("ai_chat_stream_handler_failed", err);
        try {
          controllerRef?.enqueue(
            sseEvent({ type: "error", message: "Internal server error" }),
          );
          controllerRef?.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, { headers: STREAM_CORS_HEADERS });
};
