import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import { TrainingMetricsService } from "../../core/services/training-metrics.service";
import { TrainingPlanService } from "../../core/services/training-plan.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface DayPlan {
  day: string;
  date: Date;
  suggestedSprintLoad: number;
  suggestedIntensity: "low" | "medium" | "high" | "rest";
  maxSprints: number;
  recommendedDuration: number;
  reasoning: string;
  acwrProjection: number;
}

@Component({
  selector: "app-microcycle-planner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TrafficLightRiskComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
  ],
  template: `
    <app-main-layout>
      <div class="microcycle-planner-page">
        <!-- Page Header -->
        <app-page-header
          title="Weekly Microcycle Planner"
          subtitle="AI-powered sprint load suggestions based on ACWR"
          icon="pi-calendar"
        >
        </app-page-header>

        <div class="microcycle-planner-content">

      <!-- Current ACWR Status -->
      <div class="current-status mb-6 p-4 bg-surface-secondary rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-text-primary">
              Current ACWR Status
            </h3>
            <p class="text-sm text-text-secondary">
              Last updated: {{ lastUpdate() | date: "short" }}
            </p>
          </div>
          <app-traffic-light-risk
            [riskZone]="currentRiskZone()"
            [acwrValue]="currentACWR()"
          >
          </app-traffic-light-risk>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="stat-card">
            <div class="stat-label">Acute Load</div>
            <div class="stat-value">{{ acuteLoad() | number: "1.0-0" }} AU</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Chronic Load</div>
            <div class="stat-value">
              {{ chronicLoad() | number: "1.0-0" }} AU
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">ACWR Ratio</div>
            <div class="stat-value" [class]="'text-' + getRiskColor()">
              {{ currentACWR() | number: "1.2-2" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Plan -->
      <div class="weekly-plan">
        <h3 class="text-xl font-semibold text-text-primary mb-4">
          7-Day Sprint Load Plan
        </h3>
        <div class="days-grid grid grid-cols-1 md:grid-cols-7 gap-4">
          @for (day of weeklyPlan(); track day.day) {
            <div
              class="day-card p-4 rounded-lg border-2"
              [class]="getDayCardClass(day)"
            >
              <div class="day-header mb-3">
                <div class="day-name font-bold text-lg">{{ day.day }}</div>
                <div class="day-date text-sm text-text-secondary">
                  {{ day.date | date: "MMM d" }}
                </div>
              </div>

              <div class="day-content">
                <div
                  class="intensity-badge mb-3"
                  [class]="'intensity-' + day.suggestedIntensity"
                >
                  {{ day.suggestedIntensity | titlecase }}
                </div>

                @if (day.suggestedIntensity !== "rest") {
                  <div class="sprint-load mb-2">
                    <div class="text-xs text-text-secondary mb-1">
                      Sprint Load
                    </div>
                    <div
                      class="text-2xl font-bold"
                      [style.color]="
                        getSprintLoadColor(day.suggestedSprintLoad)
                      "
                    >
                      {{ day.suggestedSprintLoad }}
                    </div>
                    <div class="text-xs text-text-secondary">
                      Max: {{ day.maxSprints }}
                    </div>
                  </div>

                  <div class="duration mb-2">
                    <div class="text-xs text-text-secondary mb-1">Duration</div>
                    <div class="font-semibold">
                      {{ day.recommendedDuration }} min
                    </div>
                  </div>

                  <div class="projected-acwr mb-2">
                    <div class="text-xs text-text-secondary mb-1">
                      Projected ACWR
                    </div>
                    <div
                      class="font-semibold"
                      [class]="'text-' + getACWRColor(day.acwrProjection)"
                    >
                      {{ day.acwrProjection | number: "1.2-2" }}
                    </div>
                  </div>
                } @else {
                  <div class="rest-day text-center py-4">
                    <div class="text-4xl mb-2">😴</div>
                    <div class="font-semibold">Rest Day</div>
                  </div>
                }

                <div class="reasoning mt-3 pt-3 border-t border-gray-200">
                  <div class="text-xs text-text-secondary italic">
                    {{ day.reasoning }}
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Summary -->
      <div class="summary mt-6 p-4 bg-surface-secondary rounded-lg">
        <h4 class="font-semibold text-text-primary mb-3">Weekly Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-text-secondary">Total Sprint Load</div>
            <div class="text-lg font-bold">{{ totalSprintLoad() }}</div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">Training Days</div>
            <div class="text-lg font-bold">{{ trainingDays() }}</div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">Avg Daily Load</div>
            <div class="text-lg font-bold">
              {{ avgDailyLoad() | number: "1.0-0" }} AU
            </div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">End-of-Week ACWR</div>
            <div
              class="text-lg font-bold"
              [class]="'text-' + getACWRColor(endOfWeekACWR())"
            >
              {{ endOfWeekACWR() | number: "1.2-2" }}
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./microcycle-planner.component.scss",
})
export class MicrocyclePlannerComponent {
  // Angular 21: Use input() signal instead of @Input()
  readonly athleteId = input.required<string>();

  private readonly metricsService = inject(TrainingMetricsService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly trainingPlanService = inject(TrainingPlanService);

  readonly weeklyPlan = signal<DayPlan[]>([]);
  readonly gameDays = signal<Date[]>([]);
  readonly currentACWR = this.trainingService.acwrRatio;
  readonly acuteLoad = this.trainingService.acuteLoad;
  readonly chronicLoad = this.trainingService.chronicLoad;
  readonly currentRiskZone = this.trainingService.acwrRiskZone;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly lastUpdate = signal(new Date());

  readonly totalSprintLoad = computed(() =>
    this.weeklyPlan().reduce((sum, day) => sum + day.suggestedSprintLoad, 0),
  );

  readonly trainingDays = computed(
    () =>
      this.weeklyPlan().filter((day) => day.suggestedIntensity !== "rest")
        .length,
  );

  readonly avgDailyLoad = computed(() => {
    const total = this.weeklyPlan().reduce((sum, day) => {
      if (day.suggestedIntensity === "rest") return sum;
      return sum + day.suggestedSprintLoad * 10; // Rough estimate: 10 AU per sprint
    }, 0);
    return total / 7;
  });

  readonly endOfWeekACWR = computed(() => {
    const lastDay = this.weeklyPlan()[this.weeklyPlan().length - 1];
    return lastDay?.acwrProjection || this.currentACWR();
  });

  constructor() {
    // Use effect to react to athleteId changes (Angular 21 pattern)
    effect(async () => {
      const athleteId = this.athleteId();
      if (athleteId) {
        const games = await this.trainingPlanService.getUpcomingGames(
          athleteId,
          14,
        );
        this.gameDays.set(games);
      }
      this.generateWeeklyPlan();
    });
  }

  generateWeeklyPlan() {
    const currentACWR = this.currentACWR();
    const chronic = this.chronicLoad();
    const days: DayPlan[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const _dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      const plan = this.calculateDayPlan(
        date,
        i,
        currentACWR,
        chronic,
        this.gameDays(),
      );
      days.push(plan);
    }

    this.weeklyPlan.set(days);
  }

  private calculateDayPlan(
    date: Date,
    dayIndex: number,
    currentACWR: number,
    chronic: number,
    gameDays: Date[],
  ): DayPlan {
    // Calculate day name
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    // Check game proximity first (48-72 hour deload rule)
    const gameProximity = this.getGameProximity(date, gameDays);

    // Base sprint load recommendations
    let suggestedSprintLoad = 0;
    let suggestedIntensity: "low" | "medium" | "high" | "rest" = "medium";
    let maxSprints = 20;
    let recommendedDuration = 60;
    let reasoning = "";
    let acwrProjection = currentACWR;

    // Game proximity adjustments (48-72 hours before game = deload sprints)
    if (
      gameProximity.hoursUntilGame >= 0 &&
      gameProximity.hoursUntilGame <= 24
    ) {
      // Day before game - rest or very light
      suggestedIntensity = "rest";
      suggestedSprintLoad = 0;
      maxSprints = 0;
      recommendedDuration = 20;
      reasoning = "Pre-game rest day - game within 24 hours";
    } else if (
      gameProximity.hoursUntilGame > 24 &&
      gameProximity.hoursUntilGame <= 48
    ) {
      // 24-48 hours before - minimal sprint work
      suggestedSprintLoad = 2; // Fixed baseline
      suggestedIntensity = "low";
      maxSprints = 3;
      recommendedDuration = 30;
      reasoning = "Game proximity (24-48h) - deload sprints";
    } else if (
      gameProximity.hoursUntilGame > 48 &&
      gameProximity.hoursUntilGame <= 72
    ) {
      // 48-72 hours before - reduced sprint volume
      suggestedSprintLoad = 4; // Fixed baseline
      suggestedIntensity = "low";
      maxSprints = 6;
      recommendedDuration = 45;
      reasoning = "Game proximity (48-72h) - reduced sprint volume";
    } else {
      // Normal ACWR-based planning (only if not near game)
      // Adjust based on current ACWR with progression rules
      if (currentACWR > 1.5) {
        // Danger zone - reduce load significantly
        if (dayIndex === 0 || dayIndex === 1) {
          suggestedIntensity = "rest";
          reasoning = "High ACWR - rest day recommended";
        } else {
          suggestedSprintLoad = 2; // Fixed baseline
          suggestedIntensity = "low";
          maxSprints = 5;
          recommendedDuration = 30;
          reasoning = "Danger zone - minimal sprint work (ACWR > 1.5)";
        }
      } else if (currentACWR > 1.3) {
        // Elevated risk - reduce volume by 15%
        if (dayIndex % 3 === 0) {
          suggestedIntensity = "rest";
          reasoning = "Elevated ACWR - rest day";
        } else {
          suggestedSprintLoad = 5; // Fixed baseline
          suggestedIntensity = "low";
          maxSprints = 10;
          recommendedDuration = 45;
          reasoning = "Elevated risk - reduced sprint volume (ACWR > 1.3)";
        }
      } else if (currentACWR < 0.8) {
        // Under-training - can increase volume by 10%
        if (dayIndex === 6) {
          suggestedIntensity = "rest";
          reasoning = "Weekly rest day";
        } else {
          suggestedSprintLoad = 15; // Fixed baseline
          suggestedIntensity = dayIndex % 2 === 0 ? "high" : "medium";
          maxSprints = 25;
          recommendedDuration = 90;
          reasoning = "Under-training - can increase load (ACWR < 0.8)";
        }
      } else {
        // Sweet spot - normal training
        if (dayIndex === 6) {
          suggestedIntensity = "rest";
          reasoning = "Weekly rest day";
        } else if (dayIndex === 0 || dayIndex === 3) {
          // High intensity days
          suggestedSprintLoad = 12; // Fixed baseline
          suggestedIntensity = "high";
          maxSprints = 20;
          recommendedDuration = 90;
          reasoning = "Optimal ACWR - high intensity day";
        } else {
          // Medium intensity days
          suggestedSprintLoad = 8; // Fixed baseline
          suggestedIntensity = "medium";
          maxSprints = 15;
          recommendedDuration = 60;
          reasoning = "Optimal ACWR - moderate intensity";
        }
      }
    }

    // Adjust based on current ACWR
    if (currentACWR > 1.5) {
      // Danger zone - reduce load significantly
      if (dayIndex === 0 || dayIndex === 1) {
        suggestedIntensity = "rest";
        reasoning = "High ACWR - rest day recommended";
      } else {
        suggestedSprintLoad = 2; // Fixed baseline
        suggestedIntensity = "low";
        maxSprints = 5;
        recommendedDuration = 30;
        reasoning = "Danger zone - minimal sprint work";
      }
    } else if (currentACWR > 1.3) {
      // Elevated risk
      if (dayIndex % 3 === 0) {
        suggestedIntensity = "rest";
        reasoning = "Elevated ACWR - rest day";
      } else {
        suggestedSprintLoad = 5; // Fixed baseline
        suggestedIntensity = "low";
        maxSprints = 10;
        recommendedDuration = 45;
        reasoning = "Elevated risk - reduced sprint volume";
      }
    } else if (currentACWR < 0.8) {
      // Under-training - can increase
      if (dayIndex === 6) {
        suggestedIntensity = "rest";
        reasoning = "Weekly rest day";
      } else {
        suggestedSprintLoad = 15; // Fixed baseline
        suggestedIntensity = dayIndex % 2 === 0 ? "high" : "medium";
        maxSprints = 25;
        recommendedDuration = 90;
        reasoning = "Under-training - can increase load";
      }
    } else {
      // Sweet spot - normal training
      if (dayIndex === 6) {
        suggestedIntensity = "rest";
        reasoning = "Weekly rest day";
      } else if (dayIndex === 0 || dayIndex === 3) {
        // High intensity days
        suggestedSprintLoad = 12; // Fixed baseline
        suggestedIntensity = "high";
        maxSprints = 20;
        recommendedDuration = 90;
        reasoning = "Optimal ACWR - high intensity day";
      } else {
        // Medium intensity days
        suggestedSprintLoad = 8; // Fixed baseline
        suggestedIntensity = "medium";
        maxSprints = 15;
        recommendedDuration = 60;
        reasoning = "Optimal ACWR - moderate intensity";
      }
    }

    // Project ACWR for this day
    const dailyLoad = suggestedSprintLoad * 10; // Rough estimate
    const projectedAcute = (this.acuteLoad() * 6 + dailyLoad) / 7; // Rolling 7-day
    acwrProjection = chronic > 0 ? projectedAcute / chronic : 0;

    return {
      day: dayName,
      date,
      suggestedSprintLoad,
      suggestedIntensity,
      maxSprints,
      recommendedDuration,
      reasoning,
      acwrProjection,
    };
  }

  getDayCardClass(day: DayPlan): string {
    let classes = "";
    if (day.suggestedIntensity === "rest")
      classes += " border-gray-300 opacity-80 bg-surface-secondary";
    else if (day.acwrProjection > 1.5) classes += " border-red-500 bg-red-50";
    else if (day.acwrProjection > 1.3)
      classes += " border-yellow-500 bg-yellow-50";
    else classes += " border-green-500 bg-green-50";

    return classes;
  }

  getSprintLoadColor(load: number): string {
    if (load >= 15) return "var(--color-status-warning)"; // orange
    if (load >= 8) return "var(--color-status-success)"; // green
    if (load === 0) return "var(--color-text-muted)";
    return "var(--color-status-info)"; // blue
  }

  getACWRColor(acwr: number): string {
    if (acwr > 1.5) return "status-danger";
    if (acwr > 1.3) return "status-warning";
    if (acwr < 0.8 && acwr > 0) return "status-info";
    return "status-success";
  }

  getRiskColor(): string {
    const acwr = this.currentACWR();
    if (acwr > 1.5) return "status-danger";
    if (acwr > 1.3) return "status-warning";
    return "status-success";
  }

  /**
   * Get game proximity for a specific date
   */
  private getGameProximity(
    date: Date,
    gameDays: Date[],
  ): { hoursUntilGame: number; hasGame: boolean } {
    const dateTime = date.getTime();
    let closestGame: Date | null = null;
    let minHours = Infinity;

    for (const gameDay of gameDays) {
      const gameTime = gameDay.getTime();
      const hoursUntilGame = (gameTime - dateTime) / (1000 * 60 * 60);

      if (hoursUntilGame >= 0 && hoursUntilGame < minHours) {
        minHours = hoursUntilGame;
        closestGame = gameDay;
      }
    }

    return {
      hoursUntilGame: minHours === Infinity ? 999 : minHours,
      hasGame: closestGame !== null,
    };
  }
}
