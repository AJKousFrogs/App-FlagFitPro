import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { ewma } from "./utils/acwr.js";

// Netlify Function: Monitoring Report
// Endpoint: /api/monitoring-report?athleteId=<user_id>
//
// ONE read that returns a payload SHAPED BY THE REQUESTER'S ROLE. Everything is
// computed server-side with the service-role client and then gated in code
// (RLS is the backstop, not the gate) — raw medical/wearable is NEVER emitted to
// head_coach or sc_coach. All flags/bands come from monitoring_config (no magic
// numbers in the client). Missing layers return explicit nulls + promptRequired.

const isNil = (x) => x === null || x === undefined;
const round = (n, p = 1) =>
  isNil(n) || !Number.isFinite(Number(n)) ? null : Number(Number(n).toFixed(p));

// ── config resolution ──────────────────────────────────────────────────────
// Resolve every (metric,key) to a value: a team override beats the global
// default; a sex-specific row beats the sex-agnostic one for the athlete's sex.
async function resolveThresholds(teamId, sex) {
  let q = supabaseAdmin
    .from("monitoring_config")
    .select("team_id,metric,key,sex,value,unit,citation")
    .eq("is_active", true);
  q = teamId
    ? q.or(`team_id.is.null,team_id.eq.${teamId}`)
    : q.is("team_id", null);
  const { data, error } = await q;
  if (error) {
    throw error;
  }
  const rank = (r) => (r.team_id ? 2 : 0) + (r.sex && r.sex === sex ? 1 : 0);
  const best = new Map();
  for (const r of data ?? []) {
    if (r.sex && r.sex !== sex) {
      continue;
    } // wrong-sex row never applies
    const k = `${r.metric}.${r.key}`;
    if (!best.has(k) || rank(r) > rank(best.get(k))) {
      best.set(k, r);
    }
  }
  const t = {};
  for (const [k, r] of best) {
    const [metric, key] = k.split(".");
    (t[metric] ??= {})[key] = Number(r.value);
    t[metric]._unit = r.unit;
    t[metric]._citation = r.citation;
  }
  return t;
}

// ── server-side flag computation (from resolved config only) ────────────────
function hooperFlag(index, t) {
  if (isNil(index) || !t.hooper) {
    return null;
  }
  if (index >= t.hooper.high) {
    return "high";
  }
  if (index >= t.hooper.watch) {
    return "watch";
  }
  return "ok";
}
function acwrBand(value, t) {
  if (isNil(value) || !t.acwr) {
    return null;
  }
  if (value < t.acwr.sweet_low) {
    return "detraining";
  }
  if (value <= t.acwr.sweet_high) {
    return "safe";
  }
  if (value < t.acwr.elevated) {
    return "caution";
  }
  return "elevated";
}
function markerFlag(name, value, t) {
  if (isNil(value)) {
    return "unknown";
  }
  const m = t[name];
  if (name === "ck" && !isNil(m?.upper)) {
    return value > m.upper ? "high" : "normal";
  }
  if (name === "ferritin" && !isNil(m?.floor)) {
    return value < m.floor ? "low" : "normal";
  }
  if (name === "urea" && !isNil(m?.upper)) {
    return value > m.upper ? "high" : "normal";
  }
  if (name === "hs_crp" && !isNil(m?.upper)) {
    return value > m.upper ? "high" : "normal";
  }
  if (name === "testosterone" && !isNil(m?.low)) {
    return value < m.low ? "low" : "normal";
  }
  if (name === "vitamin_d" && !isNil(m?.deficient_below)) {
    if (value < m.deficient_below) {
      return "deficient";
    }
    if (value < m.sufficient_above) {
      return "insufficient";
    }
    return "sufficient";
  }
  return "normal";
}

// ── role resolution (server-side gate) ──────────────────────────────────────
// Resolves the requester's monitoring lens from the AUTHORITATIVE `team_members`
// (2026-07-09: fixed — previously read `team_member_roles`, which is empty in the
// live DB with no sync from team_members, so the report was dark for all staff;
// see SOURCE_OF_TRUTH §6). This endpoint runs as `supabaseAdmin` (service role,
// BYPASSES RLS), so this role check is the authorization — hence it must read the
// same authoritative source (`team_members`) the rest of the app gates on.
//
// Per the 2026-07-09 club-owner directive, physiotherapists AND coaches get the
// FULL clinical lens ("physio") — all data, same as the athlete's own view. The
// other staff roles (nutritionist / psychologist) use their dedicated lanes, not
// this report, so they resolve to null (403).
//
// ⚠️ HEALTH-DATA EXPOSURE: the "physio" full-clinical lens (coach + physio) is
// consent-aware for the most sensitive data — RAW bloodwork requires the
// athlete's health-sharing consent (2026-07-09: check_health_sharing →
// shapeBloodwork's `consent_required` state; the athlete always sees their own),
// and wearable rows are already filtered to consent_state='granted'. Load /
// wellness / physio restrictions ride the full lens without a separate gate
// (clinical duty-of-care model, per the owner directive). If those should also be
// athlete-gated, add the check here (helpers exist in consent-guard.js).

