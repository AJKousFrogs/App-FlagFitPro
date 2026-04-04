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
  template: `
    <app-main-layout>
      <div class="goal-planner-page ui-page-shell ui-page-stack">
        <!-- Page Header -->
        <app-page-header
          title="Goal-Based Training Planner"
          subtitle="Select your goal and get an auto-generated weekly training plan"
          icon="pi-calendar-plus"
        >
        </app-page-header>

        <div class="goal-planner-content ui-page-stack">
          <!-- Goal Selection -->
          <div class="goal-selection">
            <app-select
              label="Select Training Goal"
              [ngModel]="selectedGoal()"
              [options]="goalOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Choose your primary goal"
              (onChange)="onGoalSelect($event)"
            ></app-select>
            <p class="goal-selection__hint">
              The plan will auto-adjust based on your ACWR and readiness scores
            </p>
          </div>

          <!-- Current Status -->
          @if (selectedGoal()) {
            <div class="status-section">
              <div class="status-grid">
                <div class="stat-item stat-block stat-block--compact">
                  <div class="stat-block__label">
                    Current ACWR
                  </div>
                  <div
                    class="stat-block__value"
                    [class]="getACWRColorClass()"
                  >
                    {{ currentAcwrValue() | number: "1.2-2" }}
                  </div>
                </div>
                <div class="stat-item stat-block stat-block--compact">
                  <div class="stat-block__label">
                    Readiness
                  </div>
                  <div class="stat-block__value">
                    <app-status-tag
                      [severity]="getReadinessSeverity()"
                      [value]="readinessPresentation().label"
                      size="sm"
                    />
                  </div>
                </div>
                <div class="stat-item stat-block stat-block--compact">
                  <div class="stat-block__label">
                    Progression Rule
                  </div>
                  <div class="stat-block__value stat-block__value--sm">
                    {{ getProgressionRule() }}
                  </div>
                </div>
              </div>
              <app-traffic-light-risk
                [riskZone]="currentRiskZone()"
                [acwrValue]="currentAcwrValue()"
              >
              </app-traffic-light-risk>
            </div>

            <!-- Weekly Plan -->
            @if (weeklyPlan()) {
              <div class="weekly-plan-section">
                <div class="plan-header">
                  <h3 class="plan-header__title">
                    Weekly Training Plan - {{ getGoalLabel() }}
                  </h3>
                  <app-status-tag
                    [value]="weeklyPlan()?.phase || '' | titlecase"
                    severity="info"
                    size="sm"
                  />
                </div>

                <div class="sessions-grid">
                  @for (session of weeklyPlan()?.sessions; track session.day) {
                    <div
                      class="session-card"
                      [class]="getSessionCardClass(session)"
                    >
                      <div class="session-header mb-3">
                        <div class="day-name font-bold text-lg">
                          {{ getDayName(session.day) }}
                        </div>
                        <app-status-tag
                          [value]="session.sessionType | titlecase"
                          [severity]="
                            getSessionTypeSeverity(session.sessionType)
                          "
                          size="sm"
                        />
                      </div>

                      <div class="session-details">
                        <div class="focus-area mb-2">
                          <div class="text-xs text-text-secondary mb-1">
                            Focus
                          </div>
                          <div class="text-sm font-semibold">
                            {{ session.focus.join(", ") }}
                          </div>
                        </div>

                        <div class="exercises mb-2">
                          <div class="text-xs text-text-secondary mb-1">
                            Exercises
                          </div>
                          <ul class="text-xs list-disc list-inside">
                            @for (
                              exercise of session.exercises.slice(0, 3);
                              track exercise
                            ) {
                              <li>{{ exercise }}</li>
                            }
                            @if (session.exercises.length > 3) {
                              <li class="text-text-secondary">
                                +{{ session.exercises.length - 3 }} more
                              </li>
                            }
                          </ul>
                        </div>

                        <div class="session-metrics">
                          <div>
                            <div class="text-xs text-text-secondary">
                              Duration
                            </div>
                            <div class="font-semibold">
                              {{ session.duration }} min
                            </div>
                          </div>
                          <div>
                            <div class="text-xs text-text-secondary">
                              Intensity
                            </div>
                            <div
                              class="font-semibold"
                              [class]="
                                'text-' + getIntensityColor(session.intensity)
                              "
                            >
                              {{ session.intensity | titlecase }}
                            </div>
                          </div>
                          <div>
                            <div class="text-xs text-text-secondary">
                              Volume
                            </div>
                            <div class="font-semibold">
                              {{ session.volume }}
                            </div>
                          </div>
                          <div>
                            <div class="text-xs text-text-secondary">Rest</div>
                            <div class="font-semibold text-xs">
                              {{ session.restPeriods }}
                            </div>
                          </div>
                        </div>

                        @if (session.notes) {
                          <div class="notes">
                            <div class="text-xs text-text-secondary italic">
                              {{ session.notes }}
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Plan Summary -->
                <div class="plan-summary">
                  <h4 class="plan-summary__title">
                    Plan Summary
                  </h4>
                  <div class="plan-summary-grid">
                    <div>
                      <div class="text-xs text-text-secondary">
                        Total Volume
                      </div>
                      <div class="text-lg font-bold">
                        {{ weeklyPlan()?.totalVolume }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-text-secondary">
                        Training Days
                      </div>
                      <div class="text-lg font-bold">
                        {{ getTrainingDays() }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-text-secondary">ACWR Target</div>
                      <div class="text-lg font-bold">
                        {{
                          weeklyPlan()?.progressionRules?.acwrThreshold
                            | number: "1.2-2"
                        }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-text-secondary">
                        Volume Adjustment
                      </div>
                      <div
                        class="text-lg font-bold"
                        [class]="
                          (weeklyPlan()?.progressionRules?.volumeAdjustment ??
                            0) > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        "
                      >
                        {{
                          (weeklyPlan()?.progressionRules?.volumeAdjustment ??
                            0) > 0
                            ? "+"
                            : ""
                        }}{{
                          weeklyPlan()?.progressionRules?.volumeAdjustment
                        }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          }

          <!-- Generate Button -->
          @if (selectedGoal()) {
            <div class="actions">
              <app-button
                variant="outlined"
                iconLeft="pi-save"
                [loading]="saving()"
                (clicked)="savePlan()"
                >Save to Schedule</app-button
              >
              <app-button
                iconLeft="pi-calculator"
                [loading]="loading()"
                (clicked)="generatePlan()"
                >Generate Plan</app-button
              >
            </div>
          }
        </div>
      </div>
    </app-main-layout>
  `,
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
  readonly currentAcwrValue = computed(
    () => this.acwrDisplay().value ?? this.trainingService.acwrRatio(),
  );
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
      this.logger.warn("[GoalPlanner] Failed to load upcoming games", error);
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
