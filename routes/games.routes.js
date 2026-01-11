/**
 * Games and Tournaments Routes
 * Handles game data, tournaments, and related endpoints
 *
 * @module routes/games
 * @version 1.0.0
 */

import express from "express";
import { optionalAuth } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { isValidUUID, sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "games";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// GAMES ENDPOINTS
// =============================================================================

/**
 * GET /
 * Get games list with optional date filtering
 */
router.get(
  "/",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { startDate, endDate, limit } = req.query;
      let query = supabase.from("games").select("*");

      if (startDate) {
        query = query.gte("game_date", startDate);
      }
      if (endDate) {
        query = query.lte("game_date", endDate);
      }

      const { data: games, error } = await query
        .order("game_date", { ascending: true })
        .limit(parseInt(limit) || 50);

      if (error) {
        throw error;
      }

      return sendSuccess(res, games || []);
    } catch (error) {
      serverLogger.error("[Games] Error:", error);
      return sendSuccess(res, [], "No data available");
    }
  },
);

// =============================================================================
// TOURNAMENTS ENDPOINTS
// =============================================================================

/**
 * GET /tournaments
 * Get all tournaments
 */
router.get(
  "/tournaments",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { data: tournaments, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        throw error;
      }

      return sendSuccess(res, tournaments || []);
    } catch (error) {
      serverLogger.error("[Tournaments] Error:", error);
      return sendSuccess(res, [], "No data available");
    }
  },
);

/**
 * GET /tournaments/:id
 * Get tournament details with games
 */
router.get(
  "/tournaments/:id",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, null);
    }

    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        return sendError(res, "Invalid tournament ID", "VALIDATION_ERROR", 400);
      }

      const { data: tournament, error } = await supabase
        .from("tournaments")
        .select(
          `
          *,
          games:tournament_games (*)
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, tournament);
    } catch (error) {
      serverLogger.error("[Tournament Details] Error:", error);
      return sendSuccess(res, null);
    }
  },
);

/**
 * POST /tournaments/createGame
 * Create a new tournament game
 */
router.post(
  "/tournaments/createGame",
  rateLimit("WRITE"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const { data: game, error } = await supabase
        .from("tournament_games")
        .insert(req.body)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, game);
    } catch (error) {
      serverLogger.error("[Create Game] Error:", error);
      return sendError(res, "Failed to create game", "CREATE_ERROR", 500);
    }
  },
);

export default router;
