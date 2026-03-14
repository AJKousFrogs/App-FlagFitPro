import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";

// Netlify Function: Officials API
// Handles referee/official scheduling and management

const VALID_ASSIGNMENT_ROLES = new Set([
  "head_referee",
  "referee",
  "line_judge",
  "back_judge",
  "field_judge",
  "umpire",
  "other",
]);
const VALID_ASSIGNMENT_STATUSES = new Set([
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
]);
const VALID_PAYMENT_STATUSES = new Set(["pending", "paid", "cancelled"]);
const ALLOWED_STATUS_TRANSITIONS = {
  scheduled: new Set(["confirmed", "completed", "cancelled"]),
  confirmed: new Set(["completed", "cancelled"]),
  completed: new Set(),
  cancelled: new Set(),
};
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function assertValidIsoDate(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  if (typeof value !== "string" || !ISO_DATE_REGEX.test(value)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
  }
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isCalendarValid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day;
  if (!isCalendarValid) {
    throw new Error(`${fieldName} must be a valid calendar date`);
  }
}

function assertValidTime(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  if (typeof value !== "string" || !TIME_24H_REGEX.test(value)) {
    throw new Error(`${fieldName} must be in HH:MM 24-hour format`);
  }
}

function assertDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return;
  }
  if (endDate < startDate) {
    throw new Error("start_date must be on or before end_date");
  }
}

const canManageOfficials = async (userId) => {
  const membershipQuery = supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active");

  const orderedQuery =
    typeof membershipQuery.order === "function"
      ? membershipQuery.order("updated_at", { ascending: false })
      : membershipQuery;

  if (typeof orderedQuery.maybeSingle === "function") {
    const { data, error } = await orderedQuery.maybeSingle();
    if (error) {
      if (typeof orderedQuery.limit === "function") {
        const fallback = await orderedQuery.limit(1);
        if (fallback.error) {
          throw fallback.error;
        }
        return TEAM_OPERATIONS_ROLES.includes(fallback.data?.[0]?.role || "");
      }
      throw error;
    }
    return TEAM_OPERATIONS_ROLES.includes(data?.role || "");
  }

  if (typeof orderedQuery.limit === "function") {
    const { data, error } = await orderedQuery.limit(1);
    if (error) {
      throw error;
    }
    return TEAM_OPERATIONS_ROLES.includes(data?.[0]?.role || "");
  }

  return false;
};

