import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TrainingMetricsService } from "../../core/services/training-metrics.service";
import { AcwrService } from "../../core/services/acwr.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { TrainingPlanService } from "../../core/services/training-plan.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";

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
  standalone: true,
  imports: [CommonModule, FormsModule, TrafficLightRiskComponent],
  template: `
    <div
      class="microcycle-planner bg-surface-primary rounded-lg shadow-medium p-6"
    >
      <div class="header mb-6">
        <h2 class="text-2xl font-bold text-text-primary mb-2">
          Weekly Microcycle Planner
        </h2>
        <p class="text-text-secondary">
          AI-powered sprint load suggestions based on ACWR
        </p>
      </div>

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
  `,
  styles: [
    `
      .stat-card {
        @apply p-3 bg-white rounded border border-gray-200;
      }

      .stat-label {
        @apply text-xs text-text-secondary mb-1;
      }

      .stat-value {
        @apply text-lg font-bold text-text-primary;
      }

      .day-card {
        @apply bg-white transition-all duration-200;
      }

      .day-card:hover {
        @apply shadow-lg transform -translate-y-1;
      }

      .intensity-badge {
        @apply inline-block px-2 py-1 rounded text-xs font-semibold text-white;
      }

      .intensity-low {
        @apply bg-blue-500;
      }

      .intensity-medium {
        @apply bg-green-500;
      }

      .intensity-high {
        @apply bg-orange-500;
      }

      .intensity-rest {
        @apply bg-gray-400;
      }

      .text-red-600 {
        color: #dc2626;
      }

      .text-yellow-500 {
        color: #eab308;
      }

      .text-green-500 {
        color: #22c55e;
      }

      .text-orange-500 {
        color: #f97316;
      }
    `,
  ],
})
export class MicrocyclePlannerComponent implements OnInit {
  @Input() athleteId!: string;

  private metricsService = inject(TrainingMetricsService);
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private trainingPlanService = inject(TrainingPlanService);

  weeklyPlan = signal<DayPlan[]>([]);
  gameDays = signal<Date[]>([]);
  currentACWR = computed(() => this.acwrService.acwrRatio());
  acuteLoad = computed(() => this.acwrService.acuteLoad());
  chronicLoad = computed(() => this.acwrService.chronicLoad());
  currentRiskZone = computed(() => this.acwrService.riskZone());
  readinessLevel = computed(
    () => this.readinessService.current()?.level || "moderate",
  );
  lastUpdate = signal(new Date());

  totalSprintLoad = computed(() =>
    this.weeklyPlan().reduce((sum, day) => sum + day.suggestedSprintLoad, 0),
  );

  trainingDays = computed(
    () =>
      this.weeklyPlan().filter((day) => day.suggestedIntensity !== "rest")
        .length,
  );

  avgDailyLoad = computed(() => {
    const total = this.weeklyPlan().reduce((sum, day) => {
      if (day.suggestedIntensity === "rest") return sum;
      return sum + day.suggestedSprintLoad * 10; // Rough estimate: 10 AU per sprint
    }, 0);
    return total / 7;
  });

  endOfWeekACWR = computed(() => {
    const lastDay = this.weeklyPlan()[this.weeklyPlan().length - 1];
    return lastDay?.acwrProjection || this.currentACWR();
  });

  async ngOnInit() {
    // Load upcoming games
    if (this.athleteId) {
      const games = await this.trainingPlanService.getUpcomingGames(
        this.athleteId,
        14,
      );
      this.gameDays.set(games);
    }
    this.generateWeeklyPlan();
  }

  generateWeeklyPlan() {
    const currentACWR = this.currentACWR();
    const chronic = this.chronicLoad();
    const days: DayPlan[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

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
      suggestedSprintLoad = Math.floor(Math.random() * 2) + 2; // 2-3 sprints
      suggestedIntensity = "low";
      maxSprints = 3;
      recommendedDuration = 30;
      reasoning = "Game proximity (24-48h) - deload sprints";
    } else if (
      gameProximity.hoursUntilGame > 48 &&
      gameProximity.hoursUntilGame <= 72
    ) {
      // 48-72 hours before - reduced sprint volume
      suggestedSprintLoad = Math.floor(Math.random() * 3) + 4; // 4-6 sprints
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
          suggestedSprintLoad = Math.floor(Math.random() * 3) + 2; // 2-4 sprints
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
          suggestedSprintLoad = Math.floor(Math.random() * 5) + 5; // 5-9 sprints (reduced)
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
          suggestedSprintLoad = Math.floor(Math.random() * 10) + 15; // 15-24 sprints (increased)
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
          suggestedSprintLoad = Math.floor(Math.random() * 8) + 12; // 12-19 sprints
          suggestedIntensity = "high";
          maxSprints = 20;
          recommendedDuration = 90;
          reasoning = "Optimal ACWR - high intensity day";
        } else {
          // Medium intensity days
          suggestedSprintLoad = Math.floor(Math.random() * 6) + 8; // 8-13 sprints
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
        suggestedSprintLoad = Math.floor(Math.random() * 3) + 2; // 2-4 sprints
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
        suggestedSprintLoad = Math.floor(Math.random() * 5) + 5; // 5-9 sprints
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
        suggestedSprintLoad = Math.floor(Math.random() * 10) + 15; // 15-24 sprints
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
        suggestedSprintLoad = Math.floor(Math.random() * 8) + 12; // 12-19 sprints
        suggestedIntensity = "high";
        maxSprints = 20;
        recommendedDuration = 90;
        reasoning = "Optimal ACWR - high intensity day";
      } else {
        // Medium intensity days
        suggestedSprintLoad = Math.floor(Math.random() * 6) + 8; // 8-13 sprints
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
    if (day.suggestedIntensity === "rest") return "border-gray-300";
    if (day.acwrProjection > 1.5) return "border-red-500 bg-red-50";
    if (day.acwrProjection > 1.3) return "border-yellow-500 bg-yellow-50";
    return "border-green-500 bg-green-50";
  }

  getSprintLoadColor(load: number): string {
    if (load >= 15) return "#f97316"; // orange
    if (load >= 8) return "#22c55e"; // green
    return "#3b82f6"; // blue
  }

  getACWRColor(acwr: number): string {
    if (acwr > 1.5) return "red-600";
    if (acwr > 1.3) return "yellow-500";
    if (acwr < 0.8) return "orange-500";
    return "green-500";
  }

  getRiskColor(): string {
    return this.getACWRColor(this.currentACWR());
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
