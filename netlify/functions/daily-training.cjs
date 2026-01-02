/**
 * Netlify Function: Daily Training
 *
 * Provides personalized daily training plans based on:
 * - User's position and experience level
 * - Current ACWR and training load
 * - Seasonal context
 * - Available equipment
 */

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

// Seasonal training focus based on month
const SEASONAL_CONTEXT = {
  1: {
    season: "winter",
    primaryFocus: "Base Building & Strength",
    outdoorSprintSuitable: false,
  },
  2: {
    season: "winter",
    primaryFocus: "Base Building & Strength",
    outdoorSprintSuitable: false,
  },
  3: {
    season: "spring",
    primaryFocus: "Speed Development",
    outdoorSprintSuitable: true,
  },
  4: {
    season: "spring",
    primaryFocus: "Speed & Agility",
    outdoorSprintSuitable: true,
  },
  5: {
    season: "spring",
    primaryFocus: "Pre-Season Conditioning",
    outdoorSprintSuitable: true,
  },
  6: {
    season: "summer",
    primaryFocus: "Peak Performance",
    outdoorSprintSuitable: true,
  },
  7: {
    season: "summer",
    primaryFocus: "In-Season Maintenance",
    outdoorSprintSuitable: true,
  },
  8: {
    season: "summer",
    primaryFocus: "In-Season Performance",
    outdoorSprintSuitable: true,
  },
  9: {
    season: "fall",
    primaryFocus: "In-Season Maintenance",
    outdoorSprintSuitable: true,
  },
  10: {
    season: "fall",
    primaryFocus: "Late Season Recovery",
    outdoorSprintSuitable: true,
  },
  11: {
    season: "fall",
    primaryFocus: "Off-Season Transition",
    outdoorSprintSuitable: false,
  },
  12: {
    season: "winter",
    primaryFocus: "Recovery & Base Building",
    outdoorSprintSuitable: false,
  },
};

// Session types based on day of week - fallback only
const SESSION_TYPES = {
  monday: "Training",
  tuesday: "Training",
  wednesday: "Training",
  thursday: "Training",
  friday: "Training",
  saturday: "Training",
  sunday: "Rest",
};

// Motivational messages
const MOTIVATIONAL_MESSAGES = [
  "Every rep counts. Let's build something great today!",
  "Champions are made when no one is watching.",
  "Your future self will thank you for today's effort.",
  "Small progress is still progress. Keep pushing!",
  "The only bad workout is the one that didn't happen.",
  "Train like a champion, perform like a champion.",
  "Today's pain is tomorrow's power.",
  "Excellence is not a destination, it's a continuous journey.",
];

/**
 * Get user profile and training context
 */
async function getUserContext(userId) {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.warn("[DailyTraining] Error fetching profile:", profileError);
    }

    // Get recent training sessions for ACWR calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("training_sessions")
      .select("completed_at, workload, duration_minutes, intensity_level")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", thirtyDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (sessionsError) {
      console.warn("[DailyTraining] Error fetching sessions:", sessionsError);
    }

    // Get upcoming games in next 48 hours
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);

    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("id, game_date, opponent_name")
      .gte("game_date", today.toISOString().split("T")[0])
      .lte("game_date", twoDaysFromNow.toISOString().split("T")[0])
      .order("game_date", { ascending: true });

    if (gamesError) {
      console.warn("[DailyTraining] Error fetching games:", gamesError);
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Get today's and tomorrow's scheduled sessions
    const { data: scheduledSessions, error: scheduledError } = await supabaseAdmin
      .from("training_sessions")
      .select("session_type, session_date, status")
      .eq("user_id", userId)
      .gte("session_date", today.toISOString().split("T")[0])
      .lte("session_date", tomorrowStr)
      .order("session_date", { ascending: true });

    if (scheduledError) {
      console.warn("[DailyTraining] Error fetching scheduled sessions:", scheduledError);
    }

    // Calculate ACWR
    const acwr = calculateACWR(sessions || []);

    return {
      profile: profile || {},
      sessions: sessions || [],
      games: games || [],
      scheduledSessions: scheduledSessions || [],
      acwr,
    };
  } catch (error) {
    console.error("[DailyTraining] Error getting user context:", error);
    return {
      profile: {},
      sessions: [],
      acwr: { value: 1.0, status: "Optimal" },
    };
  }
}

