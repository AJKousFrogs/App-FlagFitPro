/**
 * Performance Routes
 * Handles performance metrics and analytics endpoints
 *
 * @module routes/performance
 * @version 1.1.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  createSuccessResponse,
  getErrorMessage,
  sendError,
  sendErrorResponse,
  sendSuccess,
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "performance";

const columnCache = new Map();
const tableCache = new Map();

const SPEED_TEST_TYPES = new Map([
  ["40yarddash", { distanceMeters: 36.576 }],
  ["40-yard", { distanceMeters: 36.576 }],
  ["40yd", { distanceMeters: 36.576 }],
  ["20m", { distanceMeters: 20 }],
  ["10m", { distanceMeters: 10 }],
  ["sprint", { distanceMeters: 36.576 }],
]);

const ACCURACY_TEST_TYPES = new Set([
  "pass_accuracy",
  "throwing_accuracy",
  "accuracy",
]);

// =============================================================================
// HELPERS
// =============================================================================

function isMissingColumnError(error, column) {
  const message = (error?.message || "").toLowerCase();
  return (
    error?.code === "42703" ||
    (message.includes("column") && message.includes(column.toLowerCase()))
  );
}

function isMissingTableError(error, table) {
  const message = (error?.message || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    (message.includes("relation") && message.includes(table.toLowerCase()))
  );
}

async function tableHasColumn(table, column) {
  if (!supabase) {
    return false;
  }

  const key = `${table}.${column}`;
  if (columnCache.has(key)) {
    return columnCache.get(key);
  }

  try {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (error) {
      if (isMissingColumnError(error, column)) {
        columnCache.set(key, false);
        return false;
      }
      columnCache.set(key, false);
      return false;
    }

    columnCache.set(key, true);
    return true;
  } catch (error) {
    columnCache.set(key, false);
    return false;
  }
}

async function tableExists(table) {
  if (!supabase) {
    return false;
  }

  if (tableCache.has(table)) {
    return tableCache.get(table);
  }

  try {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      if (isMissingTableError(error, table)) {
        tableCache.set(table, false);
        return false;
      }
      tableCache.set(table, true);
      return true;
    }

    tableCache.set(table, true);
    return true;
  } catch (error) {
    tableCache.set(table, false);
    return false;
  }
}

async function getTrainingUserFilter(userId) {
  const hasUserId = await tableHasColumn("training_sessions", "user_id");
  const hasAthleteId = await tableHasColumn("training_sessions", "athlete_id");

  if (hasUserId && hasAthleteId) {
    return {
      filter: `user_id.eq.${userId},athlete_id.eq.${userId}`,
      mode: "or",
    };
  }

  if (hasUserId) {
    return { column: "user_id", value: userId };
  }

  if (hasAthleteId) {
    return { column: "athlete_id", value: userId };
  }

  return null;
}

async function getPerformanceTests(userId, { limit = 50, type } = {}) {
  const exists = await tableExists("performance_tests");
  if (!exists) {
    return [];
  }

  let query = supabase
    .from("performance_tests")
    .select("*")
    .eq("user_id", userId)
    .order("test_date", { ascending: false });

  if (type) {
    query = query.eq("test_type", type);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data || [];
}

async function getTrainingSessions(
  userId,
  { limit = 30, startDate, endDate } = {},
) {
  const exists = await tableExists("training_sessions");
  if (!exists) {
    return [];
  }

  const userFilter = await getTrainingUserFilter(userId);
  if (!userFilter) {
    return [];
  }

  const desiredColumns = [
    "session_date",
    "completed_at",
    "duration_minutes",
    "intensity_level",
    "session_type",
    "drill_type",
    "performance_score",
  ];

  const availableColumns = [];
  for (const column of desiredColumns) {
    if (await tableHasColumn("training_sessions", column)) {
      availableColumns.push(column);
    }
  }

  const selectFields =
    availableColumns.length > 0 ? availableColumns.join(", ") : "*";
  let query = supabase.from("training_sessions").select(selectFields);

  if (userFilter.mode === "or") {
    query = query.or(userFilter.filter);
  } else {
    query = query.eq(userFilter.column, userFilter.value);
  }

  const hasSessionDate = await tableHasColumn(
    "training_sessions",
    "session_date",
  );
  const hasCompletedAt = await tableHasColumn(
    "training_sessions",
    "completed_at",
  );

  if (startDate && hasSessionDate) {
    query = query.gte("session_date", startDate);
  }
  if (endDate && hasSessionDate) {
    query = query.lte("session_date", endDate);
  }
  if ((startDate || endDate) && !hasSessionDate && hasCompletedAt) {
    if (startDate) {
      query = query.gte("completed_at", startDate);
    }
    if (endDate) {
      query = query.lte("completed_at", endDate);
    }
  }

  query = query.order(hasCompletedAt ? "completed_at" : "session_date", {
    ascending: false,
  });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data || [];
}

function parseSpeedTestType(testType) {
  if (!testType) {
    return null;
  }

  const normalized = testType.toLowerCase().replace(/\s+/g, "");
  if (SPEED_TEST_TYPES.has(normalized)) {
    return SPEED_TEST_TYPES.get(normalized);
  }

  if (normalized.includes("40") && normalized.includes("yard")) {
    return SPEED_TEST_TYPES.get("40yarddash");
  }

  if (normalized.includes("sprint")) {
    return SPEED_TEST_TYPES.get("sprint");
  }

  return null;
}

function secondsToMph(seconds, distanceMeters) {
  if (!seconds || seconds <= 0) {
    return null;
  }
  const miles = distanceMeters / 1609.344;
  const hours = seconds / 3600;
  if (!hours) {
    return null;
  }
  return miles / hours;
}

function calculateTrend(currentValue, previousValue) {
  if (!previousValue || previousValue === 0) {
    return { trend: "stable", trendValue: 0 };
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;

  if (change > 2) {
    return { trend: "up", trendValue: Math.abs(change) };
  }
  if (change < -2) {
    return { trend: "down", trendValue: Math.abs(change) };
  }
  return { trend: "stable", trendValue: 0 };
}

function resolveAthleteId(req, res) {
  const athleteId =
    typeof req.query.athleteId === "string" ? req.query.athleteId : null;

  if (athleteId && athleteId !== req.userId) {
    sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
    return null;
  }

  return req.userId;
}

function getSessionDate(session) {
  if (session?.session_date) {
    return session.session_date;
  }
  if (session?.completed_at) {
    return session.completed_at.split("T")[0];
  }
  return null;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.1.0"));

// =============================================================================
// PERFORMANCE ENDPOINTS
// =============================================================================

router.get(
  "/metrics",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    const athleteId = resolveAthleteId(req, res);
    if (!athleteId) {
      return;
    }

    try {
      const sessions = await getTrainingSessions(athleteId, { limit: 30 });
      const tests = await getPerformanceTests(athleteId, { limit: 50 });

      const metrics = [];

      // Speed metric from sprint tests (time -> mph)
      const speedTests = tests
        .map((test) => ({
          ...test,
          speedMeta: parseSpeedTestType(test.test_type),
        }))
        .filter((test) => test.speedMeta && Number(test.result_value) > 0)
        .map((test) => ({
          ...test,
          mph: secondsToMph(
            Number(test.result_value),
            test.speedMeta.distanceMeters,
          ),
        }))
        .filter((test) => test.mph !== null);

      if (speedTests.length > 0) {
        const sortedByDate = [...speedTests].sort(
          (a, b) =>
            new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
        );
        const sortedBySpeed = [...speedTests].sort((a, b) => b.mph - a.mph);
        const current = sortedByDate[0];
        const previous = sortedByDate[1];
        const trend = calculateTrend(current.mph, previous?.mph || 0);

        metrics.push({
          id: "speed",
          label: "Top Speed",
          value: Math.round(current.mph * 10) / 10,
          unit: "mph",
          trend: trend.trend,
          trendValue: Math.round(trend.trendValue * 10) / 10,
          target: Math.round(sortedBySpeed[0].mph * 10) / 10,
          color: "#10c96b",
          icon: "pi pi-bolt",
        });
      }

      // Accuracy metric from accuracy tests
      const accuracyTests = tests.filter((test) =>
        ACCURACY_TEST_TYPES.has((test.test_type || "").toLowerCase()),
      );

      if (accuracyTests.length > 0) {
        const sortedAccuracy = [...accuracyTests].sort(
          (a, b) =>
            new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
        );
        const current = sortedAccuracy[0];
        const previous = sortedAccuracy[1];
        const currentValue = Number(current.result_value);
        const normalizedValue =
          currentValue <= 1 ? currentValue * 100 : currentValue;
        const previousValue = previous ? Number(previous.result_value) : 0;
        const normalizedPrevious =
          previousValue <= 1 ? previousValue * 100 : previousValue;
        const trend = calculateTrend(normalizedValue, normalizedPrevious);

        metrics.push({
          id: "accuracy",
          label: "Pass Accuracy",
          value: Math.round(normalizedValue * 10) / 10,
          unit: "%",
          trend: trend.trend,
          trendValue: Math.round(trend.trendValue * 10) / 10,
          target: Math.round(normalizedValue * 10) / 10,
          color: "#f1c40f",
          icon: "pi pi-target",
        });
      }

      // Endurance metric from recent training sessions
      const enduranceSessions = sessions.filter(
        (session) => Number(session.duration_minutes) > 0,
      );

      if (enduranceSessions.length > 0) {
        const recentSessions = enduranceSessions.slice(0, 5);
        const avgDuration =
          recentSessions.reduce(
            (sum, session) => sum + Number(session.duration_minutes || 0),
            0,
          ) / recentSessions.length;
        const currentDuration = Number(
          recentSessions[0]?.duration_minutes || 0,
        );
        const previousDuration = Number(
          recentSessions[1]?.duration_minutes || 0,
        );
        const trend = calculateTrend(currentDuration, previousDuration);

        metrics.push({
          id: "endurance",
          label: "Endurance",
          value: Math.round(avgDuration),
          unit: "min",
          trend: trend.trend,
          trendValue: Math.round(trend.trendValue),
          target: Math.round(avgDuration),
          color: "#ef4444",
          icon: "pi pi-heart",
        });
      }

      const response = {
        metrics,
        hasData: metrics.length > 0,
        message:
          metrics.length > 0
            ? null
            : "No performance data available yet. Log training sessions or tests to see metrics.",
      };

      return res.json(createSuccessResponse(response));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch metrics");
      serverLogger.error(
        `[${ROUTE_NAME}] Metrics error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch metrics",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/heatmap",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const athleteId = resolveAthleteId(req, res);
      if (!athleteId) {
        return;
      }

      const timeRange =
        typeof req.query.timeRange === "string"
          ? req.query.timeRange
          : "6months";

      const endDate = new Date();
      const startDate = new Date();

      if (timeRange === "3months") {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (timeRange === "1year") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      } else {
        startDate.setMonth(endDate.getMonth() - 6);
      }

      const sessions = await getTrainingSessions(athleteId, {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        limit: 500,
      });

      const sessionsByDate = {};
      sessions.forEach((session) => {
        const date = getSessionDate(session);
        if (!date) {
          return;
        }
        if (!sessionsByDate[date]) {
          sessionsByDate[date] = [];
        }
        sessionsByDate[date].push(session);
      });

      const cells = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const daySessions = sessionsByDate[dateStr] || [];

        if (daySessions.length > 0) {
          const totalDuration = daySessions.reduce(
            (sum, session) => sum + Number(session.duration_minutes || 0),
            0,
          );
          const avgIntensity =
            daySessions.reduce(
              (sum, session) => sum + Number(session.intensity_level || 0),
              0,
            ) / daySessions.length;
          const intensity = Math.min(
            7,
            Math.max(0, Math.round(avgIntensity || totalDuration / 15)),
          );

          cells.push({
            date: dateStr,
            value: Math.round(intensity * 10),
            intensity,
            sessions: daySessions.length,
            duration: Math.round(totalDuration),
          });
        } else {
          cells.push({
            date: dateStr,
            value: 0,
            intensity: 0,
            sessions: 0,
            duration: 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const hasTrainingData = cells.some((cell) => cell.sessions > 0);

      return res.json(
        createSuccessResponse({
          cells,
          timeRange,
          hasData: hasTrainingData,
          totalSessions: cells.reduce((sum, cell) => sum + cell.sessions, 0),
          message: hasTrainingData
            ? null
            : "No training sessions found for this period.",
        }),
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch heatmap");
      serverLogger.error(
        `[${ROUTE_NAME}] Heatmap error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch heatmap",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/records",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const athleteId = resolveAthleteId(req, res);
      if (!athleteId) {
        return;
      }

      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const type = typeof req.query.type === "string" ? req.query.type : null;

      const records = await getPerformanceTests(athleteId, { limit, type });

      return sendSuccess(res, records);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch records");
      serverLogger.error(
        `[${ROUTE_NAME}] Records error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch records",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/records/latest",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const athleteId = resolveAthleteId(req, res);
      if (!athleteId) {
        return;
      }

      const type = typeof req.query.type === "string" ? req.query.type : null;
      const records = await getPerformanceTests(athleteId, {
        limit: 1,
        type,
      });

      return sendSuccess(res, records[0] || null);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch record");
      serverLogger.error(
        `[${ROUTE_NAME}] Latest record error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch record",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/trends",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const athleteId = resolveAthleteId(req, res);
      if (!athleteId) {
        return;
      }

      const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const sessions = await getTrainingSessions(athleteId, {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        limit: 365,
      });

      const dailyScores = new Map();
      sessions.forEach((session) => {
        const date = getSessionDate(session);
        if (!date || session.performance_score === undefined) {
          return;
        }
        if (!dailyScores.has(date)) {
          dailyScores.set(date, []);
        }
        dailyScores.get(date).push(Number(session.performance_score || 0));
      });

      const points = [...dailyScores.entries()]
        .map(([date, scores]) => ({
          date,
          score:
            scores.length > 0
              ? Math.round(
                  (scores.reduce((sum, value) => sum + value, 0) /
                    scores.length) *
                    10,
                ) / 10
              : 0,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      const average =
        points.length > 0
          ? Math.round(
              (points.reduce((sum, point) => sum + point.score, 0) /
                points.length) *
                10,
            ) / 10
          : 0;

      return sendSuccess(res, {
        points,
        average,
        totalSessions: sessions.length,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch trends");
      serverLogger.error(
        `[${ROUTE_NAME}] Trends error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch trends",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/speed-insights",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const athleteId = resolveAthleteId(req, res);
      if (!athleteId) {
        return;
      }

      const tests = await getPerformanceTests(athleteId, { limit: 100 });
      const speedTests = tests
        .map((test) => ({
          ...test,
          speedMeta: parseSpeedTestType(test.test_type),
        }))
        .filter((test) => test.speedMeta && Number(test.result_value) > 0)
        .map((test) => ({
          ...test,
          mph: secondsToMph(
            Number(test.result_value),
            test.speedMeta.distanceMeters,
          ),
        }))
        .filter((test) => test.mph !== null);

      if (speedTests.length === 0) {
        return sendSuccess(res, {
          latest: null,
          best: null,
          deltaMph: 0,
          message: "No sprint tests logged yet.",
        });
      }

      const latest = [...speedTests].sort(
        (a, b) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
      )[0];
      const best = [...speedTests].sort((a, b) => b.mph - a.mph)[0];

      return sendSuccess(res, {
        latest,
        best,
        deltaMph: Math.round((latest.mph - best.mph) * 10) / 10,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to fetch insights");
      serverLogger.error(
        `[${ROUTE_NAME}] Speed insights error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to fetch insights",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get("/live", rateLimit("READ"), authenticateToken, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const athleteId = resolveAthleteId(req, res);
    if (!athleteId) {
      return;
    }

    const sessions = await getTrainingSessions(athleteId, { limit: 1 });
    const lastSession = sessions[0] || null;

    return sendSuccess(res, {
      status: lastSession ? "recent" : "no_data",
      lastSession,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Failed to fetch live data");
    serverLogger.error(`[${ROUTE_NAME}] Live error: ${errorMessage}`, error);
    return sendErrorResponse(
      res,
      error,
      "Failed to fetch live data",
      "FETCH_ERROR",
      500,
    );
  }
});

export default router;
