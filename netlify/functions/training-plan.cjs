// Netlify Function: Training Plan Generator
// Generates evidence-based training plans using real data up to and including today
// Respects periodization phases, ACWR, and domestic vs international schedules

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

/**
 * Get today's date at end of day (23:59:59) for inclusive filtering
 */
function _getTodayEndOfDay() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
}

/**
 * Get today's date at start of day (00:00:00)
 */
function _getTodayStartOfDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * Calculate ACWR for a player
 */
async function calculateACWR(userId, date) {
  try {
    const _endDate = new Date(date);
    const acuteStartDate = new Date(date);
    acuteStartDate.setDate(acuteStartDate.getDate() - 7);
    const chronicStartDate = new Date(date);
    chronicStartDate.setDate(chronicStartDate.getDate() - 28);

    // Get training loads up to and including date
    const todayEndOfDay = new Date(date);
    todayEndOfDay.setHours(23, 59, 59, 999);

    // Get acute loads (last 7 days)
    const { data: acuteSessions, error: acuteError } = await supabaseAdmin
      .from("training_sessions")
      .select("duration_minutes, intensity_level, rpe")
      .eq("user_id", userId)
      .gte("session_date", acuteStartDate.toISOString().split("T")[0])
      .lte("session_date", todayEndOfDay.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (acuteError && acuteError.code !== "42P01") {
      throw acuteError;
    }

    // Get chronic loads (last 28 days)
    const { data: chronicSessions, error: chronicError } = await supabaseAdmin
      .from("training_sessions")
      .select("duration_minutes, intensity_level, rpe")
      .eq("user_id", userId)
      .gte("session_date", chronicStartDate.toISOString().split("T")[0])
      .lte("session_date", todayEndOfDay.toISOString().split("T")[0])
      .in("status", ["completed", "in_progress"]);

    if (chronicError && chronicError.code !== "42P01") {
      throw chronicError;
    }

    // Calculate loads (duration × intensity × RPE)
    const calculateLoad = (session) => {
      const duration = session.duration_minutes || 60;
      const intensity = session.intensity_level || 5;
      const rpe = session.rpe || 5;
      return duration * intensity * rpe;
    };

    const acuteLoads = (acuteSessions || []).map(calculateLoad);
    const chronicLoads = (chronicSessions || []).map(calculateLoad);

    const acuteAverage =
      acuteLoads.length > 0
        ? acuteLoads.reduce((sum, load) => sum + load, 0) / acuteLoads.length
        : 0;
    const chronicAverage =
      chronicLoads.length > 0
        ? chronicLoads.reduce((sum, load) => sum + load, 0) /
          chronicLoads.length
        : 0;

    if (chronicAverage === 0) {
      return {
        acwr: 0,
        riskZone: "insufficient_data",
        acuteAverage: 0,
        chronicAverage: 0,
        recommendation: "Build chronic load gradually",
      };
    }

    const acwr = acuteAverage / chronicAverage;

    let riskZone;
    if (acwr < 0.8) {
      riskZone = "detraining";
    } else if (acwr >= 0.8 && acwr <= 1.3) {
      riskZone = "safe";
    } else if (acwr > 1.3 && acwr <= 1.5) {
      riskZone = "caution";
    } else if (acwr > 1.5 && acwr < 1.8) {
      riskZone = "danger";
    } else {
      riskZone = "critical";
    }

    return {
      acwr: parseFloat(acwr.toFixed(2)),
      riskZone,
      acuteAverage: parseFloat(acuteAverage.toFixed(2)),
      chronicAverage: parseFloat(chronicAverage.toFixed(2)),
      acuteLoads: acuteLoads.length,
      chronicLoads: chronicLoads.length,
    };
  } catch (error) {
    console.error("Error calculating ACWR:", error);
    return {
      acwr: 0,
      riskZone: "insufficient_data",
      acuteAverage: 0,
      chronicAverage: 0,
    };
  }
}

/**
 * Determine periodization phase based on date and stored program
 */
async function determinePeriodizationPhase(userId, date) {
  try {
    // Get active training program for user
    const { data: programs, error: programError } = await supabaseAdmin
      .from("training_programs")
      .select(
        `
        id,
        start_date,
        end_date,
        training_phases (
          id,
          name,
          start_date,
          end_date,
          phase_order,
          focus_areas
        )
      `,
      )
      .eq("is_active", true)
      .lte("start_date", date.toISOString().split("T")[0])
      .gte("end_date", date.toISOString().split("T")[0])
      .limit(1);

    if (programError && programError.code !== "42P01") {
      throw programError;
    }

    if (programs && programs.length > 0 && programs[0].training_phases) {
      const phases = programs[0].training_phases;
      const currentPhase = phases.find((phase) => {
        const phaseStart = new Date(phase.start_date);
        const phaseEnd = new Date(phase.end_date);
        return date >= phaseStart && date <= phaseEnd;
      });

      if (currentPhase) {
        return {
          phase: currentPhase.name.toLowerCase().replace(/\s+/g, "_"),
          phaseOrder: currentPhase.phase_order,
          focusAreas: currentPhase.focus_areas || [],
          isInProgram: true,
        };
      }
    }

    // Fallback: determine phase by date (seasonal)
    const month = date.getMonth() + 1;
    let phase;
    if (month === 12 || month === 1) {
      phase = "off_season";
    } else if (month === 2 || month === 3) {
      phase = "pre_season";
    } else if (month >= 4 && month <= 6) {
      phase = "in_season";
    } else if (month >= 7 && month <= 9) {
      phase = "mid_season";
    } else {
      phase = "deload";
    }

    return {
      phase,
      phaseOrder: 0,
      focusAreas: [],
      isInProgram: false,
    };
  } catch (error) {
    console.error("Error determining phase:", error);
    return {
      phase: "off_season",
      phaseOrder: 0,
      focusAreas: [],
      isInProgram: false,
    };
  }
}

/**
 * Get upcoming games/tournaments (domestic and international separately)
 */
async function getUpcomingGames(userId, date, daysAhead = 14) {
  try {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + daysAhead);
    endDate.setHours(23, 59, 59, 999);

    // Get user's team
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (teamError) {
      throw teamError;
    }

    const teamId =
      teamMemberships && teamMemberships.length > 0
        ? teamMemberships[0].team_id
        : null;

    if (!teamId) {
      return { domestic: [], international: [] };
    }

    // Get games (domestic and international)
    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select(
        "game_id, game_date, opponent_team_name, tournament_name, game_type",
      )
      .eq("team_id", teamId)
      .gte("game_date", date.toISOString().split("T")[0])
      .lte("game_date", endDate.toISOString().split("T")[0])
      .order("game_date", { ascending: true });

    if (gamesError && gamesError.code !== "42P01") {
      throw gamesError;
    }

    // Separate domestic and international
    const domestic = [];
    const international = [];

    (games || []).forEach((game) => {
      const gameDate = new Date(game.game_date);
      const gameObj = {
        gameId: game.game_id,
        date: gameDate,
        opponent: game.opponent_team_name,
        tournament: game.tournament_name,
        type: game.game_type,
      };

      // Determine if international (heuristic: tournament_name often indicates international)
      if (
        game.tournament_name &&
        (game.tournament_name.toLowerCase().includes("international") ||
          game.tournament_name.toLowerCase().includes("world") ||
          game.tournament_name.toLowerCase().includes("championship"))
      ) {
        international.push(gameObj);
      } else {
        domestic.push(gameObj);
      }
    });

    return { domestic, international };
  } catch (error) {
    console.error("Error getting upcoming games:", error);
    return { domestic: [], international: [] };
  }
}