/**
 * Calculate Acute:Chronic Workload Ratio
 */
function calculateACWR(sessions) {
  if (sessions.length === 0) {
    return { value: 1.0, status: "No data - starting fresh" };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const twentyEightDaysAgo = new Date(now);
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

  // Acute load (last 7 days)
  const acuteSessions = sessions.filter(
    (s) => new Date(s.completed_at) >= sevenDaysAgo,
  );
  const acuteLoad =
    acuteSessions.reduce((sum, s) => sum + (s.workload || 0), 0) / 7;

  // Chronic load (last 28 days)
  const chronicSessions = sessions.filter(
    (s) => new Date(s.completed_at) >= twentyEightDaysAgo,
  );
  const chronicLoad =
    chronicSessions.reduce((sum, s) => sum + (s.workload || 0), 0) / 28;

  if (chronicLoad === 0) {
    return { value: 1.0, status: "Building baseline" };
  }

  const acwr = acuteLoad / chronicLoad;

  let status;
  if (acwr < 0.8) {
    status = "Under-training - increase load gradually";
  } else if (acwr <= 1.3) {
    status = "Optimal training zone";
  } else if (acwr <= 1.5) {
    status = "Caution - moderate injury risk";
  } else {
    status = "High risk - reduce training load";
  }

  return { value: Math.round(acwr * 100) / 100, status };
}

/**
 * Get plyometric exercises from database
 */
async function getPlyometricExercises(difficulty = "intermediate", limit = 3) {
  try {
    const { data, error } = await supabaseAdmin
      .from("plyometric_exercises")
      .select("*")
      .eq("difficulty_level", difficulty)
      .limit(limit);

    if (error) {
      console.warn("[DailyTraining] Error fetching plyometrics:", error);
      return getDefaultPlyometrics();
    }

    return data.length > 0
      ? data.map(formatPlyometric)
      : getDefaultPlyometrics();
  } catch {
    return getDefaultPlyometrics();
  }
}

/**
 * Get isometric exercises from database
 */
async function getIsometricExercises(_category = "lower_body", limit = 3) {
  try {
    const { data, error } = await supabaseAdmin
      .from("isometric_exercises")
      .select("*")
      .limit(limit);

    if (error) {
      console.warn("[DailyTraining] Error fetching isometrics:", error);
      return getDefaultIsometrics();
    }

    return data.length > 0 ? data.map(formatIsometric) : getDefaultIsometrics();
  } catch {
    return getDefaultIsometrics();
  }
}

/**
 * Format plyometric exercise for response
 */
function formatPlyometric(exercise) {
  return {
    id: exercise.id,
    exercise_name: exercise.exercise_name,
    exercise_category: exercise.exercise_category,
    difficulty_level: exercise.difficulty_level,
    description: exercise.description,
    instructions: exercise.instructions || [],
    intensity_level: exercise.intensity_level,
    safety_notes: exercise.safety_notes || [],
    recommended_contacts: exercise.recommended_contacts || 20,
    session_sets: exercise.session_sets || 3,
    session_reps: exercise.session_reps || 8,
  };
}

/**
 * Format isometric exercise for response
 */
function formatIsometric(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    category: exercise.category,
    setup_instructions: exercise.setup_instructions,
    execution_cues: exercise.execution_cues || [],
    difficulty_level: exercise.difficulty_level,
    session_duration: exercise.recommended_duration_seconds || 30,
    session_sets: exercise.recommended_sets || 3,
    rest_between_sets: exercise.rest_period_seconds || 60,
  };
}

/**
 * Get default plyometric exercises
 */
