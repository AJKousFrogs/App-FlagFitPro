import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ApiService } from "../../core/services/api.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";

interface PerformanceMetric {
  name: string;
  value: string;
  trend: string;
  trendType: "up" | "down" | "neutral";
}


@Component({
  selector: "app-performance-tracking",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    RouterModule,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isPageLoading()"
        variant="skeleton"
        message="Loading performance data..."
      ></app-loading>

      <!-- Error State -->
      @if (hasPageError()) {
        <app-page-error-state
          title="Unable to load performance data"
          [message]="pageErrorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="performance-page">
          <app-page-header
            title="Performance Tracking"
            subtitle="Track and analyze your performance metrics over time"
            icon="pi-bullseye"
          >
            <p-button
              label="Log Performance"
              icon="pi pi-plus"
              (onClick)="openLogDialog()"
            ></p-button>
          </app-page-header>

          <!-- Performance Metrics -->
          <app-stats-grid [stats]="performanceStats()"></app-stats-grid>

          <!-- Performance Charts -->
          <div class="charts-grid">
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <h3>Performance Over Time</h3>
                </ng-template>
                @if (performanceChartData()) {
                  <p-chart
                    type="line"
                    [data]="performanceChartData()"
                    [options]="chartOptions"
                  ></p-chart>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">
                  Loading performance chart...
                </div>
              </p-card>
            }

            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <h3>Speed Metrics</h3>
                </ng-template>
                @if (speedChartData()) {
                  <p-chart
                    type="bar"
                    [data]="speedChartData()"
                    [options]="chartOptions"
                  ></p-chart>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">Loading speed metrics...</div>
              </p-card>
            }
          </div>

          <!-- Performance History Table -->
          <p-card class="table-card">
            <ng-template pTemplate="header">
              <h3>Performance History</h3>
            </ng-template>
            @if (performanceHistory().length === 0) {
              <div class="empty-state">
                <i class="pi {{ noDataMessage.icon }} empty-icon"></i>
                <h4>{{ noDataMessage.title }}</h4>
                <p>{{ noDataMessage.reason }}</p>
                <p-button
                  [label]="noDataMessage.actionLabel"
                  icon="pi pi-plus"
                  (onClick)="openLogDialog()"
                ></p-button>
              </div>
            } @else {
              <p-table
                [value]="performanceHistory()"
                [paginator]="true"
                [rows]="10"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Date</th>
                    <th>40-Yard Dash</th>
                    <th>Vertical Jump</th>
                    <th>Broad Jump</th>
                    <th>Bench Press</th>
                    <th>Overall Score</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-record>
                  <tr>
                    <td>{{ record.date }}</td>
                    <td>{{ record.dash40 }}</td>
                    <td>{{ record.vertical }}</td>
                    <td>{{ record.broad }}</td>
                    <td>{{ record.bench }}</td>
                    <td>
                      <p-tag
                        [value]="record.score + '%'"
                        [severity]="getScoreSeverity(record.score)"
                      >
                      </p-tag>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            }
          </p-card>
        </div>

        <!-- Log Performance Dialog -->
        <p-dialog
          header="Log Performance"
          [(visible)]="showLogDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
          [closable]="true"
        >
          <div class="log-form">
            <div class="p-field mb-4">
              <label for="dash40" class="p-label">40-Yard Dash (seconds)</label>
              <p-inputNumber
                id="dash40"
                [(ngModel)]="newPerformance.dash40"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                mode="decimal"
                placeholder="e.g., 4.45"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
            <div class="p-field mb-4">
              <label for="vertical" class="p-label"
                >Vertical Jump (inches)</label
              >
              <p-inputNumber
                id="vertical"
                [(ngModel)]="newPerformance.vertical"
                [minFractionDigits]="1"
                mode="decimal"
                placeholder="e.g., 38"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
            <div class="p-field mb-4">
              <label for="broad" class="p-label">Broad Jump (inches)</label>
              <p-inputNumber
                id="broad"
                [(ngModel)]="newPerformance.broad"
                [minFractionDigits]="1"
                mode="decimal"
                placeholder="e.g., 122"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
            <div class="p-field mb-4">
              <label for="bench" class="p-label">Bench Press (lbs)</label>
              <p-inputNumber
                id="bench"
                [(ngModel)]="newPerformance.bench"
                mode="decimal"
                placeholder="e.g., 225"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
            <div class="p-field mb-4">
              <label for="notes" class="p-label">Notes (optional)</label>
              <input
                id="notes"
                type="text"
                pInputText
                [(ngModel)]="newPerformance.notes"
                placeholder="Any notes about this session"
                class="w-full"
              />
            </div>
          </div>
          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showLogDialog = false"
            ></p-button>
            <p-button
              label="Save Performance"
              icon="pi pi-check"
              [loading]="isSaving()"
              (onClick)="savePerformance()"
            ></p-button>
          </ng-template>
        </p-dialog>
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrl: './performance-tracking.component.scss',
})
export class PerformanceTrackingComponent {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);
  private readonly supabaseService = inject(SupabaseService);

  // Runtime guard signals - prevent white screen crashes
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Something went wrong while loading performance data. Please try again.",
  );

  // Centralized UX copy for data states
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  readonly metrics = signal<PerformanceMetric[]>([]);
  readonly performanceStats = signal<any[]>([]);
  readonly performanceChartData = signal<any>(null);
  readonly speedChartData = signal<any>(null);
  readonly performanceHistory = signal<any[]>([]);

  // Dialog state
  showLogDialog = false;
  readonly isSaving = signal(false);
  newPerformance = {
    dash40: null as number | null,
    vertical: null as number | null,
    broad: null as number | null,
    bench: null as number | null,
    notes: "",
  };

  readonly chartOptions = DEFAULT_CHART_OPTIONS;

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializePage();
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);
    this.loadPerformanceData();
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  loadPerformanceData(): void {
    // Load stats for StatsGridComponent
    this.performanceStats.set([
      {
        label: "40-Yard Dash",
        value: "4.45s",
        icon: "pi-bolt",
        color: "var(--ds-primary-green)",
        trend: "+0.05s",
        trendType: "positive",
      },
      {
        label: "Vertical Jump",
        value: '38"',
        icon: "pi-arrow-up",
        color: "#10c96b",
        trend: '+2"',
        trendType: "positive",
      },
      {
        label: "Broad Jump",
        value: "10'2\"",
        icon: "pi-arrow-right",
        color: "#f1c40f",
        trend: '+6"',
        trendType: "positive",
      },
      {
        label: "Bench Press",
        value: "225 lbs",
        icon: "pi-weight",
        color: "#e74c3c",
        trend: "+10 lbs",
        trendType: "positive",
      },
    ]);

    // Load performance chart
    this.performanceChartData.set({
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Overall Performance",
          data: [82, 84, 85, 87, 86, 88],
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "var(--ds-primary-green-subtle)",
        },
      ],
    });

    // Load speed chart
    this.speedChartData.set({
      labels: ["40-Yard", "100-Yard", "Shuttle"],
      datasets: [
        {
          label: "Speed (seconds)",
          data: [4.45, 11.2, 4.8],
          backgroundColor: "#10c96b",
        },
      ],
    });

    // Load history
    this.performanceHistory.set([
      {
        date: "2024-01-15",
        dash40: "4.50s",
        vertical: '36"',
        broad: "9'8\"",
        bench: "215 lbs",
        score: 85,
      },
      {
        date: "2024-02-15",
        dash40: "4.48s",
        vertical: '37"',
        broad: "9'10\"",
        bench: "220 lbs",
        score: 86,
      },
      {
        date: "2024-03-15",
        dash40: "4.45s",
        vertical: '38"',
        broad: "10'2\"",
        bench: "225 lbs",
        score: 88,
      },
    ]);

    // Mark page as loaded
    this.isPageLoading.set(false);
    this.hasPageError.set(false);
  }

  openLogDialog(): void {
    // Reset form and open dialog
    this.newPerformance = {
      dash40: null,
      vertical: null,
      broad: null,
      bench: null,
      notes: "",
    };
    this.showLogDialog = true;
  }

  async savePerformance(): Promise<void> {
    // Validate at least one metric is entered
    if (
      !this.newPerformance.dash40 &&
      !this.newPerformance.vertical &&
      !this.newPerformance.broad &&
      !this.newPerformance.bench
    ) {
      this.toastService.warn("Please enter at least one performance metric");
      return;
    }

    this.isSaving.set(true);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error("Please log in to save performance");
        return;
      }

      // Calculate overall score (simple average based on benchmarks)
      const score = this.calculateScore();

      // Save to Supabase
      const { error } = await this.supabaseService.client
        .from("performance_records")
        .insert({
          user_id: user.id,
          dash_40: this.newPerformance.dash40,
          vertical_jump: this.newPerformance.vertical,
          broad_jump: this.newPerformance.broad,
          bench_press: this.newPerformance.bench,
          notes: this.newPerformance.notes,
          overall_score: score,
          recorded_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      // Add to local history
      const newRecord = {
        date: new Date().toISOString().split("T")[0],
        dash40: this.newPerformance.dash40
          ? `${this.newPerformance.dash40}s`
          : "-",
        vertical: this.newPerformance.vertical
          ? `${this.newPerformance.vertical}"`
          : "-",
        broad: this.newPerformance.broad
          ? `${Math.floor(this.newPerformance.broad / 12)}'${this.newPerformance.broad % 12}"`
          : "-",
        bench: this.newPerformance.bench
          ? `${this.newPerformance.bench} lbs`
          : "-",
        score: score,
      };

      this.performanceHistory.update((history) => [newRecord, ...history]);

      this.toastService.success("Performance logged successfully!");
      this.showLogDialog = false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save performance";
      this.toastService.error(message);
    } finally {
      this.isSaving.set(false);
    }
  }

  private calculateScore(): number {
    // Simple scoring based on typical flag football benchmarks
    let totalPoints = 0;
    let metrics = 0;

    if (this.newPerformance.dash40) {
      // 4.4s = 100, 5.0s = 60
      const dashScore = Math.max(
        0,
        Math.min(100, 100 - ((this.newPerformance.dash40 - 4.4) / 0.6) * 40),
      );
      totalPoints += dashScore;
      metrics++;
    }

    if (this.newPerformance.vertical) {
      // 40" = 100, 28" = 60
      const vertScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.vertical - 28) / 12) * 40),
      );
      totalPoints += vertScore;
      metrics++;
    }

    if (this.newPerformance.broad) {
      // 130" = 100, 100" = 60
      const broadScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.broad - 100) / 30) * 40),
      );
      totalPoints += broadScore;
      metrics++;
    }

    if (this.newPerformance.bench) {
      // 250 = 100, 150 = 60
      const benchScore = Math.max(
        0,
        Math.min(100, 60 + ((this.newPerformance.bench - 150) / 100) * 40),
      );
      totalPoints += benchScore;
      metrics++;
    }

    return metrics > 0 ? Math.round(totalPoints / metrics) : 0;
  }

  getTrendSeverity(trendType: string): string {
    const severities: Record<string, string> = {
      up: "success",
      down: "danger",
      neutral: "info",
    };
    return severities[trendType] || "info";
  }

  getScoreSeverity(score: number): "success" | "info" | "warn" | "danger" {
    if (score >= 90) return "success";
    if (score >= 80) return "info";
    if (score >= 70) return "warn";
    return "danger";
  }

  trackByMetricName(index: number, metric: PerformanceMetric): string {
    return metric.name;
  }
}
