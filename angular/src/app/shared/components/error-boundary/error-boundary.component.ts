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
  styles: [
    `
      .error-boundary-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: var(--space-6);
      }

      .error-card {
        max-width: 500px;
        width: 100%;
      }

      .error-content {
        text-align: center;
        padding: var(--space-6);
      }

      .error-icon {
        font-size: 4rem;
        color: var(--color-status-warning, #f59e0b);
        margin-bottom: var(--space-4);
      }

      .error-title {
        font-size: var(--font-heading-lg, 1.5rem);
        font-weight: var(--font-weight-bold, 700);
        color: var(--text-primary);
        margin: 0 0 var(--space-3) 0;
      }

      .error-message {
        font-size: var(--font-body-md, 1rem);
        color: var(--text-secondary);
        margin: 0 0 var(--space-2) 0;
        line-height: 1.5;
      }

      .error-component {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-muted);
        margin: 0 0 var(--space-6) 0;
        font-family: monospace;
      }

      .error-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        margin-bottom: var(--space-4);
      }

      .error-help {
        font-size: var(--font-body-xs, 0.75rem);
        color: var(--text-muted);
        margin: 0;
      }

      @media (max-width: 640px) {
        .error-actions {
          flex-direction: column;
        }
      }
    `,
  ],
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
