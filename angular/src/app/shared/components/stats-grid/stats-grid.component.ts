import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { formatNumber, formatStat } from "../../utils/format.utils";
import { CardShellComponent } from "../card-shell/card-shell.component";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  /** Icon type for predefined color schemes: 'primary' | 'error' | 'warning' | 'info' */
  iconType?: "primary" | "error" | "warning" | "info";
  /** Custom color CSS value (CSS variable or hex). Takes precedence over iconType. */
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardShellComponent, StatusTagComponent],
  template: `
    <section class="stats-overview" aria-label="Statistics">
      @for (stat of stats(); track trackByLabel($index, stat)) {
        <app-card-shell class="stat-card" [flush]="true">
          <div class="stat-card-content">
            @if (stat.icon) {
              <div [class]="'stat-icon ' + getIconClass(stat.iconType)">
                <i [class]="'pi ' + stat.icon"></i>
              </div>
            }
            <div class="stat-details">
              <span class="stat-block__value">{{ formatStatValue(stat) }}</span>
              <span class="stat-block__label">{{ stat.label }}</span>
            </div>
            @if (stat.trend) {
              <app-status-tag
                [value]="stat.trend"
                [severity]="getTrendSeverity(stat.trendType)"
                size="sm"
              />
            }
          </div>
        </app-card-shell>
      }
    </section>
  `,
  styleUrl: "./stats-grid.component.scss",
})
export class StatsGridComponent {
  stats = input<StatItem[]>([]);

  trackByLabel(index: number, item: StatItem): string {
    return item.label;
  }

  getIconClass(iconType?: string): string {
    const classes: Record<string, string> = {
      primary: "icon-primary",
      error: "icon-error",
      warning: "icon-warning",
      info: "icon-info",
    };
    return classes[iconType || "primary"] || "icon-primary";
  }

  getTrendSeverity(
    trendType?: string,
  ): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warning" | "danger" | "contrast"
    > = {
      positive: "success",
      negative: "danger",
      neutral: "info",
    };
    return severities[trendType || "neutral"] || "info";
  }

  formatStatValue(stat: StatItem): string {
    if (typeof stat.value === "string") {
      return stat.value;
    }

    if (!stat.formatType || stat.formatType === "none") {
      return formatNumber(stat.value, 0);
    }

    return formatStat(
      stat.value,
      stat.formatType as "number" | "percent" | "average",
    );
  }
}