/**
 * Get today's training sessions (real data only)
 * Only returns sessions for dates up to and including today
 */
async function getTodaySessions(userId, date) {
  try {
    const dateStr = date.toISOString().split("T")[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Only return sessions if the date is today or in the past
    if (dateStr > todayStr) {
      return []; // Future sessions not included
    }

    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("session_date", dateStr)
      .order("session_time", { ascending: true });

    if (error && error.code !== "42P01") {
      throw error;
    }

    return sessions || [];
  } catch (error) {
    console.error("Error getting today's sessions:", error);
    return [];
  }
}

/**
 * Get training history (up to and including today)
 * Uses consistent date filtering: only sessions up to and including today
 */
async function getTrainingHistory(userId, daysBack = 30) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Filter to sessions up to and including today (consistent with training-sessions endpoint)
    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("session_date", startDateStr)
      .lte("session_date", todayStr) // Only up to and including today
      .in("status", ["completed", "in_progress"])
      .order("session_date", { ascending: false })
      .order("session_time", { ascending: true });

    if (error && error.code !== "42P01") {
      throw error;
    }

    return sessions || [];
  } catch (error) {
    console.error("Error getting training history:", error);
    return [];
  }
}

/**
 * Generate training plan for today
 */
async function generateTrainingPlan(userId, date = new Date()) {
  try {
    // Normalize date to start of day
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    // Get all required data
    const [acwr, phase, upcomingGames, todaySessions, history] =
      await Promise.all([
        calculateACWR(userId, today),
        determinePeriodizationPhase(userId, today),
        getUpcomingGames(userId, today, 14),
        getTodaySessions(userId, today),
        getTrainingHistory(userId, 30),
      ]);

    // Determine if there's a game today
    const gameToday =
      upcomingGames.domestic.find(
        (g) =>
          g.date.toISOString().split("T")[0] ===
          today.toISOString().split("T")[0],
      ) ||
      upcomingGames.international.find(
        (g) =>
          g.date.toISOString().split("T")[0] ===
          today.toISOString().split("T")[0],
      );

    // Determine next game
    const nextDomesticGame = upcomingGames.domestic[0];
    const nextInternationalGame = upcomingGames.international[0];
    const daysToNextDomestic = nextDomesticGame
      ? Math.ceil((nextDomesticGame.date - today) / (1000 * 60 * 60 * 24))
      : null;
    const daysToNextInternational = nextInternationalGame
      ? Math.ceil((nextInternationalGame.date - today) / (1000 * 60 * 60 * 24))
      : null;

    // Generate sessions based on constraints
    const plan = generateSessionsForDay({
      today,
      acwr,
      phase,
      gameToday,
      daysToNextDomestic,
      daysToNextInternational,
      todaySessions,
      history,
    });

    // Generate tomorrow guidance
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowGuidance = generateTomorrowGuidance({
      tomorrow,
      acwr,
      phase,
      upcomingGames,
      history,
    });

    return {
      date: today.toISOString().split("T")[0],
      sessions: plan.sessions,
      explanation: plan.explanation,
      tomorrowGuidance,
      context: {
        acwr: acwr.acwr,
        riskZone: acwr.riskZone,
        phase: phase.phase,
        phaseFocus: phase.focusAreas,
        nextDomesticGame: nextDomesticGame
          ? {
              date: nextDomesticGame.date.toISOString().split("T")[0],
              opponent: nextDomesticGame.opponent,
              daysAway: daysToNextDomestic,
            }
          : null,
        nextInternationalGame: nextInternationalGame
          ? {
              date: nextInternationalGame.date.toISOString().split("T")[0],
              tournament: nextInternationalGame.tournament,
              daysAway: daysToNextInternational,
            }
          : null,
        gameToday: !!gameToday,
      },
    };
  } catch (error) {
    console.error("Error generating training plan:", error);
    throw error;
  }
}

