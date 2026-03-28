import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./utils/supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import {
  getIsoDateString,
  getIsoDayOfWeek,
  getIsoDayOfYear,
  parseIsoDateString,
} from "./utils/date-utils.js";
import { resolveTodaySession } from "./utils/session-resolver.js";
import { resolveTeamActivityForAthleteDay } from "./utils/team-activity-resolver.js";
import { getTrainingProgramById } from "./utils/training-programs.js";
import {
  buildAcwrPresentation,
  computeReadinessDaysStale,
  computeTrainingDaysLogged,
  computeDynamicConfidenceMetadata,
  transformExercise,
  transformProtocolResponse,
} from "./utils/daily-protocol-response.js";
import {
  getCurrentPeriodizationPhase,
  getPlyometricIntensity,
  getSafeConditioningIntensity,
  shouldIncludeNordicCurls,
} from "./utils/daily-protocol-training-logic.js";
import { generateFallbackProtocolExercises } from "./utils/daily-protocol-fallback-exercises.js";
import {
  addFoamRollBlock,
  addMorningMobilityBlock,
  addRecoveryBlocks,
  addWarmupBlock,
} from "./utils/daily-protocol-blocks.js";
import {
  calculateAge,
  computeOverride,
  normalizePosition,
} from "./utils/daily-protocol-context.js";
import { buildProtocolDecisionContext } from "./utils/daily-protocol-decision.js";
import { persistFallbackProtocolWhenExercisesMissing } from "./utils/daily-protocol-fallback.js";
import { generateMainSessionFallback } from "./utils/daily-protocol-main-session.js";
import { generateReturnToPlayProtocol } from "./utils/daily-protocol-rtp.js";
import { generateTemplateMainSession } from "./utils/daily-protocol-template-session.js";
import {
  buildProtocolGenerationIdempotencyKey,
  createProtocolGenerationRequest,
  getExistingProtocolGenerationRequest,
  persistGeneratedProtocol,
} from "./utils/daily-protocol-persistence.js";
const TRAINING_SESSIONS_TABLE = "training_sessions";

function isMissingProtocolPersistenceError(error) {
  const code = error?.code;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST204" ||
    message.includes("protocol_exercises") ||
    message.includes("generate_protocol_transactional") ||
    message.includes("protocol_generation_requests")
  );
}

function buildTransientProtocolResponse({
  userId,
  date,
  readinessScore,
  acwrValue,
  trainingFocus,
  aiRationale,
  adjustedLoadTarget,
  confidenceMetadata,
  protocolExercises,
  headers,
  sessionResolution = null,
}) {
  const timestamp = new Date().toISOString();
  const transientProtocol = {
    id: `transient-${userId}-${date}`,
    user_id: userId,
    protocol_date: date,
    readiness_score: readinessScore,
    acwr_value: acwrValue,
    total_load_target_au: adjustedLoadTarget,
    ai_rationale: aiRationale,
    training_focus: trainingFocus,
    overall_progress: 0,
    completed_exercises: 0,
    total_exercises: protocolExercises.length,
    generated_at: timestamp,
    updated_at: timestamp,
    confidence_metadata: confidenceMetadata,
  };

  const responseExercises = protocolExercises.map((exercise, index) => ({
    id: exercise.id || `transient-ex-${index + 1}`,
    status: "pending",
    ...exercise,
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: transformProtocolResponse(
        transientProtocol,
        responseExercises,
        null,
        null,
        sessionResolution,
        { blockTypes: BLOCK_TYPES },
      ),
    }),
  };
}

/**
 * Daily Protocol API
 *
 * Endpoints:
 * - GET /api/daily-protocol - Get today's protocol for the authenticated user
 * - POST /api/daily-protocol/generate - Generate a new protocol for a date
 * - POST /api/daily-protocol/complete - Mark an exercise as complete
 * - POST /api/daily-protocol/skip - Mark an exercise as skipped
 * - POST /api/daily-protocol/complete-block - Mark all exercises in a block as complete
 * - POST /api/daily-protocol/skip-block - Mark all exercises in a block as skipped
 * - POST /api/daily-protocol/log-session - Log session RPE and duration
 */

// ============================================================================
// EVIDENCE-BASED BLOCK CONFIGURATION
// Based on VALD Practitioner's Guides (Isometrics, Hamstrings, Preseason, etc.)
// ============================================================================

// Block type configuration for 1.5h structured training
const BLOCK_TYPES = {
  morning_mobility: { category: "mobility", estimatedMinutes: 10 },
  foam_roll: { category: "foam_roll", estimatedMinutes: 8 },
  warm_up: { category: "warm_up", estimatedMinutes: 25 },
  isometrics: { category: "isometric", estimatedMinutes: 15 },
  plyometrics: { category: "plyometric", estimatedMinutes: 15 },
  strength: { category: "strength", estimatedMinutes: 15 },
  conditioning: { category: "conditioning", estimatedMinutes: 15 },
  skill_drills: { category: "skill", estimatedMinutes: 15 },
  main_session: { category: "strength", estimatedMinutes: 45 }, // Legacy - kept for backwards compatibility
  cool_down: { category: "cool_down", estimatedMinutes: 15 },
  evening_recovery: { category: "recovery", estimatedMinutes: 10 },
};

// ============================================================================
// EVIDENCE-BASED PERIODIZATION CONFIGURATION
// Source: VALD Practitioner's Guide to Isometrics, Hamstrings, Preseason
// ============================================================================

/**
 * Evidence-based training protocols from VALD research
 */
const EVIDENCE_BASED_PROTOCOLS = {
  // Isometric Training Protocol (Practitioner's Guide to Isometrics)
  // "3-5 sets of 3-6 second maximal contractions with 30-60 seconds rest"
  isometrics: {
    sets: { min: 3, max: 5 },
    holdSeconds: { min: 3, max: 6 },
    restSeconds: { min: 30, max: 60 },
    frequencyPerWeek: { min: 2, max: 3 },
    asymmetryThreshold: 0.1, // <10% ideal
    asymmetryWarning: 0.15, // >15% requires attention
  },

  // Nordic Curl Protocol (Practitioner's Guide to Hamstrings)
  // "2-3x weekly reduces injury risk by 50-70%"
  // "Progress from 1x5 to 3x12 over 6-8 weeks"
  nordicCurls: {
    frequencyPerWeek: { min: 2, max: 3 },
    beginner: { sets: 1, reps: 5 },
    intermediate: { sets: 2, reps: 8 },
    advanced: { sets: 3, reps: 12 },
    injuryRiskReduction: 0.6, // 50-70%
    eccentricHQRatioTarget: 0.8,
  },

  // Plyometric Contacts (Multiple guides)
  // Phase-appropriate weekly contacts
  plyometrics: {
    contactsPerWeek: {
      off_season_rest: { min: 0, max: 0 },
      foundation: { min: 40, max: 80 },
      strength_accumulation: { min: 60, max: 120 },
      power_development: { min: 80, max: 150 },
      speed_development: { min: 100, max: 180 },
      competition_prep: { min: 60, max: 100 },
      in_season_maintenance: { min: 40, max: 80 },
      mid_season_reload: { min: 60, max: 120 },
      peak: { min: 50, max: 100 },
      taper: { min: 20, max: 40 },
      active_recovery: { min: 0, max: 20 },
    },
    intensityLevels: {
      low: ["pogo_jumps", "ankle_hops", "box_step_ups", "low_hurdle_hops"],
      medium: [
        "box_jumps",
        "broad_jumps",
        "single_leg_bounds",
        "lateral_bounds",
      ],
      high: [
        "depth_jumps",
        "reactive_bounds",
        "hurdle_hops",
        "single_leg_depth_jumps",
      ],
      very_high: [
        "depth_jumps_to_sprint",
        "reactive_agility_bounds",
        "multi_directional_bounds",
      ],
    },
  },

  // ACWR Safe Zones (Practitioner's Guide to Preseason + Gabbett 2016)
  // "ACWR 0.8-1.3 is optimal; >1.5 increases injury risk 2-4x"
  acwr: {
    optimal: { min: 0.8, max: 1.3 },
    elevated: { min: 1.3, max: 1.5 },
    danger: { min: 1.5, max: 2.0 },
    weeklyLoadIncreaseMax: 0.1, // 10% max per week
  },

  // Hip/Groin Balance (Practitioner's Guide to Hip and Groin)
  hipGroin: {
    adductorAbductorRatioTarget: { min: 0.8, max: 1.2 },
    asymmetryThreshold: 0.1,
  },

  // Calf/Achilles Return to Sport (Practitioner's Guide to Calf & Achilles)
  calfAchilles: {
    returnToSportStrengthThreshold: 0.9, // >90% bilateral symmetry
    progressionPhases: [
      "isometric",
      "heavy_slow_resistance",
      "eccentric",
      "plyometric",
      "return_to_sport",
    ],
  },
};

