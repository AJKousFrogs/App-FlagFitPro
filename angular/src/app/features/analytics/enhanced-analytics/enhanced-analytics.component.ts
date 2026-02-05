import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { Tabs, TabPanel } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AiConsentRequiredComponent } from "../../../shared/components/ai-consent-required/ai-consent-required.component";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";
import { PrivacySettingsService } from "../../../core/services/privacy-settings.service";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { EnhancedAnalyticsDataService } from "../services/enhanced-analytics-data.service";
import {
  DATA_STATE_MESSAGES,
  METRIC_INSUFFICIENT_DATA,
} from "../../../shared/utils/privacy-ux-copy";

@Component({
  selector: "app-enhanced-analytics",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    Card,

    LazyChartComponent,
    Tabs,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent,
    AiConsentRequiredComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="enhanced-analytics-page">
        <app-page-header
          title="Enhanced Analytics"
          subtitle="Advanced performance insights and predictions"
          icon="pi-chart-line"
        >
          <app-button
            variant="outlined"
            iconLeft="pi-download"
            (clicked)="exportReport()"
            >Export Report</app-button
          >
        </app-page-header>

        <p-tabs>
          <p-tabpanel header="Performance Trends">
            <p-card>
              <ng-template pTemplate="header">
                <h3>7-Week Performance Trend</h3>
              </ng-template>
              @if (hasNoData()) {
                <!-- No data state with actionable CTA -->
                <div class="no-data-state">
                  <i class="pi {{ noDataMessage.icon }}"></i>
                  <h4>{{ noDataMessage.title }}</h4>
                  <p>{{ noDataMessage.reason }}</p>
                  <app-icon-button
                    icon="pi-plus"
                    routerLink="noDataMessage.helpLink"
                    ariaLabel="Add performance data"
                    tooltip="Add data"
                  />
                </div>
              } @else if (performanceChartData()) {
                <app-lazy-chart
                  type="line"
                  [data]="performanceChartData()"
                  [options]="chartOptions"
                ></app-lazy-chart>
              }
            </p-card>
          </p-tabpanel>

          <p-tabpanel header="Injury Risk">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Injury Risk Analysis</h3>
              </ng-template>
              @if (hasInsufficientDataForInjuryRisk()) {
                <!-- Insufficient data state with actionable CTA -->
                <div class="insufficient-data-state">
                  <i class="pi {{ injuryRiskInsufficientMessage.icon }}"></i>
                  <h4>{{ injuryRiskInsufficientMessage.title }}</h4>
                  <p>{{ injuryRiskInsufficientMessage.reason }}</p>
                  <app-icon-button
                    icon="pi-info-circle"
                    variant="outlined"
                    routerLink="injuryRiskInsufficientMessage.helpLink"
                    ariaLabel="Learn more about injury risk analysis"
                    tooltip="Learn more"
                  />
                </div>
              } @else {
                <div class="risk-analysis">
                  <p>
                    Based on your training load and wellness data, your current
                    injury risk is:
                  </p>
                  <div class="risk-score">
                    <span class="score-value">{{ injuryRisk() }}%</span>
                    <span class="score-label">{{ getRiskLabel() }}</span>
                  </div>
                </div>
              }
            </p-card>
          </p-tabpanel>

          <p-tabpanel header="Predictions">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Performance Predictions</h3>
              </ng-template>
              <!-- AI consent check for predictions -->
              @if (!aiEnabled()) {
                <app-ai-consent-required></app-ai-consent-required>
              } @else {
                <div class="predictions">
                  <p>AI-powered predictions coming soon...</p>
                </div>
              }
            </p-card>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./enhanced-analytics.component.scss",
})
export class EnhancedAnalyticsComponent implements OnInit {
  private analyticsDataService = inject(EnhancedAnalyticsDataService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private privacyService = inject(PrivacySettingsService);

  performanceChartData = signal<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  } | null>(null);
  injuryRisk = signal(15);
  isLoading = signal(false);
  sessionCount = signal(0);

  // AI consent check
  readonly aiEnabled = this.privacyService.aiProcessingEnabled;

  // Centralized privacy messages
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;
  readonly injuryRiskInsufficientMessage = METRIC_INSUFFICIENT_DATA.injuryRisk;