/**
 * Generate sessions for a specific day based on constraints
 */
function generateSessionsForDay({
  today: _today,
  acwr,
  phase,
  gameToday,
  daysToNextDomestic,
  daysToNextInternational,
  todaySessions: _todaySessions,
  history: _history,
}) {
  const sessions = [];
  let explanation = "";

  // If game today, only recovery/mobility
  if (gameToday) {
    sessions.push({
      timeOfDay: "morning",
      type: "mobility",
      title: "Pre-Game Mobility",
      duration: 10,
      content: [
        {
          exercise: "10-minute mobility routine",
          type: "video",
          link: "https://www.youtube.com/watch?v=pre-game-mobility",
          description: "Dynamic warm-up and mobility work",
        },
      ],
      intensity: "low",
      rpe: 2,
    });

    explanation =
      "Game day - light mobility only. Focus on activation and preparation.";
    return { sessions, explanation };
  }

  // Determine priority: domestic vs international
  const priorityGame =
    daysToNextDomestic && daysToNextInternational
      ? daysToNextDomestic < daysToNextInternational
        ? "domestic"
        : "international"
      : daysToNextDomestic
        ? "domestic"
        : daysToNextInternational
          ? "international"
          : null;

  const daysToNextGame = Math.min(
    daysToNextDomestic || 999,
    daysToNextInternational || 999,
  );

  // ACWR-based load adjustment
  let loadMultiplier = 1.0;
  if (acwr.riskZone === "critical" || acwr.riskZone === "danger") {
    loadMultiplier = 0.5; // Reduce load significantly
  } else if (acwr.riskZone === "caution") {
    loadMultiplier = 0.75; // Moderate reduction
  } else if (acwr.riskZone === "detraining") {
    loadMultiplier = 1.2; // Can increase slightly
  }

  // Phase-based adjustments
  let phaseMultiplier = 1.0;
  if (phase.phase === "deload") {
    phaseMultiplier = 0.6;
  } else if (phase.phase === "off_season") {
    phaseMultiplier = 0.8;
  } else if (phase.phase === "pre_season") {
    phaseMultiplier = 1.1;
  } else if (phase.phase === "in_season" || phase.phase === "mid_season") {
    phaseMultiplier = 1.0;
  }

  // Game proximity adjustments
  let gameProximityMultiplier = 1.0;
  if (daysToNextGame <= 1) {
    gameProximityMultiplier = 0.3; // Very light before game
  } else if (daysToNextGame === 2) {
    gameProximityMultiplier = 0.6; // Light taper
  } else if (daysToNextGame === 3) {
    gameProximityMultiplier = 0.8; // Moderate taper
  }

  const finalMultiplier =
    loadMultiplier * phaseMultiplier * gameProximityMultiplier;

  // Morning session: Mobility/Recovery
  sessions.push({
    timeOfDay: "morning",
    type: "mobility",
    title: "Morning Mobility & Foam Rolling",
    duration: 10,
    content: [
      {
        exercise: "10-minute mobility routine",
        type: "video",
        link: "https://www.youtube.com/watch?v=mobility-routine",
        description: "Full body mobility and activation",
      },
      {
        exercise: "Foam rolling",
        type: "video",
        link: "https://www.youtube.com/watch?v=foam-rolling",
        description: "Target: quads, hamstrings, glutes, thoracic spine",
      },
    ],
    intensity: "low",
    rpe: 2,
  });

  // Afternoon session: Main training
  if (finalMultiplier >= 0.5) {
    const sessionType =
      phase.phase === "off_season" || phase.phase === "pre_season"
        ? "gym"
        : daysToNextGame <= 2
          ? "field"
          : "gym";

    sessions.push({
      timeOfDay: "afternoon",
      type: sessionType,
      title:
        sessionType === "gym"
          ? "Strength & Conditioning"
          : "Field Work & Skill Development",
      duration: Math.round(60 * finalMultiplier),
      content: generateSessionContent(sessionType, phase, finalMultiplier),
      intensity:
        finalMultiplier >= 0.8
          ? "high"
          : finalMultiplier >= 0.6
            ? "medium"
            : "low",
      rpe: Math.round(5 + finalMultiplier * 3),
    });
  }

  // Build explanation
  explanation = buildExplanation({
    acwr,
    phase,
    daysToNextGame,
    priorityGame,
    finalMultiplier,
  });

  return { sessions, explanation };
}

