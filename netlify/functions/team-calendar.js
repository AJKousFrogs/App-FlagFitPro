import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
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

function isoDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

function toRsvpStatus(status) {
  if (status === "present") {return "going";}
  if (status === "absent") {return "not-going";}
  if (status === "excused") {return "maybe";}
  return "pending";
}

function toAttendanceStatus(status) {
  if (status === "going") {return "present";}
  if (status === "not-going") {return "absent";}
  if (status === "maybe") {return "excused";}
  return "pending";
}

function getSubPath(path) {
  const marker = "/api/team-calendar";
  const index = path?.indexOf(marker);
  if (index === -1) {
    return "";
  }
  return path.slice(index + marker.length) || "";
}

function buildSyncUrl(event) {
  const host = event.headers?.host || event.headers?.Host || "app.example.com";
  const scheme =
    event.headers?.["x-forwarded-proto"] ||
    event.headers?.["X-Forwarded-Proto"] ||
    "https";
  const webcalScheme = scheme === "https" ? "webcal" : "http";
  return `${webcalScheme}://${host}/api/team-calendar.ics`;
}

async function loadAttendanceMap(supabase, teamId) {
  const records = await supabase
    .from("attendance_records")
    .select("event_id, player_id, status, needs_ride")
    .eq("team_id", teamId);

  if (records.error) {
    if (isOptionalSchemaError(records.error)) {
      return [];
    }
    throw records.error;
  }

  return records.data || [];
}

function mapAttendanceForEvent(records, eventId, userId) {
  const eventRecords = records.filter((record) => record.event_id === eventId);
  const myRecord = eventRecords.find((record) => record.player_id === userId);
  return {
    myRsvp: toRsvpStatus(myRecord?.status),
    needsRide: myRecord?.needs_ride === true,
    rsvpStats: {
      going: eventRecords.filter((record) => record.status === "present").length,
      notGoing: eventRecords.filter((record) => record.status === "absent").length,
      maybe: eventRecords.filter((record) => record.status === "excused").length,
      pending: eventRecords.filter((record) => record.status === "pending").length,
    },
  };
}

async function listCalendarEvents(supabase, teamId, userId) {
  const [attendanceRecords, gamesResult, plansResult, teamEventsResult] =
    await Promise.all([
      loadAttendanceMap(supabase, teamId),
      supabase
        .from("games")
        .select("id, game_id, opponent_team_name, game_date, game_time, location")
        .eq("team_id", teamId)
        .gte("game_date", new Date().toISOString().split("T")[0])
        .order("game_date", { ascending: true })
        .limit(30),
      supabase
        .from("practice_plans")
        .select("id, title, practice_date, start_time, end_time, location, focus")
        .eq("team_id", teamId)
        .gte("practice_date", new Date().toISOString().split("T")[0])
        .order("practice_date", { ascending: true })
        .limit(30),
      supabase
        .from("team_events")
        .select("id, title, event_type, start_time, end_time, location, description")
        .eq("team_id", teamId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(30),
    ]);

  if (gamesResult.error) {
    throw gamesResult.error;
  }
  if (plansResult.error) {
    throw plansResult.error;
  }
  if (teamEventsResult.error && !isOptionalSchemaError(teamEventsResult.error)) {
    throw teamEventsResult.error;
  }

  const events = [];

  for (const game of gamesResult.data || []) {
    const eventId = `game:${game.game_id || game.id}`;
    const attendance = mapAttendanceForEvent(attendanceRecords, eventId, userId);
    events.push({
      id: eventId,
      title: game.opponent_team_name
        ? `Game vs ${game.opponent_team_name}`
        : "Game",
      type: "game",
      date: game.game_date,
      startTime: game.game_time || "",
      endTime: "",
      location: game.location || "",
      description: "",
      guestsAllowed: false,
      ...attendance,
    });
  }

  for (const plan of plansResult.data || []) {
    const eventId = `practice:${plan.id}`;
    const attendance = mapAttendanceForEvent(attendanceRecords, eventId, userId);
    events.push({
      id: eventId,
      title: plan.title || "Team Practice",
      type: "practice",
      date: plan.practice_date,
      startTime: plan.start_time || "",
      endTime: plan.end_time || "",
      location: plan.location || "",
      description: plan.focus || "",
      guestsAllowed: false,
      ...attendance,
    });
  }

  for (const teamEvent of teamEventsResult.data || []) {
    const startDate = isoDate(teamEvent.start_time);
    const attendance = mapAttendanceForEvent(
      attendanceRecords,
      `event:${teamEvent.id}`,
      userId,
    );
    events.push({
      id: `event:${teamEvent.id}`,
      title: teamEvent.title,
      type:
        teamEvent.event_type === "team_event"
          ? "team-event"
          : teamEvent.event_type || "meeting",
      date: startDate || "",
      startTime: teamEvent.start_time?.split("T")[1]?.slice(0, 5) || "",
      endTime: teamEvent.end_time?.split("T")[1]?.slice(0, 5) || "",
      location: teamEvent.location || "",
      description: teamEvent.description || "",
      guestsAllowed: false,
      ...attendance,
    });
  }

  return events.sort((left, right) => {
    const leftStamp = `${left.date}T${left.startTime || "00:00"}`;
    const rightStamp = `${right.date}T${right.startTime || "00:00"}`;
    return leftStamp.localeCompare(rightStamp);
  });
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "team-calendar",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const teamId = await getUserTeamId(userId);
      const subPath = getSubPath(evt.path || "");

      try {
        if (evt.httpMethod === "GET" && (subPath === "" || subPath === "/")) {
          const events = await listCalendarEvents(supabase, teamId, userId);
          return createSuccessResponse({ events });
        }

        if (evt.httpMethod === "GET" && subPath === "/sync-url") {
          return createSuccessResponse({ url: buildSyncUrl(evt) });
        }

        if (evt.httpMethod === "POST" && subPath === "/rsvp") {
          const body = parseJsonObjectBody(evt.body);
          if (!body.eventId || typeof body.eventId !== "string") {
            return createErrorResponse(
              "eventId is required",
              422,
              "validation_error",
            );
          }

          const payload = {
            event_id: body.eventId,
            team_id: teamId,
            player_id: userId,
            status: toAttendanceStatus(body.status),
            guests: Number(body.guests) || 0,
            needs_ride: body.needsRide === true,
            can_provide_ride: body.canProvideRide === true,
            notes: typeof body.notes === "string" ? body.notes : null,
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from("attendance_records")
            .upsert(payload, {
              onConflict: "event_id,player_id",
            });

          if (error) {
            throw error;
          }

          return createSuccessResponse({ ok: true });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        console.error("[team-calendar] Request failed:", error);
        return createErrorResponse(
          error?.message || "Failed to process team calendar request",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
