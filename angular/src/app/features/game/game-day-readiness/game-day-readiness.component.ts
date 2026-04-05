/**
 * Game Day Readiness Component
 *
 * Pre-competition wellness check-in for Olympic-bound flag football athletes.
 * Calculates readiness score and alerts coaches if athlete isn't competition-ready.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ActivatedRoute, ParamMap, Router, RouterModule } from "@angular/router";

// PrimeNG Components

import { Slider } from "primeng/slider";

import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";

import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { ConfidenceIndicatorComponent } from "../../../shared/components/confidence-indicator/confidence-indicator.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

// Services
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  LoggerService,
  toLogContext,
} from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ToastService } from "../../../core/services/toast.service";
import { UnifiedTrainingService } from "../../../core/services/unified-training.service";
import { getProtocolAcwrDisplay } from "../../../core/utils/protocol-metrics-presentation";
import { GameDayReadinessDataService } from "../services/game-day-readiness-data.service";

interface ReadinessMetric {
  key: string;
  label: string;
  /** PrimeIcons suffix, e.g. `pi-moon` */
  icon: string;
  value: number;
  weight: number;
  description: string;
  lowWarning: string;
}

@Component({
  selector: "app-game-day-readiness",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Slider,
    TextareaComponent,
    AlertComponent,
    ButtonComponent,
    ConfidenceIndicatorComponent,
    MainLayoutComponent,
  ],
  styleUrl: "./game-day-readiness.component.scss",
  template: `
    <app-main-layout>
      <div class="game-day-readiness ui-page-shell ui-page-shell--content-md ui-page-stack">
        <!-- Header -->
        <div class="readiness-header">
          <div class="header-content">
            <h1><i class="pi pi-flag"></i> Game Day Readiness</h1>
            <p class="subtitle">Pre-Competition Check-in for {{ gameInfo() }}</p>
          </div>
          <div class="acwr-badge" [class]="acwrStatus()">
            <span class="acwr-label">ACWR</span>
            <span class="acwr-value">
              @if (acwrDisplay().value !== null) {
                {{ acwrDisplay().value | number: "1.2-2" }}
              } @else {
                --
              }
            </span>
          </div>
        </div>

        @if (!isSubmitted()) {
          <!-- Check-in Form -->
          <div class="checkin-form">
            @for (metric of metrics(); track metric.key) {
              <div class="metric-card">
                <div class="metric-header">
                  <span class="metric-icon" aria-hidden="true"
                    ><i [class]="'pi ' + metric.icon"></i
                  ></span>
                  <span class="metric-label">{{ metric.label }}</span>
                  <span class="metric-value" [class.warning]="metric.value < 5"
                    >{{ metric.value }}/10</span
                  >
                </div>
                <p-slider
                  [min]="1"
                  [max]="10"
                  [step]="1"
                  (onChange)="onMetricChange(metric.key, $event)"
                ></p-slider>
                <p class="metric-description">{{ metric.description }}</p>
                @if (metric.value < 5) {
                  <div class="metric-warning">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ metric.lowWarning }}
                  </div>
                }
              </div>
            }

            <!-- Additional Notes -->
            <div class="notes-section">
              <app-textarea
                label="Any concerns or notes for today?"
                [value]="notes"
                (valueChange)="onNotesChange($event)"
                [rows]="3"
                placeholder="E.g., slight tightness in hamstring, nervous about opponent..."
              ></app-textarea>
            </div>

            <!-- Readiness Score Preview -->
            <div class="readiness-preview">
              <div class="score-display" [class]="readinessStatus()">
                <div class="score-circle">
                  @if (readinessScore() !== null) {
                    <span class="score-value">{{ readinessScore() }}</span>
                    <span class="score-label">/ 100</span>
                  } @else {
                    <span class="score-value">--</span>
                    <span class="score-label">/ 100</span>
                  }
                  <!-- Data Confidence Indicator -->
                  @if (readinessScore() !== null) {
                    <div class="confidence-wrapper">
                      <app-confidence-indicator
                        [score]="readinessConfidence().score"
                        [missingInputs]="readinessConfidence().missingInputs"
                        [showDetails]="false"
                      ></app-confidence-indicator>
                    </div>
                  }
                </div>
                <div class="score-info">
                  <h3>{{ readinessLabel() }}</h3>
                  <p>{{ readinessMessage() }}</p>
                </div>
              </div>

              @if (readinessScore() !== null && readinessScore()! < 70) {
                <app-alert
                  class="coach-alert-warning"
                  variant="warning"
                  title="Coach will be notified"
                  message="Your readiness score is below 70%. Your coach will receive an alert to discuss modifications."
                  icon="pi-bell"
                />
              }
            </div>

            <!-- Submit Button -->
            <div class="submit-section">
              <app-button
                size="lg"
                iconLeft="pi-check"
                [loading]="isSubmitting()"
                (clicked)="submitReadiness()"
                >Submit Readiness Check</app-button
              >
              <p class="submit-note">
                <i class="pi pi-info-circle"></i>
                Complete this check-in at least 2 hours before competition
              </p>
            </div>
          </div>
        } @else {
          <!-- Confirmation View -->
          <div class="confirmation-view">
            <div class="confirmation-icon" [class]="readinessStatus()">
              @if (readinessScore() !== null) {
                @if (readinessScore()! >= 85) {
                  <i class="pi pi-check-circle" aria-hidden="true"></i>
                } @else if (readinessScore()! >= 70) {
                  <i class="pi pi-thumbs-up" aria-hidden="true"></i>
                } @else {
                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                }
              } @else {
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              }
            </div>

            <h2>Check-in Complete</h2>

            <div class="final-score" [class]="readinessStatus()">
              @if (readinessScore() !== null) {
                <span class="score">{{ readinessScore() }}</span>
              } @else {
                <span class="score">--</span>
              }
              <span class="label">Readiness Score</span>
            </div>

            <div class="recommendations">
              <h3>Pre-Game Recommendations</h3>
              <ul>
                @for (rec of recommendations(); track rec) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </div>

            @if (readinessScore() !== null && readinessScore()! < 70) {
              <div class="coach-notified">
                <i class="pi pi-send"></i>
                <p>
                  Your coach has been notified and may reach out to discuss
                  adjustments.
                </p>
              </div>
            }

            <div class="action-buttons">
              <app-button
                variant="outlined"
                iconLeft="pi-home"
                (clicked)="goToDashboard()"
                >Back to Dashboard</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-heart"
                routerLink="/game/nutrition"
                >Tournament Nutrition</app-button
              >
              <app-button iconLeft="pi-file" (clicked)="viewGamePlan()"
                >View Game Plan</app-button
              >
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `,
})
export class GameDayReadinessComponent implements OnInit {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly supabase = inject(SupabaseService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly gameDayReadinessDataService = inject(
    GameDayReadinessDataService,
  );
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly todayProtocol = this.trainingService.todayProtocol;
  readonly acwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );

