// GENERATED — do not edit by hand. Source of truth: angular/src/app/core/services/periodization-input-helpers.ts. Regenerate: npm run build:periodization-input-helpers.

// angular/src/app/core/services/periodization-input-helpers.ts
var SEV_RANK = {
  minor: 1,
  moderate: 2,
  severe: 3,
};
function normalizeSeverity(grade) {
  const map = {
    "Grade 1": "minor",
    "Grade 2": "moderate",
    "Grade 3": "severe",
    minor: "minor",
    moderate: "moderate",
    severe: "severe",
  };
  return (grade && map[grade]) || "minor";
}
var SPRINT_RESTRICTING = /* @__PURE__ */ new Set([
  "sprint",
  "high_intensity",
  "plyometric",
  "agility",
]);
var THROWING_RESTRICTING = /* @__PURE__ */ new Set([
  "throwing",
  "upper_strength",
]);
function deriveRestrictions(injuries) {
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
  const regions = [...new Set(flagged.map((i) => i.region).filter((r) => !!r))];
  const severity = flagged.reduce((max, i) => {
    const s = normalizeSeverity(i.severityGrade);
    return SEV_RANK[s] > SEV_RANK[max] ? s : max;
  }, "minor");
  return { restrictsSprint, restrictsThrowing, regions, severity };
}
function isTeamPractice(date, recurringDays, scheduleTrainingDays) {
  if (recurringDays.includes(date.getDay())) {
    return true;
  }
  const iso = date.toISOString().slice(0, 10);
  return scheduleTrainingDays.includes(iso);
}
export { deriveRestrictions, isTeamPractice, normalizeSeverity };
