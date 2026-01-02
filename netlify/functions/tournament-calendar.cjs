/**
 * Tournament Calendar API
 *
 * Endpoints:
 * - GET /api/tournament-calendar - Get upcoming tournaments
 * - POST /api/tournament-calendar - Add/update tournament
 * - POST /api/tournament-calendar/delete - Delete tournament
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = (authHeader) => {
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

exports.handler = async (event) => {
  const { httpMethod, path, body, headers } = event;
  const authHeader = headers.authorization || headers.Authorization;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (!authHeader) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Authorization required" }),
    };
  }

  const supabase = getSupabase(authHeader);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid authentication" }),
    };
  }

  try {
    const endpoint = path.split("/").pop();

    if (httpMethod === "GET") {
      return await getTournaments(supabase, user.id, corsHeaders);
    }

    if (httpMethod === "POST") {
      const payload = body ? JSON.parse(body) : {};

      if (endpoint === "delete") {
        return await deleteTournament(supabase, user.id, payload, corsHeaders);
      }

      return await saveTournament(supabase, user.id, payload, corsHeaders);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (err) {
    console.error("Tournament calendar error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error", message: err.message }),
    };
  }
};

/**
 * GET /api/tournament-calendar
 * Fetch upcoming tournaments (next 12 months)
 */
async function getTournaments(supabase, userId, headers) {
  const today = new Date().toISOString().split("T")[0];

  // Get tournaments from next 12 months
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const maxDate = futureDate.toISOString().split("T")[0];

  const { data: tournaments, error } = await supabase
    .from("tournament_calendar")
    .select("*")
    .gte("end_date", today)
    .lte("start_date", maxDate)
    .order("start_date", { ascending: true });

  if (error) {
    throw error;
  }

  // Calculate days until and taper info
  const enrichedTournaments = tournaments.map((t) => {
    const startDate = new Date(t.start_date);
    const todayDate = new Date(today);
    const daysUntil = Math.ceil((startDate - todayDate) / (1000 * 60 * 60 * 24));

    // Calculate taper start date
    const taperWeeks = t.taper_weeks_before || 1;
    const taperStartDate = new Date(startDate);
    taperStartDate.setDate(taperStartDate.getDate() - taperWeeks * 7);
    const taperStartStr = taperStartDate.toISOString().split("T")[0];

    // Check if we're in taper period
    const isInTaperPeriod = today >= taperStartStr && today < t.start_date;

    return {
      id: t.id,
      name: t.name,
      startDate: t.start_date,
      endDate: t.end_date,
      country: t.country,
      city: t.city,
      isPeakEvent: t.is_peak_event,
      gamesExpected: t.games_expected,
      throwsPerGameQb: t.throws_per_game_qb,
      eventType: t.event_type,
      isNationalTeamEvent: t.is_national_team_event,
      taperWeeksBefore: t.taper_weeks_before,
      notes: t.notes,
      externalUrl: t.external_url,
      createdBy: t.created_by,
      // Computed
      daysUntil,
      taperStartDate: taperStartStr,
      isInTaperPeriod,
    };
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: enrichedTournaments,
    }),
  };
}

/**
 * POST /api/tournament-calendar
 * Add or update a tournament
 */
async function saveTournament(supabase, userId, payload, headers) {
  const {
    id,
    name,
    startDate,
    endDate,
    country,
    city,
    isPeakEvent,
    gamesExpected,
    throwsPerGameQb,
    eventType,
    isNationalTeamEvent,
    taperWeeksBefore,
    notes,
    externalUrl,
  } = payload;

  if (!name || !startDate || !endDate) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Name, startDate, and endDate required" }),
    };
  }

  const tournamentData = {
    name,
    start_date: startDate,
    end_date: endDate,
    country: country || null,
    city: city || null,
    is_peak_event: isPeakEvent || false,
    games_expected: gamesExpected || 8,
    throws_per_game_qb: throwsPerGameQb || 40,
    event_type: eventType || "club",
    is_national_team_event: isNationalTeamEvent || false,
    taper_weeks_before: taperWeeksBefore || 1,
    notes: notes || null,
    external_url: externalUrl || null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  let result;

  if (id) {
    // Update existing
    const { data, error } = await supabase
      .from("tournament_calendar")
      .update(tournamentData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("tournament_calendar")
      .insert(tournamentData)
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result,
      message: id ? "Tournament updated" : "Tournament added",
    }),
  };
}

/**
 * POST /api/tournament-calendar/delete
 * Delete a tournament
 */
async function deleteTournament(supabase, userId, payload, headers) {
  const { id } = payload;

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Tournament ID required" }),
    };
  }

  // Verify ownership or allow if user is coach
  const { data: tournament, error: fetchError } = await supabase
    .from("tournament_calendar")
    .select("created_by")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // For now, allow deletion if user created it
  // TODO: Add coach role check for national team events
  if (tournament.created_by && tournament.created_by !== userId) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Not authorized to delete this tournament" }),
    };
  }

  const { error: deleteError } = await supabase
    .from("tournament_calendar")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: "Tournament deleted",
    }),
  };
}