/**
 * Get periodization phase based on current month
 * Based on 52-week flag football periodization model
 */
// Day names for schedule matching
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Get user's training context - position, age modifiers, practice schedule, current program
 */
async function getUserTrainingContext(supabase, userId, date) {
  const dayOfWeek = getIsoDayOfWeek(date);
  const dayName = DAY_NAMES[dayOfWeek];

  // 1. Get user config (position, age, practice schedule) - may not exist yet
  const { data: config } = await supabase
    .from("athlete_training_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // 2. Get user's birth date and position from users table if not in config
  let birthDate = config?.birth_date;
  let userPosition = config?.primary_position;

  // Fallback to users table if config doesn't exist or is missing data
  const { data: userData } = await supabase
    .from("users")
    .select("date_of_birth, birth_date, position")
    .eq("id", userId)
    .maybeSingle();

  if (!birthDate) {
    birthDate = userData?.date_of_birth || userData?.birth_date;
  }

  // If no position in config, use position from users table
  if (!userPosition && userData?.position) {
    userPosition = normalizePosition(userData.position);
    console.log(
      `[daily-protocol] No athlete_training_config, using users.position: ${userData.position} -> ${userPosition}`,
    );
  }

  // 3. Calculate age and get recovery modifier
  const age = calculateAge(birthDate);
  let ageModifier = null;
  if (age) {
    const { data: modifier } = await supabase
      .from("age_recovery_modifiers")
      .select("*")
      .lte("age_min", age)
      .gte("age_max", age)
      .maybeSingle();
    ageModifier = modifier;
  }

  // 4. Get assigned program and current phase/week - may not have one yet
  const { data: playerProgram } = await supabase
    .from("player_programs")
    .select("*")
    .eq("player_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const trainingProgram = playerProgram?.program_id
    ? await getTrainingProgramById(
        supabase,
        playerProgram.program_id,
        "id, name, program_type",
      )
    : null;

  if (playerProgram) {
    playerProgram.training_programs = trainingProgram;
  }

  // 5. Get current week based on date
  let currentWeek = null;
  let currentPhase = null;
  if (playerProgram?.training_programs?.id) {
    // Get phase for this date - may not match any phase
    const { data: phase } = await supabase
      .from("training_phases")
      .select("*")
      .eq("program_id", playerProgram.training_programs.id)
      .lte("start_date", date)
      .gte("end_date", date)
      .maybeSingle();
    currentPhase = phase;

    // Get week for this date
    if (phase) {
      const { data: week } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("phase_id", phase.id)
        .lte("start_date", date)
        .gte("end_date", date)
        .maybeSingle();
      currentWeek = week;
    }
  }

  // 6. Resolve team activity for this athlete-day (PROMPT 2.10 - Source of Truth)
  let teamActivityResult = null;
  try {
    teamActivityResult = await resolveTeamActivityForAthleteDay(
      supabase,
      userId,
      null, // teamId will be looked up
      date,
    );
  } catch (error) {
    console.warn("[daily-protocol] Team activity resolution error:", error);
    // Non-fatal - continue without team activity
  }

  // 7. Get today's session template using deterministic resolver (BLOCKER A FIX)
  // This ensures we always get a real session from the 52-week plan, never generic fallbacks
  let sessionTemplate = null;
  let sessionResolution = null;

  try {
    sessionResolution = await resolveTodaySession(supabase, userId, date);

    if (sessionResolution.success) {
      sessionTemplate = sessionResolution.session;
      console.log("[daily-protocol] Session resolved successfully:", {
        sessionName: sessionTemplate?.session_name,
        override: sessionResolution.override?.type || "none",
        metadata: sessionResolution.metadata,
      });
    } else {
      console.log("[daily-protocol] Session resolution failed:", {
        status: sessionResolution.status,
        reason: sessionResolution.reason,
        metadata: sessionResolution.metadata,
      });
      // sessionTemplate remains null - we'll handle this truthfully below
    }
  } catch (error) {
    console.error("[daily-protocol] Session resolution error:", error);
    // Continue with sessionTemplate = null
  }

  // 8. Apply team activity override to session resolution (PROMPT 2.10 + PROMPT 2.19)
  // Use centralized computeOverride for single source of truth
  if (teamActivityResult?.exists && teamActivityResult.activity) {
    const teamActivity = {
      type: teamActivityResult.activity.type,
      startTimeLocal: teamActivityResult.activity.startTimeLocal,
      participation: teamActivityResult.participation,
      replacesSession: teamActivityResult.activity.replacesSession,
    };

    // Check for rehab status from the resolver
    const rehabActive =
      teamActivityResult.participation === "excluded" &&
      teamActivityResult.audit?.steps?.some((s) => s.step === "rehab_override");
    const injuries =
      teamActivityResult.audit?.steps?.find((s) => s.step === "rehab_check")
        ?.injuries || [];

    const override = computeOverride({
      rehabActive,
      injuries,
      coachAlertActive: false, // Not available in context yet
      weatherOverride: teamActivityResult.activity.weatherOverride || false,
      teamActivity,
      taperActive: false, // Taper is handled separately below
      taperContext: null,
    });

    if (override) {
      if (!sessionResolution) {
        sessionResolution = {
          success: true,
          status: "resolved",
          override: null,
        };
      }
      sessionResolution.override = override;

      console.log("[daily-protocol] Override computed via computeOverride:", {
        overrideType: override.type,
        participation: teamActivity.participation,
        activityType: teamActivity.type,
      });
    } else if (teamActivityResult.participation === "excluded") {
      // Participation is excluded but no rehab override - log for debugging
      console.log(
        "[daily-protocol] Team activity exists but athlete excluded (no override):",
        {
          activityType: teamActivity.type,
          participation: teamActivityResult.participation,
        },
      );
    }
  }

  // 8. Get ACWR and readiness from wellness checkin
  let readiness = null;

  // First try to get from wellness checkin (new system)
  const { data: wellnessData } = await supabase.rpc("get_athlete_readiness", {
    p_user_id: userId,
    p_date: date,
  });

  if (wellnessData && wellnessData.length > 0 && wellnessData[0].has_checkin) {
    const w = wellnessData[0];
    readiness = {
      score: w.readiness_score,
      sleepQuality: w.sleep_quality,
      energyLevel: w.energy_level,
      muscleSoreness: w.muscle_soreness,
      stressLevel: w.stress_level,
      sorenessAreas: w.soreness_areas,
      hasCheckin: true,
    };
  } else {
    // Fallback to old readiness_scores table - may not have entry for this day
    const { data: oldReadiness } = await supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("day", date)
      .maybeSingle();

    if (oldReadiness) {
      readiness = {
        score: oldReadiness.score || oldReadiness.readiness_score,
        acwr: oldReadiness.acwr,
        hasCheckin: true,
      };
    }
  }

  // 9. Get position-specific modifiers
  // Use userPosition which was already normalized from config or users table
  const position = userPosition || "wr_db";
  const { data: positionModifiers } = await supabase
    .from("position_exercise_modifiers")
    .select("*")
    .eq("position", position);

  console.log(
    `[daily-protocol] Fetching modifiers for position: ${position}, found: ${positionModifiers?.length || 0}`,
  );

  // 10. Calculate ACWR target range (adjusted by age)
  const baseAcwrMin = config?.acwr_target_min || 0.8;
  const baseAcwrMax = config?.acwr_target_max || 1.3;
  const acwrAdjustment = ageModifier?.acwr_max_adjustment || 0;

  // 11. Get upcoming tournaments and check for taper period
  const { data: upcomingTournaments } = await supabase
    .from("tournament_calendar")
    .select("*")
    .gte("start_date", date)
    .order("start_date", { ascending: true })
    .limit(3);

  // Calculate taper context
  let taperContext = null;
  if (upcomingTournaments && upcomingTournaments.length > 0) {
    for (const tournament of upcomingTournaments) {
      const tournamentDate = parseIsoDateString(tournament.start_date);
      const currentDate = parseIsoDateString(date);
      const daysUntil = Math.ceil(
        (tournamentDate - currentDate) / (1000 * 60 * 60 * 24),
      );
      const taperWeeks = tournament.taper_weeks_before || 1;
      const taperDays = taperWeeks * 7;

      if (daysUntil <= taperDays && daysUntil > 0) {
        // We're in taper period
        const taperProgress = 1 - daysUntil / taperDays; // 0 at start, 1 at tournament

        // Calculate taper reduction:
        // Peak events: reduce to 40% at tournament
        // Regular events: reduce to 60% at tournament
        const minLoadPercent = tournament.is_peak_event ? 0.4 : 0.6;
        const loadMultiplier = 1 - taperProgress * (1 - minLoadPercent);

        taperContext = {
          isInTaper: true,
          tournament: {
            id: tournament.id,
            name: tournament.name,
            startDate: tournament.start_date,
            isPeakEvent: tournament.is_peak_event,
            gamesExpected: tournament.games_expected,
            throwsPerGameQb: tournament.throws_per_game_qb,
          },
          daysUntil,
          taperWeeks,
          taperProgress: Math.round(taperProgress * 100),
          loadMultiplier: Math.round(loadMultiplier * 100) / 100,
          recommendation: getTaperRecommendation(
            daysUntil,
            tournament.is_peak_event,
          ),
        };
        break; // Use first tournament we're tapering for
      }
    }
  }

  return {
    config: config || { primary_position: "wr_db" },
    position,
    warmupFocus: config?.warmup_focus || null,
    age,
    ageModifier,
    birthDate,
    playerProgram,
    currentPhase,
    currentWeek,
    sessionTemplate,
    sessionResolution, // BREACH FIX #1: Return session resolution for confidence metadata
    teamActivity: teamActivityResult, // PROMPT 2.10: Team activity source of truth
    // DEPRECATED: availability is informational only; team_activities is authority.
    readiness,
    positionModifiers: positionModifiers || [],
    dayOfWeek,
    dayName,
    acwrTargetRange: {
      min: baseAcwrMin,
      max: baseAcwrMax + acwrAdjustment,
    },
    // Tournament/Taper
    upcomingTournaments: upcomingTournaments || [],
    taperContext,
    // Position-specific flags
    isQB: position === "quarterback",
    isCenter: position === "center",
    isBlitzer: position === "blitzer" || position === "rusher",
  };
}

/**
 * Get taper recommendation based on days until tournament
 */
function getTaperRecommendation(daysUntil, isPeakEvent) {
  if (daysUntil <= 2) {
    return "🎯 Tournament imminent - Light mobility and activation only. Focus on rest and hydration.";
  }
  if (daysUntil <= 4) {
    return "🔄 Final prep phase - Very light training. Prioritize sleep and nutrition.";
  }
  if (daysUntil <= 7) {
    return isPeakEvent
      ? "⚡ Peak week - Reduce volume 50%, maintain intensity on key movements."
      : "📉 Taper week - Reduce volume 30%, sharpen movement quality.";
  }
  if (daysUntil <= 14) {
    return isPeakEvent
      ? "📊 Peak event taper - Volume reducing 40%. Focus on explosiveness over endurance."
      : "📈 Tournament prep - Moderate reduction. Keep intensity, cut volume 20%.";
  }
  return "🏋️ Pre-taper - Normal training with focus on building capacity for tournament.";
}

/**
 * Main handler
 */
const legacyDailyProtocolHandler = async (event) => {
  const { httpMethod, path, queryStringParameters, body, headers } = event;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
  const withHeaders = (response) => ({ ...response, headers: corsHeaders });

  // Handle preflight
  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const auth = await authenticateRequest(event);
  if (!auth.success) {
    return withHeaders(auth.error);
  }
  const { user } = auth;
  // Use the authenticated user ID for scoping, but run protocol queries with
  // the admin client because several supporting tables do not have complete RLS.
  const supabase = supabaseAdmin;

  try {
    // Route to appropriate handler
    const pathParts = path.split("/").filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1];

    if (httpMethod === "GET" && endpoint === "daily-protocol") {
      return await getProtocol(
        supabase,
        user.id,
        queryStringParameters,
        corsHeaders,
      );
    }

    if (httpMethod === "POST") {
      const parsedPayload = tryParseJsonObjectBody(body);
      if (!parsedPayload.ok) {
        return withHeaders(
          parsedPayload.error,
        );
      }
      const payload = parsedPayload.data;

      switch (endpoint) {
        case "generate":
          return await generateProtocol(
            supabase,
            user.id,
            payload,
            corsHeaders,
          );
        case "complete":
          return await completeExercise(
            supabase,
            user.id,
            payload,
            corsHeaders,
          );
        case "skip":
          return await skipExercise(supabase, user.id, payload, corsHeaders);
        case "complete-block":
          return await completeBlock(supabase, user.id, payload, corsHeaders);
        case "skip-block":
          return await skipBlock(supabase, user.id, payload, corsHeaders);
        case "log-session":
          return await logSession(supabase, user.id, payload, corsHeaders);
        default:
          break;
      }
    }

    return {
      ...createErrorResponse("Not found", 404, "not_found"),
      headers: corsHeaders,
    };
  } catch (err) {
    console.error("Daily protocol error:", err);
    return {
      ...createErrorResponse("Internal server error", 500, "server_error"),
      headers: corsHeaders,
    };
  }
};

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "daily-protocol",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt) => legacyDailyProtocolHandler(evt),
  });

