/**
 * Page Loading State Component
 *
 * Displays a consistent loading state for page-level components.
 * Prevents layout shifts and provides user feedback during data loading.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: "app-page-loading-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressSpinnerModule, SkeletonModule],
  template: `
    <div class="loading-state-container" role="status" aria-live="polite">
      @if (variant === "spinner") {
        <p-progressSpinner
          [style]="{ width: '50px', height: '50px' }"
          strokeWidth="4"
          aria-label="Loading"
        ></p-progressSpinner>
        <p class="loading-message">{{ message }}</p>
      } @else {
        <!-- Skeleton variant for content-aware loading -->
        <div class="skeleton-layout">
          @if (showHeader) {
            <div class="skeleton-header">
              <p-skeleton width="200px" height="32px"></p-skeleton>
              <p-skeleton
                width="300px"
                height="20px"
                styleClass="mt-2"
              ></p-skeleton>
            </div>
          }
          @if (showCards) {
            <div class="skeleton-cards">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton-card">
                  <p-skeleton width="100%" height="120px"></p-skeleton>
                </div>
              }
            </div>
          }
          @if (showContent) {
            <div class="skeleton-content">
              <p-skeleton width="100%" height="200px"></p-skeleton>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .loading-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-10, 2.5rem);
        min-height: 300px;
      }

      .loading-message {
        margin-top: var(--space-4, 1rem);
        font-size: var(--font-body-md, 1rem);
        color: var(--text-secondary);
      }

      .skeleton-layout {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--space-6, 1.5rem);
      }

      .skeleton-header {
        display: flex;
        flex-direction: column;
        gap: var(--space-2, 0.5rem);
      }

      .skeleton-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4, 1rem);
      }

      .skeleton-card {
        border-radius: var(--p-border-radius, 8px);
        overflow: hidden;
      }

      .skeleton-content {
        border-radius: var(--p-border-radius, 8px);
        overflow: hidden;
      }
    `,
  ],
})
export class PageLoadingStateComponent {
  @Input() message = "Loading...";
  @Input() variant: "spinner" | "skeleton" = "spinner";
  @Input() showHeader = true;
  @Input() showCards = true;
  @Input() showContent = true;
}