// Get all officials
const getOfficials = async (queryParams) => {
  checkEnvVars();

  let query = supabaseAdmin.from("officials").select("*").order("name");

  if (queryParams.is_active !== undefined) {
    query = query.eq("is_active", queryParams.is_active === "true");
  }

  if (queryParams.certification_level) {
    query = query.eq("certification_level", queryParams.certification_level);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data || [];
};

// Get a single official
const getOfficial = async (officialId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("officials")
    .select("*")
    .eq("id", officialId)
    .single();

  if (error || !data) {
    throw new Error("Official not found");
  }

  return data;
};

// Create a new official
const createOfficial = async (userId, officialData) => {
  checkEnvVars();

  const {
    name,
    email,
    phone,
    certification_level,
    certifications,
    years_experience,
    notes,
    is_active,
  } = officialData;

  const { data, error } = await supabaseAdmin
    .from("officials")
    .insert({
      name,
      email,
      phone,
      certification_level,
      certifications: certifications || [],
      years_experience,
      notes,
      is_active: is_active !== false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Update an official
const updateOfficial = async (officialId, updates) => {
  checkEnvVars();

  const allowedFields = [
    "name",
    "email",
    "phone",
    "certification_level",
    "certifications",
    "years_experience",
    "notes",
    "is_active",
  ];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error("No valid fields to update");
  }

  const { data, error } = await supabaseAdmin
    .from("officials")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", officialId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Delete an official (soft delete)
const deleteOfficial = async (officialId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("officials")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", officialId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Get officials for a game
const getGameOfficials = async (gameId) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("game_officials")
    .select(
      `
      *,
      officials (id, name, email, phone, certification_level)
    `,
    )
    .eq("game_id", gameId);

  if (error) {
    throw error;
  }

  return (data || []).map((assignment) => ({
    ...assignment,
    official_name: assignment.officials?.name,
    official_email: assignment.officials?.email,
    official_phone: assignment.officials?.phone,
  }));
};

// Get games for an official
const getOfficialGames = async (officialId, queryParams) => {
  checkEnvVars();

  let query = supabaseAdmin
    .from("game_officials")
    .select(
      `
      *,
      games (id, game_date, location, home_team_id, away_team_id)
    `,
    )
    .eq("official_id", officialId)
    .order("created_at", { ascending: false });

  if (queryParams.start_date) {
    query = query.gte("games.game_date", queryParams.start_date);
  }

  if (queryParams.end_date) {
    query = query.lte("games.game_date", queryParams.end_date);
  }

  if (queryParams.status) {
    query = query.eq("status", queryParams.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map((assignment) => ({
    ...assignment,
    game_date: assignment.games?.game_date,
    game_location: assignment.games?.location,
  }));
};

// Schedule an official for a game
const scheduleOfficial = async (scheduleData) => {
  checkEnvVars();

  const { game_id, official_id, role, payment_amount, notes } = scheduleData;
  if (!game_id || !official_id) {
    throw new Error("game_id and official_id are required");
  }
  if (role && !VALID_ASSIGNMENT_ROLES.has(role)) {
    throw new Error("Invalid official assignment role");
  }
  if (
    payment_amount !== undefined &&
    payment_amount !== null &&
    (!Number.isFinite(Number(payment_amount)) || Number(payment_amount) < 0)
  ) {
    throw new Error("payment_amount must be a non-negative number");
  }

  // Check if official is already scheduled for this game
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("game_officials")
    .select("id")
    .eq("game_id", game_id)
    .eq("official_id", official_id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existing) {
    throw new Error("Official is already scheduled for this game");
  }

  const { data, error } = await supabaseAdmin
    .from("game_officials")
    .insert({
      game_id,
      official_id,
      role: role || "referee",
      status: "scheduled",
      payment_amount,
      payment_status: payment_amount ? "pending" : null,
      notes,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Official is already scheduled for this game");
    }
    throw error;
  }
  return data;
};

// Update a game official assignment
const updateGameOfficial = async (assignmentId, updates) => {
  checkEnvVars();

  const { data: existingAssignment, error: existingError } = await supabaseAdmin
    .from("game_officials")
    .select("id, status, payment_amount, payment_status")
    .eq("id", assignmentId)
    .single();

  if (existingError || !existingAssignment) {
    throw new Error("Assignment not found");
  }

  const allowedFields = [
    "role",
    "status",
    "payment_amount",
    "payment_status",
    "notes",
  ];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error("No valid fields to update");
  }
  if (
    filteredUpdates.role !== undefined &&
    !VALID_ASSIGNMENT_ROLES.has(filteredUpdates.role)
  ) {
    throw new Error("Invalid official assignment role");
  }
  if (
    filteredUpdates.status !== undefined &&
    !VALID_ASSIGNMENT_STATUSES.has(filteredUpdates.status)
  ) {
    throw new Error("Invalid official assignment status");
  }
  if (
    filteredUpdates.payment_status !== undefined &&
    !VALID_PAYMENT_STATUSES.has(filteredUpdates.payment_status)
  ) {
    throw new Error("Invalid payment status");
  }
  if (
    filteredUpdates.payment_amount !== undefined &&
    filteredUpdates.payment_amount !== null &&
    (!Number.isFinite(Number(filteredUpdates.payment_amount)) ||
      Number(filteredUpdates.payment_amount) < 0)
  ) {
    throw new Error("payment_amount must be a non-negative number");
  }

  if (
    filteredUpdates.status !== undefined &&
    filteredUpdates.status !== existingAssignment.status
  ) {
    const allowedNext =
      ALLOWED_STATUS_TRANSITIONS[existingAssignment.status] || new Set();
    if (!allowedNext.has(filteredUpdates.status)) {
      throw new Error(
        `Invalid status transition from ${existingAssignment.status} to ${filteredUpdates.status}`,
      );
    }
  }

  const effectivePaymentAmount =
    filteredUpdates.payment_amount !== undefined
      ? filteredUpdates.payment_amount
      : existingAssignment.payment_amount;
  const effectivePaymentStatus =
    filteredUpdates.payment_status || existingAssignment.payment_status;
  if (
    effectivePaymentStatus === "paid" &&
    (!Number.isFinite(Number(effectivePaymentAmount)) ||
      Number(effectivePaymentAmount) <= 0)
  ) {
    throw new Error(
      "payment_amount must be greater than 0 when payment_status is paid",
    );
  }

  const { data, error } = await supabaseAdmin
    .from("game_officials")
    .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Remove an official from a game
const removeGameOfficial = async (assignmentId) => {
  checkEnvVars();

  const { error } = await supabaseAdmin
    .from("game_officials")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw error;
  }
  return { success: true };
};

// Get official availability
const getOfficialAvailability = async (officialId, startDate, endDate) => {
  checkEnvVars();

  const { data, error } = await supabaseAdmin
    .from("official_availability")
    .select("*")
    .eq("official_id", officialId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) {
    throw error;
  }
  return data || [];
};

// Set official availability
const setOfficialAvailability = async (officialId, availabilityData) => {
  checkEnvVars();

  const { date, is_available, start_time, end_time, notes } = availabilityData;
  if (is_available !== undefined && typeof is_available !== "boolean") {
    throw new Error("is_available must be a boolean");
  }
  assertValidIsoDate(date, "date");
  assertValidTime(start_time, "start_time");
  assertValidTime(end_time, "end_time");
  if (start_time && end_time && end_time <= start_time) {
    throw new Error("end_time must be after start_time");
  }

  const { data, error } = await supabaseAdmin
    .from("official_availability")
    .upsert(
      {
        official_id: officialId,
        date,
        is_available,
        start_time,
        end_time,
        notes,
      },
      { onConflict: "official_id,date" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Get available officials for a date
const getAvailableOfficials = async (queryParams) => {
  checkEnvVars();

  const { date, start_time, end_time } = queryParams;

  // Get officials who have marked themselves available on this date
  // or who haven't marked anything (default available)
  const { data: availabilityRecords, error: availError } = await supabaseAdmin
    .from("official_availability")
    .select("official_id, is_available, start_time, end_time")
    .eq("date", date);

  if (availError) {
    throw availError;
  }

  // Get all active officials
  const { data: allOfficials, error: officialsError } = await supabaseAdmin
    .from("officials")
    .select("*")
    .eq("is_active", true);

  if (officialsError) {
    throw officialsError;
  }

  // Check for scheduling conflicts
  const { data: scheduledGames, error: gamesError } = await supabaseAdmin
    .from("game_officials")
    .select(
      `
      official_id,
      games!inner (game_date)
    `,
    )
    .eq("games.game_date", date)
    .in("status", ["scheduled", "confirmed"]);

  if (gamesError) {
    throw gamesError;
  }

  const scheduledOfficialIds = new Set(
    (scheduledGames || []).map((g) => g.official_id),
  );
  const availabilityMap = new Map(
    (availabilityRecords || []).map((a) => [a.official_id, a]),
  );

  // Filter officials
  return (allOfficials || []).filter((official) => {
    // Check if already scheduled
    if (scheduledOfficialIds.has(official.id)) {
      return false;
    }

    // Check availability record
    const availability = availabilityMap.get(official.id);
    if (availability) {
      if (!availability.is_available) {
        return false;
      }

      // Check time constraints if provided
      if (
        start_time &&
        availability.start_time &&
        start_time < availability.start_time
      ) {
        return false;
      }
      if (
        end_time &&
        availability.end_time &&
        end_time > availability.end_time
      ) {
        return false;
      }
    }

    return true;
  });
};

// Get payment summary
const getPaymentSummary = async (queryParams) => {
  checkEnvVars();

  let query = supabaseAdmin
    .from("game_officials")
    .select(
      `
      official_id,
      payment_amount,
      payment_status,
      officials (name)
    `,
    )
    .not("payment_amount", "is", null);

  if (queryParams.start_date) {
    query = query.gte("created_at", queryParams.start_date);
  }

  if (queryParams.end_date) {
    query = query.lte("created_at", queryParams.end_date);
  }

  if (queryParams.official_id) {
    query = query.eq("official_id", queryParams.official_id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Aggregate by official
  const summaryMap = new Map();

  for (const record of data || []) {
    const key = record.official_id;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        official_id: record.official_id,
        official_name: record.officials?.name,
        total_games: 0,
        total_payment: 0,
        paid: 0,
        pending: 0,
      });
    }

    const summary = summaryMap.get(key);
    summary.total_games++;
    summary.total_payment += record.payment_amount || 0;

    if (record.payment_status === "paid") {
      summary.paid += record.payment_amount || 0;
    } else {
      summary.pending += record.payment_amount || 0;
    }
  }

  return Array.from(summaryMap.values());
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "officials",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    requireAuth: true, // SECURITY: Explicit auth for officials management
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/officials\/?/, "")
        .replace(/^\/\.netlify\/functions\/officials\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (
            error?.code === "INVALID_JSON_BODY" &&
            error?.message === "Invalid JSON in request body"
          ) {
            return createErrorResponse("Invalid JSON", 400, "invalid_json");
          }
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
          );
        }
      }

      try {
        const hasWriteAccess = await canManageOfficials(userId);

        // Officials CRUD
        if (event.httpMethod === "GET" && (path === "" || path === "/")) {
          const result = await getOfficials(queryParams);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && (path === "" || path === "/")) {
          if (!hasWriteAccess) {
            return createErrorResponse(
              "Access denied. Authorized team staff role required.",
              403,
              ErrorType.AUTHORIZATION,
            );
          }
          const result = await createOfficial(userId, body);
          return createSuccessResponse(result, 201);
        }

        // Available officials
        if (event.httpMethod === "GET" && path === "available") {
          try {
            assertValidIsoDate(queryParams.date, "date");
            assertValidTime(queryParams.start_time, "start_time");
            assertValidTime(queryParams.end_time, "end_time");
            if (queryParams.start_time && queryParams.end_time) {
              const sameOrAfter =
                String(queryParams.end_time) <= String(queryParams.start_time);
              if (sameOrAfter) {
                return createErrorResponse(
                  "end_time must be after start_time",
                  422,
                  "validation_error",
                );
              }
            }
          } catch (validationError) {
            return createErrorResponse(
              validationError.message,
              422,
              "validation_error",
            );
          }
          if (!queryParams.date) {
            return createErrorResponse(
              "date is required",
              422,
              "validation_error",
            );
          }
          const result = await getAvailableOfficials(queryParams);
          return createSuccessResponse(result);
        }

        // Payment summary
        if (event.httpMethod === "GET" && path === "payments/summary") {
          if (!hasWriteAccess) {
            return createErrorResponse(
              "Access denied. Authorized team staff role required.",
              403,
              ErrorType.AUTHORIZATION,
            );
          }
          try {
            assertValidIsoDate(queryParams.start_date, "start_date");
            assertValidIsoDate(queryParams.end_date, "end_date");
            assertDateRange(queryParams.start_date, queryParams.end_date);
          } catch (validationError) {
            return createErrorResponse(
              validationError.message,
              422,
              "validation_error",
            );
          }
          const result = await getPaymentSummary(queryParams);
          return createSuccessResponse(result);
        }

        // Schedule endpoint
        if (event.httpMethod === "POST" && path === "schedule") {
          if (!hasWriteAccess) {
            return createErrorResponse(
              "Access denied. Authorized team staff role required.",
              403,
              ErrorType.AUTHORIZATION,
            );
          }
          const result = await scheduleOfficial(body);
          return createSuccessResponse(result, 201);
        }

        // Single official
        const officialMatch = path.match(/^([^/]+)$/);
        if (
          officialMatch &&
          ![
            "game",
            "assignments",
            "available",
            "schedule",
            "payments",
          ].includes(officialMatch[1])
        ) {
          const officialId = officialMatch[1];

          if (event.httpMethod === "GET") {
            const result = await getOfficial(officialId);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "PUT") {
            if (!hasWriteAccess) {
              return createErrorResponse(
                "Access denied. Authorized team staff role required.",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
            const result = await updateOfficial(officialId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            if (!hasWriteAccess) {
              return createErrorResponse(
                "Access denied. Authorized team staff role required.",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
            const result = await deleteOfficial(officialId);
            return createSuccessResponse(result);
          }
        }

        // Official's games
        const officialGamesMatch = path.match(/^([^/]+)\/games$/);
        if (officialGamesMatch && event.httpMethod === "GET") {
          const result = await getOfficialGames(
            officialGamesMatch[1],
            queryParams,
          );
          return createSuccessResponse(result);
        }

        // Official availability
        const availabilityMatch = path.match(/^([^/]+)\/availability$/);
        if (availabilityMatch) {
          const officialId = availabilityMatch[1];

          if (event.httpMethod === "GET") {
            try {
              assertValidIsoDate(queryParams.start_date, "start_date");
              assertValidIsoDate(queryParams.end_date, "end_date");
              assertDateRange(queryParams.start_date, queryParams.end_date);
            } catch (validationError) {
              return createErrorResponse(
                validationError.message,
                422,
                "validation_error",
              );
            }
            const result = await getOfficialAvailability(
              officialId,
              queryParams.start_date,
              queryParams.end_date,
            );
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "POST") {
            if (!hasWriteAccess) {
              return createErrorResponse(
                "Access denied. Authorized team staff role required.",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
            const result = await setOfficialAvailability(officialId, body);
            return createSuccessResponse(result, 201);
          }
        }

        // Game officials
        const gameOfficialsMatch = path.match(/^game\/([^/]+)$/);
        if (gameOfficialsMatch && event.httpMethod === "GET") {
          const result = await getGameOfficials(gameOfficialsMatch[1]);
          return createSuccessResponse(result);
        }

        // Game official assignments
        const assignmentMatch = path.match(/^assignments\/([^/]+)$/);
        if (assignmentMatch) {
          const assignmentId = assignmentMatch[1];

          if (event.httpMethod === "PUT") {
            if (!hasWriteAccess) {
              return createErrorResponse(
                "Access denied. Authorized team staff role required.",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
            const result = await updateGameOfficial(assignmentId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            if (!hasWriteAccess) {
              return createErrorResponse(
                "Access denied. Authorized team staff role required.",
                403,
                ErrorType.AUTHORIZATION,
              );
            }
            const result = await removeGameOfficial(assignmentId);
            return createSuccessResponse(result);
          }
        }

        // Notify official
        const notifyMatch = path.match(/^assignments\/([^/]+)\/notify$/);
        if (notifyMatch && event.httpMethod === "POST") {
          if (!hasWriteAccess) {
            return createErrorResponse(
              "Access denied. Authorized team staff role required.",
              403,
              ErrorType.AUTHORIZATION,
            );
          }
          // In a real implementation, this would send an email/SMS
          // For now, just return success
          return createSuccessResponse({
            success: true,
            message: "Notification sent",
          });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        if (error.message.includes("not found")) {
          return createErrorResponse(error.message, 404, "not_found");
        }
        if (error.message.includes("already scheduled")) {
          return createErrorResponse(error.message, 409, "already_scheduled");
        }
        if (error.message.includes("Assignment not found")) {
          return createErrorResponse(error.message, 404, "not_found");
        }
        if (
          error.message.includes("required") ||
          error.message.includes("Invalid") ||
          error.message.includes("must be") ||
          error.message.includes("No valid fields to update")
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
