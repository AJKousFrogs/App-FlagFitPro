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
