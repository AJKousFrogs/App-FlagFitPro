import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";

/**
 * Dashboard Switcher
 * Role-based redirection to the appropriate dashboard
 * - Coaches go to /coach/dashboard
 * - Players/Athletes go to /player-dashboard
 * 
 * UX Audit Fix #2: Added role-aware loading message
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent, CommonModule],
  template: `
    <app-loading
      [visible]="true"
      [message]="loadingMessage()"
    ></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Dynamic loading message based on user role
  loadingMessage = (): string => {
    const user = this.authService.getUser();
    if (!user) return "Redirecting...";
    
    const role = user.role;
    if (role === "coach" || role === "assistant_coach" || role === "admin") {
      return "Loading your Coach Dashboard...";
    }
    return "Loading your Dashboard...";
  };

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (
      user?.role === "coach" ||
      user?.role === "assistant_coach" ||
      user?.role === "admin"
    ) {
      this.router.navigate(["/coach/dashboard"], { replaceUrl: true });
    } else {
      this.router.navigate(["/player-dashboard"], { replaceUrl: true });
    }
  }
}