/** team_members roles (of the caller, on the athlete's team) → monitoring lens.
 *  Pure + exported for tests. physiotherapist|coach → full clinical; else null. */
export function lensForRoles(roleSet) {
  if (roleSet.has("physiotherapist") || roleSet.has("coach")) {
    return "physio";
  }
  return null;
}

/** The athlete's health-sharing consent (team override → global default → false),
 *  via the DB `check_health_sharing`. Explicit args so it works under the service
 *  role (RLS bypassed). Null team → global default. */
async function checkHealthSharing(athleteId, teamId) {
  const { data, error } = await supabaseAdmin.rpc("check_health_sharing", {
    p_player_id: athleteId,
    p_team_id: teamId,
  });
  return !error && data === true;
}

async function resolveRequesterRole(callerId, athleteId) {
  const { data: subject } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", athleteId)
    .eq("status", "active");
  const teamIds = (subject ?? []).map((r) => r.team_id).filter(Boolean);
  const teamId = teamIds[0] ?? null;
  if (callerId === athleteId) {
    return { role: "self", teamId };
  }
  if (!teamIds.length) {
    return { role: null, teamId: null };
  }
  const { data: caller } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", callerId)
    .eq("status", "active")
    .in("team_id", teamIds);
  const roleSet = new Set((caller ?? []).map((r) => r.role));
  return { role: lensForRoles(roleSet), teamId };
}

// ── layers ──────────────────────────────────────────────────────────────────
async function buildDaily(athleteId, t) {
  const { data } = await supabaseAdmin
    .from("daily_wellness_checkin")
    .select(
      "checkin_date,sleep_quality,stress_level,energy_level,muscle_soreness,sleep_hours",
    )
    .eq("user_id", athleteId)
    .order("checkin_date", { ascending: false })
    .limit(28);
  const rows = data ?? [];
  const hooper = (r) =>
    [r.sleep_quality, r.stress_level, r.energy_level, r.muscle_soreness].every(
      (v) => !isNil(v),
    )
      ? r.sleep_quality + r.stress_level + r.energy_level + r.muscle_soreness
      : null;
  if (!rows.length) {
    return {
      latest: null,
      series: [],
      hooperIndex: null,
      flags: {},
      promptRequired: true,
    };
  }
  const latest = rows[0];
  const idx = hooper(latest);
  return {
    latest: {
      date: latest.checkin_date,
      sleepQuality: latest.sleep_quality,
      stress: latest.stress_level,
      fatigue: latest.energy_level,
      soreness: latest.muscle_soreness,
      sleepHours: round(latest.sleep_hours),
    },
    series: rows
      .slice()
      .reverse()
      .map((r) => ({ date: r.checkin_date, hooperIndex: hooper(r) })),
    hooperIndex: idx,
    flags: { hooper: hooperFlag(idx, t) },
    promptRequired: false,
  };
}

async function buildWeekly(athleteId, t) {
  const { data } = await supabaseAdmin
    .from("session_load")
    .select("recorded_at,player_load,player_load_per_min")
    .eq("user_id", athleteId)
    .order("recorded_at", { ascending: true })
    .limit(60);
  const rows = (data ?? []).filter((r) => !isNil(r.player_load));
  if (rows.length < 3) {
    return {
      acwr: null,
      monotony: null,
      strain: null,
      plPerMin: null,
      promptRequired: true,
    };
  }
  const loads = rows.map((r) => Number(r.player_load));
  // PRIMARY: EWMA ACWR (spec lambdas). COMPARISON: simple rolling 7d/28d.
  const acuteE = ewma(loads, 0.25);
  const chronicE = ewma(loads, 0.069);
  const primary = chronicE > 0 ? acuteE / chronicE : null;
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const last7 = loads.slice(-7);
  const last28 = loads.slice(-28);
  const rolling = mean(last28) > 0 ? mean(last7) / mean(last28) : null;
  const m7 = mean(last7);
  const sd7 = Math.sqrt(mean(last7.map((x) => (x - m7) ** 2))) || 0;
  const monotony = sd7 > 0 ? m7 / sd7 : null;
  const strain = isNil(monotony)
    ? null
    : last7.reduce((s, x) => s + x, 0) * monotony;
  const plPerMinVal = rows[rows.length - 1].player_load_per_min;
  return {
    acwr: {
      primary: {
        method: "ewma",
        lambdaAcute: 0.25,
        lambdaChronic: 0.069,
        value: round(primary, 2),
        band: acwrBand(primary, t),
      },
      comparison: {
        method: "rolling_7d_28d",
        value: round(rolling, 2),
        band: acwrBand(rolling, t),
        label: "comparison only",
      },
      monitoringNotPrediction: true,
    },
    monotony: round(monotony, 2),
    strain: round(strain, 0),
    plPerMin: isNil(plPerMinVal)
      ? null
      : {
          value: round(plPerMinVal, 1),
          flag:
            t.pl_per_min && plPerMinVal > t.pl_per_min.high ? "high" : "normal",
        },
    promptRequired: false,
  };
}

