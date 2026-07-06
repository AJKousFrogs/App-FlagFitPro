import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Athlete Events (personal schedule)
// Endpoint: /api/athlete-events
//
// Athlete-owned events (personal / domestic league / national-team camps &
// tournaments & gamedays). Entered by the athlete and merged into the schedule
// snapshot (/api/schedule) so the periodization engine tapers before and
// recovers after them. CRUD, scoped to the authenticated user.

const CATEGORIES = new Set(["personal", "domestic", "national"]);
const KINDS = new Set([
  "gameday",
  "tournament",
  "camp",
  "friendly",
  "training",
  "other",
]);
const IMPORTANCE = new Set(["regular", "high", "peak"]);
const STATUSES = new Set([
  "scheduled",
  "live",
  "completed",
  "cancelled",
  "postponed",
]);

const validationError = (message) => {
  const error = new Error(message);
  error.isValidation = true;
  return error;
};

function parseIso(value, field, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw validationError(`${field} is required`);
    }
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw validationError(`${field} must be a valid date/time`);
  }
  return d.toISOString();
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

// Build the DB row from an incoming payload. `partial` allows PUT to send a
// subset of fields (only provided keys are returned).
function buildRow(body, { partial }) {
  const row = {};
  const has = (k) => Object.hasOwn(body, k);

  if (!partial || has("title")) {
    const title = str(body.title, "title", 160);
    if (!title) {
      throw validationError("title is required");
    }
    row.title = title;
  }
  if (!partial || has("category")) {
    const category = (body.category ?? "personal").toString();
    if (!CATEGORIES.has(category)) {
      throw validationError("category must be personal, domestic, or national");
    }
    row.category = category;
  }
  if (!partial || has("kind")) {
    const kind = (body.kind ?? "gameday").toString();
    if (!KINDS.has(kind)) {
      throw validationError(
        "kind must be gameday, tournament, camp, friendly, or other",
      );
    }
    row.kind = kind;
  }
  if (!partial || has("startsAt") || has("starts_at")) {
    row.starts_at = parseIso(body.startsAt ?? body.starts_at, "startsAt", {
      required: true,
    });
  }
  if (!partial || has("endsAt") || has("ends_at")) {
    row.ends_at = parseIso(body.endsAt ?? body.ends_at, "endsAt", {
      required: false,
    });
  }
  if (!partial || has("expectedGameCount") || has("expected_game_count")) {
    const raw = body.expectedGameCount ?? body.expected_game_count ?? 1;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 50) {
      throw validationError("expectedGameCount must be between 0 and 50");
    }
    row.expected_game_count = n;
  }
  if (!partial || has("importance")) {
    const importance = (body.importance ?? "regular").toString();
    if (!IMPORTANCE.has(importance)) {
      throw validationError("importance must be regular, high, or peak");
    }
    row.importance = importance;
  }
  if (!partial || has("location")) {
    row.location = str(body.location, "location", 200);
  }
  if (!partial || has("venue")) {
    row.venue = str(body.venue, "venue", 200);
  }
  if (!partial || has("notes")) {
    row.notes = str(body.notes, "notes", 2000);
  }
  if (!partial || has("status")) {
    const status = (body.status ?? "scheduled").toString();
    if (!STATUSES.has(status)) {
      throw validationError("status is invalid");
    }
    row.status = status;
  }

  // Cross-field: ends_at must be >= starts_at when both present.
  if (row.starts_at && row.ends_at && row.ends_at < row.starts_at) {
    throw validationError("endsAt must be on or after startsAt");
  }
  return row;
}

function toApi(r) {
  return {
    id: r.id,
    category: r.category,
    kind: r.kind,
    title: r.title,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    expectedGameCount: r.expected_game_count,
    importance: r.importance,
    location: r.location,
    venue: r.venue,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function listEvents(userId, params) {
  let q = supabaseAdmin
    .from("athlete_events")
    .select("*")
    .eq("user_id", userId)
    .order("starts_at", { ascending: true });

  if (params?.from) {
    q = q.gte("starts_at", new Date(params.from).toISOString());
  }
  if (params?.to) {
    q = q.lte("starts_at", new Date(params.to).toISOString());
  }

  const { data, error } = await q;
  if (error) {
    throw error;
  }
  return (data ?? []).map(toApi);
}

async function createEvent(userId, body) {
  const row = buildRow(body, { partial: false });
  row.user_id = userId;
  const { data, error } = await supabaseAdmin
    .from("athlete_events")
    .insert(row)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return toApi(data);
}

async function updateEvent(userId, id, body) {
  const row = buildRow(body, { partial: true });
  if (Object.keys(row).length === 0) {
    throw validationError("no fields to update");
  }
  const { data, error } = await supabaseAdmin
    .from("athlete_events")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return toApi(data);
}

async function deleteEvent(userId, id) {
  const { data, error } = await supabaseAdmin
    .from("athlete_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) {
    throw error;
  }
  return Boolean(data);
}

// Pull a trailing "/<id>" off the request path. Netlify's rewrite means
// event.path can be either the original "/api/athlete-events/<id>" or the
// function path "/.netlify/functions/athlete-events/<id>" — match the segment
// after "athlete-events" in both.
function idFromPath(event) {
  const path = event.path || event.rawUrl || "";
  const m = path.match(/athlete-events\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "athlete-events",
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      try {
        const method = event.httpMethod;

        if (method === "GET") {
          const events = await listEvents(userId, event.queryStringParameters);
          return createSuccessResponse({ events });
        }

        if (method === "DELETE") {
          const id = idFromPath(event) || event.queryStringParameters?.id;
          if (!id) {
            return createErrorResponse(
              "event id is required",
              400,
              "missing_id",
            );
          }
          const ok = await deleteEvent(userId, id);
          if (!ok) {
            return createErrorResponse("Event not found", 404, "not_found");
          }
          return createSuccessResponse({ id, deleted: true });
        }

        // POST / PUT / PATCH all carry a JSON body
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

        if (method === "POST") {
          const created = await createEvent(userId, body);
          return createSuccessResponse(created, 201, "Event added");
        }

        // PUT / PATCH — update
        const id = idFromPath(event) || body.id;
        if (!id) {
          return createErrorResponse("event id is required", 400, "missing_id");
        }
        const updated = await updateEvent(userId, id, body);
        if (!updated) {
          return createErrorResponse("Event not found", 404, "not_found");
        }
        return createSuccessResponse(updated, 200, "Event updated");
      } catch (error) {
        if (error?.isValidation) {
          return createErrorResponse(error.message, 422, "validation_error");
        }
        return createErrorResponse(
          "Failed to process athlete-events request",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
