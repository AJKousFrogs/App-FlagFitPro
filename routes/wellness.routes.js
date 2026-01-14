/**
 * Wellness Routes
 * Handles wellness check-ins, hydration, and supplements tracking
 *
 * @module routes/wellness
 * @version 2.2.0
 */

import express from "express";
import {
    authenticateToken,
    optionalAuth,
    authorizeUserAccess,
} from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import {
    isValidUUID,
    sanitizeText,
    getErrorMessage,
    sendError,
    sendErrorResponse,
    sendSuccess,
    validateHydrationAmount
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "wellness";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "2.2.0"));

// =============================================================================
// WELLNESS CHECK-INS
// =============================================================================

/**
 * GET /checkin
 * Get latest wellness check-in for a user
 */
router.get(
  "/checkin",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;

    if (!userId || !isValidUUID(userId)) {
      return sendSuccess(res, null);
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: checkin, error } = await supabase
      .from("daily_wellness_checkin")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return sendSuccess(res, checkin);
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to load wellness check-in",
    );
    serverLogger.error(`[${ROUTE_NAME}] Get checkin error: ${errorMessage}`, error);
    return sendErrorResponse(
      res,
      error,
      "Failed to load wellness check-in",
      "FETCH_ERROR",
      500,
    );
  }
});

/**
 * POST /checkin
 * Submit a wellness check-in
 */