/**
 * GET /api/daily-protocol
 * Fetch today's (or specified date's) protocol for the user
 */
async function getProtocol(supabase, userId, params, headers) {
  const date = params?.date || getIsoDateString();

  // Get the protocol
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .select("*")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .single();

  if (protocolError && protocolError.code !== "PGRST116") {
    throw protocolError;
  }

  if (!protocol) {
    // No protocol exists for this date
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: null }),
    };
  }

  // Get coach name if protocol was modified by coach
  let coachName = null;
  if (protocol.modified_by_coach_id) {
    const { data: coach } = await supabase
      .from("users")
      .select("full_name, first_name, last_name")
      .eq("id", protocol.modified_by_coach_id)
      .maybeSingle();
    if (coach) {
      coachName =
        coach.full_name ||
        `${coach.first_name || ""} ${coach.last_name || ""}`.trim() ||
        "Coach";
    }
  }

  // Resolve team activity for this athlete-day (PROMPT 2.10)
  let teamActivity = null;
  let sessionResolution = null;

  try {
    const teamActivityResult = await resolveTeamActivityForAthleteDay(
      supabase,
      userId,
      null, // teamId will be looked up
      date,
    );

    if (teamActivityResult.exists && teamActivityResult.activity) {
      teamActivity = {
        type: teamActivityResult.activity.type,
        startTimeLocal: teamActivityResult.activity.startTimeLocal,
        endTimeLocal: teamActivityResult.activity.endTimeLocal,
        location: teamActivityResult.activity.location,
        participation: teamActivityResult.participation,
        createdByCoachName: teamActivityResult.activity.createdByCoachName,
        updatedAtLocal: teamActivityResult.activity.updatedAt,
        note: teamActivityResult.activity.note,
        replacesSession: teamActivityResult.activity.replacesSession,
      };

      // PROMPT 2.19: Use centralized computeOverride for single source of truth
      // Check for rehab status from the resolver (it already checked wellness checkin)
      const rehabActive =
        teamActivityResult.participation === "excluded" &&
        teamActivityResult.audit?.steps?.some(
          (s) => s.step === "rehab_override",
        );
      const injuries =
        teamActivityResult.audit?.steps?.find((s) => s.step === "rehab_check")
          ?.injuries || [];

      const override = computeOverride({
        rehabActive,
        injuries,
        coachAlertActive: protocol?.coach_alert_active || false,
        weatherOverride: teamActivityResult.activity.weatherOverride || false,
        teamActivity,
        taperActive: false, // Would need to resolve taper context if needed
        taperContext: null,
      });

      sessionResolution = {
        success: true,
        status: "resolved",
        override,
      };
    }
  } catch (teamActivityError) {
    console.warn(
      "[daily-protocol] Team activity resolution failed:",
      teamActivityError,
    );
    // Non-fatal - continue without team activity
  }

  // Get all exercises for this protocol
  let { data: protocolExercises, error: exercisesError } = await supabase
    .from("protocol_exercises")
    .select(
      `
      *,
      exercises (
        id, name, slug, category, subcategory,
        video_url, video_id, video_duration_seconds, thumbnail_url,
        how_text, feel_text, compensation_text,
        default_sets, default_reps, default_hold_seconds, default_duration_seconds,
        difficulty_level, load_contribution_au, is_high_intensity
      )
    `,
    )
    .eq("protocol_id", protocol.id)
    .order("sequence_order");

  if (exercisesError) {
    throw exercisesError;
  }

  // Debug logging to understand exercise state
  console.log("[daily-protocol] Fetched protocol exercises:", {
    count: protocolExercises?.length || 0,
    protocolId: protocol.id,
    totalExercisesStored: protocol.total_exercises,
    // Sample first exercise to check structure
    firstExercise: protocolExercises?.[0]
      ? {
          id: protocolExercises[0].id,
          block_type: protocolExercises[0].block_type,
          exercise_id: protocolExercises[0].exercise_id,
          hasExerciseData: !!protocolExercises[0].exercises,
          exerciseName:
            protocolExercises[0].exercises?.name || "NO_EXERCISE_DATA",
        }
      : null,
  });

  // ============================================================================
  // AUTO-FIX: If protocol exists but has 0 exercises, regenerate using fallback
  // This fixes protocols that were created when the DB was empty
  // ============================================================================
  if (!protocolExercises || protocolExercises.length === 0) {
    console.log(
      "[daily-protocol] Protocol has 0 exercises - auto-regenerating with fallback",
    );

    // Check if exercises table is empty (triggers fallback)
    const { count: exerciseCount } = await supabase
      .from("exercises")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    if (!exerciseCount || exerciseCount < 10) {
      // Use inline fallback
      const dayOfYear = getIsoDayOfYear(date);
      const weekNumber = Math.ceil(dayOfYear / 7);

      // Get basic context for fallback generation
      const trainingFocus = protocol.training_focus || "strength";
      const isPracticeDay = teamActivity?.type === "practice";
      const isFilmRoomDay = teamActivity?.type === "film_room";
      const readinessForLogic = protocol.readiness_score || 70;

      const fallbackExercises = await generateFallbackProtocolExercises(
        protocol.id,
        dayOfYear,
        weekNumber,
        trainingFocus,
        {
          position: null,
          isQB: false,
          isCenter: false,
          dayOfWeek: getIsoDayOfWeek(date),
        },
        isPracticeDay,
        isFilmRoomDay,
        readinessForLogic,
      );

      if (fallbackExercises.length > 0) {
        const { error: insertError } = await supabase
          .from("protocol_exercises")
          .insert(fallbackExercises);

        if (insertError) {
          console.error(
            "[daily-protocol] Error inserting fallback exercises:",
            insertError,
          );
        } else {
          // Update protocol total_exercises count
          await supabase
            .from("daily_protocols")
            .update({ total_exercises: fallbackExercises.length })
            .eq("id", protocol.id);

          // Re-fetch exercises after inserting
          const { data: newExercises } = await supabase
            .from("protocol_exercises")
            .select(
              `
              *,
              exercises (
                id, name, slug, category, subcategory,
                video_url, video_id, video_duration_seconds, thumbnail_url,
                how_text, feel_text, compensation_text,
                default_sets, default_reps, default_hold_seconds, default_duration_seconds,
                difficulty_level, load_contribution_au, is_high_intensity
              )
            `,
            )
            .eq("protocol_id", protocol.id)
            .order("sequence_order");

          protocolExercises = newExercises || [];
          console.log(
            `[daily-protocol] Auto-fix complete: ${protocolExercises.length} exercises added`,
          );
        }
      }
    }
  }

  // DYNAMICALLY compute confidence_metadata based on CURRENT wellness status
  // This ensures the banner reflects the latest check-in, not stale stored values
  const dynamicConfidenceMetadata = await computeDynamicConfidenceMetadata(
    supabase,
    userId,
    date,
    protocol,
    { trainingSessionsTable: TRAINING_SESSIONS_TABLE },
  );

  // Merge dynamic confidence metadata into protocol before transforming
  const protocolWithUpdatedMetadata = {
    ...protocol,
    confidence_metadata: dynamicConfidenceMetadata,
    // Also update readiness_score if we have a fresh check-in
    readiness_score: dynamicConfidenceMetadata.readiness?.hasData
      ? (dynamicConfidenceMetadata.readiness._readinessScore ??
        protocol.readiness_score)
      : protocol.readiness_score,
  };

  // Transform to frontend format
  const transformedProtocol = transformProtocolResponse(
    protocolWithUpdatedMetadata,
    protocolExercises,
    coachName,
    teamActivity, // Pass team activity to transformer
    sessionResolution, // Pass session resolution for PROMPT 2.12
    { blockTypes: BLOCK_TYPES },
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: transformedProtocol }),
  };
}

