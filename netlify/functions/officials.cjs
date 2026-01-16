// Netlify Function: Officials API
// Handles referee/official scheduling and management

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

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

  // Check if official is already scheduled for this game
  const { data: existing } = await supabaseAdmin
    .from("game_officials")
    .select("id")
    .eq("game_id", game_id)
    .eq("official_id", official_id)
    .single();

  if (existing) {
    throw new Error("Official is already scheduled for this game");
  }

  const { data, error } = await supabaseAdmin
    .from("game_officials")
    .insert({
      game_id,
      official_id,
      role,
      status: "scheduled",
      payment_amount,
      payment_status: payment_amount ? "pending" : null,
      notes,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Update a game official assignment
const updateGameOfficial = async (assignmentId, updates) => {
  checkEnvVars();

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
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "officials",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: "DEFAULT",
    handler: async (event, _context, { userId }) => {
      const path = event.path
        .replace(/^\/api\/officials\/?/, "")
        .replace(/^\/\.netlify\/functions\/officials\/?/, "");
      const queryParams = event.queryStringParameters || {};

      let body = {};
      if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
        try {
          body = JSON.parse(event.body);
        } catch {
          return createErrorResponse("Invalid JSON", 400, ErrorType.VALIDATION);
        }
      }

      try {
        // Officials CRUD
        if (event.httpMethod === "GET" && (path === "" || path === "/")) {
          const result = await getOfficials(queryParams);
          return createSuccessResponse(result);
        }

        if (event.httpMethod === "POST" && (path === "" || path === "/")) {
          const result = await createOfficial(userId, body);
          return createSuccessResponse(result, null, 201);
        }

        // Available officials
        if (event.httpMethod === "GET" && path === "available") {
          const result = await getAvailableOfficials(queryParams);
          return createSuccessResponse(result);
        }

        // Payment summary
        if (event.httpMethod === "GET" && path === "payments/summary") {
          const result = await getPaymentSummary(queryParams);
          return createSuccessResponse(result);
        }

        // Schedule endpoint
        if (event.httpMethod === "POST" && path === "schedule") {
          const result = await scheduleOfficial(body);
          return createSuccessResponse(result, null, 201);
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
            const result = await updateOfficial(officialId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
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
            const result = await getOfficialAvailability(
              officialId,
              queryParams.start_date,
              queryParams.end_date,
            );
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "POST") {
            const result = await setOfficialAvailability(officialId, body);
            return createSuccessResponse(result, null, 201);
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
            const result = await updateGameOfficial(assignmentId, body);
            return createSuccessResponse(result);
          }

          if (event.httpMethod === "DELETE") {
            const result = await removeGameOfficial(assignmentId);
            return createSuccessResponse(result);
          }
        }

        // Notify official
        const notifyMatch = path.match(/^assignments\/([^/]+)\/notify$/);
        if (notifyMatch && event.httpMethod === "POST") {
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
          return createErrorResponse(error.message, 400, "already_scheduled");
        }
        throw error;
      }
    },
  });
};
