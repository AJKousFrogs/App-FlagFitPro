/**
 * Analytics Routes API
 * Provides data for Chart.js visualizations and analytics dashboard
 *
 * @module routes/analyticsRoutes
 * @version 2.1.0
 */

import express from "express";
import dotenv from "dotenv";
import { supabase, pool, checkDatabaseHealth } from "./utils/database.js";
import {
  safeQuery,
  safeParseInt,
  safeFormatDate,
} from "./utils/query-helper.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  validateUserId,
  validateWeeks,
  validatePeriod,
  createErrorResponse,
  sendError,
  sendSuccess,
  safeParseFloat,
  safeAverage,
} from "./utils/validation.js";

dotenv.config();

const router = express.Router();
const ROUTE_NAME = "analytics";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Wrapper for safeQuery that uses this route's pool and name
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters for parameterized queries
 * @returns {Promise<object>} Query result object
 */
async function executeQuery(query, params = []) {
  return await safeQuery(pool, query, params, ROUTE_NAME);
}

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * GET /performance-trends
 * Get performance trends data for line chart visualization
 * @query {string} userId - User ID (optional, defaults to '1')
 * @query {number} weeks - Number of weeks to analyze (1-52, default: 7)
 * @returns {object} Performance trends data formatted for Chart.js
 */