async function buildBloodworkRaw(athleteId, t) {
  const { data: panels } = await supabaseAdmin
    .from("bloodwork_panels")
    .select("id,collected_date")
    .eq("user_id", athleteId)
    .order("collected_date", { ascending: false })
    .limit(1);
  if (!panels?.length) {
    return { collectedDate: null, markers: [], promptRequired: true };
  }
  const panel = panels[0];
  const { data: markers } = await supabaseAdmin
    .from("bloodwork_markers")
    .select("marker_name,value,unit,reference_low,reference_high,flag")
    .eq("panel_id", panel.id);
  const daysSince = panel.collected_date
    ? Math.floor(
        (Date.now() - new Date(panel.collected_date).getTime()) / 86400000,
      )
    : null;
  return {
    collectedDate: panel.collected_date,
    daysSinceDraw: daysSince,
    markers: (markers ?? []).map((m) => ({
      name: m.marker_name,
      value: round(m.value, 2),
      unit: m.unit,
      // Reference bounds power the client's range visual. Only ever present in
      // this RAW mode (already gated to the clinical lens + the athlete's
      // health-sharing consent) — GDPR special-category data stays gated.
      referenceLow: round(m.reference_low, 2),
      referenceHigh: round(m.reference_high, 2),
      flag: markerFlag(m.marker_name, m.value, t),
    })),
    promptRequired: false,
  };
}

async function buildWearableRaw(athleteId) {
  const { data } = await supabaseAdmin
    .from("wearable_health")
    .select("source,source_device,metric,value,unit,recorded_at,consent_state")
    .eq("user_id", athleteId)
    .eq("consent_state", "granted")
    .order("recorded_at", { ascending: false })
    .limit(30);
  const rows = data ?? [];
  if (!rows.length) {
    return { latest: null, derivedRecovery: null, promptRequired: true };
  }
  // latest per metric; keep the source with each metric (never cross-brand).
  const latest = {};
  for (const r of rows) {
    if (!latest[r.metric]) {
      latest[r.metric] = {
        value: round(r.value, 1),
        source: r.source,
        at: r.recorded_at,
      };
    }
  }
  return {
    latest,
    derivedRecovery: deriveRecovery(latest),
    promptRequired: false,
  };
}

// Derived recovery bucket from within-athlete signals (not cross-brand cutoffs).
function deriveRecovery(latest) {
  const hrv = latest.hrv?.value;
  const rhr = latest.resting_hr?.value;
  const sleep = latest.sleep_hours?.value;
  let score = 0;
  let seen = 0;
  if (!isNil(hrv)) {
    seen++;
    score += hrv >= 60 ? 1 : hrv >= 45 ? 0 : -1;
  }
  if (!isNil(rhr)) {
    seen++;
    score += rhr <= 55 ? 1 : rhr <= 62 ? 0 : -1;
  }
  if (!isNil(sleep)) {
    seen++;
    score += sleep >= 7.5 ? 1 : sleep >= 6 ? 0 : -1;
  }
  if (!seen) {
    return null;
  }
  return score >= 1 ? "green" : score <= -1 ? "red" : "amber";
}

