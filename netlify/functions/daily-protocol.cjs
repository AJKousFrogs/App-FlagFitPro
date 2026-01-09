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

const { createClient } = require("@supabase/supabase-js");
const { resolveTodaySession } = require("./utils/session-resolver.cjs");
const { resolveTeamActivityForAthleteDay } = require("./utils/team-activity-resolver.cjs");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = (authHeader) => {
  if (authHeader) {
    // Use the user's token for RLS
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Compute session override using deterministic priority rules.
 * SINGLE SOURCE OF TRUTH for override computation.
 * 
 * Priority order (highest to lowest):
 * 1. rehab_protocol - Active injury protocol (safety first)
 * 2. coach_alert - Coach has flagged something requiring attention
 * 3. weather_override - Weather conditions prevent normal training
 * 4. teamActivity (ONLY if participation !== 'excluded') - Practice or film room
 * 5. taper - Tournament taper period
 * 6. null - No override, use normal program session
 * 
 * @param {Object} params - Override computation parameters
 * @param {boolean} params.rehabActive - Whether athlete has active injury/rehab
 * @param {string[]} params.injuries - List of injury areas if rehabActive
 * @param {boolean} params.coachAlertActive - Whether coach alert is active
 * @param {boolean} params.weatherOverride - Whether weather override is in effect
 * @param {Object|null} params.teamActivity - Team activity object with type and participation
 * @param {boolean} params.taperActive - Whether athlete is in taper period
 * @param {Object|null} params.taperContext - Taper context with tournament info
 * @returns {Object|null} Override object or null
 */
function computeOverride({ rehabActive, injuries, coachAlertActive, weatherOverride, teamActivity, taperActive, taperContext }) {
  // Priority 1: Rehab protocol (safety first)
  if (rehabActive) {
    return {
      type: 'rehab_protocol',
      reason: injuries && injuries.length > 0 
        ? `Active injury protocol: ${injuries.join(', ')}`
        : 'Return-to-Play protocol active',
      replaceSession: true,
    };
  }

  // Priority 2: Coach alert (coach has flagged something)
  if (coachAlertActive) {
    return {
      type: 'coach_alert',
      reason: 'Coach alert active - check coach notes',
      replaceSession: false,
    };
  }

  // Priority 3: Weather override
  if (weatherOverride) {
    return {
      type: 'weather_override',
      reason: 'Weather conditions prevent normal training',
      replaceSession: true,
    };
  }

  // Priority 4: Team activity (ONLY if NOT excluded)
  // CRITICAL: Excluded athletes do NOT get flag_practice or film_room overrides
  if (teamActivity && teamActivity.participation !== 'excluded') {
    if (teamActivity.type === 'practice') {
      return {
        type: 'flag_practice',
        reason: `Team practice scheduled at ${teamActivity.startTimeLocal || '18:00'}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
    if (teamActivity.type === 'film_room') {
      return {
        type: 'film_room',
        reason: `Film room scheduled at ${teamActivity.startTimeLocal || '10:00'}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
  }

  // Priority 5: Taper period
  if (taperActive && taperContext) {
    return {
      type: 'taper',
      reason: `Taper for ${taperContext.tournament?.name || 'upcoming tournament'} (${taperContext.daysUntil} days)`,
      replaceSession: false,
    };
  }

  // No override - use normal program session
  return null;
}

// Block type configuration
const BLOCK_TYPES = {
  morning_mobility: { category: "mobility", estimatedMinutes: 10 },
  foam_roll: { category: "foam_roll", estimatedMinutes: 8 },
  warm_up: { category: "warm_up", estimatedMinutes: 10 },
  main_session: { category: "strength", estimatedMinutes: 45 },
  cool_down: { category: "cool_down", estimatedMinutes: 8 },
  evening_recovery: { category: "recovery", estimatedMinutes: 10 },
};

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
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) {
    return null;
  }
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Position mapping from UI values to modifier keys
 * Maps onboarding position values to position_exercise_modifiers.position values
 */
const POSITION_TO_MODIFIER_KEY = {
  QB: "quarterback",
  WR: "wr_db",
  DB: "wr_db",
  Center: "center",
  Rusher: "rusher",
  Blitzer: "blitzer",
  LB: "linebacker",
  Hybrid: "hybrid",
  // Lowercase variants (from athlete_training_config)
  quarterback: "quarterback",
  wr_db: "wr_db",
  center: "center",
  rusher: "rusher",
  blitzer: "blitzer",
  linebacker: "linebacker",
  hybrid: "hybrid",
};

/**
 * Normalize position value to modifier key
 */
function normalizePosition(position) {
  if (!position) {return "wr_db";}
  return POSITION_TO_MODIFIER_KEY[position] || "wr_db";
}

/**
 * Get user's training context - position, age modifiers, practice schedule, current program
 */
async function getUserTrainingContext(supabase, userId, date) {
  const dayOfWeek = new Date(date).getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  // 1. Get user config (position, age, practice schedule)
  const { data: config } = await supabase
    .from("athlete_training_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  // 2. Get user's birth date and position from users table if not in config
  let birthDate = config?.birth_date;
  let userPosition = config?.primary_position;

  // Fallback to users table if config doesn't exist or is missing data
  const { data: userData } = await supabase
    .from("users")
    .select("date_of_birth, birth_date, position")
    .eq("id", userId)
    .single();

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
      .single();
    ageModifier = modifier;
  }

  // 4. Get assigned program and current phase/week
  const { data: playerProgram } = await supabase
    .from("player_programs")
    .select(
      `
      *,
      training_programs (
        id, name, program_type, program_structure
      )
    `,
    )
    .eq("player_id", userId)
    .eq("status", "active")
    .single();

  // 5. Get current week based on date
  let currentWeek = null;
  let currentPhase = null;
  if (playerProgram?.training_programs?.id) {
    // Get phase for this date
    const { data: phase } = await supabase
      .from("training_phases")
      .select("*")
      .eq("program_id", playerProgram.training_programs.id)
      .lte("start_date", date)
      .gte("end_date", date)
      .single();
    currentPhase = phase;

    // Get week for this date
    if (phase) {
      const { data: week } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("phase_id", phase.id)
        .lte("start_date", date)
        .gte("end_date", date)
        .single();
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
      date
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
        override: sessionResolution.override?.type || 'none',
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
    const rehabActive = teamActivityResult.participation === 'excluded' && 
                        teamActivityResult.audit?.steps?.some(s => s.step === 'rehab_override');
    const injuries = teamActivityResult.audit?.steps?.find(s => s.step === 'rehab_check')?.injuries || [];
    
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
        sessionResolution = { success: true, status: 'resolved', override: null };
      }
      sessionResolution.override = override;
      
      console.log("[daily-protocol] Override computed via computeOverride:", {
        overrideType: override.type,
        participation: teamActivity.participation,
        activityType: teamActivity.type,
      });
    } else if (teamActivityResult.participation === 'excluded') {
      // Participation is excluded but no rehab override - log for debugging
      console.log("[daily-protocol] Team activity exists but athlete excluded (no override):", {
        activityType: teamActivity.type,
        participation: teamActivityResult.participation,
      });
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
    // Fallback to old readiness_scores table
    const { data: oldReadiness } = await supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("day", date)
      .single();

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
      const tournamentDate = new Date(tournament.start_date);
      const currentDate = new Date(date);
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
    // QB-specific flags
    isQB: position === "quarterback",
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
exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters, body, headers } = event;
  const authHeader = headers.authorization || headers.Authorization;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  // Require auth
  if (!authHeader) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Authorization required" }),
    };
  }

  const supabase = getSupabase(authHeader);

  // Get user from token
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid authentication" }),
    };
  }

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
      const payload = body ? JSON.parse(body) : {};

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
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error("Daily protocol error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: err.message,
      }),
    };
  }
};

