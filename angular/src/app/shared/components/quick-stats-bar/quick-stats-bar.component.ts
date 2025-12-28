/**
 * Quick Stats Bar Component
 *
 * A compact horizontal stats display for dashboards and headers.
 * Perfect for showing key metrics at a glance.
 *
 * Features:
 * - Horizontal scrollable on mobile
 * - Animated value changes
 * - Color-coded status
 * - Trend indicators
 * - Responsive layout
 *
 * @example
 * <app-quick-stats-bar
 *   [stats]="[
 *     { label: 'Readiness', value: 85, unit: '%', status: 'success' },
 *     { label: 'ACWR', value: 1.2, status: 'warning' },
 *     { label: 'Sleep', value: 7.5, unit: 'hrs', status: 'success' }
 *   ]"
 * />
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface QuickStat {
  label: string;
  value: number | string;
  unit?: string;
  icon?: string;
  status?: "success" | "warning" | "danger" | "info" | "neutral";
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  tooltip?: string;
}

@Component({
  selector: "app-quick-stats-bar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="quick-stats-bar"
      [class]="'variant-' + variant()"
      [class.compact]="compact()"
      role="region"
      aria-label="Quick statistics"
    >
      <div class="stats-container">
        @for (stat of stats(); track stat.label) {
          <div
            class="stat-item"
            [class]="'status-' + (stat.status || 'neutral')"
            [title]="stat.tooltip || ''"
          >
            <!-- Icon -->
            @if (stat.icon) {
              <div class="stat-icon">
                <i [class]="'pi ' + stat.icon"></i>
              </div>
            }

            <!-- Content -->
            <div class="stat-content">
              <div class="stat-value-row">
                <span class="stat-value">
                  {{ formatValue(stat.value) }}
                </span>
                @if (stat.unit) {
                  <span class="stat-unit">{{ stat.unit }}</span>
                }
                @if (stat.trend) {
                  <span class="stat-trend" [class]="'trend-' + stat.trend">
                    <i [class]="'pi ' + getTrendIcon(stat.trend)"></i>
                    @if (stat.trendValue) {
                      <span>{{ stat.trendValue }}</span>
                    }
                  </span>
                }
              </div>
              <span class="stat-label">{{ stat.label }}</span>
            </div>

            <!-- Status indicator bar -->
            @if (showStatusBar()) {
              <div class="status-bar" [class]="'status-' + (stat.status || 'neutral')"></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .quick-stats-bar {
      width: 100%;
      overflow: hidden;
    }

    .stats-container {
      display: flex;
      gap: var(--space-1);
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      padding: var(--space-2);
    }

    .stats-container::-webkit-scrollbar {
      display: none;
    }

    /* Stat item */
    .stat-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--surface-primary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--p-surface-200);
      flex-shrink: 0;
      min-width: 120px;
      transition: all 0.2s ease;
    }

    .stat-item:hover {
      border-color: var(--color-brand-primary);
      box-shadow: var(--shadow-sm);
    }

    .compact .stat-item {
      padding: var(--space-2) var(--space-3);
      min-width: 100px;
    }

    /* Icon */
    .stat-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .compact .stat-icon {
      width: 28px;
      height: 28px;
      font-size: 0.875rem;
    }

    .status-success .stat-icon {
      background: var(--color-status-success-light);
      color: var(--color-status-success);
    }

    .status-warning .stat-icon {
      background: var(--color-status-warning-light);
      color: #92400e;
    }

    .status-danger .stat-icon {
      background: var(--color-status-error-light);
      color: var(--color-status-error);
    }

    .status-info .stat-icon {
      background: var(--color-status-info-light);
      color: var(--color-status-info);
    }

    .status-neutral .stat-icon {
      background: var(--p-surface-100);
      color: var(--text-secondary);
    }

    /* Content */
    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .stat-value {
      font-size: var(--font-heading-sm);
      font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .compact .stat-value {
      font-size: var(--font-body-md);
    }

    .stat-unit {
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-label {
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* Trend */
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: var(--font-body-xs);
      font-weight: 600;
      margin-left: var(--space-2);
    }

    .trend-up {
      color: var(--color-status-success);
    }

    .trend-down {
      color: var(--color-status-error);
    }

    .trend-stable {
      color: var(--text-tertiary);
    }

    /* Status bar */
    .status-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }

    .status-bar.status-success {
      background: var(--color-status-success);
    }

    .status-bar.status-warning {
      background: var(--color-status-warning);
    }

    .status-bar.status-danger {
      background: var(--color-status-error);
    }

    .status-bar.status-info {
      background: var(--color-status-info);
    }

    .status-bar.status-neutral {
      background: var(--p-surface-300);
    }

    /* Variants */
    .variant-default {
      background: transparent;
    }

    .variant-elevated {
      background: var(--surface-secondary);
      padding: var(--space-3);
      border-radius: var(--radius-xl);
    }

    .variant-elevated .stat-item {
      border: none;
      box-shadow: var(--shadow-sm);
    }

    .variant-glass {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      padding: var(--space-3);
      border-radius: var(--radius-xl);
    }

    .variant-glass .stat-item {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Responsive */
    @media (min-width: 768px) {
      .stats-container {
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .stat-item {
        flex: 1;
        min-width: 140px;
        max-width: 200px;
      }
    }

    @media (min-width: 1024px) {
      .stat-item {
        max-width: none;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .stat-item {
        transition: none;
      }
    }
  `],
})
export class QuickStatsBarComponent {
  // Inputs
  stats = input<QuickStat[]>([]);
  variant = input<"default" | "elevated" | "glass">("default");
  compact = input<boolean>(false);
  showStatusBar = input<boolean>(true);

  formatValue(value: number | string): string {
    if (typeof value === "string") return value;
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case "up":
        return "pi-arrow-up";
      case "down":
        return "pi-arrow-down";
      default:
        return "pi-minus";
    }
  }
}