router.post(
  "/checkin",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const targetUserId = req.userId;
      const checkinDate =
        req.body.checkin_date || req.body.date || new Date().toISOString().split("T")[0];

      // Map camelCase from frontend to snake_case for database
      const checkinData = {
        user_id: targetUserId,
        checkin_date: checkinDate,
        sleep_quality: req.body.sleepQuality || req.body.sleep_quality,
        sleep_hours: req.body.sleepHours || req.body.sleep_hours,
        energy_level: req.body.energyLevel || req.body.energy_level,
        stress_level: req.body.stressLevel || req.body.stress_level,
        muscle_soreness: req.body.muscleSoreness || req.body.muscle_soreness || req.body.soreness,
        soreness_areas: req.body.sorenessAreas || req.body.soreness_areas || [],
        notes: req.body.notes,
        calculated_readiness: req.body.readinessScore || req.body.calculated_readiness,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(checkinData).forEach((key) => {
        if (checkinData[key] === undefined) {
          delete checkinData[key];
        }
      });

      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .upsert(checkinData, { onConflict: "user_id,checkin_date" })
        .select()
        .single();

      if (error) {
        serverLogger.error(`[${ROUTE_NAME}] Database error:`, error);
        throw error;
      }

      return sendSuccess(res, data, "Wellness check-in recorded");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to save check-in",
      );
      serverLogger.error(`[${ROUTE_NAME}] Checkin error: ${errorMessage}`, error);
      return sendErrorResponse(
        res,
        error,
        "Failed to save check-in",
        "SAVE_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /checkins
 * Get wellness check-in history
 */
router.get(
  "/checkins",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
    if (!userId || !isValidUUID(userId)) {
      return sendSuccess(res, []);
    }
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from("daily_wellness_checkin")
      .select(
        `
        id,
        user_id,
        checkin_date,
        sleep_quality,
        sleep_hours,
        energy_level,
        stress_level,
        muscle_soreness,
        mood,
        notes,
        created_at
      `,
      )
      .gte("checkin_date", startDate.toISOString().split("T")[0])
      .order("checkin_date", { ascending: false });

    query = query.eq("user_id", userId);

    const { data: checkins, error } = await query;

    if (error) {
      throw error;
    }

    return sendSuccess(res, checkins || []);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Get checkins error:`, error);
    return sendError(res, "Failed to load wellness data", "FETCH_ERROR", 500);
  }
});

/**
 * GET /latest
 * Get the most recent wellness check-in
 */
router.get(
  "/latest",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, null);
  }

  try {
    const userId = req.userId || req.query.userId;
    if (!userId || !isValidUUID(userId)) {
      return sendSuccess(res, null);
    }

    let query = supabase
      .from("daily_wellness_checkin")
      .select("*")
      .order("checkin_date", { ascending: false })
      .limit(1);

    query = query.eq("user_id", userId);

    const { data: checkin } = await query.single();

    return sendSuccess(res, checkin);
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to load latest check-in",
    );
    serverLogger.error(`[${ROUTE_NAME}] Latest error: ${errorMessage}`, error);
    return sendErrorResponse(
      res,
      error,
      "Failed to load latest check-in",
      "FETCH_ERROR",
      500,
    );
  }
});

// =============================================================================
// SUPPLEMENTS
// =============================================================================

/**
 * GET /supplements
 * Get supplements for a user
 */
router.get(
  "/supplements",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;
      if (!userId || !isValidUUID(userId)) {
        return sendSuccess(res, { supplements: [] });
      }

      // Get user's supplement regimen
      let query = supabase
        .from("supplement_regimens")
        .select(
          `
          id,
          user_id,
          supplement_name,
          dosage,
          frequency,
          timing,
          is_active,
          notes,
          created_at
        `,
        )
        .eq("is_active", true);

      query = query.eq("user_id", userId);

      const { data: regimen, error } = await query;

      if (error && error.code !== "42P01") {
        throw error;
      }

      return sendSuccess(res, { supplements: regimen || [] });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load supplements",
      );
      serverLogger.error(`[${ROUTE_NAME}] Supplements error: ${errorMessage}`, error);
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

/**
 * POST /supplements/log
 * Log a supplement intake
 */
router.post(
  "/supplements/log",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { userId } = req;
      const { supplement, dosage, taken = true, notes } = req.body;
      const today = new Date().toISOString().split("T")[0];

      // SANITIZE notes to prevent XSS
      const sanitizedNotes = notes ? sanitizeText(notes) : null;

      const { data, error } = await supabase
        .from("supplement_logs")
        .insert({
          user_id: userId,
          supplement_name: supplement,
          dosage,
          taken,
          date: today,
          notes: sanitizedNotes, // Use sanitized notes
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, data, "Supplement logged");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to log supplement",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Log supplement error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to log supplement",
        "LOG_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /supplements/logs
 * Get supplement log history
 */
router.get(
  "/supplements/logs",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;
      if (!userId || !isValidUUID(userId)) {
        return sendSuccess(res, { logs: [] });
      }
      const limit = parseInt(req.query.limit) || 30;

      let query = supabase
        .from("supplement_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      query = query.eq("user_id", userId);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return sendSuccess(res, { logs: data || [] });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load supplement logs",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Supplement logs error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load supplement logs",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// HYDRATION
// =============================================================================

/**
 * GET /hydration
 * Get hydration data for today
 */
router.get(
  "/hydration",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
    if (!userId || !isValidUUID(userId)) {
      return sendSuccess(res, { logs: [] });
    }
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("hydration_logs")
      .select("*")
      .gte("timestamp", `${today}T00:00:00`)
      .order("timestamp", { ascending: true });

    query = query.eq("user_id", userId);

    const { data: logs, error } = await query;

    if (error && error.code !== "42P01") {
      serverLogger.warn(`[${ROUTE_NAME}] Hydration error:`, error.message);
    }

    return sendSuccess(res, { logs: logs || [] });
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to load hydration logs",
    );
    serverLogger.error(`[${ROUTE_NAME}] Hydration error: ${errorMessage}`, error);
    return sendErrorResponse(
      res,
      error,
      "Failed to load hydration logs",
      "FETCH_ERROR",
      500,
    );
  }
});

/**
 * POST /hydration/log
 * Log hydration intake
 */
router.post(
  "/hydration/log",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { userId } = req;
      const { amount, type = "water" } = req.body;

      // VALIDATE AMOUNT
      const amountValidation = validateHydrationAmount(amount);
      if (!amountValidation.isValid) {
        return sendError(res, amountValidation.error, "INVALID_AMOUNT", 400);
      }

      const { data, error } = await supabase
        .from("hydration_logs")
        .insert({
          user_id: userId,
          amount: amountValidation.amount, // Use validated value
          type,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42P01") {
          return sendSuccess(
            res,
            {
              id: Date.now().toString(),
              amount: amountValidation.amount,
              type,
              timestamp: new Date().toISOString(),
            },
            "Logged (table not yet created)",
          );
        }
        throw error;
      }

      return sendSuccess(res, data, "Hydration logged");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to log hydration",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Log hydration error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to log hydration",
        "LOG_ERROR",
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
    error: "Wellness endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

export default router;
