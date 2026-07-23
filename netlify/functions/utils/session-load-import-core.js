import { supabaseAdmin } from "../supabase-client.js";
import { getAdapter, listProviders } from "./session-load-adapters.js";

// Shared core for BOTH session-load import entry points (JSON body and CSV
// upload) -- single source of truth for provider dispatch, device<->athlete
// pairing, the callerWritableAthletes() authority gate, and the idempotent
// upsert, so the two entry points can never drift (CLAUDE.md §4). Each
// caller is a thin adapter that turns its own input shape into `rows[]` and
// formats this function's result as its own HTTP response.

const isNil = (x) => x === null || x === undefined;

// Which athletes may the caller import for: self, or as sc_coach/physio on
// the athlete's team. Enforced server-side (the upsert runs as service-role).
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

/**
 * Run a session-load import for an already-resolved `provider` + `rows[]`
 * (each row a plain object of provider-shaped fields, whatever the source).
 *
 * @returns {Promise<{ok: true, data: object} | {ok: false, code: string, message: string}>}
 */
export async function runSessionLoadImport(userId, provider, rows) {
  const adapter = getAdapter(provider);
  if (!adapter) {
    // Unknown provider surfaces loudly — never silently accept.
    return {
      ok: false,
      code: "unsupported_provider",
      message: `Unsupported provider '${provider}'. Known: ${listProviders().join(", ")}`,
    };
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
    staged.forEach((r) => {
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
        return {
          ok: false,
          code: "import_failed",
          message: `Import failed at upsert: ${error.message}`,
        };
      }
      imported = data?.length ?? permitted.length;
    }

    const partial = failed.length > 0;
    return {
      ok: true,
      data: {
        provider,
        received: rows.length,
        imported,
        failedCount: failed.length,
        failed,
        partial,
        idempotentKey: "user_id,session_id,provider",
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: "import_failed",
      message: `Import error: ${error?.message ?? "unknown"}`,
    };
  }
}
