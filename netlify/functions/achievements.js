import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "achievements",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId }) => {
      try {
        const path = evt.path
          .replace("/.netlify/functions/achievements", "")
          .replace("/api/achievements", "");
        const method = evt.httpMethod;

        if (method === "GET" && (path === "" || path === "/")) {
          return getAchievements(supabaseAdmin, userId);
        }

        if (method === "GET" && path === "/stats") {
          return getUserStats(supabaseAdmin, userId);
        }

        if (method === "GET" && path === "/streaks") {
          return getUserStreaks(supabaseAdmin, userId);
        }

        if (method === "POST" && path === "/check") {
          return checkAchievements(supabaseAdmin, userId);
        }

        if (method === "POST" && path === "/streak") {
          const parsedPayload = tryParseJsonObjectBody(evt.body);
          if (!parsedPayload.ok) {
            return parsedPayload.error;
          }
          const payload = parsedPayload.data;
          return updateStreak(supabaseAdmin, userId, payload);
        }

        return createErrorResponse("Not found", 404, "not_found");
      } catch (error) {
        console.error("Achievements error:", error);
        return createErrorResponse("Internal server error", 500, "server_error", requestId);
      }
    },
  });

async function getAchievements(supabase, userId) {
  // Get all achievement definitions
  const { data: definitions, error: defError } = await supabase
    .from("achievement_definitions")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (defError) {
    return createErrorResponse("Failed to load achievements", 500, "database_error");
  }

  // Get user's earned achievements
  const { data: earned } = await supabase
    .from("player_achievements")
    .select("achievement_id, earned_at, context_data")
    .eq("user_id", userId);

  const earnedMap = new Map(earned?.map((e) => [e.achievement_id, e]) || []);

  // Get user's streaks for progress calculation
  const { data: streaks } = await supabase
    .from("player_streaks")
    .select("*")
    .eq("user_id", userId);

  const streakMap = new Map(streaks?.map((s) => [s.streak_type, s]) || []);

  // Get user's stats
  const { data: stats } = await supabase
    .from("player_training_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Enhance achievements with earned status and progress
  const achievements = definitions.map((def) => {
    const earnedData = earnedMap.get(def.id);
    const progress = calculateProgress(def.criteria, streakMap, stats);

    return {
      ...def,
      earned: !!earnedData,
      earnedAt: earnedData?.earned_at,
      contextData: earnedData?.context_data,
      progress: progress.current,
      progressMax: progress.max,
      progressPercent:
        progress.max > 0
          ? Math.min(100, Math.round((progress.current / progress.max) * 100))
          : 0,
    };
  });

  // Group by category
  const grouped = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) {
      acc[ach.category] = [];
    }
    acc[ach.category].push(ach);
    return acc;
  }, {});

  // Stats summary
  const summary = {
    totalEarned: achievements.filter((a) => a.earned).length,
    totalAvailable: achievements.length,
    totalPoints: stats?.total_points || 0,
    nextAchievement: achievements.find(
      (a) => !a.earned && a.progressPercent > 0,
    ),
  };

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        achievements,
        grouped,
        summary,
      },
    }),
  };
}

function calculateProgress(criteria, streakMap, stats) {
  const { type } = criteria;

  switch (type) {
    case "streak": {
      const streak = streakMap.get(criteria.streak_type);
      return {
        current: streak?.current_streak || 0,
        max: criteria.days,
      };
    }
    case "total_sessions":
      return {
        current: stats?.total_sessions || 0,
        max: criteria.count,
      };
    case "qb_throws":
      return {
        current: stats?.total_throws || 0,
        max: criteria.count,
      };
    case "tournament_complete":
      return {
        current: stats?.tournaments_completed || 0,
        max: criteria.count,
      };
    case "first_protocol":
      return {
        current: stats?.total_sessions > 0 ? 1 : 0,
        max: 1,
      };
    default:
      return { current: 0, max: 1 };
  }
}

async function getUserStats(supabase, userId) {
  // Get or create stats
  const { data: stats, error } = await supabase
    .from("player_training_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return createErrorResponse("Failed to load user stats", 500, "database_error");
  }

  // Get recent activity
  const { data: recentProtocols } = await supabase
    .from("protocol_completions")
    .select("completion_date, total_load_au")
    .eq("user_id", userId)
    .order("completion_date", { ascending: false })
    .limit(30);

  // Calculate additional stats
  const thisWeek = recentProtocols?.filter((p) => {
    const date = new Date(p.completion_date);
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    return date >= weekAgo;
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        stats: stats || {
          total_sessions: 0,
          total_exercises: 0,
          total_training_minutes: 0,
          total_load_au: 0,
          total_throws: 0,
          tournaments_completed: 0,
          total_achievements: 0,
          total_points: 0,
        },
        weekStats: {
          sessions: thisWeek?.length || 0,
          totalLoad:
            thisWeek?.reduce((sum, p) => sum + (p.total_load_au || 0), 0) || 0,
        },
      },
    }),
  };
}