/**
 * POST /api/daily-protocol/generate
 * Generate a new protocol for a given date using structured training data
 */
async function generateProtocol(supabase, userId, payload, headers) {
  const date = payload.date || getIsoDateString();

  // ============================================================================
  // IDEMPOTENCY SUPPORT
  // ============================================================================
  // Generate or use provided idempotency key
  let { idempotencyKey } = payload;

  if (!idempotencyKey) {
    idempotencyKey = buildProtocolGenerationIdempotencyKey({ userId, date });
  }

  // Check if this idempotency key was already processed
  const existingRequest = await getExistingProtocolGenerationRequest(
    supabase,
    userId,
    date,
    idempotencyKey,
  );

  if (existingRequest) {
    if (existingRequest.status === "completed" && existingRequest.protocol_id) {
      // Return existing protocol
      console.log(
        "[daily-protocol] Idempotent request - returning existing protocol:",
        existingRequest.protocol_id,
      );
      return await getProtocol(supabase, userId, { date }, headers);
    } else if (existingRequest.status === "failed") {
      // Previous attempt failed - allow retry but log the error
      console.warn(
        "[daily-protocol] Previous generation failed:",
        existingRequest.error,
      );
    }
    // If status is 'pending', continue (might be concurrent request, will be handled by unique constraint)
  }

  // Get user's full training context
  const context = await getUserTrainingContext(supabase, userId, date);

  // ============================================================================
  // INJURY CHECK - Priority #1 for athlete safety
  // ============================================================================
  // Check for active injuries from daily wellness checkin
  // Scope to check-ins on/before target date to prevent future check-ins
  const { data: wellnessCheckin } = await supabase
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", userId)
    .lte("checkin_date", date)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .single();

  const hasActiveInjuries =
    wellnessCheckin?.soreness_areas &&
    wellnessCheckin.soreness_areas.length > 0;

  // If injuries exist, generate return-to-play protocol instead
  if (hasActiveInjuries) {
    console.log(
      "[daily-protocol] Active injuries detected:",
      wellnessCheckin.soreness_areas,
    );
    return await generateReturnToPlayProtocol(
      supabase,
      userId,
      date,
      context,
      wellnessCheckin,
    );
  }
  // ============================================================================

  // Record generation request (with unique constraint for concurrency safety)
  const { requestRecord, existingCompleted } =
    await createProtocolGenerationRequest(
      supabase,
      userId,
      date,
      idempotencyKey,
    );

  if (existingCompleted?.status === "completed" && existingCompleted.protocol_id) {
    return await getProtocol(supabase, userId, { date }, headers);
  }

  const {
    readinessScore,
    acwrValue,
    confidenceMetadata,
    readinessForLogic,
    acwrForLogic,
    trainingFocus,
    aiRationale,
    adjustedLoadTarget,
    isPracticeDay,
    isFilmRoomDay,
    periodizationPhase,
  } = await buildProtocolDecisionContext({
    supabase,
    userId,
    date,
    context,
    computeReadinessDaysStale,
    computeTrainingDaysLogged,
  });

  console.log("[daily-protocol] Truthfulness contract check:", {
    readiness: {
      truth: readinessScore,
      forLogic: readinessForLogic,
      willPersist: readinessScore,
    },
    acwr: {
      truth: acwrValue,
      forLogic: acwrForLogic,
      willPersist: acwrValue,
    },
    confidence: confidenceMetadata,
  });

  // Protocol and exercises will be created transactionally via RPC
  // We'll collect exercises first, then call RPC

  const protocolExercises = [];

  const fallbackProtocol = await persistFallbackProtocolWhenExercisesMissing({
    supabase,
    userId,
    date,
    trainingFocus,
    context,
    isPracticeDay,
    isFilmRoomDay,
    readinessForLogic,
    readinessScore,
    acwrValue,
    aiRationale,
    adjustedLoadTarget,
    confidenceMetadata,
    requestRecord,
    headers,
    getIsoDayOfYear,
    generateFallbackProtocolExercises,
    persistGeneratedProtocol,
  });

  if (fallbackProtocol) {
    return fallbackProtocol;
  }

  await addMorningMobilityBlock({
    supabase,
    protocolExercises,
    context,
  });

  // 2. Foam Roll - Standard for all positions
  await addFoamRollBlock({ supabase, protocolExercises });

  // Check if it's a sprint session (Saturday or session type is speed/sprint)
  // Declare early so it can be used in both warmup and main session generation
  const isSprintSession =
    context.dayOfWeek === 6 || // Saturday
    context.sessionResolution?.override?.type === "sprint_saturday" ||
    context.sessionTemplate?.session_type?.toLowerCase() === "speed" ||
    context.sessionTemplate?.session_type?.toLowerCase() === "sprint";

  await addWarmupBlock({
    supabase,
    protocolExercises,
    context,
    trainingFocus,
    isPracticeDay,
    isFilmRoomDay,
    isSprintSession,
  });

  // ============================================================================
  // EVIDENCE-BASED TRAINING BLOCKS (1.5h Gym Session Structure)
  // Based on VALD Practitioner's Guides
  // ============================================================================

  // Get current periodization phase for evidence-based programming
  const currentPhase = getCurrentPeriodizationPhase(parseIsoDateString(date));
  const plyoIntensity = getPlyometricIntensity(currentPhase, readinessForLogic);
  const safeConditioning = getSafeConditioningIntensity(
    acwrForLogic,
    null,
    currentPhase,
  );
  const includeNordics = shouldIncludeNordicCurls(
    context.dayOfWeek,
    trainingFocus,
  );

  console.log("[daily-protocol] Evidence-based config:", {
    phase: currentPhase,
    plyoIntensity,
    safeConditioning,
    includeNordics,
    dayOfWeek: context.dayOfWeek,
  });

  // Skip gym blocks on practice days, film room days, or recovery days
  const isGymTrainingDay =
    !isPracticeDay && !isFilmRoomDay && trainingFocus !== "recovery";

  if (isGymTrainingDay) {
    // ============================================================================
    // 4. ISOMETRICS BLOCK (15 min)
    // Evidence: 3-5 sets × 3-6 sec maximal contractions, 30-60s rest
    // Source: VALD Practitioner's Guide to Isometrics
    // ============================================================================

    // Query from both exercises table (isometric category) and isometrics_exercises table
    const { data: isometricExercisesMain } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "isometric")
      .eq("active", true)
      .limit(15);

    const { data: isometricExercisesSpecialized } = await supabase
      .from("isometrics_exercises")
      .select("*")
      .limit(15);

    // Combine and format exercises
    let allIsometrics = [];

    if (isometricExercisesMain && isometricExercisesMain.length > 0) {
      allIsometrics = allIsometrics.concat(
        isometricExercisesMain.map((ex) => ({
          ...ex,
          source: "exercises",
        })),
      );
    }

    if (
      isometricExercisesSpecialized &&
      isometricExercisesSpecialized.length > 0
    ) {
      allIsometrics = allIsometrics.concat(
        isometricExercisesSpecialized.map((ex) => ({
          id: ex.id,
          name: ex.name,
          description: ex.description,
          video_url: ex.video_url,
          category: ex.category,
          source: "isometrics_exercises",
          default_sets: EVIDENCE_BASED_PROTOCOLS.isometrics.sets.min,
          default_hold_seconds:
            EVIDENCE_BASED_PROTOCOLS.isometrics.holdSeconds.max,
          load_contribution_au: 15, // Moderate load for isometrics
        })),
      );
    }

    if (allIsometrics.length > 0) {
      // Select 4-5 isometric exercises for ~15 min block
      const selectedIsometrics = allIsometrics
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      selectedIsometrics.forEach((ex, idx) => {
        const sets =
          EVIDENCE_BASED_PROTOCOLS.isometrics.sets.min +
          (readinessForLogic >= 70 ? 1 : 0); // Extra set if high readiness
        const holdSeconds = EVIDENCE_BASED_PROTOCOLS.isometrics.holdSeconds.max;

        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.source === "exercises" ? ex.id : null,
          block_type: "isometrics",
          sequence_order: idx + 1,
          prescribed_sets: sets,
          prescribed_hold_seconds: holdSeconds,
          rest_seconds: EVIDENCE_BASED_PROTOCOLS.isometrics.restSeconds.min,
          load_contribution_au: ex.load_contribution_au || 15,
          ai_note: `📊 Isometric Protocol: ${sets} sets × ${holdSeconds}s hold. Focus on maximal tension. Evidence: Builds strength at specific joint angles, safe for all fitness levels.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedIsometrics.length} isometric exercises`,
      );
    }

    // ============================================================================
    // 5. PLYOMETRICS BLOCK (15 min)
    // Evidence: Phase-appropriate contacts, landing emphasis first
    // Source: VALD Practitioner's Guides (Hamstrings, Calf & Achilles)
    // ============================================================================

    const plyoContactsConfig = EVIDENCE_BASED_PROTOCOLS.plyometrics
      .contactsPerWeek[currentPhase] || { min: 40, max: 80 };
    const allowedPlyoTypes =
      EVIDENCE_BASED_PROTOCOLS.plyometrics.intensityLevels[plyoIntensity] ||
      EVIDENCE_BASED_PROTOCOLS.plyometrics.intensityLevels.medium;

    // Query from both exercises table and plyometrics_exercises table
    const { data: plyoExercisesMain } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "plyometric")
      .eq("active", true)
      .limit(20);

    const { data: plyoExercisesSpecialized } = await supabase
      .from("plyometrics_exercises")
      .select("*")
      .limit(20);

    let allPlyometrics = [];

    if (plyoExercisesMain && plyoExercisesMain.length > 0) {
      allPlyometrics = allPlyometrics.concat(
        plyoExercisesMain.map((ex) => ({
          ...ex,
          source: "exercises",
        })),
      );
    }

    if (plyoExercisesSpecialized && plyoExercisesSpecialized.length > 0) {
      allPlyometrics = allPlyometrics.concat(
        plyoExercisesSpecialized.map((ex) => ({
          id: ex.id,
          name: ex.exercise_name || ex.name,
          description: ex.description,
          video_url: ex.video_url,
          category: ex.exercise_category,
          intensity_level: ex.intensity_level,
          source: "plyometrics_exercises",
          default_sets: 3,
          default_reps: 6,
          load_contribution_au: 20, // Higher load for plyometrics
        })),
      );
    }

    if (allPlyometrics.length > 0) {
      // Calculate contacts per session (divide weekly target by ~3 sessions)
      const contactsPerSession = Math.round(
        (plyoContactsConfig.min + plyoContactsConfig.max) / 2 / 3,
      );
      const repsPerExercise = 6;
      const exerciseCount = Math.min(
        5,
        Math.ceil(contactsPerSession / repsPerExercise),
      );

      // Filter by intensity if possible
      let filteredPlyos = allPlyometrics;
      if (plyoIntensity === "low") {
        // Prefer lower intensity exercises
        filteredPlyos = allPlyometrics.filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("depth") &&
            !ex.name?.toLowerCase().includes("reactive"),
        );
      } else if (plyoIntensity === "very_high") {
        // Include higher intensity
        filteredPlyos = allPlyometrics.filter(
          (ex) =>
            ex.name?.toLowerCase().includes("depth") ||
            ex.name?.toLowerCase().includes("reactive") ||
            ex.name?.toLowerCase().includes("bound"),
        );
      }

      // Fallback to all if filter too restrictive
      if (filteredPlyos.length < 3) {
        filteredPlyos = allPlyometrics;
      }

      const selectedPlyos = filteredPlyos
        .sort(() => Math.random() - 0.5)
        .slice(0, exerciseCount);

      selectedPlyos.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.source === "exercises" ? ex.id : null,
          block_type: "plyometrics",
          sequence_order: idx + 1,
          prescribed_sets: 3,
          prescribed_reps: repsPerExercise,
          rest_seconds: 60,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `⚡ Plyometric Phase: ${currentPhase}. Intensity: ${plyoIntensity.toUpperCase()}. Weekly contacts target: ${plyoContactsConfig.min}-${plyoContactsConfig.max}. Focus on LANDING MECHANICS first.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedPlyos.length} plyometric exercises (${plyoIntensity} intensity)`,
      );
    }

    // ============================================================================
    // 6. STRENGTH BLOCK (15 min)
    // Evidence: Nordic curls 2-3x/week reduce hamstring injury by 50-70%
    // Source: VALD Practitioner's Guide to Hamstrings
    // ============================================================================

    const { data: strengthExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "strength")
      .eq("active", true)
      .limit(30);

    if (strengthExercises && strengthExercises.length > 0) {
      const selectedStrength = [];

      // MANDATORY: Include Nordic Curls on designated days (2-3x per week)
      // Evidence: Reduces hamstring injury risk by 50-70%
      if (includeNordics) {
        const nordicExercise = strengthExercises.find(
          (ex) =>
            ex.name?.toLowerCase().includes("nordic") ||
            ex.slug?.includes("nordic"),
        );

        if (nordicExercise) {
          const nordicProtocol =
            readinessForLogic >= 70
              ? EVIDENCE_BASED_PROTOCOLS.nordicCurls.advanced
              : EVIDENCE_BASED_PROTOCOLS.nordicCurls.intermediate;

          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: nordicExercise.id,
            block_type: "strength",
            sequence_order: 1, // Nordic curls FIRST in strength block
            prescribed_sets: nordicProtocol.sets,
            prescribed_reps: nordicProtocol.reps,
            rest_seconds: 90,
            load_contribution_au: nordicExercise.load_contribution_au || 25,
            ai_note: `🏋️ MANDATORY: Nordic Curls - Evidence shows 50-70% reduction in hamstring injuries when performed 2-3x/week. Focus on slow, controlled eccentric lowering.`,
          });

          console.log("[daily-protocol] Added mandatory Nordic Curls");
        }
      }

      // Add hip adductor/abductor work for groin injury prevention
      // Evidence: Add:Abd ratio should be 0.8-1.2 (VALD Hip & Groin Guide)
      const hipExercises = strengthExercises.filter(
        (ex) =>
          ex.name?.toLowerCase().includes("adduct") ||
          ex.name?.toLowerCase().includes("copenhagen") ||
          ex.name?.toLowerCase().includes("hip thrust") ||
          ex.name?.toLowerCase().includes("glute"),
      );

      if (hipExercises.length > 0) {
        const selectedHip = hipExercises
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        selectedHip.forEach((ex, idx) => {
          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            block_type: "strength",
            sequence_order: (includeNordics ? 2 : 1) + idx,
            prescribed_sets: 3,
            prescribed_reps: 10,
            rest_seconds: 60,
            load_contribution_au: ex.load_contribution_au || 20,
            ai_note: `🦵 Hip Strength: Targets Add:Abd ratio (target 0.8-1.2). Prevents groin injuries common in cutting sports.`,
          });
        });
      }

      // Add 2-3 general strength exercises
      const generalStrength = strengthExercises
        .filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("nordic") &&
            !ex.name?.toLowerCase().includes("adduct") &&
            !ex.name?.toLowerCase().includes("copenhagen"),
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      generalStrength.forEach((ex, idx) => {
        const sequenceStart =
          (includeNordics ? 2 : 1) + (hipExercises.length > 0 ? 2 : 0);
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "strength",
          sequence_order: sequenceStart + idx,
          prescribed_sets: 3,
          prescribed_reps: 8,
          rest_seconds: 90,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `💪 Strength Phase: ${currentPhase}. Focus on quality movement over load.`,
        });
      });

      console.log(
        `[daily-protocol] Added strength block with ${includeNordics ? "Nordic curls + " : ""}hip work + general strength`,
      );
    }

    // ============================================================================
    // 7. CONDITIONING BLOCK (15 min)
    // Evidence: ACWR 0.8-1.3 optimal, >1.5 = 2-4x injury risk
    // SAFETY: No 80%+ sprinting on day 1 - progressive build required
    // Source: VALD Practitioner's Guide to Preseason, Gabbett 2016
    // ============================================================================

    const { data: conditioningExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "conditioning")
      .eq("active", true)
      .limit(20);

    if (conditioningExercises && conditioningExercises.length > 0) {
      // Filter based on safe intensity
      let filteredConditioning = conditioningExercises;

      // If max intensity is low, exclude high-intensity exercises
      if (safeConditioning.maxIntensity <= 60) {
        filteredConditioning = conditioningExercises.filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("sprint") &&
            !ex.name?.toLowerCase().includes("100m") &&
            !ex.name?.toLowerCase().includes("max velocity"),
        );
      }

      // Fallback if filter too restrictive
      if (filteredConditioning.length < 3) {
        filteredConditioning = conditioningExercises;
      }

      const selectedConditioning = filteredConditioning
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      selectedConditioning.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "conditioning",
          sequence_order: idx + 1,
          prescribed_sets: 2,
          prescribed_duration_seconds: 30,
          rest_seconds: 45,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 15) *
              (safeConditioning.maxIntensity / 100),
          ),
          ai_note:
            safeConditioning.note ||
            `🏃 Conditioning Phase: ${currentPhase}. Max intensity: ${safeConditioning.maxIntensity}%. ACWR-safe progression.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedConditioning.length} conditioning exercises (max ${safeConditioning.maxIntensity}% intensity)`,
      );
    }

    // ============================================================================
    // 8. SKILL/TWITCHING DRILLS BLOCK (15 min)
    // Position-specific reactive drills for neural activation
    // Source: VALD Speed Testing Guide, Flag Football Periodization
    // ============================================================================

    // Combine skill and agility exercises
    const { data: skillExercises } = await supabase
      .from("exercises")
      .select("*")
      .or("category.eq.skill,category.eq.agility")
      .eq("active", true)
      .limit(20);

    if (skillExercises && skillExercises.length > 0) {
      // Filter for position-specific where available
      let filteredSkill = skillExercises;
      const normalizedPosition = normalizePosition(context.position);

      if (context.isQB) {
        const qbSkills = skillExercises.filter(
          (ex) =>
            ex.position_specific?.includes("quarterback") ||
            ex.name?.toLowerCase().includes("throwing") ||
            ex.name?.toLowerCase().includes("footwork"),
        );
        if (qbSkills.length >= 2) {
          filteredSkill = qbSkills;
        }
      } else if (normalizedPosition === "wr_db") {
        const wrDbSkills = skillExercises.filter(
          (ex) =>
            ex.position_specific?.includes("wr_db") ||
            ex.name?.toLowerCase().includes("route") ||
            ex.name?.toLowerCase().includes("cut") ||
            ex.name?.toLowerCase().includes("backpedal"),
        );
        if (wrDbSkills.length >= 2) {
          filteredSkill = wrDbSkills;
        }
      }

      const selectedSkills = filteredSkill
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      selectedSkills.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "skill_drills",
          sequence_order: idx + 1,
          prescribed_sets: 3,
          prescribed_reps: 5,
          rest_seconds: 30,
          load_contribution_au: ex.load_contribution_au || 10,
          ai_note: `⚡ Skill Drill: Fast-twitch activation. Focus on speed and precision. Position: ${normalizedPosition}.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedSkills.length} skill/twitching drills`,
      );
    }

    // ============================================================================
    // Add gym block exercises to main_session for display
    // Main Session should always have exercises (except recovery days)
    // ============================================================================
    // Collect all exercises from gym blocks and add them to main_session
    const gymBlockTypes = [
      "isometrics",
      "plyometrics",
      "strength",
      "conditioning",
      "skill_drills",
    ];
    let mainSessionSequence = 1;

    gymBlockTypes.forEach((blockType) => {
      // Find all exercises for this block type that were just added
      const blockExercises = protocolExercises.filter(
        (pe) => pe.block_type === blockType,
      );

      // Add them to main_session as well
      blockExercises.forEach((ex) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.exercise_id,
          block_type: "main_session",
          sequence_order: mainSessionSequence++,
          prescribed_sets: ex.prescribed_sets,
          prescribed_reps: ex.prescribed_reps,
          prescribed_hold_seconds: ex.prescribed_hold_seconds,
          prescribed_duration_seconds: ex.prescribed_duration_seconds,
          rest_seconds: ex.rest_seconds,
          load_contribution_au: ex.load_contribution_au,
          ai_note: ex.ai_note || `Gym Training - ${blockType}`,
        });
      });
    });

    if (mainSessionSequence > 1) {
      console.log(
        `[daily-protocol] Added ${mainSessionSequence - 1} exercises to main_session from gym blocks`,
      );
    }
  } else {
    console.log("[daily-protocol] Skipping gym blocks - practice/recovery day");
  }

  // ============================================================================
  // END OF EVIDENCE-BASED BLOCKS
  // ============================================================================

  // 9. Main Session - From structured program templates OR generated based on training type
  // Note: isPracticeDay and isFilmRoomDay already declared above in training focus section

  // Determine main session type based on priority:
  // 1. Sprint session (especially Saturday)
  // 2. Gym training (if has_gym_access)
  // 3. Flag training (if preferred)
  // 4. Session template (if exists)
  // Note: isSprintSession is already declared above before warmup section
  const hasGymAccess = context.config?.has_gym_access !== false;
  const hasFieldAccess = context.config?.has_field_access !== false;

  let mainSessionGenerated = false;

  // Priority 1: Use session template if it exists (unless it's a practice/film room day)
  if (context.sessionTemplate && !isPracticeDay && !isFilmRoomDay) {
    mainSessionGenerated = await generateTemplateMainSession({
      supabase,
      userId,
      protocolExercises,
      context,
      readinessForLogic,
      acwrForLogic,
    });
  }

  if (
    !mainSessionGenerated &&
    !isPracticeDay &&
    !isFilmRoomDay
  ) {
    const fallbackResult = await generateMainSessionFallback({
      supabase,
      protocolExercises,
      context,
      trainingFocus,
      hasGymAccess,
      hasFieldAccess,
      isSprintSession,
      isGymTrainingDay,
      periodizationPhase,
      acwrForLogic,
    });

    mainSessionGenerated = fallbackResult.mainSessionGenerated;
  }

  await addRecoveryBlocks({
    supabase,
    protocolExercises,
    trainingFocus,
  });

  // ============================================================================
  // TRANSACTIONAL PROTOCOL GENERATION VIA RPC
  // ============================================================================
  // Use RPC function to atomically create protocol + exercises
  // This ensures we never leave a protocol with 0 exercises
  // ============================================================================

  try {
    return await persistGeneratedProtocol({
      supabase,
      userId,
      date,
      readinessScore,
      acwrValue,
      trainingFocus,
      aiRationale,
      adjustedLoadTarget,
      confidenceMetadata,
      protocolExercises,
      requestRecord,
      headers,
      getProtocol,
    });
  } catch (error) {
    if (!isMissingProtocolPersistenceError(error)) {
      throw error;
    }

    console.warn(
      "[daily-protocol] Persistence layer unavailable, returning transient protocol:",
      error.message,
    );

    return buildTransientProtocolResponse({
      userId,
      date,
      readinessScore,
      acwrValue,
      trainingFocus,
      aiRationale,
      adjustedLoadTarget,
      confidenceMetadata,
      protocolExercises,
      headers,
      sessionResolution: context.sessionResolution || null,
    });
  }
}

