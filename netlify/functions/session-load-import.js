import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { getAdapter, listProviders } from "./utils/session-load-adapters.js";

// Netlify Function: Session-load Import
// Endpoint: /api/session-load-import   (POST)
//
// Accepts a provider export { provider, rows[] }, runs each row through the
// provider ADAPTER (mapping only — the engine is provider-agnostic), resolves
// device<->athlete PAIRING at ingest, and idempotent-upserts into session_load on
// (user_id, session_id, provider) so a re-import counts ONCE. Every failed/partial
// row is surfaced in `failed[]` — the import never silently advances.

const isNil = (x) => x === null || x === undefined;

// Which athletes may the caller import for: self, or as sc_coach/physio on the
// athlete's team. Enforced server-side (the upsert runs as service-role).
async function callerWritableAthletes(callerId, athleteIds) {
  const ids = [...new Set(athleteIds.filter(Boolean))];
  const allowed = new Set(ids.filter((id) => id === callerId));
  const remaining = ids.filter((id) => id !== callerId);
  if (!remaining.length) {
    return allowed;
  }
  const { data: staff } = await supabaseAdmin
    .from("team_member_roles")
    .select("team_id")
    .eq("user_id", callerId)
    .in("role", ["sc_coach", "physio"]);
  const staffTeams = new Set((staff ?? []).map((r) => r.team_id));
  if (staffTeams.size) {
    const { data: ath } = await supabaseAdmin
      .from("team_member_roles")
      .select("user_id,team_id")
      .in("user_id", remaining)
      .eq("role", "athlete");
    for (const r of ath ?? []) {
      if (staffTeams.has(r.team_id)) {
        allowed.add(r.user_id);
      }
    }
  }
  return allowed;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "session-load-import",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;
      const provider = String(body.provider ?? "").trim();
      const rows = Array.isArray(body.rows) ? body.rows : null;
      const adapter = getAdapter(provider);
      if (!adapter) {
        // Unknown provider surfaces loudly — never silently accept.
        return createErrorResponse(
          `Unsupported provider '${provider}'. Known: ${listProviders().join(", ")}`,
          422,
          "unsupported_provider",
        );
      }
      if (!rows) {
        return createErrorResponse(
          "rows[] is required",
          422,
          "validation_error",
        );
      }

      try {
        // Provider id + its device pairings (external athlete id -> user_id).
        const { data: prov } = await supabaseAdmin
          .from("monitoring_providers")
          .select("id")
          .eq("key", provider)
          .maybeSingle();
        const pairing = new Map();
        if (prov?.id) {
          const { data: pairs } = await supabaseAdmin
            .from("device_pairings")
            .select("external_athlete_id,user_id")
            .eq("provider_id", prov.id)
            .eq("is_active", true);
          for (const p of pairs ?? []) {
            if (p.external_athlete_id) {
              pairing.set(p.external_athlete_id, p.user_id);
            }
          }
        }

        const failed = [];
        const staged = [];
        const stagedAthletes = [];
        rows.forEach((row, index) => {
          const extId = adapter.externalAthleteId(row);
          const sessionId = adapter.sessionId(row);
          const recordedAt = adapter.recordedAt(row);
          const userForRow = extId ? pairing.get(String(extId)) : null;
          if (isNil(userForRow)) {
            failed.push({
              index,
              reason: "no device<->athlete pairing",
              externalAthleteId: extId ?? null,
            });
            return;
          }
          if (isNil(sessionId)) {
            failed.push({ index, reason: "missing session id" });
            return;
          }
          if (isNil(recordedAt)) {
            failed.push({ index, reason: "missing session timestamp" });
            return;
          }
          staged.push({
            user_id: userForRow,
            session_id: String(sessionId),
            provider,
            recorded_at: recordedAt,
            ...adapter.map(row),
          });
          stagedAthletes.push(userForRow);
        });

        // Server-side gate: drop rows for athletes the caller may not write.
        const writable = await callerWritableAthletes(userId, stagedAthletes);
        const permitted = [];
        staged.forEach((r, i) => {
          if (writable.has(r.user_id)) {
            permitted.push(r);
          } else {
            failed.push({
              index: null,
              reason: "not permitted to import for this athlete",
              sessionId: r.session_id,
            });
          }
        });

        let imported = 0;
        if (permitted.length) {
          // Idempotent: conflict on (user_id, session_id, provider) -> update.
          const { data, error } = await supabaseAdmin
            .from("session_load")
            .upsert(permitted, { onConflict: "user_id,session_id,provider" })
            .select("id");
          if (error) {
            // A DB failure surfaces — do not report a partial success as done.
            return createErrorResponse(
              `Import failed at upsert: ${error.message}`,
              500,
              "import_failed",
            );
          }
          imported = data?.length ?? permitted.length;
        }

        const partial = failed.length > 0;
        return createSuccessResponse(
          {
            provider,
            received: rows.length,
            imported,
            failedCount: failed.length,
            failed,
            partial,
            idempotentKey: "user_id,session_id,provider",
          },
          200,
          partial
            ? "Import completed with surfaced failures"
            : "Import complete",
        );
      } catch (error) {
        return createErrorResponse(
          `Import error: ${error?.message ?? "unknown"}`,
          500,
          "import_failed",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
