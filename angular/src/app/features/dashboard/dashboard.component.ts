import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";

/**
 * Dashboard Switcher
 * Role-based redirection to the appropriate dashboard
 * - Coaches go to /coach/dashboard
 * - Players/Athletes go to /player-dashboard
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent],
  template: `
    <app-loading
      [visible]="true"
      message="Directing you to your dashboard..."
    ></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

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
