/**
 * Coach Analytics Dashboard Component
 *
 * Phase 4: Comprehensive analytics dashboard for coaches
 *
 * Features:
 * - Overview metrics (athletes, interactions, completion rate)
 * - Classification accuracy breakdown
 * - Risk level distribution charts
 * - Intent distribution charts
 * - Trends over time
 * - Team leaderboard
 * - Feedback statistics
 */

import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import type { ChartOptions } from "chart.js";
import { Divider } from "primeng/divider";
import { ProgressBar } from "primeng/progressbar";
import { Select, type SelectChangeEvent } from "primeng/select";
import { Skeleton } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { COLORS } from "../../../core/constants/app.constants";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { getInitials } from "../../../shared/utils/format.utils";

interface OverviewMetrics {
  totalAthletes: number;
  activeAthletesLast7Days: number;
  totalAiInteractions: number;
  interactionsLast7Days: number;
  sessionCompletionRate: number;
  feedbackAccuracyRate: number | null;
  reviewedMessages: number;
}

interface ClassificationBreakdown {
  total: number;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  topIntents: { intent: string; count: number }[];
  youthInteractions: number;
  youthPercentage: number;
  avgConfidence: number | null;
}

interface TrendData {
  period: string;
  startDate: string;
  endDate: string;
  daily: {
    date: string;
    queries: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    sessionsCreated: number;
    sessionsCompleted: number;
  }[];
  summary: {
    totalQueries: number;
    avgQueriesPerDay: number;
    highRiskTotal: number;
    sessionsCompleted: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  completedSessions: number;
  totalSessions: number;
  completionRate: number;
  totalMinutes: number;
  lastCompleted: string | null;
}

interface TeamOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-coach-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    CardShellComponent,
    LazyChartComponent,
    Divider,
    ProgressBar,
    Select,
    Skeleton,
    TableModule,
    StatusTagComponent,
    MainLayoutComponent,
    IconButtonComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-analytics ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Team Performance"
          subtitle="Monitor Merlin AI performance, athlete engagement, and team trends"
          icon="pi-chart-bar"
        >
          <div class="header-filters">
            <p-select
              [options]="teamOptions"
              (onChange)="onTeamSelect($event)"
              placeholder="Select Team"
            ></p-select>
            <p-select
              [options]="timeRangeOptions"
              (onChange)="onTimeRangeSelect($event)"
              placeholder="Select Period"
            ></p-select>
            <app-icon-button
              icon="pi-refresh"
              variant="outlined"
              [loading]="loading()"
              (clicked)="loadAnalytics()"
              ariaLabel="Refresh performance data"
              tooltip="Refresh"
            />
          </div>
        </app-page-header>

