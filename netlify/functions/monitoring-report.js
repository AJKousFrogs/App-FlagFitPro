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
// ⚠️ SECURITY LANDMINE — read before "fixing" (SOURCE_OF_TRUTH §6, 2026-07-09).
// This resolves the requester's lens from `team_member_roles` (head_coach /
// sc_coach / physio), which is EMPTY in the live DB with no sync from
// `team_members` → every non-self caller resolves to role:null → 403. So the
// single-athlete report is currently dark for ALL staff (only an athlete viewing
// their OWN data works). That is fail-closed and INTENTIONAL until the exposure
// decision below is made.
//
// DO NOT "fix the dark report" by pointing this at `team_members` on its own.
// This endpoint runs as `supabaseAdmin` (service role → BYPASSES RLS), and this
// role check is its ONLY authorization: there is NO app-layer athlete-consent
// gate (only `buildWearableRaw` self-filters on consent_state). Switching the
// role source alone would emit an athlete's load / bloodwork / wearable / physio
// data to any same-team staff WITHOUT their consent. Enabling staff requires,
// together: (1) authoritative role from `team_members`, (2) an app-layer consent
// gate per data section (canCoachViewWellness/Readiness/Performance — the
// explicit-viewer helpers the working /team-monitoring squad table uses, since
// can_staff_read_athlete relies on auth.uid() which is null under service role),
// and (3) a product/legal decision on the coach exposure lens (does a coach see
// this report at all, and how deep — raw medical is never in the head_coach lens).
async function resolveRequesterRole(callerId, athleteId) {
  const { data: ath } = await supabaseAdmin
    .from("team_member_roles")
    .select("team_id")
    .eq("user_id", athleteId)
    .eq("role", "athlete");
  const teamIds = (ath ?? []).map((r) => r.team_id);
  const teamId = teamIds[0] ?? null;
  if (callerId === athleteId) {
    return { role: "self", teamId };
  }
  if (!teamIds.length) {
    return { role: null, teamId: null };
  }
  const { data: caller } = await supabaseAdmin
    .from("team_member_roles")
    .select("role")
    .eq("user_id", callerId)
    .in("team_id", teamIds);
  const roles = new Set((caller ?? []).map((r) => r.role));
  const role = roles.has("physio")
    ? "physio"
    : roles.has("sc_coach")
      ? "sc_coach"
      : roles.has("head_coach")
        ? "head_coach"
        : null;
  return { role, teamId };
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
function shapeBloodwork(raw, role, medicalSignal) {
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
  return { mode: "raw", ...raw }; // physio / self
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
          bloodwork: shapeBloodwork(bloodworkRaw, role, medicalSignal),
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
