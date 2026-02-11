import { db, supabaseAdmin } from "./supabase-client.js";
import { getOrFetch, CACHE_TTL, CACHE_PREFIX } from "./cache.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { getTimeAgo } from "./utils/date-utils.js";
import { baseHandler } from "./utils/base-handler.js";

// Netlify Function: Dashboard Data
// Returns user dashboard statistics and activity using Supabase

// Note: authenticateRequest and applyRateLimit are now handled by baseHandler
// Get real dashboard data from Supabase database
const getDashboardData = async (userId) => {
  try {
    // Get user's training sessions
    const trainingSessions = await db.training.getUserStats(userId);
    const recentSessions = await db.training.getRecentSessions(userId, 5);

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
      totalGames: trainingSessions.length > 0 ? Math.floor(avgScore / 10) : 0, // Estimate games from activity
      winRate: Math.min(Math.round(avgScore), 100) || 0,
      totalTouchdowns: Math.floor(avgScore * 0.15) || 0,
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
    console.error("[Dashboard] Database error in getDashboardData:", error);
    // Return fallback data with indicator flag (RISK-018 fix)
    return {
      ...getFallbackDashboardData(),
      _isFallback: true,
      _fallbackReason: "database_error",
      _error: error.message || "Unknown error",
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
      console.error("Error fetching training calendar:", error);
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
    console.error("Error in getTrainingCalendar:", error);
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

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("team_members")
      .select("user_id, role, position, jersey_number, status")
      .eq("team_id", teamId);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
    }

    // Try to get team chemistry from database
    const { data: chemistryData, error: chemistryError } = await supabaseAdmin
      .from("team_chemistry")
      .select(
        "overall_chemistry, communication_score, trust_score, cohesion_score, leadership_score",
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(1);

    let chemistry = null;
    let chemistryDetails = null;

    if (!chemistryError && chemistryData && chemistryData.length > 0) {
      // Use real chemistry data from database
      const data = chemistryData[0];
      chemistry = data.overall_chemistry;
      chemistryDetails = {
        communication: data.communication_score,
        trust: data.trust_score,
        cohesion: data.cohesion_score,
        leadership: data.leadership_score,
      };
    } else {
      // Calculate chemistry based on team activity if no stored data
      // This is a simple heuristic based on team size and activity
      const memberCount = members?.length || 0;
      if (memberCount > 0) {
        // Base chemistry on team size (more members = more potential for chemistry)
        // Capped at reasonable values
        const sizeBonus = Math.min(memberCount * 2, 15);
        chemistry = 70 + sizeBonus; // Range: 70-85 based on team size
      }
    }

    return {
      teamId,
      chemistry,
      chemistryDetails,
      members: members || [],
      memberCount: members?.length || 0,
    };
  } catch (error) {
    console.error("Error in getTeamChemistry:", error);
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

export const handler = async (event, context) => {
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
        console.error("[dashboard] Unexpected handler error:", error);
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
