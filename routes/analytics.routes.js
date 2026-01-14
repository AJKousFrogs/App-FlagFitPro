/**
 * Analytics Routes
 * Provides data for Chart.js visualizations and analytics dashboard
 *
 * @module routes/analytics
 * @version 2.3.0
 */

import express from "express";
import {
    optionalAuth,
    authorizeUserAccess,
} from "./middleware/auth.middleware.js";
import { withCache } from "./utils/cache.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { safeParseInt } from "./utils/query-helper.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import {
    safeAverage,
    safeParseFloat,
    getErrorMessage,
    resolveUserId,
    sendError,
    sendErrorResponse,
    sendSuccess,
    validatePeriod,
    validateWeeks
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "analytics";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "2.2.0"));

// =============================================================================
// PERFORMANCE TRENDS
// =============================================================================

/**
 * GET /performance-trends
 * Get performance trends data for line chart visualization
 * Cached for 2 minutes with ETag support
 */
router.get(
  "/performance-trends",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  withCache("ANALYTICS"),
  async (req, res) => {
    try {
      const userIdValidation = resolveUserId(req);
      if (!userIdValidation.isValid) {
        return sendError(
          res,
          userIdValidation.error,
          userIdValidation.code,
          400,
        );
      }
      const userId = userIdValidation.userId;

      const weeksValidation = validateWeeks(req.query.weeks, 1, 52);
      if (!weeksValidation.isValid) {
        return sendError(res, weeksValidation.error, "INVALID_WEEKS", 400);
      }

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
            avg_score: safeAverage(data.scores, 0),
            sessions_count: data.count,
            avg_load_time: safeAverage(data.loadTimes, 1000),
          }));
        }
      }

      // Format data for Chart.js
      const weeksData = [];
      const overallScores = [];
      const trainingScores = [];

      performanceData.forEach((row, index) => {
        weeksData.push(`Week ${index + 1}`);
        const normalizedScore = Math.min(
          100,
          Math.max(0, (row.avg_score || 0) * 10),
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

      return sendSuccess(res, {
        weeks: weeksData,
        overallScores,
        trainingScores,
        totalSessions: performanceData.reduce(
          (sum, row) => sum + (row.sessions_count || 0),
          0,
        ),
        averageScore:
          overallScores.length > 0
            ? Math.round(safeAverage(overallScores, 0))
            : 0,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to fetch performance trends",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Performance trends error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch performance trends",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// TEAM CHEMISTRY
// =============================================================================

/**
 * GET /team-chemistry
 * Get team chemistry data for radar chart
 * Cached for 2 minutes with ETag support
 */
router.get(
  "/team-chemistry",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  withCache("ANALYTICS"),
  async (req, res) => {
    try {
      const userIdValidation = resolveUserId(req);
      if (!userIdValidation.isValid) {
        return sendError(
          res,
          userIdValidation.error,
          userIdValidation.code,
          400,
        );
      }
      const userId = userIdValidation.userId;

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
              0,
            ),
            avg_coordination: safeAverage(
              data.map((d) => d.coordination_score),
              0,
            ),
            avg_trust: safeAverage(
              data.map((d) => d.trust_score),
              0,
            ),
            avg_cohesion: safeAverage(
              data.map((d) => d.cohesion_score),
              0,
            ),
            avg_overall: safeAverage(
              data.map((d) => d.overall_chemistry_score),
              0,
            ),
          };
        }
      }

      chemistryData ||= {
        avg_communication: 0,
        avg_coordination: 0,
        avg_trust: 0,
        avg_cohesion: 0,
        avg_overall: 0,
      };

      const leadershipScore = Math.min(
        10,
        Math.max(
          1,
          (chemistryData.avg_communication || 0) * 0.4 +
            (chemistryData.avg_coordination || 0) * 0.3 +
            (chemistryData.avg_trust || 0) * 0.3,
        ),
      );

      const adaptabilityScore = Math.min(
        10,
        Math.max(
          1,
          (chemistryData.avg_coordination || 0) * 0.5 +
            (chemistryData.avg_cohesion || 0) * 0.5,
        ),
      );

      const currentScores = [
        chemistryData.avg_communication || 0,
        chemistryData.avg_coordination || 0,
        chemistryData.avg_trust || 0,
        chemistryData.avg_cohesion || 0,
        leadershipScore,
        adaptabilityScore,
      ];

      const targetScores = currentScores.map((score) => {
        const target = Math.max(5, score * 1.1);
        return Math.min(10, target);
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
        currentScores: currentScores.map(
          (score) => Math.round(score * 10) / 10,
        ),
        targetScores: targetScores.map((score) => Math.round(score * 10) / 10),
        overallScore: Math.round((chemistryData.avg_overall || 0) * 10) / 10,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Team chemistry error:`, error);
      return sendError(
        res,
        "Failed to fetch team chemistry data",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// TRAINING DISTRIBUTION
// =============================================================================

/**
 * GET /training-distribution
 * Get training distribution data for pie chart
 * Cached for 2 minutes with ETag support
 */
router.get(
  "/training-distribution",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  withCache("ANALYTICS"),
  async (req, res) => {
    try {
      const userIdValidation = resolveUserId(req);
      if (!userIdValidation.isValid) {
        return sendError(
          res,
          userIdValidation.error,
          userIdValidation.code,
          400,
        );
      }
      const userId = userIdValidation.userId;

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
          const grouped = {};
          data.forEach((row) => {
            const type = row.training_type || "other";
            if (!grouped[type]) {
              grouped[type] = { count: 0, durations: [], performances: [] };
            }
            grouped[type].count++;
            grouped[type].durations.push(row.duration_minutes || 45);
            grouped[type].performances.push(row.performance_score || 0);
          });

          trainingData = Object.entries(grouped).map(([type, data]) => ({
            training_type: type,
            session_count: data.count,
            avg_duration: safeAverage(data.durations, 45),
            avg_performance: safeAverage(data.performances, 0),
          }));
        }
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
          Math.round(safeParseFloat(row.avg_performance, 0) * 10) / 10,
        );
      });

      return sendSuccess(res, {
        trainingTypes: trainingTypes.slice(0, 5),
        sessionCounts: sessionCounts.slice(0, 5),
        avgDurations: avgDurations.slice(0, 5),
        avgPerformances: avgPerformances.slice(0, 5),
        totalSessions: sessionCounts.reduce((sum, count) => sum + count, 0),
        period,
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Training distribution error:`, error);
      return sendError(
        res,
        "Failed to fetch training distribution",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// ANALYTICS SUMMARY
// =============================================================================

/**
 * GET /summary
 * Get analytics summary for dashboard
 * Cached for 2 minutes with ETag support
 */
router.get(
  "/summary",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  withCache("ANALYTICS"),
  async (req, res) => {
    try {
      const userIdValidation = resolveUserId(req);
      if (!userIdValidation.isValid) {
        return sendError(
          res,
          userIdValidation.error,
          userIdValidation.code,
          400,
        );
      }
      const userId = userIdValidation.userId;

      const summary = {
        weekly_sessions: 0,
        avg_performance: 0,
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
            0,
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
      }

      return sendSuccess(res, {
        weeklySessions: safeParseInt(summary.weekly_sessions, 0),
        averagePerformance:
          Math.round(safeParseFloat(summary.avg_performance, 0) * 10) / 10,
        weeklyActiveUsers: safeParseInt(summary.weekly_active_users, 0),
        averageLoadTime: Math.round(
          safeParseFloat(summary.avg_load_time, 1000),
        ),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Summary error:`, error);
      return sendError(
        res,
        "Failed to fetch analytics summary",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Analytics endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

export default router;
