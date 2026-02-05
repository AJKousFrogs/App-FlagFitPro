/**
 * Coach Routes
 * Handles coach-specific endpoints and dashboard data
 *
 * @module routes/coach
 * @version 1.0.0
 */

import express from "express";
import {
  authenticateToken,
  requireRole,
} from "./middleware/auth.middleware.js";
import { requireSupabase } from "./middleware/supabase-availability.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import {
  COACH_STAFF_ROLE_LIST,
  COACH_STAFF_ROLE_SET,
} from "./utils/roles.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  getErrorMessage,
  isValidUUID,
  safeAverage,
  safeParseFloat,
  sendError,
  sendErrorResponse,
  sendSuccess,
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "coach";
const STAFF_ROLES = COACH_STAFF_ROLE_SET;

const columnCache = new Map();

async function tableHasColumn(table, column) {
  if (!supabase) {
    return false;
  }
  const key = `${table}.${column}`;
  if (columnCache.has(key)) {
    return columnCache.get(key);
  }
  const { error } = await supabase.from(table).select(column).limit(1);
  if (error) {
    columnCache.set(key, false);
    return false;
  }
  columnCache.set(key, true);
  return true;
}

async function getCoachTeamIds(userId) {
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return (data || []).filter((m) => STAFF_ROLES.has(m.role));
}

async function resolveCoachTeamId(req, res) {
  const teamId = typeof req.query.team_id === "string" ? req.query.team_id : "";

  if (teamId) {
    if (!isValidUUID(teamId)) {
      sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
      return null;
    }
    const { data, error } = await supabase
      .from("team_members")
      .select("team_id, role, status")
      .eq("user_id", req.userId)
      .eq("team_id", teamId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data || !STAFF_ROLES.has(data.role)) {
      sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
      return null;
    }
    return teamId;
  }

  const memberships = await getCoachTeamIds(req.userId);
  if (memberships.length === 0) {
    sendError(res, "No team access", "UNAUTHORIZED_ACCESS", 403);
    return null;
  }

  if (memberships.length > 1) {
    sendError(
      res,
      "team_id is required for multi-team coaches",
      "VALIDATION_ERROR",
      400,
    );
    return null;
  }

  return memberships[0].team_id;
}

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
  requireRole(...COACH_STAFF_ROLE_LIST),
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, { teamMembers: [], stats: {} });
    }

    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(
          `
          id, role, jersey_number, position, status,
          users:user_id (id, email, full_name)
        `,
        )
        .eq("team_id", teamId)
        .eq("status", "active")
        .limit(50);

      if (membersError) {
        throw membersError;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const hasTeamId = await tableHasColumn("training_sessions", "team_id");
      const hasSessionDate = await tableHasColumn(
        "training_sessions",
        "session_date",
      );
      if (!hasTeamId) {
        return sendSuccess(res, {
          teamMembers: members || [],
          stats: {
            totalPlayers: members?.length || 0,
            sessionsThisWeek: 0,
          },
        });
      }

      let sessionsQuery = supabase
        .from("training_sessions")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId);

      if (hasSessionDate) {
        sessionsQuery = sessionsQuery.gte(
          "session_date",
          sevenDaysAgo.toISOString().split("T")[0],
        );
      }

      const { count: sessionCount, error: sessionsError } = await sessionsQuery;

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
  },
);

/**
 * GET /team
 * Get coach team details and members
 */
