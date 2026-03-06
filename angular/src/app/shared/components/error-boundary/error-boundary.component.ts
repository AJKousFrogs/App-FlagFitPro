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
  inject,
  input,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { ButtonComponent } from "../button/button.component";
import { Card } from "primeng/card";
import { GlobalErrorHandlerService } from "../../../core/services/global-error-handler.service";
import { PageErrorStateComponent } from "../page-error-state/page-error-state.component";

@Component({
  selector: "app-error-boundary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ButtonComponent, PageErrorStateComponent],
  template: `
    @if (hasError()) {
      <div class="error-boundary-container">
        <p-card class="error-boundary-card">
          <div class="error-boundary-layout">
            <app-page-error-state
              class="error-boundary-state"
              titleTag="h2"
              title="Something went wrong"
              [message]="errorMessage()"
              icon="pi-exclamation-triangle"
              [showRetry]="false"
              helpText="If this problem persists, please contact support."
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
                (clicked)="goToDashboard()"
                >Go to Dashboard</app-button
              >
            </div>
          </div>
        </p-card>
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
  private errorHandler = inject(GlobalErrorHandlerService);

  hasError = signal(false);
  errorMessage = signal(
    "An unexpected error occurred while loading this component.",
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
      "An unexpected error occurred while loading this component.",
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
  goToDashboard(): void {
    this.hasError.set(false);
    this.router.navigate(["/dashboard"]);
  }
}
