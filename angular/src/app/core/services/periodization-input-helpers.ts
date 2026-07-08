// =============================================================================
// PURE PERIODIZATION INPUT-DERIVATION HELPERS — extracted 2026-07-08
// (reusability audit F8) so isTeamPractice / injury-restriction resolution are
// ONE implementation shared by the client (periodization.service.ts /
// injury.service.ts) and the server (periodization-prescription.js, via the
// esbuild port — npm run build:periodization-input-helpers), instead of two
// independently hand-copied, only-parity-tested-to-match copies. Zero Angular
// imports (same DI-free discipline as periodization-engine.ts /
// schedule-resolver.ts) so it can be ported.
//
// Consolidating this surfaced a real bug: the client's InjuryService.SEV_RANK
// only recognized the "minor"/"moderate"/"severe" vocab, but
// athlete-injuries.js:124 passes `severity: r.injury_grade` through UNNORMALIZED
// — a clinical "Grade 1"/"Grade 2"/"Grade 3" value (the documented live format,
// see utils/active-injuries.js's injuriesPainLevel comment) never matched any
// SEV_RANK key, so every "Grade N" injury silently ranked as the same
// (undefined -> 1) severity regardless of N, and the raw "Grade N" string leaked
// into activeRestrictions.severity where the engine expects
// "minor"|"moderate"|"severe"|null. normalizeSeverity here is the fix — the same
// correct mapping periodization-prescription.js already had.
// =============================================================================

export type InjurySeverity = "minor" | "moderate" | "severe";

const SEV_RANK: Record<InjurySeverity, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
};

/**
 * athlete_injuries.injury_grade stores "Grade 1/2/3" (clinical) or the legacy
 * minor/moderate/severe vocab. Unknown/missing defaults to "minor" — the safe
 * direction (never silently reports a worse-than-unknown injury as fine, but
 * also never fabricates a severe classification from nothing).
 */
export function normalizeSeverity(
  grade: string | null | undefined,
): InjurySeverity {
  const map: Record<string, InjurySeverity> = {
    "Grade 1": "minor",
    "Grade 2": "moderate",
    "Grade 3": "severe",
    minor: "minor",
    moderate: "moderate",
    severe: "severe",
  };
  return (grade && map[grade]) || "minor";
}

/** A single active injury, ALREADY ADAPTED to this shape by the caller (client:
 * from ActiveInjury; server: from the raw athlete_injuries row) — see the two
 * call sites for the exact 1-line mapping. Keeps this module free of any
 * knowledge of either side's raw field names (camelCase vs snake_case). */
export interface NormalizedInjury {
  region: string | null;
  restrictionTypes: string[];
  /** Raw grade/severity value, NOT yet normalized — normalizeSeverity is
   * applied inside deriveRestrictions so every caller gets the fix uniformly. */
  severityGrade: string | null | undefined;
}

export interface DerivedRestrictions {
  restrictsSprint: boolean;
  restrictsThrowing: boolean;
  regions: string[];
  severity: InjurySeverity;
}

const SPRINT_RESTRICTING = new Set([
  "sprint",
  "high_intensity",
  "plyometric",
  "agility",
]);
const THROWING_RESTRICTING = new Set(["throwing", "upper_strength"]);

/**
 * Which restriction TYPES are active across all current injuries, and the
 * worst severity/region set among the ones that actually restrict sprint or
 * throwing. Returns null when nothing restricts either (matches the engine's
 * activeRestrictions: null = "no guard" contract).
 */
export function deriveRestrictions(
  injuries: NormalizedInjury[],
): DerivedRestrictions | null {
  const sprintInjuries = injuries.filter((i) =>
    i.restrictionTypes.some((r) => SPRINT_RESTRICTING.has(r)),
  );
  const throwingInjuries = injuries.filter((i) =>
    i.restrictionTypes.some((r) => THROWING_RESTRICTING.has(r)),
  );
  const restrictsSprint = sprintInjuries.length > 0;
  const restrictsThrowing = throwingInjuries.length > 0;
  if (!restrictsSprint && !restrictsThrowing) {
    return null;
  }
  const flagged = [...sprintInjuries, ...throwingInjuries];
  const regions = [
    ...new Set(flagged.map((i) => i.region).filter((r): r is string => !!r)),
  ];
  const severity = flagged.reduce<InjurySeverity>((max, i) => {
    const s = normalizeSeverity(i.severityGrade);
    return SEV_RANK[s] > SEV_RANK[max] ? s : max;
  }, "minor");
  return { restrictsSprint, restrictsThrowing, regions, severity };
}

/**
 * A recurring weekday practice OR a one-off schedule-declared training date.
 * `recurringDays` = day-of-week numbers (0=Sun...6=Sat, LOCAL — matches
 * `date.getDay()`, appropriate since a recurring weekday IS a local-calendar
 * concept for the athlete) the athlete declared in Settings;
 * `scheduleTrainingDays` = one-off dates from the schedule snapshot, built as
 * `starts_at.slice(0, 10)` in schedule.js's getScheduleSnapshot — i.e. UTC
 * calendar dates. The one-off comparison below MUST use the same UTC key
 * (toISOString, not local getFullYear/getMonth/getDate) or it silently
 * mismatches near local midnight in any non-UTC timezone — a real bug found
 * while consolidating this (2026-07-08, audit F8): the client's original
 * version built a LOCAL date string here.
 */
export function isTeamPractice(
  date: Date,
  recurringDays: number[],
  scheduleTrainingDays: string[],
): boolean {
  if (recurringDays.includes(date.getDay())) {
    return true;
  }
  const iso = date.toISOString().slice(0, 10);
  return scheduleTrainingDays.includes(iso);
}
