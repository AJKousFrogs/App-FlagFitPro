import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";

// =============================================================================
// Netlify Function: Cycle module (v3 M3) — SPECIAL-CATEGORY health data.
// Endpoint: /api/cycle
//
// Owner-only by construction. Every query runs through the REQUEST-SCOPED
// `supabase` client (the caller's JWT), and `cycle_*` tables have owner-only RLS
// with NO staff policy — so this function physically cannot read another user's
// cycle data. There is deliberately no `athleteId`/staff branch anywhere here
// (V3-DESIGN §4.4: individual cycle data is visible to exactly one person).
//
//   GET    /api/cycle           → { profile, logs } (owner)
//   PUT    /api/cycle/profile   → upsert profile (enable/consent/settings)
//   POST   /api/cycle/log       → upsert a day's log
//   DELETE /api/cycle/log?date= → delete a day's log
//   DELETE /api/cycle           → MODULE WIPE: hard-delete all logs + profile,
//                                  write privacy_audit_log (withdrawal = erasure).
// =============================================================================

const FLOWS = new Set(["spotting", "light", "medium", "heavy"]);
const ADAPT = new Set(["off", "inform"]);

function profileToApi(r) {
  if (!r) {
    return null;
  }
  return {
    enabled: r.enabled,
    hormonalContraception: r.hormonal_contraception,
    adaptationLevel: r.adaptation_level,
    typicalCycleLength: r.typical_cycle_length,
    typicalPeriodLength: r.typical_period_length,
    consentVersion: r.consent_version,
    consentGrantedAt: r.consent_granted_at,
  };
}
function logToApi(r) {
  return { date: r.log_date, flow: r.flow, symptoms: r.symptoms ?? [] };
}

const INT = (v, lo, hi) => {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < lo || n > hi) {
    return null;
  }
  return n;
};

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "cycle",
    allowedMethods: ["GET", "PUT", "POST", "DELETE"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const path = evt.path
        .replace("/.netlify/functions/cycle", "")
        .replace(/^\//, "");

      try {
        // ── read everything the owner has ──────────────────────────────────
        if (evt.httpMethod === "GET") {
          const [{ data: prof }, { data: logs, error: logErr }] =
            await Promise.all([
              supabase
                .from("cycle_tracking_profiles")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle(),
              supabase
                .from("cycle_logs")
                .select("*")
                .eq("user_id", userId)
                .order("log_date", { ascending: false })
                .limit(400),
            ]);
          if (logErr) {
            throw logErr;
          }
          return createSuccessResponse({
            profile: profileToApi(prof),
            logs: (logs ?? []).map(logToApi),
          });
        }

        // ── upsert the profile (enable, consent, settings) ─────────────────
        if (evt.httpMethod === "PUT" && path === "profile") {
          const parsed = tryParseJsonObjectBody(evt.body);
          if (!parsed.ok) {
            return parsed.error;
          }
          const b = parsed.data;
          const adaptation = ADAPT.has(b.adaptationLevel)
            ? b.adaptationLevel
            : "inform";
          const enabled = b.enabled === true;
          const row = {
            user_id: userId,
            enabled,
            hormonal_contraception: b.hormonalContraception === true,
            adaptation_level: adaptation,
            typical_cycle_length: INT(b.typicalCycleLength, 21, 45),
            typical_period_length: INT(b.typicalPeriodLength, 1, 10),
            updated_at: new Date().toISOString(),
          };
          // Record explicit consent (version + timestamp) the moment it's granted.
          if (enabled && typeof b.consentVersion === "string") {
            row.consent_version = b.consentVersion.slice(0, 40);
            row.consent_granted_at = new Date().toISOString();
          }
          const { data, error } = await supabase
            .from("cycle_tracking_profiles")
            .upsert(row, { onConflict: "user_id" })
            .select()
            .single();
          if (error) {
            throw error;
          }
          return createSuccessResponse({ profile: profileToApi(data) });
        }

        // ── upsert a day's log ─────────────────────────────────────────────
        if (evt.httpMethod === "POST" && path === "log") {
          const parsed = tryParseJsonObjectBody(evt.body);
          if (!parsed.ok) {
            return parsed.error;
          }
          const b = parsed.data;
          if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.date))) {
            return createErrorResponse(
              "date (YYYY-MM-DD) is required",
              422,
              "validation_error",
            );
          }
          const flow = FLOWS.has(b.flow) ? b.flow : null;
          const symptoms = Array.isArray(b.symptoms)
            ? b.symptoms
                .filter((s) => typeof s === "string")
                .slice(0, 20)
                .map((s) => s.slice(0, 40))
            : [];
          const { data, error } = await supabase
            .from("cycle_logs")
            .upsert(
              {
                user_id: userId,
                log_date: b.date,
                flow,
                symptoms,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,log_date" },
            )
            .select()
            .single();
          if (error) {
            throw error;
          }
          return createSuccessResponse({ log: logToApi(data) });
        }

        // ── delete a single day's log ──────────────────────────────────────
        if (evt.httpMethod === "DELETE" && path === "log") {
          const date = evt.queryStringParameters?.date;
          if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
            return createErrorResponse(
              "date query param required",
              422,
              "validation_error",
            );
          }
          const { error } = await supabase
            .from("cycle_logs")
            .delete()
            .eq("user_id", userId)
            .eq("log_date", date);
          if (error) {
            throw error;
          }
          return createSuccessResponse({ deleted: date });
        }

        // ── MODULE WIPE: erase everything, log the erasure ─────────────────
        if (evt.httpMethod === "DELETE" && path === "") {
          const { error: e1 } = await supabase
            .from("cycle_logs")
            .delete()
            .eq("user_id", userId);
          if (e1) {
            throw e1;
          }
          const { error: e2 } = await supabase
            .from("cycle_tracking_profiles")
            .delete()
            .eq("user_id", userId);
          if (e2) {
            throw e2;
          }
          // Best-effort audit (never blocks the erasure the athlete asked for).
          try {
            await supabaseAdmin.from("privacy_audit_log").insert({
              user_id: userId,
              action: "cycle_module_wiped",
              affected_table: "cycle_logs,cycle_tracking_profiles",
              affected_data: { wiped_at: new Date().toISOString() },
            });
          } catch {
            /* audit is best-effort; the erasure already succeeded */
          }
          return createSuccessResponse({ wiped: true });
        }

        return createErrorResponse("Not found", 404, "not_found");
      } catch (_error) {
        return createErrorResponse(
          "Cycle request failed",
          500,
          "internal_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