  acwrStatus = computed(() => {
    const level = this.acwrDisplay().level;
    if (level === "sweet-spot") return "green";
    if (level === "under-training") return "orange";
    if (level === "elevated-risk") return "yellow";
    if (level === "danger-zone") return "red";
    return "yellow";
  });

  // Form state - CRITICAL: No default values - user must enter their own data
  metrics = signal<ReadinessMetric[]>([
    {
      key: "sleep",
      label: "Sleep Quality",
      icon: "pi-moon",
      value: 0, // Start at 0 - user must set value
      weight: 20,
      description: "How well did you sleep last night?",
      lowWarning: "Poor sleep affects reaction time and decision-making",
    },
    {
      key: "energy",
      label: "Energy Level",
      icon: "pi-bolt",
      value: 0, // Start at 0 - user must set value
      weight: 15,
      description: "How energized do you feel right now?",
      lowWarning: "Low energy may impact your explosiveness",
    },
    {
      key: "soreness",
      label: "Muscle Soreness",
      icon: "pi-chart-line",
      value: 0, // Start at 0 - user must set value
      weight: 20,
      description: "1 = No soreness, 10 = Very sore",
      lowWarning: "High soreness increases injury risk during competition",
    },
    {
      key: "hydration",
      label: "Hydration",
      icon: "pi-heart",
      value: 0, // Start at 0 - user must set value
      weight: 15,
      description: "How well hydrated do you feel?",
      lowWarning: "Dehydration significantly impacts performance",
    },
    {
      key: "mental",
      label: "Mental Focus",
      icon: "pi-lightbulb",
      value: 0, // Start at 0 - user must set value
      weight: 15,
      description: "How focused and mentally prepared are you?",
      lowWarning: "Mental preparation is key for flag football reads",
    },
    {
      key: "confidence",
      label: "Confidence",
      icon: "pi-bolt",
      value: 0, // Start at 0 - user must set value
      weight: 15,
      description: "How confident do you feel about today's competition?",
      lowWarning: "Confidence affects decision-making under pressure",
    },
  ]);

  notes = "";
  isSubmitting = signal(false);
  isSubmitted = signal(false);

  // Game info from route params
  gameInfo = signal("Today's Competition");

