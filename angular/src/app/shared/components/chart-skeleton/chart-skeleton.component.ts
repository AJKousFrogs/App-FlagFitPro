/**
 * Chart Skeleton Component
 * ========================
 * Displays a loading skeleton while chart data is being fetched
 * Improves perceived performance by showing UI structure immediately
 */

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
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
        @if (type() === 'line' || type() === 'bar') {
          <!-- Line/Bar chart skeleton -->
          <div class="skeleton-y-axis">
            @for (tick of [0,1,2,3,4]; track tick) {
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
        } @else if (type() === 'pie' || type() === 'doughnut') {
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
  styles: [`
    .chart-skeleton {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 200px;
      padding: var(--space-3);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    /* Header */
    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .skeleton-title {
      width: 150px;
      height: 20px;
      background: var(--surface-border);
      border-radius: var(--radius-sm);
    }

    .skeleton-legend {
      display: flex;
      gap: var(--space-2);
    }

    .skeleton-legend-item {
      width: 60px;
      height: 16px;
      background: var(--surface-border);
      border-radius: var(--radius-sm);
    }

    /* Chart Area */
    .skeleton-chart-area {
      flex: 1;
      display: flex;
      align-items: flex-end;
      position: relative;
      min-height: 150px;
    }

    /* Line/Bar Chart */
    .skeleton-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 30px;
      height: 100%;
      margin-right: var(--space-2);
    }

    .skeleton-y-tick {
      width: 20px;
      height: 2px;
      background: var(--surface-border);
    }

    .skeleton-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
      height: 100%;
    }

    .skeleton-bar {
      flex: 1;
      background: linear-gradient(
        to top,
        var(--ds-primary-green-subtle),
        var(--surface-border)
      );
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      min-height: 20px;
      animation: shimmer 2s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.6;
      }
    }

    .skeleton-x-axis {
      position: absolute;
      bottom: -25px;
      left: 35px;
      right: 0;
      display: flex;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .skeleton-x-label {
      flex: 1;
      height: 12px;
      background: var(--surface-border);
      border-radius: var(--radius-sm);
    }

    /* Pie Chart */
    .skeleton-pie {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .skeleton-pie-center {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(
        var(--ds-primary-green-subtle) 0deg 90deg,
        var(--surface-border) 90deg 180deg,
        var(--ds-primary-blue-subtle) 180deg 270deg,
        var(--surface-border) 270deg 360deg
      );
      animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Generic */
    .skeleton-generic {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .skeleton-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--surface-border);
      border-top-color: var(--ds-primary-green);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Footer */
    .skeleton-footer {
      margin-top: var(--space-3);
      padding-top: var(--space-2);
      border-top: 1px solid var(--surface-border);
    }

    .skeleton-footer-text {
      width: 200px;
      height: 14px;
      background: var(--surface-border);
      border-radius: var(--radius-sm);
    }

    /* Dark mode support */
    :host-context(.dark) {
      .skeleton-title,
      .skeleton-legend-item,
      .skeleton-y-tick,
      .skeleton-x-label,
      .skeleton-footer-text {
        background: rgba(255, 255, 255, 0.1);
      }

      .skeleton-bar {
        background: linear-gradient(
          to top,
          rgba(16, 185, 129, 0.2),
          rgba(255, 255, 255, 0.1)
        );
      }
    }
  `]
})
export class ChartSkeletonComponent {
  // Angular 21: Use input() signals instead of @Input()
  type = input<'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea'>('line');
  height = input<string>('300px');

  // Generate random bar heights for skeleton
  bars = Array.from({ length: 8 }, () => Math.random() * 60 + 20);
}