/**
 * GET /api/daily-protocol
 * Fetch today's (or specified date's) protocol for the user
 */
async function getProtocol(supabase, userId, params, headers) {
  const date = params?.date || new Date().toISOString().split("T")[0];

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
      .select("name")
      .eq("id", protocol.modified_by_coach_id)
      .single();
    if (coach) {
      coachName = coach.name;
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
      date
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
      const rehabActive = teamActivityResult.participation === 'excluded' && 
                          teamActivityResult.audit?.steps?.some(s => s.step === 'rehab_override');
      const injuries = teamActivityResult.audit?.steps?.find(s => s.step === 'rehab_check')?.injuries || [];
      
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
        status: 'resolved',
        override,
      };
    }
  } catch (teamActivityError) {
    console.warn("[daily-protocol] Team activity resolution failed:", teamActivityError);
    // Non-fatal - continue without team activity
  }

  // Get all exercises for this protocol
  const { data: protocolExercises, error: exercisesError } = await supabase
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

  // Transform to frontend format
  const transformedProtocol = transformProtocolResponse(
    protocol,
    protocolExercises,
    coachName,
    teamActivity, // Pass team activity to transformer
    sessionResolution, // Pass session resolution for PROMPT 2.12
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: transformedProtocol }),
  };
}

/**
 * Generate Return-to-Play Protocol
 * Progressive 3-week foundation building program for injured athletes
 * Based on sports medicine best practices for safe return to training
 */
