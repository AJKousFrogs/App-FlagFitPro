import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { type SelectChangeEvent } from "primeng/select";
import { SelectComponent } from "../../shared/components/select/select.component";
import { ButtonComponent } from "../../shared/components/button/button.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  TrainingPlanService,
  TrainingGoal,
  WeeklyTrainingPlan,
} from "../../core/services/training-plan.service";
import type { GameWeekType } from "../../core/services/flag-football-performance-system.data";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  getProtocolAcwrDisplay,
  getProtocolReadinessPresentation,
  getProtocolRiskZone,
  getProtocolTrainingPlanReadinessLevel,
} from "../../core/utils/protocol-metrics-presentation";

@Component({
  selector: "app-goal-based-planner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SelectComponent,
    StatusTagComponent,
    TrafficLightRiskComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: "./goal-based-planner.component.html",
  styleUrl: "./goal-based-planner.component.scss",
})
export class GoalBasedPlannerComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly trainingPlanService = inject(TrainingPlanService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  private lastLoadedAthleteId: string | null = null;
  private lastOverviewAthleteId: string | null = null;

  selectedGoal = signal<TrainingGoal | null>(null);
  teamPracticeCount = signal(2);
  gameWeekContext = signal<GameWeekType | "auto">("auto");
  weeklyPlan = signal<WeeklyTrainingPlan | null>(null);
  loading = signal(false);
  saving = signal(false);
  gameDays = signal<Date[]>([]);

  readonly currentUserId = computed(() => this.supabase.userId());
  readonly todayProtocol = this.trainingService.todayProtocol;
  readonly fallbackReadinessLevel = this.trainingService.readinessLevel;
  readonly acwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
  readonly currentAcwrValue = computed(() => {
    const displayValue = this.acwrDisplay().value;
    if (displayValue != null) {
      return displayValue;
    }

    return this.trainingService.acwrRatio() ?? 0;
  });
  readonly currentRiskZone = computed(() =>
    getProtocolRiskZone(
      this.todayProtocol(),
      this.trainingService.acwrRiskZone(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
  readonly readinessPresentation = computed(() =>
    getProtocolReadinessPresentation(
      this.todayProtocol(),
      this.trainingService.readinessScore(),
    ),
  );
  readonly trainingPlanReadinessLevel = computed(() =>
    getProtocolTrainingPlanReadinessLevel(
      this.todayProtocol(),
      this.fallbackReadinessLevel(),
      this.trainingService.readinessScore(),
    ),
  );

  goalOptions = [
    { label: "Speed", value: "speed" },
    { label: "Change of Direction", value: "change-of-direction" },
    { label: "Agility", value: "agility" },
    { label: "Route Running", value: "route-running" },
    { label: "Defense", value: "defense" },
    { label: "Power", value: "power" },
    { label: "Endurance", value: "endurance" },
  ];

  practiceOptions = [
    { label: "0 team practices", value: 0 },
    { label: "1 team practice", value: 1 },
    { label: "2 team practices", value: 2 },
    { label: "3 team practices", value: 3 },
    { label: "4 team practices", value: 4 },
  ];

  gameWeekOptions: { label: string; value: GameWeekType | "auto" }[] = [
    { label: "Auto from schedule", value: "auto" },
    { label: "Training week", value: "training-week" },
    { label: "Single game", value: "single-game" },
    { label: "Doubleheader", value: "doubleheader" },
    { label: "Tournament", value: "tournament" },
    { label: "International tournament", value: "international-tournament" },
  ];

  constructor() {
    effect(() => {
      const athleteId = this.currentUserId();
      if (athleteId === this.lastLoadedAthleteId) {
        return;
      }

      this.lastLoadedAthleteId = athleteId;
      void this.syncGameDays(athleteId);
    });

    effect(() => {
      const athleteId = this.currentUserId();
      if (!athleteId || athleteId === this.lastOverviewAthleteId) {
        return;
      }

      this.lastOverviewAthleteId = athleteId;
      this.trainingService.getTodayOverview().subscribe({
        error: (error) =>
          this.logger.warn(
            "[GoalPlanner] Failed to load protocol overview, using live metric fallback",
            error,
          ),
      });
    });
  }

  private async syncGameDays(athleteId: string | null): Promise<void> {
    if (!athleteId) {
      this.gameDays.set([]);
      return;
    }

    try {
      const games = await this.trainingPlanService.getUpcomingGames(
        athleteId,
        14,
      );
      if (this.currentUserId() !== athleteId) {
        return;
      }
      this.gameDays.set(games);
    } catch (error) {
      this.logger.warn("goal_planner_upcoming_games_failed", error);
      this.gameDays.set([]);
    }
  }

  onGoalChange() {
    if (this.selectedGoal()) {
      this.generatePlan();
    }
  }

  onGoalValueChange(value: TrainingGoal | null | undefined): void {
    this.selectedGoal.set(value ?? null);
    this.onGoalChange();
  }

  onGoalSelect(event: SelectChangeEvent): void {
    this.onGoalValueChange(
      (event.value as TrainingGoal | null | undefined) ?? null,
    );
  }

  onPracticeCountSelect(event: SelectChangeEvent): void {
    this.teamPracticeCount.set(Number(event.value ?? 0));
    if (this.selectedGoal()) {
      this.generatePlan();
    }
  }

  onGameWeekContextSelect(event: SelectChangeEvent): void {
    this.gameWeekContext.set(
      (event.value as GameWeekType | "auto" | null | undefined) ?? "auto",
    );
    if (this.selectedGoal()) {
      this.generatePlan();
    }
  }

  async generatePlan() {
    const goal = this.selectedGoal();
    if (!goal || !this.currentUserId()) return;

    this.loading.set(true);

    try {
      const plan = this.trainingPlanService.generateWeeklyPlan({
        goal: goal,
        currentACWR: this.currentAcwrValue(),
        readinessLevel: this.trainingPlanReadinessLevel(),
        gameDays: this.gameDays(),
        teamPracticesPerWeek: this.teamPracticeCount(),
        gameWeekType:
          this.gameWeekContext() === "auto"
            ? undefined
            : this.gameWeekContext() as GameWeekType,
      });

      this.weeklyPlan.set(plan);
    } catch (error) {
      this.logger.error("Error generating plan:", error);
    } finally {
      this.loading.set(false);
    }
  }

  getGoalLabel(): string {
    return (
      this.goalOptions.find((g) => g.value === this.selectedGoal())?.label || ""
    );
  }

  getDayName(dayIndex: number): string {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[dayIndex] || "";
  }

  getACWRColorClass(): string {
    const acwr = this.currentAcwrValue();
    if (acwr > 1.5) return "text-red-600";
    if (acwr > 1.3) return "text-yellow-600";
    if (acwr < 0.8) return "text-orange-500";
    return "text-green-600";
  }

  getReadinessSeverity(): "success" | "warning" | "danger" | "info" {
    const severity = this.readinessPresentation().severity;
    if (severity === "success" || severity === "warning" || severity === "danger") {
      return severity;
    }
    return "info";
  }

  getProgressionRule(): string {
    const acwr = this.currentAcwrValue();
    if (acwr > 1.5) return "Reduce volume 30%";
    if (acwr > 1.3) return "Reduce volume 15%";
    if (acwr < 0.8) return "Increase volume 10%";
    return "Maintain current load";
  }

  getPerformanceContextLabel(): string {
    const context = this.weeklyPlan()?.performanceSystem;
    if (!context) return "Not generated";
    return `${context.densityLabel} / ${context.teamPracticeCount} team practices`;
  }

  getSessionCardClass(session: {
    sessionType?: string;
    intensity?: string;
  }): string {
    if (session.sessionType === "recovery" || session.sessionType === "game") {
      return "border-gray-300";
    }
    if (session.intensity === "high") return "border-orange-500 bg-orange-50";
    if (session.intensity === "medium") return "border-blue-500 bg-blue-50";
    return "border-green-500 bg-green-50";
  }

  getSessionTypeSeverity(
    type: string,
  ): "success" | "info" | "warning" | "danger" {
    const severityMap: Record<
      string,
      "success" | "info" | "warning" | "danger"
    > = {
      speed: "danger",
      agility: "warning",
      strength: "info",
      technique: "success",
      conditioning: "warning",
      recovery: "success",
      game: "info",
    };
    return severityMap[type] || "info";
  }

  getIntensityColor(intensity: string): string {
    if (intensity === "high") return "red-600";
    if (intensity === "medium") return "yellow-600";
    return "green-600";
  }

  getTrainingDays(): number {
    return (
      this.weeklyPlan()?.sessions.filter(
        (s) => s.sessionType !== "recovery" && s.sessionType !== "game",
      ).length || 0
    );
  }

  async savePlan() {
    const plan = this.weeklyPlan();
    const athleteId = this.currentUserId();
    const goal = this.selectedGoal();
    if (!plan || !athleteId || !goal) return;

    this.saving.set(true);
    try {
      const saved = await this.trainingPlanService.savePlan(athleteId, {
        ...plan,
        goal,
      });

      if (!saved) {
        throw new Error("Training plan save returned an unsuccessful response");
      }

      this.logger.info("Training plan saved to schedule", {
        athleteId,
        goal,
      });
      this.toastService.success(
        `${this.getGoalLabel()} plan saved to your schedule.`,
        "Plan Saved",
      );
      await this.router.navigate(["/training"]);
    } catch (error) {
      this.logger.error("Failed to save training plan", error);
      this.toastService.error("Failed to save training plan. Please try again.");
    } finally {
      this.saving.set(false);
    }
  }
}