router.get("/performance-trends", async (req, res) => {
  try {
    const userIdParam = req.query.userId || "1";

    if (req.query.userId) {
      const userIdValidation = validateUserId(userIdParam);
      if (!userIdValidation.isValid) {
        return sendError(res, userIdValidation.error, "INVALID_USER_ID", 400);
      }
    }

    const weeksValidation = validateWeeks(req.query.weeks, 1, 52);
    if (!weeksValidation.isValid) {
      return sendError(res, weeksValidation.error, "INVALID_WEEKS", 400);
    }

    const userId = userIdParam;
    const weeks = weeksValidation.weeks || 7;

    let performanceData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);

      const { data } = await supabase
        .from("performance_metrics")
        .select("created_at, performance_score, load_time")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (data?.length > 0) {
        // Group by week
        const weeklyData = {};
        data.forEach((row) => {
          const weekStart = new Date(row.created_at);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split("T")[0];

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { scores: [], loadTimes: [], count: 0 };
          }
          weeklyData[weekKey].scores.push(row.performance_score || 0);
          weeklyData[weekKey].loadTimes.push(row.load_time || 1000);
          weeklyData[weekKey].count++;
        });

        performanceData = Object.entries(weeklyData).map(([week, data]) => ({
          week_start: week,
          avg_score: safeAverage(data.scores, 8.5),
          sessions_count: data.count,
          avg_load_time: safeAverage(data.loadTimes, 1000),
        }));
      }
    } else if (pool) {
      // Use parameterized query to prevent SQL injection
      const query = `
        SELECT 
          DATE_TRUNC('week', created_at) as week_start,
          AVG(performance_score) as avg_score,
          COUNT(*) as sessions_count,
          AVG(load_time) as avg_load_time
        FROM performance_metrics 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week_start ASC
      `;

      const result = await executeQuery(query, [userId, weeks.toString()]);
      performanceData = result.rows;
    }

    // Format data for Chart.js
    const weeksData = [];
    const overallScores = [];
    const trainingScores = [];

    performanceData.forEach((row, index) => {
      weeksData.push(`Week ${index + 1}`);
      const normalizedScore = Math.min(
        100,
        Math.max(0, (row.avg_score || 8.5) * 10),
      );
      overallScores.push(Math.round(normalizedScore));

      const sessionEffectiveness = Math.min(
        100,
        Math.max(
          0,
          ((row.sessions_count || 0) / 10) * 50 +
            (1 - (row.avg_load_time || 1000) / 2000) * 50,
        ),
      );
      trainingScores.push(Math.round(sessionEffectiveness));
    });

    // Fill missing weeks with interpolated data
    while (weeksData.length < weeks) {
      const weekIndex = weeksData.length;
      weeksData.push(`Week ${weekIndex + 1}`);

      if (weekIndex === 0) {
        overallScores.push(78);
        trainingScores.push(75);
      } else {
        const prevOverall = overallScores[weekIndex - 1] || 78;
        const prevTraining = trainingScores[weekIndex - 1] || 75;

        const newOverall = Math.min(
          100,
          Math.max(0, prevOverall + (Math.random() * 6 - 2)),
        );
        const newTraining = Math.min(
          100,
          Math.max(0, prevTraining + (Math.random() * 5 - 1)),
        );

        overallScores.push(Math.round(newOverall));
        trainingScores.push(Math.round(newTraining));
      }
    }

    return sendSuccess(res, {
      weeks: weeksData,
      overallScores,
      trainingScores,
      totalSessions: performanceData.reduce(
        (sum, row) => sum + (row.sessions_count || 0),
        0,
      ),
      averageScore: Math.round(safeAverage(overallScores, 78)),
    });
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} performance trends error:`,
      error,
    );
    return sendError(
      res,
      "Failed to fetch performance trends",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /team-chemistry
 * Get team chemistry data for radar chart
 */
router.get("/team-chemistry", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let chemistryData = null;

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data } = await supabase
        .from("team_chemistry_metrics")
        .select(
          "communication_score, coordination_score, trust_score, cohesion_score, overall_chemistry_score",
        )
        .gte("metric_date", startDate.toISOString());

      if (data?.length > 0) {
        chemistryData = {
          avg_communication: safeAverage(
            data.map((d) => d.communication_score),
            8.5,
          ),
          avg_coordination: safeAverage(
            data.map((d) => d.coordination_score),
            7.8,
          ),
          avg_trust: safeAverage(
            data.map((d) => d.trust_score),
            9.1,
          ),
          avg_cohesion: safeAverage(
            data.map((d) => d.cohesion_score),
            8.2,
          ),
          avg_overall: safeAverage(
            data.map((d) => d.overall_chemistry_score),
            8.4,
          ),
        };
      }
    } else if (pool) {
      const query = `
        SELECT 
          AVG(communication_score) as avg_communication,
          AVG(coordination_score) as avg_coordination,
          AVG(trust_score) as avg_trust,
          AVG(cohesion_score) as avg_cohesion,
          AVG(overall_chemistry_score) as avg_overall
        FROM team_chemistry_metrics 
        WHERE team_id IN (
          SELECT team_id FROM team_members WHERE player_id = $1
        )
        AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const result = await executeQuery(query, [userId]);
      chemistryData = result.rows[0];
    }

    chemistryData ||= {};

    const leadershipScore = Math.min(
      10,
      Math.max(
        1,
        (chemistryData.avg_communication || 8.5) * 0.4 +
          (chemistryData.avg_coordination || 7.8) * 0.3 +
          (chemistryData.avg_trust || 9.1) * 0.3,
      ),
    );

    const adaptabilityScore = Math.min(
      10,
      Math.max(
        1,
        (chemistryData.avg_coordination || 7.8) * 0.5 +
          (chemistryData.avg_cohesion || 8.2) * 0.5,
      ),
    );

    const currentScores = [
      chemistryData.avg_communication || 8.5,
      chemistryData.avg_coordination || 7.8,
      chemistryData.avg_trust || 9.1,
      chemistryData.avg_cohesion || 8.2,
      leadershipScore,
      adaptabilityScore,
    ];

    const targetScores = currentScores.map((score) => {
      const target = Math.min(10, score + 0.5 + Math.random() * 0.5);
      return Math.max(1, target);
    });

    return sendSuccess(res, {
      metrics: [
        "Communication",
        "Coordination",
        "Trust",
        "Cohesion",
        "Leadership",
        "Adaptability",
      ],
      currentScores: currentScores.map((score) => Math.round(score * 10) / 10),
      targetScores: targetScores.map((score) => Math.round(score * 10) / 10),
      overallScore: Math.round((chemistryData.avg_overall || 8.4) * 10) / 10,
      lastUpdated: safeFormatDate(new Date()),
    });
  } catch (error) {
    serverLogger.error("Team chemistry error:", error);
    return sendError(
      res,
      "Failed to fetch team chemistry data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /training-distribution
 * Get training distribution data for pie chart
 */
router.get("/training-distribution", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    const periodValidation = validatePeriod(req.query.period);
    if (!periodValidation.isValid) {
      return sendError(res, periodValidation.error, "INVALID_PERIOD", 400);
    }

    const { period, days } = periodValidation;
    let trainingData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from("training_analytics")
        .select("training_type, duration_minutes, performance_score")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString());

      if (data?.length > 0) {
        // Group by training type
        const grouped = {};
        data.forEach((row) => {
          const type = row.training_type || "other";
          if (!grouped[type]) {
            grouped[type] = { count: 0, durations: [], performances: [] };
          }
          grouped[type].count++;
          grouped[type].durations.push(row.duration_minutes || 45);
          grouped[type].performances.push(row.performance_score || 8.5);
        });

        trainingData = Object.entries(grouped).map(([type, data]) => ({
          training_type: type,
          session_count: data.count,
          avg_duration: safeAverage(data.durations, 45),
          avg_performance: safeAverage(data.performances, 8.5),
        }));
      }
    } else if (pool) {
      // Use parameterized query
      const query = `
        SELECT 
          training_type,
          COUNT(*) as session_count,
          AVG(duration_minutes) as avg_duration,
          AVG(performance_score) as avg_performance
        FROM training_analytics 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - ($2 || ' days')::INTERVAL
        GROUP BY training_type
        ORDER BY session_count DESC
      `;

      const result = await executeQuery(query, [userId, days.toString()]);
      trainingData = result.rows;
    }

    const trainingTypeMap = {
      agility: "Agility Training",
      speed: "Speed Development",
      technical: "Technical Skills",
      strength: "Strength Training",
      recovery: "Recovery Sessions",
      passing: "Passing Drills",
      catching: "Catching Practice",
      defense: "Defensive Training",
    };

    const trainingTypes = [];
    const sessionCounts = [];
    const avgDurations = [];
    const avgPerformances = [];

    trainingData.forEach((row) => {
      const displayName =
        trainingTypeMap[row.training_type] || row.training_type;
      trainingTypes.push(displayName);
      sessionCounts.push(safeParseInt(row.session_count, 0));
      avgDurations.push(Math.round(safeParseFloat(row.avg_duration, 45)));
      avgPerformances.push(
        Math.round(safeParseFloat(row.avg_performance, 8.5) * 10) / 10,
      );
    });

    // Fill with default data if not enough sessions
    if (trainingTypes.length < 5) {
      const defaultTypes = [
        "Agility Training",
        "Speed Development",
        "Technical Skills",
        "Strength Training",
        "Recovery Sessions",
      ];
      const defaultCounts = [30, 25, 20, 15, 10];

      defaultTypes.forEach((type, index) => {
        if (!trainingTypes.includes(type)) {
          trainingTypes.push(type);
          sessionCounts.push(defaultCounts[index]);
          avgDurations.push(45);
          avgPerformances.push(8.5);
        }
      });
    }

    return sendSuccess(res, {
      trainingTypes: trainingTypes.slice(0, 5),
      sessionCounts: sessionCounts.slice(0, 5),
      avgDurations: avgDurations.slice(0, 5),
      avgPerformances: avgPerformances.slice(0, 5),
      totalSessions: sessionCounts.reduce((sum, count) => sum + count, 0),
      period,
    });
  } catch (error) {
    serverLogger.error("Training distribution error:", error);
    return sendError(
      res,
      "Failed to fetch training distribution",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /position-performance
 * Get position performance data for bar chart
 */
router.get("/position-performance", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let positionData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Get current position
      const { data: positionHistory } = await supabase
        .from("player_position_history")
        .select("position_id, flag_football_positions(position_name)")
        .eq("player_id", userId)
        .eq("is_current", true);

      if (positionHistory?.length > 0) {
        const _positionIds = positionHistory.map((p) => p.position_id);

        const { data: analytics } = await supabase
          .from("training_analytics")
          .select("performance_score")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString());

        if (analytics?.length > 0) {
          positionData = positionHistory.map((p) => ({
            position_name:
              p.flag_football_positions?.position_name || "Unknown",
            avg_performance: safeAverage(
              analytics.map((a) => a.performance_score),
              8.5,
            ),
          }));
        }
      }
    } else if (pool) {
      const query = `
        SELECT 
          p.position_name,
          AVG(ta.performance_score) as avg_performance,
          COUNT(*) as sessions_count,
          AVG(ta.duration_minutes) as avg_duration
        FROM training_analytics ta
        JOIN player_position_history pph ON ta.user_id = pph.player_id
        JOIN flag_football_positions p ON pph.position_id = p.id
        WHERE ta.user_id = $1 
        AND pph.is_current = true
        AND ta.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.position_name
        ORDER BY avg_performance DESC
      `;

      const result = await executeQuery(query, [userId]);
      positionData = result.rows;
    }

    // Default positions if no data
    const defaultPositions = [
      "Quarterback",
      "Wide Receiver",
      "Running Back",
      "Defensive Back",
      "Rusher",
    ];
    const defaultScores = [87, 92, 89, 85, 78];
    const targetScores = [90, 95, 92, 88, 82];

    const positions = [];
    const currentScores = [];
    const targetScoresData = [];

    if (positionData.length > 0) {
      positionData.forEach((row) => {
        positions.push(row.position_name);
        const performance = Math.round(
          safeParseFloat(row.avg_performance, 8.5) * 10,
        );
        currentScores.push(performance);
        targetScoresData.push(performance + 3);
      });
    } else {
      positions.push(...defaultPositions);
      currentScores.push(...defaultScores);
      targetScoresData.push(...targetScores);
    }

    return sendSuccess(res, {
      positions,
      currentScores,
      targetScores: targetScoresData,
      totalPositions: positions.length,
      averagePerformance: Math.round(safeAverage(currentScores, 87)),
    });
  } catch (error) {
    serverLogger.error("Position performance error:", error);
    return sendError(
      res,
      "Failed to fetch position performance data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /injury-risk
 * Get injury risk data for gauge chart
 */
router.get("/injury-risk", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let riskData = null;

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data } = await supabase
        .from("player_game_status")
        .select("fatigue_score, injury_risk_score")
        .eq("player_id", userId)
        .gte("game_date", startDate.toISOString());

      if (data?.length > 0) {
        riskData = {
          avg_fatigue: safeAverage(
            data.map((d) => d.fatigue_score),
            3,
          ),
          avg_injury_risk: safeAverage(
            data.map((d) => d.injury_risk_score),
            2,
          ),
          assessments_count: data.length,
        };
      }
    } else if (pool) {
      const query = `
        SELECT 
          AVG(fatigue_score) as avg_fatigue,
          AVG(injury_risk_score) as avg_injury_risk,
          COUNT(*) as assessments_count
        FROM player_game_status 
        WHERE player_id = $1 
        AND game_date >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const result = await executeQuery(query, [userId]);
      riskData = result.rows[0];
    }

    riskData ||= {};

    const fatigueScore = safeParseFloat(riskData.avg_fatigue, 3);
    const injuryRiskScore = safeParseFloat(riskData.avg_injury_risk, 2);

    let lowRisk = 75;
    let mediumRisk = 20;
    let highRisk = 5;

    if (fatigueScore > 7 || injuryRiskScore > 7) {
      lowRisk = 50;
      mediumRisk = 35;
      highRisk = 15;
    } else if (fatigueScore > 5 || injuryRiskScore > 5) {
      lowRisk = 65;
      mediumRisk = 25;
      highRisk = 10;
    }

    // Add some randomization for demo
    lowRisk = Math.max(0, lowRisk + (Math.random() * 10 - 5));
    mediumRisk = Math.max(0, mediumRisk + (Math.random() * 8 - 4));
    highRisk = Math.max(0, 100 - lowRisk - mediumRisk);

    // Normalize to 100
    const total = lowRisk + mediumRisk + highRisk;
    if (total > 0) {
      lowRisk = Math.round((lowRisk / total) * 100);
      mediumRisk = Math.round((mediumRisk / total) * 100);
      highRisk = Math.round((highRisk / total) * 100);
    }

    return sendSuccess(res, {
      riskLevels: ["Low Risk", "Medium Risk", "High Risk"],
      riskPercentages: [lowRisk, mediumRisk, highRisk],
      fatigueScore: Math.round(fatigueScore * 10) / 10,
      injuryRiskScore: Math.round(injuryRiskScore * 10) / 10,
      overallRisk: Math.round(((fatigueScore + injuryRiskScore) / 2) * 10) / 10,
      lastAssessment: safeFormatDate(new Date()),
    });
  } catch (error) {
    serverLogger.error("Injury risk error:", error);
    return sendError(
      res,
      "Failed to fetch injury risk data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /speed-development
 * Get speed development metrics for line chart visualization
 */
router.get("/speed-development", async (req, res) => {
  try {
    const userIdParam = req.query.userId || "1";

    if (req.query.userId) {
      const userIdValidation = validateUserId(userIdParam);
      if (!userIdValidation.isValid) {
        return sendError(res, userIdValidation.error, "INVALID_USER_ID", 400);
      }
    }

    const weeksValidation = validateWeeks(req.query.weeks, 1, 52);
    if (!weeksValidation.isValid) {
      return sendError(res, weeksValidation.error, "INVALID_WEEKS", 400);
    }

    const userId = userIdParam;
    const weeks = weeksValidation.weeks || 7;

    let speedData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - weeks * 7);

      const { data: positionHistory } = await supabase
        .from("player_position_history")
        .select("position_id")
        .eq("player_id", userId)
        .eq("is_current", true);

      if (positionHistory?.length > 0) {
        const positionIds = positionHistory.map((p) => p.position_id);

        const { data } = await supabase
          .from("position_specific_metrics")
          .select("created_at, metric_name, metric_value")
          .in("position_id", positionIds)
          .in("metric_name", ["40-Yard Dash", "10-Yard Sprint"])
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true });

        if (data?.length > 0) {
          speedData = data;
        }
      }
    } else if (pool) {
      // Use parameterized query
      const query = `
        SELECT 
          DATE_TRUNC('week', psm.created_at) as week_start,
          AVG(CAST(psm.metric_value AS DECIMAL)) as avg_metric_value,
          psm.metric_name
        FROM position_specific_metrics psm
        JOIN player_position_history pph ON psm.position_id = pph.position_id
        WHERE pph.player_id = $1 
        AND pph.is_current = true
        AND psm.metric_name IN ('40-Yard Dash', '10-Yard Sprint')
        AND psm.created_at >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL
        GROUP BY DATE_TRUNC('week', psm.created_at), psm.metric_name
        ORDER BY week_start ASC, psm.metric_name
      `;

      const result = await executeQuery(query, [userId, weeks.toString()]);
      speedData = result.rows;
    }

    // Format data for Chart.js
    const weeksData = [];
    const fortyYardTimes = [];
    const tenYardTimes = [];

    for (let i = 1; i <= weeks; i++) {
      weeksData.push(`Week ${i}`);
    }

    // Process query results
    const weeklyData = {};

    if (Array.isArray(speedData)) {
      speedData.forEach((row) => {
        const weekStart = row.week_start || row.created_at;
        const weekIndex = Math.floor(
          (Date.now() - new Date(weekStart).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );

        if (weekIndex >= 0 && weekIndex < weeks) {
          if (!weeklyData[weekIndex]) {
            weeklyData[weekIndex] = {
              "40-Yard Dash": [],
              "10-Yard Sprint": [],
            };
          }

          const metricValue = safeParseFloat(
            row.avg_metric_value || row.metric_value,
            0,
          );
          const metricName = row.metric_name;

          if (metricValue > 0 && weeklyData[weekIndex][metricName]) {
            weeklyData[weekIndex][metricName].push(metricValue);
          }
        }
      });
    }

    // Fill in arrays with data or fallback values
    for (let i = 0; i < weeks; i++) {
      if (weeklyData[i] && weeklyData[i]["40-Yard Dash"].length > 0) {
        const avgTime = safeAverage(weeklyData[i]["40-Yard Dash"], 4.65);
        fortyYardTimes.push(Math.round(avgTime * 100) / 100);
      } else {
        const baseTime = 4.65 - i * 0.03;
        fortyYardTimes.push(Math.round(Math.max(3.5, baseTime) * 100) / 100);
      }

      if (weeklyData[i] && weeklyData[i]["10-Yard Sprint"].length > 0) {
        const avgTime = safeAverage(weeklyData[i]["10-Yard Sprint"], 1.68);
        tenYardTimes.push(Math.round(avgTime * 100) / 100);
      } else {
        const baseTime = 1.68 - i * 0.02;
        tenYardTimes.push(Math.round(Math.max(1.0, baseTime) * 100) / 100);
      }
    }

    return sendSuccess(res, {
      weeks: weeksData,
      fortyYardTimes,
      tenYardTimes,
      bestFortyYard: Math.min(...fortyYardTimes),
      bestTenYard: Math.min(...tenYardTimes),
      totalImprovement:
        Math.round(
          (fortyYardTimes[0] - fortyYardTimes[fortyYardTimes.length - 1]) * 100,
        ) / 100,
    });
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} speed development error:`,
      error,
    );
    return sendError(
      res,
      "Failed to fetch speed development data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /user-engagement
 * Get user engagement funnel data
 */
router.get("/user-engagement", async (req, res) => {
  try {
    const periodValidation = validatePeriod(req.query.period);
    if (!periodValidation.isValid) {
      return sendError(res, periodValidation.error, "INVALID_PERIOD", 400);
    }

    const { period, days } = periodValidation;
    let engagementData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await supabase
        .from("analytics_events")
        .select("event_type, user_id")
        .in("event_type", [
          "page_view",
          "feature_usage",
          "goal_created",
          "training_started",
          "session_complete",
        ])
        .gte("created_at", startDate.toISOString());

      if (data?.length > 0) {
        // Group by event type and count unique users
        const grouped = {};
        data.forEach((row) => {
          if (!grouped[row.event_type]) {
            grouped[row.event_type] = new Set();
          }
          grouped[row.event_type].add(row.user_id);
        });

        engagementData = Object.entries(grouped).map(([type, users]) => ({
          event_type: type,
          unique_users: users.size,
          total_events: data.filter((d) => d.event_type === type).length,
        }));
      }
    } else if (pool) {
      // Use parameterized query
      const query = `
        SELECT 
          event_type,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*) as total_events
        FROM analytics_events 
        WHERE created_at >= CURRENT_DATE - ($1 || ' days')::INTERVAL
        AND event_type IN ('page_view', 'feature_usage', 'goal_created', 'training_started', 'session_complete')
        GROUP BY event_type
        ORDER BY unique_users DESC
      `;

      const result = await executeQuery(query, [days.toString()]);
      engagementData = result.rows;
    }

    const eventTypeMap = {
      page_view: "Dashboard Views",
      feature_usage: "Training Started",
      training_started: "Training Started",
      session_complete: "Session Complete",
      goal_created: "Goal Set",
    };

    const stages = [
      "App Opens",
      "Dashboard Views",
      "Training Started",
      "Session Complete",
      "Goal Set",
      "Goal Achieved",
    ];
    const userCounts = [1000, 850, 720, 680, 450, 320];

    // Update with real data if available
    engagementData.forEach((row) => {
      const stageName = eventTypeMap[row.event_type];
      if (stageName) {
        const stageIndex = stages.indexOf(stageName);
        if (stageIndex !== -1) {
          userCounts[stageIndex] = safeParseInt(
            row.unique_users,
            userCounts[stageIndex],
          );
        }
      }
    });

    // Ensure funnel makes sense
    for (let i = 1; i < userCounts.length; i++) {
      if (userCounts[i] > userCounts[i - 1]) {
        userCounts[i] = Math.round(userCounts[i - 1] * 0.9);
      }
    }

    return sendSuccess(res, {
      stages,
      userCounts,
      conversionRates: stages.map((stage, index) => {
        if (index === 0) {
          return 100;
        }
        return Math.round((userCounts[index] / userCounts[0]) * 100);
      }),
      period,
      totalUsers: userCounts[0],
    });
  } catch (error) {
    serverLogger.error("User engagement error:", error);
    return sendError(
      res,
      "Failed to fetch user engagement data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /summary
 * Get analytics summary for dashboard
 */
router.get("/summary", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let summary = {
      weekly_sessions: 0,
      avg_performance: 8.5,
      weekly_active_users: 0,
      avg_load_time: 1000,
    };

    if (supabase) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Get weekly sessions
      const { data: sessions } = await supabase
        .from("training_analytics")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", weekAgo.toISOString());

      summary.weekly_sessions = sessions?.length || 0;

      // Get avg performance
      const { data: performance } = await supabase
        .from("training_analytics")
        .select("performance_score")
        .eq("user_id", userId)
        .gte("created_at", monthAgo.toISOString());

      if (performance?.length > 0) {
        summary.avg_performance = safeAverage(
          performance.map((p) => p.performance_score),
          8.5,
        );
      }

      // Get weekly active users
      const { data: events } = await supabase
        .from("analytics_events")
        .select("user_id")
        .gte("created_at", weekAgo.toISOString());

      if (events?.length > 0) {
        summary.weekly_active_users = new Set(
          events.map((e) => e.user_id),
        ).size;
      }

      // Get avg load time
      const { data: metrics } = await supabase
        .from("performance_metrics")
        .select("load_time")
        .gte("created_at", weekAgo.toISOString());

      if (metrics?.length > 0) {
        summary.avg_load_time = safeAverage(
          metrics.map((m) => m.load_time),
          1000,
        );
      }
    } else if (pool) {
      const summaryQuery = `
        SELECT 
          (SELECT COUNT(*) FROM training_analytics WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_sessions,
          (SELECT AVG(performance_score) FROM training_analytics WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_performance,
          (SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_active_users,
          (SELECT AVG(load_time) FROM performance_metrics WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as avg_load_time
      `;

      const summaryResult = await executeQuery(summaryQuery, [userId]);
      summary = summaryResult.rows[0] || summary;
    }

    return sendSuccess(res, {
      weeklySessions: safeParseInt(summary.weekly_sessions, 0),
      averagePerformance:
        Math.round(safeParseFloat(summary.avg_performance, 8.5) * 10) / 10,
      weeklyActiveUsers: safeParseInt(summary.weekly_active_users, 0),
      averageLoadTime: Math.round(safeParseFloat(summary.avg_load_time, 1000)),
      lastUpdated: safeFormatDate(new Date()),
    });
  } catch (error) {
    serverLogger.error("Analytics summary error:", error);
    return sendError(
      res,
      "Failed to fetch analytics summary",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 * @returns {object} Health status with service availability
 */
router.get("/health", async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();

    const healthStatus = {
      success:
        dbHealth.supabase === "connected" || dbHealth.postgres === "connected",
      status:
        dbHealth.supabase === "connected" || dbHealth.postgres === "connected"
          ? "healthy"
          : "unhealthy",
      service: ROUTE_NAME,
      version: "2.1.0",
      timestamp: safeFormatDate(new Date()),
      database: {
        supabase: dbHealth.supabase,
        postgres: dbHealth.postgres,
        latency: dbHealth.latency ? `${dbHealth.latency}ms` : null,
      },
    };

    const statusCode = healthStatus.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} health check error:`,
      error,
    );
    res.status(503).json({
      success: false,
      status: "unhealthy",
      service: ROUTE_NAME,
      message: "Health check failed",
      timestamp: safeFormatDate(new Date()),
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * 404 handler for unmatched routes
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
    method: req.method,
    timestamp: safeFormatDate(new Date()),
  });
});

/**
 * Global error handler (catches unhandled errors)
 */
router.use((err, req, res, _next) => {
  serverLogger.error(`${ROUTE_NAME.toUpperCase()} unhandled error:`, err);

  const { statusCode, response } = createErrorResponse(
    "An unexpected error occurred",
    "INTERNAL_ERROR",
    500,
    process.env.NODE_ENV === "development" ? err.message : null,
  );

  res.status(statusCode).json(response);
});

export default router;
