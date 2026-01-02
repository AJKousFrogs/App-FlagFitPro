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
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
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

  // 2. Get user's birth date from users table if not in config
  let birthDate = config?.birth_date;
  if (!birthDate) {
    const { data: userData } = await supabase
      .from("users")
      .select("date_of_birth, birth_date")
      .eq("id", userId)
      .single();
    birthDate = userData?.date_of_birth || userData?.birth_date;
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
    .select(`
      *,
      training_programs (
        id, name, program_type, program_structure
      )
    `)
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

  // 6. Get today's session template from structured program
  let sessionTemplate = null;
  if (currentWeek) {
    const { data: template } = await supabase
      .from("training_session_templates")
      .select("*")
      .eq("week_id", currentWeek.id)
      .eq("day_of_week", dayOfWeek)
      .single();
    sessionTemplate = template;
  }

  // 7. Check if today has flag practice
  const flagPracticeSchedule = config?.flag_practice_schedule || [];
  const todayPractice = flagPracticeSchedule.find(p => p.day === dayOfWeek);
  const hasFlagPractice = !!todayPractice;

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
  const position = config?.primary_position || "wr_db";
  const { data: positionModifiers } = await supabase
    .from("position_exercise_modifiers")
    .select("*")
    .eq("position", position);

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
      const daysUntil = Math.ceil((tournamentDate - currentDate) / (1000 * 60 * 60 * 24));
      const taperWeeks = tournament.taper_weeks_before || 1;
      const taperDays = taperWeeks * 7;

      if (daysUntil <= taperDays && daysUntil > 0) {
        // We're in taper period
        const taperProgress = 1 - (daysUntil / taperDays); // 0 at start, 1 at tournament
        
        // Calculate taper reduction: 
        // Peak events: reduce to 40% at tournament
        // Regular events: reduce to 60% at tournament
        const minLoadPercent = tournament.is_peak_event ? 0.4 : 0.6;
        const loadMultiplier = 1 - (taperProgress * (1 - minLoadPercent));

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
          recommendation: getTaperRecommendation(daysUntil, tournament.is_peak_event),
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
    hasFlagPractice,
    flagPracticeDetails: todayPractice,
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
      return await getProtocol(supabase, user.id, queryStringParameters, corsHeaders);
    }

    if (httpMethod === "POST") {
      const payload = body ? JSON.parse(body) : {};

      switch (endpoint) {
        case "generate":
          return await generateProtocol(supabase, user.id, payload, corsHeaders);
        case "complete":
          return await completeExercise(supabase, user.id, payload, corsHeaders);
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
    `
    )
    .eq("protocol_id", protocol.id)
    .order("sequence_order");

  if (exercisesError) {
    throw exercisesError;
  }

  // Transform to frontend format
  const transformedProtocol = transformProtocolResponse(
    protocol,
    protocolExercises
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
  const date = payload.date || new Date().toISOString().split("T")[0];

  // Get user's full training context
  const context = await getUserTrainingContext(supabase, userId, date);

  // Check if protocol already exists
  const { data: existing } = await supabase
    .from("daily_protocols")
    .select("id")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .single();

  if (existing) {
    await supabase.from("protocol_exercises").delete().eq("protocol_id", existing.id);
    await supabase.from("daily_protocols").delete().eq("id", existing.id);
  }

  // Get readiness data (use actual data or defaults)
  const readinessScore = context.readiness?.score || 75;
  const acwrValue = context.readiness?.acwr || 1.05;

  // Determine training focus based on context
  let trainingFocus = "strength";
  let aiRationale = "";

  // Check if it's a flag practice day
  if (context.hasFlagPractice) {
    const practiceTime = context.flagPracticeDetails?.start_time || "18:00";
    aiRationale = `🏈 Flag practice day (${practiceTime}). `;
    
    if (context.isQB) {
      aiRationale += `QB: ${context.flagPracticeDetails?.expected_throws || 40-50} throws expected at practice. Arm care is light activation only - no heavy throwing before practice.`;
      trainingFocus = "practice_day_qb";
    } else {
      aiRationale += "Training adjusted to complement practice. Lower body work OK, rest before practice.";
      trainingFocus = "practice_day";
    }
  } else if (readinessScore < 50 || acwrValue > context.acwrTargetRange.max) {
    trainingFocus = "recovery";
    aiRationale = "⚠️ Readiness is low or ACWR is high. Today focuses on recovery and mobility.";
  } else if (readinessScore < 70) {
    trainingFocus = "skill";
    aiRationale = "Moderate readiness. Technical work recommended over high intensity.";
  } else {
    // Use session template focus if available
    if (context.sessionTemplate) {
      trainingFocus = context.sessionTemplate.session_type?.toLowerCase() || "strength";
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
    aiRationale = `${taperEmoji} TAPER for ${taper.tournament.name} (${taper.daysUntil} days). ${taper.recommendation} ` + aiRationale;
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
  const baseLoadTarget = Math.round(readinessScore * 15);
  let adjustedLoadTarget = Math.round(baseLoadTarget / (context.ageModifier?.recovery_modifier || 1));
  
  // Apply taper reduction
  if (taperLoadMultiplier < 1) {
    adjustedLoadTarget = Math.round(adjustedLoadTarget * taperLoadMultiplier);
  }

  // Create the protocol
  const { data: protocol, error: createError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: readinessScore,
      acwr_value: acwrValue,
      training_focus: trainingFocus,
      ai_rationale: aiRationale,
      total_load_target_au: adjustedLoadTarget,
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
          ai_note: "QB Morning Routine - Hip flexor flexibility supports throwing velocity",
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
    const shuffled = foamRollExercises.sort(() => Math.random() - 0.5).slice(0, 5);
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
  let warmUpQuery = supabase
    .from("exercises")
    .select("*")
    .eq("category", "warm_up")
    .eq("active", true)
    .not("subcategory", "eq", "morning_routine");

  // For QB, include QB-specific warm-up exercises
  if (context.isQB && !context.hasFlagPractice) {
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
      const shuffled = warmUpExercises.sort(() => Math.random() - 0.5).slice(0, 6);
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
  if (context.sessionTemplate && !context.hasFlagPractice) {
    // Get exercises from session_exercises table
    const { data: sessionExercises } = await supabase
      .from("session_exercises")
      .select(`
        *,
        exercises (
          id, name, slug, category, video_url, video_id, thumbnail_url,
          how_text, feel_text, compensation_text, load_contribution_au
        )
      `)
      .eq("session_template_id", context.sessionTemplate.id)
      .order("exercise_order");

    if (sessionExercises && sessionExercises.length > 0) {
      // Get previous session data for progressive overload
      const { data: previousCompletions } = await supabase
        .from("protocol_completions")
        .select(`
          exercise_id,
          protocol_exercises (
            actual_sets, actual_reps, actual_weight_kg, prescribed_weight_kg
          )
        `)
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
              weight: pc.protocol_exercises.actual_weight_kg || pc.protocol_exercises.prescribed_weight_kg,
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
        let prescribedWeight = se.load_percentage ? (se.load_percentage / 100) : null;
        let progressionNote = null;

        // Apply progressive overload logic
        if (prev && readinessScore >= 70 && acwrValue < context.acwrTargetRange.max) {
          // If previous was completed successfully, progress
          if (prev.reps >= prescribedReps && prev.sets >= prescribedSets) {
            // Add 1 rep or 2.5% weight
            const addReps = prescribedReps < 12;
            if (addReps) {
              prescribedReps = Math.min(prev.reps + 1, 15);
              progressionNote = `↑ +1 rep from last time (${prev.reps}→${prescribedReps})`;
            } else if (prescribedWeight) {
              prescribedWeight = prev.weight ? prev.weight * 1.025 : prescribedWeight;
              progressionNote = `↑ +2.5% load progression`;
            }
          }
        } else if (readinessScore < 50) {
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
  } else if (!context.hasFlagPractice) {
    // Fallback: Get generic main session exercises if no template
    const mainCategories = ["strength", "power", "plyometric", "agility"];
    const { data: mainExercises } = await supabase
      .from("exercises")
      .select("*")
      .in("category", mainCategories)
      .eq("active", true)
      .limit(20);

    if (mainExercises && mainExercises.length > 0) {
      const shuffled = mainExercises.sort(() => Math.random() - 0.5).slice(0, 6);
      shuffled.forEach((ex, idx) => {
        protocolExercises.push({
          protocol_id: protocol.id,
          exercise_id: ex.id,
          block_type: "main_session",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 3,
          prescribed_reps: ex.default_reps || 8,
          load_contribution_au: ex.load_contribution_au || 10,
          ai_note: "Generic exercise - configure your program for personalized training",
        });
      });
    }
  }

  // 6. Cool-down
  const { data: coolDownExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "cool_down")
    .eq("active", true)
    .limit(6);

  if (coolDownExercises && coolDownExercises.length > 0) {
    const shuffled = coolDownExercises.sort(() => Math.random() - 0.5).slice(0, 3);
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
    const shuffled = recoveryExercises.sort(() => Math.random() - 0.5).slice(0, 2);
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
  const { protocolExerciseId, skipReason } = payload;

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
  const { protocolId, actualDurationMinutes, actualRpe, sessionNotes } = payload;

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

  // Log to training_sessions table for ACWR calculation
  try {
    await supabase.from("training_sessions").insert({
      user_id: userId,
      session_date: protocol.protocol_date,
      session_type: protocol.training_focus || "general",
      duration_minutes: actualDurationMinutes,
      rpe: actualRpe,
      load_au: actualLoadAu,
      notes: sessionNotes,
      source: "daily_protocol",
    });
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
    await supabase.from("wellness_logs").upsert({
      user_id: userId,
      log_date: protocol.protocol_date,
      training_load: actualLoadAu,
      training_duration: actualDurationMinutes,
      training_rpe: actualRpe,
    }, {
      onConflict: "user_id,log_date",
      ignoreDuplicates: false,
    });
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
    const { data: streakData, error: streakError } = await supabase.rpc("update_player_streak", {
      p_user_id: userId,
      p_streak_type: "training",
      p_activity_date: protocol.protocol_date,
    });
    
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
      .select("id, total_sessions, total_training_minutes, total_load_au, month_sessions, month_load_au, current_month")
      .eq("user_id", userId)
      .single();

    if (existingStats) {
      const monthReset = existingStats.current_month !== currentMonth;
      await supabase
        .from("player_training_stats")
        .update({
          total_sessions: existingStats.total_sessions + 1,
          total_training_minutes: existingStats.total_training_minutes + actualDurationMinutes,
          total_load_au: existingStats.total_load_au + actualLoadAu,
          month_sessions: monthReset ? 1 : existingStats.month_sessions + 1,
          month_load_au: monthReset ? actualLoadAu : existingStats.month_load_au + actualLoadAu,
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
      streak: streakResult ? {
        newStreak: streakResult.new_streak,
        isNewRecord: streakResult.is_new_record,
      } : null,
    }),
  };
}

/**
 * Transform protocol data for frontend
 */
function transformProtocolResponse(protocol, exercises) {
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
      (e) => e.status === "complete"
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

  return {
    id: protocol.id,
    userId: protocol.user_id,
    protocolDate: protocol.protocol_date,
    readinessScore: protocol.readiness_score,
    acwrValue: protocol.acwr_value,
    totalLoadTargetAu: protocol.total_load_target_au,
    aiRationale: protocol.ai_rationale,
    trainingFocus: protocol.training_focus,
    morningMobility: createBlock("morning_mobility", "Morning Mobility", "pi-sun"),
    foamRoll: createBlock("foam_roll", "Pre-Training: Foam Roll", "pi-circle-fill"),
    mainSession: createBlock("main_session", "Main Session", "pi-play"),
    eveningRecovery: createBlock("evening_recovery", "Evening Recovery", "pi-moon"),
    overallProgress: protocol.overall_progress || 0,
    completedExercises: protocol.completed_exercises || 0,
    totalExercises: protocol.total_exercises || 0,
    actualDurationMinutes: protocol.actual_duration_minutes,
    actualRpe: protocol.actual_rpe,
    actualLoadAu: protocol.actual_load_au,
    sessionNotes: protocol.session_notes,
    generatedAt: protocol.generated_at,
    updatedAt: protocol.updated_at,
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
