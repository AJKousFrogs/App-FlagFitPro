import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import { PeriodizationService } from "../../core/services/periodization.service";
import { ScheduleService } from "../../core/services/schedule.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  DailyPrescription,
  PrescriptionIntent,
} from "../../core/models/prescription.models";
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

/**
 * Map DailyPrescription intent → the planner's coarse intensity bucket.
 * Display-only adapter; the algorithm of record is `prescribeFor`.
 */
const INTENT_INTENSITY: Record<
  PrescriptionIntent,
  "low" | "medium" | "high" | "rest"
> = {
  rest: "rest",
  recovery: "rest",
  mobility: "low",
  technical: "low",
  "taper-prime": "low",
  mixed: "medium",
  sprint: "high",
  strength: "high",
  competition: "high",
};

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
  private readonly periodization = inject(PeriodizationService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly logger = inject(LoggerService);

  private lastOverviewAthleteId: string | null = null;

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

  /**
   * 7-day plan computed from the canonical prescription stream.
   * Every input that drives the plan (schedule, ACWR, readiness, density) is
   * a signal — the computed re-runs automatically when any of them change.
   */
  readonly weeklyPlan = computed<DayPlan[]>(() => {
    const prescriptions = this.periodization.weekAhead();
    const chronic = this.chronicLoad();
    const acuteBaseline = this.acuteLoad();
    if (prescriptions.length === 0) {
      return [];
    }
    return prescriptions.map((rx, index) =>
      prescriptionToDayPlan(rx, index, chronic, acuteBaseline),
    );
  });

  /**
   * Manual re-trigger hook. Refreshes the underlying schedule snapshot;
   * weeklyPlan re-derives reactively because every input is a signal.
   */
  refresh(): void {
    void this.scheduleService.refresh();
  }

  constructor() {
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
}

/**
 * Adapt a {@link DailyPrescription} into the planner's display-only DayPlan.
 *
 * The prescription is the source of truth for *what* the athlete does and
 * *why*. The DayPlan adds two display concerns the prescription does not
 * own: a coarse intensity bucket for cell coloring and an ACWR projection
 * for the chart. Anything else that diverges from the prescription is a bug.
 */
function prescriptionToDayPlan(
  rx: DailyPrescription,
  dayIndex: number,
  chronicLoad: number,
  acuteBaseline: number,
): DayPlan {
  const date = new Date(`${rx.date}T00:00:00`);
  const day = date.toLocaleDateString("en-US", { weekday: "short" });

  // Approximate session AU = sprintReps × 10 + strengthSets × 6;
  // used only for the ACWR projection chart, never for the prescription.
  const dailyAU = rx.sprintReps * 10 + rx.strengthSets * 6;
  const projectedAcute = (acuteBaseline * 6 + dailyAU) / 7;
  const acwrProjection =
    chronicLoad > 0 ? projectedAcute / chronicLoad : 0;

  return {
    day,
    date,
    suggestedSprintLoad: rx.sprintReps,
    suggestedIntensity: INTENT_INTENSITY[rx.intent],
    maxSprints: rx.sprintReps > 0 ? rx.sprintReps + 4 : 0,
    recommendedDuration: rx.targetMinutes,
    reasoning: rx.reasoning,
    acwrProjection,
  };
}
