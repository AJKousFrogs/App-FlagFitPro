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

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
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
                <span class="stat-block__value">
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
              <span class="stat-block__label">{{ stat.label }}</span>
            </div>

            <!-- Status indicator bar -->
            @if (showStatusBar()) {
              <div
                class="status-bar"
                [class]="'status-' + (stat.status || 'neutral')"
              ></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: "./quick-stats-bar.component.scss",
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
