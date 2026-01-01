// Netlify Function: Training Suggestions
// Provides AI-powered training suggestions based on user history and performance

const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Analyze user's training history to identify gaps and opportunities
 */
async function analyzeTrainingHistory(userId) {
  try {
    // Get recent training sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select(
        "session_type, duration_minutes, intensity_level, score, session_date, completed_at",
      )
      .eq("user_id", userId)
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("session_date", { ascending: false });

    if (error) {
      console.error("Error fetching training sessions:", error);
      return { sessions: [], error };
    }

    // Analyze session types
    const sessionTypes = {};
    const totalDuration = {
      speed: 0,
      strength: 0,
      conditioning: 0,
      skill: 0,
      recovery: 0,
    };
    const avgScores = {
      speed: [],
      strength: [],
      conditioning: [],
      skill: [],
      recovery: [],
    };

    (sessions || []).forEach((session) => {
      const type = session.session_type || "general";
      if (!sessionTypes[type]) {
        sessionTypes[type] = 0;
      }
      sessionTypes[type]++;

      // Categorize by type
      const category = categorizeSessionType(type);
      if (session.duration_minutes) {
        totalDuration[category] += session.duration_minutes;
      }
      if (session.score) {
        avgScores[category].push(session.score);
      }
    });

    // Calculate averages
    const avgScoreByCategory = {};
    Object.keys(avgScores).forEach((cat) => {
      if (avgScores[cat].length > 0) {
        avgScoreByCategory[cat] =
          avgScores[cat].reduce((a, b) => a + b, 0) / avgScores[cat].length;
      }
    });

    return {
      sessions: sessions || [],
      sessionTypes,
      totalDuration,
      avgScoreByCategory,
      totalSessions: (sessions || []).length,
    };
  } catch (error) {
    console.error("Error analyzing training history:", error);
    return { sessions: [], error: error.message };
  }
}

/**
 * Categorize session type into main categories
 */
function categorizeSessionType(sessionType) {
  const type = (sessionType || "").toLowerCase();
  if (
    type.includes("speed") ||
    type.includes("sprint") ||
    type.includes("agility")
  ) {
    return "speed";
  }
  if (
    type.includes("strength") ||
    type.includes("power") ||
    type.includes("weight")
  ) {
    return "strength";
  }
  if (
    type.includes("conditioning") ||
    type.includes("cardio") ||
    type.includes("endurance")
  ) {
    return "conditioning";
  }
  if (
    type.includes("skill") ||
    type.includes("technique") ||
    type.includes("drill")
  ) {
    return "skill";
  }
  if (
    type.includes("recovery") ||
    type.includes("rest") ||
    type.includes("stretch")
  ) {
    return "recovery";
  }
  return "general";
}

/**
 * Generate training suggestions based on analysis
 */