  // Computed states for data availability
  hasNoData = computed(() => this.sessionCount() === 0);
  hasInsufficientDataForInjuryRisk = computed(() => this.sessionCount() < 28);

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.isLoading.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.warn("No user found for analytics");
        this.setDefaultChartData();
        return;
      }

      const { sessions, error } =
        await this.analyticsDataService.getRecentTrainingSessions(user.id, 7);

      if (error) {
        this.logger.warn("Error loading sessions:", toLogContext(error));
        this.setDefaultChartData();
        return;
      }

      if (sessions && sessions.length > 0) {
        this.sessionCount.set(sessions.length);

        // Group by week and calculate performance scores
        const weeklyData = this.calculateWeeklyPerformance(sessions);
        this.performanceChartData.set(weeklyData);

        // Calculate injury risk based on recent data (only if sufficient data)
        if (sessions.length >= 28) {
          this.calculateInjuryRisk(sessions);
        }
      } else {
        this.sessionCount.set(0);
        this.setDefaultChartData();
      }
    } catch (error) {
      this.logger.error("Error loading analytics:", error);
      this.setDefaultChartData();
    } finally {
      this.isLoading.set(false);
    }
  }

  private calculateWeeklyPerformance(
    sessions: {
      session_date: string;
      status: string;
      duration_minutes?: number | null;
    }[],
  ): {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  } {
    const weeks: Map<
      number,
      { completed: number; total: number; duration: number }
    > = new Map();

    sessions.forEach((session) => {
      const date = new Date(session.session_date);
      const weekNum = this.getWeekNumber(date);

      if (!weeks.has(weekNum)) {
        weeks.set(weekNum, { completed: 0, total: 0, duration: 0 });
      }

      const week = weeks.get(weekNum);
      if (week) {
        week.total++;
        if (session.status === "completed") {
          week.completed++;
          week.duration += session.duration_minutes || 0;
        }
      }
    });

    const labels: string[] = [];
    const data: number[] = [];

    // Get last 7 weeks
    const sortedWeeks = Array.from(weeks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(-7);

    sortedWeeks.forEach(([_weekNum, stats], index) => {
      labels.push(`Week ${index + 1}`);
      // Performance score: completion rate * intensity factor
      const completionRate =
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      data.push(Math.round(completionRate));
    });

    // Fill in missing weeks with 0
    while (labels.length < 7) {
      labels.unshift(`Week ${7 - labels.length}`);
      data.unshift(0);
    }

    return {
      labels,
      datasets: [
        {
          label: "Performance Score",
          data,
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  private calculateInjuryRisk(
    sessions: {
      session_date: string;
      status: string;
      intensity_level?: string | number | null;
    }[],
  ): void {
    // Simple injury risk calculation based on training intensity and frequency
    const recentSessions = sessions.filter((s) => {
      const date = new Date(s.session_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const highIntensityCount = recentSessions.filter((s) => {
      const intensity = String(s.intensity_level ?? "").toLowerCase();
      return intensity === "high" || intensity === "very_high";
    }).length;

    // Risk increases with high intensity sessions
    let risk = 10 + highIntensityCount * 5;

    // Risk increases if many sessions in a week
    if (recentSessions.length > 6) {
      risk += 15;
    }

    this.injuryRisk.set(Math.min(risk, 100));
  }

  getRiskLabel(): string {
    const risk = this.injuryRisk();
    if (risk < 20) return "Low Risk";
    if (risk < 40) return "Moderate Risk";
    if (risk < 60) return "Elevated Risk";
    return "High Risk";
  }

  private setDefaultChartData(): void {
    this.performanceChartData.set({
      labels: [
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
        "Week 6",
        "Week 7",
      ],
      datasets: [
        {
          label: "Performance Score",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  exportReport(): void {
    this.toastService.info(TOAST.INFO.REPORT_GENERATING);

    // Create a simple CSV export
    const chartData = this.performanceChartData();
    if (!chartData) {
      this.toastService.error(TOAST.ERROR.NO_DATA_TO_EXPORT);
      return;
    }

    const csvContent = [
      "Week,Performance Score",
      ...chartData.labels.map(
        (label: string, i: number) =>
          `${label},${chartData.datasets[0].data[i]}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.toastService.success(TOAST.SUCCESS.REPORT_EXPORTED);
  }
}
