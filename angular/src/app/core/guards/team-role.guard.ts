import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { SupabaseService } from "../services/supabase.service";
import {
  TeamMembershipService,
  TeamRole,
} from "../services/team-membership.service";

function createTeamRoleGuard(
  allowedRoles: readonly TeamRole[],
  redirectTo = "/dashboard",
): CanActivateFn {
  return async (_route, state) => {
    const supabaseService = inject(SupabaseService);
    const teamMembershipService = inject(TeamMembershipService);
    const router = inject(Router);

    await supabaseService.waitForInit();

    const membership = await teamMembershipService.loadMembership();
    if (membership && allowedRoles.includes(membership.role)) {
      return true;
    }

    return router.createUrlTree([redirectTo], {
      queryParams: { returnUrl: state.url },
    });
  };
}

const COACH_ROUTE_ROLES: readonly TeamRole[] = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "manager",
];

const STAFF_ROUTE_ROLES: readonly TeamRole[] = [
  ...COACH_ROUTE_ROLES,
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "strength_conditioning_coach",
];

export const coachRoleGuard = createTeamRoleGuard(COACH_ROUTE_ROLES);
export const staffRoleGuard = createTeamRoleGuard(STAFF_ROUTE_ROLES);
