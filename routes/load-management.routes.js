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

      // TODO: Calculate actual ACWR from training_sessions
      // For now, return mock data structure
      return sendSuccess(res, {
        acwr: 1.2,
        acute_load: 450,
        chronic_load: 375,
        risk_level: "moderate",
        recommendation: "Maintain current training load",
      });
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] ACWR error:`, error);
      return sendError(res, "Failed to calculate ACWR", "CALC_ERROR", 500);
    }
  },
);

export default router;
