/**
 * Load Management Routes
 * Handles ACWR (Acute:Chronic Workload Ratio) and load monitoring endpoints
 *
 * @module routes/load-management
 * @version 1.0.0
 */

import express from "express";
import { optionalAuth, authorizeUserAccess } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { DEMO_USER_ID, isValidUUID, sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "load-management";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// LOAD MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /acwr
 * Get ACWR (Acute:Chronic Workload Ratio) data for a user
 *
 * Contract: Returns latest ACWR data from load_monitoring table.
 * If no data exists, returns null values with guidance to use FE calculation.
 *
 * Response shape:
 * {
 *   acwr: number | null,
 *   acute_load: number | null,
 *   chronic_load: number | null,
 *   risk_level: 'low' | 'moderate' | 'high' | 'very-high' | null,
 *   calculated_at: string | null,
 *   data_source: 'database' | 'none'
 * }
 */
router.get(
  "/acwr",
  rateLimit("READ"),
  optionalAuth,
  authorizeUserAccess,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const authHeader = req.headers.authorization;
      let userId = req.query.user_id;

      if (authHeader && !userId) {
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        userId = user?.id;
      }

      if (!userId) {
        return sendError(res, "User ID required", "VALIDATION_ERROR", 400);
      }

      // Handle invalid UUIDs
      if (!isValidUUID(userId)) {
        userId = DEMO_USER_ID;
      }

      // Fetch latest ACWR data from load_monitoring table
      const { data: loadData, error: loadError } = await supabase
        .from("load_monitoring")
        .select("acwr, acute_load, chronic_load, injury_risk_level, calculated_at")
        .eq("player_id", userId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (loadError) {
        serverLogger.warn(`[${ROUTE_NAME}] ACWR fetch warning:`, loadError);
        // Don't fail - return empty data
      }

      // Map injury_risk_level to standardized risk_level
      const mapRiskLevel = (level) => {
        if (!level) return null;
        const normalized = level.toLowerCase().replace(/[_-]/g, "-");
        const mapping = {
          "low": "low",
          "moderate": "moderate",
          "high": "high",
          "very-high": "very-high",
          "danger": "very-high",
          "danger-zone": "very-high",
          "elevated": "moderate",
          "elevated-risk": "moderate",
          "sweet-spot": "low",
          "under-training": "low",
        };
        return mapping[normalized] || "moderate";
      };

      if (loadData) {
        return sendSuccess(res, {
          acwr: loadData.acwr ? parseFloat(loadData.acwr) : null,
          acute_load: loadData.acute_load ? parseFloat(loadData.acute_load) : null,
          chronic_load: loadData.chronic_load ? parseFloat(loadData.chronic_load) : null,
          risk_level: mapRiskLevel(loadData.injury_risk_level),
          calculated_at: loadData.calculated_at,
          data_source: "database",
        });
      }

      // No data found - return null values with guidance
      return sendSuccess(res, {
        acwr: null,
        acute_load: null,
        chronic_load: null,
        risk_level: null,
        calculated_at: null,
        data_source: "none",
        message: "No ACWR data available. ACWR is calculated client-side via AcwrService and persisted after each session.",
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] ACWR error:`, error);
      return sendError(res, "Failed to fetch ACWR data", "FETCH_ERROR", 500);
    }
  },
);

export default router;
