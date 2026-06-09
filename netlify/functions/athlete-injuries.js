import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

// Netlify Function: Athlete Injuries / Self-reported tightness
// Endpoint: /api/athlete-injuries
//
// GET  → active injuries + self-reported tightness for the athlete (region,
//        severity, activity_restrictions, expiry). The periodization engine
//        reads this to apply injury precedence (down-regulate region-specific
//        sprint/high-intensity work).
// POST → record a self-reported tightness ("my achilles is tight"). Persists to
//        athlete_injuries (the canonical store) with injury_mechanism='self_report'.
//        Write success/failure is surfaced — a swallowed failure here is a P0.

const SEVERITIES = new Set(["minor", "moderate", "severe"]);

// Region → restricted activities + how long a self-report stays active.
// Lower-limb regions gate sprint/plyometric/agility work; this is the data the
// engine keys on (it checks activity_restrictions, never re-derives from region).
const LOWER_LIMB = new Set([
  "achilles",
  "gastrocnemius",
  "calf",
  "hamstring",
  "quad",
  "quadriceps",
  "knee",
  "ankle",
  "hip",
  "groin",
  "shin",
  "foot",
  "glute",
]);

const SEVERITY_DAYS = { minor: 2, moderate: 4, severe: 7 };

function restrictionsFor(region, severity) {
  const r = String(region || "").toLowerCase();
  const out = [];
  if ([...LOWER_LIMB].some((k) => r.includes(k))) {
    out.push("sprint", "plyometric", "agility", "high_intensity");
    if (severity !== "minor") out.push("strength");
  } else {
    // upper-body / other: spare sprints, restrict loaded upper work
    out.push("upper_strength", "throwing");
  }
  return out;
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

function toApi(r) {
  return {
    id: r.id,
    injuryType: r.injury_type,
    region: r.injury_location,
    severity: r.injury_grade,
    status: r.recovery_status,
    source: r.injury_mechanism,
    restrictions: r.activity_restrictions ?? [],
    startDate: r.injury_date,
    expectedReturnDate: r.expected_return_date,
    note: r.medical_notes,
  };
}

async function listActive(userId) {
  const today = isoDay(new Date());
  const { data, error } = await supabaseAdmin
    .from("athlete_injuries")
    .select(
      "id, injury_type, injury_location, injury_grade, recovery_status, injury_mechanism, activity_restrictions, injury_date, expected_return_date, medical_notes",
    )
    .eq("user_id", userId)
    .in("recovery_status", ["active", "recovering", "rehab"])
    .order("injury_date", { ascending: false });
  if (error) throw error;
  // Drop self-reports whose auto-expiry has passed (clinical injuries have no expiry).
  const rows = (data ?? []).filter(
    (r) =>
      r.injury_mechanism !== "self_report" ||
      !r.expected_return_date ||
      r.expected_return_date >= today,
  );
  return rows.map(toApi);
}

async function recordSelfReport(userId, body) {
  const region = String(body.region ?? body.location ?? "").trim().toLowerCase();
  if (!region || region.length > 60) {
    return { validation: "region is required (e.g. 'achilles')" };
  }
  const severity = SEVERITIES.has(body.severity) ? body.severity : "minor";
  const note =
    body.note != null ? String(body.note).slice(0, 500) : null;

  const today = new Date();
  const expiry = new Date(today.getTime() + SEVERITY_DAYS[severity] * 86_400_000);

  // One active self-report per region: resolve any prior active self-report for
  // the same region so restrictions don't stack.
  const { error: clearErr } = await supabaseAdmin
    .from("athlete_injuries")
    .update({ recovery_status: "resolved", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("injury_mechanism", "self_report")
    .eq("injury_location", region)
    .eq("recovery_status", "active");
  if (clearErr) throw clearErr;

  const row = {
    user_id: userId,
    injury_type: "Self-reported tightness",
    injury_location: region,
    injury_grade: severity,
    injury_mechanism: "self_report",
    recovery_status: "active",
    injury_date: isoDay(today),
    expected_return_date: isoDay(expiry),
    activity_restrictions: restrictionsFor(region, severity),
    medical_notes: note,
  };
  const { data, error } = await supabaseAdmin
    .from("athlete_injuries")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return { created: toApi(data) };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "athlete-injuries",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      try {
        if (evt.httpMethod === "GET") {
          return createSuccessResponse({ injuries: await listActive(userId) });
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
        const result = await recordSelfReport(userId, body);
        if (result.validation) {
          return createErrorResponse(result.validation, 422, "validation_error");
        }
        return createSuccessResponse(result.created, 201, "Tightness logged");
      } catch (error) {
        // Surface the failure — a swallowed self-report write is a P0.
        return createErrorResponse(
          "Failed to process injury self-report",
          500,
          "internal_error",
        );
      }
    },
  });
};

export { handler };
