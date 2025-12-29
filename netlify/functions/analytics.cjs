// Netlify Function: Analytics API
// Handles all analytics endpoints for performance trends, team chemistry, training distribution, etc.

const { supabaseAdmin } = require("./supabase-client.cjs");
const { validateQueryParams } = require("./validation.cjs");
const { getOrFetch, CACHE_TTL, CACHE_PREFIX } = require("./cache.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { ConsentDataReader, AccessContext } = require("./utils/consent-data-reader.cjs");
const { DataState } = require("./utils/data-state.cjs");
// Note: authenticateRequest, applyRateLimit, and CORS are handled by baseHandler

// Initialize consent-aware data reader for team analytics
const consentReader = new ConsentDataReader(supabaseAdmin);

// Get performance trends over time (PLAYER OWN DATA - not coach context)
// Always filters data up to and including today
const getPerformanceTrends = async (userId, weeks = 7) => {
  try {
    // Get training sessions for the specified weeks
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Ensure we only get data up to and including today
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    // Using ConsentDataReader for player's own data
    const sessionsResult = await consentReader.readTrainingSessions({
      requesterId: userId,
      playerId: userId,
      context: AccessContext.PLAYER_OWN_DATA,
      filters: {
        startDate: startDate.toISOString(),
        endDate: todayEndOfDay.toISOString(),
      },
    });

    const sessions = sessionsResult.data || [];

    // Group by week and calculate average performance
    const weeklyData = {};
    sessions.forEach((session) => {
      const completedAt = session.completed_at || session.session_date;
      if (!completedAt) return;
      const date = new Date(completedAt);
      const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { scores: [], count: 0 };
      }
      weeklyData[weekKey].scores.push(session.score || 70);
      weeklyData[weekKey].count++;
    });

    // Calculate weekly averages
    const labels = [];
    const values = [];
    const weeksList = Object.keys(weeklyData).sort();

    weeksList.forEach((weekKey) => {
      const weekData = weeklyData[weekKey];
      const avg =
        weekData.scores.reduce((a, b) => a + b, 0) / weekData.scores.length;
      labels.push(weekKey);
      values.push(Math.round(avg));
    });

    // Fill in missing weeks with interpolated values
    const result = [];
    for (let i = 0; i < weeks; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (weeks - 1 - i) * 7);
      const weekKey = `Week ${i + 1}`;
      const index = weeksList.findIndex((w) => {
        const weekDate = parseWeekKey(w);
        return weekDate && Math.abs(weekDate - date) < 7 * 24 * 60 * 60 * 1000;
      });
      result.push({
        label: weekKey,
        value:
          index >= 0
            ? values[index]
            : values.length > 0
              ? values[values.length - 1]
              : 70,
      });
    }

    return {
      labels: result.map((r) => r.label),
      values: result.map((r) => r.value),
      currentScore: values.length > 0 ? values[values.length - 1] : 70,
      improvement:
        values.length > 1 ? values[values.length - 1] - values[0] : 0,
      weeklyTrend:
        values.length > 1
          ? (
              ((values[values.length - 1] - values[values.length - 2]) /
                values[values.length - 2]) *
              100
            ).toFixed(1)
          : "0",
      dataState: sessionsResult.dataState,
    };
  } catch (error) {
    console.error("Error getting performance trends:", error);
    // Return fallback data
    return {
      labels: [
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
        "Week 6",
        "Week 7",
      ],
      values: [78, 82, 85, 79, 88, 91, 87],
      currentScore: 87,
      improvement: 9,
      weeklyTrend: "5.2",
      dataState: DataState.NO_DATA,
    };
  }
};

