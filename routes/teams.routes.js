/**
 * Teams Routes
 * Handles team management endpoints
 *
 * @module routes/teams
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
const ROUTE_NAME = "teams";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// TEAMS ENDPOINTS
// =============================================================================

/**
 * GET /
 * Get all active teams
 */
router.get("/", rateLimit("READ"), authenticateToken, async (req, res) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  try {
    const { data: memberships, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", req.userId)
      .eq("status", "active");

    if (membershipError) {
      throw membershipError;
    }

    const teamIds = memberships?.map((m) => m.team_id) || [];
    if (teamIds.length === 0) {
      return sendSuccess(res, []);
    }

    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .eq("is_active", true)
      .in("id", teamIds)
      .order("name");

    if (error) {
      throw error;
    }

    return sendSuccess(res, teams || []);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Teams error:`, error);
    return sendError(res, "Failed to load teams", "FETCH_ERROR", 500);
  }
});

/**
 * GET /:id
 * Get team details with members
 */
router.get("/:id", rateLimit("READ"), authenticateToken, async (req, res) => {
  if (!supabase) {
    return sendSuccess(res, null);
  }

  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
    }

    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("team_id", id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
    }

    const { data: team, error } = await supabase
      .from("teams")
      .select(
        `
          *,
          members:team_members (
            id, role, jersey_number, position,
            users:user_id (id, email, full_name)
          )
        `,
      )
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return sendSuccess(res, team);
  } catch (error) {
    serverLogger.error(`[${ROUTE_NAME}] Team details error:`, error);
    return sendError(res, "Failed to load team", "FETCH_ERROR", 500);
  }
});

export default router;
