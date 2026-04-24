/**
 * Error Boundary Component
 *
 * Catches rendering errors in child components and displays a recovery UI
 * instead of a white screen. Prevents Friday testing crashes.
 *
 * Usage:
 * ```html
 * <app-error-boundary [componentName]="'Dashboard'">
 *   <app-dashboard></app-dashboard>
 * </app-error-boundary>
 * ```
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { ButtonComponent } from "../button/button.component";
import { GlobalErrorHandlerService } from "../../../core/services/global-error-handler.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { PageErrorStateComponent } from "../page-error-state/page-error-state.component";

@Component({
  selector: "app-error-boundary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CardShellComponent, PageErrorStateComponent],
  template: `
    @if (hasError()) {
      <div class="error-boundary-container">
        <app-card-shell class="error-boundary-card" [flush]="true">
          <div class="error-boundary-layout">
            <app-page-error-state
              class="error-boundary-state"
              titleTag="h2"
              title="This section hit a problem"
              [message]="errorMessage()"
              icon="pi-exclamation-triangle"
              [showRetry]="false"
              helpText="Try reloading this section or return home."
            ></app-page-error-state>
            @if (componentName()) {
              <p class="error-boundary-meta">Component: {{ componentName() }}</p>
            }
            <div class="error-boundary-actions">
              <app-button iconLeft="pi-refresh" (clicked)="retry()"
                >Try Again</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-home"
                (clicked)="goToHome()"
                >Go to Home</app-button
              >
            </div>
          </div>
        </app-card-shell>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styleUrl: "./error-boundary.component.scss",
})
export class ErrorBoundaryComponent {
  componentName = input<string>();

  private router = inject(Router);
  private homeRouteService = inject(HomeRouteService);
  private errorHandler = inject(GlobalErrorHandlerService);
  readonly homeRoute = computed(() => this.homeRouteService.getHomeRoute());

  hasError = signal(false);
  errorMessage = signal(
    "We couldn't load this section right now.",
  );

  /**
   * Called by parent components when they catch an error
   */
  setError(error: unknown): void {
    this.hasError.set(true);
    this.errorMessage.set(this.errorHandler.getUserFriendlyMessage(error));
    this.errorHandler.handleError(error);
  }

  /**
   * Reset error state and retry
   */
  retry(): void {
    this.hasError.set(false);
    this.errorMessage.set(
      "We couldn't load this section right now.",
    );
    // Force a re-render by navigating to the same route
    const currentUrl = this.router.url;
    this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }

  /**
   * Navigate to dashboard as fallback
   */
  goToHome(): void {
    this.hasError.set(false);
    this.router.navigateByUrl(this.homeRoute());
  }
}