async function generateReturnToPlayProtocol(
  supabase,
  userId,
  date,
  context,
  wellnessCheckin,
) {
  console.log("[RTP] Generating return-to-play protocol for", date);

  // Parse injury information
  const injuries = wellnessCheckin.soreness_areas || [];
  const injurySeverity = wellnessCheckin.overall_soreness || 3; // 1-5 scale
  const painLevel = wellnessCheckin.pain_level || 2; // 1-5 scale

  // Determine RTP phase based on pain level and time since injury
  let rtpPhase = 1; // Phase 1: Pain management & gentle mobility
  let phaseName = "Phase 1: Foundation & Pain Management";
  let aiRationale = `🏥 RETURN-TO-PLAY PROTOCOL - ${phaseName}\n\n`;

  // Add injury-specific guidance
  aiRationale += `Active concerns: ${injuries.join(", ")}\n`;
  aiRationale += `Pain level: ${painLevel}/5\n\n`;

  if (painLevel >= 4) {
    aiRationale += `⚠️ HIGH PAIN LEVEL: Focus on pain-free movement only. No loading exercises. Consult physiotherapist if pain persists.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 3) {
    aiRationale += `⚠️ MODERATE PAIN: Light activity only. Avoid aggravating movements. Progress slowly.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 2) {
    aiRationale += `✓ MILD DISCOMFORT: Can begin light loading. Monitor response carefully.\n\n`;
    rtpPhase = 2;
    phaseName = "Phase 2: Light Loading & Strengthening";
  } else {
    aiRationale += `✓ MINIMAL/NO PAIN: Can progress to moderate loading. Continue building foundation.\n\n`;
    rtpPhase = 3;
    phaseName = "Phase 3: Progressive Loading & Conditioning";
  }

  aiRationale += `📋 TODAY'S FOCUS:\n`;
  if (rtpPhase === 1) {
    aiRationale += `- Gentle mobility and pain-free movement\n`;
    aiRationale += `- Focus on areas NOT injured\n`;
    aiRationale += `- Build base conditioning without aggravation\n`;
    aiRationale += `- Daily foam rolling and mobility work\n`;
  } else if (rtpPhase === 2) {
    aiRationale += `- Light resistance training (bodyweight only)\n`;
    aiRationale += `- Controlled movements in pain-free ranges\n`;
    aiRationale += `- Progressive mobility work\n`;
    aiRationale += `- Monitor for any pain increase\n`;
  } else {
    aiRationale += `- Moderate loading (20-30% of normal)\n`;
    aiRationale += `- Position-specific skill work at reduced intensity\n`;
    aiRationale += `- Build work capacity progressively\n`;
    aiRationale += `- Prepare for return to team practice\n`;
  }

  aiRationale += `\n⚕️ STOP if pain increases beyond 3/10 during any exercise.\n`;
  aiRationale += `✓ Update your wellness check-in daily to track progress.\n`;

  // Create the RTP protocol in database
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: Math.max(30, 50 - painLevel * 10), // Lower readiness with injury
      acwr_value: 0.5, // Keep load very low during RTP
      training_focus: `return_to_play_phase_${rtpPhase}`,
      ai_rationale: aiRationale,
      total_load_target_au: rtpPhase * 100, // Progressive: 100, 200, 300 AU
    })
    .select()
    .single();

  if (protocolError) {
    console.error("[RTP] Error creating protocol:", protocolError);
    throw protocolError;
  }

  const protocolExercises = [];
  let sequenceOrder = 0;

  // ============================================================================
  // 1. MORNING MOBILITY - Always included, gentle version
  // ============================================================================
  const { data: mobilityExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "mobility")
    .eq("subcategory", "morning_routine")
    .eq("active", true)
    .order("default_order")
    .limit(5);

  if (mobilityExercises && mobilityExercises.length > 0) {
    mobilityExercises.forEach((ex) => {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: ex.id,
        block_type: "morning_mobility",
        block_order: 1,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 10,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Pain-free range of motion only. Gentle movements.",
        load_contribution_au: Math.round((ex.load_contribution_au || 10) * 0.5), // 50% load
      });
    });
  }

  // ============================================================================
  // 2. REHAB-SPECIFIC EXERCISES - Based on injury area
  // ============================================================================
  if (rtpPhase >= 2) {
    // Get rehab exercises from database
    const { data: rehabExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "rehab")
      .eq("active", true)
      .order("difficulty_level") // Start with easiest
      .limit(4);

    if (rehabExercises && rehabExercises.length > 0) {
      rehabExercises.forEach((ex) => {
        const loadModifier = rtpPhase === 2 ? 0.3 : 0.5; // 30% or 50% normal load
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "rehab_progression",
          block_order: 2,
          sequence_order: sequenceOrder++,
          prescribed_sets: rtpPhase === 2 ? 2 : 3,
          prescribed_reps: ex.default_reps || 10,
          prescribed_hold_seconds: ex.default_hold_seconds,
          rest_seconds: 90,
          notes: `RTP Phase ${rtpPhase}: ${loadModifier * 100}% intensity. Monitor pain closely.`,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 20) * loadModifier,
          ),
        });
      });
    }
  }

  // ============================================================================
  // 3. PAIN-FREE CONDITIONING - Non-injured areas
  // ============================================================================
  if (rtpPhase >= 2) {
    // Add light conditioning that avoids injured areas
    const { data: conditioningExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "conditioning")
      .eq("subcategory", "low_impact")
      .eq("active", true)
      .limit(3);

    if (conditioningExercises && conditioningExercises.length > 0) {
      conditioningExercises.forEach((ex) => {
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "conditioning",
          block_order: 3,
          sequence_order: sequenceOrder++,
          prescribed_sets: 2,
          prescribed_duration_seconds: rtpPhase === 2 ? 30 : 45,
          rest_seconds: 60,
          notes: "Low impact only. Stop if pain occurs.",
          load_contribution_au: Math.round((ex.load_contribution_au || 15) * 0.4),
        });
      });
    }
  }

  // ============================================================================
  // 4. EVENING MOBILITY & FOAM ROLLING - Always included
  // ============================================================================
  const { data: eveningMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "mobility")
    .eq("subcategory", "evening_routine")
    .eq("active", true)
    .order("default_order")
    .limit(4);

  if (eveningMobility && eveningMobility.length > 0) {
    eveningMobility.forEach((ex) => {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: ex.id,
        block_type: "evening_mobility",
        block_order: 4,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 8,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Gentle recovery work. Focus on relaxation.",
        load_contribution_au: Math.round((ex.load_contribution_au || 8) * 0.5),
      });
    });
  }

  // Insert all exercises
  if (protocolExercises.length > 0) {
    const { error: insertError } = await supabase
      .from("protocol_exercises")
      .insert(protocolExercises);

    if (insertError) {
      console.error("[RTP] Error inserting exercises:", insertError);
      throw insertError;
    }
  }

  console.log(
    `[RTP] Generated Phase ${rtpPhase} protocol with ${protocolExercises.length} exercises`,
  );

  // Return the complete protocol
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      success: true,
      data: {
        ...protocol,
        exercises: protocolExercises,
        is_return_to_play: true,
        rtp_phase: rtpPhase,
        phase_name: phaseName,
      },
    }),
  };
}