/**
 * Generate session content based on type and phase
 */
function generateSessionContent(type, phase, multiplier) {
  const content = [];

  if (type === "gym") {
    content.push({
      exercise: "Warm-up",
      type: "video",
      link: "https://www.youtube.com/watch?v=gym-warmup",
      description: "Dynamic warm-up: 5-10 minutes",
    });

    if (phase.phase === "off_season" || phase.phase === "pre_season") {
      content.push({
        exercise: "Squat",
        type: "exercise",
        sets: Math.round(4 * multiplier),
        reps: "6-8",
        load: "Progressive",
        description: "Back squat or front squat",
      });
      content.push({
        exercise: "Deadlift",
        type: "exercise",
        sets: Math.round(3 * multiplier),
        reps: "5-6",
        load: "Progressive",
        description: "Conventional or Romanian",
      });
    } else {
      content.push({
        exercise: "Power movements",
        type: "exercise",
        sets: Math.round(3 * multiplier),
        reps: "3-5",
        load: "Explosive",
        description: "Cleans, snatches, or jumps",
      });
    }

    content.push({
      exercise: "Accessory work",
      type: "exercise",
      sets: Math.round(3 * multiplier),
      reps: "8-12",
      load: "Moderate",
      description: "Position-specific accessories",
    });
  } else {
    // Field work
    content.push({
      exercise: "Dynamic warm-up",
      type: "video",
      link: "https://www.youtube.com/watch?v=field-warmup",
      description: "Movement prep: 10 minutes",
    });
    content.push({
      exercise: "Skill work",
      type: "exercise",
      duration: Math.round(20 * multiplier),
      description: "Position-specific drills",
    });
    content.push({
      exercise: "Conditioning",
      type: "exercise",
      duration: Math.round(15 * multiplier),
      description: "Game-specific conditioning",
    });
  }

  content.push({
    exercise: "Cool-down & Stretching",
    type: "video",
    link: "https://www.youtube.com/watch?v=cooldown",
    description: "10-minute cool-down",
  });

  return content;
}

/**
 * Build explanation for training plan
 */
