import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { checkTeamMembership, getUserTeamId } from "./utils/auth-helper.js";
import { hasAnyRole, TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Attendance API
// Handles practice attendance tracking, events, and absence requests

const VALID_ATTENDANCE_STATUSES = new Set([
  "present",
  "absent",
  "late",
  "excused",
]);
const VALID_ABSENCE_REVIEW_STATUSES = new Set(["approved", "rejected"]);

const assertActiveTeamPlayer = async (teamId, playerId) => {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", playerId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!member) {
    throw new Error("player_id must reference an active team player in this team");
  }
};

// Get team events with optional filters
const getTeamEvents = async (userId, queryParams) => {
  checkEnvVars();

  const { team_id, event_type, start_date, end_date, limit } = queryParams;

  // Verify user is part of the team
  if (team_id) {
    const { authorized } = await checkTeamMembership(userId, team_id);
    if (!authorized) {
      throw new Error("Not authorized to view this team's events");
    }
  }

  const teamId = team_id || (await getUserTeamId(userId));

  let query = supabaseAdmin
    .from("team_events")
    .select("*")
    .eq("team_id", teamId)
    .order("start_time", { ascending: true });

  if (event_type) {
    query = query.eq("event_type", event_type);
  }

  if (start_date) {
    query = query.gte("start_time", start_date);
  }

  if (end_date) {
    query = query.lte("start_time", end_date);
  }

  if (limit) {
    const parsedLimit = Number.parseInt(limit, 10);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      throw new Error("limit must be a positive integer");
    }
    query = query.limit(parsedLimit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data || [];
};

// Create a new team event
const createEvent = async (userId, eventData) => {
  checkEnvVars();

  const {
    team_id,
    event_type,
    title,
    description,
    location,
    start_time,
    end_time,
    is_mandatory,
  } = eventData;

  // Verify user has permission (coach/admin)
  const { authorized, role } = await checkTeamMembership(userId, team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can create events");
  }

  const { data, error } = await supabaseAdmin
    .from("team_events")
    .insert({
      team_id,
      event_type,
      title,
      description,
      location,
      start_time,
      end_time,
      is_mandatory: is_mandatory !== false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Update an event
const updateEvent = async (userId, eventId, updates) => {
  checkEnvVars();

  // Get the event to verify ownership
  const { data: event, error: fetchError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    throw new Error("Event not found");
  }

  // Verify user has permission
  const { authorized, role } = await checkTeamMembership(userId, event.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can update events");
  }

  const allowedFields = [
    "title",
    "description",
    "location",
    "start_time",
    "end_time",
    "is_mandatory",
    "event_type",
  ];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const { data, error } = await supabaseAdmin
    .from("team_events")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Delete an event
const deleteEvent = async (userId, eventId) => {
  checkEnvVars();

  const { data: event, error: fetchError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    throw new Error("Event not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, event.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can delete events");
  }

  const { error } = await supabaseAdmin
    .from("team_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    throw error;
  }
  return { success: true };
};

// Get attendance records for an event
const getEventAttendance = async (userId, eventId) => {
  checkEnvVars();

  // Get event to verify access
  const { data: event, error: eventError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    throw new Error("Event not found");
  }

  const { authorized } = await checkTeamMembership(userId, event.team_id);
  if (!authorized) {
    throw new Error("Not authorized to view this event");
  }

  const { data, error } = await supabaseAdmin
    .from("attendance_records")
    .select(
      `
      *,
      users:player_id (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }

  // Transform data to include player info
  return (data || []).map((record) => ({
    ...record,
    player_name: record.users?.name,
    player_avatar: record.users?.avatar_url,
  }));
};

// Record attendance for a player
const recordAttendance = async (userId, attendanceData) => {
  checkEnvVars();

  const { event_id, player_id, status, notes } = attendanceData;
  if (!event_id || !player_id || !status) {
    throw new Error("event_id, player_id, and status are required");
  }
  if (!VALID_ATTENDANCE_STATUSES.has(status)) {
    throw new Error(
      `Invalid attendance status. Allowed: ${Array.from(VALID_ATTENDANCE_STATUSES).join(", ")}`,
    );
  }

  // Get event to verify access
  const { data: event, error: eventError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    throw new Error("Event not found");
  }

  // Coaches can record for anyone, players can only record for themselves
  const { authorized, role } = await checkTeamMembership(userId, event.team_id);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  if (!hasAnyRole(role, TEAM_OPERATIONS_ROLES) && player_id !== userId) {
    throw new Error("Players can only record their own attendance");
  }
  await assertActiveTeamPlayer(event.team_id, player_id);

  // Upsert attendance record
  const { data, error } = await supabaseAdmin
    .from("attendance_records")
    .upsert(
      {
        event_id,
        player_id,
        status,
        notes,
        check_in_time:
          status === "present" || status === "late"
            ? new Date().toISOString()
            : null,
        recorded_by: userId,
      },
      { onConflict: "event_id,player_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update player attendance stats
  await updatePlayerAttendanceStats(player_id, event.team_id);

  return data;
};

// Bulk record attendance
const bulkRecordAttendance = async (userId, bulkData) => {
  checkEnvVars();

  const { event_id, records } = bulkData;
  if (!event_id || !Array.isArray(records) || records.length === 0) {
    throw new Error("event_id and non-empty records array are required");
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    throw new Error("Event not found");
  }

  const { authorized, role } = await checkTeamMembership(userId, event.team_id);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can bulk record attendance");
  }

  const dedupedRecords = new Map();
  for (const record of records) {
    if (!record?.player_id || !record?.status) {
      throw new Error("Each attendance record must include player_id and status");
    }
    if (!VALID_ATTENDANCE_STATUSES.has(record.status)) {
      throw new Error(
        `Invalid attendance status. Allowed: ${Array.from(VALID_ATTENDANCE_STATUSES).join(", ")}`,
      );
    }
    await assertActiveTeamPlayer(event.team_id, record.player_id);
    dedupedRecords.set(record.player_id, record);
  }

  const normalizedRecords = [...dedupedRecords.values()];
  const attendanceRecords = normalizedRecords.map((record) => ({
    event_id,
    player_id: record.player_id,
    status: record.status,
    notes: record.notes,
    check_in_time:
      record.status === "present" || record.status === "late"
        ? new Date().toISOString()
        : null,
    recorded_by: userId,
  }));

  const { data, error } = await supabaseAdmin
    .from("attendance_records")
    .upsert(attendanceRecords, { onConflict: "event_id,player_id" })
    .select();

  if (error) {
    throw error;
  }

  // Update stats for all affected players
  for (const record of normalizedRecords) {
    await updatePlayerAttendanceStats(record.player_id, event.team_id);
  }

  return data;
};

// Update player attendance statistics
const updatePlayerAttendanceStats = async (playerId, teamId) => {
  // Get all attendance records for this player in this team
  const { data: records, error: recordsError } = await supabaseAdmin
    .from("attendance_records")
    .select(
      `
      status,
      team_events!inner (team_id)
    `,
    )
    .eq("player_id", playerId)
    .eq("team_events.team_id", teamId);

  if (recordsError) {
    console.error("Error fetching attendance records:", recordsError);
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

  // Upsert stats
  await supabaseAdmin.from("player_attendance_stats").upsert(
    {
      player_id: playerId,
      team_id: teamId,
      ...stats,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "player_id,team_id" },
  );
};

// Get player attendance stats
const getPlayerAttendanceStats = async (userId, playerId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized to view this team's stats");
  }

  const { data, error } = await supabaseAdmin
    .from("player_attendance_stats")
    .select("*")
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data;
};

// Get team attendance stats
const getTeamAttendanceStats = async (userId, teamId) => {
  checkEnvVars();

  const { authorized } = await checkTeamMembership(userId, teamId);
  if (!authorized) {
    throw new Error("Not authorized to view this team's stats");
  }

  const { data, error } = await supabaseAdmin
    .from("player_attendance_stats")
    .select(
      `
      *,
      users:player_id (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("team_id", teamId)
    .order("attendance_rate", { ascending: false });

  if (error) {
    throw error;
  }
  return data || [];
};

// Submit absence request
const submitAbsenceRequest = async (userId, requestData) => {
  checkEnvVars();

  const { event_id, reason } = requestData;
  if (!event_id) {
    throw new Error("event_id is required");
  }
  if (!reason || !String(reason).trim()) {
    throw new Error("reason is required");
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("team_events")
    .select("team_id")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    throw new Error("Event not found");
  }

  const { authorized } = await checkTeamMembership(userId, event.team_id);
  if (!authorized) {
    throw new Error("Not authorized");
  }

  const { data: existingPending, error: existingError } = await supabaseAdmin
    .from("absence_requests")
    .select("id")
    .eq("event_id", event_id)
    .eq("player_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }
  if (existingPending) {
    throw new Error("An absence request is already pending for this event");
  }

  const { data, error } = await supabaseAdmin
    .from("absence_requests")
    .insert({
      player_id: userId,
      event_id,
      reason,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An absence request is already pending for this event");
    }
    throw error;
  }
  return data;
};

// Get pending absence requests
const getPendingAbsenceRequests = async (userId, teamId) => {
  checkEnvVars();

  const { authorized, role } = await checkTeamMembership(userId, teamId);
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can view absence requests");
  }

  const { data, error } = await supabaseAdmin
    .from("absence_requests")
    .select(
      `
      *,
      users:player_id (name),
      team_events!inner (team_id, title, start_time)
    `,
    )
    .eq("team_events.team_id", teamId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
  return data || [];
};

// Review absence request
const reviewAbsenceRequest = async (userId, requestId, status) => {
  checkEnvVars();
  if (!VALID_ABSENCE_REVIEW_STATUSES.has(status)) {
    throw new Error(
      `Invalid review status. Allowed: ${Array.from(VALID_ABSENCE_REVIEW_STATUSES).join(", ")}`,
    );
  }

  // Get the request
  const { data: request, error: fetchError } = await supabaseAdmin
    .from("absence_requests")
    .select(
      `
      *,
      team_events!inner (team_id)
    `,
    )
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    throw new Error("Absence request not found");
  }

  const { authorized, role } = await checkTeamMembership(
    userId,
    request.team_events.team_id,
  );
  if (!authorized || !hasAnyRole(role, TEAM_OPERATIONS_ROLES)) {
    throw new Error("Only authorized team staff can review absence requests");
  }

  const { data, error } = await supabaseAdmin
    .from("absence_requests")
    .update({
      status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !data) {
    if (!data) {
      throw new Error("Absence request has already been reviewed");
    }
    throw error;
  }

  // If approved, update attendance record
  if (status === "approved") {
    await supabaseAdmin.from("attendance_records").upsert(
      {
        event_id: request.event_id,
        player_id: request.player_id,
        status: "excused",
        notes: `Absence request approved: ${request.reason}`,
        recorded_by: userId,
      },
      { onConflict: "event_id,player_id" },
    );

    await updatePlayerAttendanceStats(
      request.player_id,
      request.team_events.team_id,
    );
  }

  return data;
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "attendance",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    requireAuth: true, // SECURITY: Explicit auth for attendance management
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/attendance\/?/, "")
        .replace(/^\/\.netlify\/functions\/attendance\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
            );
          }
          return createErrorResponse("Invalid JSON", 400, ErrorType.VALIDATION);
        }
      }

      try {
        // Events endpoints
        if (event.httpMethod === "GET" && (path === "events" || path === "")) {
          const result = await getTeamEvents(userId, queryParams);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && path === "events") {
          const result = await createEvent(userId, body);
          return createSuccessResponse(result, 201);
        }

        const eventMatch = path.match(/^events\/([^/]+)$/);
        if (eventMatch) {
          const eventId = eventMatch[1];

          if (event.httpMethod === "PUT") {
            const result = await updateEvent(userId, eventId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            const result = await deleteEvent(userId, eventId);
            return createSuccessResponse(result);
          }
        }

        // Attendance endpoints
        const attendanceMatch = path.match(/^events\/([^/]+)\/attendance$/);
        if (attendanceMatch && event.httpMethod === "GET") {
          const result = await getEventAttendance(userId, attendanceMatch[1]);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && path === "record") {
          const result = await recordAttendance(userId, body);
          return createSuccessResponse(result, 201);
        }

        if (event.httpMethod === "POST" && path === "record/bulk") {
          const result = await bulkRecordAttendance(userId, body);
          return createSuccessResponse(result, 201);
        }

        // Stats endpoints
        const playerStatsMatch = path.match(/^stats\/player\/([^/]+)$/);
        if (playerStatsMatch && event.httpMethod === "GET") {
          const result = await getPlayerAttendanceStats(
            userId,
            playerStatsMatch[1],
            queryParams.team_id,
          );
          return createSuccessResponse(result);
        }

        const teamStatsMatch = path.match(/^stats\/team\/([^/]+)$/);
        if (teamStatsMatch && event.httpMethod === "GET") {
          const result = await getTeamAttendanceStats(
            userId,
            teamStatsMatch[1],
          );
          return createSuccessResponse(result);
        }

        // Absence request endpoints
        if (event.httpMethod === "POST" && path === "absence-request") {
          const result = await submitAbsenceRequest(userId, body);
          return createSuccessResponse(result, 201);
        }

        if (event.httpMethod === "GET" && path === "absence-requests") {
          const result = await getPendingAbsenceRequests(
            userId,
            queryParams.team_id,
          );
          return createSuccessResponse(result);
        }

        const absenceReviewMatch = path.match(/^absence-request\/([^/]+)$/);
        if (absenceReviewMatch && event.httpMethod === "PUT") {
          const result = await reviewAbsenceRequest(
            userId,
            absenceReviewMatch[1],
            body.status,
          );
          return createSuccessResponse(result);
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        if (error.message.includes("not found")) {
          return createErrorResponse(error.message, 404, "not_found");
        }
        if (
          error.message.includes("authorized") ||
          error.message.includes("permission")
        ) {
          return createErrorResponse(error.message, 403, "forbidden");
        }
        if (
          error.message.includes("required") ||
          error.message.includes("Invalid") ||
          error.message.includes("must be") ||
          error.message.includes("active team player") ||
          error.message.includes("already pending") ||
          error.message.includes("already been reviewed")
        ) {
          return createErrorResponse(
            error.message,
            422,
            ErrorType.VALIDATION,
          );
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
