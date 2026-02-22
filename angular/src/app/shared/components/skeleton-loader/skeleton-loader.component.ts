import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type SkeletonVariant =
  | "text"
  | "title"
  | "avatar"
  | "thumbnail"
  | "block"
  | "card"
  | "table-row"
  | "chart"
  | "stat-card"
  | "workout-card"
  | "player-card"
  | "list-item"
  | "paragraph"
  | "button"
  | "badge"
  | "metric"
  | "profile-header"
  | "dashboard-widget";

/**
 * Skeleton Loader Component - Angular 21 Premium Edition
 *
 * Premium skeleton loading states with smooth animations
 * Uses Angular 21 signals for reactive state management
 * Features:
 * - Shimmer animation effect
 * - Multiple variants for different content types
 * - Stagger animation support
 * - Dark mode compatible
 */
@Component({
  selector: "app-skeleton-loader",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @switch (variant()) {
      @case ("text") {
        <div
          class="skeleton skeleton-text"
          [style.width]="width()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("title") {
        <div
          class="skeleton skeleton-title"
          [style.width]="width()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("avatar") {
        <div
          class="skeleton skeleton-avatar"
          [style.width]="size()"
          [style.height]="size()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("thumbnail") {
        <div
          class="skeleton skeleton-thumbnail"
          [style.width]="width()"
          [style.height]="height()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("block") {
        <div
          class="skeleton skeleton-block"
          [style.width]="width()"
          [style.height]="height()"
          [style.border-radius]="borderRadius()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("button") {
        <div
          class="skeleton skeleton-button"
          [style.width]="width()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("badge") {
        <div
          class="skeleton skeleton-badge"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
      @case ("metric") {
        <div class="skeleton-metric" [style.animation-delay]="animationDelay()">
          <div class="skeleton skeleton-text skeleton-w-50"></div>
          <div class="skeleton skeleton-metric-value"></div>
          <div class="skeleton skeleton-text skeleton-w-30"></div>
        </div>
      }
      @case ("card") {
        <div class="skeleton-card" [style.animation-delay]="animationDelay()">
          <div class="skeleton skeleton-thumbnail skeleton-h-thumb"></div>
          <div class="skeleton-card-content">
            <div class="skeleton skeleton-title skeleton-w-70"></div>
            <div class="skeleton skeleton-text skeleton-w-100"></div>
            <div class="skeleton skeleton-text skeleton-w-85"></div>
          </div>
        </div>
      }
      @case ("table-row") {
        <div
          class="skeleton-table-row"
          [style.animation-delay]="animationDelay()"
        >
          @for (col of columns(); track $index) {
            <div
              class="skeleton skeleton-cell"
              [style.flex]="col"
              [style.animation-delay.ms]="$index * 50"
            ></div>
          }
        </div>
      }
      @case ("chart") {
        <div class="skeleton-chart" [style.animation-delay]="animationDelay()">
          <div
            class="skeleton skeleton-title skeleton-w-40 skeleton-mb-4"
          ></div>
          <div class="chart-bars">
            @for (bar of chartBars; track $index) {
              <div
                class="skeleton chart-bar"
                [style.height.%]="bar"
                [style.animation-delay.ms]="$index * 75"
              ></div>
            }
          </div>
        </div>
      }
      @case ("stat-card") {
        <div
          class="skeleton-stat-card"
          [style.animation-delay]="animationDelay()"
        >
          <div class="stat-card-header">
            <div class="skeleton skeleton-avatar skeleton-avatar--md"></div>
            <div class="skeleton skeleton-text skeleton-w-60"></div>
          </div>
          <div class="skeleton skeleton-stat-value"></div>
          <div class="skeleton skeleton-text skeleton-w-40"></div>
        </div>
      }
      @case ("workout-card") {
        <div
          class="skeleton-workout-card"
          [style.animation-delay]="animationDelay()"
        >
          <div class="workout-header">
            <div class="skeleton skeleton-avatar skeleton-avatar--lg"></div>
            <div class="workout-info">
              <div class="skeleton skeleton-title skeleton-w-70"></div>
              <div class="skeleton skeleton-text skeleton-w-50"></div>
            </div>
          </div>
          <div class="skeleton skeleton-text skeleton-w-100"></div>
          <div class="skeleton skeleton-text skeleton-w-80"></div>
          <div class="workout-footer">
            <div class="skeleton skeleton-badge"></div>
            <div class="skeleton skeleton-text skeleton-w-25"></div>
          </div>
        </div>
      }
      @case ("player-card") {
        <div
          class="skeleton-player-card"
          [style.animation-delay]="animationDelay()"
        >
          <div class="skeleton skeleton-avatar skeleton-avatar--space-20"></div>
          <div
            class="skeleton skeleton-title skeleton-w-60 skeleton-mt-3 skeleton-center"
          ></div>
          <div
            class="skeleton skeleton-text skeleton-w-40 skeleton-mt-2 skeleton-center"
          ></div>
          <div class="player-stats">
            @for (stat of [1, 2, 3]; track $index) {
              <div
                class="skeleton skeleton-text skeleton-w-100"
                [style.animation-delay.ms]="$index * 100"
              ></div>
            }
          </div>
        </div>
      }
      @case ("list-item") {
        <div
          class="skeleton-list-item"
          [style.animation-delay]="animationDelay()"
        >
          <div class="skeleton skeleton-avatar skeleton-avatar--md"></div>
          <div class="list-item-content">
            <div class="skeleton skeleton-text skeleton-w-60"></div>
            <div class="skeleton skeleton-text skeleton-w-40"></div>
          </div>
          <div class="skeleton skeleton-badge"></div>
        </div>
      }
      @case ("paragraph") {
        <div
          class="skeleton-paragraph"
          [style.animation-delay]="animationDelay()"
        >
          @for (line of paragraphLines; track $index) {
            <div
              class="skeleton skeleton-text"
              [style.width]="line + '%'"
              [style.animation-delay.ms]="$index * 50"
            ></div>
          }
        </div>
      }
      @case ("profile-header") {
        <div
          class="skeleton-profile-header"
          [style.animation-delay]="animationDelay()"
        >
          <div class="skeleton skeleton-avatar skeleton-avatar--space-24"></div>
          <div class="profile-info">
            <div class="skeleton skeleton-title skeleton-w-50"></div>
            <div class="skeleton skeleton-text skeleton-w-30"></div>
            <div class="profile-stats">
              @for (stat of [1, 2, 3]; track $index) {
                <div class="skeleton skeleton-metric-small"></div>
              }
            </div>
          </div>
        </div>
      }
      @case ("dashboard-widget") {
        <div
          class="skeleton-dashboard-widget"
          [style.animation-delay]="animationDelay()"
        >
          <div class="widget-header">
            <div class="skeleton skeleton-title skeleton-w-40"></div>
            <div class="skeleton skeleton-button skeleton-w-space-20"></div>
          </div>
          <div class="widget-content">
            @for (row of [1, 2, 3, 4]; track $index) {
              <div
                class="skeleton-list-item"
                [style.animation-delay.ms]="$index * 75"
              >
                <div class="skeleton skeleton-avatar skeleton-avatar--sm"></div>
                <div class="list-item-content">
                  <div class="skeleton skeleton-text skeleton-w-70"></div>
                  <div class="skeleton skeleton-text skeleton-w-45"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }
      @default {
        <div
          class="skeleton"
          [style.width]="width()"
          [style.height]="height()"
          [style.animation-delay]="animationDelay()"
        ></div>
      }
    }
  `,
  styleUrl: "./skeleton-loader.component.scss",
})
export class SkeletonLoaderComponent {
  // Angular 21: Use input() signals
  variant = input<SkeletonVariant>("text");
  width = input<string>("100%");
  height = input<string>("var(--space-5)");
  size = input<string>("var(--icon-container-md)");
  borderRadius = input<string | undefined>(undefined);
  columns = input<number[]>([1, 2, 1, 1]);
  delay = input<number>(0);

  // Computed animation delay
  animationDelay = computed(() => `${this.delay()}ms`);

  // Random heights for chart bars
  chartBars = [65, 45, 80, 55, 90, 40, 75, 60, 85, 50];

  // Paragraph line widths
  paragraphLines = [100, 95, 90, 85, 70];
}

/**
 * Skeleton Repeat Component
 * Helper component for repeating skeletons with stagger animation
 */
@Component({
  selector: "app-skeleton-repeat",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="skeleton-repeat" [class]="containerClass()">
      @for (item of items(); track $index) {
        <app-skeleton-loader
          [variant]="variant()"
          [width]="width()"
          [height]="height()"
          [size]="size()"
          [columns]="columns()"
          [delay]="$index * staggerDelay()"
        />
      }
    </div>
  `,
  styleUrl: "./skeleton-loader.component.scss",
})
export class SkeletonRepeatComponent {
  variant = input<SkeletonVariant>("text");
  count = input<number>(3);
  width = input<string>("100%");
  height = input<string>("var(--space-5)");
  size = input<string>("var(--icon-container-md)");
  columns = input<number[]>([1, 2, 1, 1]);
  staggerDelay = input<number>(75);
  layout = input<"vertical" | "horizontal" | "grid">("vertical");

  items = computed(() => Array(this.count()).fill(0));
  containerClass = computed(() =>
    this.layout() !== "vertical" ? this.layout() : "",
  );
}
