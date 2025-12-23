// Netlify Function: Tournaments API
// Returns tournament data from database or local schedule
// NOTE: Public endpoint - no authentication required

const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleNotFoundError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

// Tournament schedule data (fallback if database is unavailable)
const TOURNAMENT_SCHEDULE = {
  2026: [
    {
      id: "adria_bowl_2026",
      name: "Adria Bowl",
      location: "Poreč, Croatia",
      country: "HRV",
      flag: "🇭🇷",
      startDate: "2026-04-11",
      endDate: "2026-04-12",
      type: "Regional Championship",
      status: "upcoming",
      description: "Flag football tournament in Poreč, Croatia",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "copenhagen_bowl_2026",
      name: "Copenhagen Bowl",
      location: "Copenhagen, Denmark",
      country: "DNK",
      flag: "🇩🇰",
      startDate: "2026-05-23",
      endDate: "2026-05-24",
      type: "International Championship",
      status: "upcoming",
      description: "Flag football tournament in Copenhagen, Denmark",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "big_bowl_2026",
      name: "Big Bowl",
      location: "Frankfurt, Germany",
      country: "DEU",
      flag: "🇩🇪",
      startDate: "2026-06-06",
      endDate: "2026-06-07",
      type: "Major Championship",
      status: "upcoming",
      description: "Flag football tournament in Frankfurt, Germany",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "capital_bowl_2026",
      name: "Capital Bowl",
      location: "Paris, France",
      country: "FRA",
      flag: "🇫🇷",
      startDate: "2026-07-04",
      endDate: "2026-07-05",
      type: "Elite Championship",
      status: "upcoming",
      description: "Flag football tournament in Paris, France",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "elite_8_2026",
      name: "Elite 8",
      location: "Slovenia",
      country: "SVN",
      flag: "🇸🇮",
      startDate: "2026-09-18",
      endDate: "2026-09-20",
      type: "Elite Invitational",
      status: "upcoming",
      description: "Elite invitation-only tournament in Slovenia",
      venue: "TBD",
      expectedTeams: 8,
      registrationDeadline: "Invitation Only",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      isInvitationOnly: true,
    },
  ],
  2027: [
    {
      id: "flagging_new_year_2027",
      name: "Flagging New Year",
      location: "Ravenscraig, Scotland",
      country: "GBR",
      flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      startDate: "TBD",
      endDate: "TBD",
      month: "January",
      type: "New Year Championship",
      status: "upcoming",
      description: "New Year flag football tournament in Scotland",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      note: "Date TBD January 2027",
    },
    {
      id: "flag_tech_2027",
      name: "Flag Tech",
      location: "Spain",
      country: "ESP",
      flag: "🇪🇸",
      startDate: "TBD",
      endDate: "TBD",
      month: "February",
      type: "Technology & Innovation Tournament",
      status: "upcoming",
      description: "Flag football tournament in Spain",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      note: "Date TBD February 2027",
    },
  ],
};

// Get all tournaments
const getAllTournaments = () => {
  return [...TOURNAMENT_SCHEDULE["2026"], ...TOURNAMENT_SCHEDULE["2027"]];
};

// Get tournaments by year
const getTournamentsByYear = (year) => {
  return TOURNAMENT_SCHEDULE[year] || [];
};

// Get tournaments from database (if available)
const getTournamentsFromDB = async (type = null) => {
  try {
    checkEnvVars();

    // Try to get tournaments from database
    let status = "all";
    if (type === "2026" || type === "2027") {
      // Filter by year if needed
      status = "all";
    }

    const tournaments = await db.tournaments.getList(status, 50);

    // Transform database format to match local format
    if (tournaments && tournaments.length > 0) {
      return tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        location: t.location || t.city || "TBD",
        country: t.country || "",
        flag: t.flag || "",
        startDate: t.start_date || t.startDate || "TBD",
        endDate: t.end_date || t.endDate || t.startDate || "TBD",
        type: t.type || t.tournament_type || "Championship",
        status: t.status || "upcoming",
        description: t.description || "",
        venue: t.venue || "TBD",
        expectedTeams: t.expected_teams || t.expectedTeams || "TBD",
        registrationDeadline:
          t.registration_deadline || t.registrationDeadline || "TBD",
        prizePool: t.prize_pool || t.prizePool || "TBD",
        qualificationPoints:
          t.qualification_points || t.qualificationPoints || "TBD",
        isInvitationOnly: t.is_invitation_only || t.isInvitationOnly || false,
        month: t.month || null,
      }));
    }

    return null;
  } catch (error) {
    console.error("Error fetching tournaments from database:", error);
    // Return null to fallback to local data
    return null;
  }
};

// Get leaderboard data
const getLeaderboard = async (tournamentId = null) => {
  try {
    checkEnvVars();

    // Try to get leaderboard from database
    // This would require a tournament_leaderboard or games table
    // For now, return empty array - can be extended later
    // Example query if table exists:
    // const { data, error } = await supabaseAdmin
    //   .from("tournament_leaderboard")
    //   .select("*")
    //   .order("points", { ascending: false })
    //   .limit(20);

    return [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

exports.handler = async (event, context) => {
  logFunctionCall("Tournaments", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow GET requests for now
  if (event.httpMethod !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  try {
    // SECURITY: Apply rate limiting (public endpoint)
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const { type, id, register, bracket } = queryParams;

    // Handle specific tournament details request
    if (id) {
      const allTournaments = getAllTournaments();
      const tournament = allTournaments.find((t) => t.id === id);
      if (tournament) {
        return createSuccessResponse({ tournament });
      } else {
        return handleNotFoundError(`Tournament with ID ${id}`);
      }
    }

    // Handle registration (placeholder - would need database integration)
    if (register) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          message: "Registration request received",
        }),
      };
    }

    // Handle bracket request (placeholder - would need database integration)
    if (bracket) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          data: { bracket: [] },
        }),
      };
    }

    // Get tournaments from database or use local data
    let tournaments = await getTournamentsFromDB(type);

    if (!tournaments || tournaments.length === 0) {
      // Fallback to local tournament schedule if database is empty
      if (type === "2026") {
        tournaments = getTournamentsByYear("2026");
      } else if (type === "2027") {
        tournaments = getTournamentsByYear("2027");
      } else if (type === "all") {
        tournaments = getAllTournaments();
      } else {
        // Default to 2026 season
        tournaments = getTournamentsByYear("2026");
      }
    } else if (type) {
      // Filter database results by type if needed
      if (type === "2026") {
        tournaments = tournaments.filter(
          (t) =>
            t.startDate &&
            (t.startDate.startsWith("2026") ||
              (t.startDate === "TBD" && !t.month)),
        );
      } else if (type === "2027") {
        tournaments = tournaments.filter(
          (t) => t.startDate && (t.startDate.startsWith("2027") || t.month),
        );
      }
      // "all" type returns all tournaments as-is
    }

    // Get leaderboard
    const leaderboard = await getLeaderboard();

    return createSuccessResponse({
      tournaments: tournaments || [],
      leaderboard: leaderboard || [],
    });
  } catch (error) {
    return handleServerError(error, "Tournaments");
  }
};
