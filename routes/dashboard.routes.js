/**
 * Dashboard Routes
 * Handles dashboard data, overview, and quick stats
 *
 * @module routes/dashboard
 * @version 2.3.0
 */

import express from "express";
import {
    optionalAuth
} from "./middleware/auth.middleware.js";
import { withCache } from "./utils/cache.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { DEMO_USER_ID, isValidUUID, sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "dashboard";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "2.3.0"));

// =============================================================================
// DASHBOARD OVERVIEW
// =============================================================================

/**
 * GET /overview
 * Get dashboard overview data
 * Cached for 30 seconds with ETag support
 */
router.get(
  "/overview",
  rateLimit("READ"),
  withCache("DASHBOARD"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const userId = req.userId || req.query.userId;

      // Get training sessions count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let sessionsQuery = supabase
        .from("training_sessions")
        .select("id, session_date, rpe, duration_minutes, status", {
          count: "exact",
        })
        .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
        .eq("status", "completed");

      if (userId && isValidUUID(userId)) {
        sessionsQuery = sessionsQuery.eq("user_id", userId);
      }

      const {
        data: sessions,
        count: sessionCount,
        error,
      } = await sessionsQuery.limit(100);

      if (error) {
        throw error;
      }

      // Calculate performance score (average RPE inverted)
      const avgRpe =
        sessions?.length > 0
          ? sessions.reduce((sum, s) => sum + (s.rpe || 5), 0) / sessions.length
          : 5;
      const performanceScore = Math.round(100 - (avgRpe - 5) * 10);

      // Calculate day streak
      let dayStreak = 0;
      if (sessions && sessions.length > 0) {
        const sortedDates = [...new Set(sessions.map((s) => s.session_date))]
          .sort()
          .reverse();
        const today = new Date().toISOString().split("T")[0];
        let checkDate = new Date(today);

        for (const date of sortedDates) {
          const diff = Math.floor(
            (checkDate - new Date(date)) / (1000 * 60 * 60 * 24),
          );
          if (diff <= 1) {
            dayStreak++;
            checkDate = new Date(date);
          } else {
            break;
          }
        }
      }

      // Get upcoming sessions
      const { data: upcomingSessions } = await supabase
        .from("training_sessions")
        .select("id, session_date, session_type, title")
        .gte("session_date", new Date().toISOString().split("T")[0])
        .eq("status", "scheduled")
        .order("session_date", { ascending: true })
        .limit(5);

      return sendSuccess(res, {
        stats: {
          trainingSessions: sessionCount || 0,
          performanceScore: Math.min(100, Math.max(0, performanceScore)),
          dayStreak,
          tournaments: 0,
        },
        activities:
          sessions?.slice(0, 5).map((s) => ({
            id: s.id,
            type: "training",
            date: s.session_date,
            rpe: s.rpe,
            duration: s.duration_minutes,
          })) || [],
        upcomingSessions: upcomingSessions || [],
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Overview error:`, error);
      return sendError(
        res,
        "Failed to load dashboard data",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// TRAINING CALENDAR
// =============================================================================

/**
 * GET /training-calendar
 * Get training calendar data
 */
router.get(
  "/training-calendar",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { data: sessions } = await supabase
        .from("training_sessions")
        .select("id, workout_type, session_date, duration_minutes")
        .order("session_date", { ascending: true });

      return sendSuccess(res, {
        calendar: sessions || [],
        upcomingSessions: sessions || [],
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Training calendar error:`, error);
      return sendError(res, error.message, "FETCH_ERROR", 500);
    }
  },
);

// =============================================================================
// OLYMPIC QUALIFICATION
// =============================================================================

/**
 * GET /olympic-qualification
 * Get Olympic qualification data
 */
router.get(
  "/olympic-qualification",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      let userId = req.userId || req.query.userId || DEMO_USER_ID;
      if (!isValidUUID(userId)) {
        userId = DEMO_USER_ID;
      }

      const { data: qual } = await supabase
        .from("olympic_qualification")
        .select("*")
        .eq("user_id", userId)
        .single();

      const { data: benchmarks } = await supabase
        .from("performance_benchmarks")
        .select("*")
        .eq("user_id", userId);

      return sendSuccess(res, {
        qualification: qual || null,
        benchmarks: benchmarks || [],
        message:
          !qual && (!benchmarks || benchmarks.length === 0)
            ? "No qualification data found"
            : null,
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Olympic qualification error:`, error);
      return sendError(res, error.message, "FETCH_ERROR", 500);
    }
  },
);

// =============================================================================
// SPONSOR REWARDS
// =============================================================================

/**
 * GET /sponsor-rewards
 * Get sponsor rewards data
 */
router.get(
  "/sponsor-rewards",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      let userId = req.userId || req.query.userId || DEMO_USER_ID;
      if (!isValidUUID(userId)) {
        userId = DEMO_USER_ID;
      }

      const { data: rewards } = await supabase
        .from("sponsor_rewards")
        .select("*")
        .eq("user_id", userId)
        .single();

      const { data: products } = await supabase
        .from("sponsor_products")
        .select("*")
        .limit(5);

      return sendSuccess(res, {
        rewards: rewards || null,
        products: products || [],
        message: !rewards ? "No sponsor rewards data found" : null,
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Sponsor rewards error:`, error);
      return sendError(res, error.message, "FETCH_ERROR", 500);
    }
  },
);

// =============================================================================
// TEAM CHEMISTRY
// =============================================================================

/**
 * GET /team-chemistry
 * Get team chemistry data
 */
router.get(
  "/team-chemistry",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      let userId = req.userId || req.query.userId || DEMO_USER_ID;
      if (!isValidUUID(userId)) {
        userId = DEMO_USER_ID;
      }

      const { data: chem } = await supabase
        .from("team_chemistry")
        .select("*")
        .eq("user_id", userId)
        .single();

      return sendSuccess(res, {
        data: chem || null,
        message: !chem ? "No team chemistry data found" : null,
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Team chemistry error:`, error);
      return sendError(res, error.message, "FETCH_ERROR", 500);
    }
  },
);

// =============================================================================
// DAILY QUOTE
// =============================================================================

/**
 * GET /daily-quote
 * Get daily motivational quote
 */
router.get("/daily-quote", rateLimit("READ"), async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    // Get a random quote using the day of year as seed
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000,
    );

    const { data: quotes } = await supabase
      .from("daily_quotes")
      .select("*")
      .limit(100);

    if (quotes && quotes.length > 0) {
      const quote = quotes[dayOfYear % quotes.length];
      return sendSuccess(res, quote);
    }

    return sendSuccess(res, {
      quote:
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
    });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Daily quote error:`, error);
    return sendSuccess(res, {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    });
  }
});

// =============================================================================
// NOTIFICATIONS - DEPRECATED
// =============================================================================
// NOTE: Notification endpoints have been consolidated to /api/notifications
// Use notificationsRoutes instead. These endpoints are removed to avoid duplication.
// Frontend should use: /api/notifications and /api/notifications/count

// =============================================================================
// HEALTH ENDPOINTS (Component-specific)
// =============================================================================

/**
 * GET /health
 * Main dashboard health check
 */
router.get(
  "/analytics/health",
  rateLimit("READ"),
  createHealthCheckHandler("dashboard-analytics", "2.3.0"),
);

router.get(
  "/coach/health",
  rateLimit("READ"),
  createHealthCheckHandler("dashboard-coach", "2.3.0"),
);

router.get(
  "/community/health",
  rateLimit("READ"),
  createHealthCheckHandler("dashboard-community", "2.3.0"),
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Dashboard endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
  });
});

export default router;
