import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
// import { ChartModule } from "primeng/chart"; // REMOVED: Using LazyChartComponent
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { LoggerService } from "../../core/services/logger.service";
import { ToastService } from "../../core/services/toast.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { WellnessService } from "../../core/services/wellness.service";
import { BodyCompositionCardComponent } from "../../shared/components/body-composition-card/body-composition-card.component";
import { HydrationTrackerComponent } from "../../shared/components/hydration-tracker/hydration-tracker.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatItem, StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { SupplementTrackerComponent } from "../../shared/components/supplement-tracker/supplement-tracker.component";
import {
  AppLoadingComponent,
  ButtonComponent,
  CardComponent,
} from "../../shared/components/ui-components";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import { OfflineQueueService } from "../../core/services/offline-queue.service";
import { ConfidenceIndicatorComponent } from "../../shared/components/confidence-indicator/confidence-indicator.component";

interface WellnessAlert {
  id: string;
  severity: "danger" | "warn" | "info";
  title: string;
  message: string;
  recommendations?: string[];
  actionLabel?: string;
  actionRoute?: string;
}

interface WellnessMetric {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: "app-wellness",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    CardModule,
    // ChartModule, // REMOVED: Using LazyChartComponent

    LazyChartComponent,
    InputNumberModule,
    MessageModule,
    AppLoadingComponent,
    ButtonComponent,
    CardComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PageErrorStateComponent,
    BodyCompositionCardComponent,
    SupplementTrackerComponent,
    HydrationTrackerComponent,
    ConfidenceIndicatorComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isPageLoading()"
        variant="skeleton"
        message="Loading wellness data..."
      ></app-loading>