function getDefaultPlyometrics() {
  return [
    {
      id: "default-1",
      exercise_name: "Box Jump",
      exercise_category: "lower_body",
      difficulty_level: "intermediate",
      description: "Explosive jump onto a box or platform",
      instructions: [
        "Stand facing box",
        "Swing arms and jump",
        "Land softly",
        "Step down",
      ],
      intensity_level: "moderate",
      safety_notes: ["Ensure stable surface", "Step down, don't jump"],
      recommended_contacts: 30,
      session_sets: 3,
      session_reps: 5,
    },
    {
      id: "default-2",
      exercise_name: "Lateral Bounds",
      exercise_category: "lower_body",
      difficulty_level: "intermediate",
      description: "Side-to-side explosive jumps",
      instructions: [
        "Start in athletic stance",
        "Push off laterally",
        "Land on outside foot",
        "Repeat",
      ],
      intensity_level: "moderate",
      safety_notes: ["Control landing", "Keep knee over toe"],
      recommended_contacts: 30,
      session_sets: 3,
      session_reps: 8,
    },
    {
      id: "default-3",
      exercise_name: "Pogo Jumps",
      exercise_category: "lower_body",
      difficulty_level: "beginner",
      description: "Quick, low-amplitude jumps for ankle stiffness",
      instructions: [
        "Stand with feet hip-width",
        "Jump using ankle power",
        "Minimize knee bend",
        "Stay on balls of feet",
      ],
      intensity_level: "low",
      safety_notes: ["Low injury risk", "Good for all levels"],
      recommended_contacts: 20,
      session_sets: 2,
      session_reps: 20,
    },
  ];
}

/**
 * Get default isometric exercises
 */
function getDefaultIsometrics() {
  return [
    {
      id: "default-1",
      name: "Wall Squat Hold",
      description: "Isometric squat against wall for quad strength",
      category: "lower_body",
      setup_instructions: "Back against wall, slide down to parallel",
      execution_cues: [
        "Press back into wall",
        "Keep knees over ankles",
        "Breathe normally",
      ],
      difficulty_level: "beginner",
      session_duration: 30,
      session_sets: 3,
      rest_between_sets: 60,
    },
    {
      id: "default-2",
      name: "Plank Hold",
      description: "Core stability exercise",
      category: "core",
      setup_instructions:
        "Forearms on ground, body straight from head to heels",
      execution_cues: ["Keep hips level", "Engage glutes", "Breathe steadily"],
      difficulty_level: "beginner",
      session_duration: 45,
      session_sets: 3,
      rest_between_sets: 60,
    },
    {
      id: "default-3",
      name: "Glute Bridge Hold",
      description: "Hip extension hold for glute activation",
      category: "lower_body",
      setup_instructions: "Lie on back, knees bent, drive hips up",
      execution_cues: [
        "Squeeze glutes at top",
        "Don't hyperextend back",
        "Press through heels",
      ],
      difficulty_level: "beginner",
      session_duration: 30,
      session_sets: 3,
      rest_between_sets: 60,
    },
  ];
}

/**
 * Build the warm-up protocol
 */
