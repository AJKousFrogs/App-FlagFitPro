import { db, supabaseAdmin } from "./supabase-client.js";
import { getOrFetch, CACHE_TTL, CACHE_PREFIX } from "./cache.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { getTimeAgo } from "./utils/date-utils.js";
import { baseHandler } from "./utils/base-handler.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.dashboard" });

// Netlify Function: Dashboard Data
// Returns user dashboard statistics and activity using Supabase

// Note: authenticateRequest and applyRateLimit are now handled by baseHandler
// Get real dashboard data from Supabase database
const getDashboardData = async (userId) => {
  try {
    // Get user's training sessions (independent queries — run concurrently)
    const [trainingSessions, recentSessions] = await Promise.all([
      db.training.getUserStats(userId),
      db.training.getRecentSessions(userId, 5),
    ]);

    // Calculate statistics from real data
    const totalTrainingHours =
      trainingSessions.reduce(
        (sum, session) => sum + (session.duration || 0),
        0,
      ) / 60;
    const avgScore =
      trainingSessions.length > 0
        ? trainingSessions.reduce(
            (sum, session) => sum + (session.score || 0),
            0,
          ) / trainingSessions.length
        : 0;

    // Build recent activity from training sessions
    const recentActivity = [];
    recentSessions.slice(0, 4).forEach((session) => {
      const timeAgo = getTimeAgo(new Date(session.completed_at));
      recentActivity.push({
        type: "training",
        icon: "🏃",
        title: `Completed ${session.workout_type} Training`,
        timeAgo,
      });
    });

    // Generate performance data from recent sessions
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const performanceValues = last7Days.map((date) => {
      const sessionsOnDate = trainingSessions.filter(
        (session) =>
          session.completed_at && session.completed_at.split("T")[0] === date,
      );
      return sessionsOnDate.length > 0
        ? Math.round(
            sessionsOnDate.reduce((sum, s) => sum + (s.score || 70), 0) /
              sessionsOnDate.length,
          )
        : 0;
    });

    // Calculate weekly goals
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekSessions = trainingSessions.filter(
      (session) => new Date(session.completed_at) >= thisWeekStart,
    );
    const weeklyTrainingHours =
      thisWeekSessions.reduce(
        (sum, session) => sum + (session.duration || 0),
        0,
      ) / 60;

    return {
      // No fabrication (S8): game stats must NOT be estimated from training
      // scores — a coach selecting/cutting players off invented win rates and
      // touchdowns is a real harm. No real game-results source is wired here, so
      // report honest zeros. trainingHours below IS real (summed session duration).
      totalGames: 0,
      winRate: 0,
      totalTouchdowns: 0,
      trainingHours: Math.round(totalTrainingHours) || 0,
      recentActivity: recentActivity.length > 0 ? recentActivity : [],
      performanceData: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: performanceValues,
      },
      weeklyGoals: {
        trainingHours: {
          current: Math.round(weeklyTrainingHours),
          target: 12,
        },
        gamesPlayed: {
          current: 0,
          target: 3,
        },
        skillPractice: {
          current: thisWeekSessions.length,
          target: 7,
        },
      },
    };
  } catch (error) {
    logger.error("dashboard_data_fetch_failed", error, {
      context: "getDashboardData",
    });
    // Return fallback data with indicator flag (RISK-018 fix)
    return {
      ...getFallbackDashboardData(),
      _isFallback: true,
      _fallbackReason: "database_error",
    };
  }
};

// Fallback dashboard data if database is unavailable
// Note: _isFallback flag added at call site to indicate no data available
const getFallbackDashboardData = () => {
  return {
    totalGames: 0,
    winRate: 0,
    totalTouchdowns: 0,
    trainingHours: 0,
    recentActivity: [],
    performanceData: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [0, 0, 0, 0, 0, 0, 0],
    },
    weeklyGoals: {
      trainingHours: { current: 0, target: 0 },
      gamesPlayed: { current: 0, target: 0 },
      skillPractice: { current: 0, target: 0 },
    },
    // Fallback indicator - UI can check this to show "no data" message
    _isFallback: true,
    _fallbackReason: "no_data",
  };
};