/**
 * POST /api/daily-protocol/generate
 * Generate a new protocol for a given date using structured training data
 */
async function generateProtocol(supabase, userId, payload, headers) {
  const date = payload.date || new Date().toISOString().split("T")[0];

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

  // Check if protocol already exists
  const { data: existing } = await supabase
    .from("daily_protocols")
    .select("id")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .single();

  if (existing) {
    await supabase
      .from("protocol_exercises")
      .delete()
      .eq("protocol_id", existing.id);
    await supabase.from("daily_protocols").delete().eq("id", existing.id);
  }

  // ============================================================================
  // PROMPT 6: TRUTHFULNESS CONTRACT - Remove Misleading Defaults
  // ============================================================================
  // Get readiness data (TRUTHFULLY - null when missing)
  // We compute confidence from canonical sources and keep safe defaults internal only
  
  // Raw truth from database
  const readinessScore = context.readiness?.score || null;
  const acwrValue = context.readiness?.acwr || null;
  
  // Calculate confidence metadata based on what we actually have
  // BREACH FIX #1: Use context.sessionResolution (now returned from getUserTrainingContext)
  // PROMPT 2.19: Remove duplicate override field - sessionResolution is the single source of truth
  const confidenceMetadata = {
    readiness: {
      hasData: readinessScore !== null,
      source: context.readiness?.hasCheckin ? 'wellness_checkin' : 'none',
      daysStale: null, // TODO: Calculate from last checkin date
      confidence: readinessScore !== null ? 'high' : 'none',
    },
    acwr: {
      hasData: acwrValue !== null,
      source: acwrValue !== null ? 'training_sessions' : 'none',
      trainingDaysLogged: null, // TODO: Calculate from session history
      confidence: acwrValue !== null ? 'high' : 'building_baseline',
    },
    sessionResolution: {
      success: context.sessionResolution?.success || false,
      status: context.sessionResolution?.status || 'unknown',
      hasProgram: !!context.playerProgram,
      hasSessionTemplate: !!context.sessionTemplate,
      // REMOVED: override field - use data.sessionResolution.override as single source of truth
    },
  };
  
  // Safe defaults for internal logic only (NOT persisted to database)
  // These allow generation logic to work while stored values remain truthful
  const readinessForLogic = readinessScore !== null ? readinessScore : 70;
  const acwrForLogic = acwrValue !== null ? acwrValue : 1.0;
  
  console.log("[daily-protocol] Truthfulness contract check:", {
    readiness: {
      truth: readinessScore,
      forLogic: readinessForLogic,
      willPersist: readinessScore, // Only truth gets persisted
    },
    acwr: {
      truth: acwrValue,
      forLogic: acwrForLogic,
      willPersist: acwrValue, // Only truth gets persisted
    },
    confidence: confidenceMetadata,
  });

  // Determine training focus based on context
  let trainingFocus = "strength";
  let aiRationale = "";

  // Check if it's a flag practice day (from teamActivity, not player schedule)
  // DEPRECATED: player schedule is not authority; canonical source is team_activities.
  const isPracticeDay = context.sessionResolution?.override?.type === 'flag_practice';
  const isFilmRoomDay = context.sessionResolution?.override?.type === 'film_room';
  
  if (isPracticeDay && context.teamActivity?.activity) {
    const practiceTime = context.teamActivity.activity.startTimeLocal || "18:00";
    aiRationale = `🏈 Flag practice day (${practiceTime}). `;

    if (context.isQB) {
      aiRationale += `QB: Practice scheduled. Arm care is light activation only - no heavy throwing before practice.`;
      trainingFocus = "practice_day_qb";
    } else {
      aiRationale +=
        "Training adjusted to complement practice. Lower body work OK, rest before practice.";
      trainingFocus = "practice_day";
    }
  } else if (readinessForLogic < 50 || acwrForLogic > context.acwrTargetRange.max) {
    trainingFocus = "recovery";
    aiRationale =
      "⚠️ Readiness is low or ACWR is high. Today focuses on recovery and mobility.";
  } else if (readinessForLogic < 70) {
    trainingFocus = "skill";
    aiRationale =
      "Moderate readiness. Technical work recommended over high intensity.";
  } else {
    // Use session template focus if available
    if (context.sessionTemplate) {
      trainingFocus =
        context.sessionTemplate.session_type?.toLowerCase() || "strength";
      aiRationale = `📋 ${context.sessionTemplate.session_name}: ${context.sessionTemplate.description || "Structured training from your program."}`;
    } else {
      aiRationale = "Good readiness! Today is great for training.";
    }
  }

  // Check for taper period - this overrides other focus
  let taperLoadMultiplier = 1.0;
  if (context.taperContext?.isInTaper) {
    const taper = context.taperContext;
    taperLoadMultiplier = taper.loadMultiplier;

    // Override training focus for taper
    if (taper.daysUntil <= 2) {
      trainingFocus = "taper_final";
    } else if (taper.daysUntil <= 7) {
      trainingFocus = "taper_week";
    } else {
      trainingFocus = "taper_early";
    }

    // Add taper rationale at the start
    const taperEmoji = taper.tournament.isPeakEvent ? "🏆" : "🎯";
    aiRationale = `${taperEmoji} TAPER for ${taper.tournament.name} (${taper.daysUntil} days). ${taper.recommendation} ${aiRationale}`;
  }

  // Add age-based notes
  if (context.ageModifier && context.ageModifier.recovery_modifier > 1.1) {
    aiRationale += ` 👴 Age-adjusted recovery: ${Math.round((context.ageModifier.recovery_modifier - 1) * 100)}% more rest recommended (ACWR target: ${context.acwrTargetRange.min}-${context.acwrTargetRange.max.toFixed(2)}).`;
  }

  // Add phase info
  if (context.currentPhase) {
    aiRationale += ` 📅 Phase: ${context.currentPhase.name}.`;
  }

  // Calculate load target (adjusted by age AND taper)
  const baseLoadTarget = Math.round(readinessForLogic * 15);
  let adjustedLoadTarget = Math.round(
    baseLoadTarget / (context.ageModifier?.recovery_modifier || 1),
  );

  // Apply taper reduction
  if (taperLoadMultiplier < 1) {
    adjustedLoadTarget = Math.round(adjustedLoadTarget * taperLoadMultiplier);
  }

  // Create the protocol (TRUTHFULNESS: store actual values, not defaults)
  const { data: protocol, error: createError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: readinessScore, // NULL if no checkin (truthful)
      acwr_value: acwrValue, // NULL if no training history (truthful)
      training_focus: trainingFocus,
      ai_rationale: aiRationale,
      total_load_target_au: adjustedLoadTarget,
      // Add confidence metadata to protocol
      confidence_metadata: confidenceMetadata,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  const protocolExercises = [];

  // 1. Morning Mobility - Day-specific routine (or QB-specific for QBs)
  if (context.isQB) {
    // QB gets extra hip flexor and shoulder mobility
    const { data: qbMobilityExercises } = await supabase
      .from("exercises")
      .select("*")
      .contains("position_specific", ["quarterback"])
      .eq("category", "mobility")
      .eq("active", true)
      .limit(6);

    if (qbMobilityExercises && qbMobilityExercises.length > 0) {
      qbMobilityExercises.forEach((ex, idx) => {
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note:
            "QB Morning Routine - Hip flexor flexibility supports throwing velocity",
        });
      });
    }
  } else {
    // Standard day-specific morning mobility
    const morningMobilitySlug = `morning-mobility-day-${context.dayOfWeek === 0 ? 7 : context.dayOfWeek}`;
    const { data: morningMobility } = await supabase
      .from("exercises")
      .select("*")
      .eq("slug", morningMobilitySlug)
      .eq("active", true)
      .single();

    if (morningMobility) {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: morningMobility.id,
        block_type: "morning_mobility",
        sequence_order: 1,
        prescribed_sets: morningMobility.default_sets || 1,
        prescribed_reps: morningMobility.default_reps,
        prescribed_hold_seconds: morningMobility.default_hold_seconds,
        prescribed_duration_seconds: morningMobility.default_duration_seconds,
        load_contribution_au: morningMobility.load_contribution_au || 0,
      });
    }
  }

  // 2. Foam Roll - Standard for all positions
  const { data: foamRollExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "foam_roll")
    .eq("active", true)
    .limit(10);

  if (foamRollExercises && foamRollExercises.length > 0) {
    const shuffled = foamRollExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: ex.id,
        block_type: "foam_roll",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
      });
    });
  }

  // 3. Warm-up - Position-aware
  const warmUpQuery = supabase
    .from("exercises")
    .select("*")
    .eq("category", "warm_up")
    .eq("active", true)
    .not("subcategory", "eq", "morning_routine");

  // For QB, include QB-specific warm-up exercises (unless practice day)
  // Note: isPracticeDay and isFilmRoomDay already declared above in training focus section
  if (context.isQB && !isPracticeDay) {
    // Add QB pre-throwing warm-up (rotator cuff, scapular)
    const { data: qbWarmUp } = await supabase
      .from("exercises")
      .select("*")
      .contains("position_specific", ["quarterback"])
      .eq("category", "warm_up")
      .eq("active", true)
      .limit(8);

    if (qbWarmUp && qbWarmUp.length > 0) {
      qbWarmUp.forEach((ex, idx) => {
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "warm_up",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 2,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          ai_note: "QB Pre-Throwing Warm-up - 30 min mandatory before throwing",
          load_contribution_au: ex.load_contribution_au || 0,
        });
      });
    }
  } else {
    // Standard warm-up for non-QB or practice days
    const { data: warmUpExercises } = await warmUpQuery.limit(12);

    if (warmUpExercises && warmUpExercises.length > 0) {
      const shuffled = warmUpExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      shuffled.forEach((ex, idx) => {
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "warm_up",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
        });
      });
    }
  }

  // 4. Main Session - From structured program templates
  // Note: isPracticeDay and isFilmRoomDay already declared above in training focus section
  if (context.sessionTemplate && !isPracticeDay && !isFilmRoomDay) {
    // Get exercises from session_exercises table
    const { data: sessionExercises } = await supabase
      .from("session_exercises")
      .select(
        `
        *,
        exercises (
          id, name, slug, category, video_url, video_id, thumbnail_url,
          how_text, feel_text, compensation_text, load_contribution_au
        )
      `,
      )
      .eq("session_template_id", context.sessionTemplate.id)
      .order("exercise_order");

    if (sessionExercises && sessionExercises.length > 0) {
      // Get previous session data for progressive overload
      const { data: previousCompletions } = await supabase
        .from("protocol_completions")
        .select(
          `
          exercise_id,
          protocol_exercises (
            actual_sets, actual_reps, actual_weight_kg, prescribed_weight_kg
          )
        `,
        )
        .eq("user_id", userId)
        .eq("block_type", "main_session")
        .order("completion_date", { ascending: false })
        .limit(50);

      // Create a map of previous performance by exercise
      const previousPerformance = {};
      if (previousCompletions) {
        previousCompletions.forEach((pc) => {
          if (!previousPerformance[pc.exercise_id] && pc.protocol_exercises) {
            previousPerformance[pc.exercise_id] = {
              sets: pc.protocol_exercises.actual_sets,
              reps: pc.protocol_exercises.actual_reps,
              weight:
                pc.protocol_exercises.actual_weight_kg ||
                pc.protocol_exercises.prescribed_weight_kg,
            };
          }
        });
      }

      sessionExercises.forEach((se, idx) => {
        const exerciseId = se.exercise_id || se.exercises?.id;
        const prev = previousPerformance[exerciseId];

        // Calculate progressive overload
        let prescribedSets = se.sets || 3;
        let prescribedReps = parseInt(se.reps) || 8;
        let prescribedWeight = se.load_percentage
          ? se.load_percentage / 100
          : null;
        let progressionNote = null;

        // Apply progressive overload logic (use forLogic values)
        if (
          prev &&
          readinessForLogic >= 70 &&
          acwrForLogic < context.acwrTargetRange.max
        ) {
          // If previous was completed successfully, progress
          if (prev.reps >= prescribedReps && prev.sets >= prescribedSets) {
            // Add 1 rep or 2.5% weight
            const addReps = prescribedReps < 12;
            if (addReps) {
              prescribedReps = Math.min(prev.reps + 1, 15);
              progressionNote = `↑ +1 rep from last time (${prev.reps}→${prescribedReps})`;
            } else if (prescribedWeight) {
              prescribedWeight = prev.weight
                ? prev.weight * 1.025
                : prescribedWeight;
              progressionNote = `↑ +2.5% load progression`;
            }
          }
        } else if (readinessForLogic < 50) {
          // Reduce volume on low readiness
          prescribedSets = Math.max(prescribedSets - 1, 2);
          progressionNote = "⚠️ Volume reduced due to low readiness";
        }

        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: exerciseId,
          block_type: "main_session",
          sequence_order: idx + 1,
          prescribed_sets: prescribedSets,
          prescribed_reps: prescribedReps,
          prescribed_weight_kg: prescribedWeight,
          yesterday_sets: prev?.sets,
          yesterday_reps: prev?.reps,
          progression_note: progressionNote,
          ai_note: se.notes || context.sessionTemplate.description,
          load_contribution_au: se.exercises?.load_contribution_au || 10,
        });
      });
    }
  } else if (!isPracticeDay && !isFilmRoomDay) {
    // BREACH FIX #2: NO GENERIC FALLBACK (Blocker A violation)
    // DEPRECATED: availability is informational only; team_activities is authority.
    // If no session template, this is a truthful failure - return explicit error
    console.error("[daily-protocol] BLOCKER A VIOLATION: No session template found", {
      hasProgram: !!context.playerProgram,
      hasSessionTemplate: !!context.sessionTemplate,
      sessionResolution: context.sessionResolution,
    });
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Cannot generate protocol",
        details: {
          reason: context.sessionResolution?.reason || "No session template available for this date",
          sessionResolution: context.sessionResolution,
        },
      }),
    };
  }

  // 6. Cool-down
  const { data: coolDownExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "cool_down")
    .eq("active", true)
    .limit(6);

  if (coolDownExercises && coolDownExercises.length > 0) {
    const shuffled = coolDownExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: ex.id,
        block_type: "cool_down",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
      });
    });
  }

  // 7. Evening Recovery
  const { data: recoveryExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "recovery")
    .eq("active", true)
    .limit(4);

  if (recoveryExercises && recoveryExercises.length > 0) {
    const shuffled = recoveryExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        protocol_id: protocol.id,
        exercise_id: ex.id,
        block_type: "evening_recovery",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
      });
    });
  }

  // Insert all protocol exercises
  if (protocolExercises.length > 0) {
    const { error: insertError } = await supabase
      .from("protocol_exercises")
      .insert(protocolExercises);

    if (insertError) {
      throw insertError;
    }
  }

  // Update protocol with total exercises count
  await supabase
    .from("daily_protocols")
    .update({ total_exercises: protocolExercises.length })
    .eq("id", protocol.id);

  // Fetch the complete protocol
  return await getProtocol(supabase, userId, { date }, headers);
}

