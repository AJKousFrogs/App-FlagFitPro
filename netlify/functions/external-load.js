import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: External Load Metrics
// Endpoint: /api/external-load
//
// GET ?athleteId= → external-load rows for the caller, OR for a teammate when the
//   RLS-scoped client lets the viewer through (same-team staff in a load role +
//   the athlete's share_training_notes_with_coach consent). Defaults to self.
// POST → log the caller's own external-load session.
//
// Access is enforced by RLS (external_load_metrics policies + can_staff_read_athlete)
// through the request-scoped `supabase` client, so this endpoint holds no role
// logic of its own — a viewer who isn't permitted simply gets no rows.

const NUM = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);
const INT = (v) =>
  v === null || v === undefined || v === "" ? null : Math.trunc(Number(v));

function toApi(r) {
  return {
    id: r.id,
    sessionDate: r.session_date,
    source: r.source,
    deviceName: r.device_name,
    totalDistanceM: r.total_distance_m,
    highSpeedDistanceM: r.high_speed_distance_m,
    sprintDistanceM: r.sprint_distance_m,
    playerLoad: r.player_load,
    accelerations: r.accelerations,
    decelerations: r.decelerations,
    maxVelocityKmh: r.max_velocity_kmh,
    avgHeartRate: r.avg_heart_rate,
    maxHeartRate: r.max_heart_rate,
    durationMinutes: r.duration_minutes,
    trainingSessionId: r.training_session_id,
    notes: r.notes,
  };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "external-load",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      try {
        if (evt.httpMethod === "GET") {
          const athleteId = evt.queryStringParameters?.athleteId || userId;
          const { data, error } = await supabase
            .from("external_load_metrics")
            .select("*")
            .eq("user_id", athleteId)
            .order("session_date", { ascending: false })
            .limit(90);
          if (error) {
            throw error;
          }
          return createSuccessResponse({ metrics: (data ?? []).map(toApi) });
        }

        let body;
        try {
          body = parseJsonObjectBody(evt.body);
        } catch (_e) {
          return createErrorResponse(
            "Request body must be a JSON object",
            422,
            "validation_error",
          );
        }
        const sessionDate = body.sessionDate ?? body.session_date;
        if (!sessionDate) {
          return createErrorResponse(
            "sessionDate is required",
            422,
            "validation_error",
          );
        }
        const row = {
          user_id: userId,
          session_date: sessionDate,
          source:
            typeof body.source === "string"
              ? body.source.slice(0, 40)
              : "manual",
          device_name: body.deviceName
            ? String(body.deviceName).slice(0, 80)
            : null,
          total_distance_m: NUM(body.totalDistanceM),
          high_speed_distance_m: NUM(body.highSpeedDistanceM),
          sprint_distance_m: NUM(body.sprintDistanceM),
          player_load: NUM(body.playerLoad),
          accelerations: INT(body.accelerations),
          decelerations: INT(body.decelerations),
          max_velocity_kmh: NUM(body.maxVelocityKmh),
          avg_heart_rate: INT(body.avgHeartRate),
          max_heart_rate: INT(body.maxHeartRate),
          duration_minutes: INT(body.durationMinutes),
          training_session_id: body.trainingSessionId ?? null,
          notes: body.notes ? String(body.notes).slice(0, 500) : null,
        };
        const { data, error } = await supabase
          .from("external_load_metrics")
          .insert(row)
          .select()
          .single();
        if (error) {
          throw error;
        }
        return createSuccessResponse(toApi(data), 201, "External load logged");
      } catch (_error) {
        return createErrorResponse(
          "Failed to process external load",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
