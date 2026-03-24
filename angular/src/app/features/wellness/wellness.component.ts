import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";

import { TOAST } from "../../core/constants/toast-messages.constants";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import { LoggerService } from "../../core/services/logger.service";
import { OfflineQueueService } from "../../core/services/offline-queue.service";
import { ProfileCompletionService } from "../../core/services/profile-completion.service";
import { ToastService } from "../../core/services/toast.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { WellnessService } from "../../core/services/wellness.service";
import { BodyCompositionCardComponent } from "../../shared/components/body-composition-card/body-composition-card.component";
import { ConfidenceIndicatorComponent } from "../../shared/components/confidence-indicator/confidence-indicator.component";
import { HydrationTrackerComponent } from "../../shared/components/hydration-tracker/hydration-tracker.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AlertComponent, AlertVariant } from "../../shared/components/alert/alert.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import {
  StatItem,
  StatsGridComponent,
} from "../../shared/components/stats-grid/stats-grid.component";
import { SupplementTrackerComponent } from "../../shared/components/supplement-tracker/supplement-tracker.component";
import {
  AppLoadingComponent,
  ButtonComponent,
} from "../../shared/components/ui-components";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { SimpleChartData } from "../../core/models/chart.models";
import { WellnessData } from "../../core/services/wellness.service";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { WellnessChartsSectionComponent } from "./components/wellness-charts-section.component";

interface WellnessAlert {
  id: string;
  severity: "danger" | "warning" | "info";
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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MainLayoutComponent,
    InputNumberComponent,
    AppLoadingComponent,
    ButtonComponent,
    PageHeaderComponent,
    StatsGridComponent,
    PageErrorStateComponent,
    BodyCompositionCardComponent,
    SupplementTrackerComponent,
    HydrationTrackerComponent,
    ConfidenceIndicatorComponent,
    AlertComponent,
    CardShellComponent,
    WellnessChartsSectionComponent,
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
      @if (!isPageLoading() && !hasPageError()) {
        <div
          class="wellness-page elite-phase2-shell ui-page-shell ui-page-stack"
        >
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
            <app-card-shell class="confidence-card">
              <div class="confidence-warning">
                <app-confidence-indicator
                  [score]="wellnessConfidence().score"
                  [missingInputs]="wellnessConfidence().missingInputs"
                  [showDetails]="true"
                ></app-confidence-indicator>
                <p class="confidence-message">
                  Your wellness score is calculated from
                  {{ completedMetricsCount() }}/{{ totalMetricsCount() }}
                  metrics. Complete all fields for a more accurate score.
                </p>
              </div>
            </app-card-shell>
          }

          <app-wellness-charts-section
            [sleepChartData]="sleepChartData()"
            [recoveryChartData]="recoveryChartData()"
            [chartOptions]="chartOptions"
          />

          <!-- Body Composition Card -->
          @defer (on viewport) {
            <app-body-composition-card></app-body-composition-card>
          } @placeholder {
            <app-card-shell title="Body Composition" headerIcon="pi-chart-line">
              <app-loading
                [visible]="true"
                variant="skeleton"
                message="Loading body composition data..."
              />
            </app-card-shell>
          }

          <!-- Supplement Tracker -->
          @defer (on viewport) {
            <app-supplement-tracker></app-supplement-tracker>
          } @placeholder {
            <app-card-shell title="Supplement Tracker" headerIcon="pi-heart-fill">
              <app-loading
                [visible]="true"
                variant="skeleton"
                message="Loading supplements..."
              />
            </app-card-shell>
          }