      <!-- Error State -->
      @if (hasPageError()) {
        <app-page-error-state
          title="Unable to load wellness data"
          [message]="pageErrorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="wellness-page">
          <app-page-header
            title="Wellness & Recovery"
            subtitle="Track your health, recovery, and wellness metrics"
            icon="pi-heart"
          >
            <app-button iconLeft="pi-plus" (clicked)="openCheckIn()"
              >Log Check-in</app-button
            >
          </app-page-header>

          <!-- Wellness Metrics (4 Cards) -->
          <app-stats-grid [stats]="wellnessStats()"></app-stats-grid>

          <!-- Partial Wellness Score Confidence Indicator -->
          @if (wellnessConfidence().score < 1.0) {
            <p-card styleClass="confidence-card">
              <div class="confidence-warning">
                <app-confidence-indicator
                  [score]="wellnessConfidence().score"
                  [missingInputs]="wellnessConfidence().missingInputs"
                  [showDetails]="true"
                ></app-confidence-indicator>
                <p class="confidence-message">
                  Your wellness score is calculated from {{ completedMetricsCount() }}/{{ totalMetricsCount() }} metrics.
                  Complete all fields for a more accurate score.
                </p>
              </div>
            </p-card>
          }

          <!-- Wellness Charts - Lazy loaded for performance -->
          <div class="charts-grid">
            @defer (on viewport) {
              <app-card title="Sleep Quality (7-day)">
                @if (sleepChartData()) {
                  <app-lazy-chart
                    type="line"
                    [data]="sleepChartData()"
                    [options]="chartOptions"
                  ></app-lazy-chart>
                } @else {
                  <div class="chart-empty">
                    No sleep data yet. Start logging daily check-ins.
                  </div>
                }
              </app-card>
            } @placeholder {
              <app-card title="Sleep Quality (7-day)" [loading]="true">
                <div class="loading-text">Loading sleep data...</div>
              </app-card>
            }

            @defer (on viewport) {
              <app-card title="Recovery Score (7-day)">
                @if (recoveryChartData()) {
                  <app-lazy-chart
                    type="bar"
                    [data]="recoveryChartData()"
                    [options]="chartOptions"
                  ></app-lazy-chart>
                } @else {
                  <div class="chart-empty">
                    No recovery data yet. Start logging daily check-ins.
                  </div>
                }
              </app-card>
            } @placeholder {
              <app-card title="Recovery Score (7-day)" [loading]="true">
                <div class="loading-text">Loading recovery data...</div>
              </app-card>
            }
          </div>

          <!-- Body Composition Card -->
          @defer (on viewport) {
            <app-body-composition-card></app-body-composition-card>
          } @placeholder {
            <app-card title="Body Composition" [loading]="true">
              <div class="loading-text">Loading body composition data...</div>
            </app-card>
          }

          <!-- Supplement Tracker -->
          @defer (on viewport) {
            <app-supplement-tracker></app-supplement-tracker>
          } @placeholder {
            <app-card title="Supplement Tracker" [loading]="true">
              <div class="loading-text">Loading supplements...</div>
            </app-card>
          }

          <!-- Weight & Wellness Alerts (if triggered) -->
          @if (wellnessAlerts().length > 0) {
            <app-card
              title="Weight & Wellness Alerts"
              headerIcon="pi-exclamation-triangle"
              headerIconColor="warning"
            >
              <div class="alerts-section">
                @for (alert of wellnessAlerts(); track alert.id) {
                  <div
                    class="wellness-alert"
                    [class]="'alert-' + alert.severity"
                  >
                    <div class="alert-header">
                      <i [class]="getAlertIcon(alert.severity)"></i>
                      <span class="alert-title">{{ alert.title }}</span>
                    </div>
                    <p class="alert-message">{{ alert.message }}</p>
                    @if (
                      alert.recommendations && alert.recommendations.length > 0
                    ) {
                      <div class="alert-recommendations">
                        <span class="rec-label">Possible causes:</span>
                        <ul>
                          @for (rec of alert.recommendations; track rec) {
                            <li>{{ rec }}</li>
                          }
                        </ul>
                      </div>
                    }
                    <div class="alert-actions">
                      <app-button
                        variant="text"
                        size="sm"
                        (clicked)="dismissAlert(alert.id)"
                        >Dismiss</app-button
                      >
                      @if (alert.actionLabel && alert.actionRoute) {
                        <app-button
                          variant="outlined"
                          size="sm"
                          [routerLink]="alert.actionRoute"
                          >{{ alert.actionLabel }}</app-button
                        >
                      }
                    </div>
                  </div>
                }
              </div>
            </app-card>
          }

          <!-- Hydration Tracker -->
          @defer (on viewport) {
            <app-hydration-tracker></app-hydration-tracker>
          } @placeholder {
            <app-card title="Hydration Tracker" [loading]="true">
              <div class="loading-text">Loading hydration data...</div>
            </app-card>
          }

          <!-- Menstrual Cycle Tracking (Female Athletes) -->
          @defer (on viewport) {
            <app-card
              title="Cycle Tracking"
              headerIcon="pi-heart"
              styleClass="cycle-tracking-card"
            >
              <div class="cycle-tracking-content">
                <p class="cycle-description">
                  Track your menstrual cycle to receive personalized training,
                  nutrition, and recovery recommendations based on your cycle phase.
                </p>
                <div class="cycle-benefits">
                  <div class="benefit-item">
                    <i class="pi pi-check-circle"></i>
                    <span>Phase-adapted training recommendations</span>
                  </div>
                  <div class="benefit-item">
                    <i class="pi pi-check-circle"></i>
                    <span>Injury risk awareness by cycle phase</span>
                  </div>
                  <div class="benefit-item">
                    <i class="pi pi-check-circle"></i>
                    <span>Nutrition guidance for each phase</span>
                  </div>
                  <div class="benefit-item">
                    <i class="pi pi-check-circle"></i>
                    <span>Private by default - coaches only see recovery recommendations</span>
                  </div>
                </div>
                <app-button
                  iconLeft="pi-calendar"
                  [routerLink]="['/cycle-tracking']"
                  styleClass="w-full mt-3"
                  >Open Cycle Tracker</app-button
                >
              </div>
            </app-card>
          } @placeholder {
            <app-card title="Cycle Tracking" [loading]="true">
              <div class="loading-text">Loading cycle tracking...</div>
            </app-card>
          }

          <!-- Daily Check-in - Comprehensive for Olympic Athletes -->
          <app-card
            title="Daily Wellness Check-in"
            class="checkin-card"
            [flush]="true"
          >
            <div class="checkin-form">
              <!-- Sleep Section -->
              <div class="checkin-section">
                <h4 class="section-label">
                  <i class="pi pi-moon"></i> Sleep & Recovery
                </h4>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <label for="sleepHours">Sleep Hours</label>
                    <p-inputNumber
                      inputId="sleepHours"
                      [(ngModel)]="checkInData.sleepHours"
                      [min]="0"
                      [max]="24"
                      [showButtons]="true"
                      [minFractionDigits]="1"
                      [maxFractionDigits]="1"
                      placeholder="Hours"
                    ></p-inputNumber>
                  </div>
                  <div class="checkin-item">
                    <label for="sleepQuality">Sleep Quality (1-10)</label>
                    <p-inputNumber
                      inputId="sleepQuality"
                      [(ngModel)]="checkInData.sleepQuality"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Quality"
                    ></p-inputNumber>
                  </div>
                </div>
              </div>

              <!-- Physical Section -->
              <div class="checkin-section">
                <h4 class="section-label">
                  <i class="pi pi-heart"></i> Physical State
                </h4>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <label for="energyLevel">Energy Level (1-10)</label>
                    <p-inputNumber
                      inputId="energyLevel"
                      [(ngModel)]="checkInData.energyLevel"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Level"
                    ></p-inputNumber>
                  </div>
                  <div class="checkin-item">
                    <label for="soreness">Muscle Soreness (1-10)</label>
                    <p-inputNumber
                      inputId="soreness"
                      [(ngModel)]="checkInData.soreness"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="1=None, 10=Severe"
                    ></p-inputNumber>
                    <small class="help-text"
                      >1 = No soreness, 10 = Very sore</small
                    >
                  </div>
                </div>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <label for="hydrationGlasses"
                      >Hydration (glasses of water)</label
                    >
                    <p-inputNumber
                      inputId="hydrationGlasses"
                      [(ngModel)]="checkInData.hydration"
                      [min]="0"
                      [max]="20"
                      [showButtons]="true"
                      placeholder="Glasses (8oz)"
                    ></p-inputNumber>
                    <small class="help-text">Target: 8+ glasses daily</small>
                  </div>
                  <div class="checkin-item">
                    <label for="restingHR">Resting Heart Rate (BPM)</label>
                    <p-inputNumber
                      inputId="restingHR"
                      [(ngModel)]="checkInData.restingHR"
                      [min]="40"
                      [max]="120"
                      [showButtons]="true"
                      placeholder="Optional"
                    ></p-inputNumber>
                    <small class="help-text"
                      >Elevated HR may indicate fatigue</small
                    >
                  </div>
                </div>
              </div>

              <!-- Mental Section -->
              <div class="checkin-section">
                <h4 class="section-label">
                  <i class="pi pi-sparkles"></i> Mental State
                </h4>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <label for="mood">Mood (1-10)</label>
                    <p-inputNumber
                      inputId="mood"
                      [(ngModel)]="checkInData.mood"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Mood"
                    ></p-inputNumber>
                  </div>
                  <div class="checkin-item">
                    <label for="stress">Stress Level (1-10)</label>
                    <p-inputNumber
                      inputId="stress"
                      [(ngModel)]="checkInData.stress"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="1=Relaxed, 10=Very stressed"
                    ></p-inputNumber>
                    <small class="help-text"
                      >1 = Very relaxed, 10 = Very stressed</small
                    >
                  </div>
                </div>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <label for="motivation">Training Motivation (1-10)</label>
                    <p-inputNumber
                      inputId="motivation"
                      [(ngModel)]="checkInData.motivation"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Motivation"
                    ></p-inputNumber>
                  </div>
                  <div class="checkin-item">
                    <label for="readiness">Readiness to Train (1-10)</label>
                    <p-inputNumber
                      inputId="readiness"
                      [(ngModel)]="checkInData.readiness"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Readiness"
                    ></p-inputNumber>
                  </div>
                </div>
              </div>

              <!-- Submit -->
              <div class="checkin-submit">
                <app-button
                  icon="check"
                  [loading]="isSubmitting()"
                  (clicked)="submitCheckIn()"
                  >Submit Check-in</app-button
                >
                <small class="submit-note"
                  >Daily check-ins help optimize your training load</small
                >
              </div>
            </div>
          </app-card>
        </div>
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrl: "./wellness.component.scss",
})
export class WellnessComponent {
  private readonly wellnessService = inject(WellnessService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confidenceService = inject(DataConfidenceService);
  private readonly offlineQueue = inject(OfflineQueueService);

  // Runtime guard signals - prevent white screen crashes
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Something went wrong while loading wellness data. Please try again.",
  );