  // Computed readiness score (0-100)
  readinessScore = computed(() => {
    const m = this.metrics();
    // CRITICAL: Only calculate if all metrics have been set (value > 0)
    const allMetricsSet = m.every((metric) => metric.value > 0);
    if (!allMetricsSet) {
      return null; // No calculation until user enters all values
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    m.forEach((metric) => {
      let normalizedValue = metric.value;
      // Invert soreness (lower is better)
      if (metric.key === "soreness") {
        normalizedValue = 11 - metric.value;
      }
      totalWeightedScore += (normalizedValue / 10) * metric.weight;
      totalWeight += metric.weight;
    });

    // Factor in ACWR penalty if in danger zone
    let acwrPenalty = 0;
    const acwr = this.acwrDisplay().value;
    if (acwr !== null) {
      if (acwr > 1.5) acwrPenalty = 15;
      else if (acwr > 1.3) acwrPenalty = 5;
      else if (acwr < 0.8 && acwr > 0) acwrPenalty = 10;
    }

    const baseScore = Math.round((totalWeightedScore / totalWeight) * 100);
    return Math.max(0, baseScore - acwrPenalty);
  });

  readinessStatus = computed(() => {
    const score = this.readinessScore();
    if (score === null) return "info"; // No data yet
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 55) return "caution";
    return "concern";
  });

  readinessLabel = computed(() => {
    const status = this.readinessStatus();
    if (status === "info") return "Complete Check-in";
    switch (status) {
      case "excellent":
        return "Competition Ready";
      case "good":
        return "Good to Compete";
      case "caution":
        return "Proceed with Caution";
      case "concern":
        return "Concerns Identified";
      default:
        return "Complete Check-in";
    }
  });

  readinessMessage = computed(() => {
    const status = this.readinessStatus();
    if (status === "info")
      return "Please complete all metrics below to see your readiness score.";
    switch (status) {
      case "excellent":
        return "You're in great shape for today's competition. Go get it!";
      case "good":
        return "You're ready to compete. Focus on your warmup and stay hydrated.";
      case "caution":
        return "Some areas need attention. Consider modified warmup and communicate with your coach.";
      case "concern":
        return "Multiple concerns flagged. Your coach will be notified to discuss options.";
      default:
        return "Please complete all metrics below to see your readiness score.";
    }
  });

  // Readiness confidence score
  readinessConfidence = computed(() => {
    const m = this.metrics();
    const allMetricsSet = m.every((metric) => metric.value > 0);

    if (!allMetricsSet) {
      const completedMetrics = m.filter((metric) => metric.value > 0).length;
      const totalMetrics = m.length;
      const completeness = completedMetrics / totalMetrics;

      return {
        score: completeness,
        missingInputs: m
          .filter((metric) => metric.value === 0)
          .map((metric) => metric.label.toLowerCase()),
        staleData: [],
      };
    }

    // All metrics completed - high confidence
    return {
      score: 1.0,
      missingInputs: [],
      staleData: [],
    };
  });

  recommendations = computed(() => {
    const recs: string[] = [];
    const m = this.metrics();
    const acwr = this.acwrDisplay().value;

    // Sleep recommendations
    const sleep = m.find((x) => x.key === "sleep");
    if (sleep && sleep.value < 6) {
      recs.push("Consider a 20-minute power nap before warmup if possible");
      recs.push("Increase caffeine intake moderately (200-300mg)");
    }

    // Soreness recommendations
    const soreness = m.find((x) => x.key === "soreness");
    if (soreness && soreness.value > 6) {
      recs.push("Extended dynamic warmup (15-20 minutes)");
      recs.push("Focus on mobility work for affected areas");
      recs.push("Consider reduced sprint volume during competition");
    }

    // Hydration recommendations
    const hydration = m.find((x) => x.key === "hydration");
    if (hydration && hydration.value < 6) {
      recs.push("Drink 500ml water in the next hour");
      recs.push("Add electrolytes to your pre-game hydration");
    }

    // Mental focus recommendations
    const mental = m.find((x) => x.key === "mental");
    if (mental && mental.value < 6) {
      recs.push("5-minute visualization exercise before warmup");
      recs.push("Review game plan and key assignments");
    }

    // ACWR recommendations
    if (acwr !== null && acwr > 1.3) {
      recs.push("Monitor fatigue levels closely during competition");
      recs.push("Consider rotation strategy with coach");
    }

    // Default recommendations
    if (recs.length === 0) {
      recs.push("Standard dynamic warmup protocol");
      recs.push("Stay hydrated throughout competition");
      recs.push("Trust your preparation and compete with confidence");
    }

    return recs;
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParamMap) => {
        this.applyRouteState(queryParamMap);
      });

