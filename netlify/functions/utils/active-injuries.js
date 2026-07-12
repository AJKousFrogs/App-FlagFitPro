import { supabaseAdmin } from "../supabase-client.js";
import { normalizeSeverity } from "./periodization-input-helpers.js";

/**
 * THE injury authority for rehab gating (SOT Law 5a). The backend resolvers used
 * to trip rehab off the raw `soreness_areas` slider on the latest wellness
 * check-in — no severity, no expiry — which (a) locked an athlete in rehab forever
 * off one stale tag and (b) let a real, active injury be bypassed by a single
 * clean check-in. This reads `athlete_injuries` instead: severity-tiered, with
 * self-reports auto-expiring (expected_return_date) while clinical injuries persist
 * until resolved. `soreness_areas` is an INPUT to this system, never a parallel one.
 *
 * @returns active injuries on `date` (region/severity/restrictions), or [].
 */
export async function getActiveInjuries(
  userId,
  date,
  { client = supabaseAdmin } = {},
) {
  if (!userId) {
    return [];
  }
  const { data, error } = await client
    .from("athlete_injuries")
    .select(
      "injury_location, injury_grade, recovery_status, injury_mechanism, activity_restrictions, expected_return_date",
    )
    .eq("user_id", userId)
    .in("recovery_status", ["active", "recovering", "rehab"]);
  if (error || !Array.isArray(data)) {
    return [];
  }
  // Drop expired self-reports; clinical injuries (no expiry) always count.
  return data.filter(
    (r) =>
      r.injury_mechanism !== "self_report" ||
      !r.expected_return_date ||
      r.expected_return_date >= date,
  );
}

// Worst-injury pain level (2–4) for RTP sizing, keyed off the ONE canonical
// grade→tier classifier (normalizeSeverity, shared with the periodization engine
// and calc-readiness — 2026-07-08 consistency audit C1). Previously this carried
// its own "Grade 1/2/3" + legacy-vocab map, a third independent copy of that
// knowledge; now it only owns the tier→pain-level domain mapping.
const PAIN_LEVEL_BY_TIER = { minor: 2, moderate: 3, severe: 4 };

/**
 * Map the worst active-injury severity to a 2–4 pain level for RTP sizing.
 * athlete_injuries.injury_grade stores "Grade 1/2/3" (clinical text) or the
 * legacy "minor/moderate/severe" vocab; normalizeSeverity accepts both and
 * defaults unknown/missing to "minor" (level 2) so callers never silently fall
 * back off a format mismatch.
 */
export function injuriesPainLevel(injuries) {
  let level = 2;
  for (const i of injuries || []) {
    level = Math.max(
      level,
      PAIN_LEVEL_BY_TIER[normalizeSeverity(i.injury_grade)],
    );
  }
  return level;
}

// Graded injury → load response (SOT Law 5a; Tissue Load Engine §4.3). An injury
// must affect RPE/LOAD, not just swap exercises — but the response is GRADED, not
// a blanket shutdown. Over-conservatism is a failure mode: pulling an athlete to
// recovery-only for a MINOR niggle de-conditions them, and de-conditioning is
// itself an injury-risk factor (Gabbett; Malone sprint-as-vaccine). So:
//   • CLINICAL injury (mechanism ≠ self_report) or SEVERE self-report → full RTP.
//   • MINOR/MODERATE self-report → keep training on a DOWN-REGULATED normal plan:
//     the day's load target is cut by loadFactor and injured-region work is
//     filtered out, but the athlete still trains.
// loadFactor values mirror the client engine's INJURY_RESPONSE caps so the two
// layers agree (parity-tested).
const SEV_RANK = { minor: 1, moderate: 2, severe: 3 };
const INJURY_LOAD_FACTOR = { minor: 0.85, moderate: 0.6, severe: 0.35 };

/**
 * Decide how an athlete's active injuries reshape today's plan.
 * @returns {{hasInjury:boolean, goRtp:boolean, hasClinical:boolean,
 *   severity:('minor'|'moderate'|'severe'|null), loadFactor:number,
 *   injuredRegions:string[]}}
 */
export function resolveInjuryResponse(activeInjuries) {
  if (!Array.isArray(activeInjuries) || activeInjuries.length === 0) {
    return {
      hasInjury: false,
      goRtp: false,
      hasClinical: false,
      severity: null,
      loadFactor: 1,
      injuredRegions: [],
    };
  }
  const hasClinical = activeInjuries.some(
    (i) => i.injury_mechanism && i.injury_mechanism !== "self_report",
  );
  const severity = activeInjuries.reduce((worst, i) => {
    const s = normalizeSeverity(i.injury_grade);
    return SEV_RANK[s] > SEV_RANK[worst] ? s : worst;
  }, "minor");
  const goRtp = hasClinical || severity === "severe";
  const injuredRegions = [
    ...new Set(
      activeInjuries
        .map((i) => (i.injury_location || "").toLowerCase())
        .filter(Boolean),
    ),
  ];
  return {
    hasInjury: true,
    goRtp,
    hasClinical,
    severity,
    loadFactor: INJURY_LOAD_FACTOR[severity] ?? 0.85,
    injuredRegions,
  };
}

// Deconditioning guard (Tissue Load Engine §4.5). The under-load alarm is as
// important as the spike alarm: if chronic load COLLAPSES while an athlete is
// carrying a tissue flag, the eventual return spike is where they get hurt.
// This never surfaces an injury PROBABILITY (ACWR is contested) — it only flags
// a real, large drop for coach attention.
export const DECONDITIONING_DROP_THRESHOLD = 0.15; // >15% drop over the window

/**
 * @param {number} recentLoad  summed load over the last N days
 * @param {number} priorLoad   summed load over the N days before that
 * @param {boolean} hasActiveInjury
 * @returns {{warn:boolean, dropPct:number}}
 */
export function detectDeconditioning(recentLoad, priorLoad, hasActiveInjury) {
  if (!hasActiveInjury || !(priorLoad > 0)) {
    return { warn: false, dropPct: 0 };
  }
  const dropPct = (priorLoad - recentLoad) / priorLoad;
  return {
    warn: dropPct > DECONDITIONING_DROP_THRESHOLD,
    dropPct: Math.max(0, dropPct),
  };
}