/**
 * POST /api/daily-protocol/complete
 * Mark a single exercise as complete
 */
async function completeExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, actualSets, actualReps, actualHoldSeconds } =
    payload;

  if (!protocolExerciseId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "protocolExerciseId required" }),
    };
  }

  // Update the exercise
  const { data: exercise, error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      actual_sets: actualSets,
      actual_reps: actualReps,
      actual_hold_seconds: actualHoldSeconds,
    })
    .eq("id", protocolExerciseId)
    .select("*, daily_protocols!inner(user_id, protocol_date, id)")
    .single();

  if (updateError) {
    throw updateError;
  }

  // Verify user owns this
  if (exercise.daily_protocols.user_id !== userId) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Not authorized" }),
    };
  }

  // Log the completion
  await supabase.from("protocol_completions").insert({
    user_id: userId,
    protocol_id: exercise.protocol_id,
    protocol_exercise_id: protocolExerciseId,
    completion_date: exercise.daily_protocols.protocol_date,
    block_type: exercise.block_type,
    exercise_id: exercise.exercise_id,
  });

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
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "protocolExerciseId required" }),
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
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "protocolId and blockType required" }),
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
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Not authorized" }),
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
  const blockStatusField = `${blockType.replace("_", "_")}_status`;
  const blockCompletedField = `${blockType.replace("_", "_")}_completed_at`;

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
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "protocolId and blockType required" }),
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
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Not authorized" }),
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
        .single();
      
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
      .single();

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
      .single();

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