    this.trainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.logger.warn(
            "[GameDayReadiness] Failed to load protocol context",
            toLogContext(error),
          );
        },
      });
  }

  private applyRouteState(queryParamMap: ParamMap): void {
    this.gameInfo.set(queryParamMap.get("game") ?? "");
  }

  updateMetric(key: string, value: number): void {
    const current = this.metrics();
    const updated = current.map((m) => (m.key === key ? { ...m, value } : m));
    this.metrics.set(updated);
  }

  onMetricChange(key: string, event: { value?: number | null }): void {
    this.updateMetric(key, event.value || 1);
  }

  onNotesChange(value: string): void {
    this.notes = value;
  }

  onNotesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.notes = input?.value ?? "";
  }

  async submitReadiness(): Promise<void> {
    this.isSubmitting.set(true);

    try {
      const user = this.supabase.currentUser();
      if (!user?.id) {
        this.toastService.error(TOAST.ERROR.LOGIN_TO_SUBMIT_READINESS);
        return;
      }

      const metrics = this.metrics();
      // CRITICAL: Only submit if all metrics are set
      const allMetricsSet = metrics.every((m) => m.value > 0);
      if (!allMetricsSet) {
        this.toastService.error(TOAST.ERROR.INCOMPLETE_METRICS);
        this.isSubmitting.set(false);
        return;
      }

      const readinessData = {
        athlete_id: user.id,
        date: new Date().toISOString().split("T")[0],
        check_in_time: new Date().toISOString(),
        sleep_quality: metrics.find((m) => m.key === "sleep")?.value,
        energy_level: metrics.find((m) => m.key === "energy")?.value,
        muscle_soreness: metrics.find((m) => m.key === "soreness")?.value,
        hydration_level: metrics.find((m) => m.key === "hydration")?.value,
        mental_focus: metrics.find((m) => m.key === "mental")?.value,
        confidence_level: metrics.find((m) => m.key === "confidence")?.value,
        readiness_score: this.readinessScore() ?? 0,
        acwr_at_checkin: this.acwrDisplay().value,
        notes: this.notes || null,
        game_info: this.gameInfo(),
      };

      // Save to game_day_readiness table
      const { error } =
        await this.gameDayReadinessDataService.submitReadinessEntry(
          readinessData,
        );

      if (error) {
        // Fallback: save as wellness entry
        this.logger.warn(
          "[GameDayReadiness] Table not found, saving as wellness entry",
        );
        await this.trainingService.submitWellness({
          sleep: readinessData.sleep_quality,
          energy: readinessData.energy_level,
          soreness: readinessData.muscle_soreness,
          hydration: readinessData.hydration_level,
          motivation: readinessData.confidence_level,
          notes: `[Game Day Check-in] Score: ${readinessData.readiness_score}. ${this.notes}`,
        });
      }

      // Alert coach if readiness is low
      const score = this.readinessScore();
      if (score !== null && score < 70) {
        await this.notifyCoach(user.id, readinessData);
      }

      this.isSubmitted.set(true);
      this.toastService.success(TOAST.SUCCESS.GAME_DAY_READINESS_SUBMITTED);
      this.logger.success("game_day_readiness_checkin_saved");
    } catch (error) {
      this.logger.error("game_day_readiness_submit_failed", error);
      this.toastService.error(TOAST.ERROR.READINESS_SUBMIT_FAILED);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async notifyCoach(
    athleteId: string,
    readinessData: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Get athlete's team using centralized service
      const teamId = this.teamMembershipService.teamId();
      if (!teamId) return;

      // Get coaches for this team using centralized service
      const coaches = await this.teamMembershipService.getTeamCoaches();
      if (!coaches?.length) return;

      const user = this.supabase.currentUser();
      const metadata = user?.user_metadata as
        | { fullName?: string; firstName?: string }
        | undefined;
      const athleteName =
        metadata?.fullName || metadata?.firstName || user?.email || "An athlete";

      // Create notifications for coaches
      for (const coach of coaches) {
        await this.gameDayReadinessDataService.notifyCoach({
          userId: coach.userId,
          message: `${athleteName} reported a readiness score of ${readinessData["readiness_score"]}/100 before competition. Review recommended.`,
          data: {
            athleteId,
            readinessScore: readinessData["readiness_score"],
          },
        });
      }

      this.logger.info("game_day_readiness_coach_notification_sent");
    } catch (error) {
      this.logger.warn(
        "[GameDayReadiness] Could not notify coach:",
        toLogContext(error),
      );
    }
  }

  goToDashboard(): void {
    this.router.navigate(["/dashboard"]);
  }

  viewGamePlan(): void {
    this.router.navigate(["/tournaments"]);
  }
}
