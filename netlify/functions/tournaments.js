import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin, checkEnvVars as _checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse, handleNotFoundError } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Tournaments API
// Full CRUD operations for tournament management
// Supports: GET (list/single), POST (create), PUT (update), DELETE

// =====================================================
// TOURNAMENT HANDLERS
// =====================================================

const COACH_ROLES = [
  "coach",
  "manager",
  "admin",
  "head_coach",
  "assistant_coach",
];

function isCoachOrAdminRole(role) {
  return COACH_ROLES.includes(role);
}
const VALID_VISIBILITY_SCOPES = new Set(["team", "personal"]);
const VALID_LIST_STATUSES = new Set(["all", "upcoming", "ongoing", "completed"]);
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isMissingTournamentResourceError(error) {
  const code = error?.code;
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return code === "42P01" || code === "PGRST204" || message.includes("tournaments");
}

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

function assertDateOrder(startDate, endDate) {
  if (!startDate || !endDate) {
    return;
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("start_date and end_date must be valid dates");
  }
  if (end < start) {
    throw new Error("end_date must be on or after start_date");
  }
}

async function getUserMembershipContext(userId) {
  if (!userId) {
    return {
      memberships: [],
      teamIds: [],
      primaryTeamId: null,
      role: "player",
      isCoachOrAdmin: false,
    };
  }

  const membershipQuery = supabaseAdmin
    .from("team_members")
    .select("team_id, role, updated_at, joined_at")
    .eq("user_id", userId)
    .eq("status", "active");

  const orderedQuery =
    typeof membershipQuery.order === "function"
      ? membershipQuery.order("updated_at", { ascending: false })
      : membershipQuery;

  const { data: membershipData, error } = await orderedQuery;

  if (error) {
    throw error;
  }

  const memberships = Array.isArray(membershipData)
    ? membershipData.filter((membership) => membership?.team_id)
    : [];
  const teamIds = [...new Set(memberships.map((membership) => membership.team_id))];
  const primaryMembership = memberships[0] || null;

  return {
    memberships,
    teamIds,
    primaryTeamId: primaryMembership?.team_id || null,
    role: primaryMembership?.role || "player",
    isCoachOrAdmin: memberships.some((membership) =>
      isCoachOrAdminRole(membership.role),
    ),
  };
}

function getMembershipRoleForTeam(membershipContext, teamId) {
  if (!teamId) {
    return membershipContext?.role || "player";
  }

  return (
    membershipContext?.memberships?.find((membership) => membership.team_id === teamId)
      ?.role || null
  );
}

function canAccessTournament(tournament, membershipContext, userId) {
  if (!userId || !tournament) {
    return false;
  }

  const visibilityScope = tournament.visibility_scope || "team";
  const teamId = tournament.team_id || null;
  const membershipRole = getMembershipRoleForTeam(membershipContext, teamId);
  const hasTeamAccess =
    !teamId || membershipContext?.teamIds?.includes(teamId) || false;
  const isCoachOrAdmin = membershipRole
    ? isCoachOrAdminRole(membershipRole)
    : membershipContext?.isCoachOrAdmin || false;
  const isOwner =
    tournament.created_by === userId || tournament.player_id === userId;

  if (!hasTeamAccess) {
    return false;
  }

  if (visibilityScope === "personal") {
    return isCoachOrAdmin || isOwner;
  }

  return true;
}

async function isActiveTeamMember(userId, teamId) {
  if (!userId || !teamId) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}

/**
 * Get all tournaments or a specific tournament by ID
 *
 * Visibility Rules:
 * - 'team' scope: Visible to all team members (created by coach/manager/admin)
 * - 'personal' scope: Visible only to the player who created it + all coaches
 *
 * For players: See all 'team' tournaments + their own 'personal' tournaments
 * For coaches/managers/admins: See all 'team' tournaments + all 'personal' tournaments
 */