function buildWarmupProtocol() {
  return {
    title: "Universal Warm-Up Protocol",
    totalDuration: 20,
    phases: [
      {
        name: "Phase 1: Cardiovascular Prep & Core",
        duration: 8,
        exercises: [
          { name: "Light jog", duration: "2 min", intensity: "50-60%" },
          {
            name: "Jump rope",
            duration: "5 min",
            intensity: "Moderate-High",
            variations: ["Basic bounce", "Alternating feet", "High knees"],
          },
          {
            name: "Plank series",
            duration: "3 min",
            breakdown: [
              { variation: "Standard plank", duration: "1.5 min" },
              { variation: "Right side plank", duration: "45s" },
              { variation: "Left side plank", duration: "45s" },
            ],
          },
        ],
      },
      {
        name: "Phase 2: Resistance Band Activation",
        duration: 5,
        exercises: [
          { name: "Band pull-aparts", sets: 2, reps: 15, focus: "Upper back" },
          {
            name: "Band external rotations",
            sets: 2,
            reps: "10 each",
            focus: "Rotator cuff",
          },
          {
            name: "Band monster walks",
            sets: 2,
            distance: "10m each way",
            focus: "Glutes",
          },
          { name: "Band squats", sets: 2, reps: 10, focus: "Glute activation" },
        ],
      },
      {
        name: "Phase 3: Dynamic Stretching & Mobility",
        duration: 4,
        exercises: [
          {
            name: "Dynamic stretching sequence",
            duration: "2 min",
            movements: ["Arm circles", "Leg swings", "Torso rotations"],
          },
          {
            name: "Copenhagen plank",
            duration: "45s each side",
            focus: "Adductors",
          },
          {
            name: "World's greatest stretch",
            reps: "3 each side",
            focus: "Full body",
          },
        ],
      },
      {
        name: "Phase 4: Final Movement Prep",
        duration: 3,
        exercises: [
          { name: "Ankle circles + Calf raises", reps: "10 each" },
          { name: "Walking lunges", reps: "10 each leg" },
          { name: "Bodyweight squats", reps: 10 },
          { name: "Single-leg balance", duration: "20s each" },
        ],
      },
    ],
  };
}

/**
 * Build the daily training plan
 */
async function buildDailyTrainingPlan(userId, userContext) {
  const today = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeek = dayNames[today.getDay()].toLowerCase();
  const month = today.getMonth() + 1;

  const seasonal = SEASONAL_CONTEXT[month];
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const gameToday = userContext.games.find((g) => g.game_date === todayStr);
  const gameTomorrow = userContext.games.find((g) => g.game_date === tomorrowStr);
  const scheduledToday = userContext.scheduledSessions.find((s) => s.session_date === todayStr);

  let sessionType = scheduledToday ? scheduledToday.session_type : (gameToday ? "Game Day" : (gameTomorrow ? "Rest" : "Rest"));

  // Get greeting based on time of day
  let greeting;
  const hour = today.getHours();
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  // Get user name from profile
  const userName =
    userContext.profile?.first_name ||
    userContext.profile?.full_name?.split(" ")[0] ||
    "Athlete";

  // Get exercises (only if not a rest day)
  const isRestDay = sessionType === "Rest";
  const plyometrics = !isRestDay ? await getPlyometricExercises(
    userContext.profile?.experience_level || "intermediate",
  ) : [];
  const isometrics = !isRestDay ? await getIsometricExercises() : [];

  // Calculate total contacts and duration
  const totalContacts = plyometrics.reduce(
    (sum, ex) => sum + (ex.recommended_contacts || 0),
    0,
  );
  const totalIsoDuration = isometrics.reduce(
    (sum, ex) => sum + (ex.session_duration || 30) * (ex.session_sets || 3),
    0,
  );

  // Build schedule blocks
  const schedule = isRestDay ? [] : [
    {
      block: "Warm-Up",
      duration: 20,
      completed: false,
      protocol: buildWarmupProtocol(),
    },
    {
      block: "Plyometrics",
      duration: 15,
      completed: false,
      exercises: plyometrics,
      totalContacts,
      notes: "Focus on quality over quantity",
    },
    {
      block: "Isometrics",
      duration: 10,
      completed: false,
      exercises: isometrics,
      totalDuration: totalIsoDuration,
      purpose: "Pre-activation and stability",
    },
    {
      block: "Main Session",
      duration: 35,
      completed: false,
      type: sessionType.toLowerCase(),
      focus: getFocusAreas(sessionType),
    },
    {
      block: "Cool-Down",
      duration: 10,
      completed: false,
      activities: [
        "Light jog (2 min)",
        "Static stretching (5 min)",
        "Foam rolling (3 min)",
      ],
    },
  ];

  return {
    greeting: `${greeting}, ${userName}!`,
    date: today.toISOString().split("T")[0],
    dayOfWeek: dayNames[today.getDay()],
    seasonalContext: {
      month,
      season: seasonal.season,
      primaryFocus: seasonal.primaryFocus,
      outdoorSprintSuitable: seasonal.outdoorSprintSuitable,
      coachingNotes: getCoachingNotes(seasonal.season, sessionType),
    },
    trainingStatus: {
      phase: seasonal.primaryFocus,
      acwr: userContext.acwr.value,
      acwrStatus: userContext.acwr.status,
      recentSessions: userContext.sessions.length,
    },
    playerContext: {
      position: userContext.profile?.position || "player",
      experienceLevel: userContext.profile?.experience_level || "intermediate",
    },
    todaysPractice: {
      sessionType,
      focus: getFocusAreas(sessionType),
      totalDuration: schedule.length > 0 ? schedule.reduce((sum, block) => sum + block.duration, 0) : 0,
      schedule,
    },
    motivationalMessage:
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ],
  };
}

