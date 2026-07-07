import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { STAFF_ROLES } from "../guards/staff.guard";
import { TeamRole } from "./team-membership.service";

/**
 * Resolves the post-login home route from the user's role: staff/coaches →
 * `/staff`, everyone else → `/today`. Staff detection reuses the guard's
 * `STAFF_ROLES` (single source of truth; the guard also safely bounces any
 * non-staff back to `/today`). Previously returned legacy routes —
 * `/todays-practice`, `/coach/dashboard`, `/superadmin` — that no longer exist,
 * so every login silently fell through the router catch-all to `/today`.
 */
@Injectable({
  providedIn: "root",
})
export class HomeRouteService {
  private readonly supabase = inject(SupabaseService);

  getHomeRoute(): string {
    return this.getHomeRouteForUser(this.supabase.currentUser());
  }

  getHomeRouteForUser(
    user: {
      role?: string | null;
      user_metadata?: { role?: string } | null;
    } | null,
  ): string {
    const role = user?.role ?? user?.user_metadata?.role;
    return this.getHomeRouteForRole(role);
  }

  getHomeRouteForRole(role: string | null | undefined): string {
    return role != null && STAFF_ROLES.has(role as TeamRole)
      ? "/staff"
      : "/today";
  }
}