async function getTournaments(event, _context, { userId, requestId }) {
  const queryParams = event.queryStringParameters || {};
  const { id, year, status, type } = queryParams;
  if (
    year !== undefined &&
    year !== null &&
    year !== "" &&
    !/^\d{4}$/.test(String(year))
  ) {
    return createErrorResponse(
      "year must be a 4-digit year",
      422,
      "validation_error",
      requestId,
    );
  }
  if (status && !VALID_LIST_STATUSES.has(status)) {
    return createErrorResponse(
      "status must be one of: all, upcoming, ongoing, completed",
      422,
      "validation_error",
      requestId,
    );
  }

  const membershipContext = await getUserMembershipContext(userId);

  if (membershipContext.teamIds.length === 0) {
    return createSuccessResponse({ tournaments: [] }, requestId);
  }

  // Get single tournament by ID
  if (id) {
    const { data, error } = await supabaseAdmin
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (isMissingTournamentResourceError(error)) {
        return handleNotFoundError(`Tournament with ID ${id}`, requestId);
      }
      if (error.code === "PGRST116") {
        return handleNotFoundError(`Tournament with ID ${id}`, requestId);
      }
      throw error;
    }

    if (!canAccessTournament(data, membershipContext, userId)) {
      return handleNotFoundError(`Tournament with ID ${id}`, requestId);
    }

    return createSuccessResponse({ tournament: data }, requestId);
  }

  // Build query for listing tournaments
  let query = supabaseAdmin
    .from("tournaments")
    .select("*")
    .in("team_id", membershipContext.teamIds)
    .order("start_date", { ascending: true });

  // Filter by year if provided
  if (year) {
    query = query
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`);
  }

  // Filter by status if provided
  if (status && status !== "all") {
    // Calculate status based on dates
    const today = new Date().toISOString().split("T")[0];
    if (status === "upcoming") {
      query = query.gt("start_date", today);
    } else if (status === "ongoing") {
      query = query.lte("start_date", today).gte("end_date", today);
    } else if (status === "completed") {
      query = query.lt("end_date", today);
    }
  }

  // Filter by tournament type if provided
  if (type) {
    query = query.eq("tournament_type", type);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTournamentResourceError(error)) {
      return createSuccessResponse({ tournaments: [] }, requestId);
    }
    throw error;
  }

  const filteredData = (data || []).filter((tournament) =>
    canAccessTournament(tournament, membershipContext, userId),
  );

  // Transform data to include calculated status
  const today = new Date().toISOString().split("T")[0];
  const tournaments = filteredData.map((t) => ({
    ...t,
    calculatedStatus: getCalculatedStatus(t.start_date, t.end_date, today),
    daysUntil: getDaysUntil(t.start_date),
  }));

  return createSuccessResponse({ tournaments }, requestId);
}

/**
 * Create a new tournament
 *
 * Visibility Rules:
 * - If created by coach/manager/admin: visibility_scope = 'team' (all team members see it)
 * - If created by player: visibility_scope = 'personal' (only that player + coaches see it)
 */
async function createTournament(event, _context, { userId, requestId }) {
  let body;
  try {
    body = parseJsonObjectBody(event.body);
  } catch (error) {
    if (
      error?.code === "INVALID_JSON_BODY" &&
      error?.message === "Invalid JSON in request body"
    ) {
      return createErrorResponse(
        "Invalid JSON in request body",
        400,
        "invalid_json",
        requestId,
      );
    }
    return createErrorResponse(
      error.message,
      422,
      "validation_error",
      requestId,
    );
  }

  // Validate required fields
  const startDateInput = body.start_date || body.startDate;
  const endDateInput =
    body.end_date || body.endDate || body.start_date || body.startDate;
  try {
    assertValidIsoDate(startDateInput, "start_date");
    assertValidIsoDate(endDateInput, "end_date");
    assertDateOrder(startDateInput, endDateInput);
  } catch (validationError) {
    return createErrorResponse(
      validationError.message,
      422,
      "validation_error",
      requestId,
    );
  }
  const missingFields = [];
  if (!body.name) {
    missingFields.push("name");
  }
  if (!startDateInput) {
    missingFields.push("start_date");
  }
  if (missingFields.length > 0) {
    return createErrorResponse(
      `Missing required fields: ${missingFields.join(", ")}`,
      400,
      "validation_error",
      requestId,
    );
  }

  const membershipContext = await getUserMembershipContext(userId);
  const requestedTeamId =
    body.team_id || body.teamId || membershipContext.primaryTeamId;

  if (!requestedTeamId) {
    return createErrorResponse(
      "Active team membership is required to create tournaments",
      403,
      "authorization_error",
      requestId,
    );
  }

  const teamRole = getMembershipRoleForTeam(membershipContext, requestedTeamId);

  if (!teamRole) {
    return createErrorResponse(
      "You can only create tournaments for a team you actively belong to",
      403,
      "authorization_error",
      requestId,
    );
  }

  // Determine visibility scope based on user role
  // Coaches/managers/admins create team-wide tournaments
  // Players create personal tournaments (only visible to them + coaches)
  const isCoachOrAdmin = isCoachOrAdminRole(teamRole);
  const requestedScope =
    body.visibility_scope || (isCoachOrAdmin ? "team" : "personal");
  if (!VALID_VISIBILITY_SCOPES.has(requestedScope)) {
    return createErrorResponse(
      "visibility_scope must be one of: team, personal",
      400,
      "validation_error",
      requestId,
    );
  }
  const visibilityScope = isCoachOrAdmin ? requestedScope : "personal";

  // For personal tournaments:
  // - players are always owner
  // - coaches may optionally assign to a player_id
  const playerId =
    visibilityScope === "personal"
      ? (isCoachOrAdmin ? body.player_id || body.playerId || userId : userId)
      : null;
  if (visibilityScope === "personal" && !playerId) {
    return createErrorResponse(
      "player_id is required for personal tournaments",
      400,
      "validation_error",
      requestId,
    );
  }

  if (playerId && !(await isActiveTeamMember(playerId, requestedTeamId))) {
    return createErrorResponse(
      "player_id must belong to the selected team",
      422,
      "validation_error",
      requestId,
    );
  }

  // Prepare tournament data
  const tournamentData = {
    team_id: requestedTeamId,
    name: body.name,
    short_name: body.short_name || body.shortName || null,
    location: body.location || null,
    country: body.country || null,
    flag: body.flag || null,
    start_date: startDateInput,
    end_date: endDateInput,
    tournament_type:
      body.tournament_type || body.tournamentType || "championship",
    competition_level:
      body.competition_level || body.competitionLevel || "regional",
    is_home_tournament:
      body.is_home_tournament || body.isHomeTournament || false,
    registration_deadline:
      body.registration_deadline || body.registrationDeadline || null,
    max_roster_size: body.max_roster_size || body.maxRosterSize || null,
    format: body.format || null,
    notes: body.notes || null,
    website_url: body.website_url || body.websiteUrl || null,
    venue: body.venue || null,
    expected_teams: body.expected_teams || body.expectedTeams || null,
    prize_pool: body.prize_pool || body.prizePool || null,
    created_by: userId,
    visibility_scope: visibilityScope,
    player_id: playerId,
  };

  const { data, error } = await supabaseAdmin
    .from("tournaments")
    .insert(tournamentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const scopeMessage =
    visibilityScope === "personal"
      ? "Personal game day created (visible to you and coaches)"
      : "Team tournament created (visible to all team members)";

  return createSuccessResponse(
    { tournament: data, message: scopeMessage },
    201,
  );
}

/**
 * Update an existing tournament
 */
async function updateTournament(
  event,
  _context,
  { userId, requestId },
) {
  const queryParams = event.queryStringParameters || {};
  const { id } = queryParams;

  if (!id) {
    return createErrorResponse(
      "Tournament ID is required",
      400,
      "validation_error",
      requestId,
    );
  }

  let body;
  try {
    body = parseJsonObjectBody(event.body);
  } catch (error) {
    if (
      error?.code === "INVALID_JSON_BODY" &&
      error?.message === "Invalid JSON in request body"
    ) {
      return createErrorResponse(
        "Invalid JSON in request body",
        400,
        "invalid_json",
        requestId,
      );
    }
    return createErrorResponse(
      error.message,
      422,
      "validation_error",
      requestId,
    );
  }

  // Build update object (only include provided fields)
  const updateData = {};
  const allowedFields = [
    "name",
    "short_name",
    "location",
    "country",
    "flag",
    "start_date",
    "end_date",
    "tournament_type",
    "competition_level",
    "is_home_tournament",
    "registration_deadline",
    "max_roster_size",
    "format",
    "notes",
    "website_url",
    "venue",
    "expected_teams",
    "prize_pool",
    "visibility_scope",
    "player_id",
  ];

  // Map camelCase to snake_case
  const fieldMapping = {
    shortName: "short_name",
    startDate: "start_date",
    endDate: "end_date",
    tournamentType: "tournament_type",
    competitionLevel: "competition_level",
    isHomeTournament: "is_home_tournament",
    registrationDeadline: "registration_deadline",
    maxRosterSize: "max_roster_size",
    websiteUrl: "website_url",
    expectedTeams: "expected_teams",
    prizePool: "prize_pool",
    visibilityScope: "visibility_scope",
    playerId: "player_id",
  };

  for (const [key, value] of Object.entries(body)) {
    const snakeKey = fieldMapping[key] || key;
    if (allowedFields.includes(snakeKey) && value !== undefined) {
      updateData[snakeKey] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return createErrorResponse(
      "No valid fields to update",
      400,
      "validation_error",
      requestId,
    );
  }
  try {
    assertValidIsoDate(updateData.start_date, "start_date");
    assertValidIsoDate(updateData.end_date, "end_date");
  } catch (validationError) {
    return createErrorResponse(
      validationError.message,
      422,
      "validation_error",
      requestId,
    );
  }

  const { data: existingTournament, error: existingError } = await supabaseAdmin
    .from("tournaments")
    .select(
      "id, team_id, created_by, player_id, visibility_scope, start_date, end_date",
    )
    .eq("id", id)
    .single();

  if (existingError || !existingTournament) {
    return handleNotFoundError(`Tournament with ID ${id}`, requestId);
  }

  const membershipContext = await getUserMembershipContext(userId);
  const teamRole = getMembershipRoleForTeam(
    membershipContext,
    existingTournament.team_id,
  );
  const isCoachOrAdmin = teamRole ? isCoachOrAdminRole(teamRole) : false;
  const isOwner =
    existingTournament.created_by === userId ||
    existingTournament.player_id === userId;

  if (
    !canAccessTournament(existingTournament, membershipContext, userId) ||
    (!isCoachOrAdmin && !isOwner)
  ) {
    return createErrorResponse(
      "Not authorized to update this tournament",
      403,
      "authorization_error",
      requestId,
    );
  }

  if (existingTournament.visibility_scope === "team" && !isCoachOrAdmin) {
    return createErrorResponse(
      "Only coaches and admins can update team tournaments",
      403,
      "authorization_error",
      requestId,
    );
  }

  if (
    updateData.visibility_scope !== undefined &&
    !VALID_VISIBILITY_SCOPES.has(updateData.visibility_scope)
  ) {
    return createErrorResponse(
      "visibility_scope must be one of: team, personal",
      400,
      "validation_error",
      requestId,
    );
  }

  if (!isCoachOrAdmin) {
    if (
      updateData.visibility_scope &&
      updateData.visibility_scope !== existingTournament.visibility_scope
    ) {
      return createErrorResponse(
        "Only coaches and admins can change visibility scope",
        403,
        "authorization_error",
        requestId,
      );
    }

    if (
      updateData.player_id !== undefined &&
      updateData.player_id !== existingTournament.player_id
    ) {
      return createErrorResponse(
        "Only coaches and admins can reassign tournament owner",
        403,
        "authorization_error",
        requestId,
      );
    }
  }

  const effectiveVisibility =
    updateData.visibility_scope ?? existingTournament.visibility_scope;
  const effectivePlayerId =
    updateData.player_id !== undefined
      ? updateData.player_id
      : existingTournament.player_id;

  if (effectiveVisibility === "team" && effectivePlayerId !== null) {
    return createErrorResponse(
      "team tournaments cannot have a player_id owner",
      400,
      "validation_error",
      requestId,
    );
  }
  if (effectiveVisibility === "personal" && !effectivePlayerId) {
    return createErrorResponse(
      "personal tournaments require a player_id owner",
      400,
      "validation_error",
      requestId,
    );
  }

  if (
    effectivePlayerId &&
    !(await isActiveTeamMember(effectivePlayerId, existingTournament.team_id))
  ) {
    return createErrorResponse(
      "player_id must belong to the tournament team",
      422,
      "validation_error",
      requestId,
    );
  }

  try {
    const effectiveStartDate = updateData.start_date ?? existingTournament.start_date;
    const effectiveEndDate = updateData.end_date ?? existingTournament.end_date;
    assertDateOrder(effectiveStartDate, effectiveEndDate);
  } catch (validationError) {
    return createErrorResponse(
      validationError.message,
      422,
      "validation_error",
      requestId,
    );
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("tournaments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return handleNotFoundError(`Tournament with ID ${id}`, requestId);
    }
    throw error;
  }

  return createSuccessResponse(
    { tournament: data, message: "Tournament updated successfully" },
    requestId,
  );
}

/**
 * Delete a tournament
 */
async function deleteTournament(
  event,
  _context,
  { userId, requestId },
) {
  const queryParams = event.queryStringParameters || {};
  const { id } = queryParams;

  if (!id) {
    return createErrorResponse(
      "Tournament ID is required",
      400,
      "validation_error",
      requestId,
    );
  }

  // First check if tournament exists
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("tournaments")
    .select("id, name, team_id, created_by, player_id, visibility_scope")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    return handleNotFoundError(`Tournament with ID ${id}`, requestId);
  }

  const membershipContext = await getUserMembershipContext(userId);
  const teamRole = getMembershipRoleForTeam(membershipContext, existing.team_id);
  const isCoachOrAdmin = teamRole ? isCoachOrAdminRole(teamRole) : false;
  const isOwner = existing.created_by === userId || existing.player_id === userId;

  if (
    !canAccessTournament(existing, membershipContext, userId) ||
    (!isCoachOrAdmin && !isOwner)
  ) {
    return createErrorResponse(
      "Not authorized to delete this tournament",
      403,
      "authorization_error",
      requestId,
    );
  }

  if (existing.visibility_scope === "team" && !isCoachOrAdmin) {
    return createErrorResponse(
      "Only coaches and admins can delete team tournaments",
      403,
      "authorization_error",
      requestId,
    );
  }

  // Delete the tournament
  const { error } = await supabaseAdmin
    .from("tournaments")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return createSuccessResponse(
    { message: `Tournament "${existing.name}" deleted successfully` },
    requestId,
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getCalculatedStatus(startDate, endDate, today) {
  if (!startDate) {
    return "upcoming";
  }

  const start = startDate.split("T")[0];
  const end = (endDate || startDate).split("T")[0];

  if (today < start) {
    return "upcoming";
  }
  if (today > end) {
    return "completed";
  }
  return "ongoing";
}

function getDaysUntil(startDate) {
  if (!startDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

// =====================================================
// MAIN HANDLER
// =====================================================

const handler = async (event, context) => {
  // Route to appropriate handler based on HTTP method
  const method = event.httpMethod;

  // POST, PUT, DELETE - require authentication
  if (method === "POST") {
    return baseHandler(event, context, {
      functionName: "tournaments-create",
      allowedMethods: ["POST"],
      rateLimitType: "CREATE",
      requireAuth: true,
      handler: createTournament,
    });
  }

  if (method === "PUT" || method === "PATCH") {
    return baseHandler(event, context, {
      functionName: "tournaments-update",
      allowedMethods: ["PUT", "PATCH"],
      rateLimitType: "UPDATE",
      requireAuth: true,
      handler: updateTournament,
    });
  }

  if (method === "DELETE") {
    return baseHandler(event, context, {
      functionName: "tournaments-delete",
      allowedMethods: ["DELETE"],
      rateLimitType: "DELETE",
      requireAuth: true,
      handler: deleteTournament,
    });
  }

  // GET requests require auth because tournament visibility is team-scoped.
  if (method === "GET") {
    return baseHandler(event, context, {
      functionName: "tournaments-get",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: true,
      handler: getTournaments,
    });
  }

  return createErrorResponse("Method not allowed", 405, "method_not_allowed");
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
