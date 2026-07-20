import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody, isValidId } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

// Netlify Function: Event Participation
// The post-event "ground truth" for ACWR: did the athlete attend a competition_event,
// and how many of the expected games did they actually play (e.g. 5 of 8 after a
// hamstring tweak). Recording it computes a session-RPE load and writes a competition
// `training_sessions` row so the existing ACWR pipeline includes it automatically.
//
//   GET  /api/event-participation/pending      → recent ended events awaiting confirmation
//   POST /api/event-participation              → record/confirm actuals (self or team staff)
// Endpoint base: /api/event-participation

const logger = createLogger({ service: "netlify.event-participation" });

function parseGamesInt(value, field) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    return { error: `${field} must be an integer between 0 and 100` };
  }
  return { value: n };
}

// Load-equivalent minutes for a competition day (game clock × one/both-ways ×
// bench × surface — see angular competition-load.util). The 0-100 cap this
// replaces was a copy-paste of the games cap and 422'd any day over ~2 games of
// 2×20 (8 games × 40 = 320 already broke it); 600 matches weekend-games' "a full
// tournament day" ceiling.
function parseMinutesInt(value, field) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 600) {
    return { error: `${field} must be an integer between 0 and 600` };
  }
  return { value: n };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "event-participation",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "DEFAULT",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId }) => {
      // ── GET: the athlete's pending post-event prompts ───────────────────────
      if (evt.httpMethod === "GET") {
        const { data, error } = await supabaseAdmin
          .from("v_pending_event_participation")
          .select(
            "competition_event_id, team_id, team_name, competition_name, label, starts_at, ends_at, expected_game_count",
          )
          .eq("user_id", userId)
          .order("starts_at", { ascending: false });

        if (error) {
          logger.error("event_participation_pending_failed", error, {
            request_id: requestId,
            user_id: userId,
          });
          return createErrorResponse(
            "Failed to load pending events",
            500,
            "database_error",
            requestId,
          );
        }
        return createSuccessResponse({ pending: data || [] });
      }

      // ── POST: record/confirm actual participation ───────────────────────────
      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body, { requestId });
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;

      const competitionEventId =
        body.competitionEventId || body.competition_event_id;
      if (!isValidId(competitionEventId)) {
        return createErrorResponse(
          "competitionEventId is required",
          422,
          "validation_error",
          requestId,
        );
      }

      if (typeof body.attended !== "boolean") {
        return createErrorResponse(
          "attended (boolean) is required",
          422,
          "validation_error",
          requestId,
        );
      }

      const games = parseGamesInt(
        body.gamesPlayed ?? body.games_played,
        "gamesPlayed",
      );
      if (games.error) {
        return createErrorResponse(
          games.error,
          422,
          "validation_error",
          requestId,
        );
      }
      const minutes = parseMinutesInt(
        body.totalMinutes ?? body.total_minutes,
        "totalMinutes",
      );
      if (minutes.error) {
        return createErrorResponse(
          minutes.error,
          422,
          "validation_error",
          requestId,
        );
      }

      let avgRpe = body.avgRpe ?? body.avg_rpe ?? null;
      if (avgRpe !== null && avgRpe !== undefined) {
        avgRpe = Number(avgRpe);
        if (!Number.isFinite(avgRpe) || avgRpe < 0 || avgRpe > 10) {
          return createErrorResponse(
            "avgRpe must be a number between 0 and 10",
            422,
            "validation_error",
            requestId,
          );
        }
      } else {
        avgRpe = null;
      }

      // Optional exposure context from the "how it went" card. The load multiplier
      // (one/both-ways × players-on-day × surface) is already folded into
      // totalMinutes client-side (competition-load.util); record_event_participation
      // has no columns for the breakdown, so fold it into the session note for coach
      // transparency (and so the load number isn't unexplained).
      const contextParts = [];
      if (body.playedBothWays === true) contextParts.push("both ways");
      else if (body.playedBothWays === false) contextParts.push("one way");
      const playersPresent = Number(body.playersPresent);
      if (
        Number.isInteger(playersPresent) &&
        playersPresent > 0 &&
        playersPresent <= 100
      ) {
        contextParts.push(`${playersPresent} players`);
      }
      if (body.surface === "grass" || body.surface === "turf") {
        contextParts.push(body.surface);
      }
      const userNote = typeof body.notes === "string" ? body.notes.trim() : "";
      const composedNotes =
        [userNote, contextParts.join(" · ")]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 1000) || null;

      // A coach may record on behalf of an athlete; default to self. The RPC enforces
      // authorization (self / event's team staff / service role).
      const targetUserId =
        body.userId && isValidId(body.userId) ? body.userId : userId;

      const { data, error } = await supabaseAdmin.rpc(
        "record_event_participation",
        {
          p_user_id: targetUserId,
          p_competition_event_id: competitionEventId,
          p_attended: body.attended,
          p_games_played: body.attended ? (games.value ?? 0) : 0,
          p_total_minutes: minutes.value,
          p_avg_rpe: avgRpe,
          p_notes: composedNotes,
        },
      );

      if (error) {
        const status = /not authorized/i.test(error.message) ? 403 : 500;
        logger.error("event_participation_record_failed", error, {
          request_id: requestId,
          user_id: userId,
          target_user_id: targetUserId,
        });
        return createErrorResponse(
          status === 403
            ? "Not authorized to record participation for this athlete"
            : "Failed to record participation",
          status,
          status === 403 ? "authorization_error" : "database_error",
          requestId,
        );
      }

      return createSuccessResponse(
        { participationId: data },
        201,
        "Participation recorded",
      );
    },
  });

export const testHandler = handler;
export { handler };