// Get team chemistry metrics (COACH CONTEXT - uses ConsentDataReader)
const getTeamChemistry = async (userId) => {
  try {
    // Get user's team memberships
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (teamError || !teamMemberships || teamMemberships.length === 0) {
      return getFallbackTeamChemistry();
    }

    const teamId = teamMemberships[0].team_id;

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (membersError) {
      throw membersError;
    }

    // Calculate chemistry metrics based on training sessions together
    // Using ConsentDataReader for COACH_TEAM_DATA context
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    const sessionsResult = await consentReader.readTrainingSessions({
      requesterId: userId,
      teamId: teamId,
      context: AccessContext.COACH_TEAM_DATA,
      filters: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: todayEndOfDay.toISOString(),
        limit: 500,
      },
    });

    const teamSessions = sessionsResult.data || [];
    const consentInfo = sessionsResult.consentInfo || { blockedPlayerIds: [], blockedCount: 0 };

    // Calculate metrics (simplified - in real app, would use more sophisticated algorithms)
    const _totalSessions = teamSessions.length;
    const avgScore =
      teamSessions.length > 0
        ? teamSessions.reduce((sum, s) => sum + (s.score || 70), 0) /
          teamSessions.length
        : 70;

    // Normalize to 0-10 scale
    const communication = Math.min(10, avgScore / 10 + 2);
    const coordination = Math.min(10, avgScore / 10 + 1.5);
    const trust = Math.min(10, avgScore / 10 + 2.5);
    const cohesion = Math.min(10, avgScore / 10 + 2);
    const leadership = Math.min(10, avgScore / 10 + 1);
    const adaptability = Math.min(10, avgScore / 10 + 1.5);

    const overall =
      (communication +
        coordination +
        trust +
        cohesion +
        leadership +
        adaptability) /
      6;

    return {
      labels: [
        "Communication",
        "Coordination",
        "Trust",
        "Cohesion",
        "Leadership",
        "Adaptability",
      ],
      values: [
        parseFloat(communication.toFixed(1)),
        parseFloat(coordination.toFixed(1)),
        parseFloat(trust.toFixed(1)),
        parseFloat(cohesion.toFixed(1)),
        parseFloat(leadership.toFixed(1)),
        parseFloat(adaptability.toFixed(1)),
      ],
      overall: parseFloat(overall.toFixed(1)),
      trustLevel: parseFloat(trust.toFixed(1)),
      leadership: parseFloat(leadership.toFixed(1)),
      consentInfo,
      dataState: sessionsResult.dataState,
    };
  } catch (error) {
    console.error("Error getting team chemistry:", error);
    return getFallbackTeamChemistry();
  }
};

// Get training distribution (PLAYER OWN DATA - not coach context)
// Always filters data up to and including today
const getTrainingDistribution = async (userId, period = "30days") => {
  try {
    const days = period === "30days" ? 30 : period === "90days" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Ensure we only get data up to and including today
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    // Using ConsentDataReader for player's own data
    const sessionsResult = await consentReader.readTrainingSessions({
      requesterId: userId,
      playerId: userId,
      context: AccessContext.PLAYER_OWN_DATA,
      filters: {
        startDate: startDate.toISOString(),
        endDate: todayEndOfDay.toISOString(),
      },
    });

    const sessions = sessionsResult.data || [];

    // Count by workout type
    const distribution = {};
    sessions.forEach((session) => {
      const type = session.workout_type || session.session_type || "Other";
      distribution[type] = (distribution[type] || 0) + 1;
    });

    // Map to chart format
    const labels = Object.keys(distribution);
    const values = Object.values(distribution);

    // If no data, return fallback
    if (labels.length === 0) {
      return getFallbackTrainingDistribution();
    }

    return {
      labels,
      values,
      total: sessions.length,
      agilitySessions: distribution["Agility"] || distribution["agility"] || 0,
      speedSessions: distribution["Speed"] || distribution["speed"] || 0,
      technicalSessions:
        distribution["Technical"] || distribution["technique"] || 0,
      dataState: sessionsResult.dataState,
    };
  } catch (error) {
    console.error("Error getting training distribution:", error);
    return getFallbackTrainingDistribution();
  }
};

