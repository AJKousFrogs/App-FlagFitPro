import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import { TrainingPlanService } from "../../core/services/training-plan.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  getProtocolAcwrDisplay,
  getProtocolRiskZone,
} from "../../core/utils/protocol-metrics-presentation";

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
    TrafficLightRiskComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
  ],
  templateUrl: "./microcycle-planner.component.html",
  styleUrl: "./microcycle-planner.component.scss",
})
export class MicrocyclePlannerComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly trainingPlanService = inject(TrainingPlanService);
  private readonly logger = inject(LoggerService);

  private lastLoadedAthleteId: string | null = null;
  private lastOverviewAthleteId: string | null = null;

  readonly weeklyPlan = signal<DayPlan[]>([]);
  readonly gameDays = signal<Date[]>([]);
  readonly currentUserId = computed(() => this.supabase.userId());
  readonly todayProtocol = this.trainingService.todayProtocol;
  readonly acwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
  readonly currentACWR = computed(() => {
    const displayValue = this.acwrDisplay().value;
    if (displayValue != null) {
      return displayValue;
    }

    return this.trainingService.acwrRatio() ?? 0;
  });
  readonly acuteLoad = this.trainingService.acuteLoad;
  readonly chronicLoad = this.trainingService.chronicLoad;
  readonly currentRiskZone = computed(() =>
    getProtocolRiskZone(
      this.todayProtocol(),
      this.trainingService.acwrRiskZone(),
      this.trainingService.acwrRatio(),
      null,
    ),
  );
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
    effect(() => {
      const athleteId = this.currentUserId();
      if (athleteId === this.lastLoadedAthleteId) {
        return;
      }

      this.lastLoadedAthleteId = athleteId;
      void this.syncGameDaysAndPlan(athleteId);
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
            "[MicrocyclePlanner] Failed to load protocol overview, using live metric fallback",
            error,
          ),
      });
    });
  }

  private async syncGameDaysAndPlan(athleteId: string | null): Promise<void> {
    if (athleteId) {
      try {
        const games = await this.trainingPlanService.getUpcomingGames(
          athleteId,
          14,
        );
        if (this.currentUserId() !== athleteId) return;
        this.gameDays.set(games);
      } catch (error) {
        this.logger.warn(
          "[MicrocyclePlanner] Failed to load upcoming games",
          error,
        );
        this.gameDays.set([]);
      }
    } else {
      this.gameDays.set([]);
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
