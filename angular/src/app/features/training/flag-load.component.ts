import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { TableModule } from "primeng/table";
import {
  TrainingMetricsService,
  ACWRData,
  FlagMetrics,
} from "../../core/services/training-metrics.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { formatDate } from "../../shared/utils/date.utils";

@Component({
  selector: "app-flag-load",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    LazyChartComponent,
    EmptyStateComponent,
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
        <app-empty-state
          context="training"
          [useCard]="true"
          [customTitle]="'No Training Load Data Yet'"
          [customMessage]="'Start logging your training sessions to track your workload, ACWR, and flag football metrics.'"
          [customRoute]="'/training'"
          [customActionLabel]="'Go to Training Schedule'"
        />
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
export class FlagLoadComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly metricsService = inject(TrainingMetricsService);
  private readonly logger = inject(LoggerService);
  private lastLoadedAthleteId: string | null = null;

  acwrData = signal<ACWRData[]>([]);
  flagMetrics = signal<FlagMetrics[]>([]);
  isLoading = signal(true);
  hasData = signal(false);
  readonly athleteId = computed(() => this.supabase.userId());

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

  constructor() {
    effect(() => {
      const athleteId = this.athleteId();
      if (!athleteId || athleteId === this.lastLoadedAthleteId) {
        if (!athleteId) {
          this.isLoading.set(false);
        }
        return;
      }

      this.lastLoadedAthleteId = athleteId;
      void this.loadMetrics(athleteId);
    });
  }

  private async loadMetrics(athleteId: string): Promise<void> {
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
          borderColor: "rgb(var(--primitive-info-500-rgb))",
          backgroundColor: "rgba(var(--primitive-info-500-rgb), 0.2)",
          tension: 0.4,
        },
        {
          label: "High-Speed Distance (m)",
          data: metrics.map((x) => x.high_speed_distance),
          borderColor: "rgb(var(--ds-primary-green-rgb))",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.2)",
          tension: 0.4,
        },
        {
          label: "Total Volume (m)",
          data: metrics.map((x) => x.total_volume),
          borderColor: "rgb(var(--ds-primary-orange-rgb))",
          backgroundColor: "rgba(var(--ds-primary-orange-rgb), 0.2)",
          tension: 0.4,
        },
      ],
    });
  }
}