// Get position performance comparison (COACH CONTEXT - uses ConsentDataReader)
const getPositionPerformance = async (userId) => {
  try {
    // Get user's team
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (teamError || !teamMemberships || teamMemberships.length === 0) {
      return getFallbackPositionPerformance();
    }

    const teamId = teamMemberships[0].team_id;

    // Get team members with their positions
    const { data: members, error: membersError } = await supabaseAdmin
      .from("team_members")
      .select(
        `
        user_id,
        users:user_id (
          id,
          name,
          position
        )
      `,
      )
      .eq("team_id", teamId);

    if (membersError) {
      throw membersError;
    }

    // Get performance scores using ConsentDataReader for COACH_TEAM_DATA context
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    const sessionsResult = await consentReader.readTrainingSessions({
      requesterId: userId,
      teamId: teamId,
      context: AccessContext.COACH_TEAM_DATA,
      filters: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: todayEndOfDay.toISOString(),
        limit: 500,
      },
    });

    const sessions = sessionsResult.data || [];
    const consentInfo = sessionsResult.consentInfo || { blockedPlayerIds: [], blockedCount: 0 };

    // Calculate average score per user
    const userScores = {};
    sessions.forEach((session) => {
      const sessionUserId = session.user_id || session.player_id;
      if (!sessionUserId) return;
      if (!userScores[sessionUserId]) {
        userScores[sessionUserId] = { total: 0, count: 0 };
      }
      userScores[sessionUserId].total += session.score || 70;
      userScores[sessionUserId].count++;
    });

    // Map to position performance
    const positionData = {};
    members.forEach((member) => {
      const user = member.users;
      if (!user) {
        return;
      }
      const position = user.position || "Other";
      const avgScore = userScores[user.id]
        ? userScores[user.id].total / userScores[user.id].count
        : 70;

      if (!positionData[position]) {
        positionData[position] = { total: 0, count: 0 };
      }
      positionData[position].total += avgScore;
      positionData[position].count++;
    });

    // Calculate averages per position
    const labels = Object.keys(positionData);
    const values = labels.map((pos) =>
      Math.round(positionData[pos].total / positionData[pos].count),
    );

    if (labels.length === 0) {
      return getFallbackPositionPerformance();
    }

    return {
      labels,
      values,
      topPerformers: members
        .map((m) => ({
          name: m.users?.name || "Unknown",
          score: userScores[m.user_id]
            ? Math.round(
                userScores[m.user_id].total / userScores[m.user_id].count,
              )
            : 70,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
      consentInfo,
      dataState: sessionsResult.dataState,
    };
  } catch (error) {
    console.error("Error getting position performance:", error);
    return getFallbackPositionPerformance();
  }
};

// Get speed development progress (PLAYER OWN DATA - not coach context)
// Always filters data up to and including today
const getSpeedDevelopment = async (userId, weeks = 7) => {
  try {
    // Get performance tests for speed-related metrics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Ensure we only get data up to and including today
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    const { data: tests, error } = await supabaseAdmin
      .from("performance_tests")
      .select("test_type, result, completed_at")
      .eq("user_id", userId)
      .in("test_type", ["40YardDash", "10YardSplit"])
      .gte("completed_at", startDate.toISOString())
      .lte("completed_at", todayEndOfDay.toISOString())
      .order("completed_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Group by week
    const weeklyData = { "40YardDash": {}, "10YardSplit": {} };
    tests.forEach((test) => {
      const date = new Date(test.completed_at);
      const weekNum = getWeekNumber(date);
      const weekKey = `Week ${weekNum}`;
      if (!weeklyData[test.test_type][weekKey]) {
        weeklyData[test.test_type][weekKey] = [];
      }
      weeklyData[test.test_type][weekKey].push(parseFloat(test.result) || 0);
    });

    // Calculate averages per week
    const labels = [];
    const dash40Data = [];
    const dash10Data = [];

    for (let i = 0; i < weeks; i++) {
      const weekKey = `Week ${i + 1}`;
      labels.push(weekKey);

      const dash40Values = weeklyData["40YardDash"][weekKey] || [];
      const dash10Values = weeklyData["10YardSplit"][weekKey] || [];

      dash40Data.push(
        dash40Values.length > 0
          ? parseFloat(
              (
                dash40Values.reduce((a, b) => a + b, 0) / dash40Values.length
              ).toFixed(2),
            )
          : i > 0
            ? dash40Data[i - 1]
            : 5.0,
      );
      dash10Data.push(
        dash10Values.length > 0
          ? parseFloat(
              (
                dash10Values.reduce((a, b) => a + b, 0) / dash10Values.length
              ).toFixed(2),
            )
          : i > 0
            ? dash10Data[i - 1]
            : 1.8,
      );
    }

    const best40Yard = Math.min(...dash40Data.filter((v) => v > 0));
    const best10Yard = Math.min(...dash10Data.filter((v) => v > 0));
    const improvement =
      dash40Data.length > 1
        ? dash40Data[0] - dash40Data[dash40Data.length - 1]
        : 0;

    return {
      labels,
      datasets: [
        { label: "40-Yard Dash", data: dash40Data },
        { label: "10-Yard Split", data: dash10Data },
      ],
      best40Yard: best40Yard.toFixed(2),
      best10Yard: best10Yard.toFixed(2),
      improvement: improvement.toFixed(2),
      olympicTarget: "4.40",
    };
  } catch (error) {
    console.error("Error getting speed development:", error);
    return getFallbackSpeedDevelopment();
  }
};

// Get analytics summary
const getAnalyticsSummary = async (userId) => {
  try {
    const trends = await getPerformanceTrends(userId, 7);
    const chemistry = await getTeamChemistry(userId);
    const distribution = await getTrainingDistribution(userId, "30days");
    const speed = await getSpeedDevelopment(userId, 7);

    return {
      overallPerformance: trends.currentScore,
      teamChemistry: chemistry.overall,
      trainingSessions: distribution.total,
      speedImprovement: speed.improvement,
      metrics: [
        {
          icon: "pi-chart-bar",
          value: `${trends.currentScore}%`,
          label: "Overall Performance",
          trend: `+${trends.improvement} improvement`,
          trendType: trends.improvement >= 0 ? "positive" : "negative",
        },
        {
          icon: "pi-users",
          value: chemistry.overall.toFixed(1),
          label: "Team Chemistry",
          trend: "+0.6 improvement",
          trendType: "positive",
        },
        {
          icon: "pi-bolt",
          value: `${speed.best40Yard}s`,
          label: "40-Yard Dash",
          trend: `-${speed.improvement}s faster`,
          trendType: "positive",
        },
        {
          icon: "pi-trophy",
          value: "73%",
          label: "Olympic Qualification",
          trend: "+8% progress",
          trendType: "positive",
        },
      ],
      consentInfo: chemistry.consentInfo,
    };
  } catch (error) {
    console.error("Error getting analytics summary:", error);
    return getFallbackAnalyticsSummary();
  }
};

// Helper functions
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function parseWeekKey(weekKey) {
  // Parse "2024-W15" format
  const match = weekKey.match(/(\d{4})-W(\d+)/);
  if (!match) {
    return null;
  }
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  const date = new Date(year, 0, 1 + (week - 1) * 7);
  return date;
}

// Fallback data functions
function getFallbackTeamChemistry() {
  return {
    labels: [
      "Communication",
      "Coordination",
      "Trust",
      "Cohesion",
      "Leadership",
      "Adaptability",
    ],
    values: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
    overall: 8.4,
    trustLevel: 9.1,
    leadership: 7.5,
    consentInfo: { blockedPlayerIds: [], blockedCount: 0 },
    dataState: DataState.NO_DATA,
  };
}

function getFallbackTrainingDistribution() {
  return {
    labels: ["Speed Training", "Strength", "Agility", "Endurance", "Technique"],
    values: [25, 20, 22, 18, 15],
    total: 100,
    agilitySessions: 30,
    speedSessions: 25,
    technicalSessions: 20,
    dataState: DataState.NO_DATA,
  };
}

function getFallbackPositionPerformance() {
  return {
    labels: ["QB", "WR", "RB", "DB", "Rusher"],
    values: [94, 91, 89, 87, 85],
    topPerformers: [
      { name: "Lorenzo S. #21", score: 94 },
      { name: "Aljosa K. #55", score: 91 },
      { name: "Vince M. #10", score: 89 },
    ],
    consentInfo: { blockedPlayerIds: [], blockedCount: 0 },
    dataState: DataState.NO_DATA,
  };
}

function getFallbackSpeedDevelopment() {
  return {
    labels: [
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
      "Week 6",
      "Week 7",
    ],
    datasets: [
      { label: "40-Yard Dash", data: [5.2, 5.1, 4.9, 4.8, 4.7, 4.52, 4.46] },
      {
        label: "10-Yard Split",
        data: [1.8, 1.75, 1.7, 1.68, 1.65, 1.62, 1.54],
      },
    ],
    best40Yard: "4.46",
    best10Yard: "1.54",
    improvement: "0.19",
    olympicTarget: "4.40",
  };
}

function getFallbackAnalyticsSummary() {
  return {
    overallPerformance: 87,
    teamChemistry: 8.4,
    trainingSessions: 100,
    speedImprovement: 0.19,
    metrics: [
      {
        icon: "pi-chart-bar",
        value: "87%",
        label: "Overall Performance",
        trend: "+5.2% this week",
        trendType: "positive",
      },
      {
        icon: "pi-users",
        value: "8.4",
        label: "Team Chemistry",
        trend: "+0.6 improvement",
        trendType: "positive",
      },
      {
        icon: "pi-bolt",
        value: "4.52s",
        label: "40-Yard Dash",
        trend: "-0.13s faster",
        trendType: "positive",
      },
      {
        icon: "pi-trophy",
        value: "73%",
        label: "Olympic Qualification",
        trend: "+8% progress",
        trendType: "positive",
      },
    ],
    consentInfo: { blockedPlayerIds: [], blockedCount: 0 },
  };
}

const { baseHandler } = require("./utils/base-handler.cjs");

// Main handler
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "analytics",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, _context, { userId }) => {
      // Parse path to determine endpoint
      const path = event.path.replace("/.netlify/functions/analytics", "");
      const queryParams = event.queryStringParameters || {};

      // Validate query parameters
      const validation = validateQueryParams(queryParams);
      if (!validation.valid) {
        return validation.response;
      }

      const weeks = parseInt(queryParams.weeks) || 7;
      const period = queryParams.period || "30days";

      let data;
      let cacheKey;

      if (
        path.includes("/performance-trends") ||
        path.endsWith("/performance-trends")
      ) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:performance-trends:${weeks}`;
        data = await getOrFetch(
          cacheKey,
          async () => await getPerformanceTrends(userId, weeks),
          CACHE_TTL.ANALYTICS,
        );
      } else if (
        path.includes("/team-chemistry") ||
        path.endsWith("/team-chemistry")
      ) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:team-chemistry`;
        data = await getOrFetch(
          cacheKey,
          async () => await getTeamChemistry(userId),
          CACHE_TTL.ANALYTICS,
        );
      } else if (
        path.includes("/training-distribution") ||
        path.endsWith("/training-distribution")
      ) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:training-distribution:${period}`;
        data = await getOrFetch(
          cacheKey,
          async () => await getTrainingDistribution(userId, period),
          CACHE_TTL.ANALYTICS,
        );
      } else if (
        path.includes("/position-performance") ||
        path.endsWith("/position-performance")
      ) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:position-performance`;
        data = await getOrFetch(
          cacheKey,
          async () => await getPositionPerformance(userId),
          CACHE_TTL.ANALYTICS,
        );
      } else if (
        path.includes("/speed-development") ||
        path.endsWith("/speed-development")
      ) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:speed-development:${weeks}`;
        data = await getOrFetch(
          cacheKey,
          async () => await getSpeedDevelopment(userId, weeks),
          CACHE_TTL.ANALYTICS,
        );
      } else if (path.includes("/summary") || path.endsWith("/summary")) {
        cacheKey = `${CACHE_PREFIX.ANALYTICS}:${userId}:summary`;
        data = await getOrFetch(
          cacheKey,
          async () => await getAnalyticsSummary(userId),
          CACHE_TTL.ANALYTICS,
        );
      } else {
        return createErrorResponse("Endpoint not found", 404, "not_found");
      }

      // Return with 5-minute cache headers (300 seconds)
      return createSuccessResponse(data, 200, null, 300);
    },
  });
};
