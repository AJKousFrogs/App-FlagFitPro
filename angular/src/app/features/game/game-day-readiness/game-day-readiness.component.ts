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
import { HomeRouteService } from "../../../core/services/home-route.service";
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
  templateUrl: "./game-day-readiness.component.html",
})
export class GameDayReadinessComponent implements OnInit {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly supabase = inject(SupabaseService);
  private readonly toastService = inject(ToastService);
  private readonly homeRouteService = inject(HomeRouteService);
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

  goToHome(): void {
    this.router.navigateByUrl(this.homeRouteService.getHomeRoute());
  }

  viewGamePlan(): void {
    this.router.navigate(["/tournaments"]);
  }
}
