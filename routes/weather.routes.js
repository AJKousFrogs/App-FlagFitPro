/**
 * Weather Routes
 * Handles weather data endpoints
 *
 * @module routes/weather
 * @version 1.0.0
 */

import express from "express";
import { optionalAuth } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "weather";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// WEATHER ENDPOINTS
// =============================================================================

/**
 * GET /current
 * Get current weather data for a location
 */
router.get("/current", rateLimit("READ"), optionalAuth, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { location = "Training Ground" } = req.query;

    // Check if we have a weather table
    const { data: weather, error } = await supabase
      .from("weather_data")
      .select("*")
      .ilike("location", `%${location}%`)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!weather) {
      return sendSuccess(
        res,
        null,
        "Real-time weather data not available for this location",
      );
    }

    return sendSuccess(res, {
      temperature: weather.temperature,
      temperatureUnit: weather.unit || "C",
      humidity: weather.humidity,
      conditions: weather.conditions,
      windSpeed: weather.wind_speed,
      windUnit: "km/h",
      uvIndex: weather.uv_index,
      precipitation: weather.precipitation,
      feelsLike: weather.feels_like,
      icon: weather.icon,
      location: weather.location,
      lastUpdated: weather.timestamp,
      recommendations: weather.recommendations || {
        hydration: "normal",
        sunProtection: "standard",
        warmUp: "standard",
      },
    });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Weather error:`, error);
    return sendError(res, "Failed to load weather data", "FETCH_ERROR", 500);
  }
});

export default router;
