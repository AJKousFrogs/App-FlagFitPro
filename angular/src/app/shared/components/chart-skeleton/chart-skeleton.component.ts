/**
 * Chart Skeleton Component
 * ========================
 * Displays a loading skeleton while chart data is being fetched
 * Improves perceived performance by showing UI structure immediately
 */

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
@Component({
  selector: "app-chart-skeleton",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="chart-skeleton" [style.height]="height()">
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-legend">
          <div class="skeleton-legend-item"></div>
          <div class="skeleton-legend-item"></div>
          <div class="skeleton-legend-item"></div>
        </div>
      </div>

      <div class="skeleton-chart-area">
        @if (type() === "line" || type() === "bar") {
          <!-- Line/Bar chart skeleton -->
          <div class="skeleton-y-axis">
            @for (tick of [0, 1, 2, 3, 4]; track tick) {
              <div class="skeleton-y-tick"></div>
            }
          </div>
          <div class="skeleton-bars">
            @for (bar of bars; track bar) {
              <div class="skeleton-bar" [style.height.%]="bar"></div>
            }
          </div>
          <div class="skeleton-x-axis">
            @for (label of bars; track label) {
              <div class="skeleton-x-label"></div>
            }
          </div>
        } @else if (type() === "pie" || type() === "doughnut") {
          <!-- Pie/Doughnut chart skeleton -->
          <div class="skeleton-pie">
            <div class="skeleton-pie-center"></div>
          </div>
        } @else {
          <!-- Generic skeleton -->
          <div class="skeleton-generic">
            <div class="skeleton-spinner"></div>
          </div>
        }
      </div>

      <div class="skeleton-footer">
        <div class="skeleton-footer-text"></div>
      </div>
    </div>
  `,
  styleUrl: "./chart-skeleton.component.scss",
})
export class ChartSkeletonComponent {
  type = input<"line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea">(
    "line",
  );
  height = input<string>("var(--chart-min-height-md)");

  // Generate random bar heights for skeleton
  bars = Array.from({ length: 8 }, () => Math.random() * 60 + 20);
}
