/**
 * Training Programs API
 * 
 * Provides endpoints for:
 * - GET /training-programs - List all programs
 * - GET /training-programs?id={id} - Get single program with phases
 * - GET /training-programs?id={id}&full=true - Get full program with all nested data
 * - GET /training-programs/phases?programId={id} - Get phases for a program
 * - GET /training-programs/weeks?phaseId={id} - Get weeks for a phase
 * - GET /training-programs/sessions?weekId={id} - Get sessions for a week
 * - GET /training-programs/exercises?sessionId={id} - Get exercises for a session
 */

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse, createErrorResponse } = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Get all training programs
 */
async function getPrograms(queryParams) {
  const { position, active_only } = queryParams;
  
  let query = supabaseAdmin
    .from("training_programs")
    .select(`
      id,
      name,
      description,
      position_id,
      program_type,
      difficulty_level,
      duration_weeks,
      sessions_per_week,
      start_date,
      end_date,
      is_template,
      is_active,
      created_at,
      positions (
        id,
        name,
        display_name
      )
    `)
    .order("start_date", { ascending: false });

  if (active_only === "true") {
    query = query.eq("is_active", true);
  }

  if (position) {
    query = query.eq("positions.name", position);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get a single program with its phases
 */
async function getProgram(programId) {
  const { data, error } = await supabaseAdmin
    .from("training_programs")
    .select(`
      id,
      name,
      description,
      position_id,
      program_type,
      difficulty_level,
      duration_weeks,
      sessions_per_week,
      start_date,
      end_date,
      is_template,
      is_active,
      created_at,
      positions (
        id,
        name,
        display_name
      ),
      training_phases (
        id,
        name,
        description,
        start_date,
        end_date,
        phase_order,
        focus_areas,
        load_progression,
        goals
      )
    `)
    .eq("id", programId)
    .single();

  if (error) throw error;

  // Sort phases by phase_order
  if (data && data.training_phases) {
    data.training_phases.sort((a, b) => a.phase_order - b.phase_order);
  }

  return data;
}

/**
 * Get full program with all nested data (phases, weeks, sessions, exercises)
 */
async function getFullProgram(programId) {
  // Get program with phases
  const program = await getProgram(programId);
  if (!program) return null;

  // Get all weeks for the program's phases
  const phaseIds = program.training_phases.map(p => p.id);
  
  const { data: weeks, error: weeksError } = await supabaseAdmin
    .from("training_weeks")
    .select("*")
    .in("phase_id", phaseIds)
    .order("week_number", { ascending: true });

  if (weeksError) throw weeksError;

  // Get all session templates for the program
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from("training_session_templates")
    .select(`
      *,
      session_exercises (
        id,
        exercise_id,
        exercise_name,
        exercise_order,
        sets,
        reps,
        duration_seconds,
        distance_meters,
        load_description,
        load_percentage,
        rest_seconds,
        tempo,
        intensity,
        notes,
        exercises (
          id,
          name,
          category,
          subcategory,
          description,
          instructions,
          coaching_cues,
          equipment_needed,
          muscle_groups,
          difficulty_level,
          video_url
        )
      )
    `)
    .eq("program_id", programId)
    .order("day_of_week", { ascending: true });

  if (sessionsError) throw sessionsError;

  // Get movement patterns
  const { data: movementPatterns, error: mpError } = await supabaseAdmin
    .from("movement_patterns")
    .select("*")
    .eq("program_id", programId);

  if (mpError) throw mpError;

  // Get warmup protocols
  const { data: warmupProtocols, error: wpError } = await supabaseAdmin
    .from("warmup_protocols")
    .select("*")
    .eq("program_id", programId);

  if (wpError) throw wpError;

  // Organize data hierarchically
  const weeksByPhase = {};
  weeks.forEach(week => {
    if (!weeksByPhase[week.phase_id]) {
      weeksByPhase[week.phase_id] = [];
    }
    weeksByPhase[week.phase_id].push(week);
  });

  const sessionsByWeek = {};
  sessions.forEach(session => {
    if (session.week_id) {
      if (!sessionsByWeek[session.week_id]) {
        sessionsByWeek[session.week_id] = [];
      }
      // Sort exercises by order
      if (session.session_exercises) {
        session.session_exercises.sort((a, b) => a.exercise_order - b.exercise_order);
      }
      sessionsByWeek[session.week_id].push(session);
    }
  });

  // Attach weeks to phases and sessions to weeks
  program.training_phases.forEach(phase => {
    phase.weeks = weeksByPhase[phase.id] || [];
    phase.weeks.forEach(week => {
      week.sessions = sessionsByWeek[week.id] || [];
    });
  });

  // Add movement patterns and warmup protocols
  program.movement_patterns = movementPatterns;
  program.warmup_protocols = warmupProtocols;

  return program;
}

/**
 * Get phases for a program
 */
async function getPhases(programId) {
  const { data, error } = await supabaseAdmin
    .from("training_phases")
    .select("*")
    .eq("program_id", programId)
    .order("phase_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get weeks for a phase
 */
async function getWeeks(phaseId) {
  const { data, error } = await supabaseAdmin
    .from("training_weeks")
    .select("*")
    .eq("phase_id", phaseId)
    .order("week_number", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get sessions for a week
 */
async function getSessions(weekId) {
  const { data, error } = await supabaseAdmin
    .from("training_session_templates")
    .select(`
      *,
      session_exercises (
        id,
        exercise_id,
        exercise_name,
        exercise_order,
        sets,
        reps,
        duration_seconds,
        distance_meters,
        load_description,
        load_percentage,
        rest_seconds,
        tempo,
        intensity,
        notes,
        exercises (
          id,
          name,
          category,
          subcategory,
          description,
          instructions,
          coaching_cues,
          equipment_needed
        )
      )
    `)
    .eq("week_id", weekId)
    .order("day_of_week", { ascending: true })
    .order("session_order", { ascending: true });

  if (error) throw error;

  // Sort exercises within each session
  data?.forEach(session => {
    if (session.session_exercises) {
      session.session_exercises.sort((a, b) => a.exercise_order - b.exercise_order);
    }
  });

  return data;
}

/**
 * Get exercises for a session
 */
async function getExercises(sessionId) {
  const { data, error } = await supabaseAdmin
    .from("session_exercises")
    .select(`
      *,
      exercises (
        id,
        name,
        category,
        subcategory,
        description,
        instructions,
        coaching_cues,
        equipment_needed,
        muscle_groups,
        difficulty_level,
        video_url,
        image_url
      )
    `)
    .eq("session_template_id", sessionId)
    .order("exercise_order", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get current week based on date
 */
async function getCurrentWeek(programId, date) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("training_weeks")
    .select(`
      *,
      training_phases!inner (
        id,
        name,
        program_id
      )
    `)
    .eq("training_phases.program_id", programId)
    .lte("start_date", targetDate)
    .gte("end_date", targetDate)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-programs",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Public access for program templates
    handler: async (event, _context, { userId, requestId }) => {
      const queryParams = event.queryStringParameters || {};
      const path = event.path.replace("/.netlify/functions/training-programs", "");

      try {
        let result;

        // Route handling
        if (path === "/phases" || queryParams.action === "phases") {
          // Get phases for a program
          const programId = queryParams.programId || queryParams.program_id;
          if (!programId) {
            return createErrorResponse("programId is required", 400, "validation_error", requestId);
          }
          result = await getPhases(programId);
        } 
        else if (path === "/weeks" || queryParams.action === "weeks") {
          // Get weeks for a phase
          const phaseId = queryParams.phaseId || queryParams.phase_id;
          if (!phaseId) {
            return createErrorResponse("phaseId is required", 400, "validation_error", requestId);
          }
          result = await getWeeks(phaseId);
        }
        else if (path === "/sessions" || queryParams.action === "sessions") {
          // Get sessions for a week
          const weekId = queryParams.weekId || queryParams.week_id;
          if (!weekId) {
            return createErrorResponse("weekId is required", 400, "validation_error", requestId);
          }
          result = await getSessions(weekId);
        }
        else if (path === "/exercises" || queryParams.action === "exercises") {
          // Get exercises for a session
          const sessionId = queryParams.sessionId || queryParams.session_id;
          if (!sessionId) {
            return createErrorResponse("sessionId is required", 400, "validation_error", requestId);
          }
          result = await getExercises(sessionId);
        }
        else if (path === "/current-week" || queryParams.action === "current-week") {
          // Get current week based on date
          const programId = queryParams.programId || queryParams.program_id || queryParams.id;
          if (!programId) {
            return createErrorResponse("programId is required", 400, "validation_error", requestId);
          }
          result = await getCurrentWeek(programId, queryParams.date);
        }
        else if (queryParams.id) {
          // Get single program
          if (queryParams.full === "true") {
            result = await getFullProgram(queryParams.id);
          } else {
            result = await getProgram(queryParams.id);
          }
          
          if (!result) {
            return createErrorResponse("Program not found", 404, "not_found", requestId);
          }
        }
        else {
          // List all programs
          result = await getPrograms(queryParams);
        }

        return createSuccessResponse({
          data: result,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            count: Array.isArray(result) ? result.length : 1,
          },
        });
      } catch (error) {
        console.error(`[training-programs] Error (Request ID: ${requestId}):`, error);
        return createErrorResponse(
          error.message || "Failed to fetch training programs",
          500,
          "server_error",
          requestId
        );
      }
    },
  });
};

