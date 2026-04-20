/**
 * Sleep Debt Tracking Component
 *
 * Monitors cumulative sleep deficit and its impact on training capacity,
 * recovery, and injury risk. Based on sleep science research.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { ProgressBarComponent } from "../../shared/components/progress-bar/progress-bar.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

// ===== Interfaces =====
interface SleepEntry {
  date: string;
  hoursSlept: number;
  quality?: number;
}

interface SleepDebtAnalysis {
  cumulativeDebt: number;
  debtLevel: DebtLevel;
  sevenDayAvg: number;
  fourteenDayAvg: number;
  optimalTarget: number;
  recoveryDays: number;
}

interface ImpactMultipliers {
  trainingCapacity: number;
  recoveryRate: number;
  injuryRiskMultiplier: number;
  reactionTimeMultiplier: number;
}

type DebtLevel = "none" | "mild" | "moderate" | "severe" | "critical";

// ===== Constants =====
const SLEEP_REQUIREMENTS: Record<string, { optimal: number; minimum: number }> =
  {
    junior: { optimal: 9, minimum: 8 }, // 16-17 years
    youngAdult: { optimal: 8, minimum: 7 }, // 18-25 years
    adult: { optimal: 7.5, minimum: 7 }, // 26+ years
  };

const DEBT_THRESHOLDS = {
  none: 0,
  mild: 5,
  moderate: 10,
  severe: 15,
  critical: Infinity,
};

@Component({
  selector: "app-sleep-debt",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    LazyChartComponent,
    ProgressBarComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    StatusTagComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./sleep-debt.component.html",
  styleUrl: "./sleep-debt.component.scss",
})
export class SleepDebtComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  // Expose Math for template
  Math = Math;

  // State
  readonly sleepHistory = signal<SleepEntry[]>([]);
  readonly userAge = signal<number | null>(null); // No default - must be provided by user

  readonly sleepEmptyMessage = computed(() =>
    this.userAge() === null
      ? "Please provide your age and log sleep data in wellness check-ins to see your sleep debt analysis."
      : "Log sleep data in wellness check-ins to see your sleep debt analysis.",
  );
  readonly isLoading = signal(true);

  // Computed values
  readonly sleepDebtAnalysis = computed<SleepDebtAnalysis | null>(() => {
    const history = this.sleepHistory();
    const age = this.userAge();

    // CRITICAL: Only calculate if we have real data
    if (age === null || history.length === 0) {
      return null; // No calculations without real data
    }

    const optimalHours = this.getOptimalSleepHours(age);
    return this.calculateSleepDebt(history, optimalHours);
  });

  readonly impactMultipliers = computed<ImpactMultipliers | null>(() => {
    const analysis = this.sleepDebtAnalysis();
    if (!analysis) return null; // No calculations without real data
    return this.calculateImpactMultipliers(analysis.cumulativeDebt);
  });

  readonly sleepHistoryChartData = computed(() => {
    const history = this.sleepHistory().slice(0, 7).reverse();
    const analysis = this.sleepDebtAnalysis();
    if (history.length === 0 || !analysis) return null;

    const optimal = analysis.optimalTarget;

    return {
      labels: history.map((h) =>
        new Date(h.date).toLocaleDateString("en-US", { weekday: "short" }),
      ),
      datasets: [
        {
          label: "Hours Slept",
          data: history.map((h) => h.hoursSlept),
          backgroundColor: history.map((h) =>
            h.hoursSlept >= optimal
              ? "rgba(var(--ds-primary-green-rgb), 0.7)"
              : h.hoursSlept >= optimal - 1
                ? "rgba(var(--primitive-warning-500-rgb), 0.7)"
                : "rgba(var(--primitive-error-500-rgb), 0.7)",
          ),
          borderRadius: 4,
        },
      ],
    };
  });

  readonly debtTrendChartData = computed(() => {
    const history = this.sleepHistory().slice(0, 7).reverse();
    const analysis = this.sleepDebtAnalysis();
    if (history.length < 2 || !analysis) return null;

    const optimal = analysis.optimalTarget;

    // Calculate cumulative debt over time
    let cumulativeDebt = 0;
    const debtData = history.map((h) => {
      const deficit = optimal - h.hoursSlept;
      if (deficit > 0) {
        cumulativeDebt += deficit;
      }
      return cumulativeDebt;
    });

    return {
      labels: history.map((h) =>
        new Date(h.date).toLocaleDateString("en-US", { weekday: "short" }),
      ),
      datasets: [
        {
          label: "Cumulative Debt (hrs)",
          data: debtData,
          borderColor: "var(--color-chart-quinary)",
          backgroundColor: "rgba(var(--primitive-error-500-rgb), 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  });

  // Chart options
  readonly sleepChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      annotation: {
        annotations: {
          targetLine: {
            type: "line",
            yMin: 8,
            yMax: 8,
            borderColor: "var(--ds-primary-green)",
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: "Target",
              position: "end",
            },
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
        title: { display: true, text: "Hours" },
      },
    },
  };

  readonly debtChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Hours of Debt" },
      },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{
          sleepHistory?: SleepEntry[];
          userAge?: number;
        }>(API_ENDPOINTS.sleepData),
      );
      const payload = extractApiPayload<{
        sleepHistory?: SleepEntry[];
        userAge?: number;
      }>(response);
      if (payload) {
        if (payload.sleepHistory) {
          this.sleepHistory.set(payload.sleepHistory);
        }
        if (payload.userAge) {
          this.userAge.set(payload.userAge);
        }
      }
    } catch (err) {
      this.logger.error("Failed to load sleep data", err);
      // No sleep data available - set empty state
      // CRITICAL: Do NOT set default age - calculations require real user data
      this.sleepHistory.set([]);
      this.userAge.set(null); // No default - user must provide age
    } finally {
      this.isLoading.set(false);
    }
  }

  private getOptimalSleepHours(age: number): number {
    if (age < 18) return SLEEP_REQUIREMENTS.junior.optimal;
    if (age < 26) return SLEEP_REQUIREMENTS.youngAdult.optimal;
    return SLEEP_REQUIREMENTS.adult.optimal;
  }

  private calculateSleepDebt(
    sleepHistory: SleepEntry[],
    optimalHours: number,
  ): SleepDebtAnalysis {
    const last7Days = sleepHistory.slice(0, 7);
    const last14Days = sleepHistory.slice(0, 14);

    // Calculate cumulative debt
    let cumulativeDebt = 0;
    for (const entry of last7Days) {
      const deficit = optimalHours - entry.hoursSlept;
      if (deficit > 0) {
        cumulativeDebt += deficit;
      }
    }

    // Calculate averages
    const sevenDayAvg =
      last7Days.length > 0
        ? last7Days.reduce((sum, e) => sum + e.hoursSlept, 0) / last7Days.length
        : 0;

    const fourteenDayAvg =
      last14Days.length > 0
        ? last14Days.reduce((sum, e) => sum + e.hoursSlept, 0) /
          last14Days.length
        : 0;

    // Determine debt level
    let debtLevel: DebtLevel = "none";
    if (cumulativeDebt > 0 && cumulativeDebt < DEBT_THRESHOLDS.mild) {
      debtLevel = "mild";
    } else if (
      cumulativeDebt >= DEBT_THRESHOLDS.mild &&
      cumulativeDebt < DEBT_THRESHOLDS.moderate
    ) {
      debtLevel = "moderate";
    } else if (
      cumulativeDebt >= DEBT_THRESHOLDS.moderate &&
      cumulativeDebt < DEBT_THRESHOLDS.severe
    ) {
      debtLevel = "severe";
    } else if (cumulativeDebt >= DEBT_THRESHOLDS.severe) {
      debtLevel = "critical";
    }

    // Calculate recovery timeline (assuming 1 extra hour per night)
    const recoveryDays = Math.ceil(cumulativeDebt / 1);

    return {
      cumulativeDebt,
      debtLevel,
      sevenDayAvg,
      fourteenDayAvg,
      optimalTarget: optimalHours,
      recoveryDays,
    };
  }

  private calculateImpactMultipliers(
    cumulativeDebt: number,
  ): ImpactMultipliers {
    return {
      trainingCapacity: Math.max(0.5, 1 - cumulativeDebt * 0.03),
      recoveryRate: Math.max(0.4, 1 - cumulativeDebt * 0.04),
      injuryRiskMultiplier: 1 + cumulativeDebt * 0.1,
      reactionTimeMultiplier: 1 + cumulativeDebt * 0.03,
    };
  }

  getDebtLevelLabel(level: DebtLevel): string {
    const labels: Record<DebtLevel, string> = {
      none: "OPTIMAL",
      mild: "MILD",
      moderate: "MODERATE",
      severe: "SEVERE",
      critical: "CRITICAL",
    };
    return labels[level];
  }
}
