import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

const ATHLETE_ROLES = ["player", "athlete"];
const COACH_ANALYTICS_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
];

const parseBoundedPositiveInt = (value, fieldName, { min = 1, max = 365 } = {}) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
};

/**
 * Netlify Function: Coach Analytics
 *
 * Phase 4: API for coach analytics dashboard
 *
 * Endpoints:
 * - GET /api/coach-analytics/overview - Dashboard overview metrics
 * - GET /api/coach-analytics/classification - Classification accuracy breakdown
 * - GET /api/coach-analytics/intents - Intent distribution over time
 * - GET /api/coach-analytics/team/:teamId - Team-specific analytics
 * - GET /api/coach-analytics/trends - Trends over time (risk levels, sessions)
 * - GET /api/coach-analytics/leaderboard/:teamId - Team session leaderboard
 * - POST /api/coach-analytics/refresh - Force refresh cached analytics
 */

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Verify user is a coach
 * @param {string} userId - User ID
 * @returns {Object} - { isCoach: boolean, teamIds: string[] }
 */
async function verifyCoachAccess(userId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ANALYTICS_ROLES);

  if (error) {
    console.error("[Coach Analytics] Error verifying coach access:", error);
    return { isCoach: false, teamIds: [] };
  }

  return {
    isCoach: data && data.length > 0,
    teamIds: [...new Set((data || []).map((d) => d.team_id))],
  };
}

/**
 * Get team member IDs for analytics queries
 * @param {string[]} teamIds - Team IDs
 * @returns {string[]} - User IDs
 */
