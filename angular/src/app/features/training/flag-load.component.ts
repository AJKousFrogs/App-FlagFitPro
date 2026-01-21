import {
  Component,
  input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { TableModule } from "primeng/table";
import {
  TrainingMetricsService,
  ACWRData,
  FlagMetrics
} from "../../core/services/training-metrics.service";
import { LoggerService } from "../../core/services/logger.service";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { formatDate } from "../../shared/utils/date.utils";

@Component({
  selector: "app-flag-load",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    TableModule,
    LazyChartComponent
  ],
  template: `
    <div
      class="flag-load-container bg-surface-primary p-6 rounded-lg shadow-medium"
    >
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="skeleton-grid">
            @for (i of [1, 2]; track i) {
              <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @else if (!hasData()) {
        <div class="empty-state-container">
          <div class="empty-state-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <h3>No Training Load Data Yet</h3>
          <p>
            Start logging your training sessions to track your workload, ACWR,
            and flag football metrics.
          </p>

          <div class="empty-state-benefits">
            <h4>What you'll see here:</h4>
            <ul>
              <li>
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>ACWR Analysis</strong>
                  <span
                    >Track acute and chronic workload to prevent injury</span
                  >
                </div>
              </li>
              <li>
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>4-Week Metrics</strong>
                  <span>Visualize performance trends over time</span>
                </div>
              </li>
              <li>
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>Load Monitoring</strong>
                  <span>Optimize training intensity and recovery</span>
                </div>
              </li>
            </ul>
          </div>

          <div class="empty-state-cta">
            <a routerLink="/training" class="cta-button">
              <i class="pi pi-calendar"></i>
              Go to Training Schedule
            </a>
          </div>
        </div>
      }

      <!-- Data Content -->
      @else {
        <!-- ACWR Table -->
        <div class="acwr-section mb-8">
          <h2 class="text-2xl font-bold text-text-primary mb-4">
            ACWR Analysis
          </h2>
          <div class="overflow-x-auto bg-white rounded-lg shadow-low">
            <table class="w-full">
              <thead class="bg-surface-secondary">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                  >
                    Date
                  </th>
                  <th
                    class="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                  >
                    Load
                  </th>
                  <th
                    class="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                  >
                    Acute
                  </th>
                  <th
                    class="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                  >
                    Chronic
                  </th>
                  <th
                    class="px-4 py-3 text-left text-sm font-semibold text-text-primary"
                  >
                    ACWR
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (row of acwrData(); track row.session_date) {
                  <tr class="hover:bg-surface-tertiary transition-colors">
                    <td class="px-4 py-3 text-sm text-text-primary">
                      {{ row.session_date | date: "shortDate" }}
                    </td>
                    <td class="px-4 py-3 text-sm text-text-primary">
                      {{ row.load | number: "1.0-0" }}
                    </td>
                    <td class="px-4 py-3 text-sm text-text-primary">
                      {{ row.acute_load | number: "1.0-0" }}
                    </td>
                    <td class="px-4 py-3 text-sm text-text-primary">
                      {{ row.chronic_load | number: "1.0-0" }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="font-semibold"
                        [class.text-red-600]="row.acwr && row.acwr > 1.5"
                        [class.text-yellow-500]="
                          row.acwr && row.acwr >= 1.2 && row.acwr <= 1.5
                        "
                        [class.text-green-500]="
                          row.acwr && row.acwr < 1.2 && row.acwr >= 0.8
                        "
                        [class.text-orange-500]="row.acwr && row.acwr < 0.8"
                      >
                        {{ row.acwr ? (row.acwr | number: "1.2-2") : "N/A" }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4-week Flag Metrics Chart -->
        <div class="metrics-section">
          <h2 class="text-2xl font-bold text-text-primary mb-4">
            4-Week Flag Football Metrics
          </h2>
          <div class="bg-white rounded-lg shadow-low p-6">
            <app-lazy-chart
              type="line"
              [data]="chartData()"
              [options]="chartOptions"
            >
            </app-lazy-chart>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./flag-load.component.scss",
})
export class FlagLoadComponent implements OnInit {
  // Angular 21: Use input() signal instead of @Input()
  athleteId = input.required<string>();

  private metricsService = inject(TrainingMetricsService);
  private logger = inject(LoggerService);

  acwrData = signal<ACWRData[]>([]);
  flagMetrics = signal<FlagMetrics[]>([]);
  isLoading = signal(true);
  hasData = signal(false);

  chartData = signal<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      tension?: number;
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  async ngOnInit() {
    const athleteId = this.athleteId();
    if (!athleteId) {
      this.logger.error("FlagLoadComponent: athleteId is required");
      this.isLoading.set(false);
      return;
    }

    try {
      this.isLoading.set(true);
      const acwr = await this.metricsService.getACWR(athleteId);
      const flag = await this.metricsService.get4WeekFlagMetrics(athleteId);

      this.acwrData.set(acwr);
      this.flagMetrics.set(flag);
      this.hasData.set(acwr.length > 0 || flag.length > 0);

      // Update chart data
      this.updateChartData(flag);
    } catch (error) {
      this.logger.error("Error loading metrics:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateChartData(metrics: FlagMetrics[]) {
    this.chartData.set({
      labels: metrics.map((x) => formatDate(x.date, "P")),
      datasets: [
        {
          label: "Sprint Count",
          data: metrics.map((x) => x.sprint_count),
          borderColor: "#42A5F5",
          backgroundColor: "rgba(66, 165, 245, 0.2)",
          tension: 0.4,
        },
        {
          label: "High-Speed Distance (m)",
          data: metrics.map((x) => x.high_speed_distance),
          borderColor: "#66BB6A",
          backgroundColor: "rgba(102, 187, 106, 0.2)",
          tension: 0.4,
        },
        {
          label: "Total Volume (m)",
          data: metrics.map((x) => x.total_volume),
          borderColor: "#FFA726",
          backgroundColor: "rgba(255, 167, 38, 0.2)",
          tension: 0.4,
        },
      ],
    });
  }
}
