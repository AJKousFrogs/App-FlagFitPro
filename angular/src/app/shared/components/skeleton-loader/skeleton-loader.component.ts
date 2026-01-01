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
  standalone: true,
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
          <div class="skeleton skeleton-text" style="width: 50%"></div>
          <div class="skeleton skeleton-metric-value"></div>
          <div class="skeleton skeleton-text" style="width: 30%"></div>
        </div>
      }
      @case ("card") {
        <div class="skeleton-card" [style.animation-delay]="animationDelay()">
          <div class="skeleton skeleton-thumbnail" style="height: 160px"></div>
          <div class="skeleton-card-content">
            <div class="skeleton skeleton-title" style="width: 70%"></div>
            <div class="skeleton skeleton-text" style="width: 100%"></div>
            <div class="skeleton skeleton-text" style="width: 85%"></div>
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
            class="skeleton skeleton-title"
            style="width: 40%; margin-bottom: var(--space-4)"
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
            <div
              class="skeleton skeleton-avatar"
              style="width: 40px; height: 40px"
            ></div>
            <div class="skeleton skeleton-text" style="width: 60%"></div>
          </div>
          <div class="skeleton skeleton-stat-value"></div>
          <div class="skeleton skeleton-text" style="width: 40%"></div>
        </div>
      }
      @case ("workout-card") {
        <div
          class="skeleton-workout-card"
          [style.animation-delay]="animationDelay()"
        >
          <div class="workout-header">
            <div
              class="skeleton skeleton-avatar"
              style="width: 48px; height: 48px"
            ></div>
            <div class="workout-info">
              <div class="skeleton skeleton-title" style="width: 70%"></div>
              <div class="skeleton skeleton-text" style="width: 50%"></div>
            </div>
          </div>
          <div class="skeleton skeleton-text" style="width: 100%"></div>
          <div class="skeleton skeleton-text" style="width: 80%"></div>
          <div class="workout-footer">
            <div class="skeleton skeleton-badge"></div>
            <div class="skeleton skeleton-text" style="width: 25%"></div>
          </div>
        </div>
      }
      @case ("player-card") {
        <div
          class="skeleton-player-card"
          [style.animation-delay]="animationDelay()"
        >
          <div
            class="skeleton skeleton-avatar"
            style="width: 80px; height: 80px"
          ></div>
          <div
            class="skeleton skeleton-title"
            style="width: 60%; margin: var(--space-3) auto 0"
          ></div>
          <div
            class="skeleton skeleton-text"
            style="width: 40%; margin: var(--space-2) auto 0"
          ></div>
          <div class="player-stats">
            @for (stat of [1, 2, 3]; track $index) {
              <div
                class="skeleton skeleton-text"
                style="width: 100%"
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
          <div
            class="skeleton skeleton-avatar"
            style="width: 44px; height: 44px"
          ></div>
          <div class="list-item-content">
            <div class="skeleton skeleton-text" style="width: 60%"></div>
            <div class="skeleton skeleton-text" style="width: 40%"></div>
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
          <div
            class="skeleton skeleton-avatar"
            style="width: 96px; height: 96px"
          ></div>
          <div class="profile-info">
            <div class="skeleton skeleton-title" style="width: 50%"></div>
            <div class="skeleton skeleton-text" style="width: 30%"></div>
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
            <div class="skeleton skeleton-title" style="width: 40%"></div>
            <div class="skeleton skeleton-button" style="width: 80px"></div>
          </div>
          <div class="widget-content">
            @for (row of [1, 2, 3, 4]; track $index) {
              <div
                class="skeleton-list-item"
                [style.animation-delay.ms]="$index * 75"
              >
                <div
                  class="skeleton skeleton-avatar"
                  style="width: 36px; height: 36px"
                ></div>
                <div class="list-item-content">
                  <div class="skeleton skeleton-text" style="width: 70%"></div>
                  <div class="skeleton skeleton-text" style="width: 45%"></div>
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
  styles: [
    `
      /* ================================
       BASE SKELETON STYLES
       ================================ */

      .skeleton {
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          90deg,
          var(--surface-secondary) 0%,
          var(--surface-tertiary) 50%,
          var(--surface-secondary) 100%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s ease-in-out infinite;
        border-radius: var(--radius-md);
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Premium shimmer overlay */
      .skeleton::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 100%
        );
        animation: skeleton-shine 2s ease-in-out infinite;
        animation-delay: inherit;
      }

      @keyframes skeleton-shine {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* ================================
       SKELETON VARIANTS
       ================================ */

      .skeleton-text {
        height: 14px;
        margin-bottom: var(--space-2);
        border-radius: var(--radius-sm);
      }

      .skeleton-title {
        height: 24px;
        margin-bottom: var(--space-3);
        border-radius: var(--radius-md);
      }

      .skeleton-avatar {
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-thumbnail {
        width: 100%;
        border-radius: var(--radius-lg);
      }

      .skeleton-button {
        height: 44px;
        border-radius: var(--radius-lg);
      }

      .skeleton-badge {
        width: 60px;
        height: 24px;
        border-radius: var(--radius-full);
      }

      .skeleton-stat-value {
        height: 48px;
        width: 100px;
        margin: var(--space-3) 0;
        border-radius: var(--radius-md);
      }

      .skeleton-metric-small {
        width: 60px;
        height: 32px;
        border-radius: var(--radius-md);
      }

      .skeleton-cell {
        height: 20px;
        border-radius: var(--radius-sm);
      }

      /* ================================
       COMPOUND SKELETONS
       ================================ */

      /* Metric Skeleton */
      .skeleton-metric {
        padding: var(--space-4);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
      }

      .skeleton-metric-value {
        height: 40px;
        width: 80px;
        margin: var(--space-2) 0;
      }

      /* Card Skeleton */
      .skeleton-card {
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        border: 1px solid var(--color-border-secondary);
        box-shadow: var(--shadow-sm);
      }

      .skeleton-card-content {
        padding: var(--space-5);
      }

      /* Table Row Skeleton */
      .skeleton-table-row {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border-secondary);
        background: var(--surface-primary);
      }

      /* Chart Skeleton */
      .skeleton-chart {
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
      }

      .chart-bars {
        display: flex;
        align-items: flex-end;
        gap: var(--space-2);
        height: 180px;
        padding-top: var(--space-4);
      }

      .chart-bar {
        flex: 1;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        min-height: 20px;
      }

      /* Stat Card Skeleton */
      .skeleton-stat-card {
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
      }

      .stat-card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      /* Workout Card Skeleton */
      .skeleton-workout-card {
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
      }

      .workout-header {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .workout-info {
        flex: 1;
      }

      .workout-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border-secondary);
      }

      /* Player Card Skeleton */
      .skeleton-player-card {
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
        text-align: center;
      }

      .skeleton-player-card .skeleton-avatar {
        margin: 0 auto;
      }

      .player-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border-secondary);
      }

      /* List Item Skeleton */
      .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border-secondary);
        background: var(--surface-primary);
      }

      .list-item-content {
        flex: 1;
        min-width: 0;
      }

      /* Paragraph Skeleton */
      .skeleton-paragraph {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      /* Profile Header Skeleton */
      .skeleton-profile-header {
        display: flex;
        gap: var(--space-5);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
      }

      .profile-info {
        flex: 1;
      }

      .profile-stats {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-4);
      }

      /* Dashboard Widget Skeleton */
      .skeleton-dashboard-widget {
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-border-secondary);
        overflow: hidden;
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border-secondary);
        background: var(--surface-secondary);
      }

      .widget-content {
        padding: 0;
      }

      /* ================================
       REDUCED MOTION
       ================================ */

      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
        }

        .skeleton::after {
          animation: none;
        }
      }

      /* ================================
       DARK MODE
       ================================ */

      :host-context([data-theme="dark"]),
      :host-context(.dark-theme) {
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--primitive-neutral-800) 0%,
            var(--primitive-neutral-700) 50%,
            var(--primitive-neutral-800) 100%
          );
        }

        .skeleton::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
        }
      }
    `,
  ],
})
export class SkeletonLoaderComponent {
  // Angular 21: Use input() signals
  variant = input<SkeletonVariant>("text");
  width = input<string>("100%");
  height = input<string>("20px");
  size = input<string>("40px");
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
  standalone: true,
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
  styles: [
    `
      .skeleton-repeat {
        display: flex;
        flex-direction: column;
      }

      .skeleton-repeat.horizontal {
        flex-direction: row;
        gap: var(--space-4);
      }

      .skeleton-repeat.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }
    `,
  ],
})
export class SkeletonRepeatComponent {
  variant = input<SkeletonVariant>("text");
  count = input<number>(3);
  width = input<string>("100%");
  height = input<string>("20px");
  size = input<string>("40px");
  columns = input<number[]>([1, 2, 1, 1]);
  staggerDelay = input<number>(75);
  layout = input<"vertical" | "horizontal" | "grid">("vertical");

  items = computed(() => Array(this.count()).fill(0));
  containerClass = computed(() =>
    this.layout() !== "vertical" ? this.layout() : "",
  );
}
