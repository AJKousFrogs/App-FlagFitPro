import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

/**
 * Tournament Calendar API
 *
 * Endpoints:
 * - GET /api/tournament-calendar - Get upcoming tournaments
 * - POST /api/tournament-calendar - Add/update tournament
 * - POST /api/tournament-calendar/delete - Delete tournament
 */

import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { COACH_ROUTE_ROLES } from "./utils/role-sets.js";

async function hasCoachTournamentAccess(userId) {
  if (!userId) {
    return false;
  }

  const membershipQuery = supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active");

  if (typeof membershipQuery.in === "function") {
    const { data, error } = await membershipQuery.in("role", COACH_ROUTE_ROLES);
    if (error) {
      throw error;
    }

    return Array.isArray(data) && data.length > 0;
  }

  const orderedQuery =
    typeof membershipQuery.order === "function"
      ? membershipQuery.order("updated_at", { ascending: false })
      : membershipQuery;

  if (typeof orderedQuery.limit === "function") {
    const { data, error } = await orderedQuery.limit(1);
    if (error) {
      throw error;
    }

    return COACH_ROUTE_ROLES.includes(data?.[0]?.role);
  }

  if (typeof orderedQuery.maybeSingle === "function") {
    const { data, error } = await orderedQuery.maybeSingle();
    if (error) {
      throw error;
    }

    return COACH_ROUTE_ROLES.includes(data?.role);
  }

  return false;
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "tournament-calendar",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      try {
        const endpoint = evt.path.split("/").pop();

        if (evt.httpMethod === "GET") {
          return getTournaments(supabaseAdmin, userId);
        }

        let payload = {};
        try {
          payload = parseJsonObjectBody(evt.body);
        } catch (_parseError) {
          return handleValidationError("Invalid JSON in request body");
        }

        if (endpoint === "delete") {
          return deleteTournament(supabaseAdmin, userId, payload);
        }

        return saveTournament(supabaseAdmin, userId, payload);
      } catch (err) {
        console.error("Tournament calendar error:", err);
        return createErrorResponse("Internal server error", 500, "server_error");
      }
    },
  });

/**
 * GET /api/tournament-calendar
 * Fetch upcoming tournaments (next 12 months)
 */
async function getTournaments(supabase, userId) {
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
    const daysUntil = Math.ceil(
      (startDate - todayDate) / (1000 * 60 * 60 * 24),
    );

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
async function saveTournament(supabase, userId, payload) {
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
    return handleValidationError("name, startDate, and endDate are required");
  }

  const isCoachOrAdmin = await hasCoachTournamentAccess(userId);
  const requestsNationalTeamEvent = isNationalTeamEvent === true;

  if (!isCoachOrAdmin && requestsNationalTeamEvent) {
    return createErrorResponse(
      "Only coaches and admins can create national team events",
      403,
      "authorization_error",
    );
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
    updated_at: new Date().toISOString(),
  };

  let result;

  if (id) {
    const { data: existing, error: existingError } = await supabase
      .from("tournament_calendar")
      .select("id, created_by, is_national_team_event")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return createErrorResponse("Tournament not found", 404, "not_found");
    }

    const isOwner = existing.created_by === userId;
    if (!isCoachOrAdmin && !isOwner) {
      return createErrorResponse(
        "Not authorized to update this tournament",
        403,
        "authorization_error",
      );
    }

    if (existing.is_national_team_event && !isCoachOrAdmin) {
      return createErrorResponse(
        "Only coaches and admins can update national team events",
        403,
        "authorization_error",
      );
    }
    if (
      !isCoachOrAdmin &&
      isNationalTeamEvent !== undefined &&
      isNationalTeamEvent !== existing.is_national_team_event
    ) {
      return createErrorResponse(
        "Only coaches and admins can change national team event status",
        403,
        "authorization_error",
      );
    }

    // Update existing
    const { data, error } = await supabase
      .from("tournament_calendar")
      .update(tournamentData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  } else {
    tournamentData.created_by = userId;

    // Insert new
    const { data, error } = await supabase
      .from("tournament_calendar")
      .insert(tournamentData)
      .select()
      .single();

    if (error) {
      throw error;
    }
    result = data;
  }

  return {
    statusCode: 200,
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
async function deleteTournament(supabase, userId, payload) {
  const { id } = payload;

  if (!id) {
    return handleValidationError("tournamentId is required");
  }

  // Verify ownership or coach/admin privileges
  const { data: tournament, error: fetchError } = await supabase
    .from("tournament_calendar")
    .select("created_by, is_national_team_event")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return createErrorResponse("Tournament not found", 404, "not_found");
    }
    throw fetchError;
  }

  const isCoachOrAdmin = await hasCoachTournamentAccess(userId);
  const isOwner = tournament.created_by === userId;

  if (!isCoachOrAdmin && !isOwner) {
    return createErrorResponse(
      "Not authorized to delete this tournament",
      403,
      "authorization_error",
    );
  }

  if (tournament.is_national_team_event && !isCoachOrAdmin) {
    return createErrorResponse(
      "Only coaches and admins can delete national team events",
      403,
      "authorization_error",
    );
  }

  const { error: deleteError } = await supabase
    .from("tournament_calendar")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw deleteError;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Tournament deleted",
    }),
  };
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
