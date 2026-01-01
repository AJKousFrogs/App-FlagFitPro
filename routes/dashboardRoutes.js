/**
 * Dashboard Routes API
 * Provides dashboard data and overview metrics for FlagFit Pro
 *
 * @module routes/dashboardRoutes
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
  createErrorResponse,
  sendError,
  sendSuccess,
  safeParseFloat,
  safePercentage,
} from "./utils/validation.js";

dotenv.config();

const router = express.Router();
const ROUTE_NAME = "dashboard";

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
// DASHBOARD ENDPOINTS
// =============================================================================

/**
 * GET /overview
 * Get dashboard overview data including training progress, performance, and team chemistry
 * @query {string} userId - User ID (optional, defaults to '1' for demo)
 * @returns {object} Dashboard overview data
 */
router.get("/overview", async (req, res) => {
  try {
    const userIdParam = req.query.userId || "1";

    if (req.query.userId) {
      const validation = validateUserId(userIdParam);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }
    }

    const userId = userIdParam;

    // Try Supabase first, fallback to raw SQL
    let trainingData = null;
    let performanceData = null;
    let chemistryData = null;
    let upcomingSession = null;

    if (supabase) {
      // Get training progress from Supabase
      const { data: sessions } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte(
          "session_date",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        );

      trainingData = {
        completed: sessions?.length || 0,
        percentage: safePercentage(sessions?.length || 0, 7, 0),
      };

      // Get performance metrics
      const { data: metrics } = await supabase
        .from("performance_metrics")
        .select("performance_score")
        .eq("user_id", userId)
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        );

      if (metrics?.length > 0) {
        const avgScore =
          metrics.reduce((sum, m) => sum + (m.performance_score || 0), 0) /
          metrics.length;
        performanceData = {
          score: avgScore.toFixed(1),
          total: metrics.length,
        };
      }

      // Get team chemistry
      const { data: chemistry } = await supabase
        .from("team_chemistry")
        .select("chemistry_score, communication_score, trust_score")
        .eq("user_id", userId)
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(1)
        .order("created_at", { ascending: false });

      if (chemistry?.length > 0) {
        chemistryData = chemistry[0];
      }

      // Get upcoming session
      const { data: upcoming } = await supabase
        .from("training_sessions")
        .select("session_type, scheduled_time, duration_minutes")
        .eq("user_id", userId)
        .eq("status", "scheduled")
        .gte("session_date", new Date().toISOString())
        .order("session_date", { ascending: true })
        .limit(1);

      if (upcoming?.length > 0) {
        upcomingSession = upcoming[0];
      }
    } else if (pool) {
      // Fallback to raw SQL queries
      const trainingProgressQuery = `
        SELECT 
          COUNT(*) as completed_sessions,
          COUNT(*) * 100.0 / 7 as progress_percentage
        FROM training_sessions 
        WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '7 days'
        AND status = 'completed'
      `;

      const performanceQuery = `
        SELECT 
          AVG(performance_score) as avg_score,
          COUNT(*) as total_sessions
        FROM performance_metrics 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const teamChemistryQuery = `
        SELECT 
          AVG(chemistry_score) as avg_chemistry,
          AVG(communication_score) as avg_communication,
          AVG(trust_score) as avg_trust
        FROM team_chemistry 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const upcomingQuery = `
        SELECT 
          session_type,
          scheduled_time,
          duration_minutes
        FROM training_sessions 
        WHERE user_id = $1 
        AND session_date >= CURRENT_DATE
        AND status = 'scheduled'
        ORDER BY session_date ASC
        LIMIT 1
      `;

      const [
        trainingResult,
        performanceResult,
        chemistryResult,
        upcomingResult,
      ] = await Promise.all([
        executeQuery(trainingProgressQuery, [userId]),
        executeQuery(performanceQuery, [userId]),
        executeQuery(teamChemistryQuery, [userId]),
        executeQuery(upcomingQuery, [userId]),
      ]);

      trainingData = {
        completed: safeParseInt(trainingResult.rows[0]?.completed_sessions, 0),
        percentage: safePercentage(
          trainingResult.rows[0]?.completed_sessions || 0,
          7,
          0,
        ),
      };

      performanceData = {
        score: safeParseFloat(
          performanceResult.rows[0]?.avg_score,
          8.4,
        ).toFixed(1),
        total: safeParseInt(performanceResult.rows[0]?.total_sessions, 0),
      };

      chemistryData = {
        chemistry_score: chemistryResult.rows[0]?.avg_chemistry,
        communication_score: chemistryResult.rows[0]?.avg_communication,
        trust_score: chemistryResult.rows[0]?.avg_trust,
      };

      upcomingSession = upcomingResult.rows[0];
    }

    const overview = {
      trainingProgress: {
        percentage: trainingData?.percentage || 0,
        completed: trainingData?.completed || 0,
        trend: "+12% from last week",
      },
      performanceScore: {
        score: performanceData?.score || "8.4",
        total: performanceData?.total || 0,
        status: "Olympic standard reached",
      },
      teamChemistry: {
        overall: safeParseFloat(chemistryData?.chemistry_score, 9.1).toFixed(1),
        communication: safeParseFloat(
          chemistryData?.communication_score,
          9.1,
        ).toFixed(1),
        trust: safeParseFloat(chemistryData?.trust_score, 8.7).toFixed(1),
        status: "Excellent team synergy",
      },
      nextSession: {
        type: upcomingSession?.session_type || "Olympic preparation training",
        time: upcomingSession?.scheduled_time || "4:00 PM",
        duration: safeParseInt(upcomingSession?.duration_minutes, 120),
      },
    };

    return sendSuccess(res, overview);
  } catch (error) {
    serverLogger.error(`${ROUTE_NAME.toUpperCase()} overview error:`, error);
    return sendError(
      res,
      "Failed to fetch dashboard data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /training-calendar
 * Get 7-day training calendar data
 * @query {string} userId - User ID (optional, defaults to '1')
 * @returns {object} Training calendar data for the week
 */
router.get("/training-calendar", async (req, res) => {
  try {
    const userIdParam = req.query.userId || "1";

    if (req.query.userId) {
      const validation = validateUserId(userIdParam);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }
    }

    const userId = userIdParam;
    let sessionData = [];

    if (supabase) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const { data } = await supabase
        .from("training_sessions")
        .select(
          "session_date, session_type, status, duration_minutes, performance_score",
        )
        .eq("user_id", userId)
        .gte("session_date", startDate.toISOString())
        .lte("session_date", endDate.toISOString())
        .order("session_date", { ascending: true });

      sessionData = data || [];
    } else if (pool) {
      const query = `
        SELECT 
          session_date,
          session_type,
          status,
          duration_minutes,
          performance_score
        FROM training_sessions 
        WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '3 days'
        AND session_date <= CURRENT_DATE + INTERVAL '3 days'
        ORDER BY session_date ASC
      `;

      const result = await executeQuery(query, [userId]);
      sessionData = result.rows;
    }

    // Generate calendar data for the week
    const calendar = [];
    const today = new Date();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayData = sessionData.find((row) => {
        try {
          const rowDate = new Date(row.session_date);
          return rowDate.toDateString() === date.toDateString();
        } catch {
          return false;
        }
      });

      calendar.push({
        dayName: dayNames[date.getDay()],
        dayDate: date.getDate(),
        dayTraining: dayData?.session_type || "Rest Day",
        trainingStatus: dayData?.status || "Scheduled",
        isToday: i === 0,
        isCompleted: dayData?.status === "completed",
        performanceScore: safeParseFloat(dayData?.performance_score, 0),
      });
    }

    return sendSuccess(res, calendar);
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} training calendar error:`,
      error,
    );
    return sendError(
      res,
      "Failed to fetch training calendar",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /olympic-qualification
 * Get LA28 Olympic qualification data
 */
router.get("/olympic-qualification", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let olympicData = null;
    let benchmarks = [];

    if (supabase) {
      const { data: qualification } = await supabase
        .from("olympic_qualification")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (qualification?.length > 0) {
        olympicData = qualification[0];
      }

      const { data: benchmarkData } = await supabase
        .from("performance_benchmarks")
        .select("metric_name, current_value, target_value, unit")
        .eq("user_id", userId)
        .order("metric_name");

      if (benchmarkData?.length > 0) {
        benchmarks = benchmarkData;
      }
    } else if (pool) {
      const query = `
        SELECT 
          qualification_probability,
          world_ranking,
          days_until_championship,
          european_championship_date,
          world_championship_date,
          olympic_date
        FROM olympic_qualification 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await executeQuery(query, [userId]);
      olympicData = result.rows[0];

      const benchmarksQuery = `
        SELECT 
          metric_name,
          current_value,
          target_value,
          unit
        FROM performance_benchmarks 
        WHERE user_id = $1
        ORDER BY metric_name
      `;

      const benchmarksResult = await executeQuery(benchmarksQuery, [userId]);
      benchmarks = benchmarksResult.rows;
    }

    // Default data if not found
    olympicData ||= {
      qualification_probability: 73,
      world_ranking: 8,
      days_until_championship: 124,
      european_championship_date: "2025-09-24",
      world_championship_date: "2026-07-15",
      olympic_date: "2028-07-14",
    };

    benchmarks =
      benchmarks.length > 0
        ? benchmarks
        : [
            {
              metric_name: "40-Yard Dash",
              current_value: 4.52,
              target_value: 4.4,
              unit: "s",
            },
            {
              metric_name: "Passing Accuracy",
              current_value: 82.5,
              target_value: 85,
              unit: "%",
            },
            {
              metric_name: "Agility Shuttle",
              current_value: 4.18,
              target_value: 4.0,
              unit: "s",
            },
            {
              metric_name: "Game IQ Score",
              current_value: 87,
              target_value: 90,
              unit: "",
            },
          ];

    return sendSuccess(res, {
      qualification: olympicData,
      benchmarks,
    });
  } catch (error) {
    serverLogger.error("Olympic qualification error:", error);
    return sendError(
      res,
      "Failed to fetch Olympic data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /sponsor-rewards
 * Get sponsor rewards data
 */
router.get("/sponsor-rewards", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let sponsorData = null;
    let products = [];

    if (supabase) {
      const { data: rewards } = await supabase
        .from("sponsor_rewards")
        .select(
          "available_points, current_tier, products_available, tier_progress_percentage",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (rewards?.length > 0) {
        sponsorData = rewards[0];
      }

      const { data: productData } = await supabase
        .from("sponsor_products")
        .select("product_name, points_cost, relevance_score, category")
        .eq("is_featured", true)
        .order("relevance_score", { ascending: false })
        .limit(4);

      if (productData?.length > 0) {
        products = productData;
      }
    } else if (pool) {
      const query = `
        SELECT 
          available_points,
          current_tier,
          products_available,
          tier_progress_percentage
        FROM sponsor_rewards 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await executeQuery(query, [userId]);
      sponsorData = result.rows[0];

      const productsQuery = `
        SELECT 
          product_name,
          points_cost,
          relevance_score,
          category
        FROM sponsor_products 
        WHERE is_featured = true
        ORDER BY relevance_score DESC
        LIMIT 4
      `;

      const productsResult = await executeQuery(productsQuery, []);
      products = productsResult.rows;
    }

    // Default data
    sponsorData ||= {
      available_points: 2847,
      current_tier: "GOLD",
      products_available: 236,
      tier_progress_percentage: 65,
    };

    products =
      products.length > 0
        ? products
        : [
            {
              product_name: "Pro Grip Football Socks",
              points_cost: 350,
              relevance_score: 92,
              category: "Gear",
            },
            {
              product_name: "Recovery Massage Gun",
              points_cost: 1650,
              relevance_score: 78,
              category: "Recovery",
            },
            {
              product_name: "Elite Training Shorts",
              points_cost: 780,
              relevance_score: 89,
              category: "Gear",
            },
            {
              product_name: "Recovery Band Set",
              points_cost: 420,
              relevance_score: 94,
              category: "Recovery",
            },
          ];

    return sendSuccess(res, {
      rewards: sponsorData,
      products,
    });
  } catch (error) {
    serverLogger.error("Sponsor rewards error:", error);
    return sendError(
      res,
      "Failed to fetch sponsor data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /wearables
 * Get wearables data
 */
router.get("/wearables", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let wearablesData = [];

    if (supabase) {
      const { data } = await supabase
        .from("wearables_data")
        .select(
          "device_type, heart_rate, hrv, sleep_score, training_load, last_sync, connection_status",
        )
        .eq("user_id", userId)
        .order("last_sync", { ascending: false });

      if (data?.length > 0) {
        wearablesData = data;
      }
    } else if (pool) {
      const query = `
        SELECT 
          device_type,
          heart_rate,
          hrv,
          sleep_score,
          training_load,
          last_sync,
          connection_status
        FROM wearables_data 
        WHERE user_id = $1
        ORDER BY last_sync DESC
      `;

      const result = await executeQuery(query, [userId]);
      wearablesData = result.rows;
    }

    // Default data
    wearablesData =
      wearablesData.length > 0
        ? wearablesData
        : [
            {
              device_type: "Apple Watch",
              heart_rate: 142,
              hrv: 38,
              sleep_score: 87,
              training_load: 247,
              last_sync: safeFormatDate(new Date()),
              connection_status: "connected",
            },
          ];

    return sendSuccess(res, wearablesData);
  } catch (error) {
    serverLogger.error("Wearables error:", error);
    return sendError(
      res,
      "Failed to fetch wearables data",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /team-chemistry
 * Get team chemistry data
 */
router.get("/team-chemistry", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let chemistryData = null;

    if (supabase) {
      const { data } = await supabase
        .from("team_chemistry")
        .select(
          "overall_chemistry, communication_score, trust_score, leadership_score, last_intervention, intervention_effectiveness",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.length > 0) {
        chemistryData = data[0];
      }
    } else if (pool) {
      const query = `
        SELECT 
          overall_chemistry,
          communication_score,
          trust_score,
          leadership_score,
          last_intervention,
          intervention_effectiveness
        FROM team_chemistry 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await executeQuery(query, [userId]);
      chemistryData = result.rows[0];
    }

    // Default data
    chemistryData ||= {
      overall_chemistry: 8.4,
      communication_score: 9.1,
      trust_score: 8.7,
      leadership_score: 8.2,
      last_intervention: "Trust building exercise",
      intervention_effectiveness: 87,
    };

    return sendSuccess(res, chemistryData);
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
 * GET /notifications
 * Get notifications
 */
router.get("/notifications", async (req, res) => {
  try {
    const userId = req.query.userId || "1";

    let notifications = [];

    if (supabase) {
      const { data } = await supabase
        .from("notifications")
        .select("notification_type, message, is_read, created_at, priority")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data?.length > 0) {
        notifications = data;
      }
    } else if (pool) {
      const query = `
        SELECT 
          notification_type,
          message,
          is_read,
          created_at,
          priority
        FROM notifications 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await executeQuery(query, [userId]);
      notifications = result.rows;
    }

    // Default notifications
    notifications =
      notifications.length > 0
        ? notifications
        : [
            {
              notification_type: "injury_risk",
              message: "Injury risk alert: Landing mechanics suboptimal",
              is_read: false,
              created_at: safeFormatDate(new Date(Date.now() - 15 * 60 * 1000)),
              priority: "high",
            },
            {
              notification_type: "weather",
              message: "Weather alert: Tomorrow's practice moved to 6PM",
              is_read: false,
              created_at: safeFormatDate(
                new Date(Date.now() - 2 * 60 * 60 * 1000),
              ),
              priority: "medium",
            },
            {
              notification_type: "tournament",
              message: "European Championship bracket updated",
              is_read: false,
              created_at: safeFormatDate(
                new Date(Date.now() - 4 * 60 * 60 * 1000),
              ),
              priority: "low",
            },
          ];

    return sendSuccess(res, notifications);
  } catch (error) {
    serverLogger.error("Notifications error:", error);
    return sendError(
      res,
      "Failed to fetch notifications",
      "FETCH_ERROR",
      500,
      error.message,
    );
  }
});

/**
 * GET /daily-quote
 * Get daily quote
 */
router.get("/daily-quote", async (req, res) => {
  try {
    let quote = null;

    if (supabase) {
      // Get random quote from Supabase
      const { data } = await supabase
        .from("daily_quotes")
        .select("quote_text, author, category")
        .eq("is_active", true)
        .limit(10);

      if (data?.length > 0) {
        // Pick random quote from results
        quote = data[Math.floor(Math.random() * data.length)];
      }
    } else if (pool) {
      const query = `
        SELECT 
          quote_text,
          author,
          category
        FROM daily_quotes 
        WHERE is_active = true
        ORDER BY RANDOM()
        LIMIT 1
      `;

      const result = await executeQuery(query, []);
      quote = result.rows[0];
    }

    // Default quote
    quote ||= {
      quote_text:
        "Champions aren't made in comfort zones. Today's training is tomorrow's victory.",
      author: "Coach Marcus Rivera",
      category: "motivation",
    };

    return sendSuccess(res, quote);
  } catch (error) {
    serverLogger.error("Daily quote error:", error);
    return sendError(
      res,
      "Failed to fetch daily quote",
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