async function getUserStreaks(supabase, userId) {
  const { data: streaks, error } = await supabase
    .from("player_streaks")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return createErrorResponse("Failed to load streaks", 500, "database_error");
  }

  // Format streaks with additional info
  const formatted = (streaks || []).map((s) => {
    const daysSinceActivity = s.last_activity_date
      ? Math.floor(
          (new Date() - new Date(s.last_activity_date)) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      ...s,
      isActive: daysSinceActivity !== null && daysSinceActivity <= 1,
      daysSinceActivity,
      atRisk: daysSinceActivity === 1, // Will break tomorrow if not continued
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data: { streaks: formatted } }),
  };
}

async function updateStreak(supabase, userId, payload) {
  const { streakType, date } = payload;

  if (typeof streakType !== "string" || !streakType.trim()) {
    return handleValidationError("streakType required");
  }
  if (date !== undefined && date !== null) {
    if (typeof date !== "string") {
      return handleValidationError("date must be in YYYY-MM-DD format");
    }
    const parsed = new Date(`${date}T00:00:00.000Z`);
    const isIsoLike = /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (Number.isNaN(parsed.getTime())) {
      return handleValidationError("date must be in YYYY-MM-DD format");
    }
    const normalized = parsed.toISOString().split("T")[0];
    if (!isIsoLike || normalized !== date) {
      return handleValidationError("date must be in YYYY-MM-DD format");
    }
  }

  const { data: result, error } = await supabase.rpc("update_player_streak", {
    p_user_id: userId,
    p_streak_type: streakType,
    p_activity_date: date || new Date().toISOString().split("T")[0],
  });

  if (error) {
    return createErrorResponse("Failed to update streak", 500, "database_error");
  }

  // Award any unlocked achievements
  const unlocked = result?.[0]?.achievements_unlocked || [];
  const awardedAchievements = [];

  for (const slug of unlocked) {
    const awarded = await supabase.rpc("award_achievement", {
      p_user_id: userId,
      p_achievement_slug: slug,
      p_context: { streak_length: result[0].new_streak },
    });

    if (awarded.data) {
      // Get achievement details
      const { data: achDetail } = await supabase
        .from("achievement_definitions")
        .select("*")
        .eq("slug", slug)
        .single();

      if (achDetail) {
        awardedAchievements.push(achDetail);
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        streak: result?.[0],
        achievementsUnlocked: awardedAchievements,
      },
    }),
  };
}

async function checkAchievements(supabase, userId) {
  // Get user's stats
  const { data: stats } = await supabase
    .from("player_training_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get user's streaks
  const { data: streaks } = await supabase
    .from("player_streaks")
    .select("*")
    .eq("user_id", userId);

  const streakMap = new Map(streaks?.map((s) => [s.streak_type, s]) || []);

  // Get all unearned achievements
  const { data: earnedIds } = await supabase
    .from("player_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const earnedSet = new Set(earnedIds?.map((e) => e.achievement_id) || []);

  const { data: definitions } = await supabase
    .from("achievement_definitions")
    .select("*")
    .eq("is_active", true);

  const newlyEarned = [];

  for (const def of definitions || []) {
    if (earnedSet.has(def.id)) {
      continue;
    }

    const shouldAward = checkCriteria(def.criteria, streakMap, stats);

    if (shouldAward) {
      const awarded = await supabase.rpc("award_achievement", {
        p_user_id: userId,
        p_achievement_slug: def.slug,
        p_context: {},
      });

      if (awarded.data) {
        newlyEarned.push(def);
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        checked: true,
        newlyEarned,
      },
    }),
  };
}

function checkCriteria(criteria, streakMap, stats) {
  const { type } = criteria;

  switch (type) {
    case "streak": {
      const streak = streakMap.get(criteria.streak_type);
      return (streak?.current_streak || 0) >= criteria.days;
    }
    case "total_sessions":
      return (stats?.total_sessions || 0) >= criteria.count;
    case "qb_throws":
      return (stats?.total_throws || 0) >= criteria.count;
    case "tournament_complete":
      return (stats?.tournaments_completed || 0) >= criteria.count;
    case "first_protocol":
      return (stats?.total_sessions || 0) > 0;
    case "readiness_score":
      return false; // Checked elsewhere
    default:
      return false;
  }
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
