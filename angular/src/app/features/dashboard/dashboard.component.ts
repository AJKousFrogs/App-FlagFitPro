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
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { DashboardRoleService } from "./services/dashboard-role.service";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent, CommonModule],
  template: `
    <app-loading [visible]="true" [message]="loadingMessage()"></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardRoleService = inject(DashboardRoleService);
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

    // Fallback: Check team_members for staff role (user_type is in auth metadata, not users table)
    // This handles cases where auth metadata wasn't updated properly
    try {
      const { role } = await this.dashboardRoleService.getTeamMembershipRole(
        user.id,
      );

      if (role && this.isCoachRole(role)) {
        this.loadingMessage.set("Loading your Coach Dashboard...");
        this.router.navigate(["/coach/dashboard"], { replaceUrl: true });
        return;
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
