export const COACH_ROUTE_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "manager",
];

export const STAFF_ROUTE_ROLES = [
  ...COACH_ROUTE_ROLES,
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "strength_conditioning_coach",
];

export const TEAM_OPERATIONS_ROLES = [...COACH_ROUTE_ROLES];

export const HEALTH_DATA_ACCESS_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "strength_conditioning_coach",
];

export const NUTRITION_ACCESS_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "nutritionist",
];

export const PSYCHOLOGY_ACCESS_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "psychologist",
  "sports_psychologist",
];

export const PHYSIOTHERAPIST_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "physiotherapist",
];

export const LOAD_MANAGEMENT_ACCESS_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "strength_conditioning_coach",
];

export function hasAnyRole(role, allowedRoles) {
  return typeof role === "string" && allowedRoles.includes(role);
}