function buildExplanation({
  acwr,
  phase,
  daysToNextGame,
  priorityGame,
  finalMultiplier,
}) {
  const parts = [];

  // ACWR explanation
  if (acwr.riskZone === "critical" || acwr.riskZone === "danger") {
    parts.push(
      `ACWR is ${acwr.acwr} (${acwr.riskZone} zone) - load reduced significantly to prevent injury risk.`,
    );
  } else if (acwr.riskZone === "caution") {
    parts.push(
      `ACWR is ${acwr.acwr} (${acwr.riskZone} zone) - moderate load reduction applied.`,
    );
  } else if (acwr.riskZone === "safe") {
    parts.push(
      `ACWR is ${acwr.acwr} (${acwr.riskZone} zone) - optimal training load.`,
    );
  }

  // Phase explanation
  parts.push(
    `Current phase: ${phase.phase.replace(/_/g, " ")} - ${getPhaseFocus(phase.phase)}.`,
  );

  // Game proximity explanation
  if (daysToNextGame <= 3) {
    const gameType =
      priorityGame === "domestic"
        ? "domestic game"
        : "international tournament";
    parts.push(
      `${daysToNextGame} day${daysToNextGame > 1 ? "s" : ""} until next ${gameType} - taper applied.`,
    );
  }

  // Load explanation
  if (finalMultiplier < 0.7) {
    parts.push("Reduced volume/intensity due to cumulative factors.");
  } else if (finalMultiplier > 1.0) {
    parts.push("Increased load appropriate for current phase and ACWR.");
  }

  return parts.join(" ");
}

/**
 * Get phase focus description
 */
function getPhaseFocus(phase) {
  const focuses = {
    off_season: "building base strength and conditioning",
    pre_season: "increasing intensity and sport-specific work",
    in_season: "maintaining fitness while prioritizing recovery",
    mid_season: "peak performance with careful load management",
    deload: "active recovery and regeneration",
  };
  return focuses[phase] || "general training";
}

/**
 * Generate guidance for tomorrow
 */
function generateTomorrowGuidance({
  tomorrow,
  acwr,
  phase: _phase,
  upcomingGames,
  history: _history,
}) {
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  // Check if game tomorrow
  const gameTomorrow =
    upcomingGames.domestic.find(
      (g) => g.date.toISOString().split("T")[0] === tomorrowDate,
    ) ||
    upcomingGames.international.find(
      (g) => g.date.toISOString().split("T")[0] === tomorrowDate,
    );

  if (gameTomorrow) {
    return {
      recommendation: "rest",
      guidance:
        "Game day tomorrow - complete rest today. Focus on nutrition, hydration, and mental preparation.",
      sessions: [],
    };
  }

  // Check days to next game
  const nextDomestic = upcomingGames.domestic[0];
  const nextInternational = upcomingGames.international[0];
  const daysToNext = Math.min(
    nextDomestic
      ? Math.ceil((nextDomestic.date - tomorrow) / (1000 * 60 * 60 * 24))
      : 999,
    nextInternational
      ? Math.ceil((nextInternational.date - tomorrow) / (1000 * 60 * 60 * 24))
      : 999,
  );

  if (daysToNext === 1) {
    return {
      recommendation: "active_recovery",
      guidance:
        "Game day in 1 day - light active recovery only. Mobility, light movement, no intense training.",
      sessions: [
        {
          timeOfDay: "morning",
          type: "mobility",
          title: "Active Recovery",
          duration: 20,
        },
      ],
    };
  }

  if (daysToNext === 2) {
    return {
      recommendation: "light_session",
      guidance:
        "Game day in 2 days - light training session. Focus on skill work and low-intensity conditioning.",
      sessions: [
        {
          timeOfDay: "afternoon",
          type: "field",
          title: "Light Skill Work",
          duration: 30,
        },
      ],
    };
  }

  // Normal training day
  if (acwr.riskZone === "critical" || acwr.riskZone === "danger") {
    return {
      recommendation: "rest",
      guidance:
        "High ACWR - recommend rest day to allow recovery and reduce injury risk.",
      sessions: [],
    };
  }

  return {
    recommendation: "normal_training",
    guidance:
      "Normal training day - proceed with planned session based on periodization phase.",
    sessions: [],
  };
}

// Main handler
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-plan",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      const queryParams = event.queryStringParameters || {};

      // Parse date (defaults to today)
      let targetDate = new Date();
      if (queryParams.date) {
        targetDate = new Date(queryParams.date);
        if (isNaN(targetDate.getTime())) {
          return createErrorResponse(
            "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
            400,
            "validation_error",
            requestId
          );
        }
      }

      // Generate training plan
      const plan = await generateTrainingPlan(userId, targetDate);

      return createSuccessResponse(plan, requestId);
    },
  });
};
