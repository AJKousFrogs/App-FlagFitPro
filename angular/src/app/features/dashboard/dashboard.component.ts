import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { HomeRouteService } from "../../core/services/home-route.service";

/**
 * Legacy dashboard switcher.
 * New entry points route directly to role-aware home destinations.
 */
@Component({
  selector: "app-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent],
  template: `
    <app-loading [visible]="true" [message]="loadingMessage()"></app-loading>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly homeRouteService = inject(HomeRouteService);

  loadingMessage = signal("Loading your home...");

  async ngOnInit(): Promise<void> {
    await this.router.navigateByUrl(this.homeRouteService.getHomeRoute(), {
      replaceUrl: true,
    });
  }
}
