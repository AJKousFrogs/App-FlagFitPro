// Shared field validators for the athlete/team event write paths
// (athlete-events.js, event-travel.js), which parse the same date/status inputs
// against the same competition_events / athlete_events shape. Extracted
// 2026-07-08 (reuse audit R2) — both files carried byte-identical copies.

/**
 * A validation Error tagged so the handler's catch block maps it to a 422
 * (see each handler's `error.isValidation` branch) instead of a generic 500.
 */
export const validationError = (message) => {
  const error = new Error(message);
  error.isValidation = true;
  return error;
};

/**
 * Parse an optional/required ISO date-time field. Empty → null (or throws if
 * required); invalid → throws a validation Error; valid → normalized ISO string.
 */
export function parseIso(value, field, { required }) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw validationError(`${field} is required`);
    }
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw validationError(`${field} must be a valid date/time`);
  }
  return d.toISOString();
}
