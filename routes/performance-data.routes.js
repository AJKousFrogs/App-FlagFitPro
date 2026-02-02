/**
 * Performance Data Routes
 * Handles performance data endpoints (measurements, tests, wellness, supplements, injuries)
 *
 * @module routes/performance-data
 * @version 1.0.0
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
const ROUTE_NAME = "performance-data";

const columnCache = new Map();
const tableCache = new Map();

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
  } catch {
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
  } catch {
    tableCache.set(table, false);
    return false;
  }
}

function parseTimeframeToDays(timeframe = "30d") {
  if (typeof timeframe !== "string") {
    return 30;
  }

  const normalized = timeframe.trim().toLowerCase();
  const match = normalized.match(/^(\d+)([dmy])$/);
  if (!match) {
    return 30;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === "d") {
    return value;
  }

  if (unit === "m") {
    return value * 30;
  }

  return value * 365;
}

function calculateMeasurementsSummary(measurements) {
  if (measurements.length === 0) {
    return {};
  }

  const latest = measurements[0];
  const summary = {
    latest,
  };

  if (measurements.length > 1) {
    const previous = measurements[1];
    summary.changes = {
      weight:
        latest.weight !== undefined && previous.weight !== undefined
          ? latest.weight - previous.weight
          : undefined,
      bodyFat:
        latest.bodyFat !== undefined && previous.bodyFat !== undefined
          ? latest.bodyFat - previous.bodyFat
          : undefined,
      muscleMass:
        latest.muscleMass !== undefined && previous.muscleMass !== undefined
          ? latest.muscleMass - previous.muscleMass
          : undefined,
    };
  }

  return summary;
}

function calculateTestsSummary(tests) {
  const summary = {
    totalTests: tests.length,
    byType: {},
  };

  tests.forEach((test) => {
    const type = test.testType || "unknown";
    summary.byType[type] = (summary.byType[type] || 0) + 1;
  });

  return summary;
}

function calculatePerformanceTrends(tests) {
  const trends = {};
  const grouped = {};

  tests.forEach((test) => {
    const type = test.testType || "unknown";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(test);
  });

  Object.entries(grouped).forEach(([type, items]) => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const latest = sorted[0];
    const previous = sorted[1];
    if (!latest || !previous) {
      trends[type] = {
        value: latest?.result || 0,
        change: 0,
        trend: "stable",
      };
      return;
    }

    const delta = latest.result - previous.result;
    const percent = previous.result ? (delta / previous.result) * 100 : 0;
    trends[type] = {
      value: latest.result,
      change: Math.round(percent * 10) / 10,
      trend: percent > 0 ? "up" : percent < 0 ? "down" : "stable",
    };
  });

  return trends;
}

function mapMeasurement(measurement) {
  return {
    id: measurement.id,
    userId: measurement.user_id,
    weight: measurement.weight,
    height: measurement.height,
    bodyFat: measurement.body_fat,
    muscleMass: measurement.muscle_mass,
    bodyWaterMass: measurement.body_water_mass,
    fatMass: measurement.fat_mass,
    proteinMass: measurement.protein_mass,
    boneMineralContent: measurement.bone_mineral_content,
    skeletalMuscleMass: measurement.skeletal_muscle_mass,
    musclePercentage: measurement.muscle_percentage,
    bodyWaterPercentage: measurement.body_water_percentage,
    proteinPercentage: measurement.protein_percentage,
    boneMineralPercentage: measurement.bone_mineral_percentage,
    visceralFatRating: measurement.visceral_fat_rating,
    basalMetabolicRate: measurement.basal_metabolic_rate,
    waistToHipRatio: measurement.waist_to_hip_ratio,
    bodyAge: measurement.body_age,
    notes: measurement.notes,
    timestamp: measurement.created_at,
  };
}

function mapTest(test) {
  return {
    id: test.id,
    userId: test.user_id,
    testType: test.test_type,
    result: test.result_value,
    target: test.target_value,
    timestamp: test.test_date,
    conditions: test.conditions || {},
    notes: test.notes,
  };
}

function mapWellness(entry, userColumn) {
  return {
    id: entry.id,
    userId: entry[userColumn],
    date: entry.date,
    sleep: entry.sleep_quality,
    energy: entry.energy_level,
    stress: entry.stress_level,
    soreness: entry.muscle_soreness,
    motivation: entry.motivation_level,
    mood: entry.mood,
    hydration: entry.hydration_level,
    notes: entry.notes,
    timestamp: entry.created_at,
  };
}

function mapSupplement(log) {
  return {
    id: log.id,
    userId: log.user_id,
    name: log.supplement_name,
    dosage: log.dosage,
    date: log.date,
    taken: log.taken,
    timeOfDay: log.time_of_day,
    notes: log.notes,
    timestamp: log.created_at,
  };
}

function mapInjury(injury) {
  return {
    id: injury.id,
    userId: injury.user_id,
    type: injury.type,
    severity: injury.severity,
    description: injury.description,
    status: injury.status,
    startDate: injury.start_date,
    recoveryDate: injury.recovery_date,
    createdAt: injury.created_at,
    updatedAt: injury.updated_at,
  };
}

async function getWellnessUserColumn() {
  const hasUserId = await tableHasColumn("wellness_entries", "user_id");
  return hasUserId ? "user_id" : "athlete_id";
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// MEASUREMENTS
// =============================================================================

router.get(
  "/measurements",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await tableExists("physical_measurements");
      if (!exists) {
        return sendSuccess(res, {
          data: [],
          summary: {},
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        });
      }

      const timeframe = req.query.timeframe || "6m";
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const offset = (page - 1) * limit;

      const days = parseTimeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error, count } = await supabase
        .from("physical_measurements")
        .select("*", { count: "exact" })
        .eq("user_id", req.userId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (isMissingTableError(error, "physical_measurements")) {
          return sendSuccess(res, {
            data: [],
            summary: {},
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        throw error;
      }

      const mapped = (data || []).map(mapMeasurement);
      const total = count || mapped.length;

      return sendSuccess(res, {
        data: mapped,
        summary: calculateMeasurementsSummary(mapped),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load measurements",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Measurements error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load measurements",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/measurements",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const measurement = req.body || {};

      if (
        measurement.weight === undefined ||
        measurement.height === undefined
      ) {
        return sendError(
          res,
          "Weight and height are required",
          "VALIDATION_ERROR",
          400,
        );
      }

      const payload = {
        user_id: req.userId,
        weight: measurement.weight,
        height: measurement.height,
        body_fat: measurement.bodyFat,
        muscle_mass: measurement.muscleMass,
        body_water_mass: measurement.bodyWaterMass,
        fat_mass: measurement.fatMass,
        protein_mass: measurement.proteinMass,
        bone_mineral_content: measurement.boneMineralContent,
        skeletal_muscle_mass: measurement.skeletalMuscleMass,
        muscle_percentage: measurement.musclePercentage,
        body_water_percentage: measurement.bodyWaterPercentage,
        protein_percentage: measurement.proteinPercentage,
        bone_mineral_percentage: measurement.boneMineralPercentage,
        visceral_fat_rating: measurement.visceralFatRating,
        basal_metabolic_rate: measurement.basalMetabolicRate,
        waist_to_hip_ratio: measurement.waistToHipRatio,
        body_age: measurement.bodyAge,
        notes: measurement.notes,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("physical_measurements")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res
        .status(201)
        .json(createSuccessResponse(mapMeasurement(data), "Measurement saved"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save measurement");
      serverLogger.error(
        `[${ROUTE_NAME}] Save measurement error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to save measurement",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

router.get(
  "/performance-tests",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await tableExists("performance_tests");
      if (!exists) {
        return sendSuccess(res, {
          data: [],
          trends: {},
          summary: {},
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        });
      }

      const { testType } = req.query;
      const timeframe = req.query.timeframe || "12m";
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const offset = (page - 1) * limit;

      const days = parseTimeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from("performance_tests")
        .select("*", { count: "exact" })
        .eq("user_id", req.userId)
        .gte("test_date", startDate.toISOString())
        .order("test_date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (typeof testType === "string" && testType.length > 0) {
        query = query.eq("test_type", testType);
      }

      const { data, error, count } = await query;
      if (error) {
        if (isMissingTableError(error, "performance_tests")) {
          return sendSuccess(res, {
            data: [],
            trends: {},
            summary: {},
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        throw error;
      }

      const mapped = (data || []).map(mapTest);
      const total = count || mapped.length;

      return sendSuccess(res, {
        data: mapped,
        trends: calculatePerformanceTrends(mapped),
        summary: calculateTestsSummary(mapped),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load tests");
      serverLogger.error(`[${ROUTE_NAME}] Tests error: ${errorMessage}`, error);
      return sendErrorResponse(
        res,
        error,
        "Failed to load tests",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/performance-tests",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const test = req.body || {};
      if (!test.testType || test.result === undefined || test.result === null) {
        return sendError(
          res,
          "testType and result are required",
          "VALIDATION_ERROR",
          400,
        );
      }

      const payload = {
        user_id: req.userId,
        test_type: test.testType,
        result_value: test.result,
        target_value: test.target,
        test_date: test.date || new Date().toISOString(),
        conditions: test.conditions || {},
        notes: test.notes,
      };

      const { data, error } = await supabase
        .from("performance_tests")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res
        .status(201)
        .json(createSuccessResponse(mapTest(data), "Test recorded"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save test");
      serverLogger.error(
        `[${ROUTE_NAME}] Save test error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to save test",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// WELLNESS
// =============================================================================

router.get(
  "/wellness",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await tableExists("wellness_entries");
      if (!exists) {
        return sendSuccess(res, { data: [], averages: null, patterns: null });
      }

      const timeframe = req.query.timeframe || "30d";
      const days = parseTimeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const userColumn = await getWellnessUserColumn();
      const { data, error } = await supabase
        .from("wellness_entries")
        .select("*")
        .eq(userColumn, req.userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) {
        if (isMissingTableError(error, "wellness_entries")) {
          return sendSuccess(res, { data: [], averages: null, patterns: null });
        }
        throw error;
      }

      const mapped = (data || []).map((entry) =>
        mapWellness(entry, userColumn),
      );

      return sendSuccess(res, { data: mapped });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load wellness");
      serverLogger.error(
        `[${ROUTE_NAME}] Wellness error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load wellness",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/wellness",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const wellness = req.body || {};
      const userColumn = await getWellnessUserColumn();

      const payload = {
        [userColumn]: req.userId,
        date: wellness.date || new Date().toISOString().split("T")[0],
        sleep_quality: wellness.sleep,
        energy_level: wellness.energy,
        stress_level: wellness.stress,
        muscle_soreness: wellness.soreness,
        motivation_level: wellness.motivation,
        mood: wellness.mood,
        hydration_level: wellness.hydration,
        notes: wellness.notes,
      };

      const { data, error } = await supabase
        .from("wellness_entries")
        .upsert(payload, { onConflict: `${userColumn},date` })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res
        .status(201)
        .json(createSuccessResponse(mapWellness(data, userColumn), "Saved"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save wellness");
      serverLogger.error(
        `[${ROUTE_NAME}] Save wellness error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to save wellness",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// SUPPLEMENTS
// =============================================================================

router.get(
  "/supplements",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await tableExists("supplement_logs");
      if (!exists) {
        return sendSuccess(res, []);
      }

      const timeframe = req.query.timeframe || "30d";
      const days = parseTimeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("supplement_logs")
        .select("*")
        .eq("user_id", req.userId)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) {
        if (isMissingTableError(error, "supplement_logs")) {
          return sendSuccess(res, []);
        }
        throw error;
      }

      return sendSuccess(res, (data || []).map(mapSupplement));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load supplements");
      serverLogger.error(
        `[${ROUTE_NAME}] Supplements error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load supplements",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/supplements",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const supplement = req.body || {};
      if (!supplement.name || !supplement.date) {
        return sendError(
          res,
          "Supplement name and date are required",
          "VALIDATION_ERROR",
          400,
        );
      }

      const payload = {
        user_id: req.userId,
        supplement_name: supplement.name,
        dosage: supplement.dosage,
        taken: supplement.taken === true,
        date: supplement.date,
        time_of_day: supplement.timeOfDay,
        notes: supplement.notes,
      };

      const { data, error } = await supabase
        .from("supplement_logs")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res
        .status(201)
        .json(createSuccessResponse(mapSupplement(data), "Logged"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to log supplement");
      serverLogger.error(
        `[${ROUTE_NAME}] Supplement save error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to log supplement",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// INJURIES
// =============================================================================

router.get(
  "/injuries",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await tableExists("injuries");
      if (!exists) {
        return sendSuccess(res, []);
      }

      let query = supabase
        .from("injuries")
        .select("*")
        .eq("user_id", req.userId)
        .order("start_date", { ascending: false });

      if (typeof req.query.status === "string") {
        query = query.eq("status", req.query.status);
      }

      const { data, error } = await query;
      if (error) {
        if (isMissingTableError(error, "injuries")) {
          return sendSuccess(res, []);
        }
        throw error;
      }

      return sendSuccess(res, (data || []).map(mapInjury));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load injuries");
      serverLogger.error(
        `[${ROUTE_NAME}] Injuries error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load injuries",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/injuries",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const injury = req.body || {};
      if (!injury.type || !injury.severity || !injury.startDate) {
        return sendError(
          res,
          "type, severity, and startDate are required",
          "VALIDATION_ERROR",
          400,
        );
      }

      const payload = {
        user_id: req.userId,
        type: injury.type,
        severity: injury.severity,
        description: injury.description,
        status: injury.status || "active",
        start_date: injury.startDate,
        recovery_date: injury.recoveryDate,
      };

      const { data, error } = await supabase
        .from("injuries")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res
        .status(201)
        .json(createSuccessResponse(mapInjury(data), "Logged"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save injury");
      serverLogger.error(
        `[${ROUTE_NAME}] Injury save error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to save injury",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// TRENDS
// =============================================================================

router.get(
  "/trends",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const timeframe = req.query.timeframe || "90d";
      const days = parseTimeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const hasMeasurements = await tableExists("physical_measurements");
      const hasTests = await tableExists("performance_tests");
      const hasWellness = await tableExists("wellness_entries");

      const [measurementsResult, testsResult, wellnessResult] =
        await Promise.all([
          hasMeasurements
            ? supabase
                .from("physical_measurements")
                .select("*")
                .eq("user_id", req.userId)
                .gte("created_at", startDate.toISOString())
            : Promise.resolve({ data: [] }),
          hasTests
            ? supabase
                .from("performance_tests")
                .select("*")
                .eq("user_id", req.userId)
                .gte("test_date", startDate.toISOString())
            : Promise.resolve({ data: [] }),
          hasWellness
            ? (async () => {
                const userColumn = await getWellnessUserColumn();
                return supabase
                  .from("wellness_entries")
                  .select("*")
                  .eq(userColumn, req.userId)
                  .gte("date", startDate.toISOString().split("T")[0]);
              })()
            : Promise.resolve({ data: [] }),
        ]);

      const measurements = (measurementsResult.data || []).map(mapMeasurement);
      const tests = (testsResult.data || []).map(mapTest);
      const wellness = (wellnessResult.data || []).map((entry) =>
        mapWellness(entry, entry.user_id ? "user_id" : "athlete_id"),
      );

      return sendSuccess(res, {
        performance: calculatePerformanceTrends(tests),
        body_composition: {
          trend: measurements.length ? "available" : "no_data",
          latest: measurements[0] || null,
          previous: measurements[1] || null,
          changes:
            measurements.length > 1
              ? calculateMeasurementsSummary(measurements).changes || null
              : null,
        },
        wellness: {
          trend: wellness.length ? "available" : "no_data",
          recentAverage: wellness.length
            ? Math.round(
                (wellness.reduce((sum, entry) => sum + (entry.energy || 0), 0) /
                  wellness.length) *
                  10,
              ) / 10
            : null,
        },
        correlations: {},
        insights: [],
        recommendations: [],
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load trends");
      serverLogger.error(
        `[${ROUTE_NAME}] Trends error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load trends",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// EXPORT
// =============================================================================

router.get(
  "/export",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const hasMeasurements = await tableExists("physical_measurements");
      const hasTests = await tableExists("performance_tests");
      const hasWellness = await tableExists("wellness_entries");
      const hasSupplements = await tableExists("supplement_logs");
      const hasInjuries = await tableExists("injuries");

      const [
        measurementsResult,
        testsResult,
        wellnessResult,
        supplementsResult,
        injuriesResult,
      ] = await Promise.all([
        hasMeasurements
          ? supabase
              .from("physical_measurements")
              .select("*")
              .eq("user_id", req.userId)
          : Promise.resolve({ data: [] }),
        hasTests
          ? supabase
              .from("performance_tests")
              .select("*")
              .eq("user_id", req.userId)
          : Promise.resolve({ data: [] }),
        hasWellness
          ? (async () => {
              const userColumn = await getWellnessUserColumn();
              return supabase
                .from("wellness_entries")
                .select("*")
                .eq(userColumn, req.userId);
            })()
          : Promise.resolve({ data: [] }),
        hasSupplements
          ? supabase
              .from("supplement_logs")
              .select("*")
              .eq("user_id", req.userId)
          : Promise.resolve({ data: [] }),
        hasInjuries
          ? supabase.from("injuries").select("*").eq("user_id", req.userId)
          : Promise.resolve({ data: [] }),
      ]);

      const exportData = {
        measurements: (measurementsResult.data || []).map(mapMeasurement),
        performanceTests: (testsResult.data || []).map(mapTest),
        wellness: (wellnessResult.data || []).map((entry) =>
          mapWellness(entry, entry.user_id ? "user_id" : "athlete_id"),
        ),
        supplements: (supplementsResult.data || []).map(mapSupplement),
        injuries: (injuriesResult.data || []).map(mapInjury),
      };

      return res.json(createSuccessResponse(exportData));
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to export data");
      serverLogger.error(
        `[${ROUTE_NAME}] Export error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to export data",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

export default router;