async function getTeamMemberIds(teamIds) {
  if (!teamIds || teamIds.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("user_id")
    .in("team_id", teamIds)
    .eq("status", "active");

  if (error) {
    console.error("[Coach Analytics] Error fetching team members:", error);
    return [];
  }

  return [...new Set((data || []).map((d) => d.user_id))];
}

/**
 * Get overview metrics for dashboard
 * @param {string} coachId - Coach user ID
 * @param {string[]} teamIds - Team IDs
 * @param {Object} options - Query options
 * @returns {Object} - Overview metrics
 */
async function getOverviewMetrics(coachId, teamIds, _options = {}) {
  const memberIds = await getTeamMemberIds(teamIds);
  if (memberIds.length === 0) {
    return {
      totalAthletes: 0,
      activeAthletesLast7Days: 0,
      totalAiInteractions: 0,
      interactionsLast7Days: 0,
      sessionCompletionRate: 0,
      feedbackAccuracyRate: null,
    };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Total AI interactions
  const { count: totalInteractions } = await supabaseAdmin
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .in("user_id", memberIds)
    .eq("role", "user");

  // Interactions last 7 days
  const { count: recentInteractions } = await supabaseAdmin
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .in("user_id", memberIds)
    .eq("role", "user")
    .gte("created_at", sevenDaysAgo.toISOString());

  // Active athletes (had interactions in last 7 days)
  const { data: activeAthletes } = await supabaseAdmin
    .from("ai_messages")
    .select("user_id")
    .in("user_id", memberIds)
    .eq("role", "user")
    .gte("created_at", sevenDaysAgo.toISOString());
  const uniqueActive = new Set((activeAthletes || []).map((a) => a.user_id));

  // Session completion rate
  const { data: sessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("status")
    .in("user_id", memberIds);

  const completedSessions = (sessions || []).filter(
    (s) => s.status === "completed",
  ).length;
  const totalSessions = (sessions || []).length;
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  // Feedback accuracy (from coach feedback)
  const { data: feedback } = await supabaseAdmin
    .from("ai_response_feedback")
    .select("classification_accuracy")
    .eq("feedback_source", "coach")
    .in("user_id", memberIds);

  const appropriateCount = (feedback || []).filter(
    (f) => f.classification_accuracy === "appropriate",
  ).length;
  const totalFeedback = (feedback || []).length;
  const accuracyRate =
    totalFeedback > 0
      ? Math.round((appropriateCount / totalFeedback) * 100)
      : null;

  return {
    totalAthletes: memberIds.length,
    activeAthletesLast7Days: uniqueActive.size,
    totalAiInteractions: totalInteractions || 0,
    interactionsLast7Days: recentInteractions || 0,
    sessionCompletionRate: completionRate,
    feedbackAccuracyRate: accuracyRate,
    reviewedMessages: totalFeedback,
  };
}

/**
 * Get classification breakdown
 * @param {string[]} memberIds - Team member IDs
 * @param {Object} options - Query options
 * @returns {Object} - Classification breakdown
 */
async function getClassificationBreakdown(memberIds, options = {}) {
  const { dateFrom, dateTo } = options;

  let query = supabaseAdmin
    .from("ai_messages")
    .select(
      "risk_level, intent_type, is_youth_interaction, classification_confidence",
    )
    .in("user_id", memberIds)
    .eq("role", "user");

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "[Coach Analytics] Error fetching classification data:",
      error,
    );
    return null;
  }

  const messages = data || [];

  // Risk level distribution
  const riskDistribution = {
    high: messages.filter((m) => m.risk_level === "high").length,
    medium: messages.filter((m) => m.risk_level === "medium").length,
    low: messages.filter((m) => m.risk_level === "low").length,
  };

  // Intent distribution
  const intentCounts = {};
  for (const msg of messages) {
    const intent = msg.intent_type || "general";
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  // Sort by count and take top 10
  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([intent, count]) => ({ intent, count }));

  // Youth interactions
  const youthInteractions = messages.filter(
    (m) => m.is_youth_interaction,
  ).length;

  // Average confidence
  const confidences = messages
    .filter((m) => m.classification_confidence !== null)
    .map((m) => parseFloat(m.classification_confidence));
  const avgConfidence =
    confidences.length > 0
      ? Math.round(
          (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100,
        ) / 100
      : null;

  return {
    total: messages.length,
    riskDistribution,
    topIntents,
    youthInteractions,
    youthPercentage:
      messages.length > 0
        ? Math.round((youthInteractions / messages.length) * 100)
        : 0,
    avgConfidence,
  };
}

/**
 * Get trends over time
 * @param {string[]} memberIds - Team member IDs
 * @param {Object} options - Query options
 * @returns {Object} - Trends data
 */
async function getTrends(memberIds, options = {}) {
  const { days = 30 } = options;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get messages grouped by date
  const { data: messages } = await supabaseAdmin
    .from("ai_messages")
    .select("created_at, risk_level")
    .in("user_id", memberIds)
    .eq("role", "user")
    .gte("created_at", startDate.toISOString());

  // Get sessions grouped by date
  const { data: sessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("created_at, status")
    .in("user_id", memberIds)
    .gte("created_at", startDate.toISOString());

  // Build daily data
  const dailyData = {};
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = {
      date: dateKey,
      queries: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      sessionsCreated: 0,
      sessionsCompleted: 0,
    };
  }

  // Populate message data
  for (const msg of messages || []) {
    const dateKey = msg.created_at.split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].queries++;
      if (msg.risk_level === "high") {
        dailyData[dateKey].highRisk++;
      } else if (msg.risk_level === "medium") {
        dailyData[dateKey].mediumRisk++;
      } else {
        dailyData[dateKey].lowRisk++;
      }
    }
  }

  // Populate session data
  for (const session of sessions || []) {
    const dateKey = session.created_at.split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].sessionsCreated++;
      if (session.status === "completed") {
        dailyData[dateKey].sessionsCompleted++;
      }
    }
  }

  // Convert to array sorted by date
  const trendsArray = Object.values(dailyData).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  return {
    period: `${days} days`,
    startDate: startDate.toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    daily: trendsArray,
    summary: {
      totalQueries: trendsArray.reduce((sum, d) => sum + d.queries, 0),
      avgQueriesPerDay: Math.round(
        trendsArray.reduce((sum, d) => sum + d.queries, 0) / days,
      ),
      highRiskTotal: trendsArray.reduce((sum, d) => sum + d.highRisk, 0),
      sessionsCompleted: trendsArray.reduce(
        (sum, d) => sum + d.sessionsCompleted,
        0,
      ),
    },
  };
}

