/**
 * Coach Routes
 * Handles coach-specific endpoints and dashboard data
 *
 * @module routes/coach
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken, requireRole } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "coach";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// COACH ENDPOINTS
// =============================================================================

/**
 * GET /dashboard
 * Get coach dashboard data with team members and stats
 */
router.get(
  "/dashboard",
  rateLimit("READ"),
  authenticateToken,
  requireRole("coach", "head_coach", "assistant_coach", "admin", "owner"),
  async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, { teamMembers: [], stats: {} });
  }

  try {
    // Get team members
    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select(
        `
          id, role, jersey_number, position, status,
          users:user_id (id, email, full_name)
        `,
      )
      .eq("status", "active")
      .limit(50);

    if (membersError) {
      throw membersError;
    }

    // Get recent training sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: sessionCount, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("*", { count: "exact", head: true })
      .gte("session_date", sevenDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    if (sessionsError) {
      throw sessionsError;
    }

    return sendSuccess(res, {
      teamMembers: members || [],
      stats: {
        totalPlayers: members?.length || 0,
        sessionsThisWeek: sessionCount || 0,
      },
    });
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Dashboard error:`, error);
    return sendSuccess(res, { teamMembers: [], stats: {} });
  }
});

/**
 * GET /games
 * Get coach's games list
 */
router.get(
  "/games",
  rateLimit("READ"),
  authenticateToken,
  requireRole("coach", "head_coach", "assistant_coach", "admin", "owner"),
  async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, []);
  }

  try {
    const { data: games, error } = await supabase
      .from("games")
      .select("*")
      .order("game_date", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return sendSuccess(res, games || []);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Games error:`, error);
    return sendSuccess(res, []);
  }
});

export default router;
