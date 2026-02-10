import {
  Component,
  input,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { UIChart } from "primeng/chart";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { Knob } from "primeng/knob";
import { ProgressBar } from "primeng/progressbar";
import { Subject } from "rxjs";
import { COLORS } from "../../../core/constants/app.constants";
import { ApiService } from "../../../core/services/api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LoggerService } from "../../../core/services/logger.service";
import { STATUS_COLORS } from "../../../core/utils/design-tokens.util";

interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  target: number;
  color: string;
  tone: "success" | "warning" | "error" | "info";
  displayColor: string;
  icon: string;
}

@Component({
  selector: "app-performance-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    UIChart,
    Tag,
    StatusTagComponent,
    Knob,
    ProgressBar,
  ],
  template: `
    <div class="performance-dashboard">
      <div class="metrics-grid">
        @for (metric of metrics(); track trackByMetricId($index, metric)) {
          <p-card class="metric-card" [class]="'metric-' + metric.id">
            <div class="metric-header">
              <div class="metric-info">
                <i [class]="metric.icon" [ngClass]="'tone-' + metric.tone"></i>
                <h4>{{ metric.label }}</h4>
              </div>
              <app-status-tag
                [value]="formatTrend(metric.trend, metric.trendValue)"
                [severity]="getTrendSeverity(metric.trend)"
                [icon]="getTrendIcon(metric.trend)"
                size="sm"
              />
            </div>
            <div class="metric-visualization">
              <div class="metric-value-container">
                <p-knob
                  [ngModel]="metric.value"
                  [min]="0"
                  [max]="metric.target * 1.2"
                  [size]="120"
                  [strokeWidth]="8"
                  [valueColor]="metric.displayColor"
                  [rangeColor]="'var(--p-surface-200)'"
                  [readonly]="true"
                  [showValue]="false"
                >
                </p-knob>
                <div class="metric-overlay">
                  <span class="metric-value">{{ metric.value }}</span>
                  <span class="metric-unit">{{ metric.unit }}</span>
                </div>
              </div>
              <div class="metric-progress">
                <label>Progress to Goal</label>
                <p-progressBar
                  [value]="(metric.value / metric.target) * 100"
                  [showValue]="false"
                  [class]="'metric-progress tone-' + metric.tone"
                >
                </p-progressBar>
                <span class="progress-text">
                  {{ metric.value }} / {{ metric.target }} {{ metric.unit }}
                </span>
              </div>
            </div>
            <!-- Real-time mini chart -->
            <div class="metric-chart">
              <p-chart
                type="line"
                [data]="getMetricChartData(metric.id)"
                [options]="miniChartOptions"
                [width]="'100%'"
                [height]="'calc(var(--size-120) * 0.5)'"
              >
              </p-chart>
            </div>
          </p-card>
        }
      </div>

      <!-- Performance Summary Chart -->
      <p-card header="Performance Overview" class="performance-summary">
        <p-chart
          type="radar"
          [data]="radarChartData()"
          [options]="radarChartOptions"
        >
        </p-chart>
      </p-card>
    </div>
  `,
  styleUrl: "./performance-dashboard.component.scss",
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  // Angular 21: Use input() signals instead of @Input()
  athleteId = input<string>();
  realTimeEnabled = input<boolean>(true);

  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private destroy$ = new Subject<void>();
  private logger = inject(LoggerService);

  metrics = signal<PerformanceMetric[]>([]);

  radarChartData = computed(() => {
    const speed = this.metrics().find((m) => m.id === "speed")?.value || 0;
    const accuracy =
      this.metrics().find((m) => m.id === "accuracy")?.value || 0;
    const endurance =
      this.metrics().find((m) => m.id === "endurance")?.value || 0;

    return {
      labels: [
        "Speed",
        "Accuracy",
        "Endurance",
        "Agility",
        "Strength",
        "Focus",
      ],
      datasets: [
        {
          label: "Current",
          data: [speed, accuracy, endurance, 0, 0, 0],
          backgroundColor: `${COLORS.PRIMARY_LIGHT}33`,
          borderColor: COLORS.PRIMARY_LIGHT,
          pointBackgroundColor: COLORS.PRIMARY_LIGHT,
        },
        {
          label: "Target",
          data: [90, 90, 85, 95, 85, 90],
          backgroundColor: `${COLORS.WARNING}33`,
          borderColor: COLORS.WARNING,
          pointBackgroundColor: COLORS.WARNING,
        },
      ],
    };
  });

  radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
    plugins: {
      legend: { position: "top" as const },
    },
  };

  miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.4 },
    },
  };

  ngOnInit() {
    this.loadPerformanceMetrics();
  }

  private loadPerformanceMetrics() {
    const athleteId = this.athleteId();
    if (!athleteId) {
      return;
    }

    // Try to load from API
    this.apiService
      .get("/api/performance/metrics", { athleteId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.updateMetricsFromApi(response.data);
          }
        },
        error: () => {
          this.logger.debug("Performance API not available");
          this.metrics.set([]);
        },
      });
  }

  private updateMetricsFromApi(data: {
    metrics?: Array<{
      id?: string;
      metricId?: string;
      label?: string;
      name?: string;
      value?: number;
      currentValue?: number;
      unit?: string;
      trend?: "up" | "down" | "stable";
      trendValue?: number;
      target?: number;
      goal?: number;
      color?: string;
      icon?: string;
    }>;
  }) {
    if (data.metrics && Array.isArray(data.metrics)) {
      this.metrics.set(
        data.metrics.map((m) => ({
          id: m.id || m.metricId || "",
          label: m.label || m.name || "",
          value: m.value || m.currentValue || 0,
          unit: m.unit || "%",
          trend: m.trend || "stable",
          trendValue: m.trendValue || 0,
          target: m.target || m.goal || 100,
          color: m.color || COLORS.PRIMARY_LIGHT,
          tone: this.getToneFromColor(m.color),
          displayColor: this.getDisplayColor(this.getToneFromColor(m.color)),
          icon: m.icon || "pi pi-chart-line",
        })),
      );
    }
  }

  private getToneFromColor(color?: string): "success" | "warning" | "error" | "info" {
    if (!color) return "success";
    const normalized = color.toLowerCase();
    if (normalized.includes("ef4444") || normalized.includes("red")) return "error";
    if (normalized.includes("f59e0b") || normalized.includes("orange") || normalized.includes("amber"))
      return "warning";
    if (normalized.includes("3b82f6") || normalized.includes("blue")) return "info";
    return "success";
  }

  private getDisplayColor(tone: "success" | "warning" | "error" | "info"): string {
    switch (tone) {
      case "warning":
        return STATUS_COLORS.warning;
      case "error":
        return STATUS_COLORS.error;
      case "info":
        return STATUS_COLORS.info;
      default:
        return STATUS_COLORS.success;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatTrend(trend: string, value: number): string {
    if (trend === "stable") return "Stable";
    const sign = trend === "up" ? "+" : "-";
    return `${sign}${value.toFixed(1)}%`;
  }

  getTrendSeverity(
    trend: string,
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

  getTrendIcon(trend: string): string {
    switch (trend) {
      case "up":
        return "pi pi-arrow-up";
      case "down":
        return "pi pi-arrow-down";
      default:
        return "pi pi-minus";
    }
  }

  getMetricChartData(metricId: string) {
    // Return empty dataset if no data
    const metric = this.metrics().find((m) => m.id === metricId);

    return {
      datasets: [
        {
          data: [],
          borderColor: metric?.color || COLORS.PRIMARY_LIGHT,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  }

  trackByMetricId(index: number, metric: PerformanceMetric): string {
    return metric.id;
  }
}
