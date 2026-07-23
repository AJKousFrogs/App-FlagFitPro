import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import {
  TeamMembershipService,
  TeamRole,
} from "../services/team-membership.service";

export const STAFF_ROLES: ReadonlySet<TeamRole> = new Set<TeamRole>([
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "strength_conditioning_coach",
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "manager",
]);

export const COACH_ROLES: ReadonlySet<TeamRole> = new Set<TeamRole>([
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "strength_conditioning_coach",
  "manager",
]);

/** Resolve the staff "lane" from a team role — drives the role-aware shell + sections. */
export function staffLaneFor(
  role: TeamRole | null,
): "coach" | "physio" | "nutrition" | "psych" | null {
  if (!role) return null;
  if (role === "physiotherapist") return "physio";
  if (role === "nutritionist") return "nutrition";
  if (role === "psychologist") return "psych";
  if (COACH_ROLES.has(role)) return "coach";
  return null;
}

/**
 * TIER 1: the self-reported professional-profile route for a team role, one
 * per role (not per lane — staffLaneFor lumps head_coach/coach/manager/S&C
 * into one "coach" lane, but each has its own credential form and backend
 * table; see netlify/functions/staff-profile.js's ROLE_PROFILE_ROUTES).
 */
export function staffProfileRouteFor(role: TeamRole | null): string | null {
  switch (role) {
    case "physiotherapist":
      return "/staff/profile/physiotherapist";
    case "nutritionist":
      return "/staff/profile/nutritionist";
    case "psychologist":
      return "/staff/profile/psychologist";
    case "strength_conditioning_coach":
      return "/staff/profile/strength-coach";
    case "head_coach":
      return "/staff/profile/head-coach";
    case "manager":
      return "/staff/profile/manager";
    case "coach":
    case "offense_coordinator":
    case "defense_coordinator":
    case "assistant_coach":
      return "/staff/profile/coach";
    default:
      return null;
  }
}

/** Gate the /staff routes: staff roles only; players bounce to the athlete app. */
export const staffGuard: CanActivateFn = async () => {
  const membership = inject(TeamMembershipService);
  const router = inject(Router);
  await membership.loadMembership();
  const role = membership.role();
  return role && STAFF_ROLES.has(role)
    ? true
    : router.createUrlTree(["/today"]);
};

/**
 * Root ("/") redirect: staff → the staff shell, everyone else → the athlete app.
 * The role lives in team_members (not the auth user object), so a static
 * `redirectTo` can't decide this — a coach hitting the bare root would otherwise
 * land on the athlete /today. Any load failure falls back to /today.
 */
export const homeRedirectGuard: CanActivateFn = async () => {
  const membership = inject(TeamMembershipService);
  const router = inject(Router);
  let role: TeamRole | null = null;
  try {
    await membership.loadMembership();
    role = membership.role();
  } catch {
    role = null;
  }
  return role && STAFF_ROLES.has(role)
    ? router.createUrlTree(["/staff"])
    : router.createUrlTree(["/today"]);
};