          <!-- Weight & Wellness Alerts (if triggered) -->
          @if (wellnessAlerts().length > 0) {
            <app-card-shell
              title="Weight & Wellness Alerts"
              headerIcon="pi-exclamation-triangle"
              tone="warning"
            >
              <div class="alerts-section">
                @for (alert of wellnessAlerts(); track alert.id) {
                  <app-alert
                    class="wellness-route-alert"
                    [variant]="getAlertVariant(alert.severity)"
                    [title]="alert.title"
                    [message]="alert.message"
                    [dismissible]="true"
                    (dismissed)="dismissAlert(alert.id)"
                  >
                    @if (
                      alert.recommendations && alert.recommendations.length > 0
                    ) {
                      <div class="wellness-alert-recommendations">
                        <span class="rec-label">Possible causes:</span>
                        <ul>
                          @for (rec of alert.recommendations; track rec) {
                            <li>{{ rec }}</li>
                          }
                        </ul>
                      </div>
                    }
                    <div class="wellness-alert-actions">
                      @if (alert.actionLabel && alert.actionRoute) {
                        <app-button
                          variant="outlined"
                          size="sm"
                          [routerLink]="alert.actionRoute"
                          >{{ alert.actionLabel }}</app-button
                        >
                      }
                    </div>
                  </app-alert>
                }
              </div>
            </app-card-shell>
          }

          <!-- Hydration Tracker -->
          @defer (on viewport) {
            <app-hydration-tracker></app-hydration-tracker>
          } @placeholder {
            <app-card-shell title="Hydration Tracker" headerIcon="pi-tint">
              <app-loading
                [visible]="true"
                variant="skeleton"
                message="Loading hydration data..."
              />
            </app-card-shell>
          }

          <!-- Menstrual Cycle Tracking (Female Athletes Only) -->
          @if (isFemaleAthlete()) {
            @defer (on viewport) {
              <app-card-shell
                title="Cycle Tracking"
                headerIcon="pi-heart"
                class="cycle-tracking-card"
              >
                <div class="cycle-tracking-content">
                  <p class="cycle-description">
                    Track your menstrual cycle to receive personalized training,
                    nutrition, and recovery recommendations based on your cycle
                    phase.
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
                      <span
                        >Private by default - coaches only see recovery
                        recommendations</span
                      >
                    </div>
                  </div>
                  <app-button
                    iconLeft="pi-calendar"
                    [routerLink]="['/cycle-tracking']"
                    class="w-full mt-3"
                    >Open Cycle Tracker</app-button
                  >
                </div>
              </app-card-shell>
            } @placeholder {
              <app-card-shell title="Cycle Tracking" headerIcon="pi-heart">
                <app-loading
                  [visible]="true"
                  variant="skeleton"
                  message="Loading cycle tracking..."
                />
              </app-card-shell>
            }
          }

