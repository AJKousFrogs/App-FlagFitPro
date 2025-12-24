import {
  Component,
  input,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Tabs } from "primeng/tabs";
import { expandCollapse } from "../../animations/app.animations";
import { StatItem } from "../stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../config/chart.config";
import { LoggerService } from "../../../core/services/logger.service";

export interface ProgressiveStatItem extends StatItem {
  id: string;
  trendData?: any;
  breakdownData?: any;
  benchmarkData?: any;
}

@Component({
  selector: "app-progressive-stats",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    Tabs,
  ],
  template: `
    <div class="progressive-stats">
      <!-- Level 1: Overview Cards -->
      <div class="stats-overview">
        @for (stat of stats(); track trackByStatId($index, stat)) {
          <div
            class="stat-card"
            (click)="expandStat(stat.id)"
            [class.expanded]="expandedStat() === stat.id"
          >
            <div class="stat-header">
              <div class="stat-header-left">
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
                  <h4 class="stat-title">{{ stat.label }}</h4>
                  <div class="stat-value">{{ stat.value }}</div>
                  @if (stat.trend) {
                    <div class="stat-trend">
                      <p-tag
                        [value]="stat.trend"
                        [severity]="getTrendSeverity(stat.trendType)"
                        size="small"
                      >
                      </p-tag>
                    </div>
                  }
                </div>
              </div>
              <i
                class="pi expand-icon"
                [class.pi-chevron-down]="expandedStat() !== stat.id"
                [class.pi-chevron-up]="expandedStat() === stat.id"
              ></i>
            </div>

            <!-- Level 2: Expanded Details (Progressive Disclosure) -->
            @if (expandedStat() === stat.id) {
              <div class="stat-details" [@expandCollapse]>
                <!-- Level 3: Deep Dive Charts -->
                @if (showDeepDive() === stat.id && hasChartData(stat)) {
                  <p-tabView class="stat-tabs">
                    <p-tabpanel header="Trends" leftIcon="pi pi-chart-line">
                      @if (stat.trendData) {
                        <div class="chart-container">
                          <p-chart
                            [type]="'line'"
                            [data]="stat.trendData"
                            [options]="chartOptions()"
                          ></p-chart>
                        </div>
                      } @else {
                        <div class="no-data">No trend data available</div>
                      }
                    </p-tabpanel>

                    <p-tabpanel header="Breakdown" leftIcon="pi pi-pie-chart">
                      @if (stat.breakdownData) {
                        <div class="chart-container">
                          <p-chart
                            [type]="'doughnut'"
                            [data]="stat.breakdownData"
                            [options]="chartOptions()"
                          ></p-chart>
                        </div>
                      } @else {
                        <div class="no-data">No breakdown data available</div>
                      }
                    </p-tabpanel>

                    <p-tabpanel header="Benchmarks" leftIcon="pi pi-flag">
                      @if (stat.benchmarkData) {
                        <div class="benchmark-container">
                          @for (
                            benchmark of stat.benchmarkData;
                            track benchmark.label
                          ) {
                            <div class="benchmark-item">
                              <div class="benchmark-label">
                                {{ benchmark.label }}
                              </div>
                              <div class="benchmark-value">
                                {{ benchmark.value }}
                              </div>
                              <div class="benchmark-comparison">
                                <p-tag
                                  [value]="benchmark.comparison"
                                  [severity]="
                                    getComparisonSeverity(benchmark.comparison)
                                  "
                                  size="small"
                                >
                                </p-tag>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="no-data">No benchmark data available</div>
                      }
                    </p-tabpanel>
                  </p-tabView>
                }

                <div class="action-buttons">
                  <p-button
                    label="Deep Dive"
                    icon="pi pi-search-plus"
                    [text]="true"
                    (onClick)="toggleDeepDive(stat.id)"
                    [disabled]="!hasChartData(stat)"
                  >
                  </p-button>

                  <p-button
                    label="Set Goal"
                    icon="pi pi-flag"
                    [outlined]="true"
                    (onClick)="setGoal(stat)"
                  >
                  </p-button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .progressive-stats {
        margin-bottom: var(--space-6);
      }

      .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-4);
      }

      .stat-card {
        background: var(--surface-primary);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        padding: var(--space-5);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .stat-card.expanded {
        border-color: var(--color-brand-primary);
        box-shadow: 0 4px 16px rgba(8, 153, 73, 0.15);
      }

      .stat-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .stat-header-left {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        flex: 1;
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
        min-width: 0;
      }

      .stat-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin: 0 0 var(--space-2) 0;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
        line-height: 1.2;
      }

      .stat-trend {
        margin-top: var(--space-2);
      }

      .expand-icon {
        color: var(--text-secondary);
        font-size: 1rem;
        transition: transform 0.3s ease;
        flex-shrink: 0;
      }

      .stat-card.expanded .expand-icon {
        color: var(--color-brand-primary);
      }

      .stat-details {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .stat-tabs {
        margin-bottom: var(--space-4);
      }

      .chart-container {
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .no-data {
        padding: var(--space-6);
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .benchmark-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .benchmark-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .benchmark-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .benchmark-value {
        font-weight: 600;
        color: var(--color-brand-primary);
      }

      .benchmark-comparison {
        margin-left: var(--space-2);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .stats-overview {
          grid-template-columns: 1fr;
        }

        .stat-value {
          font-size: 1.5rem;
        }

        .chart-container {
          height: 200px;
        }
      }
    `,
  ],
  animations: [expandCollapse],
})
export class ProgressiveStatsComponent {
  // Angular 21: Use input() signal instead of @Input()
  stats = input<ProgressiveStatItem[]>([]);
  chartOptions = input<any>(DEFAULT_CHART_OPTIONS);
  private logger = inject(LoggerService);

  expandedStat = signal<string | null>(null);
  showDeepDive = signal<string | null>(null);

  trackByStatId(index: number, stat: ProgressiveStatItem): string {
    return stat.id;
  }

  expandStat(statId: string): void {
    if (this.expandedStat() === statId) {
      this.expandedStat.set(null);
      this.showDeepDive.set(null);
    } else {
      this.expandedStat.set(statId);
    }
  }

  toggleDeepDive(statId: string): void {
    if (this.showDeepDive() === statId) {
      this.showDeepDive.set(null);
    } else {
      this.showDeepDive.set(statId);
    }
  }

  setGoal(stat: ProgressiveStatItem): void {
    this.logger.debug("Set goal for stat:", stat);
    // Implement goal setting logic
    // This could open a modal or navigate to a goal setting page
  }

  hasChartData(stat: ProgressiveStatItem): boolean {
    return !!(stat.trendData || stat.breakdownData || stat.benchmarkData);
  }

  getTrendSeverity(trendType?: string): string {
    const severities: Record<string, string> = {
      positive: "success",
      negative: "danger",
      neutral: "info",
    };
    return severities[trendType || "neutral"] || "info";
  }

  getComparisonSeverity(comparison: string): string {
    if (comparison.includes("above") || comparison.includes("better")) {
      return "success";
    } else if (comparison.includes("below") || comparison.includes("worse")) {
      return "danger";
    }
    return "info";
  }
}
