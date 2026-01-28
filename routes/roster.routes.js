/**
 * Roster Routes
 * Handles team roster and player management endpoints
 *
 * @module routes/roster
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { isValidUUID, sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "roster";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// ROSTER ENDPOINTS
// =============================================================================

/**
 * GET /
 * Get team roster
 */
router.get("/", rateLimit("READ"), authenticateToken, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const staffRoles = new Set([
      "coach",
      "head_coach",
      "assistant_coach",
      "offense_coordinator",
      "defense_coordinator",
      "admin",
      "owner",
    ]);

    const isStaff = staffRoles.has(req.user?.role || "");

    let query = supabase
      .from("team_members")
      .select(
        `
          id, role, jersey_number, position, status, joined_at,
          users:user_id (id, email, full_name, avatar_url)
        `,
      )
      .order("jersey_number");

    if (!isStaff) {
      query = query.eq("user_id", req.userId);
    }

    const { data: roster, error } = await query;

    if (error) {
      throw error;
    }

    return sendSuccess(res, roster || []);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Roster error:`, error);
    return sendError(res, "Failed to load roster", "FETCH_ERROR", 500);
  }
});

/**
 * GET /players
 * Get roster players with formatted data
 */
router.get("/players", rateLimit("READ"), authenticateToken, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const staffRoles = new Set([
      "coach",
      "head_coach",
      "assistant_coach",
      "offense_coordinator",
      "defense_coordinator",
      "admin",
      "owner",
    ]);
    const isStaff = staffRoles.has(req.user?.role || "");

    let query = supabase
      .from("team_members")
      .select(
        `
          id, role, jersey_number, position, status, joined_at,
          user:user_id (id, email, full_name, first_name, last_name)
        `,
      )
      .eq("status", "active")
      .order("jersey_number");

    if (!isStaff) {
      query = query.eq("user_id", req.userId);
    }

    const { data: players, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to expected format
    const formattedPlayers = (players || []).map((p) => {
      // Normalize player name
      const name =
        p.user?.full_name ||
        [p.user?.first_name, p.user?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Unknown";

      return {
        id: p.id,
        userId: p.user?.id,
        name,
        email: p.user?.email,
        position: p.position,
        jerseyNumber: p.jersey_number,
        role: p.role,
        status: p.status,
        joinedAt: p.joined_at,
      };
    });

    return sendSuccess(res, formattedPlayers);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Players error:`, error);
    return sendSuccess(res, [], "No data available");
  }
});

export default router;
