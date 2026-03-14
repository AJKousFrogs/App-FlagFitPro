import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse, ErrorType } from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { COACH_ROUTE_ROLES } from "./utils/role-sets.js";

// Netlify Function: Scouting Reports API
// Handles opponent scouting, game plans, and tendency analysis

/**
 * Verify user has coach access
 */
async function verifyCoachAccess(userId) {
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("role, team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", COACH_ROUTE_ROLES)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return member;
}

/**
 * Get all scouting reports for team
 */
async function getScoutingReports(teamId, options = {}) {
  const { status, limit = 50 } = options;

  let query = supabaseAdmin
    .from("scouting_reports")
    .select(
      `
      *,
      created_by_user:created_by(full_name)
    `,
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error && error.code !== "42P01") {
    throw error;
  } // Ignore table not exists
  return data || [];
}

/**
 * Get single scouting report
 */
async function getScoutingReport(reportId, teamId) {
  const { data, error } = await supabaseAdmin
    .from("scouting_reports")
    .select(
      `
      *,
      created_by_user:created_by(full_name)
    `,
    )
    .eq("id", reportId)
    .eq("team_id", teamId)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Create scouting report
 */
async function createScoutingReport(teamId, userId, reportData) {
  const { data, error } = await supabaseAdmin
    .from("scouting_reports")
    .insert({
      team_id: teamId,
      created_by: userId,
      opponent_name: reportData.opponentName,
      opponent_profile: reportData.opponentProfile || {},
      game_date: reportData.gameDate,
      location: reportData.location,
      offensive_notes: reportData.offensiveNotes,
      defensive_notes: reportData.defensiveNotes,
      special_teams_notes: reportData.specialTeamsNotes,
      key_players: reportData.keyPlayers || [],
      tendencies: reportData.tendencies || {},
      game_plan: reportData.gamePlan || {},
      film_links: reportData.filmLinks || [],
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Update scouting report
 */
async function updateScoutingReport(reportId, teamId, updates) {
  const allowedFields = new Set([
    "opponent_name",
    "opponent_profile",
    "game_date",
    "location",
    "offensive_notes",
    "defensive_notes",
    "special_teams_notes",
    "key_players",
    "tendencies",
    "game_plan",
    "film_links",
    "status",
  ]);

  const sanitizedUpdates = {};
  for (const [key, value] of Object.entries(updates || {})) {
    if (allowedFields.has(key) && value !== undefined) {
      sanitizedUpdates[key] = value;
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    const error = new Error("No valid fields to update");
    error.isValidation = true;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from("scouting_reports")
    .update({
      ...sanitizedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("team_id", teamId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Delete scouting report
 */
async function deleteScoutingReport(reportId, teamId) {
  const { error } = await supabaseAdmin
    .from("scouting_reports")
    .delete()
    .eq("id", reportId)
    .eq("team_id", teamId);

  if (error) {
    throw error;
  }
  return { success: true };
}

/**
 * Get opponent database
 */
async function getOpponents(teamId) {
  // Get unique opponents from scouting reports
  const { data: reports } = await supabaseAdmin
    .from("scouting_reports")
    .select("opponent_name, opponent_profile, tendencies")
    .eq("team_id", teamId);

  // Also check games for opponents
  const { data: games } = await supabaseAdmin
    .from("games")
    .select(
      `
      id,
      home_team_id,
      away_team_id,
      home_team:home_team_id(id, name),
      away_team:away_team_id(id, name),
      home_score,
      away_score,
      game_date
    `,
    )
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("game_date", { ascending: false });

  // Build opponent map
  const opponentMap = new Map();

  // From scouting reports
  for (const report of reports || []) {
    const name = report.opponent_name;
    if (!opponentMap.has(name)) {
      opponentMap.set(name, {
        name,
        profile: report.opponent_profile || {},
        tendencies: report.tendencies || {},
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        lastPlayed: null,
      });
    }
  }

  // From games
  for (const game of games || []) {
    const isHome = game.home_team_id === teamId;
    const opponent = isHome ? game.away_team : game.home_team;
    if (!opponent) {
      continue;
    }

    const opponentName = opponent.name;
    const entry = opponentMap.get(opponentName) || {
      name: opponentName,
      opponentTeamId: opponent.id,
      profile: {},
      tendencies: {},
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      lastPlayed: null,
    };

    entry.gamesPlayed++;
    const ourScore = isHome ? game.home_score : game.away_score;
    const theirScore = isHome ? game.away_score : game.home_score;

    if (ourScore > theirScore) {
      entry.wins++;
    } else if (theirScore > ourScore) {
      entry.losses++;
    }

    if (!entry.lastPlayed || game.game_date > entry.lastPlayed) {
      entry.lastPlayed = game.game_date;
    }

    opponentMap.set(opponentName, entry);
  }

  return Array.from(opponentMap.values());
}

/**
 * Add opponent to database
 */
async function addOpponent(teamId, opponentData) {
  // Create a placeholder scouting report for the opponent
  const { data, error } = await supabaseAdmin
    .from("scouting_reports")
    .insert({
      team_id: teamId,
      opponent_name: opponentData.name,
      opponent_profile: {
        city: opponentData.city,
        conference: opponentData.conference,
        coach: opponentData.coach,
        record: opponentData.record,
        notes: opponentData.notes,
      },
      tendencies: {},
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Analyze team tendencies from game data
 */
async function analyzeTendencies(teamId, opponentName) {
  // Get scouting reports for this opponent
  const { data: reports } = await supabaseAdmin
    .from("scouting_reports")
    .select("tendencies, offensive_notes, defensive_notes")
    .eq("team_id", teamId)
    .eq("opponent_name", opponentName);

  // Aggregate tendencies
  const aggregated = {
    offensive: {
      formations: {},
      playTypes: {},
      runPassRatio: { run: 0, pass: 0 },
      redZone: [],
      thirdDown: [],
    },
    defensive: {
      formations: {},
      coverages: {},
      blitzFrequency: 0,
      pressureTendencies: [],
    },
    specialTeams: {
      notes: [],
    },
  };

  for (const report of reports || []) {
    const tendencies = report.tendencies || {};

    // Aggregate offensive formations
    for (const [formation, count] of Object.entries(
      tendencies.offensiveFormations || {},
    )) {
      aggregated.offensive.formations[formation] =
        (aggregated.offensive.formations[formation] || 0) + count;
    }

    // Aggregate defensive coverages
    for (const [coverage, count] of Object.entries(
      tendencies.defensiveCoverages || {},
    )) {
      aggregated.defensive.coverages[coverage] =
        (aggregated.defensive.coverages[coverage] || 0) + count;
    }

    // Notes
    if (report.offensive_notes) {
      aggregated.offensive.notes ||= [];
      aggregated.offensive.notes.push(report.offensive_notes);
    }
    if (report.defensive_notes) {
      aggregated.defensive.notes ||= [];
      aggregated.defensive.notes.push(report.defensive_notes);
    }
  }

  return aggregated;
}

/**
 * Share report with team chat
 */
async function shareReportToChat(reportId, teamId, userId) {
  const report = await getScoutingReport(reportId, teamId);

  // Create chat message with report summary
  const { error } = await supabaseAdmin.from("chat_messages").insert({
    user_id: userId,
    channel: `team_${teamId}`,
    message:
      `📋 **Scouting Report: ${report.opponent_name}**\n\n` +
      `Game Date: ${report.game_date || "TBD"}\n` +
      `Key Notes: ${report.offensive_notes?.substring(0, 200) || "No notes"}...\n\n` +
      `_View full report in Scouting section_`,
    message_type: "scouting_report",
    metadata: { reportId },
    created_at: new Date().toISOString(),
  });

  if (error && error.code !== "42P01") {
    throw error;
  }

  // Update report as shared
  await updateScoutingReport(reportId, teamId, { status: "shared" });

  return { success: true };
}

// Main handler
async function handleRequest(event, _context, { userId }) {
    const path = event.path.replace("/.netlify/functions/scouting", "");
    const method = event.httpMethod;
    const params = event.queryStringParameters || {};
    const parseBoundedInt = (value, fallback, { min, max, field }) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }
      const normalized = String(value).trim();
      if (!/^-?\d+$/.test(normalized)) {
        throw new Error(`${field} must be an integer between ${min} and ${max}`);
      }
      const parsed = Number.parseInt(normalized, 10);
      if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${field} must be an integer between ${min} and ${max}`);
      }
      return parsed;
    };
    const parseJsonBody = () => {
      let parsedBody;
      try {
        parsedBody = JSON.parse(event.body || "{}");
      } catch {
        return { ok: false, body: null, code: "invalid_json" };
      }
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        return {
          ok: false,
          body: null,
          code: "validation_error",
          error: "Request body must be an object",
        };
      }
      return { ok: true, body: parsedBody };
    };

    try {
      // Verify coach access
      const access = await verifyCoachAccess(userId);
      if (!access) {
        return createErrorResponse(
          "Access denied. Coach role required.",
          403,
          ErrorType.AUTHORIZATION,
        );
      }

      const teamId = access.team_id;

    // GET /reports - Get all scouting reports
    if (
      method === "GET" &&
      (path === "" || path === "/" || path === "/reports")
    ) {
      let limit;
      try {
        limit = parseBoundedInt(params.limit, 50, {
          min: 1,
          max: 200,
          field: "limit",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "limit must be an integer between 1 and 200",
          422,
          "validation_error",
        );
      }
      const reports = await getScoutingReports(teamId, {
        status: params.status,
        limit,
      });
      return createSuccessResponse({ reports });
    }

    // GET /reports/:id - Get single report
    if (method === "GET" && path.match(/^\/reports\/[\w-]+$/)) {
      const reportId = path.split("/")[2];
      const report = await getScoutingReport(reportId, teamId);
      return createSuccessResponse({ report });
    }

    // POST /reports - Create new report
    if (method === "POST" && path === "/reports") {
      const parsed = parseJsonBody();
      if (!parsed.ok) {
        return createErrorResponse(
          parsed.error || "Invalid JSON in request body",
          parsed.code === "invalid_json" ? 400 : 422,
          parsed.code === "invalid_json" ? "invalid_json" : "validation_error",
        );
      }
      const body = parsed.body;
      if (
        typeof body.opponentName !== "string" ||
        body.opponentName.trim().length === 0
      ) {
        return createErrorResponse(
          "Missing required field: opponentName",
          422,
          "validation_error",
        );
      }
      const report = await createScoutingReport(teamId, userId, body);
      return createSuccessResponse({ report });
    }

    // PUT /reports/:id - Update report
    if (method === "PUT" && path.match(/^\/reports\/[\w-]+$/)) {
      const reportId = path.split("/")[2];
      const parsed = parseJsonBody();
      if (!parsed.ok) {
        return createErrorResponse(
          parsed.error || "Invalid JSON in request body",
          parsed.code === "invalid_json" ? 400 : 422,
          parsed.code === "invalid_json" ? "invalid_json" : "validation_error",
        );
      }
      const body = parsed.body;
      const report = await updateScoutingReport(reportId, teamId, body);
      return createSuccessResponse({ report });
    }

    // DELETE /reports/:id - Delete report
    if (method === "DELETE" && path.match(/^\/reports\/[\w-]+$/)) {
      const reportId = path.split("/")[2];
      await deleteScoutingReport(reportId, teamId);
      return createSuccessResponse({ success: true });
    }

    // GET /opponents - Get opponent database
    if (method === "GET" && path === "/opponents") {
      const opponents = await getOpponents(teamId);
      return createSuccessResponse({ opponents });
    }

    // POST /opponents - Add opponent
    if (method === "POST" && path === "/opponents") {
      const parsed = parseJsonBody();
      if (!parsed.ok) {
        return createErrorResponse(
          parsed.error || "Invalid JSON in request body",
          parsed.code === "invalid_json" ? 400 : 422,
          parsed.code === "invalid_json" ? "invalid_json" : "validation_error",
        );
      }
      const body = parsed.body;
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return createErrorResponse(
          "Missing required field: name",
          422,
          "validation_error",
        );
      }
      const opponent = await addOpponent(teamId, body);
      return createSuccessResponse({ opponent });
    }

    // GET /tendencies/:opponent - Analyze opponent tendencies
    if (method === "GET" && path.match(/^\/tendencies\/.+$/)) {
      const opponentName = decodeURIComponent(path.split("/")[2]);
      const tendencies = await analyzeTendencies(teamId, opponentName);
      return createSuccessResponse({ tendencies });
    }

    // POST /reports/:id/share - Share report to team chat
    if (method === "POST" && path.match(/^\/reports\/[\w-]+\/share$/)) {
      const reportId = path.split("/")[2];
      await shareReportToChat(reportId, teamId, userId);
      return createSuccessResponse({
        success: true,
        message: "Report shared to team chat",
      });
    }

      return createErrorResponse("Endpoint not found", 404, ErrorType.NOT_FOUND);
    } catch (error) {
      if (error?.isValidation) {
        return createErrorResponse(
          error.message || "Validation failed",
          422,
          "validation_error",
        );
      }
      throw error;
    }
}

const handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    return baseHandler(event, context, {
      functionName: "scouting",
      allowedMethods: ["GET"],
      rateLimitType: "READ",
      requireAuth: true,
      handler: handleRequest,
    });
  }

  return baseHandler(event, context, {
    functionName: "scouting",
    allowedMethods: ["POST", "PUT", "DELETE"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: handleRequest,
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
