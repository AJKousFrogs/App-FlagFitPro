import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Select } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import {
  TrainingPlanService,
  TrainingGoal,
  WeeklyTrainingPlan,
} from "../../core/services/training-plan.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { LoggerService } from "../../core/services/logger.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";

@Component({
  selector: "app-goal-based-planner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Select,
    ButtonModule,
    TagModule,
    TrafficLightRiskComponent,
  ],
  template: `
    <div class="goal-planner bg-surface-primary rounded-lg shadow-medium p-6">
      <div class="header mb-6">
        <h2 class="text-2xl font-bold text-text-primary mb-2">
          Goal-Based Training Planner
        </h2>
        <p class="text-text-secondary">
          Select your goal and get an auto-generated weekly training plan
        </p>
      </div>

      <!-- Goal Selection -->
      <div class="goal-selection mb-6 p-4 bg-surface-secondary rounded-lg">
        <label class="block text-sm font-semibold text-text-primary mb-3"
          >Select Training Goal</label
        >
        <p-select
          [(ngModel)]="selectedGoal"
          [options]="goalOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Choose your primary goal"
          class="w-full"
          (onChange)="onGoalChange()"
        >
        </p-select>
        <p class="text-xs text-text-secondary mt-2">
          The plan will auto-adjust based on your ACWR and readiness scores
        </p>
      </div>

      <!-- Current Status -->
      @if (selectedGoal()) {
        <div class="status-section mb-6 p-4 bg-surface-secondary rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="stat-item">
              <div class="stat-label text-xs text-text-secondary">
                Current ACWR
              </div>
              <div
                class="stat-value text-lg font-bold"
                [class]="getACWRColorClass()"
              >
                {{ currentACWR() | number: "1.2-2" }}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label text-xs text-text-secondary">
                Readiness
              </div>
              <div class="stat-value text-lg font-bold">
                <p-tag
                  [severity]="getReadinessSeverity()"
                  [value]="readinessLevel() | titlecase"
                ></p-tag>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label text-xs text-text-secondary">
                Progression Rule
              </div>
              <div class="stat-value text-sm font-semibold">
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
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-text-primary">
                Weekly Training Plan - {{ getGoalLabel() }}
              </h3>
              <p-tag
                [value]="weeklyPlan()?.phase || '' | titlecase"
                severity="info"
              ></p-tag>
            </div>

            <div class="sessions-grid grid grid-cols-1 md:grid-cols-7 gap-4">
              @for (session of weeklyPlan()?.sessions; track session.day) {
                <div
                  class="session-card p-4 rounded-lg border-2 bg-white"
                  [class]="getSessionCardClass(session)"
                >
                  <div class="session-header mb-3">
                    <div class="day-name font-bold text-lg">
                      {{ getDayName(session.day) }}
                    </div>
                    <p-tag
                      [value]="session.sessionType | titlecase"
                      [severity]="getSessionTypeSeverity(session.sessionType)"
                    ></p-tag>
                  </div>

                  <div class="session-details">
                    <div class="focus-area mb-2">
                      <div class="text-xs text-text-secondary mb-1">Focus</div>
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

                    <div
                      class="session-metrics grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200"
                    >
                      <div>
                        <div class="text-xs text-text-secondary">Duration</div>
                        <div class="font-semibold">
                          {{ session.duration }} min
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-text-secondary">Intensity</div>
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
                        <div class="text-xs text-text-secondary">Volume</div>
                        <div class="font-semibold">{{ session.volume }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-text-secondary">Rest</div>
                        <div class="font-semibold text-xs">
                          {{ session.restPeriods }}
                        </div>
                      </div>
                    </div>

                    @if (session.notes) {
                      <div class="notes mt-2 pt-2 border-t border-gray-100">
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
            <div class="plan-summary mt-6 p-4 bg-surface-secondary rounded-lg">
              <h4 class="font-semibold text-text-primary mb-3">Plan Summary</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div class="text-xs text-text-secondary">Total Volume</div>
                  <div class="text-lg font-bold">
                    {{ weeklyPlan()?.totalVolume }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-text-secondary">Training Days</div>
                  <div class="text-lg font-bold">{{ getTrainingDays() }}</div>
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
                      (weeklyPlan()?.progressionRules?.volumeAdjustment ?? 0) >
                      0
                        ? 'text-green-600'
                        : 'text-red-600'
                    "
                  >
                    {{
                      (weeklyPlan()?.progressionRules?.volumeAdjustment ?? 0) >
                      0
                        ? "+"
                        : ""
                    }}{{ weeklyPlan()?.progressionRules?.volumeAdjustment }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      }

      <!-- Generate Button -->
      @if (selectedGoal()) {
        <div class="actions mt-6 flex justify-end gap-3">
          <p-button
            label="Save to Schedule"
            icon="pi pi-save"
            [outlined]="true"
            [loading]="saving()"
            (onClick)="savePlan()"
          >
          </p-button>
          <p-button
            label="Generate Plan"
            icon="pi pi-calculator"
            [loading]="loading()"
            (onClick)="generatePlan()"
          >
          </p-button>
        </div>
      }
    </div>
  `,
  styleUrl: './goal-based-planner.component.scss',
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

  async generatePlan() {
    if (!this.selectedGoal() || !this.athleteId) return;

    this.loading.set(true);

    try {
      const plan = this.trainingPlanService.generateWeeklyPlan({
        goal: this.selectedGoal()!,
        currentACWR: this.currentACWR(),
        readinessLevel: this.readinessLevel(),
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

  getReadinessSeverity(): "success" | "warn" | "danger" {
    return this.trainingService.getReadinessSeverity(this.readinessLevel());
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

  getSessionTypeSeverity(type: string): "success" | "info" | "warn" | "danger" {
    const severityMap: Record<string, "success" | "info" | "warn" | "danger"> =
      {
        speed: "danger",
        agility: "warn",
        strength: "info",
        technique: "success",
        conditioning: "warn",
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.trainingService.logTrainingSession({
        title: `Plan: ${this.getGoalLabel()}`,
        date: new Date().toISOString(),
        notes: `Auto-generated ${this.getGoalLabel()} plan saved.`
      });
      this.logger.info("Training plan saved to schedule");
    } catch (error) {
      this.logger.error("Failed to save training plan", error);
    } finally {
      this.saving.set(false);
    }
  }
}
