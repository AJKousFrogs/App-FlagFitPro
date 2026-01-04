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
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { TagModule } from "primeng/tag";
import { KnobModule } from "primeng/knob";
import { ProgressBarModule } from "primeng/progressbar";
import { interval, takeUntil, Subject } from "rxjs";
import { COLORS } from "../../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LoggerService } from "../../../core/services/logger.service";

interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  target: number;
  color: string;
  icon: string;
}

@Component({
  selector: "app-performance-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    TagModule,
    KnobModule,
    ProgressBarModule,
  ],
  template: `
    <div class="performance-dashboard">
      <div class="metrics-grid">
        @for (metric of metrics(); track trackByMetricId($index, metric)) {
          <p-card class="metric-card" [class]="'metric-' + metric.id">
            <div class="metric-header">
              <div class="metric-info">
                <i [class]="metric.icon" [style.color]="metric.color"></i>
                <h4>{{ metric.label }}</h4>
              </div>
              <p-tag
                [value]="formatTrend(metric.trend, metric.trendValue)"
                [severity]="getTrendSeverity(metric.trend)"
                [icon]="getTrendIcon(metric.trend)"
              >
              </p-tag>
            </div>
            <div class="metric-visualization">
              <div class="metric-value-container">
                <p-knob
                  [ngModel]="metric.value"
                  [min]="0"
                  [max]="metric.target * 1.2"
                  [size]="120"
                  [strokeWidth]="8"
                  [valueColor]="metric.color"
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
                  [style]="{ '--p-progressbar-value-bg': metric.color }"
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
                [height]="'60px'"
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
  styleUrl: './performance-dashboard.component.scss',
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
    const accuracy = this.metrics().find((m) => m.id === "accuracy")?.value || 0;
    const endurance = this.metrics().find((m) => m.id === "endurance")?.value || 0;
    
    return {
      labels: ["Speed", "Accuracy", "Endurance", "Agility", "Strength", "Focus"],
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
          // Use default mock metrics if API fails
          this.logger.debug(
            "Performance API not available, using default metrics",
          );
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
          icon: m.icon || "pi pi-chart-line",
        })),
      );
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
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
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