  readonly isSubmitting = signal(false);

  readonly metrics = signal<WellnessMetric[]>([]);
  readonly wellnessStats = signal<StatItem[]>([]);
  // Chart data - uses Chart.js format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly sleepChartData = signal<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly recoveryChartData = signal<any>(null);
  readonly wellnessAlerts = signal<WellnessAlert[]>([]);

  // Confidence tracking
  readonly wellnessConfidence = signal<{ score: number; missingInputs: string[] }>({ score: 1.0, missingInputs: [] });
  readonly completedMetricsCount = signal<number>(0);
  readonly totalMetricsCount = signal<number>(4);

  checkInData = {
    sleepHours: 7,
    sleepQuality: 7,
    energyLevel: 7,
    soreness: 3,
    hydration: 8,
    restingHR: 0,
    mood: 7,
    stress: 3,
    motivation: 7,
    readiness: 7,
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
    this.loadWellnessData();
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  loadWellnessData(): void {
    // Fetch wellness data from service
    this.wellnessService
      .getWellnessData("7d")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isPageLoading.set(false);
          this.hasPageError.set(false);

          if (response.success && response.data && response.data.length > 0) {
            const latestData = response.data[0];
            const overallScore =
              this.wellnessService.getWellnessScore(latestData);
            const status = this.wellnessService.getWellnessStatus(overallScore);

            // Update stats with real data
            this.wellnessStats.set([
              {
                label: "Sleep Quality",
                value: latestData.sleep ? `${latestData.sleep}h` : "N/A",
                icon: "pi-moon",
                color: "var(--color-status-info)",
                trend: this.calculateTrend(response.data, "sleep"),
                trendType: "positive",
              },
              {
                label: "Recovery Score",
                value: `${Math.round(overallScore * 10)}%`,
                icon: "pi-heart",
                color: status.color,
                trend: status.status,
                trendType:
                  status.status === "good" || status.status === "excellent"
                    ? "positive"
                    : "neutral",
              },
              {
                label: "Energy Level",
                value: latestData.energy ? `${latestData.energy}/10` : "N/A",
                icon: "pi-bolt",
                color: "var(--color-status-warning)",
                trend: this.calculateTrend(response.data, "energy"),
                trendType: "positive",
              },
              {
                label: "Stress Level",
                value: latestData.stress
                  ? this.getStressLabel(latestData.stress)
                  : "N/A",
                icon: "pi-shield",
                color:
                  latestData.stress && latestData.stress <= 3
                    ? "var(--color-status-success)"
                    : "var(--color-status-warning)",
                trend:
                  latestData.stress && latestData.stress <= 3
                    ? "Low"
                    : "Moderate",
                trendType:
                  latestData.stress && latestData.stress <= 3
                    ? "positive"
                    : "neutral",
              },
            ]);

            // Build chart data from last 7 days
            const sortedData = [...response.data].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            );

            const labels = sortedData.map((d) => {
              const date = new Date(d.date);
              return date.toLocaleDateString("en-US", { weekday: "short" });
            });

            this.sleepChartData.set({
              labels,
              datasets: [
                {
                  label: "Sleep Hours",
                  data: sortedData.map((d) => d.sleep || 0),
                  borderColor: "var(--color-status-info)",
                  backgroundColor: "rgba(var(--color-status-info-rgb), 0.1)",
                },
              ],
            });

            this.recoveryChartData.set({
              labels,
              datasets: [
                {
                  label: "Recovery Score",
                  data: sortedData.map((d) =>
                    Math.round(this.wellnessService.getWellnessScore(d) * 10),
                  ),
                  backgroundColor: "var(--ds-primary-green)",
                },
              ],
            });

            // Generate wellness alerts based on the data
            this.generateWellnessAlerts(response.data);
          } else {
            // Fallback to default data if no data available
            this.loadFallbackData();
          }
        },
        error: (err) => {
          this.isPageLoading.set(false);
          this.logger.error("Error loading wellness data:", err);

          // Check if it's a critical error that should show error state
          if (err?.status === 401 || err?.status === 403) {
            this.hasPageError.set(true);
            this.pageErrorMessage.set(
              "Your session has expired. Please log in again.",
            );
          } else if (err?.status >= 500) {
            this.hasPageError.set(true);
            this.pageErrorMessage.set(
              "The server is temporarily unavailable. Please try again later.",
            );
          } else {
            // For non-critical errors, show fallback data instead of error state
            this.loadFallbackData();
          }
        },
      });
  }

  // Centralized UX copy for no data state
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  private loadFallbackData(): void {
    // Use centralized UX copy for consistent messaging
    this.wellnessStats.set([
      {
        label: "Sleep Quality",
        value: this.noDataMessage.title,
        icon: "pi-moon",
        color: "var(--color-status-info)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Recovery Score",
        value: this.noDataMessage.title,
        icon: "pi-heart",
        color: "var(--ds-primary-green)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Energy Level",
        value: this.noDataMessage.title,
        icon: "pi-bolt",
        color: "var(--color-status-warning)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Stress Level",
        value: this.noDataMessage.title,
        icon: "pi-shield",
        color: "var(--color-status-success)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
    ]);

    this.sleepChartData.set(null);
    this.recoveryChartData.set(null);
  }

  private calculateTrend(data: unknown[], metric: string): string {
    if (data.length < 2) return "N/A";
    const currentRecord = data[0] as Record<string, unknown>;
    const previousRecord = data[1] as Record<string, unknown>;
    const current =
      typeof currentRecord[metric] === "number" ? currentRecord[metric] : null;
    const previous =
      typeof previousRecord[metric] === "number"
        ? previousRecord[metric]
        : null;
    if (current === null || previous === null) return "N/A";
    const diff = current - previous;
    if (diff > 0) return `+${diff.toFixed(1)} vs yesterday`;
    if (diff < 0) return `${diff.toFixed(1)} vs yesterday`;
    return "No change";
  }

  private getStressLabel(stress: number): string {
    if (stress <= 3) return "Low";
    if (stress <= 6) return "Moderate";
    return "High";
  }

  openCheckIn(): void {
    // Scroll to check-in form
    const element = document.querySelector(".checkin-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  submitCheckIn(): void {
    // Validate input
    if (!this.checkInData.sleepHours || this.checkInData.sleepHours <= 0) {
      this.toastService.warn("Please enter your sleep hours");
      return;
    }

    this.isSubmitting.set(true);

    // Convert form data to comprehensive wellness check-in format
    const wellnessData = {
      sleep: this.checkInData.sleepHours,
      sleep_quality: this.checkInData.sleepQuality,
      energy: this.checkInData.energyLevel,
      soreness: this.checkInData.soreness,
      hydration: this.checkInData.hydration,
      resting_hr:
        this.checkInData.restingHR > 0 ? this.checkInData.restingHR : null,
      mood: this.checkInData.mood,
      stress: this.checkInData.stress,
      motivation: this.checkInData.motivation,
      readiness: this.checkInData.readiness,
      date: new Date().toISOString().split("T")[0],
    };

    this.trainingService
      .submitWellness(wellnessData)
      .then((response: { success: boolean; error?: string }) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.toastService.success("Wellness check-in saved! 💪");
          // Reset form to defaults
          this.checkInData = {
            sleepHours: 7,
            sleepQuality: 7,
            energyLevel: 7,
            soreness: 3,
            hydration: 8,
            restingHR: 0,
            mood: 7,
            stress: 3,
            motivation: 7,
            readiness: 7,
          };
          // Reload wellness data to show updated stats
          this.loadWellnessData();
        } else {
          this.toastService.error(response.error || "Failed to save check-in");
        }
      })
      .catch((err) => {
        this.isSubmitting.set(false);
        this.logger.error("Error submitting wellness check-in:", err);
        
        // Check if we should queue this action for offline sync
        if (this.offlineQueue.shouldQueue(err)) {
          const _actionId = this.offlineQueue.queueAction(
            "wellness_checkin",
            wellnessData,
            "high"
          ); // Action ID available for tracking
          this.toastService.info(
            "You're offline. Check-in queued for sync when connection is restored."
          );
          // Reset form even if queued
          this.checkInData = {
            sleepHours: 7,
            sleepQuality: 7,
            energyLevel: 7,
            soreness: 3,
            hydration: 8,
            restingHR: 0,
            mood: 7,
            stress: 3,
            motivation: 7,
            readiness: 7,
          };
        } else {
          this.toastService.error("Failed to save wellness check-in");
        }
      });
  }

  trackByMetricLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }

  /**
   * Generate wellness alerts based on current data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateWellnessAlerts(data: any[]): void {
    const alerts: WellnessAlert[] = [];

    if (data.length >= 2) {
      const latest = data[0];
      const previous = data[1];

      // Check for rapid weight loss
      if (latest.weight && previous.weight) {
        const weightDiff = previous.weight - latest.weight;
        if (weightDiff > 2) {
          alerts.push({
            id: "rapid-weight-loss",
            severity: "danger",
            title: "RAPID WEIGHT LOSS DETECTED",
            message: `You've lost ${weightDiff.toFixed(1)}kg recently. This may indicate dehydration or undereating.`,
            recommendations: ["Dehydration", "Undereating", "Illness"],
            actionLabel: "Talk to AI Coach",
            actionRoute: "/ai-coach",
          });
        }
      }

      // Check for elevated resting HR
      if (latest.resting_hr && latest.resting_hr > 70) {
        const baseline = 60; // typical athletic baseline
        const diff = latest.resting_hr - baseline;
        if (diff > 10) {
          alerts.push({
            id: "elevated-hr",
            severity: "warn",
            title: "ELEVATED RESTING HEART RATE",
            message: `Your resting HR (${latest.resting_hr} BPM) is ${diff} BPM above baseline. This may indicate fatigue, stress, or illness.`,
            recommendations: ["Consider a lighter training day"],
          });
        }
      }
    }

    // Check for high soreness + magnesium gap
    const latestData = data[0];
    if (latestData?.soreness >= 7) {
      alerts.push({
        id: "supplement-rec",
        severity: "info",
        title: "SUPPLEMENT RECOMMENDATION",
        message: `Your muscle soreness has been elevated (${latestData.soreness}/10). Consider magnesium supplementation for muscle recovery.`,
        actionLabel: "Log Magnesium Now",
        actionRoute: "/wellness",
      });
    }

    this.wellnessAlerts.set(alerts);
  }

  /**
   * Get icon class for alert severity
   */
  getAlertIcon(severity: "danger" | "warn" | "info"): string {
    switch (severity) {
      case "danger":
        return "pi pi-exclamation-circle";
      case "warn":
        return "pi pi-exclamation-triangle";
      case "info":
        return "pi pi-lightbulb";
      default:
        return "pi pi-info-circle";
    }
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    this.wellnessAlerts.update((alerts) =>
      alerts.filter((a) => a.id !== alertId),
    );
    this.toastService.info("Alert dismissed");
  }
}