/**
 * POST /api/daily-protocol/complete
 * Mark a single exercise as complete
 */
async function completeExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, actualSets, actualReps, actualHoldSeconds } =
    payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS will enforce, but explicit check for clarity)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("*, daily_protocols!inner(user_id, protocol_date, id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Verify user owns this protocol (RLS should enforce, but double-check)
  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Idempotency: if already complete, treat as success and avoid duplicate completion logs.
  if (exercise.status === "complete") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, idempotent: true }),
    };
  }

  // Update the exercise (RLS ensures user can only update their own)
  const { data: updatedExercise, error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      actual_sets: actualSets,
      actual_reps: actualReps,
      actual_hold_seconds: actualHoldSeconds,
    })
    .eq("id", protocolExerciseId)
    .neq("status", "complete")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  // Log completion only when a transition to complete occurred.
  if (updatedExercise) {
    await supabase.from("protocol_completions").insert({
      user_id: userId,
      protocol_id: exercise.protocol_id,
      protocol_exercise_id: protocolExerciseId,
      completion_date: exercise.daily_protocols.protocol_date,
      block_type: exercise.block_type,
      exercise_id: exercise.exercise_id,
    });
  }

  // The trigger will update protocol progress automatically

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip
 * Mark a single exercise as skipped
 */
