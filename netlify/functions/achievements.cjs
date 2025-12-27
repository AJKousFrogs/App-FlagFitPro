/**
 * Netlify Function: Achievements
 * 
 * Manages user achievements with database persistence
 * - GET: Fetch user achievements from database
 * - POST: Sync/unlock achievements
 * - PUT: Bulk sync achievements from localStorage
 */

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

// Achievement definitions (must match frontend)
const ACHIEVEMENT_DEFINITIONS = {
  // Wellness Achievements
  "wellness-first": {
    name: "First Steps",
    description: "Log your first wellness check-in",
    icon: "🎯",
    category: "wellness",
    points: 10,
  },
  "wellness-streak-3": {
    name: "Getting Started",
    description: "3-day wellness tracking streak",
    icon: "🔥",
    category: "wellness",
    points: 25,
  },
  "wellness-streak-7": {
    name: "Wellness Warrior",
    description: "7-day wellness tracking streak",
    icon: "🔥🔥",
    category: "wellness",
    points: 50,
  },
  "wellness-streak-30": {
    name: "Dedicated Athlete",
    description: "30-day wellness tracking streak",
    icon: "🔥🔥🔥",
    category: "wellness",
    points: 150,
  },
  "wellness-streak-100": {
    name: "Elite Commitment",
    description: "100-day wellness tracking streak",
    icon: "💎",
    category: "wellness",
    points: 500,
  },
  "sleep-master": {
    name: "Sleep Master",
    description: "Maintain 8+ hours of sleep for 7 days",
    icon: "😴",
    category: "wellness",
    points: 75,
  },
  "recovery-champ": {
    name: "Recovery Champion",
    description: "Maintain high recovery scores for 14 days",
    icon: "💪",
    category: "wellness",
    points: 100,
  },
  // Training Achievements
  "training-first": {
    name: "Training Begins",
    description: "Complete your first training session",
    icon: "🏃",
    category: "training",
    points: 10,
  },
  "training-10": {
    name: "Getting Stronger",
    description: "Complete 10 training sessions",
    icon: "💪",
    category: "training",
    points: 50,
  },
  "training-50": {
    name: "Half Century",
    description: "Complete 50 training sessions",
    icon: "🎖️",
    category: "training",
    points: 150,
  },
  "training-100": {
    name: "Century Club",
    description: "Complete 100 training sessions",
    icon: "💯",
    category: "training",
    points: 300,
  },
  "early-bird": {
    name: "Early Bird",
    description: "Complete 10 morning workouts (before 8 AM)",
    icon: "🌅",
    category: "training",
    points: 75,
  },
  "night-owl": {
    name: "Night Owl",
    description: "Complete 10 evening workouts (after 6 PM)",
    icon: "🦉",
    category: "training",
    points: 75,
  },
  // Performance Achievements
  "speed-demon": {
    name: "Speed Demon",
    description: "Improve your 40-yard dash time by 0.5 seconds",
    icon: "⚡",
    category: "performance",
    points: 100,
  },
  "agility-master": {
    name: "Agility Master",
    description: "Improve cone drill time by 1 second",
    icon: "🌀",
    category: "performance",
    points: 100,
  },
  "consistent-performer": {
    name: "Consistent Performer",
    description: "Maintain 80%+ performance score for 30 days",
    icon: "📊",
    category: "performance",
    points: 200,
  },
  // Social Achievements
  "team-player": {
    name: "Team Player",
    description: "Join a team",
    icon: "👥",
    category: "social",
    points: 25,
  },
  "mentor": {
    name: "Mentor",
    description: "Help 5 teammates with their training",
    icon: "🎓",
    category: "social",
    points: 150,
  },
  // Special Achievements
  "perfect-week": {
    name: "Perfect Week",
    description: "Log wellness 7 days straight with 8+ sleep each day",
    icon: "⭐",
    category: "special",
    points: 200,
  },
  "comeback-kid": {
    name: "Comeback Kid",
    description: "Return to training after 7+ day break",
    icon: "🔄",
    category: "special",
    points: 50,
  },
};

/**
 * Get user achievements from database
 */
async function getUserAchievements(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("[Achievements] Error fetching achievements:", error);
    throw error;
  }

  return data || [];
}

/**
 * Unlock a single achievement
 */
async function unlockAchievement(userId, achievementId, unlockedAt = null) {
  const definition = ACHIEVEMENT_DEFINITIONS[achievementId];
  
  if (!definition) {
    throw new Error(`Unknown achievement: ${achievementId}`);
  }

  // Check if already unlocked
  const { data: existing } = await supabaseAdmin
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .single();

  if (existing) {
    return { alreadyUnlocked: true, achievement: existing };
  }

  // Insert new achievement
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .insert({
      user_id: userId,
      achievement_id: achievementId,
      achievement_name: definition.name,
      achievement_description: definition.description,
      achievement_icon: definition.icon,
      category: definition.category,
      points: definition.points,
      unlocked_at: unlockedAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (race condition)
    if (error.code === "23505") {
      return { alreadyUnlocked: true };
    }
    throw error;
  }

  // Log to achievement history
  await supabaseAdmin.from("achievement_history").insert({
    user_id: userId,
    achievement_id: achievementId,
    event_type: "unlocked",
    metadata: {
      points: definition.points,
      category: definition.category,
    },
  });

  // Update sponsor rewards points if table exists
  try {
    await updateRewardPoints(userId, definition.points);
  } catch (err) {
    console.warn("[Achievements] Could not update reward points:", err.message);
  }

  // Create notification for the achievement
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      notification_type: "achievement",
      message: `🏆 Achievement Unlocked: ${definition.name}! You earned ${definition.points} points.`,
      priority: "medium",
    });
  } catch (err) {
    console.warn("[Achievements] Could not create notification:", err.message);
  }

  return { alreadyUnlocked: false, achievement: data };
}

