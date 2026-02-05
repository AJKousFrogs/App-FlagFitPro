/**
 * Shared role constants for route authorization logic.
 *
 * @module routes/utils/roles
 * @version 1.0.0
 */

export const STAFF_ROLES = new Set([
  "coach",
  "head_coach",
  "assistant_coach",
  "offense_coordinator",
  "defense_coordinator",
  "admin",
  "owner",
]);

export const COACH_STAFF_ROLE_LIST = [
  "coach",
  "head_coach",
  "assistant_coach",
  "admin",
  "owner",
];

export const COACH_STAFF_ROLE_SET = new Set(COACH_STAFF_ROLE_LIST);

export const ATTENDANCE_EVENT_TYPES = new Set([
  "practice",
  "game",
  "meeting",
  "film_session",
  "conditioning",
  "other",
]);

export const ATTENDANCE_STATUSES = new Set([
  "present",
  "absent",
  "late",
  "excused",
]);
