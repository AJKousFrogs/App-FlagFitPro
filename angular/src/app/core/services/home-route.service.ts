import { Injectable, inject } from "@angular/core";
import { isCoachNavigationRole } from "../navigation/app-navigation.config";
import { SupabaseService } from "./supabase.service";

@Injectable({
  providedIn: "root",
})
export class HomeRouteService {
  private readonly supabase = inject(SupabaseService);

  getHomeRoute(): string {
    return this.getHomeRouteForUser(this.supabase.currentUser());
  }

  getHomeRouteForUser(
    user: { role?: string | null; user_metadata?: { role?: string } | null } | null,
  ): string {
    const role = user?.role ?? user?.user_metadata?.role;
    return this.getHomeRouteForRole(role);
  }

  getHomeRouteForRole(role: string | null | undefined): string {
    if (role === "superadmin") {
      return "/superadmin";
    }

    return isCoachNavigationRole(role ?? undefined)
      ? "/coach/dashboard"
      : "/todays-practice";
  }
}
