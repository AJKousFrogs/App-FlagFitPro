/**
 * Netlify Function: Achievements
 *
 * Phase 4: Gamification - achievements, streaks, and leaderboards
 *
 * Endpoints:
 * - GET /api/achievements - Get user's achievements
 * - GET /api/achievements/definitions - Get all achievement definitions
 * - GET /api/achievements/leaderboard/:teamId - Get team leaderboard
 * - POST /api/achievements/check - Trigger achievement checks
 * - GET /api/achievements/stats - Get user's gamification stats
 */

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");

// =====================================================
// ACHIEVEMENT DEFINITIONS
// =====================================================

const ACHIEVEMENT_TYPES = {
  // Sessions
  FIRST_SESSION: "first_session",
  SESSION_5: "session_5",
  SESSION_25: "session_25",
  SESSION_100: "session_100",

  // Consistency
  STREAK_3: "streak_3",
  STREAK_7: "streak_7",
  STREAK_30: "streak_30",

  // Learning
  FIRST_QUESTION: "first_question",
  QUESTIONS_10: "questions_10",
  QUESTIONS_50: "questions_50",

  // Recovery
  RECOVERY_COMPLETE: "recovery_complete",
  RECOVERY_5: "recovery_5",
  DAILY_CHECKIN_7: "daily_checkin_7",

  // Team
  TEAM_JOIN: "team_join",
  LEADERBOARD_TOP3: "leaderboard_top3",

  // Milestones
  PROFILE_COMPLETE: "profile_complete",
  FIRST_WEEK: "first_week",
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get all achievement definitions
 * @returns {Array} Achievement definitions
 */
async function getAchievementDefinitions() {
  const { data, error } = await supabaseAdmin
    .from("achievement_definitions")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("points", { ascending: true });

  if (error) {
    console.error("[Achievements] Error fetching definitions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get user's achievements
 * @param {string} userId - User ID
 * @returns {Array} User's achievements
 */
async function getUserAchievements(userId) {
  const { data, error } = await supabaseAdmin
    .from("athlete_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[Achievements] Error fetching user achievements:", error);
    throw error;
  }

  return data || [];
}

/**
 * Award an achievement to a user
 * @param {string} userId - User ID
 * @param {Object} achievement - Achievement definition
 * @returns {Object} Created achievement
 */
async function _awardAchievement(userId, achievement) {
  try {
    // Check if already awarded
    const { data: existing } = await supabaseAdmin
      .from("athlete_achievements")
      .select("id, is_completed")
      .eq("user_id", userId)
      .eq("achievement_type", achievement.achievement_type)
      .single();

    if (existing?.is_completed) {
      return { alreadyAwarded: true, achievement: existing };
    }

    // Insert or update
    const { data, error } = await supabaseAdmin
      .from("athlete_achievements")
      .upsert(
        {
          user_id: userId,
          achievement_type: achievement.achievement_type,
          achievement_name: achievement.achievement_name,
          achievement_description: achievement.achievement_description,
          achievement_icon: achievement.achievement_icon,
          category: achievement.category,
          points_awarded: achievement.points,
          progress_target: achievement.progress_target,
          progress_current: achievement.progress_target,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,achievement_type",
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update user's total points
    await supabaseAdmin
      .from("users")
      .update({
        achievement_points: supabaseAdmin.raw(
          `achievement_points + ${achievement.points}`,
        ),
      })
      .eq("id", userId);

    console.log(
      `[Achievements] Awarded "${achievement.achievement_name}" to user ${userId}`,
    );

    return { alreadyAwarded: false, achievement: data };
  } catch (error) {
    console.error("[Achievements] Error awarding achievement:", error);
    throw error;
  }
}

/**
 * Update achievement progress
 * @param {string} userId - User ID
 * @param {string} achievementType - Achievement type
 * @param {number} progressIncrement - Progress to add
 * @returns {Object} Updated achievement
 */
async function updateAchievementProgress(
  userId,
  achievementType,
  progressIncrement = 1,
) {
  try {
    // Get current progress
    const { data: existing } = await supabaseAdmin
      .from("athlete_achievements")
      .select("*")
      .eq("user_id", userId)
      .eq("achievement_type", achievementType)
      .single();

    // Get definition
    const { data: definition } = await supabaseAdmin
      .from("achievement_definitions")
      .select("*")
      .eq("achievement_type", achievementType)
      .single();

    if (!definition) {
      console.log(`[Achievements] Definition not found for ${achievementType}`);
      return null;
    }

    const currentProgress = existing?.progress_current || 0;
    const newProgress = currentProgress + progressIncrement;
    const isNowComplete = newProgress >= definition.progress_target;

    const updateData = {
      user_id: userId,
      achievement_type: achievementType,
      achievement_name: definition.achievement_name,
      achievement_description: definition.achievement_description,
      achievement_icon: definition.achievement_icon,
      category: definition.category,
      points_awarded: definition.points,
      progress_target: definition.progress_target,
      progress_current: Math.min(newProgress, definition.progress_target),
      is_completed: isNowComplete,
      updated_at: new Date().toISOString(),
    };

    if (isNowComplete && !existing?.is_completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("athlete_achievements")
      .upsert(updateData, {
        onConflict: "user_id,achievement_type",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update user points if newly completed
    if (isNowComplete && !existing?.is_completed) {
      await supabaseAdmin
        .from("users")
        .update({
          achievement_points: supabaseAdmin.raw(
            `achievement_points + ${definition.points}`,
          ),
        })
        .eq("id", userId);

      console.log(
        `[Achievements] User ${userId} completed "${definition.achievement_name}"`,
      );
    }

    return {
      achievement: data,
      newlyCompleted: isNowComplete && !existing?.is_completed,
    };
  } catch (error) {
    console.error("[Achievements] Error updating progress:", error);
    return null;
  }
}

/**
 * Check and award session-related achievements
 * @param {string} userId - User ID
 * @returns {Array} Newly awarded achievements
 */
async function checkSessionAchievements(userId) {
  const newAchievements = [];

  // Count completed sessions
  const { count } = await supabaseAdmin
    .from("micro_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const completedSessions = count || 0;

  // First session
  if (completedSessions >= 1) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.FIRST_SESSION,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  // 5 sessions
  if (completedSessions >= 5) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.SESSION_5,
      completedSessions,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  // 25 sessions
  if (completedSessions >= 25) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.SESSION_25,
      completedSessions,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  // 100 sessions
  if (completedSessions >= 100) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.SESSION_100,
      completedSessions,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  // Check for recovery sessions
  const { count: recoveryCount } = await supabaseAdmin
    .from("micro_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("session_type", "recovery");

  if (recoveryCount >= 1) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.RECOVERY_COMPLETE,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  if (recoveryCount >= 5) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.RECOVERY_5,
      recoveryCount,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  return newAchievements;
}

/**
 * Check and award streak achievements
 * @param {string} userId - User ID
 * @returns {Array} Newly awarded achievements
 */
async function checkStreakAchievements(userId) {
  const newAchievements = [];

  // Get current streak
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("current_streak")
    .eq("id", userId)
    .single();

  const currentStreak = user?.current_streak || 0;

  if (currentStreak >= 3) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.STREAK_3,
      currentStreak,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  if (currentStreak >= 7) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.STREAK_7,
      currentStreak,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  if (currentStreak >= 30) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.STREAK_30,
      currentStreak,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  return newAchievements;
}

/**
 * Check and award AI learning achievements
 * @param {string} userId - User ID
 * @returns {Array} Newly awarded achievements
 */
async function checkLearningAchievements(userId) {
  const newAchievements = [];

  // Count AI questions
  const { count } = await supabaseAdmin
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user");

  const questionCount = count || 0;

  if (questionCount >= 1) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.FIRST_QUESTION,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  if (questionCount >= 10) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.QUESTIONS_10,
      questionCount,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  if (questionCount >= 50) {
    const result = await updateAchievementProgress(
      userId,
      ACHIEVEMENT_TYPES.QUESTIONS_50,
      questionCount,
    );
    if (result?.newlyCompleted) {
      newAchievements.push(result.achievement);
    }
  }

  return newAchievements;
}

/**
 * Check all achievements for a user
 * @param {string} userId - User ID
 * @returns {Array} Newly awarded achievements
 */
async function checkAllAchievements(userId) {
  const allNew = [];

  const [sessionAchievements, streakAchievements, learningAchievements] =
    await Promise.all([
      checkSessionAchievements(userId),
      checkStreakAchievements(userId),
      checkLearningAchievements(userId),
    ]);

  allNew.push(
    ...sessionAchievements,
    ...streakAchievements,
    ...learningAchievements,
  );

  return allNew;
}

/**
 * Get user's gamification stats
 * @param {string} userId - User ID
 * @returns {Object} Stats
 */
async function getUserStats(userId) {
  // Get user data
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("achievement_points, current_streak, longest_streak")
    .eq("id", userId)
    .single();

  // Get achievements
  const { data: achievements } = await supabaseAdmin
    .from("athlete_achievements")
    .select("is_completed")
    .eq("user_id", userId);

  const completed = (achievements || []).filter((a) => a.is_completed).length;
  const inProgress = (achievements || []).length - completed;

  // Get total definitions
  const { count: totalDefinitions } = await supabaseAdmin
    .from("achievement_definitions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return {
    totalPoints: user?.achievement_points || 0,
    currentStreak: user?.current_streak || 0,
    longestStreak: user?.longest_streak || 0,
    achievementsCompleted: completed,
    achievementsInProgress: inProgress,
    achievementsTotal: totalDefinitions || 0,
    completionPercentage: totalDefinitions
      ? Math.round((completed / totalDefinitions) * 100)
      : 0,
  };
}

/**
 * Get team leaderboard
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Array} Leaderboard entries
 */
async function getTeamLeaderboard(teamId, options = {}) {
  const { limit = 10, type = "points" } = options;

  // Get team members
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      user_id,
      user:user_id(
        id, 
        first_name, 
        last_name, 
        achievement_points, 
        current_streak
      )
    `,
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("role", "athlete");

  if (!members || members.length === 0) {
    return [];
  }

  // Build leaderboard
  const leaderboard = members
    .filter((m) => m.user)
    .map((m) => ({
      userId: m.user.id,
      name:
        `${m.user.first_name || ""} ${m.user.last_name || ""}`.trim() ||
        "Unknown",
      points: m.user.achievement_points || 0,
      streak: m.user.current_streak || 0,
    }));

  // Sort by type
  if (type === "streak") {
    leaderboard.sort((a, b) => b.streak - a.streak);
  } else {
    leaderboard.sort((a, b) => b.points - a.points);
  }

  // Add rank and limit
  return leaderboard
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/**
 * Update user streak
 * @param {string} userId - User ID
 * @param {boolean} activityToday - Whether user had activity today
 * @returns {Object} Updated streak info
 */
async function updateStreak(userId, activityToday) {
  try {
    // Get current user data
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("id", userId)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const lastActivity = user?.last_activity_date;
    let currentStreak = user?.current_streak || 0;
    let longestStreak = user?.longest_streak || 0;

    if (activityToday) {
      if (lastActivity === today) {
        // Already counted today
        return { currentStreak, longestStreak, updated: false };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActivity === yesterdayStr) {
        // Consecutive day
        currentStreak++;
      } else {
        // Streak broken, start new
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await supabaseAdmin
        .from("users")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
        })
        .eq("id", userId);

      return { currentStreak, longestStreak, updated: true };
    }

    return { currentStreak, longestStreak, updated: false };
  } catch (error) {
    console.error("[Achievements] Error updating streak:", error);
    return { currentStreak: 0, longestStreak: 0, updated: false };
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "achievements",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      const { path } = event;
      const method = event.httpMethod;
      const params = event.queryStringParameters || {};

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?achievements\/?/, "")
        .split("/")
        .filter(Boolean);
      const resource = pathParts[0] || "";
      const resourceId = pathParts[1] || null;

      try {
        // GET /api/achievements - Get user's achievements
        if (method === "GET" && !resource) {
          const achievements = await getUserAchievements(userId);
          const stats = await getUserStats(userId);

          return createSuccessResponse(
            {
              achievements,
              stats,
            },
            requestId,
          );
        }

        // GET /api/achievements/definitions - Get all definitions
        if (method === "GET" && resource === "definitions") {
          const definitions = await getAchievementDefinitions();
          return createSuccessResponse({ definitions }, requestId);
        }

        // GET /api/achievements/stats - Get user stats
        if (method === "GET" && resource === "stats") {
          const stats = await getUserStats(userId);
          return createSuccessResponse(stats, requestId);
        }

        // GET /api/achievements/leaderboard/:teamId - Get team leaderboard
        if (method === "GET" && resource === "leaderboard" && resourceId) {
          // Verify user is on team
          const { data: membership } = await supabaseAdmin
            .from("team_members")
            .select("id")
            .eq("user_id", userId)
            .eq("team_id", resourceId)
            .single();

          if (!membership) {
            return createErrorResponse(
              "Not authorized to view this team's leaderboard",
              403,
              "not_authorized",
              requestId,
            );
          }

          const leaderboard = await getTeamLeaderboard(resourceId, {
            limit: parseInt(params.limit) || 10,
            type: params.type || "points",
          });

          return createSuccessResponse({ leaderboard }, requestId);
        }

        // POST /api/achievements/check - Trigger achievement check
        if (method === "POST" && resource === "check") {
          const newAchievements = await checkAllAchievements(userId);
          const stats = await getUserStats(userId);

          return createSuccessResponse(
            {
              newAchievements,
              stats,
              message:
                newAchievements.length > 0
                  ? `Congratulations! ${newAchievements.length} new achievement(s)!`
                  : "No new achievements",
            },
            requestId,
          );
        }

        // POST /api/achievements/streak - Update streak
        if (method === "POST" && resource === "streak") {
          const streakResult = await updateStreak(userId, true);

          // Check streak achievements
          const streakAchievements = await checkStreakAchievements(userId);

          return createSuccessResponse(
            {
              ...streakResult,
              newAchievements: streakAchievements,
            },
            requestId,
          );
        }

        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
          requestId,
        );
      } catch (error) {
        console.error("[Achievements] Error:", error);
        return createErrorResponse(
          error.message || "Failed to process request",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

// Export helper functions for use in other modules
module.exports.checkSessionAchievements = checkSessionAchievements;
module.exports.checkStreakAchievements = checkStreakAchievements;
module.exports.checkLearningAchievements = checkLearningAchievements;
module.exports.updateStreak = updateStreak;
