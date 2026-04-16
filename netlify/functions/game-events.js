import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { getUserTeamId } from "./utils/auth-helper.js";

function getSubPath(path) {
  const marker = "/api/game-events";
  const index = path?.indexOf(marker);
  if (index === -1) {
    return "";
  }
  return path.slice(index + marker.length) || "";
}

async function loadGame(supabase, gameId) {
  if (!gameId) {
    return { data: null, error: new Error("gameId is required") };
  }

  let result = await supabase.from("games").select("*").eq("game_id", gameId).maybeSingle();
  if (!result.error && result.data) {
    return result;
  }

  return supabase.from("games").select("*").eq("id", gameId).maybeSingle();
}

function normalizePlay(payload, userId) {
  return {
    game_id: payload.gameId,
    play_number: Number(payload.playNumber) || null,
    timestamp:
      payload.timestamp instanceof Date
        ? payload.timestamp.toISOString()
        : payload.timestamp || new Date().toISOString(),
    quarter: Number(payload.half) || 1,
    play_type: payload.playType || null,
    play_category: payload.outcome || null,
    primary_player_id:
      payload.playerId ||
      payload.ballCarrierId ||
      payload.quarterbackId ||
      payload.receiverId ||
      payload.defenderId ||
      payload.interceptorId ||
      payload.deflectedBy ||
      userId,
    yards_gained:
      Number(payload.yardsGained ?? payload.yards ?? 0) || 0,
    play_notes:
      typeof payload.playNotes === "string"
        ? payload.playNotes
        : typeof payload.notes === "string"
          ? payload.notes
          : null,
  };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "game-events",
    allowedMethods: ["POST", "DELETE"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const teamId = await getUserTeamId(userId);
      const subPath = getSubPath(evt.path || "");

      try {
        if (evt.httpMethod === "POST" && (subPath === "" || subPath === "/")) {
          const body = parseJsonObjectBody(evt.body);
          const game = await loadGame(supabase, body.gameId);
          if (game.error || !game.data) {
            return createErrorResponse("Game not found", 404, "not_found");
          }
          if (game.data.team_id !== teamId && game.data.team_id !== `TEAM_${userId}`) {
            return createErrorResponse("Not authorized", 403, "authorization_error");
          }

          // Optimistic-locking: if the client supplied expectedVersion, atomically
          // increment the game's version counter only when it matches. A zero-row
          // result means someone else already recorded a play after the client last
          // loaded the game → 409 Conflict so the client can reload and retry.
          let newGameVersion = null;
          if (typeof body.expectedVersion === "number") {
            const { data: versionRow, error: versionError } = await supabase
              .from("games")
              .update({ version: body.expectedVersion + 1, updated_at: new Date().toISOString() })
              .eq("game_id", game.data.game_id)
              .eq("version", body.expectedVersion)
              .select("version")
              .maybeSingle();

            if (versionError) {
              throw versionError;
            }

            if (!versionRow) {
              return createErrorResponse(
                "Game was updated by another user. Reload the game to see the latest plays before adding yours.",
                409,
                "version_conflict",
              );
            }

            newGameVersion = versionRow.version;
          }

          const { data, error } = await supabase
            .from("game_events")
            .insert(normalizePlay(body, userId))
            .select()
            .single();

          if (error) {
            throw error;
          }

          return createSuccessResponse(
            { ...data, gameVersion: newGameVersion ?? game.data.version },
            201,
          );
        }

        if (evt.httpMethod === "POST" && subPath === "/mark-presence") {
          const body = parseJsonObjectBody(evt.body);
          const game = await loadGame(supabase, body.gameId);
          if (game.error || !game.data) {
            return createErrorResponse("Game not found", 404, "not_found");
          }
          if (game.data.team_id !== teamId && game.data.team_id !== `TEAM_${userId}`) {
            return createErrorResponse("Not authorized", 403, "authorization_error");
          }

          const existing = await supabase
            .from("game_participations")
            .select("id")
            .eq("game_id", body.gameId)
            .eq("player_id", body.playerId)
            .maybeSingle();

          const payload = {
            game_id: body.gameId,
            team_id: game.data.team_id,
            player_id: body.playerId,
            status: body.present === false ? "absent" : "present",
            updated_at: new Date().toISOString(),
          };

          const mutation = existing.data
            ? supabase.from("game_participations").update(payload).eq("id", existing.data.id)
            : supabase.from("game_participations").insert(payload);
          const { error } = await mutation;

          if (error) {
            throw error;
          }

          return createSuccessResponse({ ok: true });
        }

        if (evt.httpMethod === "DELETE" && /^\/[^/]+$/.test(subPath)) {
          const eventId = subPath.slice(1);
          const record = await supabase
            .from("game_events")
            .select("id, game_id")
            .eq("id", eventId)
            .maybeSingle();

          if (record.error || !record.data) {
            return createErrorResponse("Play not found", 404, "not_found");
          }

          const game = await loadGame(supabase, record.data.game_id);
          if (game.error || !game.data) {
            return createErrorResponse("Game not found", 404, "not_found");
          }
          if (game.data.team_id !== teamId && game.data.team_id !== `TEAM_${userId}`) {
            return createErrorResponse("Not authorized", 403, "authorization_error");
          }

          const { error } = await supabase
            .from("game_events")
            .delete()
            .eq("id", eventId);

          if (error) {
            throw error;
          }

          return createSuccessResponse({ ok: true });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        console.error("[game-events] Request failed:", error);
        return createErrorResponse(
          error?.message || "Failed to process game event request",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
