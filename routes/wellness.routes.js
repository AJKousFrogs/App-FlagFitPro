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
} from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import {
    isValidUUID,
    sanitizeText,
    sendError,
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
router.get("/checkin", rateLimit("READ"), optionalAuth, async (req, res) => {
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
    serverLogger.error(`[${ROUTE_NAME}] Get checkin error:`, error);
    return sendSuccess(res, null);
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
        req.body.checkin_date || new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_wellness_checkin")
        .upsert(
          {
            user_id: targetUserId,
            checkin_date: checkinDate,
            ...req.body,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,checkin_date" },
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, data, "Wellness check-in recorded");
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Checkin error:`, error);
      return sendError(res, "Failed to save check-in", "SAVE_ERROR", 500);
    }
  },
);

/**
 * GET /checkins
 * Get wellness check-in history
 */
router.get("/checkins", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
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

    if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId);
    }

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
router.get("/latest", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, null);
  }

  try {
    const userId = req.userId || req.query.userId;

    let query = supabase
      .from("daily_wellness_checkin")
      .select("*")
      .order("checkin_date", { ascending: false })
      .limit(1);

    if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId);
    }

    const { data: checkin } = await query.single();

    return sendSuccess(res, checkin);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Latest error:`, error);
    return sendSuccess(res, null);
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
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;

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

      if (userId && isValidUUID(userId)) {
        query = query.eq("user_id", userId);
      }

      const { data: regimen, error } = await query;

      if (error && error.code !== "42P01") {
        throw error;
      }

      return sendSuccess(res, { supplements: regimen || [] });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Supplements error:`, error);
      return sendSuccess(res, { supplements: [] });
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
      serverLogger.error(`[${ROUTE_NAME}] Log supplement error:`, error);
      return sendError(res, "Failed to log supplement", "LOG_ERROR", 500);
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
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;
      const limit = parseInt(req.query.limit) || 30;

      let query = supabase
        .from("supplement_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      if (userId && isValidUUID(userId)) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return sendSuccess(res, { logs: data || [] });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Supplement logs error:`, error);
      return sendSuccess(res, { logs: [] });
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
router.get("/hydration", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const userId = req.userId || req.query.userId;
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("hydration_logs")
      .select("*")
      .gte("timestamp", `${today}T00:00:00`)
      .order("timestamp", { ascending: true });

    if (userId && isValidUUID(userId)) {
      query = query.eq("user_id", userId);
    }

    const { data: logs, error } = await query;

    if (error && error.code !== "42P01") {
      serverLogger.warn(`[${ROUTE_NAME}] Hydration error:`, error.message);
    }

    return sendSuccess(res, { logs: logs || [] });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Hydration error:`, error);
    return sendSuccess(res, { logs: [] });
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
      serverLogger.error(`[${ROUTE_NAME}] Log hydration error:`, error);
      return sendError(res, "Failed to log hydration", "LOG_ERROR", 500);
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