function generateSuggestions(analysis, params = {}) {
  const suggestions = [];
  const { totalDuration, totalSessions } = analysis;

  // Check for missing training types
  const hasSpeedTraining = totalDuration.speed > 0;
  const hasStrengthTraining = totalDuration.strength > 0;
  const hasRecovery = totalDuration.recovery > 0;

  // Suggestion 1: Speed training gap
  if (!hasSpeedTraining && totalSessions > 0) {
    suggestions.push({
      id: `speed-${Date.now()}`,
      title: "Speed & Agility Focus",
      description: "Add speed training to improve acceleration and agility",
      formData: {
        sessionType: "speed",
        duration: 45,
        equipment: ["cones", "ladder", "agility_poles"],
        intensity: "high",
        focus: ["acceleration", "agility", "change_of_direction"],
      },
      reason:
        "You haven't done speed training recently. Speed work improves game performance.",
      priority: "high",
    });
  }

  // Suggestion 2: Strength training gap
  if (!hasStrengthTraining && totalSessions > 0) {
    suggestions.push({
      id: `strength-${Date.now()}`,
      title: "Strength & Power",
      description: "Add strength training to build power and prevent injuries",
      formData: {
        sessionType: "strength",
        duration: 60,
        equipment: ["weights", "resistance_bands", "bodyweight"],
        intensity: "medium",
        focus: ["power", "core", "lower_body"],
      },
      reason:
        "Strength training complements your speed work and reduces injury risk.",
      priority: "high",
    });
  }

  // Suggestion 3: Recovery if training frequently
  if (totalSessions >= 4 && !hasRecovery) {
    suggestions.push({
      id: `recovery-${Date.now()}`,
      title: "Recovery Session",
      description: "Add a recovery session to optimize performance",
      formData: {
        sessionType: "recovery",
        duration: 30,
        equipment: ["foam_roller", "stretch_bands"],
        intensity: "low",
        focus: ["mobility", "flexibility", "recovery"],
      },
      reason:
        "You've been training frequently. Recovery sessions improve adaptation.",
      priority: "medium",
    });
  }

  // Suggestion 4: Skill work if low
  if (totalDuration.skill < totalDuration.speed && totalSessions > 2) {
    suggestions.push({
      id: `skill-${Date.now()}`,
      title: "Skill Development",
      description: "Focus on technique and skill refinement",
      formData: {
        sessionType: "skill",
        duration: 60,
        equipment: ["football", "cones"],
        intensity: "medium",
        focus: ["technique", "accuracy", "coordination"],
      },
      reason: "Skill training improves game performance and technique.",
      priority: "medium",
    });
  }

  // Suggestion 5: Conditioning if low volume
  if (totalDuration.conditioning < 120 && totalSessions > 0) {
    suggestions.push({
      id: `conditioning-${Date.now()}`,
      title: "Conditioning Work",
      description: "Build endurance and cardiovascular fitness",
      formData: {
        sessionType: "conditioning",
        duration: 45,
        equipment: [],
        intensity: "medium",
        focus: ["endurance", "cardiovascular", "work_capacity"],
      },
      reason:
        "Conditioning improves your ability to maintain performance throughout games.",
      priority: "low",
    });
  }

  // Check for upcoming games (from params)
  if (params.upcomingGames && params.upcomingGames.length > 0) {
    const daysUntilGame = params.upcomingGames[0].daysUntil || 0;

    if (daysUntilGame <= 3 && daysUntilGame > 0) {
      suggestions.push({
        id: `taper-${Date.now()}`,
        title: "Pre-Game Taper",
        description: "Reduce intensity before your upcoming game",
        formData: {
          sessionType: "recovery",
          duration: 30,
          equipment: [],
          intensity: "low",
          focus: ["mobility", "activation", "mental_preparation"],
        },
        reason: `Game in ${daysUntilGame} days. Tapering optimizes performance.`,
        priority: "high",
      });
    }
  }

  // If no sessions at all, suggest a balanced starter
  if (totalSessions === 0) {
    suggestions.push({
      id: `starter-${Date.now()}`,
      title: "Balanced Training Plan",
      description: "Start with a well-rounded training session",
      formData: {
        sessionType: "conditioning",
        duration: 45,
        equipment: ["football"],
        intensity: "medium",
        focus: ["endurance", "skill", "general_fitness"],
      },
      reason: "Begin with a balanced session to establish your baseline.",
      priority: "high",
    });
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId }) {
  try {
    let params = {};

    // Parse request body if POST
    if (event.httpMethod === "POST" && event.body) {
      try {
        params = JSON.parse(event.body);
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
    }

    // Use userId from auth if not provided
    if (!params.userId) {
      params.userId = userId;
    }

    // Analyze user's training history
    const analysis = await analyzeTrainingHistory(userId);

    // Generate suggestions
    const suggestions = generateSuggestions(analysis, params);

    return createSuccessResponse({
      suggestions,
      analysis: {
        totalSessions: analysis.totalSessions,
        sessionTypes: analysis.sessionTypes,
        recommendations: suggestions.length,
      },
    });
  } catch (error) {
    console.error("Error in training-suggestions handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Training-Suggestions",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });
};
