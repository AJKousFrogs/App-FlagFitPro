import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Event Travel (V2.1)
// Endpoint: /api/event-travel
//
// Athlete-declared travel legs, optionally linked to a competition_event
// (team trip). Feeds a proactive travel card client-side — the reactive
// same-day `daily_wellness_checkin.travel_hours` readiness penalty in
// calc-readiness.js is unchanged and stays the safety backstop when no leg
// is declared. Owner-scoped CRUD (mirrors athlete-events.js); optional
// `competitionEventId` link lets a coach's shared team trip surface for
// every athlete who declares it.

const MODES = new Set(["bus", "car", "plane", "train", "other"]);

const validationError = (message) => {
  const error = new Error(message);
  error.isValidation = true;
  return error;
};

function parseIso(value, field, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {throw validationError(`${field} is required`);}
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {throw validationError(`${field} must be a valid date/time`);}
  return d.toISOString();
}

function buildRow(body, { partial }) {
  const row = {};
  const has = (k) => Object.hasOwn(body, k);

  if (!partial || has("mode")) {
    const mode = (body.mode ?? "car").toString();
    if (!MODES.has(mode)) {throw validationError("mode must be bus, car, plane, train, or other");}
    row.mode = mode;
  }
  if (!partial || has("departAt") || has("depart_at")) {
    row.depart_at = parseIso(body.departAt ?? body.depart_at, "departAt", { required: true });
  }
  if (!partial || has("arriveAt") || has("arrive_at")) {
    row.arrive_at = parseIso(body.arriveAt ?? body.arrive_at, "arriveAt", { required: true });
  }
  if (row.depart_at && row.arrive_at && row.arrive_at < row.depart_at) {
    throw validationError("arriveAt must be on or after departAt");
  }
  if (!partial || has("timezoneDeltaHours") || has("timezone_delta_hours")) {
    const raw = body.timezoneDeltaHours ?? body.timezone_delta_hours;
    if (raw === undefined || raw === null || raw === "") {
      row.timezone_delta_hours = null;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || Math.abs(n) > 14) {
        throw validationError("timezoneDeltaHours must be between -14 and 14");
      }
      row.timezone_delta_hours = n;
    }
  }
  if (!partial || has("overnightStay") || has("overnight_stay")) {
    row.overnight_stay = Boolean(body.overnightStay ?? body.overnight_stay ?? false);
  }
  if (!partial || has("notes")) {
    const notes = body.notes;
    row.notes =
      notes === undefined || notes === null || notes === "" ? null : String(notes).trim().slice(0, 500);
  }
  if (!partial || has("competitionEventId") || has("competition_event_id")) {
    row.competition_event_id = body.competitionEventId ?? body.competition_event_id ?? null;
  }
  return row;
}

function toApi(r) {
  return {
    id: r.id,
    competitionEventId: r.competition_event_id,
    teamId: r.team_id,
    mode: r.mode,
    departAt: r.depart_at,
    arriveAt: r.arrive_at,
    timezoneDeltaHours: r.timezone_delta_hours,
    overnightStay: r.overnight_stay,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function listLegs(userId, params) {
  let q = supabaseAdmin
    .from("event_travel")
    .select("*")
    .eq("user_id", userId)
    .order("depart_at", { ascending: true });
  if (params?.from) {q = q.gte("depart_at", new Date(params.from).toISOString());}
  if (params?.to) {q = q.lte("depart_at", new Date(params.to).toISOString());}
  const { data, error } = await q;
  if (error) {throw error;}
  return (data ?? []).map(toApi);
}

async function createLeg(userId, body) {
  const row = buildRow(body, { partial: false });
  row.user_id = userId;
  const { data, error } = await supabaseAdmin
    .from("event_travel")
    .insert(row)
    .select()
    .single();
  if (error) {throw error;}
  return toApi(data);
}

async function updateLeg(userId, id, body) {
  const row = buildRow(body, { partial: true });
  if (Object.keys(row).length === 0) {throw validationError("no fields to update");}
  const { data, error } = await supabaseAdmin
    .from("event_travel")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) {throw error;}
  if (!data) {return null;}
  return toApi(data);
}

async function deleteLeg(userId, id) {
  const { data, error } = await supabaseAdmin
    .from("event_travel")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) {throw error;}
  return Boolean(data);
}

function idFromPath(event) {
  const path = event.path || event.rawUrl || "";
  const m = path.match(/event-travel\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "event-travel",
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      try {
        const method = event.httpMethod;

        if (method === "GET") {
          const legs = await listLegs(userId, event.queryStringParameters);
          return createSuccessResponse({ legs });
        }

        if (method === "DELETE") {
          const id = idFromPath(event) || event.queryStringParameters?.id;
          if (!id) {return createErrorResponse("leg id is required", 400, "missing_id");}
          const ok = await deleteLeg(userId, id);
          if (!ok) {return createErrorResponse("Leg not found", 404, "not_found");}
          return createSuccessResponse({ id, deleted: true });
        }

        let body;
        try {
          body = parseJsonObjectBody(event.body);
        } catch (_e) {
          return createErrorResponse("Request body must be a JSON object", 422, "validation_error");
        }

        if (method === "POST") {
          const created = await createLeg(userId, body);
          return createSuccessResponse(created, 201, "Travel leg added");
        }

        const id = idFromPath(event) || body.id;
        if (!id) {return createErrorResponse("leg id is required", 400, "missing_id");}
        const updated = await updateLeg(userId, id, body);
        if (!updated) {return createErrorResponse("Leg not found", 404, "not_found");}
        return createSuccessResponse(updated, 200, "Travel leg updated");
      } catch (error) {
        if (error?.isValidation) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        return createErrorResponse("Failed to process event-travel request", 500, "internal_error");
      }
    },
  });
};

export const testHandler = handler;
export { handler };
