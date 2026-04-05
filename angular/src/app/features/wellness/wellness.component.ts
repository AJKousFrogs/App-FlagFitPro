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
import {
  extractApiArray,
  isSuccessfulApiResponse,
} from "../../core/utils/api-response-mapper";
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
import { StatusTagSeverity } from "../../shared/components/status-tag/status-tag.component";
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
  templateUrl: "./wellness.component.html",
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
          const wellnessEntries = extractApiArray<WellnessData>(response);

          if (wellnessEntries && wellnessEntries.length > 0) {
            const latestData = wellnessEntries[0];
            const overallScore =
              this.wellnessService.getWellnessScore(latestData);
            const status = this.wellnessService.getWellnessStatus(overallScore);

            const sleepTrend = this.calculateTrend(wellnessEntries, "sleep");
            const energyTrend = this.calculateTrend(wellnessEntries, "energy");

            this.wellnessStats.set([
              {
                label: "Sleep Quality",
                value: latestData.sleep ? `${latestData.sleep}h` : "N/A",
                icon: "pi-moon",
                color: "var(--color-status-info)",
                ...(sleepTrend !== "N/A"
                  ? {
                      trend: sleepTrend,
                      trendType: "positive" as const,
                    }
                  : {}),
              },
              {
                label: "Recovery Score",
                value: `${Math.round(overallScore * 10)}%`,
                icon: "pi-heart",
                color: status.color,
                trend: this.formatWellnessStatusLabel(status.status),
                trendSeverity: this.recoveryTrendSeverity(status.status),
                trendType:
                  status.status === "good" || status.status === "excellent"
                    ? "positive"
                    : status.status === "poor"
                      ? "negative"
                      : "neutral",
              },
              {
                label: "Energy Level",
                value: latestData.energy ? `${latestData.energy}/10` : "N/A",
                icon: "pi-bolt",
                color: "var(--color-status-warning)",
                ...(energyTrend !== "N/A"
                  ? {
                      trend: energyTrend,
                      trendType: "positive" as const,
                    }
                  : {}),
              },
              {
                label: "Stress Level",
                value:
                  latestData.stress != null
                    ? this.getStressLabel(latestData.stress)
                    : "N/A",
                icon: "pi-shield",
                color:
                  latestData.stress != null && latestData.stress <= 3
                    ? "var(--color-status-success)"
                    : latestData.stress != null
                      ? "var(--color-status-warning)"
                      : "var(--color-text-tertiary)",
              },
            ]);

            const sortedData = [...wellnessEntries].sort(
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

            this.generateWellnessAlerts(wellnessEntries);
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
      },
      {
        label: "Recovery Score",
        value: noDataValue,
        icon: "pi-heart",
        color: "var(--ds-primary-green)",
      },
      {
        label: "Energy Level",
        value: noDataValue,
        icon: "pi-bolt",
        color: "var(--color-status-warning)",
      },
      {
        label: "Stress Level",
        value: noDataValue,
        icon: "pi-shield",
        color: "var(--color-status-success)",
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

  private formatWellnessStatusLabel(
    status: "excellent" | "good" | "fair" | "poor",
  ): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private recoveryTrendSeverity(
    status: "excellent" | "good" | "fair" | "poor",
  ): StatusTagSeverity {
    switch (status) {
      case "excellent":
      case "good":
        return "success";
      case "fair":
        return "warning";
      case "poor":
        return "danger";
      default:
        return "info";
    }
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
      readinessScore: this.checkInData.readiness ?? undefined,
      resting_hr: this.checkInData.restingHR ?? undefined,
      date: new Date().toISOString().split("T")[0],
    };

    this.trainingService
      .submitWellness(wellnessData)
      .then((response) => {
        this.isSubmitting.set(false);
        if (isSuccessfulApiResponse(response)) {
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
          this.toastService.error(TOAST.ERROR.CHECKIN_SAVE_FAILED);
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
