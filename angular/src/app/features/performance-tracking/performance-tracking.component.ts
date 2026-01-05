import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { AccordionModule } from "primeng/accordion";
import { COLORS } from "../../core/constants/app.constants";
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

interface GapAnalysis {
  metric: string;
  current: number;
  target: number;
  gap: number;
  gapPercentage: number;
  priority: number;
  recommendations: string[];
}

interface PositionBenchmark {
  metric: string;
  current: number;
  elite: number;
  unit: string;
  percentOfElite: number;
  gapFromElite: string;
}

const POSITION_BENCHMARKS: Record<
  string,
  Record<string, { elite: number; good: number; average: number }>
> = {
  WR: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 36, good: 32, average: 28 },
    relativeSquat: { elite: 2.0, good: 1.75, average: 1.5 },
  },
  QB: {
    sprint40: { elite: 4.6, good: 4.8, average: 5.0 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 34, good: 30, average: 26 },
    relativeSquat: { elite: 1.8, good: 1.6, average: 1.4 },
  },
  DB: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 35, good: 31, average: 27 },
    relativeSquat: { elite: 2.0, good: 1.75, average: 1.5 },
  },
  Rusher: {
    sprint40: { elite: 4.5, good: 4.7, average: 4.9 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 33, good: 29, average: 25 },
    relativeSquat: { elite: 2.2, good: 1.9, average: 1.6 },
  },
};

const TRAINING_RECOMMENDATIONS: Record<string, string[]> = {
  proAgility: [
    "Lateral change of direction drills (2x/week)",
    "Hip mobility work before training",
    "Deceleration/re-acceleration mechanics",
  ],
  sprint40: [
    "Sprint mechanics drills",
    "Acceleration work (10-20m)",
    "Hip flexor strength development",
  ],
  verticalJump: [
    "Plyometric training (box jumps, depth jumps)",
    "Hip flexor power development",
    "Reactive strength (RSI) training",
  ],
  relativeSquat: [
    "Progressive squat program (3x/week, 85% 1RM)",
    "Single-leg variations (split squats, lunges)",
    "Core stability work",
  ],
};

