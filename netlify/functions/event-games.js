import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { isStaffOfTeam, isActiveTeamMember } from "./utils/team-scope.js";

// Netlify Function: Event Games (V2.0 Tournament Mode)
// Endpoint: /api/event-games
//
// Per-game kickoff times for a competition_event (tournament day). The coach
// bulk-enters kickoff times once ("11:00, 12:30, 15:30, 17:00"); every
// rostered athlete's client (tournament-plan.service.ts) turns that into a
// gap-classified warm-up/fueling timeline. Reads are any active team member;
// writes require team staff (RLS also enforces this — checked here too so a
// bad write fails fast with a clear 403 instead of a silent empty result from
// the service-role client bypassing RLS).

const BRACKET_STAGES = new Set([
  "group",
  "pool",
  "quarterfinal",
  "semifinal",
  "final",
  "placement",
  "friendly",
]);
const STATUSES = new Set(["scheduled", "in_progress", "final", "cancelled"]);

const validationError = (message) => {
  const error = new Error(message);
  error.isValidation = true;
  return error;
};

function parseTime(value, field) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw validationError(`${field} must be HH:MM (24h, venue-local)`);
  }
  return value.length === 5 ? `${value}:00` : value;
}

function parseDate(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw validationError(`${field} must be YYYY-MM-DD`);
  }
  return value;
}

function str(value, field, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const s = String(value).trim();
  if (s.length === 0) {
    return null;
  }
  if (s.length > max) {
    throw validationError(`${field} must be ${max} characters or less`);
  }
  return s;
}

// Build one event_games row from an incoming payload. `partial` allows PATCH
// to send a subset of fields (only provided keys are returned).
function buildRow(body, { partial }) {
  const row = {};
  const has = (k) => Object.hasOwn(body, k);

  if (!partial || has("gameNumber") || has("game_number")) {
    const raw = body.gameNumber ?? body.game_number;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      throw validationError("gameNumber must be between 1 and 20");
    }
    row.game_number = n;
  }
  if (!partial || has("gameDate") || has("game_date")) {
    row.game_date = parseDate(body.gameDate ?? body.game_date, "gameDate");
  }
  if (!partial || has("kickoffTime") || has("kickoff_time")) {
    row.kickoff_time = parseTime(
      body.kickoffTime ?? body.kickoff_time,
      "kickoffTime",
    );
  }
  if (
    !partial ||
    has("expectedDurationMinutes") ||
    has("expected_duration_minutes")
  ) {
    const raw =
      body.expectedDurationMinutes ?? body.expected_duration_minutes ?? 40;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 10 || n > 120) {
      throw validationError(
        "expectedDurationMinutes must be between 10 and 120",
      );
    }
    row.expected_duration_minutes = n;
  }
  if (!partial || has("opponent")) {
    row.opponent = str(body.opponent, "opponent", 160);
  }
  if (!partial || has("field")) {
    row.field = str(body.field, "field", 60);
  }
  if (!partial || has("bracketStage") || has("bracket_stage")) {
    const raw = body.bracketStage ?? body.bracket_stage;
    if (raw === undefined || raw === null || raw === "") {
      row.bracket_stage = null;
    } else {
      const stage = String(raw);
      if (!BRACKET_STAGES.has(stage)) {
        throw validationError(
          "bracketStage must be group, pool, quarterfinal, semifinal, final, placement, or friendly",
        );
      }
      row.bracket_stage = stage;
    }
  }
  if (!partial || has("isProvisional") || has("is_provisional")) {
    row.is_provisional = Boolean(
      body.isProvisional ?? body.is_provisional ?? false,
    );
  }
  if (!partial || has("status")) {
    const status = (body.status ?? "scheduled").toString();
    if (!STATUSES.has(status)) {
      throw validationError(
        "status must be scheduled, in_progress, final, or cancelled",
      );
    }
    row.status = status;
  }
  if (!partial || has("result")) {
    row.result = body.result ?? null;
  }
  return row;
}

