import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import {
  TeamMembershipService,
  TeamRole,
} from "../services/team-membership.service";

const STAFF_ROLES: ReadonlySet<TeamRole> = new Set<TeamRole>([
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