/**
 * Transform protocol data for frontend
 */
function transformProtocolResponse(protocol, exercises, coachName = null, teamActivity = null, sessionResolution = null) {
  // Group exercises by block type
  const blocks = {
    morning_mobility: [],
    foam_roll: [],
    warm_up: [],
    main_session: [],
    cool_down: [],
    evening_recovery: [],
  };

  exercises.forEach((pe) => {
    if (blocks[pe.block_type]) {
      blocks[pe.block_type].push(transformExercise(pe));
    }
  });

  // Create block objects
  const createBlock = (type, title, icon) => {
    const blockExercises = blocks[type] || [];
    const completedCount = blockExercises.filter(
      (e) => e.status === "complete",
    ).length;

    return {
      type,
      title,
      icon,
      status: protocol[`${type}_status`] || "pending",
      exercises: blockExercises,
      completedCount,
      totalCount: blockExercises.length,
      progressPercent:
        blockExercises.length > 0
          ? Math.round((completedCount / blockExercises.length) * 100)
          : 0,
      completedAt: protocol[`${type}_completed_at`],
      estimatedDurationMinutes: BLOCK_TYPES[type]?.estimatedMinutes,
    };
  };

  // Build blocks array for resolver
  const blocksArray = [];
  if (blocks.morning_mobility.length > 0) {blocksArray.push({ type: "morning_mobility", title: "Morning Mobility" });}
  if (blocks.foam_roll.length > 0) {blocksArray.push({ type: "foam_roll", title: "Pre-Training: Foam Roll" });}
  if (blocks.warm_up.length > 0) {blocksArray.push({ type: "warm_up", title: "Warm Up" });}
  if (blocks.main_session.length > 0) {blocksArray.push({ type: "main_session", title: "Main Session" });}
  if (blocks.cool_down.length > 0) {blocksArray.push({ type: "cool_down", title: "Cool Down" });}
  if (blocks.evening_recovery.length > 0) {blocksArray.push({ type: "evening_recovery", title: "Evening Recovery" });}

  return {
    id: protocol.id,
    userId: protocol.user_id,
    protocol_date: protocol.protocol_date,
    readiness_score: protocol.readiness_score,
    acwr_value: protocol.acwr_value,
    totalLoadTargetAu: protocol.total_load_target_au,
    aiRationale: protocol.ai_rationale,
    trainingFocus: protocol.training_focus,
    morningMobility: createBlock(
      "morning_mobility",
      "Morning Mobility",
      "pi-sun",
    ),
    foamRoll: createBlock(
      "foam_roll",
      "Pre-Training: Foam Roll",
      "pi-circle-fill",
    ),
    mainSession: createBlock("main_session", "Main Session", "pi-play"),
    eveningRecovery: createBlock(
      "evening_recovery",
      "Evening Recovery",
      "pi-moon",
    ),
    blocks: blocksArray, // For resolver
    overallProgress: protocol.overall_progress || 0,
    completedExercises: protocol.completed_exercises || 0,
    totalExercises: protocol.total_exercises || 0,
    actualDurationMinutes: protocol.actual_duration_minutes,
    actualRpe: protocol.actual_rpe,
    actualLoadAu: protocol.actual_load_au,
    sessionNotes: protocol.session_notes,
    generatedAt: protocol.generated_at,
    updatedAt: protocol.updated_at,
    // Coach alert fields (for resolver)
    coach_alert_active: protocol.coach_alert_active || false,
    coach_alert_message: protocol.coach_alert_message || null,
    coach_alert_requires_acknowledgment: protocol.coach_alert_requires_acknowledgment || false,
    coach_acknowledged: protocol.coach_acknowledged || false,
    modified_by_coach_id: protocol.modified_by_coach_id || null,
    modified_by_coach_name: coachName || protocol.modified_by_coach_name || null,
    modified_at: protocol.modified_at || null,
    // Coach note fields
    coach_note: protocol.coach_note ? {
      content: protocol.coach_note,
      priority: protocol.coach_note_priority || "info",
      coachName: coachName || protocol.modified_by_coach_name || null,
      timestampLocal: protocol.modified_at || protocol.updated_at,
    } : null,
    // Team activity (PROMPT 2.10)
    teamActivity,
    // Session resolution (PROMPT 2.12 - Authority SOT)
    sessionResolution,
    // Confidence metadata (Truthfulness Contract)
    confidenceMetadata: protocol.confidence_metadata || null,
  };
}

