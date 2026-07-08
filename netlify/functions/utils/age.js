/**
 * Age from date of birth — the ONE place this calculation lives.
 *
 * 2026-07-08 consolidation (reusability audit F2): this trivial function had been
 * hand-copied into 4 backend files independently. One copy (privacy-settings.js) was
 * missing the month/day correction — a real bug, since that function gates the
 * GDPR/COPPA parental-consent check (age >= 13 && age < 18): a raw year-diff over- or
 * under-counts age by up to 1 year depending on time of year, which could silently
 * skip or wrongly trigger the consent requirement for an actual minor.
 */

/**
 * @param {string|Date|null|undefined} dob
 * @param {Date} [now] - injectable for tests; defaults to the real current date
 * @returns {number|null} whole years, or null if dob is missing/unparseable/negative
 */
export function ageFromDob(dob, now = new Date()) {
  if (!dob) {
    return null;
  }
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