@Component({
  selector: "app-performance-tracking",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ChartModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ProgressBarModule,
    Select,
    AccordionModule,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    RouterModule,

    ButtonComponent,
    IconButtonComponent,
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
            <app-button iconLeft="pi-plus" (clicked)="openLogDialog()"
              >Log Performance</app-button
            >
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

          <!-- Position Benchmark Comparison -->
          <p-card class="benchmark-card">
            <ng-template pTemplate="header">
              <div class="benchmark-header">
                <div class="benchmark-title">
                  <i class="pi pi-bullseye"></i>
                  <h3>{{ selectedPosition() }} Position Benchmarks</h3>
                </div>
                <p-select
                  [options]="positionOptions"
                  [(ngModel)]="selectedPositionValue"
                  (onChange)="onPositionChange($event)"
                  placeholder="Change Position"
                  styleClass="position-selector"
                ></p-select>
              </div>
            </ng-template>
            <div class="benchmarks-list">
              @for (benchmark of positionBenchmarks(); track benchmark.metric) {
                <div class="benchmark-item">
                  <div class="benchmark-metric">
                    <span class="metric-name">{{ benchmark.metric }}</span>
                    <span class="metric-values">
                      You: {{ benchmark.current
                      }}{{ benchmark.unit }} &nbsp;|&nbsp; Elite:
                      {{ benchmark.elite }}{{ benchmark.unit }}
                    </span>
                  </div>
                  <div class="benchmark-progress">
                    <p-progressBar
                      [value]="benchmark.percentOfElite"
                      [showValue]="false"
                      styleClass="benchmark-bar"
                    ></p-progressBar>
                    <span class="gap-text"
                      >({{ benchmark.gapFromElite }} away)</span
                    >
                  </div>
                </div>
              }
            </div>
          </p-card>

          <!-- Gap Analysis & Training Priorities -->
          <p-card class="gap-analysis-card">
            <ng-template pTemplate="header">
              <div class="gap-header">
                <i class="pi pi-search"></i>
                <h3>Your Training Priorities (Based on Gap Analysis)</h3>
              </div>
            </ng-template>
            @if (gapAnalysis().length === 0) {
              <div class="empty-state">
                <i class="pi pi-chart-bar empty-icon"></i>
                <h4>No Gap Analysis Available</h4>
                <p>
                  Log performance metrics to see your training priorities and
                  recommendations.
                </p>
              </div>
            } @else {
              <p-accordion>
                @for (gap of gapAnalysis(); track gap.metric; let i = $index) {
                  <p-accordionpanel [value]="'gap-' + i">
                    <ng-template pTemplate="header">
                      <div class="priority-header">
                        <span class="priority-number"
                          >Priority #{{ i + 1 }}:</span
                        >
                        <span class="priority-metric">{{ gap.metric }}</span>
                        <p-tag
                          [value]="gap.gapPercentage.toFixed(1) + '% gap'"
                          [severity]="
                            gap.gapPercentage > 10
                              ? 'danger'
                              : gap.gapPercentage > 5
                                ? 'warn'
                                : 'info'
                          "
                        ></p-tag>
                      </div>
                    </ng-template>
                    <ng-template pTemplate="content">
                      <div class="priority-content">
                        <div class="gap-stats">
                          <span class="gap-stat"
                            >Gap: {{ gap.gap.toFixed(2) }} from elite</span
                          >
                          <span class="gap-stat"
                            >Current: {{ gap.current }}</span
                          >
                          <span class="gap-stat">Target: {{ gap.target }}</span>
                        </div>
                        <div class="recommendations">
                          <span class="rec-label">🎯 Recommended Focus:</span>
                          <ul>
                            @for (rec of gap.recommendations; track rec) {
                              <li>{{ rec }}</li>
                            }
                          </ul>
                        </div>
                        <a
                          routerLink="/training/videos"
                          [queryParams]="{ category: gap.metric }"
                          class="video-link"
                        >
                          <i class="pi pi-video"></i> View Related Training
                          Videos →
                        </a>
                      </div>
                    </ng-template>
                  </p-accordionpanel>
                }
              </p-accordion>
            }
          </p-card>

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
                <app-icon-button
                  icon="pi-plus"
                  (clicked)="openLogDialog()"
                  ariaLabel="plus"
                />
              </div>
            } @else {
              <p-table
                [value]="performanceHistory()"
                [paginator]="true"
                [rows]="10"
                [scrollable]="true"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Date</th>
                    <th>10m</th>
                    <th>20m</th>
                    <th>40yd</th>
                    <th>5-10-5</th>
                    <th>Vert</th>
                    <th>Broad</th>
                    <th>Squat</th>
                    <th>Dead</th>
                    <th>Score</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-record>
                  <tr>
                    <td>{{ record.date }}</td>
                    <td>{{ record.sprint10 || "-" }}</td>
                    <td>{{ record.sprint20 || "-" }}</td>
                    <td>{{ record.dash40 }}</td>
                    <td>{{ record.proAgility || "-" }}</td>
                    <td>{{ record.vertical }}</td>
                    <td>{{ record.broad }}</td>
                    <td>{{ record.squat || "-" }}</td>
                    <td>{{ record.deadlift || "-" }}</td>
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

        <!-- Log Performance Dialog (Extended) -->
        <p-dialog
          header="Log Performance"
          [(visible)]="showLogDialog"
          [modal]="true"
          [style]="{ width: '700px', maxHeight: '85vh' }"
          [closable]="true"
        >
          <div class="log-form">
            <!-- Speed Metrics -->
            <h4 class="form-section-title">⚡ Speed Metrics</h4>
            <div class="form-grid">
              <div class="p-field">
                <label for="sprint10">10m Sprint (sec)</label>
                <p-inputNumber
                  id="sprint10"
                  [(ngModel)]="newPerformance.sprint10"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 1.54"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="sprint20">20m Sprint (sec)</label>
                <p-inputNumber
                  id="sprint20"
                  [(ngModel)]="newPerformance.sprint20"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 2.89"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="dash40">40-Yard Dash (sec)</label>
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
            </div>

            <!-- Agility Metrics -->
            <h4 class="form-section-title">🔄 Agility Metrics</h4>
            <div class="form-grid">
              <div class="p-field">
                <label for="proAgility">Pro Agility 5-10-5 (sec)</label>
                <p-inputNumber
                  id="proAgility"
                  [(ngModel)]="newPerformance.proAgility"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 4.12"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="lDrill">L-Drill (sec)</label>
                <p-inputNumber
                  id="lDrill"
                  [(ngModel)]="newPerformance.lDrill"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 6.85"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="reactiveAgility">Reactive Agility (sec)</label>
                <p-inputNumber
                  id="reactiveAgility"
                  [(ngModel)]="newPerformance.reactiveAgility"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 1.24"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
            </div>

            <!-- Power Metrics -->
            <h4 class="form-section-title">⬆️ Power Metrics</h4>
            <div class="form-grid">
              <div class="p-field">
                <label for="vertical">Vertical Jump (in)</label>
                <p-inputNumber
                  id="vertical"
                  [(ngModel)]="newPerformance.vertical"
                  mode="decimal"
                  placeholder="e.g., 38"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="broad">Broad Jump (in)</label>
                <p-inputNumber
                  id="broad"
                  [(ngModel)]="newPerformance.broad"
                  mode="decimal"
                  placeholder="e.g., 122"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="rsi">RSI (ratio)</label>
                <p-inputNumber
                  id="rsi"
                  [(ngModel)]="newPerformance.rsi"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  mode="decimal"
                  placeholder="e.g., 2.45"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
            </div>

            <!-- Strength Metrics -->
            <h4 class="form-section-title">💪 Strength Metrics</h4>
            <div class="form-grid">
              <div class="p-field">
                <label for="bench">Bench Press 1RM (lbs)</label>
                <p-inputNumber
                  id="bench"
                  [(ngModel)]="newPerformance.bench"
                  mode="decimal"
                  placeholder="e.g., 225"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="squat">Back Squat 1RM (lbs)</label>
                <p-inputNumber
                  id="squat"
                  [(ngModel)]="newPerformance.squat"
                  mode="decimal"
                  placeholder="e.g., 315"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
              <div class="p-field">
                <label for="deadlift">Deadlift 1RM (lbs)</label>
                <p-inputNumber
                  id="deadlift"
                  [(ngModel)]="newPerformance.deadlift"
                  mode="decimal"
                  placeholder="e.g., 365"
                  styleClass="w-full"
                ></p-inputNumber>
              </div>
            </div>

            <!-- Body Weight -->
            <h4 class="form-section-title">📊 Body Info</h4>
            <div class="form-grid">
              <div class="p-field">
                <label for="bodyWeight">Body Weight (lbs)</label>
                <p-inputNumber
                  id="bodyWeight"
                  [(ngModel)]="newPerformance.bodyWeight"
                  mode="decimal"
                  placeholder="For relative strength"
                  styleClass="w-full"
                ></p-inputNumber>
                <small class="help-text"
                  >Used for relative strength calculations</small
                >
              </div>
            </div>

            <!-- Notes -->
            <div class="p-field mt-4">
              <label for="notes">Notes (optional)</label>
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
            <app-button variant="text" (clicked)="showLogDialog = false"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [loading]="isSaving()"
              (clicked)="savePerformance()"
              >Save Performance</app-button
            >
          </ng-template>
        </p-dialog>
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrl: "./performance-tracking.component.scss",
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
  readonly positionBenchmarks = signal<PositionBenchmark[]>([]);
  readonly gapAnalysis = signal<GapAnalysis[]>([]);
  readonly selectedPosition = signal<string>("WR");

  // Position selector
  selectedPositionValue = "WR";
  positionOptions = [
    { label: "Wide Receiver (WR)", value: "WR" },
    { label: "Quarterback (QB)", value: "QB" },
    { label: "Defensive Back (DB)", value: "DB" },
    { label: "Rusher", value: "Rusher" },
  ];

  // Dialog state
  showLogDialog = false;
  readonly isSaving = signal(false);
  newPerformance = {
    sprint10: null as number | null,
    sprint20: null as number | null,
    dash40: null as number | null,
    proAgility: null as number | null,
    lDrill: null as number | null,
    reactiveAgility: null as number | null,
    vertical: null as number | null,
    broad: null as number | null,
    rsi: null as number | null,
    bench: null as number | null,
    squat: null as number | null,
    deadlift: null as number | null,
    bodyWeight: null as number | null,
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
        color: COLORS.PRIMARY_LIGHT,
        trend: '+2"',
        trendType: "positive",
      },
      {
        label: "Broad Jump",
        value: "10'2\"",
        icon: "pi-arrow-right",
        color: COLORS.WARNING,
        trend: '+6"',
        trendType: "positive",
      },
      {
        label: "Bench Press",
        value: "225 lbs",
        icon: "pi-weight",
        color: COLORS.ERROR,
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
          backgroundColor: COLORS.PRIMARY_LIGHT,
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

    // Load position benchmarks and gap analysis
    this.updatePositionBenchmarks();

    // Mark page as loaded
    this.isPageLoading.set(false);
    this.hasPageError.set(false);
  }

  onPositionChange(event: any): void {
    this.selectedPosition.set(event.value);
    this.updatePositionBenchmarks();
  }

  private updatePositionBenchmarks(): void {
    const position = this.selectedPosition();
    const benchmarks = POSITION_BENCHMARKS[position];
    if (!benchmarks) return;

    // Sample current values - in real app these would come from latest performance record
    const currentMetrics = {
      sprint40: 4.45,
      proAgility: 4.12,
      verticalJump: 38,
      relativeSquat: 1.89,
    };

    const positionBenchmarksList: PositionBenchmark[] = [
      {
        metric: "40-Yard Dash",
        current: currentMetrics.sprint40,
        elite: benchmarks.sprint40.elite,
        unit: "s",
        percentOfElite: Math.min(
          100,
          (benchmarks.sprint40.elite / currentMetrics.sprint40) * 100,
        ),
        gapFromElite: `${(currentMetrics.sprint40 - benchmarks.sprint40.elite).toFixed(2)}s`,
      },
      {
        metric: "Pro Agility",
        current: currentMetrics.proAgility,
        elite: benchmarks.proAgility.elite,
        unit: "s",
        percentOfElite: Math.min(
          100,
          (benchmarks.proAgility.elite / currentMetrics.proAgility) * 100,
        ),
        gapFromElite: `${(currentMetrics.proAgility - benchmarks.proAgility.elite).toFixed(2)}s`,
      },
      {
        metric: "Vertical Jump",
        current: currentMetrics.verticalJump,
        elite: benchmarks.verticalJump.elite,
        unit: '"',
        percentOfElite: Math.min(
          100,
          (currentMetrics.verticalJump / benchmarks.verticalJump.elite) * 100,
        ),
        gapFromElite: `${(benchmarks.verticalJump.elite - currentMetrics.verticalJump).toFixed(0)}"`,
      },
      {
        metric: "Relative Squat (× BW)",
        current: currentMetrics.relativeSquat,
        elite: benchmarks.relativeSquat.elite,
        unit: "×",
        percentOfElite: Math.min(
          100,
          (currentMetrics.relativeSquat / benchmarks.relativeSquat.elite) * 100,
        ),
        gapFromElite: `${(benchmarks.relativeSquat.elite - currentMetrics.relativeSquat).toFixed(2)}×`,
      },
    ];

    this.positionBenchmarks.set(positionBenchmarksList);

    // Calculate gap analysis
    const gaps: GapAnalysis[] = positionBenchmarksList
      .map((b, index) => {
        const gapPercentage = 100 - b.percentOfElite;
        const metricKey = [
          "sprint40",
          "proAgility",
          "verticalJump",
          "relativeSquat",
        ][index];
        return {
          metric: b.metric,
          current: b.current,
          target: b.elite,
          gap: Math.abs(b.current - b.elite),
          gapPercentage,
          priority: index + 1,
          recommendations: TRAINING_RECOMMENDATIONS[metricKey] || [],
        };
      })
      .filter((g) => g.gapPercentage > 0)
      .sort((a, b) => b.gapPercentage - a.gapPercentage)
      .slice(0, 3); // Top 3 priorities

    this.gapAnalysis.set(gaps);
  }

  openLogDialog(): void {
    // Reset form and open dialog
    this.newPerformance = {
      sprint10: null,
      sprint20: null,
      dash40: null,
      proAgility: null,
      lDrill: null,
      reactiveAgility: null,
      vertical: null,
      broad: null,
      rsi: null,
      bench: null,
      squat: null,
      deadlift: null,
      bodyWeight: null,
      notes: "",
    };
    this.showLogDialog = true;
  }

  async savePerformance(): Promise<void> {
    // Validate at least one metric is entered
    const hasAnyMetric =
      this.newPerformance.sprint10 ||
      this.newPerformance.sprint20 ||
      this.newPerformance.dash40 ||
      this.newPerformance.proAgility ||
      this.newPerformance.lDrill ||
      this.newPerformance.reactiveAgility ||
      this.newPerformance.vertical ||
      this.newPerformance.broad ||
      this.newPerformance.rsi ||
      this.newPerformance.bench ||
      this.newPerformance.squat ||
      this.newPerformance.deadlift;

    if (!hasAnyMetric) {
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

      // Save to Supabase with extended fields
      const { error } = await this.supabaseService.client
        .from("performance_records")
        .insert({
          user_id: user.id,
          sprint_10m: this.newPerformance.sprint10,
          sprint_20m: this.newPerformance.sprint20,
          dash_40: this.newPerformance.dash40,
          pro_agility: this.newPerformance.proAgility,
          l_drill: this.newPerformance.lDrill,
          reactive_agility: this.newPerformance.reactiveAgility,
          vertical_jump: this.newPerformance.vertical,
          broad_jump: this.newPerformance.broad,
          rsi: this.newPerformance.rsi,
          bench_press: this.newPerformance.bench,
          back_squat: this.newPerformance.squat,
          deadlift: this.newPerformance.deadlift,
          body_weight: this.newPerformance.bodyWeight,
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
        sprint10: this.newPerformance.sprint10
          ? `${this.newPerformance.sprint10}s`
          : "-",
        sprint20: this.newPerformance.sprint20
          ? `${this.newPerformance.sprint20}s`
          : "-",
        dash40: this.newPerformance.dash40
          ? `${this.newPerformance.dash40}s`
          : "-",
        proAgility: this.newPerformance.proAgility
          ? `${this.newPerformance.proAgility}s`
          : "-",
        vertical: this.newPerformance.vertical
          ? `${this.newPerformance.vertical}"`
          : "-",
        broad: this.newPerformance.broad
          ? `${this.newPerformance.broad}"`
          : "-",
        squat: this.newPerformance.squat
          ? `${this.newPerformance.squat}lb`
          : "-",
        deadlift: this.newPerformance.deadlift
          ? `${this.newPerformance.deadlift}lb`
          : "-",
        score: score,
      };

      this.performanceHistory.update((history) => [newRecord, ...history]);

      // Update benchmarks after new record
      this.updatePositionBenchmarks();

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