          <!-- Daily Check-in - Comprehensive for Olympic Athletes -->
          <div
            #checkinCard
            class="checkin-card-anchor ui-page-shell ui-page-shell--content-lg"
          >
            <app-card-shell
              title="Daily Wellness Check-in"
              class="checkin-card"
              [flush]="true"
            >
            <div class="checkin-form">
              <p class="checkin-impact-note">
                These inputs drive readiness, recovery, and wellness analytics.
                All 1–10 fields use the same scale unless noted.
              </p>
              <!-- Sleep Section -->
              <div class="checkin-section">
                <h4 class="section-label">
                  <i class="pi pi-moon"></i> Sleep & Recovery
                </h4>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <app-input-number
                      label="Sleep Hours"
                      inputId="sleepHours"
                      [ngModel]="checkInData.sleepHours"
                      (valueChange)="onCheckInFieldChange('sleepHours', $event.value)"
                      [min]="0"
                      [max]="24"
                      [showButtons]="true"
                      [minFractionDigits]="1"
                      [maxFractionDigits]="1"
                      placeholder="Hours"
                      [attr.aria-label]="'Sleep hours'"
                    ></app-input-number>
                  </div>
                  <div class="checkin-item">
                    <app-input-number
                      label="Sleep Quality (1-10)"
                      inputId="sleepQuality"
                      [ngModel]="checkInData.sleepQuality"
                      (valueChange)="onCheckInFieldChange('sleepQuality', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Quality"
                      [attr.aria-label]="'Sleep quality from 1 to 10'"
                    ></app-input-number>
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
                    <app-input-number
                      label="Energy Level (1-10)"
                      inputId="energyLevel"
                      [ngModel]="checkInData.energyLevel"
                      (valueChange)="onCheckInFieldChange('energyLevel', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Level"
                      [attr.aria-label]="'Energy level from 1 to 10'"
                    ></app-input-number>
                  </div>
                  <div class="checkin-item">
                    <app-input-number
                      label="Muscle Soreness (1-10)"
                      inputId="soreness"
                      [ngModel]="checkInData.soreness"
                      (valueChange)="onCheckInFieldChange('soreness', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="1=None, 10=Severe"
                      [attr.aria-label]="
                        'Muscle soreness from 1 to 10, where 1 is no soreness and 10 is very sore'
                      "
                      hint="1 = No soreness, 10 = Very sore"
                    ></app-input-number>
                  </div>
                </div>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <app-input-number
                      label="Hydration (glasses of water)"
                      inputId="hydrationGlasses"
                      [ngModel]="checkInData.hydration"
                      (valueChange)="onCheckInFieldChange('hydration', $event.value)"
                      [min]="0"
                      [max]="20"
                      [showButtons]="true"
                      placeholder="Glasses (8oz)"
                      [attr.aria-label]="'Number of glasses of water consumed'"
                      hint="Target: 8+ glasses daily"
                    ></app-input-number>
                  </div>
                  <div class="checkin-item">
                    <app-input-number
                      label="Resting Heart Rate (BPM)"
                      inputId="restingHR"
                      [ngModel]="checkInData.restingHR"
                      (valueChange)="onCheckInFieldChange('restingHR', $event.value)"
                      [min]="40"
                      [max]="120"
                      [showButtons]="true"
                      placeholder="Optional"
                      [attr.aria-label]="
                        'Resting heart rate in beats per minute'
                      "
                      hint="Elevated HR may indicate fatigue"
                    ></app-input-number>
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
                    <app-input-number
                      label="Mood (1-10)"
                      inputId="mood"
                      [ngModel]="checkInData.mood"
                      (valueChange)="onCheckInFieldChange('mood', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Mood"
                      [attr.aria-label]="'Mood level from 1 to 10'"
                    ></app-input-number>
                  </div>
                  <div class="checkin-item">
                    <app-input-number
                      label="Stress Level (1-10)"
                      inputId="stress"
                      [ngModel]="checkInData.stress"
                      (valueChange)="onCheckInFieldChange('stress', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="1=Relaxed, 10=Very stressed"
                      [attr.aria-label]="
                        'Stress level from 1 to 10, where 1 is very relaxed and 10 is very stressed'
                      "
                      hint="1 = Very relaxed, 10 = Very stressed"
                    ></app-input-number>
                  </div>
                </div>
                <div class="checkin-row">
                  <div class="checkin-item">
                    <app-input-number
                      label="Training Motivation (1-10)"
                      inputId="motivation"
                      [ngModel]="checkInData.motivation"
                      (valueChange)="onCheckInFieldChange('motivation', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Motivation"
                      [attr.aria-label]="
                        'Training motivation level from 1 to 10'
                      "
                    ></app-input-number>
                  </div>
                  <div class="checkin-item">
                    <app-input-number
                      label="Readiness to Train (1-10)"
                      inputId="readiness"
                      [ngModel]="checkInData.readiness"
                      (valueChange)="onCheckInFieldChange('readiness', $event.value)"
                      [min]="1"
                      [max]="10"
                      [showButtons]="true"
                      placeholder="Readiness"
                      [attr.aria-label]="
                        'Readiness to train level from 1 to 10'
                      "
                    ></app-input-number>
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
            </app-card-shell>
          </div>
        </div>
      }
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
  private readonly profileService = inject(ProfileCompletionService);

  // Template reference for scrolling to check-in card
  readonly checkinCard = viewChild<ElementRef<HTMLElement>>("checkinCard");

  /** Cycle tracking is only shown to female athletes */
  readonly isFemaleAthlete = this.profileService.isFemale;

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
  readonly sleepChartData = signal<SimpleChartData | null>(null);
  readonly recoveryChartData = signal<SimpleChartData | null>(null);
  readonly wellnessAlerts = signal<WellnessAlert[]>([]);

  // Confidence tracking
  readonly wellnessConfidence = signal<{
    score: number;
    missingInputs: string[];
  }>({ score: 1.0, missingInputs: [] });
  readonly completedMetricsCount = signal<number>(0);
  readonly totalMetricsCount = signal<number>(4);

  checkInData: {
    sleepHours: number | null;
    sleepQuality: number | null;
    energyLevel: number | null;
    soreness: number | null;
    hydration: number | null;
    restingHR: number | null;
    mood: number | null;
    stress: number | null;
    motivation: number | null;
    readiness: number | null;
  } = {
    sleepHours: null,
    sleepQuality: null,
    energyLevel: null,
    soreness: null,
    hydration: null,
    restingHR: null,
    mood: null,
    stress: null,
    motivation: null,
    readiness: null,
  };

  readonly chartOptions = DEFAULT_CHART_OPTIONS;

  constructor() {
    this.initializePage();
  }

  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);
    this.profileService.loadProfileData();
    this.loadWellnessData();
  }

  retryLoad(): void {
    this.initializePage();
  }

  loadWellnessData(): void {
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

            this.generateWellnessAlerts(response.data);
          } else {
            this.loadFallbackData();
          }
        },
        error: (err) => {
          this.isPageLoading.set(false);
          this.logger.error("Error loading wellness data:", err);

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
            this.loadFallbackData();
          }
        },
      });
  }

  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  private loadFallbackData(): void {
    const noDataValue = "—";
    this.wellnessStats.set([
      {
        label: "Sleep Quality",
        value: noDataValue,
        icon: "pi-moon",
        color: "var(--color-status-info)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Recovery Score",
        value: noDataValue,
        icon: "pi-heart",
        color: "var(--ds-primary-green)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Energy Level",
        value: noDataValue,
        icon: "pi-bolt",
        color: "var(--color-status-warning)",
        trend: this.noDataMessage.actionLabel,
        trendType: "neutral",
      },
      {
        label: "Stress Level",
        value: noDataValue,
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
    const cardElement =
      this.checkinCard()?.nativeElement ??
      document.querySelector<HTMLElement>(".checkin-card-anchor");

    if (!cardElement) {
      this.logger.warn(
        "Unable to scroll to check-in card; anchor element not rendered yet.",
      );
      return;
    }

    cardElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  onCheckInFieldChange(
    key:
      | "sleepHours"
      | "sleepQuality"
      | "energyLevel"
      | "soreness"
      | "hydration"
      | "restingHR"
      | "mood"
      | "stress"
      | "motivation"
      | "readiness",
    value: number | null,
  ): void {
    this.checkInData = {
      ...this.checkInData,
      [key]: value,
    };
  }

  submitCheckIn(): void {
    if (
      this.checkInData.sleepHours === null ||
      this.checkInData.sleepHours <= 0
    ) {
      this.toastService.warn(TOAST.WARN.ENTER_SLEEP_HOURS);
      return;
    }

    if (this.checkInData.sleepQuality === null) {
      this.toastService.warn("Please enter your sleep quality rating");
      return;
    }

    if (this.checkInData.energyLevel === null) {
      this.toastService.warn("Please enter your energy level");
      return;
    }

    this.isSubmitting.set(true);

    const wellnessData = {
      sleep: this.checkInData.sleepQuality,
      sleepHours: this.checkInData.sleepHours,
      energy: this.checkInData.energyLevel,
      soreness: this.checkInData.soreness,
      hydration: this.checkInData.hydration,
      mood: this.checkInData.mood,
      stress: this.checkInData.stress,
      motivation: this.checkInData.motivation,
      date: new Date().toISOString().split("T")[0],
      notes:
        this.checkInData.restingHR || this.checkInData.readiness
          ? `${this.checkInData.restingHR ? `RHR: ${this.checkInData.restingHR}bpm` : ""}${this.checkInData.restingHR && this.checkInData.readiness ? ", " : ""}${this.checkInData.readiness ? `Readiness: ${this.checkInData.readiness}/10` : ""}`
          : undefined,
    };

    this.trainingService
      .submitWellness(wellnessData)
      .then((response: { success: boolean; error?: string }) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.toastService.success(TOAST.SUCCESS.WELLNESS_CHECKIN_SAVED);
          this.checkInData = {
            sleepHours: null,
            sleepQuality: null,
            energyLevel: null,
            soreness: null,
            hydration: null,
            restingHR: null,
            mood: null,
            stress: null,
            motivation: null,
            readiness: null,
          };
          this.loadWellnessData();
        } else {
          this.toastService.error(
            response.error || TOAST.ERROR.CHECKIN_SAVE_FAILED,
          );
        }
      })
      .catch((err) => {
        this.isSubmitting.set(false);
        this.logger.error("Error submitting wellness check-in:", err);

        if (this.offlineQueue.shouldQueue(err)) {
          this.offlineQueue.queueAction(
            "wellness_checkin",
            wellnessData,
            "high",
          );
          this.toastService.info(
            "You're offline. Check-in queued for sync when connection is restored.",
          );
          this.checkInData = {
            sleepHours: null,
            sleepQuality: null,
            energyLevel: null,
            soreness: null,
            hydration: null,
            restingHR: null,
            mood: null,
            stress: null,
            motivation: null,
            readiness: null,
          };
        } else {
          this.toastService.error(TOAST.ERROR.WELLNESS_CHECKIN_FAILED);
        }
      });
  }

  trackByMetricLabel(index: number, metric: WellnessMetric): string {
    return metric.label;
  }

  private generateWellnessAlerts(data: WellnessData[]): void {
    const alerts: WellnessAlert[] = [];

    if (data.length >= 2) {
      const latest = data[0];
      const previous = data[1];

      if (latest.weight && previous.weight) {
        const weightDiff = previous.weight - latest.weight;
        if (weightDiff > 2) {
          alerts.push({
            id: "rapid-weight-loss",
            severity: "danger",
            title: "RAPID WEIGHT LOSS DETECTED",
            message: `You've lost ${weightDiff.toFixed(1)}kg recently. This may indicate dehydration or undereating.`,
            recommendations: ["Dehydration", "Undereating", "Illness"],
            actionLabel: "Talk to Merlin AI",
            actionRoute: "/ai-coach",
          });
        }
      }

      if (latest.resting_hr && latest.resting_hr > 70) {
        const baseline = 60;
        const diff = latest.resting_hr - baseline;
        if (diff > 10) {
          alerts.push({
            id: "elevated-hr",
            severity: "warning",
            title: "ELEVATED RESTING HEART RATE",
            message: `Your resting HR (${latest.resting_hr} BPM) is ${diff} BPM above baseline. This may indicate fatigue, stress, or illness.`,
            recommendations: ["Consider a lighter training day"],
          });
        }
      }
    }

    const latestData = data[0];
    if (typeof latestData?.soreness === "number" && latestData.soreness >= 7) {
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

  getAlertVariant(severity: "danger" | "warning" | "info"): AlertVariant {
    switch (severity) {
      case "danger":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  }

  dismissAlert(alertId: string): void {
    this.wellnessAlerts.update((alerts) =>
      alerts.filter((a) => a.id !== alertId),
    );
    this.toastService.info(TOAST.INFO.ALERT_DISMISSED);
  }
}