        <!-- Overview Metrics -->
        @if (loading()) {
          <div class="metrics-grid">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <p-skeleton width="100%" height="var(--size-120)"></p-skeleton>
            }
          </div>
        } @else {
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon athletes">
                <i class="pi pi-users"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value">{{
                  overview()?.totalAthletes || 0
                }}</span>
                <span class="metric-label">Total Athletes</span>
                <span class="metric-sub"
                  >{{ overview()?.activeAthletesLast7Days || 0 }} active this
                  week</span
                >
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon interactions">
                <i class="pi pi-comments"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value">{{
                  overview()?.totalAiInteractions || 0
                }}</span>
                <span class="metric-label">AI Interactions</span>
                <span class="metric-sub"
                  >{{ overview()?.interactionsLast7Days || 0 }} this week</span
                >
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon sessions">
                <i class="pi pi-play-circle"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value"
                  >{{ overview()?.sessionCompletionRate || 0 }}%</span
                >
                <span class="metric-label">Session Completion</span>
                <p-progressBar
                  [value]="overview()?.sessionCompletionRate || 0"
                  [showValue]="false"
                  class="session-completion-bar"
                ></p-progressBar>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon accuracy">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value">{{
                  overview()?.feedbackAccuracyRate
                    ? overview()?.feedbackAccuracyRate + "%"
                    : "N/A"
                }}</span>
                <span class="metric-label">Feedback Accuracy</span>
                <span class="metric-sub"
                  >{{ overview()?.reviewedMessages || 0 }} messages
                  reviewed</span
                >
              </div>
            </div>
          </div>
        }

        <div class="analytics-grid">
          <!-- Left Column: Charts -->
          <div class="charts-column">
            <!-- AI Classification Breakdown -->
            <app-card-shell class="analytics-card" title="AI Classification">
              @if (loading()) {
                <p-skeleton
                  width="100%"
                  height="calc(var(--size-200) * 1.5)"
                ></p-skeleton>
              } @else {
                <div class="classification-stats">
                  <div class="stat-group">
                    <div class="stat-item stat-block stat-block--compact">
                      <div class="stat-block__content">
                        <span class="stat-block__value">{{
                          classification()?.total || 0
                        }}</span>
                        <span class="stat-block__label">Total Classified</span>
                      </div>
                    </div>
                    <div class="stat-item stat-block stat-block--compact">
                      <div class="stat-block__content">
                        <span class="stat-block__value">
                          {{
                            classification()?.avgConfidence
                              ? (
                                  (classification()?.avgConfidence || 0) * 100
                                ).toFixed(0) + "%"
                              : "N/A"
                          }}
                        </span>
                        <span class="stat-block__label">Avg. Confidence</span>
                      </div>
                    </div>
                  </div>

                  <div class="risk-distribution">
                    <h4>Risk Level Distribution</h4>
                    <div class="distribution-item">
                      <div class="dist-header">
                        <span class="dist-label">High Risk</span>
                        <span class="dist-value">{{
                          classification()?.riskDistribution?.high || 0
                        }}</span>
                      </div>
                      <p-progressBar
                        [value]="
                          ((classification()?.riskDistribution?.high || 0) /
                            (classification()?.total || 1)) *
                          100
                        "
                        [showValue]="false"
                        severity="danger"
                      ></p-progressBar>
                    </div>
                    <div class="distribution-item">
                      <div class="dist-header">
                        <span class="dist-label">Medium Risk</span>
                        <span class="dist-value">{{
                          classification()?.riskDistribution?.medium || 0
                        }}</span>
                      </div>
                      <p-progressBar
                        [value]="
                          ((classification()?.riskDistribution?.medium || 0) /
                            (classification()?.total || 1)) *
                          100
                        "
                        [showValue]="false"
                        severity="warning"
                      ></p-progressBar>
                    </div>
                    <div class="distribution-item">
                      <div class="dist-header">
                        <span class="dist-label">Low Risk</span>
                        <span class="dist-value">{{
                          classification()?.riskDistribution?.low || 0
                        }}</span>
                      </div>
                      <p-progressBar
                        [value]="
                          ((classification()?.riskDistribution?.low || 0) /
                            (classification()?.total || 1)) *
                          100
                        "
                        [showValue]="false"
                        severity="success"
                      ></p-progressBar>
                    </div>
                  </div>
                </div>
              }
            </app-card-shell>

            <!-- Activity Trends -->
            <app-card-shell class="analytics-card" title="Activity Trends">
              @if (loading()) {
                <p-skeleton
                  width="100%"
                  height="calc(var(--size-200) * 1.5)"
                ></p-skeleton>
              } @else {
                <div class="trends-summary">
                  <div class="trend-metric">
                    <span class="trend-label">Daily Average</span>
                    <span class="trend-value">{{
                      trends()?.summary?.avgQueriesPerDay || 0 | number: "1.1-1"
                    }}</span>
                  </div>
                  <div class="trend-metric">
                    <span class="trend-label">Total Queries</span>
                    <span class="trend-value">{{
                      trends()?.summary?.totalQueries || 0
                    }}</span>
                  </div>
                </div>
                <div class="chart-container">
                  <app-lazy-chart
                    type="line"
                    [data]="trendChartData"
                    [options]="lineChartOptions"
                  ></app-lazy-chart>
                </div>
              }
            </app-card-shell>
          </div>

          <!-- Right Column: Leaderboard & Feedback -->
          <div class="side-column">
            <!-- Team Leaderboard -->
            <app-card-shell class="analytics-card" title="Engagement Leaderboard">
              <p-table
                [value]="leaderboard()"
                [rows]="5"
                class="p-datatable-sm"
                [scrollable]="true"
              >
                <ng-template #header>
                  <tr>
                    <th class="leaderboard-rank-col">#</th>
                    <th>Athlete</th>
                    <th>Done</th>
                    <th>%</th>
                  </tr>
                </ng-template>
                <ng-template #body let-entry>
                  <tr>
                    <td>{{ entry.rank }}</td>
                    <td>{{ entry.name }}</td>
                    <td>{{ entry.completedSessions }}</td>
                    <td>
                      <app-status-tag
                        [value]="entry.completionRate + '%'"
                        [severity]="getCompletionSeverity(entry.completionRate)"
                        size="sm"
                      />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </app-card-shell>

            <!-- Feedback Stats -->
            <app-card-shell class="analytics-card" title="Feedback Overview">
              @if (feedbackStats(); as stats) {
                <div class="feedback-stats">
                  <div class="feedback-section">
                    <h5>Athlete Feedback</h5>
                    <div class="flex justify-between mb-2">
                      <span>Helpful</span>
                      <span class="font-bold">{{
                        stats.athleteFeedback?.helpful || 0
                      }}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                      <span>Not Helpful</span>
                      <span class="font-bold">{{
                        stats.athleteFeedback?.notHelpful || 0
                      }}</span>
                    </div>
                    <p-progressBar
                      [value]="stats.athleteFeedback?.helpfulRate || 0"
                      class="mb-4"
                    ></p-progressBar>
                  </div>

                  <p-divider></p-divider>

                  <div class="feedback-section mt-4">
                    <h5>Coach Review Accuracy</h5>
                    <div class="flex justify-between mb-2">
                      <span>Appropriate</span>
                      <span>{{ stats.coachFeedback?.appropriate || 0 }}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                      <span>Inaccurate</span>
                      <span>{{
                        (stats.coachFeedback?.tooStrict || 0) +
                          (stats.coachFeedback?.tooLenient || 0) +
                          (stats.coachFeedback?.wrongIntent || 0)
                      }}</span>
                    </div>
                    <p-progressBar
                      [value]="stats.coachFeedback?.accuracyRate || 0"
                      severity="info"
                    ></p-progressBar>
                  </div>
                </div>
              }
            </app-card-shell>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./coach-analytics.component.scss",
})
export class CoachAnalyticsComponent {
  loading = signal(false);
  overview = signal<OverviewMetrics | null>(null);
  classification = signal<ClassificationBreakdown | null>(null);
  trends = signal<TrendData | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  feedbackStats = signal<{
    positive: number;
    negative: number;
    neutral: number;
    athleteFeedback?: {
      helpful?: number;
      notHelpful?: number;
      helpfulRate?: number;
    };
    coachFeedback?: {
      appropriate?: number;
      tooStrict?: number;
      tooLenient?: number;
      wrongIntent?: number;
      accuracyRate?: number;
    };
  } | null>(null);

