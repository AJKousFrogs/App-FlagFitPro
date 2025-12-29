// Netlify Function: Tournaments API
// Full CRUD operations for tournament management
// Supports: GET (list/single), POST (create), PUT (update), DELETE

const { supabaseAdmin, checkEnvVars } = require("./supabase-client.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleNotFoundError,
} = require("./utils/error-handler.cjs");

// =====================================================
// TOURNAMENT HANDLERS
// =====================================================

/**
 * Get all tournaments or a specific tournament by ID
 */
async function getTournaments(event, _context, { userId, requestId }) {
  const queryParams = event.queryStringParameters || {};
  const { id, year, status, type } = queryParams;

  // Get single tournament by ID
  if (id) {
    const { data, error } = await supabaseAdmin
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return handleNotFoundError(`Tournament with ID ${id}`, requestId);
      }
      throw error;
    }

    return createSuccessResponse({ tournament: data }, requestId);
  }

  // Build query for listing tournaments
  let query = supabaseAdmin
    .from("tournaments")
    .select("*")
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
    throw error;
  }

  // Transform data to include calculated status
  const today = new Date().toISOString().split("T")[0];
  const tournaments = (data || []).map((t) => ({
    ...t,
    calculatedStatus: getCalculatedStatus(t.start_date, t.end_date, today),
    daysUntil: getDaysUntil(t.start_date),
  }));

  return createSuccessResponse({ tournaments }, requestId);
}

/**
 * Create a new tournament
 */
async function createTournament(event, _context, { userId, requestId }) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return createErrorResponse(
      "Invalid JSON in request body",
      400,
      "invalid_json",
      requestId
    );
  }

  // Validate required fields
  const requiredFields = ["name", "start_date"];
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    return createErrorResponse(
      `Missing required fields: ${missingFields.join(", ")}`,
      400,
      "validation_error",
      requestId
    );
  }

  // Prepare tournament data
  const tournamentData = {
    name: body.name,
    short_name: body.short_name || body.shortName || null,
    location: body.location || null,
    country: body.country || null,
    start_date: body.start_date || body.startDate,
    end_date: body.end_date || body.endDate || body.start_date || body.startDate,
    tournament_type: body.tournament_type || body.tournamentType || "championship",
    competition_level: body.competition_level || body.competitionLevel || "regional",
    is_home_tournament: body.is_home_tournament || body.isHomeTournament || false,
    registration_deadline: body.registration_deadline || body.registrationDeadline || null,
    max_roster_size: body.max_roster_size || body.maxRosterSize || null,
    format: body.format || null,
    notes: body.notes || null,
    website_url: body.website_url || body.websiteUrl || null,
    venue: body.venue || null,
    expected_teams: body.expected_teams || body.expectedTeams || null,
    prize_pool: body.prize_pool || body.prizePool || null,
    created_by: userId,
  };

  const { data, error } = await supabaseAdmin
    .from("tournaments")
    .insert(tournamentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return createSuccessResponse(
    { tournament: data, message: "Tournament created successfully" },
    requestId,
    201
  );
}

/**
 * Update an existing tournament
 */
async function updateTournament(event, _context, { userId, requestId }) {
  const queryParams = event.queryStringParameters || {};
  const { id } = queryParams;

  if (!id) {
    return createErrorResponse(
      "Tournament ID is required",
      400,
      "validation_error",
      requestId
    );
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return createErrorResponse(
      "Invalid JSON in request body",
      400,
      "invalid_json",
      requestId
    );
  }

  // Build update object (only include provided fields)
  const updateData = {};
  const allowedFields = [
    "name",
    "short_name",
    "location",
    "country",
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
      requestId
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
    requestId
  );
}

/**
 * Delete a tournament
 */
async function deleteTournament(event, _context, { userId, requestId }) {
  const queryParams = event.queryStringParameters || {};
  const { id } = queryParams;

  if (!id) {
    return createErrorResponse(
      "Tournament ID is required",
      400,
      "validation_error",
      requestId
    );
  }

  // First check if tournament exists
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("tournaments")
    .select("id, name")
    .eq("id", id)
    .single();

  if (checkError || !existing) {
    return handleNotFoundError(`Tournament with ID ${id}`, requestId);
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
    requestId
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getCalculatedStatus(startDate, endDate, today) {
  if (!startDate) return "upcoming";
  
  const start = startDate.split("T")[0];
  const end = (endDate || startDate).split("T")[0];
  
  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "ongoing";
}

function getDaysUntil(startDate) {
  if (!startDate) return null;
  
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

exports.handler = async (event, context) => {
  // Route to appropriate handler based on HTTP method
  const method = event.httpMethod;

  // GET requests - public, no auth required
  if (method === "GET") {
    return baseHandler(event, context, {
      functionName: "tournaments-get",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: false, // Public read access
      handler: getTournaments,
    });
  }

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

  return createErrorResponse("Method not allowed", 405, "method_not_allowed");
};
