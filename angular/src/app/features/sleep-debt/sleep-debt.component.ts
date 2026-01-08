/**
 * Sleep Debt Tracking Component
 *
 * Monitors cumulative sleep deficit and its impact on training capacity,
 * recovery, and injury risk. Based on sleep science research.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DecimalPipe } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { CardModule } from "primeng/card";
import { MessageModule } from "primeng/message";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";

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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    CardModule,
    // ChartModule, // REMOVED: Using LazyChartComponent

    LazyChartComponent,
    MessageModule,
    ProgressBarModule,
    TagModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="sleep-debt-page">
        <app-page-header
          title="Sleep Debt Tracker"
          subtitle="Understanding your sleep deficit and its impact on performance"
          icon="pi-moon"
        ></app-page-header>

        <!-- Current Sleep Debt Status -->
        @if (sleepDebtAnalysis(); as analysis) {
          <p-card styleClass="debt-status-card">
            <div class="debt-display">
              <div
                class="debt-circle"
                [class]="'debt-' + analysis.debtLevel"
              >
                <span class="debt-value">{{
                  analysis.cumulativeDebt | number: "1.1-1"
                }}</span>
                <span class="debt-unit">hrs</span>
                <span class="debt-label">{{
                  getDebtLevelLabel(analysis.debtLevel)
                }}</span>
              </div>
              <p class="debt-description">Accumulated over the past 7 days</p>
            </div>
          </p-card>
        } @else {
          <p-card styleClass="debt-status-card">
            <div class="empty-state">
              <i class="pi pi-info-circle"></i>
              <h3>No Sleep Data Yet</h3>
              <p>
                @if (userAge() === null) {
                  Please provide your age and log sleep data in wellness check-ins to see your sleep debt analysis.
                } @else {
                  Log sleep data in wellness check-ins to see your sleep debt analysis.
                }
              </p>
            </div>
          </p-card>
        }

        <!-- Stats Cards -->
        @if (sleepDebtAnalysis(); as analysis) {
          <div class="stats-grid">
            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-moon stat-icon"></i>
                <div class="stat-details">
                  <span class="stat-label">7-Day Avg Sleep</span>
                  <span class="stat-value"
                    >{{
                      analysis.sevenDayAvg | number: "1.1-1"
                    }}
                    hrs</span
                  >
                  <p-tag
                    [value]="
                      analysis.sevenDayAvg < analysis.optimalTarget
                        ? 'Below optimal'
                        : 'On target'
                    "
                    [severity]="
                      analysis.sevenDayAvg < analysis.optimalTarget
                        ? 'danger'
                        : 'success'
                    "
                  ></p-tag>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-chart-bar stat-icon"></i>
                <div class="stat-details">
                  <span class="stat-label">14-Day Avg Sleep</span>
                  <span class="stat-value"
                    >{{
                      analysis.fourteenDayAvg | number: "1.1-1"
                    }}
                    hrs</span
                  >
                  <p-tag
                    [value]="
                      analysis.fourteenDayAvg >= analysis.optimalTarget - 0.5
                        ? 'Near target'
                        : 'Below optimal'
                    "
                    [severity]="
                      analysis.fourteenDayAvg >= analysis.optimalTarget - 0.5
                        ? 'warn'
                        : 'danger'
                    "
                  ></p-tag>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-bullseye stat-icon"></i>
                <div class="stat-details">
                  <span class="stat-label">Optimal Target</span>
                  <span class="stat-value"
                    >{{ analysis.optimalTarget }} hrs</span
                  >
                  <span class="stat-hint">(for age {{ userAge() }})</span>
                </div>
              </div>
            </p-card>

            <p-card styleClass="stat-card">
              <div class="stat-content">
                <i class="pi pi-clock stat-icon"></i>
                <div class="stat-details">
                  <span class="stat-label">Recovery Timeline</span>
                  <span class="stat-value"
                    >{{ analysis.recoveryDays }} days</span
                  >
                  <span class="stat-hint">to clear debt</span>
                </div>
              </div>
            </p-card>
          </div>
        }

        <!-- Impact on Performance -->
        @if (impactMultipliers(); as multipliers) {
          <p-card header="Impact on Performance" styleClass="impact-card">
            <div class="impact-section">
              <div class="impact-item">
                <div class="impact-header">
                  <span class="impact-label">Training Capacity</span>
                  <span class="impact-value"
                    >{{
                      multipliers.trainingCapacity * 100 | number: "1.0-0"
                    }}%</span
                  >
                </div>
                <p-progressBar
                  [value]="multipliers.trainingCapacity * 100"
                  [showValue]="false"
                  styleClass="impact-bar"
                ></p-progressBar>
                <p class="impact-description">
                  Your body can only absorb
                  {{
                    multipliers.trainingCapacity * 100 | number: "1.0-0"
                  }}% of planned training load effectively
                </p>
              </div>

              <div class="impact-item">
                <div class="impact-header">
                  <span class="impact-label">Recovery Rate</span>
                  <span class="impact-value"
                    >{{
                      multipliers.recoveryRate * 100 | number: "1.0-0"
                    }}%</span
                  >
                </div>
                <p-progressBar
                  [value]="multipliers.recoveryRate * 100"
                  [showValue]="false"
                  styleClass="impact-bar"
                ></p-progressBar>
                <p class="impact-description">
                  Recovery between sessions is
                  {{
                    100 - multipliers.recoveryRate * 100 | number: "1.0-0"
                  }}% slower than optimal
                </p>
              </div>

              <div class="impact-item warning">
                <div class="impact-header">
                  <span class="impact-label">Injury Risk</span>
                  <span class="impact-value danger"
                    >+{{
                      (multipliers.injuryRiskMultiplier - 1) * 100
                        | number: "1.0-0"
                    }}%</span
                  >
                </div>
                <p-progressBar
                  [value]="
                    Math.min(
                      (multipliers.injuryRiskMultiplier - 1) * 100,
                      100
                    )
                  "
                  [showValue]="false"
                  styleClass="impact-bar danger"
                ></p-progressBar>
                <p class="impact-description">
                  Injury risk increased by
                  {{
                    (multipliers.injuryRiskMultiplier - 1) * 100
                      | number: "1.0-0"
                  }}% compared to well-rested state
                </p>
              </div>

              <div class="impact-item">
                <div class="impact-header">
                  <span class="impact-label">Reaction Time</span>
                  <span class="impact-value warn"
                    >+{{
                      (multipliers.reactionTimeMultiplier - 1) * 100
                        | number: "1.0-0"
                    }}%</span
                  >
                </div>
                <p-progressBar
                  [value]="
                    Math.min(
                      (multipliers.reactionTimeMultiplier - 1) * 100,
                      100
                    )
                  "
                  [showValue]="false"
                  styleClass="impact-bar warn"
                ></p-progressBar>
                <p class="impact-description">
                  Reaction time is
                  {{
                    (multipliers.reactionTimeMultiplier - 1) * 100
                      | number: "1.0-0"
                  }}% slower than baseline
                </p>
              </div>
            </div>
          </p-card>
        }

        <!-- AI Recommendation -->
        @if (sleepDebtAnalysis()?.cumulativeDebt && sleepDebtAnalysis()!.cumulativeDebt > 0 && impactMultipliers(); as multipliers) {
          <p-card styleClass="recommendation-card">
            <ng-template pTemplate="header">
              <div class="rec-header">
                <i class="pi pi-lightbulb"></i>
                <span>AI Recommendation</span>
              </div>
            </ng-template>

            <div class="recommendation-content">
              <p class="rec-intro">
                Your sleep debt is affecting your performance. To recover
                optimally:
              </p>
              <ul class="rec-list">
                <li>
                  <i class="pi pi-clock"></i>
                  Add 30-60 minutes to your sleep time for the next
                  {{ sleepDebtAnalysis()!.recoveryDays }} nights
                </li>
                <li>
                  <i class="pi pi-minus-circle"></i>
                  Reduce training intensity to
                  {{
                    multipliers.trainingCapacity * 100 | number: "1.0-0"
                  }}% until debt is cleared
                </li>
                <li>
                  <i class="pi pi-sun"></i>
                  Consider a 20-minute power nap between 1-3pm
                </li>
                <li>
                  <i class="pi pi-ban"></i>
                  Avoid caffeine after 2pm
                </li>
                <li>
                  <i class="pi pi-calendar"></i>
                  Keep consistent bed/wake times (even weekends)
                </li>
              </ul>
            </div>
          </p-card>
        }

        <!-- 7-Day Sleep History Chart -->
        <p-card header="7-Day Sleep History" styleClass="chart-card">
          @if (sleepHistoryChartData()) {
            <app-lazy-chart
              type="bar"
              [data]="sleepHistoryChartData()"
              [options]="sleepChartOptions"
            ></app-lazy-chart>
          } @else {
            <div class="empty-state">
              <i class="pi pi-chart-bar"></i>
              <p>Log your sleep in wellness check-ins to see your history</p>
            </div>
          }
        </p-card>

        <!-- Cumulative Debt Trend Chart -->
        <p-card header="Cumulative Debt Trend" styleClass="chart-card">
          @if (debtTrendChartData()) {
            <app-lazy-chart
              type="line"
              [data]="debtTrendChartData()"
              [options]="debtChartOptions"
            ></app-lazy-chart>
          } @else {
            <div class="empty-state">
              <i class="pi pi-chart-line"></i>
              <p>Insufficient data to show debt trend</p>
            </div>
          }
        </p-card>

        <!-- Research Basis -->
        <p-card styleClass="research-card">
          <ng-template pTemplate="header">
            <div class="research-header">
              <i class="pi pi-book"></i>
              <span>Research Basis</span>
            </div>
          </ng-template>

          <div class="research-content">
            <div class="research-item">
              <strong>Reaction Time:</strong> Decreases ~30% with sleep
              deprivation
              <span class="citation">(Mah et al., 2011)</span>
            </div>
            <div class="research-item">
              <strong>Injury Risk:</strong> Increases 1.7x with &lt;8 hours
              sleep
              <span class="citation">(Milewski et al., 2014)</span>
            </div>
            <div class="research-item">
              <strong>Performance:</strong> Basketball players gained 9% sprint
              speed with sleep extension
              <span class="citation">(Mah et al., 2011)</span>
            </div>
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./sleep-debt.component.scss",
})
export class SleepDebtComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // Expose Math for template
  Math = Math;

  // State
  readonly sleepHistory = signal<SleepEntry[]>([]);
  readonly userAge = signal<number | null>(null); // No default - must be provided by user
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
              ? "rgba(34, 197, 94, 0.7)"
              : h.hoursSlept >= optimal - 1
                ? "rgba(234, 179, 8, 0.7)"
                : "rgba(239, 68, 68, 0.7)",
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
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
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
            borderColor: "#22c55e",
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/sleep-data"),
      );
      if (response?.success && response.data) {
        if (response.data.sleepHistory) {
          this.sleepHistory.set(response.data.sleepHistory);
        }
        if (response.data.userAge) {
          this.userAge.set(response.data.userAge);
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
