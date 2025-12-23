import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { ApiService } from "../../../core/services/api.service";

export interface LiveMetric {
  id: string;
  icon: string;
  currentValue: number;
  unit: string;
  progress: number;
  trend: {
    direction: "up" | "down";
    text: string;
  };
}

@Component({
  selector: "app-live-performance-chart",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TagModule, ProgressBarModule],
  template: `
    <p-card header="Live Performance Tracking">
      <div class="performance-metrics-grid">
        @for (metric of liveMetrics(); track trackByMetricId($index, metric)) {
          <div class="metric-card">
          <div class="metric-icon">
            <i [class]="'pi ' + metric.icon"></i>
          </div>
          <div class="metric-value">
            <span class="current-value">{{
              metric.currentValue | number: "1.1-2"
            }}</span>
            <span class="unit">{{ metric.unit }}</span>
          </div>
          <div class="metric-trend">
            <p-tag
              [value]="metric.trend.text"
              [severity]="
                metric.trend.direction === "up" ? "success" : "danger"
              "
              [icon]="
                metric.trend.direction === "up"
                  ? "pi pi-arrow-up"
                  : "pi pi-arrow-down"
              "
            >
            </p-tag>
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
  styles: [
    `
      .performance-metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .metric-card {
        padding: var(--space-4);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-card);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-primary-50);
        color: var(--p-primary-600);
        border-radius: 50%;
        font-size: 1.5rem;
        margin-bottom: var(--space-4);
      }

      .metric-value {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }

      .current-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--p-primary-600);
      }

      .unit {
        font-size: 1rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .metric-trend {
        margin-bottom: var(--space-3);
      }

      .metric-progress {
        height: 8px;
      }

      @media (max-width: 768px) {
        .performance-metrics-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LivePerformanceChartComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  liveMetrics = signal<LiveMetric[]>([
    {
      id: "speed",
      icon: "pi-bolt",
      currentValue: 18.5,
      unit: "mph",
      progress: 75,
      trend: { direction: "up", text: "+2.1%" },
    },
    {
      id: "accuracy",
      icon: "pi-target",
      currentValue: 87.3,
      unit: "%",
      progress: 87,
      trend: { direction: "up", text: "+5.2%" },
    },
    {
      id: "endurance",
      icon: "pi-heart",
      currentValue: 92.1,
      unit: "%",
      progress: 92,
      trend: { direction: "up", text: "+1.8%" },
    },
    {
      id: "strength",
      icon: "pi-chart-line",
      currentValue: 78.4,
      unit: "%",
      progress: 78,
      trend: { direction: "down", text: "-0.5%" },
    },
  ]);

  private interval?: NodeJS.Timeout;

  ngOnInit(): void {
    this.startLiveUpdates();
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private startLiveUpdates(): void {
    // Update metrics every 2 seconds
    this.interval = setInterval(() => {
      this.updateMetrics();
    }, 2000);
  }

  private updateMetrics(): void {
    const currentMetrics = this.liveMetrics();
    const updatedMetrics = currentMetrics.map((metric) => {
      // Simulate real-time data updates with small random variations
      const variation = (Math.random() - 0.5) * 0.5; // ±0.25 variation
      const newValue = Math.max(0, metric.currentValue + variation);
      const newProgress = Math.min(100, Math.max(0, Math.round(newValue)));

      // Determine trend direction based on change
      const change = newValue - metric.currentValue;
      const direction: "up" | "down" = change >= 0 ? "up" : "down";
      const changePercent = Math.abs(change / metric.currentValue) * 100;
      const trendText =
        change >= 0
          ? `+${changePercent.toFixed(1)}%`
          : `-${changePercent.toFixed(1)}%`;

      return {
        ...metric,
        currentValue: Number(newValue.toFixed(2)),
        progress: newProgress,
        trend: {
          direction,
          text: trendText,
        },
      };
    });

    this.liveMetrics.set(updatedMetrics);
  }

  trackByMetricId(index: number, metric: LiveMetric): string {
    return metric.id;
  }
}