function toApi(r) {
  return {
    id: r.id,
    competitionEventId: r.competition_event_id,
    teamId: r.team_id,
    gameNumber: r.game_number,
    gameDate: r.game_date,
    kickoffTime: r.kickoff_time,
    expectedDurationMinutes: r.expected_duration_minutes,
    opponent: r.opponent,
    field: r.field,
    bracketStage: r.bracket_stage,
    isProvisional: r.is_provisional,
    status: r.status,
    result: r.result,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function requireEventAccess(userId, competitionEventId, { staff }) {
  const { data: ev, error } = await supabaseAdmin
    .from("competition_events")
    .select("id, team_id")
    .eq("id", competitionEventId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!ev) {
    throw validationError("competitionEventId not found");
  }
  const ok = staff
    ? await isStaffOfTeam(userId, ev.team_id)
    : await isActiveTeamMember(userId, ev.team_id);
  if (!ok) {
    const denied = new Error(
      staff
        ? "Not authorized to edit this event's games"
        : "Not a member of this event's team",
    );
    denied.isAuthorization = true;
    throw denied;
  }
  return ev;
}

async function listGames(userId, competitionEventId) {
  await requireEventAccess(userId, competitionEventId, { staff: false });
  const { data, error } = await supabaseAdmin
    .from("event_games")
    .select("*")
    .eq("competition_event_id", competitionEventId)
    .order("game_number", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map(toApi);
}

async function createGame(userId, competitionEventId, body) {
  await requireEventAccess(userId, competitionEventId, { staff: true });
  const row = buildRow(body, { partial: false });
  row.competition_event_id = competitionEventId;
  row.created_by = userId;
  const { data, error } = await supabaseAdmin
    .from("event_games")
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return toApi(data);
}

// Bulk replace: the coach's real workflow is "paste 11:00, 12:30, 15:30,
// 17:00" — one call that (re)writes the whole day's kickoff list rather than
// four separate creates. Existing games for the event are deleted and
// replaced; game_number is assigned by array order.
async function bulkSetGames(userId, competitionEventId, body) {
  const ev = await requireEventAccess(userId, competitionEventId, {
    staff: true,
  });
  const games = Array.isArray(body.games) ? body.games : [];
  if (games.length === 0) {
    throw validationError("games must be a non-empty array");
  }
  if (games.length > 20) {
    throw validationError("games must be 20 or fewer");
  }

  const rows = games.map((g, i) => {
    const row = buildRow(
      { ...g, gameNumber: g.gameNumber ?? g.game_number ?? i + 1 },
      { partial: false },
    );
    row.competition_event_id = competitionEventId;
    row.team_id = ev.team_id;
    row.created_by = userId;
    return row;
  });

  const { error: delErr } = await supabaseAdmin
    .from("event_games")
    .delete()
    .eq("competition_event_id", competitionEventId);
  if (delErr) {
    throw delErr;
  }

  const { data, error } = await supabaseAdmin
    .from("event_games")
    .insert(rows)
    .select();
  if (error) {
    throw error;
  }
  return (data ?? []).sort((a, b) => a.game_number - b.game_number).map(toApi);
}

async function updateGame(userId, id, body) {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("event_games")
    .select("id, team_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) {
    throw fetchErr;
  }
  if (!existing) {
    return null;
  }
  const ok = await isStaffOfTeam(userId, existing.team_id);
  if (!ok) {
    const denied = new Error("Not authorized to edit this game");
    denied.isAuthorization = true;
    throw denied;
  }
  const row = buildRow(body, { partial: true });
  if (Object.keys(row).length === 0) {
    throw validationError("no fields to update");
  }
  const { data, error } = await supabaseAdmin
    .from("event_games")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return toApi(data);
}

async function deleteGame(userId, id) {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("event_games")
    .select("id, team_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) {
    throw fetchErr;
  }
  if (!existing) {
    return false;
  }
  const ok = await isStaffOfTeam(userId, existing.team_id);
  if (!ok) {
    const denied = new Error("Not authorized to delete this game");
    denied.isAuthorization = true;
    throw denied;
  }
  const { error } = await supabaseAdmin
    .from("event_games")
    .delete()
    .eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}

// Pull a trailing "/<id>" or "/bulk" off the request path — mirrors
// athlete-events.js's idFromPath (Netlify's rewrite means event.path can be
// either the original "/api/event-games/..." or the function path).
function segmentFromPath(event) {
  const path = event.path || event.rawUrl || "";
  const m = path.match(/event-games\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "event-games",
    allowedMethods: ["GET", "POST", "PATCH", "DELETE"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      try {
        const method = event.httpMethod;
        const segment = segmentFromPath(event);

        if (method === "GET") {
          const competitionEventId =
            event.queryStringParameters?.competitionEventId;
          if (!competitionEventId) {
            return createErrorResponse(
              "competitionEventId query param is required",
              400,
              "missing_param",
            );
          }
          const games = await listGames(userId, competitionEventId);
          return createSuccessResponse({ games });
        }

        if (method === "DELETE") {
          const id = segment || event.queryStringParameters?.id;
          if (!id) {
            return createErrorResponse(
              "game id is required",
              400,
              "missing_id",
            );
          }
          const ok = await deleteGame(userId, id);
          if (!ok) {
            return createErrorResponse("Game not found", 404, "not_found");
          }
          return createSuccessResponse({ id, deleted: true });
        }

        let body;
        try {
          body = parseJsonObjectBody(event.body);
        } catch (_e) {
          return createErrorResponse(
            "Request body must be a JSON object",
            422,
            "validation_error",
          );
        }

        if (method === "POST" && segment === "bulk") {
          const competitionEventId =
            body.competitionEventId ?? body.competition_event_id;
          if (!competitionEventId) {
            return createErrorResponse(
              "competitionEventId is required",
              400,
              "missing_param",
            );
          }
          const games = await bulkSetGames(userId, competitionEventId, body);
          return createSuccessResponse({ games }, 200, "Game schedule saved");
        }

        if (method === "POST") {
          const competitionEventId =
            body.competitionEventId ?? body.competition_event_id;
          if (!competitionEventId) {
            return createErrorResponse(
              "competitionEventId is required",
              400,
              "missing_param",
            );
          }
          const created = await createGame(userId, competitionEventId, body);
          return createSuccessResponse(created, 201, "Game added");
        }

        // PATCH — update
        const id = segment || body.id;
        if (!id) {
          return createErrorResponse("game id is required", 400, "missing_id");
        }
        const updated = await updateGame(userId, id, body);
        if (!updated) {
          return createErrorResponse("Game not found", 404, "not_found");
        }
        return createSuccessResponse(updated, 200, "Game updated");
      } catch (error) {
        if (error?.isValidation) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        if (error?.isAuthorization) {
          return createErrorResponse(error.message, 403, "forbidden");
        }
        return createErrorResponse(
          "Failed to process event-games request",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
