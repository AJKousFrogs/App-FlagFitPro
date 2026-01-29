/**
 * Nutrition Routes
 * Handles nutrition insights endpoints
 *
 * @module routes/nutrition
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { getErrorMessage, sendError, sendErrorResponse, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "nutrition";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// PERFORMANCE INSIGHTS
// =============================================================================

router.get(
  "/performance-insights",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const exists = await supabase.from("nutrition_logs").select("id").limit(1);
      if (exists?.error && exists.error.code === "42P01") {
        return sendSuccess(res, []);
      }

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", req.userId)
        .gte("logged_at", weekAgo.toISOString());

      if (error) {
        if (error.code === "42P01") {
          return sendSuccess(res, []);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return sendSuccess(res, []);
      }

      const avgCalories =
        data.reduce((sum, log) => sum + (log.calories || 0), 0) / data.length;
      const avgProtein =
        data.reduce((sum, log) => sum + (log.protein || 0), 0) / data.length;

      const insights = [];

      if (avgCalories < 2000) {
        insights.push({
          type: "warning",
          icon: "pi pi-exclamation-triangle",
          title: "Low Calorie Intake",
          description: `Your average daily intake (${Math.round(avgCalories)} kcal) is below recommended levels for athletes.`,
          actionLabel: "Adjust Goals",
        });
      }

      if (avgProtein < 100) {
        insights.push({
          type: "warning",
          icon: "pi pi-exclamation-triangle",
          title: "Low Protein Intake",
          description:
            "Aim for 1.6-2.2g protein per kg body weight for optimal recovery.",
          actionLabel: "View Protein Sources",
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: "positive",
          icon: "pi pi-check-circle",
          title: "Good Nutrition Balance",
          description: "Your nutrition is well-balanced. Keep up the great work!",
        });
      }

      return sendSuccess(res, insights);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load insights");
      serverLogger.error(`[${ROUTE_NAME}] Insights error: ${errorMessage}`, error);
      return sendErrorResponse(
        res,
        error,
        "Failed to load insights",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

export default router;
