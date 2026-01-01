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
    Tabs,
    TabPanel,
    CardModule,
    ButtonModule,
    TagModule,
    BadgeModule,
    SkeletonModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    ChartModule,
    ProgressBarModule,
    TableModule,
    Select,
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
              AI Coach Analytics
            </h1>
            <p class="header-subtitle">
              Monitor AI interactions and team engagement
            </p>
          </div>
          <div class="header-actions">
            @if (teams().length > 1) {
              <p-select
                [options]="teams()"
                [(ngModel)]="selectedTeamId"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Team"
                (onChange)="onTeamChange()"
                [style]="{ width: '200px' }"
              ></p-select>
            }
            <p-button
              icon="pi pi-refresh"
              [rounded]="true"
              severity="secondary"
              pTooltip="Refresh Data"
              (onClick)="refreshData()"
              [loading]="refreshing()"
            ></p-button>
          </div>
        </div>

        <!-- Overview Cards -->
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
                <span class="metric-value">
                  {{
                    overview()?.feedbackAccuracyRate !== null
                      ? overview()?.feedbackAccuracyRate + "%"
                      : "N/A"
                  }}
                </span>
                <span class="metric-label">Classification Accuracy</span>
                <span class="metric-sub"
                  >{{ overview()?.reviewedMessages || 0 }} reviewed</span
                >
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon confidence">
                <i class="pi pi-percentage"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value">
                  {{
                    classification()?.avgConfidence
                      ? (classification()?.avgConfidence * 100).toFixed(0) + "%"
                      : "N/A"
                  }}
                </span>
                <span class="metric-label">Avg Confidence</span>
                <span class="metric-sub">Classification certainty</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon youth">
                <i class="pi pi-user"></i>
              </div>
              <div class="metric-content">
                <span class="metric-value"
                  >{{ classification()?.youthPercentage || 0 }}%</span
                >
                <span class="metric-label">Youth Interactions</span>
                <span class="metric-sub"
                  >{{ classification()?.youthInteractions || 0 }} total</span
                >
              </div>
            </div>
          </div>
        }

        <!-- Main Tabs -->
        <p-tabs>
          <!-- Classification Tab -->
          <p-tabpanel header="Classification">
            <div class="charts-grid">
              <!-- Risk Distribution -->
              <p-card header="Risk Level Distribution">
                @if (riskChartData()) {
                  <p-chart
                    type="doughnut"
                    [data]="riskChartData()"
                    [options]="doughnutOptions"
                  ></p-chart>
                } @else {
                  <div class="empty-chart">
                    <i class="pi pi-chart-pie"></i>
                    <p>No data available</p>
                  </div>
                }

                @if (classification()) {
                  <div class="chart-legend">
                    <div class="legend-item">
                      <span class="legend-color high"></span>
                      <span
                        >High Risk:
                        {{ classification()?.riskDistribution.high }}</span
                      >
                    </div>
                    <div class="legend-item">
                      <span class="legend-color medium"></span>
                      <span
                        >Medium Risk:
                        {{ classification()?.riskDistribution.medium }}</span
                      >
                    </div>
                    <div class="legend-item">
                      <span class="legend-color low"></span>
                      <span
                        >Low Risk:
                        {{ classification()?.riskDistribution.low }}</span
                      >
                    </div>
                  </div>
                }
              </p-card>

              <!-- Intent Distribution -->
              <p-card header="Top Intents">
                @if (intentChartData()) {
                  <p-chart
                    type="bar"
                    [data]="intentChartData()"
                    [options]="barOptions"
                  ></p-chart>
                } @else {
                  <div class="empty-chart">
                    <i class="pi pi-chart-bar"></i>
                    <p>No data available</p>
                  </div>
                }
              </p-card>
            </div>
          </p-tabpanel>

          <!-- Trends Tab -->
          <p-tabpanel header="Trends">
            <div class="trends-section">
              <div class="trend-header">
                <h3>Activity Over Time</h3>
                <div class="trend-summary">
                  <span
                    ><strong>{{ trends()?.summary.totalQueries || 0 }}</strong>
                    total queries</span
                  >
                  <span
                    ><strong>{{
                      trends()?.summary.avgQueriesPerDay || 0
                    }}</strong>
                    avg/day</span
                  >
                  <span class="high-risk"
                    ><strong>{{ trends()?.summary.highRiskTotal || 0 }}</strong>
                    high risk</span
                  >
                </div>
              </div>

              @if (trendChartData()) {
                <p-chart
                  type="line"
                  [data]="trendChartData()"
                  [options]="lineOptions"
                  [style]="{ height: '350px' }"
                ></p-chart>
              } @else {
                <div class="empty-chart large">
                  <i class="pi pi-chart-line"></i>
                  <p>No trend data available</p>
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Leaderboard Tab -->
          <p-tabpanel header="Leaderboard">
            <div class="leaderboard-section">
              <h3>
                <i class="pi pi-trophy"></i>
                Session Completion Leaderboard
              </h3>
              <p class="leaderboard-subtitle">Last 30 days</p>

              @if (loadingLeaderboard()) {
                <p-skeleton width="100%" height="400px"></p-skeleton>
              } @else if (leaderboard().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <p>No session data yet</p>
                </div>
              } @else {
                <div class="leaderboard-list">
                  @for (entry of leaderboard(); track entry.userId) {
                    <div
                      class="leaderboard-item"
                      [class.top-3]="entry.rank <= 3"
                    >
                      <div class="rank" [class]="'rank-' + entry.rank">
                        @if (entry.rank <= 3) {
                          <i class="pi pi-star-fill"></i>
                        } @else {
                          {{ entry.rank }}
                        }
                      </div>
                      <p-avatar
                        [label]="getInitials(entry.name)"
                        shape="circle"
                        [style]="{
                          'background-color': getAvatarColor(entry.rank),
                          color: 'white',
                        }"
                      ></p-avatar>
                      <div class="entry-info">
                        <span class="entry-name">{{ entry.name }}</span>
                        <span class="entry-stats">
                          {{ entry.completedSessions }} sessions ·
                          {{ entry.totalMinutes }} min
                        </span>
                      </div>
                      <div class="entry-rate">
                        <span class="rate-value"
                          >{{ entry.completionRate }}%</span
                        >
                        <p-progressBar
                          [value]="entry.completionRate"
                          [showValue]="false"
                          [style]="{ width: '80px', height: '6px' }"
                        ></p-progressBar>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </p-tabpanel>

          <!-- Feedback Tab -->
          <p-tabpanel header="Feedback">
            <div class="feedback-section">
              <div class="feedback-grid">
                <p-card header="Athlete Feedback">
                  <div class="feedback-stat">
                    <div class="stat-row">
                      <span class="stat-label">Helpful</span>
                      <span class="stat-value positive">
                        <i class="pi pi-thumbs-up"></i>
                        {{ feedbackStats()?.athleteFeedback.helpful || 0 }}
                      </span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Not Helpful</span>
                      <span class="stat-value negative">
                        <i class="pi pi-thumbs-down"></i>
                        {{ feedbackStats()?.athleteFeedback.notHelpful || 0 }}
                      </span>
                    </div>
                    <p-divider></p-divider>
                    <div class="stat-row highlight">
                      <span class="stat-label">Helpful Rate</span>
                      <span class="stat-value"
                        >{{
                          feedbackStats()?.athleteFeedback.helpfulRate || 0
                        }}%</span
                      >
                    </div>
                  </div>
                </p-card>

                <p-card header="Coach Reviews">
                  <div class="feedback-stat">
                    <div class="stat-row">
                      <span class="stat-label">Appropriate</span>
                      <span class="stat-value positive">{{
                        feedbackStats()?.coachFeedback.appropriate || 0
                      }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Too Strict</span>
                      <span class="stat-value">{{
                        feedbackStats()?.coachFeedback.tooStrict || 0
                      }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Too Lenient</span>
                      <span class="stat-value">{{
                        feedbackStats()?.coachFeedback.tooLenient || 0
                      }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">Wrong Intent</span>
                      <span class="stat-value">{{
                        feedbackStats()?.coachFeedback.wrongIntent || 0
                      }}</span>
                    </div>
                    <p-divider></p-divider>
                    <div class="stat-row highlight">
                      <span class="stat-label">Accuracy Rate</span>
                      <span class="stat-value"
                        >{{
                          feedbackStats()?.coachFeedback.accuracyRate || 0
                        }}%</span
                      >
                    </div>
                  </div>
                </p-card>

                <p-card header="Feedback by Source">
                  @if (feedbackSourceChartData()) {
                    <p-chart
                      type="pie"
                      [data]="feedbackSourceChartData()"
                      [options]="pieOptions"
                    ></p-chart>
                  } @else {
                    <div class="empty-chart">
                      <i class="pi pi-chart-pie"></i>
                      <p>No feedback data</p>
                    </div>
                  }
                </p-card>
              </div>
            </div>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .coach-analytics {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--space-4);
      }

      .analytics-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--space-6);
      }

      .header-content h1 {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-1) 0;
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .header-content h1 i {
        color: var(--ds-primary-green);
      }

      .header-subtitle {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--text-sm);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .metric-card {
        background: var(--surface-card);
        border-radius: var(--radius-xl);
        padding: var(--space-4);
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .metric-icon i {
        font-size: 1.5rem;
        color: white;
      }

      .metric-icon.athletes {
        background: linear-gradient(135deg, var(--ds-primary-green), #06b358);
      }
      .metric-icon.interactions {
        background: linear-gradient(135deg, #3b82f6, #60a5fa);
      }
      .metric-icon.sessions {
        background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      }
      .metric-icon.accuracy {
        background: linear-gradient(135deg, #10b981, #34d399);
      }
      .metric-icon.confidence {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
      }
      .metric-icon.youth {
        background: linear-gradient(135deg, #ec4899, #f472b6);
      }

      .metric-content {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .metric-value {
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        line-height: 1.2;
      }

      .metric-label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
      }

      .metric-sub {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-top: var(--space-1);
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-4);
      }

      .chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        margin-top: var(--space-4);
        padding-top: var(--space-3);
        border-top: 1px solid var(--surface-border);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-sm);
      }

      .legend-color.high {
        background: #ef4444;
      }
      .legend-color.medium {
        background: #f59e0b;
      }
      .legend-color.low {
        background: var(--ds-primary-green);
      }

      .empty-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        color: var(--color-text-muted);
      }

      .empty-chart.large {
        padding: var(--space-12);
      }

      .empty-chart i {
        font-size: 2rem;
        margin-bottom: var(--space-2);
      }

      .trends-section {
        padding: var(--space-4) 0;
      }

      .trend-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .trend-header h3 {
        margin: 0;
      }

      .trend-summary {
        display: flex;
        gap: var(--space-4);
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .trend-summary .high-risk {
        color: #ef4444;
      }

      .leaderboard-section {
        padding: var(--space-4) 0;
      }

      .leaderboard-section h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-1) 0;
      }

      .leaderboard-section h3 i {
        color: #f59e0b;
      }

      .leaderboard-subtitle {
        color: var(--color-text-secondary);
        font-size: var(--text-sm);
        margin: 0 0 var(--space-4) 0;
      }

      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .leaderboard-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--surface-card);
        border-radius: var(--radius-lg);
      }

      .leaderboard-item.top-3 {
        background: linear-gradient(
          135deg,
          rgba(8, 153, 73, 0.05),
          rgba(8, 153, 73, 0.1)
        );
      }

      .rank {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        border-radius: var(--radius-full);
        background: var(--surface-100);
      }

      .rank-1 {
        background: linear-gradient(135deg, #ffd700, #ffec8b);
        color: #8b6914;
      }
      .rank-2 {
        background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
        color: #5a5a5a;
      }
      .rank-3 {
        background: linear-gradient(135deg, #cd7f32, #daa06d);
        color: #5c3d1e;
      }

      .entry-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .entry-name {
        font-weight: var(--font-weight-medium);
      }

      .entry-stats {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }

      .entry-rate {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
      }

      .rate-value {
        font-weight: var(--font-weight-bold);
        color: var(--ds-primary-green);
      }

      .feedback-section {
        padding: var(--space-4) 0;
      }

      .feedback-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-4);
      }

      .feedback-stat {
        display: flex;
        flex-direction: column;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2) 0;
      }

      .stat-row.highlight {
        padding-top: var(--space-3);
      }

      .stat-row.highlight .stat-value {
        font-size: var(--text-xl);
        font-weight: var(--font-weight-bold);
        color: var(--ds-primary-green);
      }

      .stat-value {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: var(--font-weight-medium);
      }

      .stat-value.positive {
        color: var(--ds-primary-green);
      }
      .stat-value.negative {
        color: #ef4444;
      }

      .empty-state {
        text-align: center;
        padding: var(--space-8);
        color: var(--color-text-muted);
      }

      .empty-state i {
        font-size: 2rem;
        margin-bottom: var(--space-2);
      }

      @media (max-width: 768px) {
        .coach-analytics {
          padding: var(--space-3);
        }

        .analytics-header {
          flex-direction: column;
          gap: var(--space-3);
        }

        .header-actions {
          width: 100%;
          flex-wrap: wrap;
        }

        .metrics-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .charts-grid {
          grid-template-columns: 1fr;
        }

        .trend-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .trend-summary {
          flex-wrap: wrap;
          gap: var(--space-2);
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

  // State
  loading = signal(true);
  loadingLeaderboard = signal(true);
  refreshing = signal(false);

  overview = signal<OverviewMetrics | null>(null);
  classification = signal<ClassificationBreakdown | null>(null);
  trends = signal<TrendData | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  feedbackStats = signal<Record<string, unknown> | null>(null);
  teams = signal<TeamOption[]>([]);
  selectedTeamId = "";

  // Chart data
  riskChartData = signal<Record<string, unknown> | null>(null);
  intentChartData = signal<Record<string, unknown> | null>(null);
  trendChartData = signal<Record<string, unknown> | null>(null);
  feedbackSourceChartData = signal<Record<string, unknown> | null>(null);

  // Chart options
  doughnutOptions = {
    plugins: {
      legend: { display: false },
    },
    cutout: "60%",
  };

  barOptions = {
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { beginAtZero: true },
    },
  };

  lineOptions = {
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
    maintainAspectRatio: false,
  };

  pieOptions = {
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  ngOnInit(): void {
    this.loadTeams();
    this.loadAllData();
  }

  private async loadTeams(): Promise<void> {
    try {
      const response = await this.apiService
        .get<{ teams: { id: string; name: string }[] }>("/api/teams")
        .toPromise();

      if (response?.success && response.data?.teams) {
        this.teams.set(
          response.data.teams.map((t) => ({ label: t.name, value: t.id })),
        );
        if (response.data.teams.length > 0) {
          this.selectedTeamId = response.data.teams[0].id;
        }
      }
    } catch (error) {
      this.logger.error("Error loading teams:", error);
    }
  }

  private async loadAllData(): Promise<void> {
    this.loading.set(true);

    await Promise.all([
      this.loadOverview(),
      this.loadClassification(),
      this.loadTrends(),
      this.loadLeaderboard(),
      this.loadFeedbackStats(),
    ]);

    this.loading.set(false);
  }

  private async loadOverview(): Promise<void> {
    try {
      const response = await this.apiService
        .get<OverviewMetrics>("/api/coach-analytics/overview")
        .toPromise();

      if (response?.success && response.data) {
        this.overview.set(response.data);
      }
    } catch (error) {
      this.logger.error("Error loading overview:", error);
    }
  }

  private async loadClassification(): Promise<void> {
    try {
      const response = await this.apiService
        .get<ClassificationBreakdown>("/api/coach-analytics/classification")
        .toPromise();

      if (response?.success && response.data) {
        this.classification.set(response.data);
        this.buildRiskChart(response.data);
        this.buildIntentChart(response.data);
      }
    } catch (error) {
      this.logger.error("Error loading classification:", error);
    }
  }

  private async loadTrends(): Promise<void> {
    try {
      const response = await this.apiService
        .get<TrendData>("/api/coach-analytics/trends", { days: 30 })
        .toPromise();

      if (response?.success && response.data) {
        this.trends.set(response.data);
        this.buildTrendChart(response.data);
      }
    } catch (error) {
      this.logger.error("Error loading trends:", error);
    }
  }

  private async loadLeaderboard(): Promise<void> {
    this.loadingLeaderboard.set(true);

    try {
      if (!this.selectedTeamId) {
        this.leaderboard.set([]);
        return;
      }

      const response = await this.apiService
        .get<{
          leaderboard: LeaderboardEntry[];
        }>(`/api/coach-analytics/leaderboard/${this.selectedTeamId}`, {
          limit: 10,
        })
        .toPromise();

      if (response?.success && response.data?.leaderboard) {
        this.leaderboard.set(response.data.leaderboard);
      }
    } catch (error) {
      this.logger.error("Error loading leaderboard:", error);
    } finally {
      this.loadingLeaderboard.set(false);
    }
  }

  private async loadFeedbackStats(): Promise<void> {
    try {
      const response = await this.apiService
        .get<
          Record<string, unknown>
        >("/api/response-feedback/stats", { team_id: this.selectedTeamId || undefined })
        .toPromise();

      if (response?.success && response.data) {
        this.feedbackStats.set(response.data);
        this.buildFeedbackSourceChart(response.data as Record<string, unknown>);
      }
    } catch (error) {
      this.logger.error("Error loading feedback stats:", error);
    }
  }

  // Chart builders
  private buildRiskChart(data: ClassificationBreakdown): void {
    if (data.total === 0) {
      this.riskChartData.set(null);
      return;
    }

    this.riskChartData.set({
      labels: ["High Risk", "Medium Risk", "Low Risk"],
      datasets: [
        {
          data: [
            data.riskDistribution.high,
            data.riskDistribution.medium,
            data.riskDistribution.low,
          ],
          backgroundColor: ["#ef4444", "#f59e0b", "var(--ds-primary-green)"],
          hoverBackgroundColor: ["#dc2626", "#d97706", "#047c3a"],
        },
      ],
    });
  }

  private buildIntentChart(data: ClassificationBreakdown): void {
    if (data.topIntents.length === 0) {
      this.intentChartData.set(null);
      return;
    }

    const labels = data.topIntents.map((i) => this.formatIntent(i.intent));
    const values = data.topIntents.map((i) => i.count);

    this.intentChartData.set({
      labels,
      datasets: [
        {
          label: "Count",
          data: values,
          backgroundColor: "var(--ds-primary-green)",
          borderRadius: 4,
        },
      ],
    });
  }

  private buildTrendChart(data: TrendData): void {
    if (data.daily.length === 0) {
      this.trendChartData.set(null);
      return;
    }

    const labels = data.daily.map((d) => this.formatDate(d.date));

    this.trendChartData.set({
      labels,
      datasets: [
        {
          label: "AI Queries",
          data: data.daily.map((d) => d.queries),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "High Risk",
          data: data.daily.map((d) => d.highRisk),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: false,
          tension: 0.3,
        },
        {
          label: "Sessions Completed",
          data: data.daily.map((d) => d.sessionsCompleted),
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
          fill: false,
          tension: 0.3,
        },
      ],
    });
  }

  private buildFeedbackSourceChart(data: Record<string, unknown>): void {
    const bySource = data["bySource"] as Record<string, number> | undefined;
    if (!bySource) {
      this.feedbackSourceChartData.set(null);
      return;
    }

    const total = Object.values(bySource).reduce(
      (a: number, b: number) => a + b,
      0,
    );
    if (total === 0) {
      this.feedbackSourceChartData.set(null);
      return;
    }

    this.feedbackSourceChartData.set({
      labels: ["Athlete", "Coach", "Parent"],
      datasets: [
        {
          data: [
            bySource["athlete"] || 0,
            bySource["coach"] || 0,
            bySource["parent"] || 0,
          ],
          backgroundColor: ["#3b82f6", "var(--ds-primary-green)", "#8b5cf6"],
        },
      ],
    });
  }

  // Actions
  onTeamChange(): void {
    this.loadLeaderboard();
    this.loadFeedbackStats();
  }

  async refreshData(): Promise<void> {
    this.refreshing.set(true);

    try {
      // Trigger cache refresh
      await this.apiService
        .post("/api/coach-analytics/refresh", {
          teamId: this.selectedTeamId || undefined,
        })
        .toPromise();

      // Reload all data
      await this.loadAllData();
      this.toastService.success("Analytics refreshed");
    } catch (error) {
      this.logger.error("Error refreshing data:", error);
      this.toastService.error("Failed to refresh analytics");
    } finally {
      this.refreshing.set(false);
    }
  }

  // Helpers
  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(rank: number): string {
    if (rank === 1) return "#ffd700";
    if (rank === 2) return "#c0c0c0";
    if (rank === 3) return "#cd7f32";
    return "var(--ds-primary-green)";
  }

  formatIntent(intent: string): string {
    return intent.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
