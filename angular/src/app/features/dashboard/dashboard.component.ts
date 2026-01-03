import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";

/**
 * Dashboard Switcher
 * Role-based redirection to the appropriate primary entry point
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent],
  template: `
    <app-loading [visible]="true" message="Directing you to your dashboard..."></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getUser();
    
    if (user?.role === "coach") {
      this.router.navigate(["/coach/dashboard"], { replaceUrl: true });
    } else {
      this.router.navigate(["/today"], { replaceUrl: true });
    }
  }
}
