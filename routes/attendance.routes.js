/**
 * Attendance Routes
 * Handles team events, attendance tracking, and absence requests
 *
 * @module routes/attendance
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { requireSupabase } from "./middleware/supabase-availability.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import {
  ATTENDANCE_EVENT_TYPES,
  ATTENDANCE_STATUSES,
  STAFF_ROLES,
} from "./utils/roles.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  getErrorMessage,
  isValidUUID,
  sanitizeText,
  sendError,
  sendErrorResponse,
  sendSuccess,
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "attendance";

const ALLOWED_EVENT_TYPES = ATTENDANCE_EVENT_TYPES;

const ALLOWED_ATTENDANCE_STATUS = ATTENDANCE_STATUSES;

const columnCache = new Map();

// =============================================================================
// HELPERS
// =============================================================================

async function tableHasColumn(table, column) {
  if (!supabase) {
    return false;
  }

  const key = `${table}.${column}`;
  if (columnCache.has(key)) {
    return columnCache.get(key);
  }

  try {
    const { error } = await supabase.from(table).select(column).limit(1);
    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("column") && message.includes(column)) {
        columnCache.set(key, false);
        return false;
      }
      // Fail closed on unexpected errors to avoid breaking requests.
      columnCache.set(key, false);
      return false;
    }

    columnCache.set(key, true);
    return true;
  } catch {
    columnCache.set(key, false);
    return false;
  }
}

async function getAttendanceUserColumn(table) {
  const hasUserId = await tableHasColumn(table, "user_id");
  return hasUserId ? "user_id" : "player_id";
}

async function getUserTeams(userId) {
  const { data: teams, error } = await supabase
    .from("team_members")
    .select("team_id, role, status")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return teams || [];
}

async function resolveTeamId(userId, teamId) {
  if (teamId) {
    if (!isValidUUID(teamId)) {
      return { isValid: false, error: "Invalid team ID" };
    }

    const { data: membership, error } = await supabase
      .from("team_members")
      .select("team_id, role, status")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!membership || membership.status !== "active") {
      return { isValid: false, error: "Access denied" };
    }

    return { isValid: true, teamId, role: membership.role };
  }

  const memberships = await getUserTeams(userId);
  const activeTeams = memberships.filter((m) => m.status === "active");

  if (activeTeams.length === 0) {
    return { isValid: true, teamId: null };
  }

  if (activeTeams.length > 1) {
    return {
      isValid: false,
      error: "Team ID is required for multi-team users",
    };
  }

  return {
    isValid: true,
    teamId: activeTeams[0].team_id,
    role: activeTeams[0].role,
  };
}

async function getTeamMembership(userId, teamId) {
  const { data: membership, error } = await supabase
    .from("team_members")
    .select("team_id, role, status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!membership || membership.status !== "active") {
    return { authorized: false, role: null };
  }

  return { authorized: true, role: membership.role };
}

async function assertPlayerOnTeam(playerId, teamId) {
  const { data: membership, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", playerId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!membership;
}

function parseOptionalDate(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeEventPayload(payload, { isUpdate = false } = {}) {
  const hasMandatoryField = Object.hasOwn(payload, "is_mandatory");
  const isMandatory = hasMandatoryField
    ? payload.is_mandatory !== false
    : isUpdate
      ? undefined
      : true;

  return {
    team_id: payload.team_id,
    event_type: payload.event_type,
    title: sanitizeText(payload.title),
    description: sanitizeText(payload.description),
    location: sanitizeText(payload.location),
    start_time: payload.start_time,
    end_time: payload.end_time,
    is_mandatory: isMandatory,
  };
}

function normalizeAttendanceRecord(record, userColumn) {
  if (!record) {
    return record;
  }

  return {
    ...record,
    player_id: record.player_id || record[userColumn] || record.user_id,
  };
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// EVENTS
// =============================================================================

router.get(
  "/events",
  rateLimit("READ"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const teamIdParam = req.query.team_id;
      const { isValid, error, teamId } = await resolveTeamId(
        req.userId,
        typeof teamIdParam === "string" ? teamIdParam : null,
      );

      if (!isValid) {
        return sendError(res, error, "UNAUTHORIZED_ACCESS", 403);
      }

      if (!teamId) {
        return sendSuccess(res, []);
      }

      const eventType =
        typeof req.query.event_type === "string" ? req.query.event_type : null;
      if (eventType && !ALLOWED_EVENT_TYPES.has(eventType)) {
        return sendError(res, "Invalid event type", "VALIDATION_ERROR", 400);
      }

      const startDate = parseOptionalDate(req.query.start_date);
      const endDate = parseOptionalDate(req.query.end_date);
      const limit = parseInt(req.query.limit, 10);

      if (req.query.start_date && !startDate) {
        return sendError(res, "Invalid start_date", "VALIDATION_ERROR", 400);
      }

      if (req.query.end_date && !endDate) {
        return sendError(res, "Invalid end_date", "VALIDATION_ERROR", 400);
      }

      let query = supabase
        .from("team_events")
        .select("*")
        .eq("team_id", teamId)
        .order("start_time", { ascending: true });

      if (eventType) {
        query = query.eq("event_type", eventType);
      }

      if (startDate) {
        query = query.gte("start_time", startDate);
      }

      if (endDate) {
        query = query.lte("start_time", endDate);
      }

      if (!Number.isNaN(limit) && limit > 0 && limit <= 200) {
        query = query.limit(limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      return sendSuccess(res, data || []);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load events");
      serverLogger.error(
        `[${ROUTE_NAME}] Get events error: ${errorMessage}`,
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

router.post(
  "/events",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const payload = normalizeEventPayload(req.body || {});

      if (!payload.team_id || !isValidUUID(payload.team_id)) {
        return sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
      }

      if (!payload.title) {
        return sendError(res, "Title is required", "VALIDATION_ERROR", 400);
      }

      if (!payload.event_type || !ALLOWED_EVENT_TYPES.has(payload.event_type)) {
        return sendError(res, "Invalid event type", "VALIDATION_ERROR", 400);
      }

      const normalizedStart = parseOptionalDate(payload.start_time);
      if (!payload.start_time || !normalizedStart) {
        return sendError(res, "Invalid start time", "VALIDATION_ERROR", 400);
      }

      const normalizedEnd = payload.end_time
        ? parseOptionalDate(payload.end_time)
        : null;
      if (payload.end_time && !normalizedEnd) {
        return sendError(res, "Invalid end time", "VALIDATION_ERROR", 400);
      }

      if (normalizedEnd) {
        const startDate = new Date(normalizedStart);
        const endDate = new Date(normalizedEnd);
        if (endDate < startDate) {
          return sendError(
            res,
            "End time must be after start time",
            "VALIDATION_ERROR",
            400,
          );
        }
      }

      payload.start_time = normalizedStart;
      if (normalizedEnd) {
        payload.end_time = normalizedEnd;
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        payload.team_id,
      );

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can create events",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const { data, error } = await supabase
        .from("team_events")
        .insert({
          ...payload,
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

router.put(
  "/events/:eventId",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id, start_time, end_time")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        event.team_id,
      );

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can update events",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const updates = normalizeEventPayload(req.body || {}, { isUpdate: true });
      const filteredUpdates = {};

      for (const key of [
        "title",
        "description",
        "location",
        "start_time",
        "end_time",
        "is_mandatory",
        "event_type",
      ]) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      if (
        filteredUpdates.event_type &&
        !ALLOWED_EVENT_TYPES.has(filteredUpdates.event_type)
      ) {
        return sendError(res, "Invalid event type", "VALIDATION_ERROR", 400);
      }

      if (filteredUpdates.start_time) {
        const normalizedStartUpdate = parseOptionalDate(
          filteredUpdates.start_time,
        );
        if (!normalizedStartUpdate) {
          return sendError(res, "Invalid start time", "VALIDATION_ERROR", 400);
        }
        filteredUpdates.start_time = normalizedStartUpdate;
      }

      if (filteredUpdates.end_time) {
        const normalizedEndUpdate = parseOptionalDate(filteredUpdates.end_time);
        if (!normalizedEndUpdate) {
          return sendError(res, "Invalid end time", "VALIDATION_ERROR", 400);
        }
        filteredUpdates.end_time = normalizedEndUpdate;
      }

      const startTime = filteredUpdates.start_time || event.start_time;
      const endTime = filteredUpdates.end_time || event.end_time;

      if (startTime && endTime) {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (endDate < startDate) {
          return sendError(
            res,
            "End time must be after start time",
            "VALIDATION_ERROR",
            400,
          );
        }
      }

      const { data, error } = await supabase
        .from("team_events")
        .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
        .eq("id", eventId)
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

router.delete(
  "/events/:eventId",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        event.team_id,
      );

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can delete events",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const { error } = await supabase
        .from("team_events")
        .delete()
        .eq("id", eventId);

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

// =============================================================================
// ATTENDANCE
// =============================================================================

router.get(
  "/events/:eventId/attendance",
  rateLimit("READ"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        event.team_id,
      );

      if (!authorized) {
        return sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
      }

      const userColumn = await getAttendanceUserColumn("attendance_records");
      const isStaff = STAFF_ROLES.has(role || "");

      let query = supabase.from("attendance_records").select(
        `
        *,
        users:${userColumn} (id, full_name, avatar_url)
      `,
      );

      query = query.eq("event_id", eventId);

      if (!isStaff) {
        query = query.eq(userColumn, req.userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const records = (data || []).map((record) => {
        const normalized = normalizeAttendanceRecord(record, userColumn);
        return {
          ...normalized,
          player_name:
            record?.users?.full_name || record?.users?.name || undefined,
          player_avatar: record?.users?.avatar_url || undefined,
        };
      });

      return sendSuccess(res, records);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load attendance");
      serverLogger.error(
        `[${ROUTE_NAME}] Get attendance error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load attendance",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/record",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const {
        event_id: eventId,
        player_id: playerId,
        status,
        notes,
      } = req.body || {};

      if (!eventId || !isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      if (!playerId || !isValidUUID(playerId)) {
        return sendError(res, "Invalid player ID", "VALIDATION_ERROR", 400);
      }

      if (!ALLOWED_ATTENDANCE_STATUS.has(status)) {
        return sendError(res, "Invalid status", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        event.team_id,
      );

      if (!authorized) {
        return sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
      }

      const isStaff = STAFF_ROLES.has(role || "");
      if (!isStaff && playerId !== req.userId) {
        return sendError(
          res,
          "Players can only record their own attendance",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const isPlayerOnTeam = await assertPlayerOnTeam(playerId, event.team_id);
      if (!isPlayerOnTeam) {
        return sendError(
          res,
          "Player is not on this team",
          "VALIDATION_ERROR",
          400,
        );
      }

      const userColumn = await getAttendanceUserColumn("attendance_records");
      const recordPayload = {
        event_id: eventId,
        player_id: playerId,
        status,
        notes: sanitizeText(notes),
        check_in_time:
          status === "present" || status === "late"
            ? new Date().toISOString()
            : null,
        recorded_by: req.userId,
      };

      if (userColumn === "user_id") {
        recordPayload.user_id = playerId;
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .upsert(recordPayload, { onConflict: "event_id,player_id" })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await updatePlayerAttendanceStats(playerId, event.team_id);

      return sendSuccess(res, normalizeAttendanceRecord(data, userColumn));
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to record attendance",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Record attendance error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to record attendance",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

router.post(
  "/record/bulk",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { event_id: eventId, records } = req.body || {};

      if (!eventId || !isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      if (!Array.isArray(records) || records.length === 0) {
        return sendError(
          res,
          "Records array is required",
          "VALIDATION_ERROR",
          400,
        );
      }

      if (records.length > 200) {
        return sendError(res, "Too many records", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        event.team_id,
      );

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can bulk record attendance",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const userColumn = await getAttendanceUserColumn("attendance_records");
      const playerIds = records.map((record) => record.player_id);

      if (playerIds.some((id) => !id || !isValidUUID(id))) {
        return sendError(
          res,
          "Invalid player ID in records",
          "VALIDATION_ERROR",
          400,
        );
      }

      const uniquePlayerIds = [...new Set(playerIds)];
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", event.team_id)
        .eq("status", "active")
        .in("user_id", uniquePlayerIds);

      if (membersError) {
        throw membersError;
      }

      const memberSet = new Set(
        (members || []).map((member) => member.user_id),
      );
      const missingPlayers = uniquePlayerIds.filter((id) => !memberSet.has(id));

      if (missingPlayers.length > 0) {
        return sendError(
          res,
          "One or more players are not on this team",
          "VALIDATION_ERROR",
          400,
        );
      }

      const attendanceRecords = [];
      for (const record of records) {
        if (!ALLOWED_ATTENDANCE_STATUS.has(record.status)) {
          return sendError(
            res,
            "Invalid status in records",
            "VALIDATION_ERROR",
            400,
          );
        }

        const payload = {
          event_id: eventId,
          player_id: record.player_id,
          status: record.status,
          notes: sanitizeText(record.notes),
          check_in_time:
            record.status === "present" || record.status === "late"
              ? new Date().toISOString()
              : null,
          recorded_by: req.userId,
        };

        if (userColumn === "user_id") {
          payload.user_id = record.player_id;
        }

        attendanceRecords.push(payload);
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .upsert(attendanceRecords, { onConflict: "event_id,player_id" })
        .select();

      if (error) {
        throw error;
      }

      for (const record of records) {
        await updatePlayerAttendanceStats(record.player_id, event.team_id);
      }

      const normalized = (data || []).map((record) =>
        normalizeAttendanceRecord(record, userColumn),
      );

      return sendSuccess(res, normalized);
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to record attendance",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Bulk attendance error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to record attendance",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// STATS
// =============================================================================

async function updatePlayerAttendanceStats(playerId, teamId) {
  const userColumn = await getAttendanceUserColumn("attendance_records");
  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select(`status, team_events!inner (team_id)`)
    .eq(userColumn, playerId)
    .eq("team_events.team_id", teamId);

  if (recordsError) {
    serverLogger.error(
      `[${ROUTE_NAME}] Attendance stats query error: ${recordsError.message}`,
      recordsError,
    );
    return;
  }

  const stats = {
    total_events: records.length,
    events_attended: records.filter((r) => r.status === "present").length,
    events_missed: records.filter((r) => r.status === "absent").length,
    events_excused: records.filter((r) => r.status === "excused").length,
    events_late: records.filter((r) => r.status === "late").length,
  };

  stats.attendance_rate =
    stats.total_events > 0
      ? Math.round(
          ((stats.events_attended + stats.events_late) / stats.total_events) *
            100,
        )
      : 0;

  const statsPayload = {
    player_id: playerId,
    team_id: teamId,
    ...stats,
    last_updated: new Date().toISOString(),
  };

  const statsUserColumn = await getAttendanceUserColumn(
    "player_attendance_stats",
  );

  if (statsUserColumn === "user_id") {
    statsPayload.user_id = playerId;
  }

  const { error } = await supabase
    .from("player_attendance_stats")
    .upsert(statsPayload, { onConflict: "player_id,team_id" });

  if (error) {
    serverLogger.error(
      `[${ROUTE_NAME}] Attendance stats upsert error: ${error.message}`,
      error,
    );
  }
}

router.get(
  "/stats/player/:playerId",
  rateLimit("READ"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { playerId } = req.params;
      const teamId = req.query.team_id;

      if (!isValidUUID(playerId)) {
        return sendError(res, "Invalid player ID", "VALIDATION_ERROR", 400);
      }

      if (!teamId || typeof teamId !== "string" || !isValidUUID(teamId)) {
        return sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
      }

      const { authorized, role } = await getTeamMembership(req.userId, teamId);

      if (!authorized) {
        return sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
      }

      const isStaff = STAFF_ROLES.has(role || "");
      if (!isStaff && playerId !== req.userId) {
        return sendError(
          res,
          "Players can only view their own stats",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const statsUserColumn = await getAttendanceUserColumn(
        "player_attendance_stats",
      );
      const { data, error } = await supabase
        .from("player_attendance_stats")
        .select("*")
        .eq(statsUserColumn, playerId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) {
        return sendSuccess(res, null);
      }

      return sendSuccess(res, {
        ...data,
        player_id: data.player_id || data[statsUserColumn] || data.user_id,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load stats");
      serverLogger.error(
        `[${ROUTE_NAME}] Player stats error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load stats",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/stats/team/:teamId",
  rateLimit("READ"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { teamId } = req.params;

      if (!isValidUUID(teamId)) {
        return sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
      }

      const { authorized, role } = await getTeamMembership(req.userId, teamId);

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can view team stats",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const userColumn = await getAttendanceUserColumn(
        "player_attendance_stats",
      );

      const { data, error } = await supabase
        .from("player_attendance_stats")
        .select(
          `
        *,
        users:${userColumn} (id, full_name, avatar_url)
      `,
        )
        .eq("team_id", teamId)
        .order("attendance_rate", { ascending: false });

      if (error) {
        throw error;
      }

      const normalized = (data || []).map((record) => {
        const enriched = normalizeAttendanceRecord(record, userColumn);
        return {
          ...enriched,
          player_name:
            record?.users?.full_name || record?.users?.name || undefined,
          player_avatar: record?.users?.avatar_url || undefined,
        };
      });

      return sendSuccess(res, normalized);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to load stats");
      serverLogger.error(
        `[${ROUTE_NAME}] Team stats error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load stats",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

// =============================================================================
// ABSENCE REQUESTS
// =============================================================================

router.post(
  "/absence-request",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { event_id: eventId, reason } = req.body || {};

      if (!eventId || !isValidUUID(eventId)) {
        return sendError(res, "Invalid event ID", "VALIDATION_ERROR", 400);
      }

      if (!reason || typeof reason !== "string") {
        return sendError(res, "Reason is required", "VALIDATION_ERROR", 400);
      }

      const { data: event, error: eventError } = await supabase
        .from("team_events")
        .select("team_id")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!event) {
        return sendError(res, "Event not found", "NOT_FOUND", 404);
      }

      const { authorized } = await getTeamMembership(req.userId, event.team_id);

      if (!authorized) {
        return sendError(res, "Access denied", "UNAUTHORIZED_ACCESS", 403);
      }

      const requestPayload = {
        player_id: req.userId,
        event_id: eventId,
        reason: sanitizeText(reason),
        status: "pending",
      };

      const requestUserColumn =
        await getAttendanceUserColumn("absence_requests");

      if (requestUserColumn === "user_id") {
        requestPayload.user_id = req.userId;
      }

      const { data, error } = await supabase
        .from("absence_requests")
        .insert(requestPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201);
      return sendSuccess(res, data, "Absence request submitted");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to submit absence request",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Absence request error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to submit absence request",
        "CREATE_ERROR",
        500,
      );
    }
  },
);

router.get(
  "/absence-requests",
  rateLimit("READ"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const teamId = req.query.team_id;
      const { status } = req.query;

      if (!teamId || typeof teamId !== "string" || !isValidUUID(teamId)) {
        return sendError(res, "Invalid team ID", "VALIDATION_ERROR", 400);
      }

      const { authorized, role } = await getTeamMembership(req.userId, teamId);

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can view absence requests",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const requestUserColumn =
        await getAttendanceUserColumn("absence_requests");
      let query = supabase.from("absence_requests").select(
        `
        *,
        users:${requestUserColumn} (full_name),
        team_events!inner (team_id, title, start_time)
      `,
      );

      query = query.eq("team_events.team_id", teamId);

      if (status && typeof status === "string") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const formatted = (data || []).map((request) => ({
        ...request,
        player_id:
          request.player_id || request[requestUserColumn] || request.user_id,
        player_name: request?.users?.full_name,
      }));

      return sendSuccess(res, formatted);
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load absence requests",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Absence requests error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to load absence requests",
        "FETCH_ERROR",
        500,
      );
    }
  },
);

router.put(
  "/absence-request/:requestId",
  rateLimit("CREATE"),
  authenticateToken,
  requireSupabase,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body || {};

      if (!isValidUUID(requestId)) {
        return sendError(res, "Invalid request ID", "VALIDATION_ERROR", 400);
      }

      if (!status || !["approved", "denied"].includes(status)) {
        return sendError(res, "Invalid status", "VALIDATION_ERROR", 400);
      }

      const { data: request, error: fetchError } = await supabase
        .from("absence_requests")
        .select(
          `
          *,
          team_events!inner (team_id)
        `,
        )
        .eq("id", requestId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!request) {
        return sendError(res, "Request not found", "NOT_FOUND", 404);
      }

      const { authorized, role } = await getTeamMembership(
        req.userId,
        request.team_events.team_id,
      );

      if (!authorized || !STAFF_ROLES.has(role || "")) {
        return sendError(
          res,
          "Only staff can review requests",
          "UNAUTHORIZED_ACCESS",
          403,
        );
      }

      const { data, error } = await supabase
        .from("absence_requests")
        .update({
          status,
          reviewed_by: req.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (status === "approved") {
        const userColumn = await getAttendanceUserColumn("attendance_records");
        const targetPlayerId = request.player_id || request.user_id;
        const attendancePayload = {
          event_id: request.event_id,
          player_id: targetPlayerId,
          status: "excused",
          notes: sanitizeText(
            `Absence request approved: ${request.reason || ""}`,
          ),
          recorded_by: req.userId,
        };

        if (userColumn === "user_id") {
          attendancePayload.user_id = targetPlayerId;
        }

        await supabase
          .from("attendance_records")
          .upsert(attendancePayload, { onConflict: "event_id,player_id" });

        if (targetPlayerId) {
          await updatePlayerAttendanceStats(
            targetPlayerId,
            request.team_events.team_id,
          );
        }
      }

      return sendSuccess(res, data, "Request reviewed");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to review absence request",
      );
      serverLogger.error(
        `[${ROUTE_NAME}] Review request error: ${errorMessage}`,
        error,
      );
      return sendErrorResponse(
        res,
        error,
        "Failed to review absence request",
        "UPDATE_ERROR",
        500,
      );
    }
  },
);

export default router;