async function buildPhysioBlock(athleteId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin
    .from("physio_blocks")
    .select(
      "body_region,block_type,restrictions,max_load_percent,end_date,clinical_note,is_active",
    )
    .eq("user_id", athleteId)
    .eq("is_active", true)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

// ── role shaping (the gate) ─────────────────────────────────────────────────
function shapePhysioBlock(raw, role) {
  if (!raw) {
    return null;
  }
  const operational = {
    active: true,
    restrictions: raw.restrictions ?? [],
    maxLoadPercent: raw.max_load_percent ?? null,
    endDate: raw.end_date ?? null,
    suppressesLoadPrescription: true,
  };
  if (role === "physio" || role === "self") {
    return {
      ...operational,
      bodyRegion: raw.body_region ?? null,
      blockType: raw.block_type ?? null,
      clinicalNote: raw.clinical_note ?? null,
    };
  }
  return operational; // head_coach / sc_coach: operational only, no clinical detail
}
/** Raw bloodwork is the athlete's OWN to see; a staff viewer (coach/physio on
 *  the full clinical lens) needs the athlete's health-sharing consent. Pure +
 *  exported for tests. */
export function canSeeRawBloodwork(role, hasHealthConsent) {
  return role === "self" || hasHealthConsent === true;
}

function shapeBloodwork(raw, role, medicalSignal, canSeeRaw) {
  if (role === "sc_coach") {
    return null;
  } // none
  if (role === "head_coach") {
    return {
      mode: "signal",
      status: medicalSignal.status,
      categories: medicalSignal.categories,
      promptRequired: isNil(medicalSignal.status),
    };
  }
  // physio / self (full clinical lens). Raw bloodwork is GDPR special-category
  // medical data: a staff viewer sees the values only with the athlete's
  // health-sharing consent (Settings → "Share health & blood results with
  // staff" → privacy_settings.health_sharing_default / team override, via
  // check_health_sharing). The athlete always sees their own. 2026-07-09.
  if (!canSeeRaw) {
    return { mode: "consent_required" };
  }
  return { mode: "raw", ...raw };
}
function shapeWearable(raw, role) {
  if (!raw) {
    return null;
  }
  if (role === "physio" || role === "self") {
    return { mode: "raw", ...raw };
  }
  return {
    mode: "derived",
    derivedRecovery: raw.derivedRecovery,
    promptRequired: raw.promptRequired ?? false,
  };
}

function medicalSignalFrom(physioBlockRaw, bloodworkRaw) {
  const cats = [];
  if (physioBlockRaw) {
    cats.push("physio_block");
  }
  if (
    (bloodworkRaw.markers ?? []).some((m) =>
      ["high", "low", "deficient"].includes(m.flag),
    )
  ) {
    cats.push("bloodwork");
  }
  if (bloodworkRaw.promptRequired && !physioBlockRaw) {
    return { status: null, categories: [] };
  }
  return { status: cats.length ? "flagged" : "cleared", categories: cats };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "monitoring-report",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      try {
        const athleteId = evt.queryStringParameters?.athleteId || userId;
        const { role, teamId } = await resolveRequesterRole(userId, athleteId);
        if (!role) {
          return createErrorResponse(
            "Not permitted to view this athlete's report",
            403,
            "forbidden",
          );
        }

        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("first_name,last_name,gender,position")
          .eq("id", athleteId)
          .maybeSingle();
        const sex = profile?.gender ?? null;

        const t = await resolveThresholds(teamId, sex);
        const [daily, weekly, bloodworkRaw, wearableRaw, physioBlockRaw] =
          await Promise.all([
            buildDaily(athleteId, t),
            buildWeekly(athleteId, t),
            buildBloodworkRaw(athleteId, t),
            buildWearableRaw(athleteId),
            buildPhysioBlock(athleteId),
          ]);
        const medicalSignal = medicalSignalFrom(physioBlockRaw, bloodworkRaw);
        // Raw bloodwork gate: the athlete always sees their own; a staff viewer
        // needs the athlete's health-sharing consent (2026-07-09).
        const healthConsent =
          role === "self" ? true : await checkHealthSharing(athleteId, teamId);

        return createSuccessResponse({
          meta: {
            athleteId,
            requesterRole: role,
            generatedAt: new Date().toISOString(),
            disclaimer: "monitoring, not prediction",
          },
          identity: profile
            ? {
                name:
                  [profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(" ") || null,
                sex,
                position: profile.position ?? null,
              }
            : null,
          physioBlock: shapePhysioBlock(physioBlockRaw, role),
          daily,
          weekly,
          bloodwork: shapeBloodwork(
            bloodworkRaw,
            role,
            medicalSignal,
            canSeeRawBloodwork(role, healthConsent),
          ),
          wearable: shapeWearable(wearableRaw, role),
          thresholds: t,
        });
      } catch (_e) {
        return createErrorResponse(
          "Failed to build monitoring report",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
