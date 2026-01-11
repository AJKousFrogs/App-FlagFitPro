import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";

/**
 * Dashboard Switcher
 * Role-based redirection to the appropriate dashboard
 * - Coaches/Staff go to /coach/dashboard
 * - Players/Athletes go to /player-dashboard
 *
 * Checks both auth user_metadata.role AND users table user_type
 * to ensure proper routing after onboarding
 *
 * UX Audit Fix #2: Added role-aware loading message
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent, CommonModule],
  template: `
    <app-loading [visible]="true" [message]="loadingMessage()"></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  loadingMessage = signal("Redirecting...");

  async ngOnInit(): Promise<void> {
    const user = this.authService.getUser();

    if (!user) {
      this.router.navigate(["/login"], { replaceUrl: true });
      return;
    }

    // Check auth metadata role first
    const authRole = user.role;

    // If auth metadata has a valid role, use it
    if (this.isCoachRole(authRole)) {
      this.loadingMessage.set("Loading your Coach Dashboard...");
      this.router.navigate(["/coach/dashboard"], { replaceUrl: true });
      return;
    }

    if (authRole === "player" || authRole === "athlete") {
      this.loadingMessage.set("Loading your Dashboard...");
      this.router.navigate(["/player-dashboard"], { replaceUrl: true });
      return;
    }

    // Fallback: Check users table for user_type (for users who completed onboarding)
    // This handles cases where auth metadata wasn't updated properly
    try {
      const { data: userData } = await this.supabaseService.client
        .from("users")
        .select("user_type, staff_role")
        .eq("id", user.id)
        .maybeSingle();

      if (userData) {
        if (userData.user_type === "staff") {
          this.loadingMessage.set("Loading your Coach Dashboard...");
          this.router.navigate(["/coach/dashboard"], { replaceUrl: true });
          return;
        } else if (userData.user_type === "player") {
          this.loadingMessage.set("Loading your Dashboard...");
          this.router.navigate(["/player-dashboard"], { replaceUrl: true });
          return;
        }
      }
    } catch {
      // If lookup fails, fall through to default
    }

    // Default: Player dashboard for unset roles
    this.loadingMessage.set("Loading your Dashboard...");
    this.router.navigate(["/player-dashboard"], { replaceUrl: true });
  }

  /**
   * Check if role is a coach/staff role
   */
  private isCoachRole(role: string | undefined): boolean {
    if (!role) return false;
    const coachRoles = [
      "coach",
      "head_coach",
      "assistant_coach",
      "admin",
      "offensive_coordinator",
      "defensive_coordinator",
      "strength_coach",
      "athletic_trainer",
      "team_manager",
    ];
    return coachRoles.includes(role);
  }
}