/**
 * Bulk sync achievements from localStorage
 */
async function syncAchievements(userId, achievementIds, history = []) {
  const results = {
    synced: [],
    alreadyUnlocked: [],
    errors: [],
  };

  for (const achievementId of achievementIds) {
    try {
      // Find unlock time from history if available
      const historyEntry = history.find((h) => h.id === achievementId);
      const unlockedAt = historyEntry?.unlockedAt || null;

      const result = await unlockAchievement(userId, achievementId, unlockedAt);
      
      if (result.alreadyUnlocked) {
        results.alreadyUnlocked.push(achievementId);
      } else {
        results.synced.push(achievementId);
      }
    } catch (error) {
      console.error(`[Achievements] Error syncing ${achievementId}:`, error);
      results.errors.push({ id: achievementId, error: error.message });
    }
  }

  return results;
}

/**
 * Update sponsor reward points
 */
async function updateRewardPoints(userId, pointsToAdd) {
  // Check if user has sponsor_rewards record
  const { data: existing } = await supabaseAdmin
    .from("sponsor_rewards")
    .select("id, available_points")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing record
    await supabaseAdmin
      .from("sponsor_rewards")
      .update({
        available_points: existing.available_points + pointsToAdd,
      })
      .eq("id", existing.id);
  } else {
    // Create new record
    await supabaseAdmin.from("sponsor_rewards").insert({
      user_id: userId,
      available_points: pointsToAdd,
      current_tier: "BRONZE",
      tier_progress_percentage: 0,
    });
  }
}

/**
 * Get total points for user
 */
async function getTotalPoints(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select("points")
    .eq("user_id", userId);

  if (error) {
    console.error("[Achievements] Error fetching points:", error);
    return 0;
  }

  return (data || []).reduce((sum, a) => sum + (a.points || 0), 0);
}

/**
 * Get achievement history
 */
async function getAchievementHistory(userId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("achievement_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Achievements] Error fetching history:", error);
    return [];
  }

  return data || [];
}

// =====================================================
// MAIN HANDLER
// =====================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "achievements",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      // GET: Fetch user achievements
      if (event.httpMethod === "GET") {
        try {
          const achievements = await getUserAchievements(userId);
          const totalPoints = await getTotalPoints(userId);
          const history = await getAchievementHistory(userId, 20);

          // Build response with all achievements (unlocked status)
          const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(
            ([id, def]) => {
              const unlocked = achievements.find((a) => a.achievement_id === id);
              return {
                id,
                ...def,
                unlocked: !!unlocked,
                unlockedAt: unlocked?.unlocked_at || null,
              };
            }
          );

          return createSuccessResponse(
            {
              achievements: allAchievements,
              unlockedCount: achievements.length,
              totalCount: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
              totalPoints,
              progress: Math.round(
                (achievements.length / Object.keys(ACHIEVEMENT_DEFINITIONS).length) * 100
              ),
              history,
            },
            requestId
          );
        } catch (error) {
          console.error("[Achievements] GET error:", error);
          return createErrorResponse(
            "Failed to fetch achievements",
            500,
            "database_error",
            requestId
          );
        }
      }

      // POST: Unlock a single achievement
      if (event.httpMethod === "POST") {
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

        const { achievementId, unlockedAt } = body;

        if (!achievementId) {
          return createErrorResponse(
            "achievementId is required",
            400,
            "validation_error",
            requestId
          );
        }

        try {
          const result = await unlockAchievement(userId, achievementId, unlockedAt);
          
          return createSuccessResponse(
            {
              success: true,
              alreadyUnlocked: result.alreadyUnlocked,
              achievement: result.achievement,
              message: result.alreadyUnlocked
                ? "Achievement was already unlocked"
                : "Achievement unlocked successfully!",
            },
            requestId
          );
        } catch (error) {
          console.error("[Achievements] POST error:", error);
          return createErrorResponse(
            error.message || "Failed to unlock achievement",
            500,
            "database_error",
            requestId
          );
        }
      }

      // PUT: Bulk sync achievements from localStorage
      if (event.httpMethod === "PUT") {
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

        const { achievementIds, history } = body;

        if (!Array.isArray(achievementIds)) {
          return createErrorResponse(
            "achievementIds must be an array",
            400,
            "validation_error",
            requestId
          );
        }

        try {
          const results = await syncAchievements(userId, achievementIds, history || []);
          const totalPoints = await getTotalPoints(userId);

          return createSuccessResponse(
            {
              success: true,
              synced: results.synced,
              alreadyUnlocked: results.alreadyUnlocked,
              errors: results.errors,
              totalPoints,
              message: `Synced ${results.synced.length} achievements, ${results.alreadyUnlocked.length} already unlocked`,
            },
            requestId
          );
        } catch (error) {
          console.error("[Achievements] PUT error:", error);
          return createErrorResponse(
            "Failed to sync achievements",
            500,
            "database_error",
            requestId
          );
        }
      }

      return createErrorResponse("Method not allowed", 405, "method_not_allowed", requestId);
    },
  });
};