router.get(
  "/team",
  rateLimit("READ"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, { team: null, members: [] });
    }

    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle();

      if (teamError) {
        throw teamError;
      }

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(
          `
          id, role, jersey_number, position, status,
          users:user_id (id, email, full_name, avatar_url)
        `,
        )
        .eq("team_id", teamId)
        .order("jersey_number");

      if (membersError) {
        throw membersError;
      }

      return sendSuccess(res, { team, members: members || [] });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load team");
      serverLogger.error(`[${ROUTE_NAME}] Team error: ${errorMessage}`, error);
      return sendErrorResponse(
        res,
        error,
        "Failed to load team",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /training-analytics
 * Aggregate training data for coach view
 */
router.get(
  "/training-analytics",
  rateLimit("READ"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, {
        sessions: 0,
        averagePerformance: 0,
        averageDuration: 0,
      });
    }

    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const days = Math.max(1, parseInt(req.query.days, 10) || 30);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const hasTeamId = await tableHasColumn("training_sessions", "team_id");
      const hasSessionDate = await tableHasColumn(
        "training_sessions",
        "session_date",
      );

      if (!hasTeamId) {
        return sendSuccess(res, {
          sessions: 0,
          averageDuration: 0,
          averagePerformance: 0,
        });
      }

      let query = supabase
        .from("training_sessions")
        .select("duration_minutes, performance_score")
        .eq("team_id", teamId);

      if (hasSessionDate) {
        query = query.gte(
          "session_date",
          startDate.toISOString().split("T")[0],
        );
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      const durations = (data || []).map((row) =>
        safeParseFloat(row.duration_minutes, 0),
      );
      const performances = (data || []).map((row) =>
        safeParseFloat(row.performance_score, 0),
      );

      return sendSuccess(res, {
        sessions: data?.length || 0,
        averageDuration: Math.round(safeAverage(durations, 0)),
        averagePerformance: Math.round(safeAverage(performances, 0) * 10) / 10,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load training analytics",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Training analytics error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load training analytics",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

/**
 * POST /training-session
 * Record a training session for a player
 */
router.post(
  "/training-session",
  rateLimit("CREATE"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const payload = req.body || {};
      const athleteId =
        payload.user_id || payload.athlete_id || payload.player_id;

      if (!athleteId || !isValidUUID(athleteId)) {
        return sendError(res, "Invalid athlete ID", "VALIDATION_ERROR", 400);
      }

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", athleteId)
        .eq("status", "active")
        .maybeSingle();

      if (memberError) {
        throw memberError;
      }

      if (!member) {
        return sendError(res, "Player not on team", "UNAUTHORIZED_ACCESS", 403);
      }

      const hasTeamId = await tableHasColumn("training_sessions", "team_id");
      const hasUserId = await tableHasColumn("training_sessions", "user_id");
      const hasSessionDate = await tableHasColumn(
        "training_sessions",
        "session_date",
      );
      const hasCompletedAt = await tableHasColumn(
        "training_sessions",
        "completed_at",
      );

      if (!hasUserId) {
        return sendError(
          res,
          "Training sessions table missing user_id column",
          "SCHEMA_ERROR",
          500,
        );
      }

      const insertData = {};
      if (hasUserId) {
        insertData.user_id = athleteId;
      }
      if (hasTeamId) {
        insertData.team_id = teamId;
      }
      if (hasSessionDate) {
        insertData.session_date =
          payload.session_date || new Date().toISOString().split("T")[0];
      }
      if (hasCompletedAt) {
        insertData.completed_at = new Date().toISOString();
      }

      if (payload.session_type) {
        insertData.session_type = payload.session_type;
      }
      if (payload.drill_type) {
        insertData.drill_type = payload.drill_type;
      }
      if (payload.duration_minutes !== undefined) {
        insertData.duration_minutes = payload.duration_minutes;
      }
      if (payload.intensity_level !== undefined) {
        insertData.intensity_level = payload.intensity_level;
      }
      if (payload.performance_score !== undefined) {
        insertData.performance_score = payload.performance_score;
      }
      if (payload.notes) {
        insertData.notes = payload.notes;
      }

      const { data, error } = await supabase
        .from("training_sessions")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201);
      return sendSuccess(res, data, "Training session recorded");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to record training session",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Training session error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to record training session",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /calendar
 * List team calendar events
 */
router.get(
  "/calendar",
  rateLimit("READ"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const { data, error } = await supabase
        .from("team_events")
        .select("*")
        .eq("team_id", teamId)
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }

      return sendSuccess(res, data || []);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load calendar");
      serverLogger.error(
        `[${ROUTE_NAME}] Calendar error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load calendar",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

/**
 * POST /calendar
 * Create calendar event
 */
router.post(
  "/calendar",
  rateLimit("CREATE"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const payload = req.body || {};
      if (!payload.title || !payload.start_time) {
        return sendError(
          res,
          "title and start_time are required",
          "VALIDATION_ERROR",
          400,
        );
      }

      const { data, error } = await supabase
        .from("team_events")
        .insert({
          team_id: teamId,
          event_type: payload.event_type || "practice",
          title: payload.title,
          description: payload.description,
          location: payload.location,
          start_time: payload.start_time,
          end_time: payload.end_time,
          is_mandatory: payload.is_mandatory !== false,
          created_by: req.userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201);
      return sendSuccess(res, data, "Event created");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to create event");
      serverLogger.error(
        `[${ROUTE_NAME}] Create event error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to create event",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

/**
 * PUT /calendar
 * Update calendar event by id query param
 */
router.put(
  "/calendar",
  rateLimit("CREATE"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const eventId = req.query.id;
      if (!eventId || typeof eventId !== "string" || !isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      const updates = req.body || {};
      const { data, error } = await supabase
        .from("team_events")
        .update({
          title: updates.title,
          description: updates.description,
          location: updates.location,
          start_time: updates.start_time,
          end_time: updates.end_time,
          event_type: updates.event_type,
          is_mandatory: updates.is_mandatory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq("team_id", teamId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, data, "Event updated");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to update event");
      serverLogger.error(
        `[${ROUTE_NAME}] Update event error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to update event",
        "UPDATE_ERROR",
        500,
      );
    }
  },
);

/**
 * DELETE /calendar
 * Delete calendar event by id query param
 */
router.delete(
  "/calendar",
  rateLimit("CREATE"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const eventId = req.query.id;
      if (!eventId || typeof eventId !== "string" || !isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      const { error } = await supabase
        .from("team_events")
        .delete()
        .eq("id", eventId)
        .eq("team_id", teamId);

      if (error) {
        throw error;
      }

      return sendSuccess(res, { success: true }, "Event deleted");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to delete event");
      serverLogger.error(
        `[${ROUTE_NAME}] Delete event error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to delete event",
        "DELETE_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /events/upcoming
 * Upcoming events for coach scheduling widgets
 */
router.get(
  "/events/upcoming",
  rateLimit("READ"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = await resolveCoachTeamId(req, res);
      if (!teamId) {
        return;
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("team_events")
        .select("*")
        .eq("team_id", teamId)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) {
        throw error;
      }

      return sendSuccess(res, data || []);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load events");
      serverLogger.error(
        `[${ROUTE_NAME}] Upcoming events error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load events",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

/**
 * GET /games
 * Get coach's games list
 */
router.get(
  "/games",
  rateLimit("READ"),
  authenticateToken,
  requireRole(...COACH_STAFF_ROLE_LIST),
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
  },
);

export default router;
