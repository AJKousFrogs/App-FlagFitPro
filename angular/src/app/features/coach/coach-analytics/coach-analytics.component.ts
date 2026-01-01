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

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DividerModule } from "primeng/divider";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabPanel, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    CardModule,
    ChartModule,
    DividerModule,
    ProgressBarModule,
    Select,
    SkeletonModule,
    TableModule,
    Tabs,
    TabPanel,
    TagModule,
    TooltipModule,
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-analytics">
        <!-- Header -->
        <div class="analytics-header">
          <div class="header-content">
            <h1>
              <i class="pi pi-chart-bar"></i>
              Team Analytics
            </h1>
            <p class="header-subtitle">
              Monitor AI Coach performance and athlete engagement
            </p>
          </div>
          <div class="header-filters">
            <p-select
              [options]="teamOptions"
              [(ngModel)]="selectedTeam"
              placeholder="Select Team"
              (onChange)="loadAnalytics()"
            ></p-select>
            <p-select
              [options]="timeRangeOptions"
              [(ngModel)]="selectedTimeRange"
              placeholder="Select Period"
              (onChange)="loadAnalytics()"
            ></p-select>
            <p-button
              icon="pi pi-refresh"
              [rounded]="true"
              [outlined]="true"
              (onClick)="loadAnalytics()"
              [loading]="loading()"
            ></p-button>
          </div>
        </div>

        <!-- Overview Metrics -->
        @if (loading()) {
          <div class="metrics-grid">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <p-skeleton width="100%" height="120px"></p-skeleton>
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
                  [style]="{ height: '6px', marginTop: '8px' }"
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
            <p-card header="AI Classification" styleClass="analytics-card">
              @if (loading()) {
                <p-skeleton width="100%" height="300px"></p-skeleton>
              } @else {
                <div class="classification-stats">
                  <div class="stat-group">
                    <div class="stat-item">
                      <span class="stat-label">Total Classified</span>
                      <span class="stat-value">{{
                        classification()?.total || 0
                      }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Avg. Confidence</span>
                      <span class="stat-value">
                        {{
                          classification()?.avgConfidence
                            ? ((classification()?.avgConfidence || 0) * 100).toFixed(0) + "%"
                            : "N/A"
                        }}
                      </span>
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
                        severity="warn"
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
            </p-card>

            <!-- Activity Trends -->
            <p-card header="Activity Trends" styleClass="analytics-card">
              @if (loading()) {
                <p-skeleton width="100%" height="300px"></p-skeleton>
              } @else {
                <div class="trends-summary">
                  <div class="trend-metric">
                    <span class="trend-label">Daily Average</span>
                    <span class="trend-value">{{
                      trends()?.summary?.avgQueriesPerDay || 0 | number: '1.1-1'
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
                  <p-chart
                    type="line"
                    [data]="trendChartData"
                    [options]="lineChartOptions"
                  ></p-chart>
                </div>
              }
            </p-card>
          </div>

          <!-- Right Column: Leaderboard & Feedback -->
          <div class="side-column">
            <!-- Team Leaderboard -->
            <p-card header="Engagement Leaderboard" styleClass="analytics-card">
              <p-table
                [value]="leaderboard()"
                [rows]="5"
                styleClass="p-datatable-sm"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 3rem">#</th>
                    <th>Athlete</th>
                    <th>Done</th>
                    <th>%</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-entry>
                  <tr>
                    <td>{{ entry.rank }}</td>
                    <td>{{ entry.name }}</td>
                    <td>{{ entry.completedSessions }}</td>
                    <td>
                      <p-tag
                        [value]="entry.completionRate + '%'"
                        [severity]="getCompletionSeverity(entry.completionRate)"
                      ></p-tag>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>

            <!-- Feedback Stats -->
            <p-card header="Feedback Overview" styleClass="analytics-card">
              <div class="feedback-stats" *ngIf="feedbackStats()">
                <div class="feedback-section">
                  <h5>Athlete Feedback</h5>
                  <div class="flex justify-between mb-2">
                    <span>Helpful</span>
                    <span class="font-bold">{{
                      feedbackStats().athleteFeedback?.helpful || 0
                    }}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span>Not Helpful</span>
                    <span class="font-bold">{{
                      feedbackStats().athleteFeedback?.notHelpful || 0
                    }}</span>
                  </div>
                  <p-progressBar
                    [value]="feedbackStats().athleteFeedback?.helpfulRate || 0"
                    styleClass="mb-4"
                  ></p-progressBar>
                </div>

                <p-divider></p-divider>

                <div class="feedback-section mt-4">
                  <h5>Coach Review Accuracy</h5>
                  <div class="flex justify-between mb-2">
                    <span>Appropriate</span>
                    <span>{{
                      feedbackStats().coachFeedback?.appropriate || 0
                    }}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span>Inaccurate</span>
                    <span>{{
                      (feedbackStats().coachFeedback?.tooStrict || 0) +
                        (feedbackStats().coachFeedback?.tooLenient || 0) +
                        (feedbackStats().coachFeedback?.wrongIntent || 0)
                    }}</span>
                  </div>
                  <p-progressBar
                    [value]="feedbackStats().coachFeedback?.accuracyRate || 0"
                    severity="info"
                  ></p-progressBar>
                </div>
              </div>
            </p-card>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .coach-analytics {
        padding: var(--space-6);
      }

      .analytics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-8);
      }

      .header-filters {
        display: flex;
        gap: var(--space-3);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-8);
      }

      .metric-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        background: white;
        padding: var(--space-4);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .metric-icon.athletes {
        background: #e0f2fe;
        color: #0284c7;
      }
      .metric-icon.interactions {
        background: #f0fdf4;
        color: #16a34a;
      }
      .metric-icon.sessions {
        background: #fef9c3;
        color: #ca8a04;
      }
      .metric-icon.accuracy {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .metric-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .metric-sub {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 2px;
      }

      .analytics-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: var(--space-6);
      }

      .charts-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .side-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .analytics-card {
        height: 100%;
      }

      .classification-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .stat-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .stat-item {
        background: var(--p-surface-50);
        padding: var(--space-3);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
      }

      .risk-distribution {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .distribution-item {
        margin-bottom: var(--space-2);
      }

      .dist-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        margin-bottom: 4px;
      }

      .chart-container {
        height: 250px;
        position: relative;
      }

      @media (max-width: 1024px) {
        .analytics-grid {
          grid-template-columns: 1fr;
        }
        .side-column {
          order: -1;
        }
      }
    `,
  ],
})
export class CoachAnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  overview = signal<OverviewMetrics | null>(null);
  classification = signal<ClassificationBreakdown | null>(null);
  trends = signal<TrendData | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  feedbackStats = signal<any>(null);

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

  trendChartData: any;
  lineChartOptions: any;

  ngOnInit(): void {
    this.initChartOptions();
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    // Mocking load for demo
    setTimeout(() => {
      this.overview.set({
        totalAthletes: 24,
        activeAthletesLast7Days: 18,
        totalAiInteractions: 452,
        interactionsLast7Days: 86,
        sessionCompletionRate: 78,
        feedbackAccuracyRate: 92,
        reviewedMessages: 124,
      });

      this.classification.set({
        total: 452,
        riskDistribution: { high: 12, medium: 45, low: 395 },
        topIntents: [
          { intent: "training_query", count: 180 },
          { intent: "recovery_advice", count: 95 },
          { intent: "nutrition_info", count: 72 },
        ],
        youthInteractions: 120,
        youthPercentage: 26,
        avgConfidence: 0.88,
      });

      this.trends.set({
        period: "30d",
        startDate: "2024-11-23",
        endDate: "2024-12-23",
        daily: [], // Empty for mock
        summary: {
          totalQueries: 452,
          avgQueriesPerDay: 15.1,
          highRiskTotal: 12,
          sessionsCompleted: 342,
        },
      });

      this.leaderboard.set([
        {
          rank: 1,
          userId: "1",
          name: "Marcus Rivera",
          completedSessions: 28,
          totalSessions: 30,
          completionRate: 93,
          totalMinutes: 1240,
          lastCompleted: new Date().toISOString(),
        },
        {
          rank: 2,
          userId: "2",
          name: "Sarah Chen",
          completedSessions: 26,
          totalSessions: 30,
          completionRate: 87,
          totalMinutes: 1100,
          lastCompleted: new Date().toISOString(),
        },
        {
          rank: 3,
          userId: "3",
          name: "Jackson Lee",
          completedSessions: 24,
          totalSessions: 30,
          completionRate: 80,
          totalMinutes: 980,
          lastCompleted: new Date().toISOString(),
        },
      ]);

      this.feedbackStats.set({
        athleteFeedback: { helpful: 120, notHelpful: 12, helpfulRate: 91 },
        coachFeedback: {
          appropriate: 115,
          tooStrict: 4,
          tooLenient: 3,
          wrongIntent: 2,
          accuracyRate: 92,
        },
      });

      this.updateCharts();
      this.loading.set(false);
    }, 800);
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
          borderColor: "#0284c7",
          tension: 0.4,
          fill: true,
          backgroundColor: "rgba(2, 132, 199, 0.1)",
        },
      ],
    };
  }

  getCompletionSeverity(rate: number): "success" | "info" | "warn" | "danger" {
    if (rate >= 90) return "success";
    if (rate >= 70) return "info";
    if (rate >= 50) return "warn";
    return "danger";
  }
}