async function skipExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, skipReason: _skipReason } = payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS should enforce, explicit check improves error quality)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("id, daily_protocols!inner(user_id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update the exercise
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("id", protocolExerciseId);

  if (updateError) {
    throw updateError;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/complete-block
 * Mark all exercises in a block as complete
 */
async function completeBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id, protocol_date")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Get all exercises in this block
  const { data: exercises } = await supabase
    .from("protocol_exercises")
    .select("id, exercise_id")
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType)
    .neq("status", "complete");

  // Update all to complete
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  const blockCompletedField = `${blockType}_completed_at`;

  await supabase
    .from("daily_protocols")
    .update({
      [blockStatusField]: "complete",
      [blockCompletedField]: new Date().toISOString(),
    })
    .eq("id", protocolId);

  // Log completions
  if (exercises && exercises.length > 0) {
    const completions = exercises.map((ex) => ({
      user_id: userId,
      protocol_id: protocolId,
      protocol_exercise_id: ex.id,
      completion_date: protocol.protocol_date,
      block_type: blockType,
      exercise_id: ex.exercise_id,
    }));

    await supabase.from("protocol_completions").insert(completions);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip-block
 * Mark all exercises in a block as skipped
 */
async function skipBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update all to skipped
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  await supabase
    .from("daily_protocols")
    .update({ [blockStatusField]: "skipped" })
    .eq("id", protocolId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/log-session
 * Log the main session RPE and duration
 */
async function logSession(supabase, userId, payload, headers) {
  const { protocolId, actualDurationMinutes, actualRpe, sessionNotes } =
    payload;

  if (!protocolId || !actualDurationMinutes || !actualRpe) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "protocolId, actualDurationMinutes, and actualRpe required",
      }),
    };
  }

  // Calculate session load (duration × RPE)
  const actualLoadAu = actualDurationMinutes * actualRpe;

  // Get the protocol to retrieve the date
  const { data: protocol, error: fetchError } = await supabase
    .from("daily_protocols")
    .select("protocol_date, training_focus")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Update the protocol
  const { error: updateError } = await supabase
    .from("daily_protocols")
    .update({
      actual_duration_minutes: actualDurationMinutes,
      actual_rpe: actualRpe,
      actual_load_au: actualLoadAu,
      session_notes: sessionNotes,
      main_session_status: "complete",
      main_session_completed_at: new Date().toISOString(),
    })
    .eq("id", protocolId)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  // Detect late logging
  const sessionDate = new Date(protocol.protocol_date);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

  let logStatus = "on_time";
  let requiresApproval = false;
  let hoursDelayed = null;

  if (hoursDiff > 48) {
    logStatus = "retroactive";
    requiresApproval = true;
    hoursDelayed = Math.floor(hoursDiff);
  } else if (hoursDiff > 24) {
    logStatus = "late";
    hoursDelayed = Math.floor(hoursDiff);
  }

  // Detect conflicts: RPE vs session type
  const conflicts = [];
  const sessionType = protocol.training_focus || "general";
  const sessionTypeIntensity = {
    recovery: { max: 4 },
    light: { max: 5 },
    moderate: { max: 7 },
    intense: { min: 7 },
  };

  const typeRules = sessionTypeIntensity[sessionType];
  if (typeRules && actualRpe) {
    if (typeRules.max && actualRpe > typeRules.max) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
    if (typeRules.min && actualRpe < typeRules.min) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
  }

  // Log to training_sessions table for ACWR calculation
  // Contract: Section 3.3 - Logging APIs (execution logging)
  try {
    // This is execution logging, not structure modification - allowed for athletes
    await supabase.from("training_sessions").insert({
      user_id: userId,
      session_date: protocol.protocol_date,
      session_type: sessionType,
      duration_minutes: actualDurationMinutes,
      rpe: actualRpe,
      load_au: actualLoadAu,
      notes: sessionNotes,
      source: "daily_protocol",
      session_state: "COMPLETED", // Execution logging creates completed session
      coach_locked: false, // Execution logs are not coach-locked
      log_status: logStatus,
      requires_coach_approval: requiresApproval,
      hours_delayed: hoursDelayed,
      conflicts: conflicts.length > 0 ? conflicts : null,
    });

    // If retroactive, notify coach for approval
    if (requiresApproval) {
      // Get coach for this player
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "player")
        .maybeSingle();

      if (teamMember) {
        const { data: coaches } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamMember.team_id)
          .eq("role", "coach")
          .limit(1);

        if (coaches && coaches.length > 0) {
          await supabase.from("notifications").insert({
            user_id: coaches[0].user_id,
            notification_type: "training",
            message: `Player logged training session ${hoursDelayed} hours late - approval required`,
            priority: "high",
            metadata: { playerId: userId, sessionDate: protocol.protocol_date },
          });
        }
      }
    }
  } catch (sessionError) {
    console.warn("Could not log to training_sessions:", sessionError.message);
    // Non-fatal - continue
  }

  // Trigger ACWR recalculation
  try {
    await supabase.rpc("compute_acwr", { athlete: userId });
    console.log("ACWR recalculated for user:", userId);
  } catch (acwrError) {
    console.warn("Could not recalculate ACWR:", acwrError.message);
    // Non-fatal - ACWR will be recalculated on next load
  }

  // Update wellness tracking - log the training
  try {
    await supabase.from("wellness_logs").upsert(
      {
        user_id: userId,
        log_date: protocol.protocol_date,
        training_load: actualLoadAu,
        training_duration: actualDurationMinutes,
        training_rpe: actualRpe,
      },
      {
        onConflict: "user_id,log_date",
        ignoreDuplicates: false,
      },
    );
  } catch (wellnessError) {
    console.warn("Could not update wellness:", wellnessError.message);
    // Non-fatal
  }

  // Mark completions as logged to ACWR
  try {
    await supabase
      .from("protocol_completions")
      .update({ logged_to_acwr: true, logged_to_wellness: true })
      .eq("protocol_id", protocolId)
      .eq("user_id", userId);
  } catch (completionError) {
    console.warn("Could not update completions:", completionError.message);
  }

  // Update training streak
  let streakResult = null;
  try {
    const { data: streakData, error: streakError } = await supabase.rpc(
      "update_player_streak",
      {
        p_user_id: userId,
        p_streak_type: "training",
        p_activity_date: protocol.protocol_date,
      },
    );

    if (!streakError && streakData && streakData.length > 0) {
      streakResult = streakData[0];

      // Award any streak achievements
      const unlocked = streakResult.achievements_unlocked || [];
      for (const slug of unlocked) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: slug,
          p_context: JSON.stringify({ streak_length: streakResult.new_streak }),
        });
      }
    }
  } catch (streakError) {
    console.warn("Could not update streak:", streakError.message);
  }

  // Update player_training_stats
  try {
    const currentMonth = protocol.protocol_date.substring(0, 7); // YYYY-MM

    // Check if stats exist
    const { data: existingStats } = await supabase
      .from("player_training_stats")
      .select(
        "id, total_sessions, total_training_minutes, total_load_au, month_sessions, month_load_au, current_month",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (existingStats) {
      const monthReset = existingStats.current_month !== currentMonth;
      await supabase
        .from("player_training_stats")
        .update({
          total_sessions: existingStats.total_sessions + 1,
          total_training_minutes:
            existingStats.total_training_minutes + actualDurationMinutes,
          total_load_au: existingStats.total_load_au + actualLoadAu,
          month_sessions: monthReset ? 1 : existingStats.month_sessions + 1,
          month_load_au: monthReset
            ? actualLoadAu
            : existingStats.month_load_au + actualLoadAu,
          current_month: currentMonth,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("player_training_stats").insert({
        user_id: userId,
        total_sessions: 1,
        total_training_minutes: actualDurationMinutes,
        total_load_au: actualLoadAu,
        month_sessions: 1,
        month_load_au: actualLoadAu,
        current_month: currentMonth,
      });
    }
  } catch (statsError) {
    console.warn("Could not update stats:", statsError.message);
  }

  // Check for session milestone achievements
  try {
    const { data: stats } = await supabase
      .from("player_training_stats")
      .select("total_sessions")
      .eq("user_id", userId)
      .maybeSingle();

    if (stats) {
      const sessionsCount = stats.total_sessions;
      // Check milestone achievements
      const milestones = [
        { count: 1, slug: "protocol_first" },
        { count: 10, slug: "sessions_10" },
        { count: 50, slug: "sessions_50" },
        { count: 100, slug: "sessions_100" },
        { count: 365, slug: "sessions_365" },
      ];

      for (const milestone of milestones) {
        if (sessionsCount >= milestone.count) {
          await supabase.rpc("award_achievement", {
            p_user_id: userId,
            p_achievement_slug: milestone.slug,
            p_context: JSON.stringify({ sessions: sessionsCount }),
          });
        }
      }
    }
  } catch (achievementError) {
    console.warn("Could not check achievements:", achievementError.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      actualLoadAu,
      streak: streakResult
        ? {
            newStreak: streakResult.new_streak,
            isNewRecord: streakResult.is_new_record,
          }
        : null,
    }),
  };
}

export const testHandler = handler;
export const testTransforms = {
  buildAcwrPresentation,
  transformExercise,
};
export default createRuntimeV2Handler(handler);
