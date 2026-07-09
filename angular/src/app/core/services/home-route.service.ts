import { Injectable } from "@angular/core";
import { STAFF_ROLES } from "../guards/staff.guard";
import { TeamRole } from "./team-membership.service";

/**
 * Resolves the post-login home route from the user's TEAM role: staff/coaches →
 * `/staff`, everyone else → `/today`. Staff detection reuses the guard's
 * `STAFF_ROLES` (single source of truth).
 *
 * IMPORTANT: the caller must pass the role from the authoritative source —
 * `team_members` (via TeamMembershipService), NOT the auth user object. An
 * earlier `getHomeRouteForUser(user)` helper read `user.role ??
 * user.user_metadata.role`, which is empty for team_members-based roles, so
 * every coach/physio was silently sent to the athlete `/today`. That helper was
 * removed to stop the trap from being reused; only the role-in role-out method
 * remains.
 */
@Injectable({
  providedIn: "root",
})
export class HomeRouteService {
  getHomeRouteForRole(role: string | null | undefined): string {
    return role != null && STAFF_ROLES.has(role as TeamRole)
      ? "/staff"
      : "/today";
  }
}