// Get training calendar data
const getTrainingCalendar = async (userId) => {
  try {
    // Get upcoming training sessions (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: sessions, error } = await supabaseAdmin
      .from("training_sessions")
      .select("id, workout_type, session_date, completed_at, duration")
      .eq("user_id", userId)
      .gte("session_date", today.toISOString().split("T")[0])
      .lte("session_date", nextWeek.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    if (error) {
      logger.error("training_calendar_fetch_failed", error, {
        context: "getTrainingCalendar",
      });
      throw error;
    }

    // Group by date
    const calendar = {};
    (sessions || []).forEach((session) => {
      const dateKey =
        session.session_date || session.completed_at?.split("T")[0];
      if (dateKey) {
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push({
          id: session.id,
          type: session.workout_type,
          duration: session.duration,
        });
      }
    });

    return {
      calendar,
      upcomingSessions: sessions || [],
    };
  } catch (error) {
    logger.error("training_calendar_error", error, {
      context: "getTrainingCalendar",
    });
    return {
      calendar: {},
      upcomingSessions: [],
    };
  }
};

// Get team chemistry data
const getTeamChemistry = async (userId) => {
  try {
    // Get user's team memberships
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    if (teamError || !teamMemberships || teamMemberships.length === 0) {
      return {
        teamId: null,
        chemistry: null,
        members: [],
        message: "User is not a member of any team.",
      };
    }

    const teamId = teamMemberships[0].team_id;

    const [{ data: members, error: membersError }] = await Promise.all([
      supabaseAdmin
        .from("team_members")
        .select("user_id, role, position, jersey_number, status")
        .eq("team_id", teamId)
        .eq("status", "active"),
    ]);

    if (membersError) {
      logger.error("team_members_fetch_failed", membersError, {
        context: "getTeamChemistry",
      });
    }

    const chemistry = null;
    const chemistryDetails = null;

    return {
      teamId,
      chemistry,
      chemistryDetails,
      members: members || [],
      memberCount: members?.length || 0,
    };
  } catch (error) {
    logger.error("team_chemistry_error", error, {
      context: "getTeamChemistry",
    });
    return {
      teamId: null,
      chemistry: null,
      members: [],
    };
  }
};

// Health check endpoint
const getHealth = async () => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "dashboard",
  };
};

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "dashboard",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true, // P0-004: Explicitly require authentication for dashboard data
    handler: async (event, _context, { userId, requestId }) => {
      try {
        // Parse path to determine endpoint
        const path = event.path.replace("/.netlify/functions/dashboard", "");

        // Route to appropriate handler
        if (
          path.includes("/training-calendar") ||
          path.endsWith("/training-calendar")
        ) {
          const cacheKey = `${CACHE_PREFIX.DASHBOARD}:${userId}:training-calendar`;
          const data = await getOrFetch(
            cacheKey,
            async () => await getTrainingCalendar(userId),
            CACHE_TTL.DASHBOARD,
          );
          return createSuccessResponse(data);
        }

        if (
          path.includes("/team-chemistry") ||
          path.endsWith("/team-chemistry")
        ) {
          const cacheKey = `${CACHE_PREFIX.DASHBOARD}:${userId}:team-chemistry`;
          const data = await getOrFetch(
            cacheKey,
            async () => await getTeamChemistry(userId),
            CACHE_TTL.DASHBOARD,
          );
          return createSuccessResponse(data);
        }

        if (path.includes("/health") || path.endsWith("/health")) {
          const data = await getHealth();
          return createSuccessResponse(data);
        }

        // Default: return overview
        const cacheKey = `${CACHE_PREFIX.DASHBOARD}:${userId}:overview`;
        const dashboardData = await getOrFetch(
          cacheKey,
          async () => await getDashboardData(userId),
          CACHE_TTL.DASHBOARD,
        );

        return createSuccessResponse(dashboardData);
      } catch (error) {
        logger.error("dashboard_handler_error", error, { context: "handler" });
        return createErrorResponse(
          "Failed to load dashboard data",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