/**
 * Transform a single exercise for frontend
 */
function transformExercise(protocolExercise) {
  const ex = protocolExercise.exercises;

  return {
    id: protocolExercise.id,
    exerciseId: ex.id,
    exercise: {
      id: ex.id,
      name: ex.name,
      slug: ex.slug,
      category: ex.category,
      subcategory: ex.subcategory,
      videoUrl: ex.video_url,
      videoId: ex.video_id,
      videoDurationSeconds: ex.video_duration_seconds,
      thumbnailUrl: ex.thumbnail_url,
      howText: ex.how_text,
      feelText: ex.feel_text,
      compensationText: ex.compensation_text,
      defaultSets: ex.default_sets,
      defaultReps: ex.default_reps,
      defaultHoldSeconds: ex.default_hold_seconds,
      defaultDurationSeconds: ex.default_duration_seconds,
      difficultyLevel: ex.difficulty_level,
      loadContributionAu: ex.load_contribution_au,
      isHighIntensity: ex.is_high_intensity,
    },
    blockType: protocolExercise.block_type,
    sequenceOrder: protocolExercise.sequence_order,
    prescribedSets: protocolExercise.prescribed_sets,
    prescribedReps: protocolExercise.prescribed_reps,
    prescribedHoldSeconds: protocolExercise.prescribed_hold_seconds,
    prescribedDurationSeconds: protocolExercise.prescribed_duration_seconds,
    prescribedWeightKg: protocolExercise.prescribed_weight_kg,
    yesterdaySets: protocolExercise.yesterday_sets,
    yesterdayReps: protocolExercise.yesterday_reps,
    yesterdayHoldSeconds: protocolExercise.yesterday_hold_seconds,
    progressionNote: protocolExercise.progression_note,
    aiNote: protocolExercise.ai_note,
    status: protocolExercise.status,
    completedAt: protocolExercise.completed_at,
    actualSets: protocolExercise.actual_sets,
    actualReps: protocolExercise.actual_reps,
    actualHoldSeconds: protocolExercise.actual_hold_seconds,
    loadContributionAu: protocolExercise.load_contribution_au,
  };
}
