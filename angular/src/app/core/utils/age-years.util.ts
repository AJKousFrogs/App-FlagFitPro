/**
 * Athlete age in whole years from auth user_metadata date_of_birth (legacy
 * birth_date / dateOfBirth also read). Single source (CLAUDE §4): the engine's
 * age-scaled CNS window (via PeriodizationService) and the derived cohort
 * assignment (EvidenceConfigService) must agree on what "age" is. Returns null
 * when absent or implausible (< 16 or > 80) so consumers keep their safe
 * defaults for everyone.
 */
export function ageYearsFromUserMetadata(
  metadata: Record<string, unknown> | null | undefined,
): number | null {
  const meta = metadata ?? {};
  const dob =
    meta["date_of_birth"] ?? meta["birth_date"] ?? meta["dateOfBirth"];
  if (typeof dob !== "string" && typeof dob !== "number") {
    return null;
  }
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 16 && age <= 80 ? age : null;
}
