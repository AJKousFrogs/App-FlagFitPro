import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
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
  styleUrl: "./live-performance-chart.component.scss",
})
export class LivePerformanceChartComponent implements OnInit {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  liveMetrics = signal<LiveMetric[]>([]);

  ngOnInit(): void {
    // Real data would be loaded from this.apiService.get("/api/performance/live")
  }

  private startLiveUpdates(): void {
    // Disabled simulation
  }

  private updateMetrics(): void {
    // Disabled simulation
  }

  trackByMetricId(index: number, metric: LiveMetric): string {
    return metric.id;
  }
}
