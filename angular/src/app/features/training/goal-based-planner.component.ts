import {
  Component,
  OnInit,
  inject,
  signal,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { Select } from "primeng/select";
import { ButtonComponent } from "../../shared/components/button/button.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  TrainingPlanService,
  TrainingGoal,
  WeeklyTrainingPlan,
} from "../../core/services/training-plan.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { LoggerService } from "../../core/services/logger.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-goal-based-planner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Select,
    StatusTagComponent,
    TrafficLightRiskComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="goal-planner-page ui-page-stack">
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
            <label class="goal-selection__label"
              >Select Training Goal</label
            >
            <p-select
              [ngModel]="selectedGoal()"
              [options]="goalOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Choose your primary goal"
              (onChange)="onGoalValueChange($event.value)"
            >
            </p-select>
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
                    {{ currentACWR() | number: "1.2-2" }}
                  </div>
                </div>
                <div class="stat-item stat-block stat-block--compact">
                  <div class="stat-block__label">
                    Readiness
                  </div>
                  <div class="stat-block__value">
                    <app-status-tag
                      [severity]="getReadinessSeverity()"
                      [value]="readinessLevel() ?? 'unknown' | titlecase"
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
                [acwrValue]="currentACWR()"
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
export class GoalBasedPlannerComponent implements OnInit {
  athleteId = input.required<string>();

  private trainingPlanService = inject(TrainingPlanService);
  private trainingService = inject(UnifiedTrainingService);
  private logger = inject(LoggerService);

  selectedGoal = signal<TrainingGoal | null>(null);
  weeklyPlan = signal<WeeklyTrainingPlan | null>(null);
  loading = signal(false);
  saving = signal(false);
  gameDays = signal<Date[]>([]);

  currentACWR = this.trainingService.acwrRatio;
  currentRiskZone = this.trainingService.acwrRiskZone;
  readinessLevel = this.trainingService.readinessLevel;

  goalOptions = [
    { label: "Speed", value: "speed" },
    { label: "Change of Direction", value: "change-of-direction" },
    { label: "Agility", value: "agility" },
    { label: "Route Running", value: "route-running" },
    { label: "Defense", value: "defense" },
    { label: "Power", value: "power" },
    { label: "Endurance", value: "endurance" },
  ];

  async ngOnInit() {
    const athleteIdValue = this.athleteId();
    if (athleteIdValue) {
      const games = await this.trainingPlanService.getUpcomingGames(
        athleteIdValue,
        14,
      );
      this.gameDays.set(games);
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

  async generatePlan() {
    const goal = this.selectedGoal();
    if (!goal || !this.athleteId) return;

    this.loading.set(true);

    try {
      const level = this.readinessLevel();
      const plan = this.trainingPlanService.generateWeeklyPlan({
        goal: goal,
        currentACWR: this.currentACWR(),
        readinessLevel: level ?? "moderate", // Default to moderate if no data
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
    const acwr = this.currentACWR();
    if (acwr > 1.5) return "text-red-600";
    if (acwr > 1.3) return "text-yellow-600";
    if (acwr < 0.8) return "text-orange-500";
    return "text-green-600";
  }

  getReadinessSeverity(): "success" | "warning" | "danger" {
    const level = this.readinessLevel();
    if (level === null) return "warning"; // No data = warning
    const severity = this.trainingService.getReadinessSeverity(level);
    return severity === "warning" ? "warning" : severity;
  }

  getProgressionRule(): string {
    const acwr = this.currentACWR();
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
    if (!plan) return;

    this.saving.set(true);
    try {
      // In a real app, this would call a service to save to Supabase
      // For now, we simulate a save and show success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.trainingService.logTrainingSession({
        title: `Plan: ${this.getGoalLabel()}`,
        date: new Date().toISOString(),
        notes: `Auto-generated ${this.getGoalLabel()} plan saved.`,
      });
      this.logger.info("Training plan saved to schedule");
    } catch (error) {
      this.logger.error("Failed to save training plan", error);
    } finally {
      this.saving.set(false);
    }
  }
}
