import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { ProgressSpinner } from "primeng/progressspinner";
import { SkeletonLoaderComponent } from "../skeleton-loader/skeleton-loader.component";

export type LoadingVariant = "spinner" | "skeleton" | "overlay" | "inline";

/**
 * Unified Loading Component - Angular 21 Premium Edition
 *
 * Unified loading indicator with spinner, skeleton, and overlay variants.
 * Uses Angular 21 signals and premium skeleton loaders.
 */
@Component({
  selector: "app-loading",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressSpinner, SkeletonLoaderComponent],
  template: `
    @if (visible()) {
      <div
        [class]="'loading-container ' + variant()"
        role="status"
        aria-live="polite"
        [attr.aria-busy]="visible()"
      >
        <!-- Overlay Variant -->
        @if (variant() === "overlay") {
          <div class="loading-overlay">
            <p-progressSpinner
              strokeWidth="4"
              fill="transparent"
              animationDuration=".5s"
              [class]="spinnerSizeClass()"
            ></p-progressSpinner>
            @if (message()) {
              <p class="loading-message">{{ message() }}</p>
            }
          </div>
        }

        <!-- Spinner/Inline Variant -->
        @if (variant() === "spinner" || variant() === "inline") {
          <div class="loading-spinner" [class.compact]="compact()">
            <p-progressSpinner
              strokeWidth="4"
              [class]="spinnerSizeClass()"
            ></p-progressSpinner>
            @if (message()) {
              <span class="loading-message-inline">{{ message() }}</span>
            }
          </div>
        }

        <!-- Skeleton Variant -->
        @if (variant() === "skeleton") {
          <div class="loading-skeleton">
            @if (skeletonVariant() === "dashboard-widget") {
              <app-skeleton-loader
                variant="dashboard-widget"
              ></app-skeleton-loader>
            } @else {
              <!-- Default structured skeleton -->
              <div class="skeleton-structure">
                <app-skeleton-loader
                  variant="title"
                  width="30%"
                  class="mb-4"
                ></app-skeleton-loader>
                <app-skeleton-loader
                  variant="card"
                  height="var(--size-200)"
                ></app-skeleton-loader>
                <div class="flex-row mt-6 gap-4">
                  <app-skeleton-loader
                    variant="avatar"
                    size="var(--icon-container-lg)"
                  ></app-skeleton-loader>
                  <div class="flex-grow">
                    <app-skeleton-loader
                      variant="text"
                      width="100%"
                      class="mb-2"
                    ></app-skeleton-loader>
                    <app-skeleton-loader
                      variant="text"
                      width="75%"
                    ></app-skeleton-loader>
                  </div>
                </div>
              </div>
            }
            @if (message()) {
              <p class="loading-message-skeleton">{{ message() }}</p>
            }
          </div>
        }
      </div>
    }
  `,
  styleUrl: "./loading.component.scss",
})
export class AppLoadingComponent {
  // Angular 21 Signals
  visible = input<boolean>(true);
  variant = input<LoadingVariant>("spinner");
  skeletonVariant = input<string>("default");
  message = input<string | null>(null);
  size = input<number>(50);
  compact = input<boolean>(false);

  spinnerSizeClass(): string {
    const value = this.size();
    if (value <= 40) return "spinner-size-sm";
    if (value <= 56) return "spinner-size-md";
    return "spinner-size-lg";
  }
}
