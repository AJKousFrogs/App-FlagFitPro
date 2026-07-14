/**
 * Daily Protocol — the REALIZATION engine (D10: two-engine boundary).
 *
 * This backend owns turning an INTENT into a concrete session: the actual
 * exercises, sets/reps/holds, loads, and per-position work for a given day. It
 * consumes the intent produced by the CLIENT periodization service
 * (angular/.../core/services/periodization.service.ts), which owns the other half
 * of the contract — WHAT the day should achieve (phase, taper, RPE/minutes
 * targets, recovery/nutrition emphasis). That intent arrives via the `intent`
 * payload and is mapped in the COMPOSE step (`__compose__` / mapIntentToSession).
 *
 * Rule of thumb: if it's a TARGET or an INTENT ("today is a taper, aim RPE 6,
 * 45 min, emphasise recovery"), it belongs to periodization.service.ts. If it's a
 * REALIZATION ("3×5 hill sprints, 2×30s copenhagen plank"), it belongs here. Do
 * not re-derive periodization intent in this file, and do not pick exercises in
 * the client — that split is what keeps the two engines from contradicting.
 */
import { supabaseAdmin } from "./utils/supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import {
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
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
  isExerciseSafeForInjuries,
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
import {
  getActiveInjuries,
  resolveInjuryResponse,
  detectDeconditioning,
} from "./utils/active-injuries.js";
import { getLastHighCnsSession } from "./utils/cns-spacing.js";
import { generateTemplateMainSession } from "./utils/daily-protocol-template-session.js";
import {
  buildProtocolGenerationIdempotencyKey,
  createProtocolGenerationRequest,
  getExistingProtocolGenerationRequest,
  persistGeneratedProtocol,
} from "./utils/daily-protocol-persistence.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";
import {
  EXERCISE_CATEGORY_ALIASES,
  prioritizeExercises,
  fetchExercisesByCategories,
  seededOrderKey,
} from "./utils/daily-protocol-exercises.js";
import {
  BLOCK_TYPES,
  EVIDENCE_BASED_PROTOCOLS,
  DAY_NAMES,
} from "./utils/daily-protocol-periodization-config.js";
import {
  positionFlagsFor,
  mapIntentToSession,
  isLowLoadFocus,
  gymBlockPlanFor,
  templateMatchesFocus,
} from "./utils/daily-protocol-compose.js";
import {
  completeExercise,
  skipExercise,
  completeBlock,
  skipBlock,
} from "./utils/daily-protocol-mutations.js";
import { logSession } from "./utils/daily-protocol-log-session.js";

const logger = createLogger({ service: "netlify.daily-protocol" });
const TRAINING_SESSIONS_TABLE = "training_sessions";

function isMissingProtocolPersistenceError(error) {
  const code = error?.code;
  const message =
    typeof error?.message === "string" ? error.message.toLowerCase() : "";
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

/**
 * Get user's training context - position, age modifiers, practice schedule, current program
 */
async function getUserTrainingContext(supabase, userId, date, log = logger) {
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
    .eq("user_id", userId)
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
    log.warn(
      "daily_protocol_team_activity_resolution_failed",
      {
        user_id: userId,
        date,
      },
      error,
    );
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
    }
  } catch (error) {
    log.error("daily_protocol_session_resolution_failed", error, {
      user_id: userId,
      date,
    });
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
    }
  }

  // 8. Readiness + ACWR. SINGLE SOURCE OF TRUTH for the decision SCORE is the
  // canonical composite (calc-readiness → readiness_scores). The wellness
  // check-in has its OWN simpler readiness formula (calculated_readiness, exposed
  // by get_athlete_readiness) — that must NOT drive the decision layer (D2); it's
  // read only for supplementary detail (sleep/energy/soreness). When no composite
  // exists yet, score stays null and the decision layer falls back to a
  // conservative session (no fabrication).
  let readiness = null;

  const { data: composite } = await supabase
    .from("readiness_scores")
    .select("score, acwr")
    .eq("user_id", userId)
    .eq("day", date)
    .maybeSingle();

  const { data: wellnessData } = await supabase.rpc("get_athlete_readiness", {
    p_user_id: userId,
    p_date: date,
  });
  const w =
    wellnessData && wellnessData.length > 0 && wellnessData[0].has_checkin
      ? wellnessData[0]
      : null;

  if (composite || w) {
    readiness = {
      // Canonical composite only — never the check-in's parallel formula.
      score: composite ? composite.score : null,
      acwr: composite ? composite.acwr : null,
      sleepQuality: w ? w.sleep_quality : null,
      energyLevel: w ? w.energy_level : null,
      muscleSoreness: w ? w.muscle_soreness : null,
      stressLevel: w ? w.stress_level : null,
      sorenessAreas: w ? w.soreness_areas : null,
      hasCheckin: !!w,
    };
  }

  // 9. Get position-specific modifiers
  // Use userPosition which was already normalized from config or users table
  const position = userPosition || "wr_db";
  const positionModifiers = [];

  // 10. Calculate ACWR target range (adjusted by age)
  const baseAcwrMin = config?.acwr_target_min || 0.8;
  const baseAcwrMax = config?.acwr_target_max || 1.3;
  const acwrAdjustment = ageModifier?.acwr_max_adjustment || 0;

  // 11. Tournament taper.
  // ⚠️ D9: intentionally empty — this backend never queries tournaments, so the
  // taper loop below is currently inert. Under the two-engine split (see header /
  // D10), TAPER INTENT is owned by the client periodization service and arrives
  // via the `intent` payload (COMPOSE), which this engine realizes — so computing
  // a parallel backend taper here would double-count. The real source, if a
  // server-authoritative taper is ever needed, is the `competitions` table (NOT
  // `tournaments`/`upcomingTournaments`, which never existed). Kept as an explicit
  // empty so the dead branch is visible rather than implying a working feed.
  const upcomingTournaments = [];

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
    sessionResolution,
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
const legacyDailyProtocolHandler = async (event, log = logger) => {
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
        log,
      );
    }

    if (httpMethod === "POST") {
      const parsedPayload = tryParseJsonObjectBody(body);
      if (!parsedPayload.ok) {
        return withHeaders(parsedPayload.error);
      }
      const payload = parsedPayload.data;

      switch (endpoint) {
        case "generate":
          return await generateProtocol(
            supabase,
            user.id,
            payload,
            corsHeaders,
            log,
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
          return await logSession(supabase, user.id, payload, corsHeaders, log);
        default:
          break;
      }
    }

    return {
      ...createErrorResponse("Not found", 404, "not_found"),
      headers: corsHeaders,
    };
  } catch (err) {
    log.error("daily_protocol_request_failed", err);
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
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(evt, {
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
          trace_id: correlationId,
        }),
      );
      return legacyDailyProtocolHandler(evt, requestLogger);
    },
  });