/**
 * Get focus areas based on session type
 */
function getFocusAreas(sessionType) {
  const focusMap = {
    Power: ["Explosive power", "Reactive strength", "Jump ability"],
    Speed: ["Linear speed", "Acceleration", "Sprint mechanics"],
    Recovery: ["Active recovery", "Mobility", "Flexibility"],
    Agility: ["Change of direction", "Lateral movement", "Footwork"],
    Conditioning: ["Endurance", "Work capacity", "Mental toughness"],
    "Game Day / Scrimmage": ["Game simulation", "Position skills", "Team play"],
    Rest: ["Complete rest", "Mental recovery", "Sleep optimization"],
  };
  return focusMap[sessionType] || ["General fitness"];
}

/**
 * Get coaching notes based on season and session
 */
function getCoachingNotes(season, sessionType) {
  if (season === "winter" && sessionType !== "Recovery") {
    return "Indoor training recommended. Focus on strength and technique work.";
  }
  if (season === "summer" && sessionType === "Conditioning") {
    return "Stay hydrated! Consider early morning or evening sessions to avoid peak heat.";
  }
  return null;
}

/**
 * Update training progress
 */
async function updateTrainingProgress(userId, updates) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if there's an existing session for today
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("training_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("scheduled_date", today)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.warn("[DailyTraining] Error fetching session:", fetchError);
    }

    if (existing) {
      // Update existing session
      const { error: updateError } = await supabaseAdmin
        .from("training_sessions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: "Progress updated" };
    } else {
      // Create new session
      const { error: insertError } = await supabaseAdmin
        .from("training_sessions")
        .insert({
          user_id: userId,
          scheduled_date: today,
          status: "in_progress",
          ...updates,
        });

      if (insertError) {
        throw insertError;
      }

      return { success: true, message: "Session created and progress saved" };
    }
  } catch (error) {
    console.error("[DailyTraining] Error updating progress:", error);
    return { success: false, message: error.message };
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "daily-training",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      // GET: Fetch daily training plan
      if (event.httpMethod === "GET") {
        try {
          const userContext = await getUserContext(userId);
          const trainingPlan = await buildDailyTrainingPlan(
            userId,
            userContext,
          );

          return createSuccessResponse(trainingPlan, requestId);
        } catch (error) {
          console.error("[DailyTraining] GET error:", error);
          return createErrorResponse(
            "Failed to generate training plan",
            500,
            "generation_error",
            requestId,
          );
        }
      }

      // POST: Update training progress
      if (event.httpMethod === "POST") {
        let body;
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId,
          );
        }

        try {
          const result = await updateTrainingProgress(userId, body);

          if (!result.success) {
            return createErrorResponse(
              result.message || "Failed to update progress",
              500,
              "update_error",
              requestId,
            );
          }

          return createSuccessResponse(result, requestId);
        } catch (error) {
          console.error("[DailyTraining] POST error:", error);
          return createErrorResponse(
            "Failed to update training progress",
            500,
            "database_error",
            requestId,
          );
        }
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
        requestId,
      );
    },
  });
};