/**
 * Get team-specific analytics
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Object} - Team analytics
 */
async function getTeamAnalytics(teamId, _options = {}) {
  // Get team members
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      user_id,
      role,
      user:user_id(first_name, last_name, position)
    `,
    )
    .eq("team_id", teamId)
    .eq("status", "active");

  const memberIds = (members || []).map((m) => m.user_id);

  if (memberIds.length === 0) {
    return {
      teamId,
      memberCount: 0,
      athletes: [],
      aiUsageRate: 0,
    };
  }

  // Get AI usage per athlete
  const { data: aiUsage } = await supabaseAdmin
    .from("ai_messages")
    .select("user_id")
    .in("user_id", memberIds)
    .eq("role", "user");

  const usageByUser = {};
  for (const msg of aiUsage || []) {
    usageByUser[msg.user_id] = (usageByUser[msg.user_id] || 0) + 1;
  }

  // Get session stats per athlete
  const { data: sessionData } = await supabaseAdmin
    .from("micro_sessions")
    .select("user_id, status")
    .in("user_id", memberIds);

  const sessionsByUser = {};
  for (const session of sessionData || []) {
    if (!sessionsByUser[session.user_id]) {
      sessionsByUser[session.user_id] = { total: 0, completed: 0 };
    }
    sessionsByUser[session.user_id].total++;
    if (session.status === "completed") {
      sessionsByUser[session.user_id].completed++;
    }
  }

  // Build athlete list with stats
  const athletes = (members || [])
    .filter((m) => ATHLETE_ROLES.includes(m.role))
    .map((m) => ({
      id: m.user_id,
      name: m.user
        ? `${m.user.first_name || ""} ${m.user.last_name || ""}`.trim()
        : "Unknown",
      position: m.user?.position,
      aiQueries: usageByUser[m.user_id] || 0,
      sessionsCompleted: sessionsByUser[m.user_id]?.completed || 0,
      sessionsTotal: sessionsByUser[m.user_id]?.total || 0,
      completionRate:
        sessionsByUser[m.user_id]?.total > 0
          ? Math.round(
              (sessionsByUser[m.user_id].completed /
                sessionsByUser[m.user_id].total) *
                100,
            )
          : 0,
    }))
    .sort((a, b) => b.aiQueries - a.aiQueries);

  // Calculate team-wide metrics
  const athletesWithUsage = athletes.filter((a) => a.aiQueries > 0).length;
  const aiUsageRate =
    athletes.length > 0
      ? Math.round((athletesWithUsage / athletes.length) * 100)
      : 0;

  return {
    teamId,
    memberCount: athletes.length,
    athletesWithAiUsage: athletesWithUsage,
    aiUsageRate,
    totalQueries: Object.values(usageByUser).reduce((a, b) => a + b, 0),
    avgQueriesPerAthlete:
      athletes.length > 0
        ? Math.round(
            Object.values(usageByUser).reduce((a, b) => a + b, 0) /
              athletes.length,
          )
        : 0,
    athletes,
  };
}

/**
 * Get team session leaderboard
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Array} - Leaderboard entries
 */
async function getTeamLeaderboard(teamId, options = {}) {
  const { limit = 10, days = 30 } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get team members
  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select(
      `
      user_id,
      user:user_id(first_name, last_name)
    `,
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .in("role", ATHLETE_ROLES);

  const memberIds = (members || []).map((m) => m.user_id);

  if (memberIds.length === 0) {
    return [];
  }

  // Get session stats
  const { data: sessions } = await supabaseAdmin
    .from("micro_sessions")
    .select("user_id, status, actual_duration_minutes, completed_at")
    .in("user_id", memberIds)
    .gte("created_at", startDate.toISOString());

  // Aggregate by user
  const userStats = {};
  for (const session of sessions || []) {
    if (!userStats[session.user_id]) {
      userStats[session.user_id] = {
        completed: 0,
        total: 0,
        totalMinutes: 0,
        lastCompleted: null,
      };
    }
    userStats[session.user_id].total++;
    if (session.status === "completed") {
      userStats[session.user_id].completed++;
      userStats[session.user_id].totalMinutes +=
        session.actual_duration_minutes || 0;
      if (
        !userStats[session.user_id].lastCompleted ||
        session.completed_at > userStats[session.user_id].lastCompleted
      ) {
        userStats[session.user_id].lastCompleted = session.completed_at;
      }
    }
  }

  // Build leaderboard
  const leaderboard = (members || [])
    .map((m) => ({
      userId: m.user_id,
      name: m.user
        ? `${m.user.first_name || ""} ${m.user.last_name || ""}`.trim()
        : "Unknown",
      completedSessions: userStats[m.user_id]?.completed || 0,
      totalSessions: userStats[m.user_id]?.total || 0,
      completionRate:
        userStats[m.user_id]?.total > 0
          ? Math.round(
              (userStats[m.user_id].completed / userStats[m.user_id].total) *
                100,
            )
          : 0,
      totalMinutes: userStats[m.user_id]?.totalMinutes || 0,
      lastCompleted: userStats[m.user_id]?.lastCompleted,
    }))
    .sort((a, b) => {
      // Sort by completed sessions first, then completion rate
      if (b.completedSessions !== a.completedSessions) {
        return b.completedSessions - a.completedSessions;
      }
      return b.completionRate - a.completionRate;
    })
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return leaderboard;
}

/**
 * Refresh analytics cache for a team
 * @param {string} coachId - Coach user ID
 * @param {string} teamId - Team ID
 * @returns {Object} - Refreshed cache
 */
async function refreshAnalyticsCache(coachId, teamId) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Compute and cache weekly analytics
  const { data: weeklyCache } = await supabaseAdmin.rpc(
    "compute_coach_analytics",
    {
      p_coach_id: coachId,
      p_team_id: teamId,
      p_period_type: "weekly",
      p_period_start: weekStart.toISOString().split("T")[0],
      p_period_end: today.toISOString().split("T")[0],
    },
  );

  // Compute and cache monthly analytics
  const { data: monthlyCache } = await supabaseAdmin.rpc(
    "compute_coach_analytics",
    {
      p_coach_id: coachId,
      p_team_id: teamId,
      p_period_type: "monthly",
      p_period_start: monthStart.toISOString().split("T")[0],
      p_period_end: today.toISOString().split("T")[0],
    },
  );

  return {
    weekly: weeklyCache,
    monthly: monthlyCache,
    computedAt: new Date().toISOString(),
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "coach-analytics",
    allowedMethods: ["GET", "POST"],
rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      checkEnvVars();

      // Verify coach access
      const { isCoach, teamIds } = await verifyCoachAccess(userId);
      if (!isCoach) {
        return createErrorResponse(
          "Only coaches can access analytics",
          403,
          "not_authorized",
          requestId,
        );
      }

      const { path } = event;
      const method = event.httpMethod;
      const params = event.queryStringParameters || {};

      // Parse path
      const pathParts = path
        .replace(/^\/?(\.netlify\/functions\/)?coach-analytics\/?/, "")
        .split("/")
        .filter(Boolean);
      const resource = pathParts[0] || "";
      const resourceId = pathParts[1] || null;

      try {
        // GET /api/coach-analytics/overview - Dashboard overview
        if (method === "GET" && resource === "overview") {
          const overview = await getOverviewMetrics(userId, teamIds, params);
          return createSuccessResponse(overview, requestId);
        }

        // GET /api/coach-analytics/classification - Classification breakdown
        if (method === "GET" && resource === "classification") {
          const memberIds = await getTeamMemberIds(teamIds);
          const breakdown = await getClassificationBreakdown(memberIds, params);
          return createSuccessResponse(breakdown, requestId);
        }

        // GET /api/coach-analytics/trends - Trends over time
        if (method === "GET" && resource === "trends") {
          const memberIds = await getTeamMemberIds(teamIds);
          const trends = await getTrends(memberIds, {
            days: parseBoundedPositiveInt(params.days, "days", {
              min: 1,
              max: 365,
            }) ?? 30,
          });
          return createSuccessResponse(trends, requestId);
        }

        // GET /api/coach-analytics/team/:teamId - Team-specific analytics
        if (method === "GET" && resource === "team" && resourceId) {
          // Verify coach has access to this team
          if (!teamIds.includes(resourceId)) {
            return createErrorResponse(
              "Not authorized to view this team",
              403,
              "not_authorized",
              requestId,
            );
          }

          const teamAnalytics = await getTeamAnalytics(resourceId, params);
          return createSuccessResponse(teamAnalytics, requestId);
        }

        // GET /api/coach-analytics/leaderboard/:teamId - Team leaderboard
        if (method === "GET" && resource === "leaderboard" && resourceId) {
          if (!teamIds.includes(resourceId)) {
            return createErrorResponse(
              "Not authorized to view this team",
              403,
              "not_authorized",
              requestId,
            );
          }

          const leaderboard = await getTeamLeaderboard(resourceId, {
            limit: parseBoundedPositiveInt(params.limit, "limit", {
              min: 1,
              max: 100,
            }) ?? 10,
            days: parseBoundedPositiveInt(params.days, "days", {
              min: 1,
              max: 365,
            }) ?? 30,
          });
          return createSuccessResponse({ leaderboard }, requestId);
        }

        // POST /api/coach-analytics/refresh - Refresh cache
        if (method === "POST" && resource === "refresh") {
          let body;
          try {
            body = parseJsonObjectBody(event.body);
          } catch (error) {
            if (
              error?.code === "INVALID_JSON_BODY" &&
              error?.message === "Invalid JSON in request body"
            ) {
              return createErrorResponse(
                "Invalid JSON in request body",
                400,
                "invalid_json",
                requestId,
              );
            }
            return createErrorResponse(
              error.message || "Request body must be an object",
              422,
              "validation_error",
              requestId,
            );
          }
          if (
            body.teamId !== undefined &&
            (typeof body.teamId !== "string" || body.teamId.trim().length === 0)
          ) {
            return createErrorResponse(
              "teamId must be a non-empty string when provided",
              422,
              "validation_error",
              requestId,
            );
          }

          const targetTeamId = body.teamId || teamIds[0];
          if (!teamIds.includes(targetTeamId)) {
            return createErrorResponse(
              "Not authorized for this team",
              403,
              "not_authorized",
              requestId,
            );
          }

          const cache = await refreshAnalyticsCache(userId, targetTeamId);
          return createSuccessResponse(
            {
              message: "Analytics cache refreshed",
              cache,
            },
            requestId,
          );
        }

        // Default: return overview
        if (method === "GET" && !resource) {
          const overview = await getOverviewMetrics(userId, teamIds, params);
          return createSuccessResponse(overview, requestId);
        }

        return createErrorResponse("Endpoint not found", 404, "not_found", requestId);
      } catch (error) {
        if (error.code === "invalid_json") {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId,
          );
        }
        if (
          error.message?.includes("must be an integer between") ||
          error.message?.includes("Request body must be an object")
        ) {
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }
        console.error("[Coach Analytics] Error:", error);
        return createErrorResponse(
          error.message || "Failed to fetch analytics",
          500,
          "internal_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