  teamOptions: TeamOption[] = [
    { label: "All Athletes", value: "all" },
    { label: "Youth Elite", value: "youth" },
    { label: "Adult Competition", value: "adult" },
  ];
  selectedTeam = "all";

  timeRangeOptions: TeamOption[] = [
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 90 Days", value: "90d" },
  ];
  selectedTimeRange = "30d";

  trendChartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  } | null = null;
  lineChartOptions: ChartOptions<"line"> | null = null;

  constructor() {
    this.initChartOptions();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    // Real data would come from this.apiService.get(API_ENDPOINTS.analytics.summary)
    setTimeout(() => {
      this.overview.set({
        totalAthletes: 0,
        activeAthletesLast7Days: 0,
        totalAiInteractions: 0,
        interactionsLast7Days: 0,
        sessionCompletionRate: 0,
        feedbackAccuracyRate: null,
        reviewedMessages: 0,
      });

      this.classification.set({
        total: 0,
        riskDistribution: { high: 0, medium: 0, low: 0 },
        topIntents: [],
        youthInteractions: 0,
        youthPercentage: 0,
        avgConfidence: null,
      });

      this.trends.set(null);
      this.leaderboard.set([]);
      this.feedbackStats.set(null);

      this.updateCharts();
      this.loading.set(false);
    }, 500);
  }

  onTeamChange(value: string | null | undefined): void {
    this.selectedTeam = value ?? "all";
    this.loadAnalytics();
  }

  onTeamSelect(event: SelectChangeEvent): void {
    this.onTeamChange((event.value as string | null | undefined) ?? null);
  }

  onTimeRangeChange(value: string | null | undefined): void {
    this.selectedTimeRange = value ?? "30d";
    this.loadAnalytics();
  }

  onTimeRangeSelect(event: SelectChangeEvent): void {
    this.onTimeRangeChange((event.value as string | null | undefined) ?? null);
  }

  private initChartOptions(): void {
    this.lineChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { display: true },
        y: { display: true, beginAtZero: true },
      },
    };
  }

  private updateCharts(): void {
    this.trendChartData = {
      labels: ["W1", "W2", "W3", "W4"],
      datasets: [
        {
          label: "Queries",
          data: [65, 82, 74, 95],
          borderColor: COLORS.CYAN,
          tension: 0.4,
          fill: true,
          backgroundColor: `${COLORS.CYAN}1a`,
        },
      ],
    };
  }

  getCompletionSeverity(
    rate: number,
  ): "success" | "info" | "warning" | "danger" {
    if (rate >= 90) return "success";
    if (rate >= 70) return "info";
    if (rate >= 50) return "warning";
    return "danger";
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitials(name: string): string {
    return getInitials(name);
  }
}