/**
 * GET /api/daily-protocol
 * Fetch today's (or specified date's) protocol for the user
 */
async function getProtocol(supabase, userId, params, headers, log = logger) {
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
    log.warn(
      "daily_protocol_team_activity_resolution_failed",
      {
        user_id: userId,
        date,
        phase: "get_protocol",
      },
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

  // ============================================================================
  // AUTO-FIX: If protocol exists but has 0 exercises, regenerate using fallback
  // This fixes protocols that were created when the DB was empty
  // ============================================================================
  if (!protocolExercises || protocolExercises.length === 0) {
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
      // Conservative when unknown (S2) — not an optimistic 70; `||` also discarded
      // a legitimate score of 0.
      const readinessForLogic =
        protocol.readiness_score !== null ? protocol.readiness_score : 60;

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
          log.error(
            "daily_protocol_fallback_exercise_insert_failed",
            insertError,
            {
              user_id: userId,
              protocol_id: protocol.id,
              date,
              fallback_exercise_count: fallbackExercises.length,
            },
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
// ============================================================================
// COMPOSE MODE — daily-protocol as a CONSUMER of the periodization intent layer.
// When the client passes the day's intent (+ position) from periodization.today,
// daily-protocol REALIZES exercises for THAT intent instead of re-deriving its
// own session. Removes the disagreements (Saturday-sprint, month-phase, raw
// position/isQB, independent readiness override) for the session CHOICE. Absent
// an intent, every path below is bypassed and legacy behaviour is unchanged.
// ============================================================================

// Raise a deconditioning warning to the athlete's coaching staff (Tissue Load
// Engine §4.5). Deduped per athlete/day via coach_inbox_items.source; best-effort.
async function raiseDeconditioningWarning(
  supabase,
  userId,
  date,
  dropPct,
  injuryResponse,
  log = logger,
) {
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership?.team_id) {
    return;
  }

  const { data: existing } = await supabase
    .from("coach_inbox_items")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "deconditioning")
    .gte("created_at", `${date}T00:00:00Z`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return;
  } // already flagged today

  const { data: coaches } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", membership.team_id)
    .in("role", ["coach", "head_coach"])
    .eq("status", "active");
  if (!coaches?.length) {
    return;
  }

  const pct = Math.round(dropPct * 100);
  const region = injuryResponse.injuredRegions.join(", ") || "a tissue flag";
  await supabase.from("coach_inbox_items").insert(
    coaches.map((c) => ({
      coach_id: c.user_id,
      user_id: userId,
      team_id: membership.team_id,
      item_type: "deconditioning_warning",
      title: `Chronic load dropping under injury`,
      message: `Chronic training load is down ~${pct}% over 2 weeks while ${region} is flagged. Under-loading now sets up a return spike — consider maintaining non-provocative chronic load (low-impact conditioning) rather than full rest.`,
      priority: "normal",
      action_required: false,
      source: "deconditioning",
      metadata: {
        drop_pct: pct,
        severity: injuryResponse.severity,
        regions: injuryResponse.injuredRegions,
      },
      expires_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    })),
  );
  log.info("deconditioning_warning_raised", { user_id: userId, drop_pct: pct });
}

// Deterministic per-(athlete, day) ordering key for an exercise (H1). Replaces the
// old random-comparator shuffle, which was BOTH nondeterministic (regenerating the
// same day produced a different protocol — confusing, and untestable) and a biased,
// non-uniform shuffle. Hashing seed+exercise-id gives a stable pseudo-random order:
// same athlete+day → same selection; different exercises → different keys.
async function generateProtocol(
  supabase,
  userId,
  payload,
  headers,
  log = logger,
) {
  const date = payload.date || getIsoDateString();
  // Stable seed for deterministic exercise variety (H1) — see seededOrderKey.
  const varietySeed = `${userId}:${date}`;

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
      return await getProtocol(supabase, userId, { date }, headers, log);
    } else if (existingRequest.status === "failed") {
      log.warn("daily_protocol_previous_generation_failed", {
        user_id: userId,
        date,
        idempotency_key: idempotencyKey,
        previous_error: existingRequest.error,
      });
    }
    // If status is 'pending', continue (might be concurrent request, will be handled by unique constraint)
  }

  // Get user's full training context
  const context = await getUserTrainingContext(supabase, userId, date, log);

  // COMPOSE: trust the intent layer's position over daily-protocol's raw read
  // (fixes isQB/center). Applied before the decision context so downstream
  // warmup/main-session selection uses the correct position.
  if (payload.intent && payload.position) {
    Object.assign(context, positionFlagsFor(payload.position));
  }
  // COMPOSE: use the client's calendar-derived season phase instead of the
  // backend's switch(month) when the intent layer sends it. The client reads
  // the athlete's actual season_calendar JSONB; the switch(month) is a fixed
  // league-average approximation that's wrong for any non-standard calendar.
  if (payload.seasonPhase) {
    context.seasonPhase = payload.seasonPhase;
  }

  // COMPOSE: thread the resolved intent + its label so the rationale descriptor is
  // owned by the intent layer (single authority) — not a day-of-week template that
  // can contradict it ("Rest day" hero vs "Monday - Speed" rationale, Phase 2 B5).
  if (payload.intent) {
    context.intent = payload.intent;
    context.intentLabel = payload.intentLabel ?? null;
  }

  // DB authority: query team_season_phases for the athlete's team.
  // Only runs when the client didn't send an explicit seasonPhase — DB wins over
  // the month-switch fallback but yields to an explicit client override.
  if (!context.seasonPhase) {
    try {
      const { data: tm } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tm?.team_id) {
        const { data: tsp } = await supabase
          .from("team_season_phases")
          .select("phase_key")
          .eq("team_id", tm.team_id)
          .eq("is_active", true)
          .lte("start_date", date)
          .gte("end_date", date)
          .limit(1)
          .maybeSingle();
        if (tsp?.phase_key) {
          context.dbSeasonPhase = tsp.phase_key;
        }
      }
    } catch (_) {
      /* non-fatal — month-switch fallback still applies */
    }
  }

  // Record generation request (unique constraint = best-effort concurrency
  // dedup) BEFORE the injury branch, so the return-to-play path is serialized
  // through the SAME guard as the normal path instead of racing outside it. RTP
  // does its own daily_protocols upsert + protocol_exercises delete/insert; two
  // concurrent first-time RTP generations used to race that delete/insert (a
  // spurious 500 / duplicate rows). Acquiring the guard here — the same order
  // for every generation path — closes that window. `existingCompleted` covers
  // the already-generated case for both paths.
  const { requestRecord, existingCompleted } =
    await createProtocolGenerationRequest(
      supabase,
      userId,
      date,
      idempotencyKey,
    );

  if (
    existingCompleted?.status === "completed" &&
    existingCompleted.protocol_id
  ) {
    return await getProtocol(supabase, userId, { date }, headers, log);
  }

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
    .maybeSingle();

  // Authority is athlete_injuries (severity-tiered, expiry-aware), NOT the raw
  // soreness_areas slider. The slider is an INPUT to that system, never a parallel
  // rehab trigger (SOT Law 5a / utils/active-injuries.js): tripping RTP off it
  // locked athletes in rehab off one stale tag AND let a real active injury be
  // bypassed by a single clean check-in. Mirrors session-resolver.js:282 and
  // team-activity-resolver.js so all three rehab gates agree on one source.
  const activeInjuries = await getActiveInjuries(userId, date, {
    client: supabase,
  });
  const hasActiveInjuries = activeInjuries.length > 0;

  // GRADED injury response (SOT Law 5a / Tissue Load Engine §4.3). A minor/
  // moderate self-report no longer triggers the full recovery-only RTP takeover
  // (over-conservative — de-conditioning is itself an injury-risk factor). It
  // keeps the athlete training on a DOWN-REGULATED normal plan: load target cut
  // by injuryResponse.loadFactor + injured-region exercises filtered out. Only
  // SEVERE self-reports or ANY CLINICAL injury go to full RTP.
  const injuryResponse = resolveInjuryResponse(activeInjuries);

  // Deconditioning guard (Tissue Load Engine §4.5): while an athlete carries a
  // tissue flag, a COLLAPSE in chronic load is the setup for a dangerous return
  // spike — the under-load alarm matters as much as the spike alarm. Never a
  // fabricated risk % (ACWR is contested); just a real >15% chronic-load drop
  // flagged to the coach, deduped per day. Best-effort, never blocks the plan.
  if (injuryResponse.hasInjury) {
    try {
      const priorDay = new Date(
        new Date(`${date}T00:00:00Z`).getTime() - 14 * 86_400_000,
      )
        .toISOString()
        .slice(0, 10);
      const load = async (onOrBefore) =>
        Number(
          (
            await supabase
              .from("readiness_scores")
              .select("chronic_load")
              .eq("user_id", userId)
              .lte("day", onOrBefore)
              .order("day", { ascending: false })
              .limit(1)
              .maybeSingle()
          ).data?.chronic_load ?? 0,
        );
      const decon = detectDeconditioning(
        await load(date),
        await load(priorDay),
        true,
      );
      if (decon.warn) {
        log.info("daily_protocol_deconditioning_warning", {
          user_id: userId,
          date,
          drop_pct: Number(decon.dropPct.toFixed(2)),
        });
        await raiseDeconditioningWarning(
          supabase,
          userId,
          date,
          decon.dropPct,
          injuryResponse,
          log,
        );
      }
    } catch (deconErr) {
      log.warn("daily_protocol_deconditioning_check_failed", {}, deconErr);
    }
  }

  // Newly-injured gate: if a coach set injury_gate_active on this athlete,
  // block prescription delivery until the gate is cleared. This covers the
  // window between a new injury report and a confirmed RTP protocol —
  // preventing a normal full-load prescription from reaching a freshly injured
  // athlete before clinical review.
  if (!hasActiveInjuries) {
    const { data: userRow } = await supabase
      .from("users")
      .select("injury_gate_active, injury_gate_set_at")
      .eq("id", userId)
      .maybeSingle();
    if (userRow?.injury_gate_active) {
      log.info("daily_protocol_injury_gate_blocked", {
        user_id: userId,
        date,
        gate_set_at: userRow.injury_gate_set_at,
      });
      return {
        statusCode: 202,
        headers,
        body: JSON.stringify({
          success: true,
          pending_approval: true,
          message:
            "Your prescription is pending coach review following a recent injury report. You will be notified when it is approved.",
        }),
      };
    }
  }

  // Full RTP only for SEVERE self-reports or CLINICAL injuries; minor/moderate
  // fall through to the down-regulated normal plan below.
  if (injuryResponse.goRtp) {
    log.info("daily_protocol_return_to_play_triggered", {
      user_id: userId,
      date,
      injury_count: activeInjuries.length,
      severity: injuryResponse.severity,
      clinical: injuryResponse.hasClinical,
    });
    return await generateReturnToPlayProtocol(
      supabase,
      userId,
      date,
      wellnessCheckin,
      headers,
      { activeInjuries, getProtocol },
    );
  }
  // ============================================================================
  // (Generation request already recorded above, before the injury branch, so
  // both RTP and normal paths share one guard. `requestRecord`/`existingCompleted`
  // are in scope here.)

  let {
    readinessScore,
    acwrValue,
    confidenceMetadata,
    readinessForLogic,
    acwrForLogic,
    trainingFocus,
    aiRationale,
    adjustedLoadTarget,
    taperLoadMultiplier,
    injuryLoadAdjustment,
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
    injuryResponse,
  });

  if (injuryLoadAdjustment) {
    log.info("daily_protocol_injury_load_downregulated", {
      user_id: userId,
      date,
      ...injuryLoadAdjustment,
    });
  }

  // Age-scaled CNS recovery spacing — mirrors the client's cnsRecoveryHoursForAge().
  // Older athletes recover neuromuscular fatigue more slowly: <35y → 48h, 35-39y → 60h,
  // 40+y → 72h. Unknown age falls back to the 48h base (same as client default).
  const CNS_SPACING_HOURS =
    typeof context.age === "number" && context.age >= 40
      ? 72
      : typeof context.age === "number" && context.age >= 35
        ? 60
        : 48;
  const cnsBlockedAt = await getLastHighCnsSession(
    supabase,
    userId,
    date,
    CNS_SPACING_HOURS,
  );
  if (cnsBlockedAt) {
    aiRationale += ` ⚡ CNS spacing guard: sprint/speed session logged ${cnsBlockedAt.slice(0, 10)} — ≥${CNS_SPACING_HOURS}h between max-effort sessions.`;
  }

  // COMPOSE: when the intent layer supplies the day's intent, REALIZE it —
  // override daily-protocol's own session choice (the intent layer already
  // resolved day-type/phase/safety). composeSprint/composeGym are applied at the
  // isSprintSession / isGymTrainingDay sites below. Legacy path: both stay null.
  let composeSprint = null;
  let composeGym = null;
  if (payload.intent) {
    const m = mapIntentToSession(payload.intent, payload.intentLabel);
    trainingFocus = m.trainingFocus;
    isPracticeDay = m.isPracticeDay;
    isFilmRoomDay = false;
    composeSprint = cnsBlockedAt ? false : m.isSprintSession;
    composeGym = m.isGymTrainingDay;
  }

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
    buildTransientProtocolResponse,
  });

  if (fallbackProtocol) {
    return fallbackProtocol;
  }

  await addMorningMobilityBlock({
    supabase,
    protocolExercises,
    context,
  });

  // 2. Foam Roll — suppressed if athlete had a sports massage in the last 24h
  await addFoamRollBlock({
    supabase,
    protocolExercises,
    userId,
    date,
    seed: userId + date,
  });

  // Check if it's a sprint session (Saturday or session type is speed/sprint)
  // Declare early so it can be used in both warmup and main session generation.
  // Saturday sprint is a FALLBACK — it only fires when no client intent was sent.
  // Weather guard: if the client reports poor suitability or sub-zero apparent
  // temperature, suppress the Saturday-sprint fallback even when no intent overrides.
  const weatherSuitability = payload.weatherSuitability ?? null;
  const weatherTempC =
    typeof payload.weatherTempC === "number" ? payload.weatherTempC : null;
  const weatherBlocksSprint =
    weatherSuitability === "poor" ||
    (weatherTempC !== null && weatherTempC < 2);
  let isSprintSession =
    !weatherBlocksSprint &&
    (context.dayOfWeek === 6 || // Saturday fallback
      context.sessionResolution?.override?.type === "sprint_saturday" ||
      context.sessionTemplate?.session_type?.toLowerCase() === "speed" ||
      context.sessionTemplate?.session_type?.toLowerCase() === "sprint");
  // COMPOSE: the intent layer decides whether today is a sprint session, not the
  // Saturday hard-rule. Weather block applies even to compose path.
  if (composeSprint !== null) {
    isSprintSession = weatherBlocksSprint ? false : composeSprint;
  }

  // Skip the training warmup on non-training days. Rest/travel/competition days get
  // foam roll + morning mobility (above) but not a 25-min field/gym warmup with planks.
  // Game-day pre-game warmup happens on the field; rest is rest; travel is travel.
  const isNonTrainingIntent = ["rest", "travel", "competition"].includes(
    payload.intent,
  );
  if (!isNonTrainingIntent) {
    await addWarmupBlock({
      supabase,
      protocolExercises,
      context,
      trainingFocus,
      isPracticeDay,
      isFilmRoomDay,
      isSprintSession,
    });
  }

  // ============================================================================
  // EVIDENCE-BASED TRAINING BLOCKS (1.5h Gym Session Structure)
  // Based on VALD Practitioner's Guides
  // ============================================================================

  // Use the periodizationPhase already resolved by buildProtocolDecisionContext
  // (which prefers the client's calendar phase over switch(month) in COMPOSE mode).
  const currentPhase = periodizationPhase;
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

  // Skip gym blocks on practice days, film room days, or any low-load day type
  // (rest / recovery / mobility / travel / competition).
  let isGymTrainingDay =
    !isPracticeDay && !isFilmRoomDay && !isLowLoadFocus(trainingFocus);
  // COMPOSE: the intent layer decides whether today is a gym day.
  if (composeGym !== null) {
    isGymTrainingDay = composeGym;
  }

  if (isGymTrainingDay) {
    // The day's INTENT owns the block shape (COMPOSE contract): a strength day,
    // a mixed day and a technical day are no longer the identical five-block
    // dump — gymBlockPlanFor(trainingFocus) decides which blocks compose the
    // session (2026-07-14 production bug: a "Strength session" hero rendered
    // agility mains + field conditioning + WR stations).
    const gymPlan = gymBlockPlanFor(trainingFocus);

    // ============================================================================
    // 4. ISOMETRICS / DOP BLOCK (~15 min) — injury prevention, every gym day
    // Evidence: 3-5 sets × 3-6 sec maximal contractions, 30-60s rest
    // Source: VALD Practitioner's Guide to Isometrics
    // ============================================================================

    // Single source of truth: the `exercises` table, resolved via
    // EXERCISE_CATEGORY_ALIASES (legacy isometrics_exercises table retired 2026-07-12).
    const allIsometrics = !gymPlan.isometrics
      ? []
      : prioritizeExercises(
          await fetchExercisesByCategories(
            supabase,
            EXERCISE_CATEGORY_ALIASES.isometrics,
            30,
            log,
          ),
          [
            "isometric",
            "hold",
            "plank",
            "pallof",
            "copenhagen",
            "activation",
            "wall",
            "adductor",
          ],
          5,
        );

    if (allIsometrics.length > 0) {
      // Select 4-5 isometric exercises for ~15 min block
      const selectedIsometrics = allIsometrics
        .sort(
          (a, b) =>
            seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
        )
        .slice(0, 5);

      selectedIsometrics.forEach((ex, idx) => {
        const sets =
          EVIDENCE_BASED_PROTOCOLS.isometrics.sets.min +
          (readinessForLogic >= 70 ? 1 : 0); // Extra set if high readiness
        const holdSeconds = EVIDENCE_BASED_PROTOCOLS.isometrics.holdSeconds.max;

        protocolExercises.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "isometrics",
          sequence_order: idx + 1,
          prescribed_sets: sets,
          prescribed_hold_seconds: holdSeconds,
          rest_seconds: EVIDENCE_BASED_PROTOCOLS.isometrics.restSeconds.min,
          load_contribution_au: ex.load_contribution_au || 15,
          ai_note: `📊 Isometric Protocol: ${sets} sets × ${holdSeconds}s hold. Focus on maximal tension. Evidence: Builds strength at specific joint angles, safe for all fitness levels.`,
        });
      });
    }

    // Readiness-driven volume multiplier — scales prescribed_sets for plyometrics,
    // strength, and conditioning blocks. Low readiness = lower volume; the
    // taperLoadMultiplier post-pass below applies on top of this for taper weeks.
    // Thresholds match the readiness tier labels (high/moderate/low):
    //   ≥ 75 → full volume (3 sets)  |  55–74 → reduced (2 sets)  |  < 55 → minimal (1 set)
    const readinessSets =
      readinessScore !== null &&
      readinessScore !== undefined &&
      readinessScore < 55
        ? 1
        : readinessScore !== null &&
            readinessScore !== undefined &&
            readinessScore < 75
          ? 2
          : 3;

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

    // Single source of truth: the `exercises` table, resolved via
    // EXERCISE_CATEGORY_ALIASES (legacy plyometrics_exercises table retired 2026-07-12).
    // Plan-gated: plyo block belongs to the mixed day; pure strength days keep
    // their elastic primers in the gym warm-up instead.
    let allPlyometrics = !gymPlan.plyometrics
      ? []
      : prioritizeExercises(
          await fetchExercisesByCategories(
            supabase,
            EXERCISE_CATEGORY_ALIASES.plyometrics,
            20,
            log,
          ),
          ["jump", "bound", "hop", "skater", "medicine ball", "explosive"],
          5,
        );

    if (allPlyometrics.length > 0) {
      // Calculate contacts per session (divide weekly target by ~3 sessions)
      const contactsPerSession = Math.round(
        (plyoContactsConfig.min + plyoContactsConfig.max) / 2 / 3,
      );
      // Contacts per rep scales with intensity: low=4, medium=6, high/very_high=8.
      // Lower intensity = more technical focus per rep; higher = more contacts at speed.
      const repsPerExercise =
        plyoIntensity === "low"
          ? 4
          : plyoIntensity === "very_high" || plyoIntensity === "high"
            ? 8
            : 6;
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
        .sort(
          (a, b) =>
            seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
        )
        .slice(0, exerciseCount);

      selectedPlyos.forEach((ex, idx) => {
        protocolExercises.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "plyometrics",
          sequence_order: idx + 1,
          prescribed_sets: readinessSets,
          prescribed_reps: repsPerExercise,
          rest_seconds: plyoIntensity === "low" ? 120 : 90,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `⚡ Plyometric Phase: ${currentPhase}. Intensity: ${plyoIntensity.toUpperCase()}. Weekly contacts target: ${plyoContactsConfig.min}-${plyoContactsConfig.max}. Focus on LANDING MECHANICS first. (Markovic 2007: ≥90s rest prevents fatigue-driven tendon overload.)`,
        });
      });
    }

    // ============================================================================
    // 6. STRENGTH BLOCK (15 min)
    // Evidence: Nordic curls 2-3x/week reduce hamstring injury by 50-70%
    // Source: VALD Practitioner's Guide to Hamstrings
    // ============================================================================

    const strengthExercises = !gymPlan.strength
      ? []
      : await fetchExercisesByCategories(
          supabase,
          EXERCISE_CATEGORY_ALIASES.strength,
          30,
          log,
        );

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
            exercise_name: nordicExercise.name,
            block_type: "strength",
            sequence_order: 1, // Nordic curls FIRST in strength block
            prescribed_sets: nordicProtocol.sets,
            prescribed_reps: nordicProtocol.reps,
            rest_seconds: 90,
            load_contribution_au: nordicExercise.load_contribution_au || 25,
            ai_note: `🏋️ MANDATORY: Nordic Curls - Evidence shows 50-70% reduction in hamstring injuries when performed 2-3x/week. Focus on slow, controlled eccentric lowering.`,
          });
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
          .sort(
            (a, b) =>
              seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
          )
          .slice(0, 2);

        selectedHip.forEach((ex, idx) => {
          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            exercise_name: ex.name,
            block_type: "strength",
            sequence_order: (includeNordics ? 2 : 1) + idx,
            prescribed_sets: readinessSets,
            prescribed_reps: 10,
            rest_seconds: 60,
            load_contribution_au: ex.load_contribution_au || 20,
            ai_note: `🦵 Hip Strength: Targets Add:Abd ratio (target 0.8-1.2). Prevents groin injuries common in cutting sports.`,
          });
        });
      }

      // Add general strength exercises — count is plan-driven: a strength-focus
      // day carries the full complement, a mixed day a reduced one.
      const generalStrength = strengthExercises
        .filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("nordic") &&
            !ex.name?.toLowerCase().includes("adduct") &&
            !ex.name?.toLowerCase().includes("copenhagen"),
        )
        .sort(
          (a, b) =>
            seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
        )
        .slice(0, gymPlan.generalStrengthCount);

      generalStrength.forEach((ex, idx) => {
        const sequenceStart =
          (includeNordics ? 2 : 1) + (hipExercises.length > 0 ? 2 : 0);
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "strength",
          sequence_order: sequenceStart + idx,
          prescribed_sets: readinessSets,
          prescribed_reps: 8,
          rest_seconds: 90,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `💪 Strength Phase: ${currentPhase}. Focus on quality movement over load.`,
        });
      });
    }

    // ============================================================================
    // 7. CONDITIONING BLOCK (15 min)
    // Evidence: ACWR 0.8-1.3 optimal, >1.5 = 2-4x injury risk
    // SAFETY: No 80%+ sprinting on day 1 - progressive build required
    // Source: VALD Practitioner's Guide to Preseason, Gabbett 2016
    // ============================================================================

    const conditioningExercises = !gymPlan.conditioning
      ? []
      : await fetchExercisesByCategories(
          supabase,
          EXERCISE_CATEGORY_ALIASES.conditioning,
          20,
          log,
        );

    if (conditioningExercises && conditioningExercises.length > 0) {
      // Filter based on safe intensity
      let filteredConditioning = conditioningExercises;

      // If max intensity is low, exclude high-intensity exercises. Also exclude
      // them when the CNS spacing guard is active (cnsBlockedAt) — that guard is
      // a time-based "no max-effort work within N hours of the last one" rule,
      // independent of getSafeConditioningIntensity's ACWR/phase-based
      // maxIntensity, which has no awareness of it. Without this, a "mixed"
      // intent day (mapIntentToSession never sets isSprintSession for "mixed")
      // could still surface named sprint exercises here whenever ACWR/phase
      // alone didn't also happen to cap intensity <=60.
      if (safeConditioning.maxIntensity <= 60 || cnsBlockedAt) {
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
        .sort(
          (a, b) =>
            seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
        )
        .slice(0, 4);

      selectedConditioning.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "conditioning",
          sequence_order: idx + 1,
          prescribed_sets: readinessSets, // 1-3 sets, readiness-scaled
          // Honest work bout: the exercise's own default duration (a gasser or
          // tempo run is not a 30-second item), floor 60s.
          prescribed_duration_seconds: Math.max(
            60,
            ex.default_duration_seconds || 0,
          ),
          rest_seconds: 60,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 15) *
              (safeConditioning.maxIntensity / 100),
          ),
          ai_note:
            safeConditioning.note ||
            `🏃 Conditioning Phase: ${currentPhase}. Max intensity: ${safeConditioning.maxIntensity}%. ACWR-safe progression.`,
        });
      });
    }

    // ============================================================================
    // 8. SKILL/TWITCHING DRILLS BLOCK (15 min)
    // Position-specific reactive drills for neural activation
    // Source: VALD Speed Testing Guide, Flag Football Periodization
    // ============================================================================

    // Combine skill and agility exercises. Plan-gated: skill stations belong to
    // the technical day, where they ARE the session — not bolted onto strength.
    const skillExercises = !gymPlan.skills
      ? []
      : await fetchExercisesByCategories(
          supabase,
          EXERCISE_CATEGORY_ALIASES.skill_drills,
          20,
          log,
        );

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
      } else if (
        ["center", "rusher", "blitzer", "linebacker"].includes(
          normalizedPosition,
        )
      ) {
        // Position filter for the previously-unhandled roles so their dedicated
        // technical drills (snap accuracy, edge rush/contain, zone drops, flag-pull)
        // are prioritised over generic skill work when enough exist.
        const posSkills = skillExercises.filter((ex) =>
          ex.position_specific?.includes(normalizedPosition),
        );
        if (posSkills.length >= 2) {
          filteredSkill = posSkills;
        }
      }

      const selectedSkills = filteredSkill
        .sort(
          (a, b) =>
            seededOrderKey(varietySeed, a) - seededOrderKey(varietySeed, b),
        )
        .slice(0, gymPlan.skillsCount || 4);

      selectedSkills.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "skill_drills",
          sequence_order: idx + 1,
          prescribed_sets: readinessSets,
          prescribed_reps: 5,
          rest_seconds: 30,
          load_contribution_au: ex.load_contribution_au || 10,
          ai_note: `⚡ Skill Drill: Fast-twitch activation. Focus on speed and precision. Position: ${normalizedPosition}.`,
        });
      });
    }

    // NOTE: on a gym day the split blocks above (isometrics / plyometrics /
    // strength / conditioning / skill_drills) ARE the session and are rendered as
    // their own blocks. We deliberately do NOT copy them into a consolidated
    // "Main Session" — doing so listed every exercise twice (bug reported
    // 2026-07-12). Main Session is emitted only for non-gym primary work
    // (sprint / field / template sessions); see generateMainSessionFallback.
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

  // Priority 1: a day-of-week session template — but ONLY when it belongs to
  // this day (2026-07-14 fix). The intent owns the day (LOGIC §0): the template
  // must match the day's focus family, may not run on low-load days, and may
  // not stack a second "Main Session" onto a gym day whose split blocks are
  // already the session.
  const gymSplitBlockTypes = [
    "isometrics",
    "plyometrics",
    "strength",
    "conditioning",
    "skill_drills",
  ];
  const gymBlocksGenerated = protocolExercises.some((ex) =>
    gymSplitBlockTypes.includes(ex.block_type),
  );
  if (context.sessionTemplate && !isPracticeDay && !isFilmRoomDay) {
    const templateAllowed =
      !isLowLoadFocus(trainingFocus) &&
      !gymBlocksGenerated &&
      templateMatchesFocus(
        context.sessionTemplate.session_type,
        trainingFocus,
        isSprintSession,
      );
    if (templateAllowed) {
      mainSessionGenerated = await generateTemplateMainSession({
        supabase,
        userId,
        protocolExercises,
        context,
        readinessForLogic,
        acwrForLogic,
      });
    } else {
      log.info("daily_protocol_session_template_skipped", {
        template_session_type: context.sessionTemplate.session_type ?? null,
        training_focus: trainingFocus,
        gym_blocks_generated: gymBlocksGenerated,
      });
    }
  }

  if (!mainSessionGenerated && !isPracticeDay && !isFilmRoomDay) {
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
    activeInjuries,
  });

  // Graduated taper volume: when loadMultiplier < 1.0, scale prescribed_sets
  // down proportionally so the session volume actually reflects the taper.
  // Without this, a 40%-load taper cuts the AU budget label but still prescribes
  // 3 full sets of Nordics, plyos and sprints — defeating the taper intent.
  // prescribed_hold_seconds / prescribed_duration_seconds are intentionally kept
  // (reducing hold time is not the sport-science model for taper).
  if (taperLoadMultiplier < 1.0) {
    for (const ex of protocolExercises) {
      if (ex.prescribed_sets !== null && ex.prescribed_sets !== undefined) {
        ex.prescribed_sets = Math.max(
          1,
          Math.round(ex.prescribed_sets * taperLoadMultiplier),
        );
      }
    }
  }

  // De-duplicate by (exercise_id, block_type) before persisting. The unique
  // constraint protocol_exercises_protocol_id_exercise_id_block_type_key forbids
  // the same exercise twice in one block; a fallback/overlapping query can produce
  // that, and the resulting duplicate-key error was thrown straight through
  // persistGeneratedProtocol → a 500 on the whole generation (seen recurring in
  // protocol_generation_requests). Keep the first occurrence, preserve order, and
  // keep all rows with a null exercise_id (e.g. note/heading blocks).
  {
    const seen = new Set();
    const deduped = protocolExercises.filter((ex) => {
      if (ex?.exercise_id === null || ex?.exercise_id === undefined) {
        return true;
      }
      const key = `${ex.exercise_id}|${ex.block_type ?? ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    if (deduped.length !== protocolExercises.length) {
      log.info("daily_protocol_deduped_exercises", {
        removed: protocolExercises.length - deduped.length,
      });
      protocolExercises.length = 0;
      protocolExercises.push(...deduped);
    }
  }

  // Injury filter (Tissue Load Engine §4.3): on the DOWN-REGULATED normal plan
  // (minor/moderate injury — full RTP already returned earlier), strip any
  // exercise that loads the injured region so the server is self-sufficient for
  // safety and never depends on the client having sent an injury-adjusted intent.
  // Null-exercise rows (headings/notes) are always kept.
  if (
    injuryResponse.hasInjury &&
    !injuryResponse.goRtp &&
    injuryResponse.injuredRegions.length
  ) {
    const safe = protocolExercises.filter(
      (ex) =>
        ex?.exercise_id === null ||
        ex?.exercise_id === undefined ||
        isExerciseSafeForInjuries(
          { name: ex.exercise_name, tissue_targets: ex.tissue_targets },
          injuryResponse.injuredRegions,
        ),
    );
    if (safe.length !== protocolExercises.length) {
      log.info("daily_protocol_injury_filtered_exercises", {
        user_id: userId,
        removed: protocolExercises.length - safe.length,
        regions: injuryResponse.injuredRegions,
      });
      protocolExercises.length = 0;
      protocolExercises.push(...safe);
    }
  }

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

    log.warn(
      "daily_protocol_persistence_unavailable",
      {
        user_id: userId,
        date,
        protocol_exercise_count: protocolExercises.length,
      },
      error,
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

export const testHandler = handler;
export const testTransforms = {
  buildAcwrPresentation,
  transformExercise,
};
export const __compose__ = { positionFlagsFor, mapIntentToSession };
