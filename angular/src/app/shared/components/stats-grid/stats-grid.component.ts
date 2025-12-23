import { Component, input, computed } from "@angular/core";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import {
  formatNumber,
  formatPercentage,
  formatAverage,
  formatStat,
} from "../../utils/format.utils";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  /**
   * Format type for automatic formatting
   * If provided, value will be formatted according to this type
   */
  formatType?: "percentage" | "average" | "whole" | "none";
  /**
   * Number of decimal places (for percentage and average types)
   */
  decimals?: number;
}

@Component({
  selector: "app-stats-grid",
  standalone: true,
  imports: [CardModule, TagModule],
  template: `
    <div class="stats-grid">
      @for (stat of stats(); track trackByLabel($index, stat)) {
        <p-card class="stat-card">
          <div class="stat-content">
            @if (stat.icon) {
              <div
                class="stat-icon"
                [style.background]="
                  (stat.color || 'var(--ds-primary-green)') + '20'
                "
                [style.color]="stat.color || 'var(--ds-primary-green)'"
              >
                <i [class]="'pi ' + stat.icon"></i>
              </div>
            }
            <div class="stat-info">
              <div class="stat-value">{{ formatStatValue(stat) }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              @if (stat.trend) {
                <div class="stat-trend">
                  <p-tag
                    [value]="stat.trend"
                    [severity]="getTrendSeverity(stat.trendType)"
                  >
                  </p-tag>
                </div>
              }
            </div>
          </div>
        </p-card>
      }
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-4px);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .stat-info {
        flex: 1;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .stat-trend {
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class StatsGridComponent {
  // Angular 21: Use input() signal instead of @Input()
  stats = input<StatItem[]>([]);

  trackByLabel(index: number, item: StatItem): string {
    return item.label;
  }

  getTrendSeverity(
    trendType?: string,
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warn" | "danger" | "contrast"
    > = {
      positive: "success",
      negative: "danger",
      neutral: "info",
    };
    return severities[trendType || "neutral"] || "info";
  }

  /**
   * Format stat value based on formatType
   * If formatType is provided, automatically formats the value
   * Otherwise, returns the value as-is (for pre-formatted strings)
   */
  formatStatValue(stat: StatItem): string {
    // If value is already a string, return as-is (pre-formatted)
    if (typeof stat.value === "string") {
      return stat.value;
    }

    // If no formatType specified, format as whole number
    if (!stat.formatType || stat.formatType === "none") {
      return formatNumber(stat.value, 0, true);
    }

    // Apply formatting based on formatType
    return formatStat(stat.value, stat.formatType, {
      decimals: stat.decimals,
      showZero: true,
    });
  }
}
