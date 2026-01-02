/**
 * Page Loading State Component
 *
 * Displays a consistent loading state for page-level components.
 * Prevents layout shifts and provides user feedback during data loading.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
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
      @if (variant() === "spinner") {
        <p-progressSpinner
          [style]="{ width: '50px', height: '50px' }"
          strokeWidth="4"
          aria-label="Loading"
        ></p-progressSpinner>
        <p class="loading-message">{{ message() }}</p>
      } @else {
        <!-- Skeleton variant for content-aware loading -->
        <div class="skeleton-layout">
          @if (showHeader()) {
            <div class="skeleton-header">
              <p-skeleton width="200px" height="32px"></p-skeleton>
              <p-skeleton
                width="300px"
                height="20px"
                styleClass="mt-2"
              ></p-skeleton>
            </div>
          }
          @if (showCards()) {
            <div class="skeleton-cards">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton-card">
                  <p-skeleton width="100%" height="120px"></p-skeleton>
                </div>
              }
            </div>
          }
          @if (showContent()) {
            <div class="skeleton-content">
              <p-skeleton width="100%" height="200px"></p-skeleton>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './page-loading-state.component.scss',
})
export class PageLoadingStateComponent {
  // Angular 21: Use input() signals instead of @Input()
  message = input<string>("Loading...");
  variant = input<"spinner" | "skeleton">("spinner");
  showHeader = input<boolean>(true);
  showCards = input<boolean>(true);
  showContent = input<boolean>(true);
}
