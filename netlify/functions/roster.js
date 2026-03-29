import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { getUserTeamId } from "./utils/auth-helper.js";

function isOptionalSchemaError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function getDisplayName(user, fallback = "Unknown Player") {
  const fullName =
    user?.full_name ||
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}

async function getPlayersFromTeamMembers(supabase, teamId) {
  const result = await supabase
    .from("team_members")
    .select(
      `
      user_id,
      position,
      jersey_number,
      users:user_id (
        id,
        full_name,
        first_name,
        last_name,
        name,
        position,
        jersey_number
      )
    `,
    )
    .eq("team_id", teamId)
    .eq("role", "player")
    .eq("status", "active")
    .order("jersey_number", { ascending: true, nullsFirst: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data || []).map((entry) => ({
    id: entry.user_id || entry.users?.id,
    name: getDisplayName(entry.users),
    position: entry.position || entry.users?.position || "",
    jerseyNumber: entry.jersey_number ?? entry.users?.jersey_number ?? null,
  }));
}

async function getPlayersFromTeamPlayers(supabase, teamId) {
  const result = await supabase
    .from("team_players")
    .select("id, user_id, name, position, jersey_number, status")
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("jersey_number", { ascending: true, nullsFirst: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data || []).map((entry) => ({
    id: entry.user_id || entry.id,
    name: entry.name || "Unknown Player",
    position: entry.position || "",
    jerseyNumber: entry.jersey_number ?? null,
  }));
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "roster",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const path = evt.path?.split("/api/roster/")[1] || "";
      if (path !== "players" && path !== "" && path !== "/players") {
        return createErrorResponse("Endpoint not found", 404, "not_found");
      }

      const teamId = await getUserTeamId(userId);
      if (!teamId) {
        return createSuccessResponse([]);
      }

      try {
        let players;
        try {
          players = await getPlayersFromTeamMembers(supabase, teamId);
        } catch (error) {
          if (!isOptionalSchemaError(error)) {
            throw error;
          }
          players = await getPlayersFromTeamPlayers(supabase, teamId);
        }

        return createSuccessResponse(players.filter((player) => !!player.id));
      } catch (error) {
        console.error("[roster] Failed to load players:", error);
        return createErrorResponse(
          "Failed to load roster players",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
