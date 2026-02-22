import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { ProgressBar } from "primeng/progressbar";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export interface LiveMetric {
  id: string;
  icon: string;
  currentValue: number;
  unit: string;
  progress: number;
  trend: {
    direction: "up" | "down" | "stable";
    text: string;
  };
}

interface LivePerformanceApiMetric {
  id?: string;
  metricId?: string;
  label?: string;
  icon?: string;
  value?: number;
  currentValue?: number;
  target?: number;
  goal?: number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
}

interface LivePerformanceApiResponse {
  metrics?: LivePerformanceApiMetric[];
}

@Component({
  selector: "app-live-performance-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Tag, StatusTagComponent, ProgressBar],
  template: `
    <p-card header="Live Performance Tracking">
      <div class="performance-metrics-grid">
        @for (metric of liveMetrics(); track trackByMetricId($index, metric)) {
          <div class="metric-card">
            <div class="metric-icon">
              <i [class]="metric.icon"></i>
            </div>
            <div class="metric-value">
              <span class="current-value">{{
                metric.currentValue | number: "1.1-2"
              }}</span>
              <span class="unit">{{ metric.unit }}</span>
            </div>
            <div class="metric-trend">
              <app-status-tag
                [value]="metric.trend.text"
                [severity]="getTrendSeverity(metric.trend.direction)"
                [icon]="getTrendIcon(metric.trend.direction)"
                size="sm"
              />
            </div>
            <p-progressBar
              [value]="metric.progress"
              [showValue]="false"
              class="metric-progress"
            >
            </p-progressBar>
          </div>
        }
      </div>
    </p-card>
  `,
  styleUrl: "./live-performance-chart.component.scss",
})
export class LivePerformanceChartComponent implements OnInit {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  liveMetrics = signal<LiveMetric[]>([]);

  ngOnInit(): void {
    this.loadLiveMetrics();
  }

  private loadLiveMetrics(): void {
    this.apiService
      .get<LivePerformanceApiResponse>("/api/performance/metrics")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const metrics = response.data?.metrics;
          if (!Array.isArray(metrics)) {
            this.liveMetrics.set([]);
            return;
          }

          this.liveMetrics.set(
            metrics.map((metric) => {
              const value = Number(metric.value ?? metric.currentValue ?? 0);
              const target = Number(metric.target ?? metric.goal ?? 0);
              const progress =
                target > 0
                  ? Math.min(100, Math.round((value / target) * 100))
                  : 0;
              const trendDirection = metric.trend ?? "stable";

              return {
                id: metric.id || metric.metricId || metric.label || "",
                icon: metric.icon || "pi pi-chart-line",
                currentValue: value,
                unit: metric.unit || "",
                progress,
                trend: {
                  direction: trendDirection,
                  text: this.formatTrend(
                    trendDirection,
                    metric.trendValue ?? 0,
                  ),
                },
              };
            }),
          );
        },
        error: () => {
          this.logger.debug("Live performance metrics unavailable");
          this.liveMetrics.set([]);
        },
      });
  }

  private formatTrend(trend: "up" | "down" | "stable", value: number): string {
    if (trend === "stable") {
      return "Stable";
    }
    const sign = trend === "up" ? "+" : "-";
    return `${sign}${value.toFixed(1)}%`;
  }

  getTrendSeverity(
    trend: "up" | "down" | "stable",
  ): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" {
    switch (trend) {
      case "up":
        return "success";
      case "down":
        return "danger";
      default:
        return "info";
    }
  }

  getTrendIcon(trend: "up" | "down" | "stable"): string {
    switch (trend) {
      case "up":
        return "pi pi-arrow-up";
      case "down":
        return "pi pi-arrow-down";
      default:
        return "pi pi-minus";
    }
  }

  trackByMetricId(index: number, metric: LiveMetric): string {
    return metric.id;
  }
}
