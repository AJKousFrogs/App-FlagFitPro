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
  Component,
  Input,
  signal,
  inject,
  ErrorHandler,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { GlobalErrorHandlerService } from "../../../core/services/global-error-handler.service";

@Component({
  selector: "app-error-boundary",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule],
  template: `
    @if (hasError()) {
      <div class="error-boundary-container">
        <p-card class="error-card">
          <div class="error-content">
            <div class="error-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="error-title">Something went wrong</h2>
            <p class="error-message">
              {{ errorMessage() }}
            </p>
            <p class="error-component" *ngIf="componentName">
              Component: {{ componentName }}
            </p>
            <div class="error-actions">
              <p-button
                label="Try Again"
                icon="pi pi-refresh"
                (onClick)="retry()"
                styleClass="p-button-primary"
              ></p-button>
              <p-button
                label="Go to Dashboard"
                icon="pi pi-home"
                (onClick)="goToDashboard()"
                [outlined]="true"
              ></p-button>
            </div>
            <p class="error-help">
              If this problem persists, please contact support.
            </p>
          </div>
        </p-card>
      </div>
    } @else {
      <ng-content></ng-content>
    }
  `,
  styleUrl: './error-boundary.component.scss',
})
export class ErrorBoundaryComponent {
  @Input() componentName?: string;

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
