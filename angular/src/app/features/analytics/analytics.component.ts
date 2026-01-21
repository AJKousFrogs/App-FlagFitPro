import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  QueryList,
  viewChildren,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { UIChart } from "primeng/chart"; // Still needed for @ViewChildren type
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabPanel, Tabs } from "primeng/tabs";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  COLORS,
  TIMEOUTS,
  UI_LIMITS,
} from "../../core/constants/app.constants";
import { AcwrService } from "../../core/services/acwr.service";
import { API_ENDPOINTS, ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import {
  PlayerGameStats,
  PlayerMultiSeasonStats,
  PlayerSeasonStats,
  PlayerStatisticsService,
} from "../../core/services/player-statistics.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { TrainingDataService } from "../../core/services/training-data.service";
import { SupabaseService } from "../../core/services/supabase.service";
import {
  TeamPerformanceRankingService,
  PerformanceAchievement,
} from "../../core/services/team-performance-ranking.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  ENHANCED_BAR_CHART_OPTIONS,
  ENHANCED_DOUGHNUT_CHART_OPTIONS,
  ENHANCED_LINE_CHART_OPTIONS,
  ENHANCED_RADAR_CHART_OPTIONS,
  exportChartAsPNG,
  resetChartZoom,
  updateChartFontSizes,
} from "../../shared/config/enhanced-chart.config";
import { DATA_STATE_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { formatDate } from "../../shared/utils/date.utils";

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

interface DevelopmentGoal {
  id: string;
  metricType: "speed" | "agility" | "strength" | "power" | "skill";
  metricName: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  startValue: number;
  deadline: Date;
  coachNote: string;
  status: "active" | "achieved" | "missed";
}

@Component({
  selector: "app-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    FormsModule,
    RouterModule,
    Card,

    LazyChartComponent,
    Dialog,
    PrimeTemplate,
    ProgressBar,
    TableModule,
    StatusTagComponent,
    Tooltip,
    Tabs,
    TabPanel,
    Select,
    MainLayoutComponent,
    PageHeaderComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isPageLoading()"
        variant="skeleton"
        message="Loading analytics..."
      ></app-loading>

      <!-- Error State -->
      @if (hasPageError()) {
        <app-page-error-state
          title="Unable to load analytics"
          [message]="pageErrorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="analytics-page">
          <app-page-header
            title="FlagFit Pro Analytics"
            subtitle="Advanced Performance Analytics & Team Insights"
            icon="pi-chart-bar"
          >
            <div class="header-actions">
              <app-button
                variant="outlined"
                iconLeft="pi-share-alt"
                (clicked)="showShareDialog.set(true)"
                >Share with Coach</app-button
              >
              <app-button
                iconLeft="pi-file-pdf"
                (clicked)="exportAnalyticsPDF()"
                >Export PDF</app-button
              >
            </div>
          </app-page-header>

          <!-- My Development Goals (Coach Assigned) -->
          <p-card class="development-goals-card">
            <ng-template pTemplate="header">
              <div class="goals-header">
                <div class="goals-title">
                  <i class="pi pi-bullseye"></i>
                  <h3>My Development Goals</h3>
                  <span class="coach-label">(Coach Assigned)</span>
                </div>
                <a routerLink="/goals" class="view-all-link">
                  View All <i class="pi pi-arrow-right"></i>
                </a>
              </div>
            </ng-template>

            @if (developmentGoals().length === 0) {
              <div class="goals-empty-state">
                <i class="pi pi-bullseye empty-icon"></i>
                <h4>No goals assigned yet</h4>
                <p>
                  Your coach will assign development goals here. Check back soon
                  or ask your coach to set goals for you.
                </p>
                <app-button
                  variant="outlined"
                  iconLeft="pi-envelope"
                  routerLink="/team-chat"
                  class="empty-state-cta"
                  >Request Goals from Coach</app-button
                >
              </div>
            } @else {
              <div class="goals-grid">
                @for (
                  goal of developmentGoals().slice(
                    0,
                    UI_LIMITS.GOALS_PREVIEW_COUNT
                  );
                  track goal.id
                ) {
                  <div
                    class="goal-card"
                    [class.achieved]="goal.status === 'achieved'"
                  >
                    <div class="goal-header">
                      <i [class]="getGoalIcon(goal.metricType)"></i>
                      <span class="goal-name">{{ goal.metricName }}</span>
                    </div>
                    <div class="goal-targets">
                      <div class="target-row">
                        <span class="target-label">Target:</span>
                        <span class="target-value"
                          >{{ goal.targetValue }}{{ goal.targetUnit }} by
                          {{ goal.deadline | date: "MMM d" }}</span
                        >
                      </div>
                      <div class="target-row">
                        <span class="target-label">Current:</span>
                        <span class="current-value"
                          >{{ goal.currentValue }}{{ goal.targetUnit }}</span
                        >
                      </div>
                    </div>
                    <div class="goal-progress">
                      <p-progressBar
                        [value]="calculateGoalProgress(goal)"
                        [showValue]="false"
                        styleClass="goal-progress-bar"
                      ></p-progressBar>
                      <span class="progress-percent"
                        >{{ calculateGoalProgress(goal) }}%</span
                      >
                    </div>
                    <div class="goal-meta">
                      <span class="days-remaining">
                        <i class="pi pi-calendar"></i>
                        {{ getDaysRemaining(goal.deadline) }} days remaining
                      </span>
                    </div>
                    @if (goal.coachNote) {
                      <div class="coach-note">
                        <i class="pi pi-comment"></i>
                        <span>"{{ goal.coachNote }}"</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </p-card>

          <!-- Key Metrics Overview -->
          <div class="metrics-grid">
            @for (
              metric of metrics();
              track trackByMetricLabel($index, metric)
            ) {
              <p-card class="metric-card">
                <div class="metric-card-content">
                  <div class="metric-icon">
                    <i [class]="'pi ' + metric.icon"></i>
                  </div>
                  <div class="metric-details">
                    <div class="metric-value">{{ metric.value }}</div>
                    <div class="metric-label">{{ metric.label }}</div>
                    <div
                      class="metric-trend"
                      [class]="'trend-' + metric.trendType"
                    >
                      {{ metric.trend }}
                    </div>
                  </div>
                </div>
              </p-card>
            }
          </div>

          <!-- Team Performance Badges -->
          @if (teamPerformanceAchievements().length > 0) {
            <p-card class="team-badges-card">
              <ng-template pTemplate="header">
                <div class="badges-header">
                  <div class="badges-title">
                    <i class="pi pi-trophy"></i>
                    <h3>Your Team Performance Badges</h3>
                  </div>
                  <a routerLink="/performance-tracking" class="view-details-link">
                    View Details <i class="pi pi-arrow-right"></i>
                  </a>
                </div>
              </ng-template>
              <div class="badges-content">
                <div class="badges-summary">
                  @if (teamRankingBadgeCounts().gold > 0) {
                    <div class="badge-stat gold">
                      <span class="badge-emoji">🥇</span>
                      <span class="badge-count">{{ teamRankingBadgeCounts().gold }}</span>
                      <span class="badge-label">Team Leader</span>
                    </div>
                  }
                  @if (teamRankingBadgeCounts().silver > 0) {
                    <div class="badge-stat silver">
                      <span class="badge-emoji">🥈</span>
                      <span class="badge-count">{{ teamRankingBadgeCounts().silver }}</span>
                      <span class="badge-label">2nd Place</span>
                    </div>
                  }
                  @if (teamRankingBadgeCounts().bronze > 0) {
                    <div class="badge-stat bronze">
                      <span class="badge-emoji">🥉</span>
                      <span class="badge-count">{{ teamRankingBadgeCounts().bronze }}</span>
                      <span class="badge-label">3rd Place</span>
                    </div>
                  }
                </div>
                <div class="badges-list">
                  @for (achievement of teamPerformanceAchievements().slice(0, 4); track achievement.id) {
                    <div class="badge-item" [class]="achievement.tier">
                      <span class="badge-rank">{{ getRankEmoji(achievement.rank) }}</span>
                      <span class="badge-metric">{{ achievement.metricLabel }}</span>
                      <span class="badge-value">{{ achievement.valueFormatted }}</span>
                    </div>
                  }
                </div>
              </div>
            </p-card>
          }

          <!-- Charts Grid -->
          <div class="charts-grid">
            <!-- Performance Trends Chart -->
            @defer (on idle) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Load vs Performance</h3>
                      <p class="chart-subtitle">
                        Acute/Chronic Workload vs Subjective Wellness
                      </p>
                    </div>
                    @if (performanceChartData()) {
                      <div class="chart-actions">
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-refresh"
                          (clicked)="resetChartZoom('performance')"
                          >Reset zoom</app-button
                        >
                        <app-icon-button
                          icon="pi-download"
                          variant="outlined"
                          size="sm"
                          (clicked)="exportChart('performance')"
                          ariaLabel="Download performance chart"
                          tooltip="Download"
                        />
                      </div>
                    }
                  </div>
                </ng-template>
                @if (performanceChartData()) {
                  <div class="chart-container">
                    <app-lazy-chart
                      type="line"
                      [data]="performanceChartData()"
                      [options]="lineChartOptions"
                    ></app-lazy-chart>
                  </div>
                  <div class="chart-insights">
                    <div class="insight-item">
                      <div class="insight-value">
                        {{ acwrData()?.acwr || "0.00" }}
                      </div>
                      <div class="insight-label">Current ACWR</div>
                    </div>
                    <div class="insight-item">
                      <div class="insight-value" [class]="acwrData()?.riskZone">
                        {{ acwrData()?.riskZone || "N/A" | titlecase }}
                      </div>
                      <div class="insight-label">Safety Zone</div>
                    </div>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi {{ noDataMessage.icon }} empty-icon"></i>
                    <h4>{{ noDataMessage.title }}</h4>
                    <p>{{ noDataMessage.reason }}</p>
                    <app-icon-button
                      icon="pi-bolt"
                      routerLink="noDataMessage.helpLink"
                      ariaLabel="Start logging workouts"
                      tooltip="Get started"
                    />
                  </div>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">
                  Loading performance trends...
                </div>
              </p-card>
            }

            <!-- Team Chemistry Chart -->
            @defer (on idle) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Skill Proficiency Radar</h3>
                      <p class="chart-subtitle">
                        Comparative assessment across core competencies
                      </p>
                    </div>
                  </div>
                </ng-template>
                @if (chemistryChartData()) {
                  <div class="chart-container radar">
                    <app-lazy-chart
                      type="radar"
                      [data]="chemistryChartData()"
                      [options]="radarChartOptions"
                    ></app-lazy-chart>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi pi-users empty-icon"></i>
                    <h4>Proficiency Data Coming Soon</h4>
                    <p>
                      Log more varied training sessions to populate your skill
                      proficiency radar.
                    </p>
                  </div>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">
                  Loading skill proficiency...
                </div>
              </p-card>
            }

            <!-- Training Distribution Chart -->
            @defer (on idle) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Training Mix</h3>
                      <p class="chart-subtitle">
                        Distribution of focus areas over 30 days
                      </p>
                    </div>
                  </div>
                </ng-template>
                @if (distributionChartData()) {
                  <div class="chart-container doughnut">
                    <app-lazy-chart
                      type="doughnut"
                      [data]="distributionChartData()"
                      [options]="DOUGHNUT_CHART_OPTIONS"
                    ></app-lazy-chart>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi {{ noDataMessage.icon }} empty-icon"></i>
                    <h4>Mix Data Coming Soon</h4>
                    <p>
                      Log your training sessions to see how your time is
                      distributed.
                    </p>
                  </div>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">Loading training mix...</div>
              </p-card>
            }

            <!-- Position Performance Chart -->
            @defer (on idle) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Benchmark Comparison</h3>
                      <p class="chart-subtitle">
                        Your metrics vs Olympic standard benchmarks
                      </p>
                    </div>
                  </div>
                </ng-template>
                @if (positionChartData()) {
                  <div class="chart-container">
                    <app-lazy-chart
                      type="bar"
                      [data]="positionChartData()"
                      [options]="BAR_CHART_OPTIONS"
                    ></app-lazy-chart>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi pi-chart-bar empty-icon"></i>
                    <h4>Benchmarks Coming Soon</h4>
                    <p>
                      Complete your profile and log tests to see comparative
                      analytics.
                    </p>
                  </div>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">Loading benchmarks...</div>
              </p-card>
            }
          </div>

          <!-- Gap Analysis Visualization -->
          @defer (on idle) {
            <p-card class="chart-card full-width gap-analysis-card">
              <ng-template pTemplate="header">
                <div class="chart-header">
                  <div class="title-group">
                    <h3 class="chart-title">Gap Analysis</h3>
                    <p class="chart-subtitle">
                      Your performance vs Olympic benchmarks
                    </p>
                  </div>
                </div>
              </ng-template>
              @if (gapAnalysisData().length > 0) {
                <div class="gap-analysis-content">
                  <div class="gap-legend">
                    <div class="legend-item">
                      <span class="legend-dot your-level"></span>
                      <span>Your Level</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot benchmark"></span>
                      <span>Olympic Benchmark</span>
                    </div>
                  </div>
                  <div class="gap-bars">
                    @for (item of gapAnalysisData(); track item.metric) {
                      <div class="gap-bar-row">
                        <div class="gap-metric-label">
                          <span class="metric-name">{{ item.metric }}</span>
                          <span
                            class="gap-value"
                            [class.positive]="item.gap >= 0"
                            [class.negative]="item.gap < 0"
                          >
                            {{ item.gap >= 0 ? "+" : "" }}{{ item.gap
                            }}{{ item.unit }}
                          </span>
                        </div>
                        <div class="gap-bar-container">
                          <div class="gap-bar-track">
                            <div
                              class="gap-bar-fill your-level"
                              [style.width.%]="
                                (item.current / item.benchmark) * 100
                              "
                            ></div>
                            <div
                              class="benchmark-marker"
                              [style.left.%]="100"
                              pTooltip="Olympic Benchmark: {{
                                item.benchmark
                              }}{{ item.unit }}"
                            ></div>
                          </div>
                          <div class="gap-bar-values">
                            <span class="current-value"
                              >{{ item.current }}{{ item.unit }}</span
                            >
                            <span class="benchmark-value"
                              >{{ item.benchmark }}{{ item.unit }}</span
                            >
                          </div>
                        </div>
                        <div class="gap-status">
                          @if (item.gap >= 0) {
                            <i class="pi pi-check-circle status-achieved"></i>
                          } @else if (item.gap > -10) {
                            <i class="pi pi-minus-circle status-close"></i>
                          } @else {
                            <i class="pi pi-exclamation-circle status-gap"></i>
                          }
                        </div>
                      </div>
                    }
                  </div>
                  <div class="gap-summary">
                    <div class="summary-item">
                      <span class="summary-value">{{
                        gapAnalysisSummary().achieved
                      }}</span>
                      <span class="summary-label">Benchmarks Met</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-value">{{
                        gapAnalysisSummary().close
                      }}</span>
                      <span class="summary-label">Almost There</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-value">{{
                        gapAnalysisSummary().needsWork
                      }}</span>
                      <span class="summary-label">Needs Improvement</span>
                    </div>
                    <div class="summary-item overall">
                      <span class="summary-value"
                        >{{ gapAnalysisSummary().overallScore }}%</span
                      >
                      <span class="summary-label">Overall Score</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="empty-chart-state">
                  <i class="pi pi-chart-bar empty-icon"></i>
                  <h4>Gap Analysis Coming Soon</h4>
                  <p>
                    Complete fitness tests and log training to see how you
                    compare to Olympic benchmarks.
                  </p>
                </div>
              }
            </p-card>
          } @placeholder {
            <p-card class="chart-card full-width">
              <div class="loading-placeholder">Loading gap analysis...</div>
            </p-card>
          }

          <!-- Full Width Charts -->
          <p-card class="chart-card full-width">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Speed Development Progress</h3>
                <div class="chart-controls">
                  <p-select
                    [options]="timePeriods"
                    [(ngModel)]="selectedTimePeriod"
                    placeholder="Time Period"
                    styleClass="w-full md:w-14rem"
                  ></p-select>
                  <p-select
                    [options]="metricOptions"
                    [(ngModel)]="selectedMetric"
                    placeholder="Metrics"
                    styleClass="w-full md:w-14rem"
                  ></p-select>
                </div>
              </div>
            </ng-template>
            @if (speedChartData()) {
              <app-lazy-chart
                type="line"
                [data]="speedChartData()"
                [options]="lineChartOptions"
              ></app-lazy-chart>
              <div class="chart-insights">
                @if (speedInsights()) {
                  <div class="insight-item">
                    <div class="insight-value">{{ speedInsights()!.best40 || 'N/A' }}</div>
                    <div class="insight-label">Best 40-Yard</div>
                  </div>
                  <div class="insight-item">
                    <div class="insight-value">{{ speedInsights()!.best10 || 'N/A' }}</div>
                    <div class="insight-label">Best 10-Yard</div>
                  </div>
                  <div class="insight-item">
                    <div class="insight-value">{{ speedInsights()!.improvement || 'N/A' }}</div>
                    <div class="insight-label">Total Improvement</div>
                  </div>
                  <div class="insight-item">
                    <div class="insight-value">4.40s</div>
                    <div class="insight-label">Olympic Target</div>
                  </div>
                } @else {
                  <div class="insight-item">
                    <div class="insight-value">-</div>
                    <div class="insight-label">No data yet</div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-chart-state">
                <i class="pi pi-bolt empty-icon"></i>
                <h4>No Speed Data Yet</h4>
                <p>Log your sprint times in Performance Tracking to see speed development progress.</p>
                <a routerLink="/performance-tracking" class="empty-state-link">
                  <i class="pi pi-arrow-right"></i> Go to Performance Tracking
                </a>
              </div>
            }
          </p-card>

          <!-- Player Statistics Section -->
          <p-card class="player-stats-card full-width">
            <ng-template pTemplate="header">
              <h3 class="chart-title">Player Statistics & Attendance</h3>
            </ng-template>
            <p-tabs>
              <p-tabpanel header="Per Game Stats">
                <div class="stats-summary">
                  <div class="stat-summary-item">
                    <div class="stat-block__label">Games Played</div>
                    <div class="stat-block__value">
                      {{ playerGameStats().length }}
                    </div>
                  </div>
                  <div class="stat-summary-item">
                    <div class="stat-block__label">Games Missed</div>
                    <div class="stat-block__value error">{{ gamesMissed() }}</div>
                  </div>
                  <div class="stat-summary-item">
                    <div class="stat-block__label">Attendance Rate</div>
                    <div class="stat-block__value">
                      {{ attendanceRate() }}%
                    </div>
                  </div>
                </div>
                <p-table
                  [value]="playerGameStats()"
                  [paginator]="true"
                  [rows]="10"
                  styleClass="p-datatable-sm"
                >
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Date</th>
                      <th>Opponent</th>
                      <th>Status</th>
                      <th>Pass Att</th>
                      <th>Completions</th>
                      <th>Pass Yds</th>
                      <th>Rush Att</th>
                      <th>Rush Yds</th>
                      <th>Flag Pulls</th>
                      <th>Interceptions</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-game>
                    <tr>
                      <td>{{ game.gameDate }}</td>
                      <td>{{ game.opponent }}</td>
                      <td>
                        <app-status-tag
                          [value]="game.present ? 'Present' : 'Missed'"
                          [severity]="game.present ? 'success' : 'danger'"
                          size="sm"
                        />
                      </td>
                      <td>{{ game.passAttempts }}</td>
                      <td>{{ game.completions }}</td>
                      <td>{{ game.passingYards }}</td>
                      <td>{{ game.rushingAttempts }}</td>
                      <td>{{ game.rushingYards }}</td>
                      <td>{{ game.flagPulls }}</td>
                      <td>{{ game.interceptions }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <p-tabpanel header="Season Stats">
                @if (playerSeasonStats()) {
                  <div class="season-stats">
                    <div class="stats-summary">
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Season</div>
                        <div class="stat-block__value">
                          {{ playerSeasonStats()?.season }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Games Played</div>
                        <div class="stat-block__value">
                          {{ playerSeasonStats()?.gamesPlayed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Games Missed</div>
                        <div class="stat-block__value error">
                          {{ playerSeasonStats()?.gamesMissed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Attendance Rate</div>
                        <div class="stat-block__value">
                          {{
                            playerSeasonStats()?.attendanceRate
                              | number: "1.1-1"
                          }}%
                        </div>
                      </div>
                    </div>
                    <div class="stats-grid">
                      <div class="stat-card">
                        <h4>Passing</h4>
                        <div class="stat-row">
                          <span>Attempts:</span>
                          <strong>{{
                            playerSeasonStats()?.totalPassAttempts
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Completions:</span>
                          <strong>{{
                            playerSeasonStats()?.totalCompletions
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Yards:</span>
                          <strong>{{
                            playerSeasonStats()?.totalPassingYards
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Completion %:</span>
                          <strong
                            >{{
                              playerSeasonStats()?.completionPercentage
                                | number: "1.1-1"
                            }}%</strong
                          >
                        </div>
                      </div>
                      <div class="stat-card">
                        <h4>Receiving</h4>
                        <div class="stat-row">
                          <span>Targets:</span>
                          <strong>{{
                            playerSeasonStats()?.totalTargets
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Receptions:</span>
                          <strong>{{
                            playerSeasonStats()?.totalReceptions
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Yards:</span>
                          <strong>{{
                            playerSeasonStats()?.totalReceivingYards
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Drops:</span>
                          <strong>{{ playerSeasonStats()?.totalDrops }}</strong>
                        </div>
                      </div>
                      <div class="stat-card">
                        <h4>Rushing</h4>
                        <div class="stat-row">
                          <span>Attempts:</span>
                          <strong>{{
                            playerSeasonStats()?.totalRushingAttempts
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Yards:</span>
                          <strong>{{
                            playerSeasonStats()?.totalRushingYards
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Avg Yards:</span>
                          <strong>{{
                            playerSeasonStats()?.avgRushingYards
                              | number: "1.1-1"
                          }}</strong>
                        </div>
                      </div>
                      <div class="stat-card">
                        <h4>Defense</h4>
                        <div class="stat-row">
                          <span>Flag Pull Attempts:</span>
                          <strong>{{
                            playerSeasonStats()?.totalFlagPullAttempts
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Flag Pulls:</span>
                          <strong>{{
                            playerSeasonStats()?.totalFlagPulls
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Success Rate:</span>
                          <strong
                            >{{
                              playerSeasonStats()?.flagPullSuccessRate
                                | number: "1.1-1"
                            }}%</strong
                          >
                        </div>
                        <div class="stat-row">
                          <span>Interceptions:</span>
                          <strong>{{
                            playerSeasonStats()?.totalInterceptionsDef
                          }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </p-tabpanel>

              <p-tabpanel header="Multi-Season Stats">
                @if (playerMultiSeasonStats()) {
                  <div class="multi-season-stats">
                    <div class="stats-summary">
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Total Seasons</div>
                        <div class="stat-block__value">
                          {{ playerMultiSeasonStats()?.totalSeasons }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Total Games Played</div>
                        <div class="stat-block__value">
                          {{ playerMultiSeasonStats()?.totalGamesPlayed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Total Games Missed</div>
                        <div class="stat-block__value error">
                          {{ playerMultiSeasonStats()?.totalGamesMissed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-block__label">Overall Attendance</div>
                        <div class="stat-block__value">
                          {{
                            playerMultiSeasonStats()?.overallAttendanceRate
                              | number: "1.1-1"
                          }}%
                        </div>
                      </div>
                    </div>
                    <h4>Career Totals</h4>
                    <div class="stats-grid">
                      <div class="stat-card">
                        <h5>Passing</h5>
                        <div class="stat-row">
                          <span>Career Attempts:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerPassAttempts
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Career Yards:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerPassingYards
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Career TDs:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerTouchdowns
                          }}</strong>
                        </div>
                      </div>
                      <div class="stat-card">
                        <h5>Receiving</h5>
                        <div class="stat-row">
                          <span>Career Receptions:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerReceptions
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Career Yards:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerReceivingYards
                          }}</strong>
                        </div>
                      </div>
                      <div class="stat-card">
                        <h5>Rushing</h5>
                        <div class="stat-row">
                          <span>Career Attempts:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerRushingAttempts
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Career Yards:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerRushingYards
                          }}</strong>
                        </div>
                      </div>
                      <div class="stat-card">
                        <h5>Defense</h5>
                        <div class="stat-row">
                          <span>Career Flag Pulls:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerFlagPulls
                          }}</strong>
                        </div>
                        <div class="stat-row">
                          <span>Career Interceptions:</span>
                          <strong>{{
                            playerMultiSeasonStats()?.careerInterceptionsDef
                          }}</strong>
                        </div>
                      </div>
                    </div>
                    <h4>Season Breakdown</h4>
                    <p-table
                      [value]="playerMultiSeasonStats()?.seasons || []"
                      [paginator]="true"
                      [rows]="5"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th>Season</th>
                          <th>Games Played</th>
                          <th>Games Missed</th>
                          <th>Attendance Rate</th>
                          <th>Total Yards</th>
                          <th>Total TDs</th>
                        </tr>
                      </ng-template>
                      <ng-template pTemplate="body" let-season>
                        <tr>
                          <td>{{ season.season }}</td>
                          <td>{{ season.gamesPlayed }}</td>
                          <td>{{ season.gamesMissed }}</td>
                          <td>
                            {{ season.attendanceRate | number: "1.1-1" }}%
                          </td>
                          <td>
                            {{
                              season.totalPassingYards +
                                season.totalReceivingYards +
                                season.totalRushingYards
                            }}
                          </td>
                          <td>{{ season.totalTouchdowns }}</td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                }
              </p-tabpanel>
            </p-tabs>
          </p-card>
        </div>

        <!-- Share with Coach Dialog -->
        <p-dialog
          [(visible)]="showShareDialogValue"
          [modal]="true"
          [closable]="true"
          header="Share Analytics with Coach"
          styleClass="share-dialog"
          [style]="{ width: '500px' }"
        >
          <div class="share-content">
            <p class="share-intro">
              Send your analytics report to your coach for review and feedback.
            </p>

            <div class="share-options">
              <h4>Include in Report</h4>
              <div class="option-item">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="shareOptions.includeCharts"
                  />
                  <span>Performance Charts</span>
                </label>
              </div>
              <div class="option-item">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="shareOptions.includeGoals"
                  />
                  <span>Development Goals</span>
                </label>
              </div>
              <div class="option-item">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="shareOptions.includeStats"
                  />
                  <span>Player Statistics</span>
                </label>
              </div>
              <div class="option-item">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="shareOptions.includeComments"
                  />
                  <span>Include My Notes</span>
                </label>
              </div>
            </div>

            @if (shareOptions.includeComments) {
              <div class="message-section">
                <label for="shareMessage">Add a message (optional)</label>
                <textarea
                  id="shareMessage"
                  [(ngModel)]="shareMessageValue"
                  placeholder="Any comments or questions for your coach..."
                  rows="3"
                ></textarea>
              </div>
            }
          </div>

          <ng-template pTemplate="footer">
            <app-button variant="text" (clicked)="showShareDialog.set(false)"
              >Cancel</app-button
            >
            <app-button
              icon="send"
              [loading]="isSharing()"
              (clicked)="shareWithCoach()"
              >Send to Coach</app-button
            >
          </ng-template>
        </p-dialog>
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrls: ["./analytics.component.scss"],
})
export class AnalyticsComponent implements AfterViewInit {
  // Angular 21: Use viewChildren() signal instead of @ViewChildren()
  chartRefs = viewChildren<UIChart>(UIChart);
  private readonly apiService = inject(ApiService);
  private readonly playerStatsService = inject(PlayerStatisticsService);
  private readonly authService = inject(AuthService);
  private readonly trainingStatsService = inject(
    TrainingStatsCalculationService,
  );
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly logger = inject(LoggerService);
  private readonly acwrService = inject(AcwrService);
  private readonly toastService = inject(ToastService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly teamRankingService = inject(TeamPerformanceRankingService);

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(true);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>(
    "Something went wrong while loading analytics. Please try again.",
  );

  // Centralized UX copy for data states
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  // Expose UI_LIMITS for template usage
  readonly UI_LIMITS = UI_LIMITS;

  // Team performance achievements (compare against teammates)
  readonly teamPerformanceAchievements = computed(() =>
    this.teamRankingService.achievements(),
  );
  readonly teamRankingBadgeCounts = computed(() => ({
    gold: this.teamRankingService.goldBadges().length,
    silver: this.teamRankingService.silverBadges().length,
    bronze: this.teamRankingService.bronzeBadges().length,
  }));

  metrics = signal<Metric[]>([]);
  developmentGoals = signal<DevelopmentGoal[]>([]);
  performanceChartData = signal<Record<string, unknown> | null>(null);
  chemistryChartData = signal<Record<string, unknown> | null>(null);
  distributionChartData = signal<Record<string, unknown> | null>(null);
  positionChartData = signal<Record<string, unknown> | null>(null);
  speedChartData = signal<Record<string, unknown> | null>(null);

  // Player statistics
  playerGameStats = signal<PlayerGameStats[]>([]);
  playerSeasonStats = signal<PlayerSeasonStats | null>(null);
  playerMultiSeasonStats = signal<PlayerMultiSeasonStats | null>(null);

  // Training statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trainingStats = signal<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acwrData = signal<any>(null);

  // Gap Analysis data
  gapAnalysisData = signal<
    Array<{
      metric: string;
      current: number;
      benchmark: number;
      gap: number;
      unit: string;
    }>
  >([]);

  gapAnalysisSummary = signal<{
    achieved: number;
    close: number;
    needsWork: number;
    overallScore: number;
  }>({ achieved: 0, close: 0, needsWork: 0, overallScore: 0 });

  // Speed insights - loaded from real performance data, NOT hardcoded
  speedInsights = signal<{
    best40: string | null;
    best10: string | null;
    improvement: string | null;
  } | null>(null);

  selectedTimePeriod: string = "Last 7 Weeks";
  selectedMetric: string = "40-Yard & 10-Yard";

  timePeriods = ["Last 7 Weeks", "Last 30 Days", "Season Progress"];
  metricOptions = [
    "40-Yard & 10-Yard",
    "All Sprint Distances",
    "Agility Tests",
  ];

  // Share with Coach
  showShareDialog = signal(false);
  isSharing = signal(false);
  shareMessage = signal("");
  shareOptions = {
    includeCharts: true,
    includeGoals: true,
    includeStats: true,
    includeComments: true,
  };

  // Getters/setters for two-way binding in template
  get showShareDialogValue(): boolean {
    return this.showShareDialog();
  }
  set showShareDialogValue(value: boolean) {
    this.showShareDialog.set(value);
  }
  get shareMessageValue(): string {
    return this.shareMessage();
  }
  set shareMessageValue(value: string) {
    this.shareMessage.set(value);
  }

  // Enhanced chart options with zoom, pan, custom tooltips
  readonly lineChartOptions = ENHANCED_LINE_CHART_OPTIONS;
  readonly BAR_CHART_OPTIONS = ENHANCED_BAR_CHART_OPTIONS;
  readonly radarChartOptions = ENHANCED_RADAR_CHART_OPTIONS;

  // Responsive doughnut chart options - legend position based on screen width
  get DOUGHNUT_CHART_OPTIONS() {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    return {
      ...ENHANCED_DOUGHNUT_CHART_OPTIONS,
      plugins: {
        ...ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins,
        legend: {
          ...ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins?.legend,
          position: isMobile ? "bottom" : ("right" as const),
        },
      },
    };
  }

  // Chart instances map for export/zoom functionality
  private chartInstances = new Map<string, UIChart>();

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializePage();
  }

  ngAfterViewInit(): void {
    // Store chart instances for export/zoom functionality
    // Use setTimeout to ensure PrimeNG charts are fully initialized
    setTimeout(() => {
      // Guard: ensure chartRefs signal exists and is callable
      // This prevents errors in test environments where component may be destroyed
      if (!this.chartRefs || typeof this.chartRefs !== "function") {
        return;
      }
      this.chartRefs().forEach((chartRef, index) => {
        // Defensive guard: ensure chart ref and internal Chart.js instance exist
        // This prevents "t.clear is not a function" errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chartInstance = (chartRef as any)?.chart;
        if (chartInstance && typeof chartInstance.update === "function") {
          // Map chart instances by type
          const chartTypes = [
            "performance",
            "chemistry",
            "distribution",
            "position",
            "speed",
          ];
          if (chartTypes[index]) {
            this.chartInstances.set(chartTypes[index], chartInstance);
          }
        }
      });
    }, TIMEOUTS.UI_TRANSITION_DELAY);
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.chartInstances.forEach((chart) => {
      // Defensive guard: ensure chart exists and has the internal Chart.js instance
      // This prevents "t.clear is not a function" when PrimeNG chart isn't fully initialized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (chart as any)?.chart;
      if (instance && typeof instance.update === "function") {
        updateChartFontSizes(instance);
      }
    });
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    try {
      this.loadAnalyticsData();
      this.loadPlayerStatistics();
      this.loadTrainingStatistics();
      this.loadDevelopmentGoals();
      this.loadGapAnalysis();
      this.loadSpeedInsightsFromRealData();
      this.loadTeamRankings();

      // Set loading to false after initial data load starts
      setTimeout(
        () => this.isPageLoading.set(false),
        TIMEOUTS.UI_TRANSITION_DELAY,
      );
    } catch (error) {
      this.isPageLoading.set(false);
      this.hasPageError.set(true);
      this.logger.error("[Analytics] Init error:", error);
      this.pageErrorMessage.set(
        "Failed to initialize analytics. Please try again.",
      );
    }
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
  }

  loadTrainingStatistics(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    // Load comprehensive training stats
    this.trainingStatsService.getTrainingStats().subscribe({
      next: (stats) => {
        this.trainingStats.set(stats);

        // Update metrics with training data
        const currentMetrics = this.metrics();
        const updatedMetrics = currentMetrics.map((metric) => {
          if (metric.label === "Training Sessions") {
            return {
              ...metric,
              value: stats.totalSessions.toString(),
              trend: `+${(stats as { sessionsThisWeek?: number }).sessionsThisWeek || 0} this week`,
              trendType:
                ((stats as { sessionsThisWeek?: number }).sessionsThisWeek ||
                  0) > 0
                  ? ("positive" as const)
                  : ("neutral" as const),
            };
          }
          return metric;
        });
        this.metrics.set(updatedMetrics);

        // Update distribution chart with real data
        if (stats.sessionsByType) {
          const labels = Object.keys(stats.sessionsByType);
          const values = labels.map((key) => stats.sessionsByType[key].count);
          this.distributionChartData.set({
            labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [
              {
                data: values,
                backgroundColor: COLORS.CHART.slice(
                  0,
                  UI_LIMITS.CHART_COLORS_COUNT,
                ),
                borderWidth: 0,
                hoverOffset: 10,
              },
            ],
          });
        }
      },
      error: (error) => {
        this.logger.error("Error loading training statistics:", error);
      },
    });

    // Load ACWR data from canonical AcwrService (single source of truth)
    const acwrData = this.acwrService.acwrData();
    if (acwrData.ratio > 0) {
      this.acwrData.set({
        acwr: acwrData.ratio,
        acuteLoad: acwrData.acute,
        chronicLoad: acwrData.chronic,
        acuteDays: 7,
        chronicDays: 28,
        riskZone: acwrData.riskZone.level,
        message: acwrData.riskZone.description,
      });
    }
  }

  loadPlayerStatistics(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    // Load all games for current player
    this.playerStatsService.getPlayerAllGames(currentUser.id).subscribe({
      next: (games) => {
        this.playerGameStats.set(games);
      },
      error: (error) => {
        this.logger.error("Error loading player game stats:", error);
      },
    });

    // Load current season stats
    const currentSeason = new Date().getFullYear().toString();
    this.playerStatsService
      .getPlayerSeasonStats(currentUser.id, currentSeason)
      .subscribe({
        next: (stats) => {
          this.playerSeasonStats.set(stats);
        },
        error: (error) => {
          this.logger.error("Error loading season stats:", error);
        },
      });

    // Load multi-season stats
    this.playerStatsService
      .getPlayerMultiSeasonStats(currentUser.id)
      .subscribe({
        next: (stats) => {
          this.playerMultiSeasonStats.set(stats);
        },
        error: (error) => {
          this.logger.error("Error loading multi-season stats:", error);
        },
      });
  }

  gamesMissed(): number {
    return this.playerGameStats().filter((g) => !g.present).length;
  }

  attendanceRate(): number {
    const total = this.playerGameStats().length;
    if (total === 0) return 0;
    const played = this.playerGameStats().filter((g) => g.present).length;
    return Math.round((played / total) * 100);
  }

  loadAnalyticsData(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) {
      this.loadFallbackData();
      return;
    }

    // Load analytics summary for metrics
    this.apiService
      .get(API_ENDPOINTS.analytics.summary, { userId: currentUser.id })
      .subscribe({
        next: (response) => {
          if (
            response.success &&
            (response.data as { metrics?: Metric[] })?.metrics
          ) {
            this.metrics.set((response.data as { metrics: Metric[] }).metrics);
          } else {
            this.loadFallbackMetrics();
          }
        },
        error: () => {
          this.loadFallbackMetrics();
        },
      });

    // Load performance trends
    this.apiService
      .get(API_ENDPOINTS.analytics.performanceTrends, {
        userId: currentUser.id,
        weeks: 7,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.performanceChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Performance Score",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  borderColor: "var(--ds-primary-green)",
                  backgroundColor: "var(--ds-primary-green-subtle)",
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                },
              ],
            });
          } else {
            this.loadFallbackPerformanceChart();
          }
        },
        error: () => {
          this.loadFallbackPerformanceChart();
        },
      });

    // Load team chemistry
    this.apiService
      .get(API_ENDPOINTS.analytics.teamChemistry, { userId: currentUser.id })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.chemistryChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Team Chemistry",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  borderColor: "var(--ds-primary-green)",
                  backgroundColor: "rgba(16, 201, 107, 0.2)", // Using rgba for specific opacity
                  borderWidth: 2,
                },
              ],
            });
          } else {
            this.loadFallbackChemistryChart();
          }
        },
        error: () => {
          this.loadFallbackChemistryChart();
        },
      });

    // Load training distribution
    this.apiService
      .get(API_ENDPOINTS.analytics.trainingDistribution, {
        userId: currentUser.id,
        period: "30days",
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.distributionChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  backgroundColor: COLORS.CHART.slice(
                    0,
                    UI_LIMITS.CHART_COLORS_COUNT,
                  ),
                },
              ],
            });
          } else {
            this.loadFallbackDistributionChart();
          }
        },
        error: () => {
          this.loadFallbackDistributionChart();
        },
      });

    // Load position performance
    this.apiService
      .get(API_ENDPOINTS.analytics.positionPerformance, {
        userId: currentUser.id,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.positionChartData.set({
              labels: (response.data as { labels: string[]; values: number[] })
                .labels,
              datasets: [
                {
                  label: "Performance",
                  data: (
                    response.data as { labels: string[]; values: number[] }
                  ).values,
                  backgroundColor: "var(--ds-primary-green)",
                },
              ],
            });
          } else {
            this.loadFallbackPositionChart();
          }
        },
        error: () => {
          this.loadFallbackPositionChart();
        },
      });

    // Load speed development
    this.apiService
      .get(API_ENDPOINTS.analytics.speedDevelopment, {
        userId: currentUser.id,
        weeks: 7,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const speedData = response.data as {
              labels: string[];
              datasets: Array<{
                label: string;
                data: number[];
                borderColor?: string;
                backgroundColor?: string;
                tension?: number;
              }>;
            };
            // Guard against undefined datasets
            if (
              speedData.labels &&
              speedData.datasets &&
              Array.isArray(speedData.datasets)
            ) {
              this.speedChartData.set({
                labels: speedData.labels,
                datasets: speedData.datasets.map((ds) => ({
                  ...ds,
                  borderColor: ds.label.includes("40")
                    ? "var(--ds-primary-green)"
                    : COLORS.PRIMARY_LIGHT,
                  backgroundColor: ds.label.includes("40")
                    ? "var(--ds-primary-green-subtle)"
                    : "rgba(16, 201, 107, 0.1)",
                })),
              });
            } else {
              this.loadFallbackSpeedChart();
            }
          } else {
            this.loadFallbackSpeedChart();
          }
        },
        error: () => {
          this.loadFallbackSpeedChart();
        },
      });
  }

  loadFallbackData(): void {
    this.loadEmptyMetrics();
    // Set charts to null to show empty states
    this.performanceChartData.set(null);
    this.chemistryChartData.set(null);
    this.distributionChartData.set(null);
    this.positionChartData.set(null);
    this.speedChartData.set(null);
  }

  loadEmptyMetrics(): void {
    this.metrics.set([
      {
        icon: "pi-chart-line",
        value: "N/A",
        label: "Training Load",
        trend: "ACWR focus",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-users",
        value: "N/A",
        label: "Team Rank",
        trend: "Join a team",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-bolt",
        value: "N/A",
        label: "Top Speed",
        trend: "Record test",
        trendType: "neutral" as const,
      },
      {
        icon: "pi-calendar",
        value: "0",
        label: "Training Sessions",
        trend: "Start today",
        trendType: "positive" as const,
      },
    ]);
  }

  loadFallbackMetrics(): void {
    this.loadEmptyMetrics();
  }

  loadFallbackPerformanceChart(): void {
    // Return null to show empty state
    this.performanceChartData.set(null);
  }

  loadFallbackChemistryChart(): void {
    // Return null to show empty state
    this.chemistryChartData.set(null);
  }

  loadFallbackDistributionChart(): void {
    // Return null to show empty state
    this.distributionChartData.set(null);
  }

  loadFallbackPositionChart(): void {
    // Return null to show empty state
    this.positionChartData.set(null);
  }

  loadFallbackSpeedChart(): void {
    // Return null to show empty state
    this.speedChartData.set(null);
  }

  trackByMetricLabel(index: number, metric: Metric): string {
    return metric.label;
  }

  // Chart action methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getChartInstance(chartType: string): any {
    const chart = this.chartInstances.get(chartType);
    if (!chart) {
      this.logger.error(`Chart instance not found: ${chartType}`);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (chart as any).chart || null;
  }

  exportChart(chartType: string): void {
    const chartInstance = this.getChartInstance(chartType);
    if (!chartInstance) return;

    try {
      exportChartAsPNG(chartInstance, `${chartType}-analytics`);
      this.logger.info(`Chart exported: ${chartType}`);
    } catch (error) {
      this.logger.error(`Export failed: ${chartType}`, error);
    }
  }

  resetChartZoom(chartType: string): void {
    const chartInstance = this.getChartInstance(chartType);
    if (!chartInstance) return;

    try {
      resetChartZoom(chartInstance);
      this.logger.info(`Zoom reset: ${chartType}`);
    } catch (error) {
      this.logger.error(`Reset failed: ${chartType}`, error);
    }
  }

  customizeChart(chartType: string): void {
    this.logger.info(`Customizing ${chartType} chart`);

    // Chart interaction instructions
    const instructions = `Chart Interactions Available:

🔍 Zoom:
  • Scroll with mouse wheel to zoom in/out
  • Pinch on touch devices

↔️ Pan:
  • Hold Shift + drag to pan left/right

👁️ Legend:
  • Click legend items to show/hide datasets

🖱️ Details:
  • Click on data points to view details

📊 Export:
  • Click "Export" button to download as PNG

🔄 Reset:
  • Click "Reset Zoom" to restore original view

💡 Tip: Hover over data points to see trend information!`;

    alert(instructions);
  }

  viewChartDetails(chartType: string): void {
    this.logger.info(`Viewing details for ${chartType}`);
    // Navigate to enhanced analytics with the specific chart focus
    window.location.href = `/analytics/enhanced?focus=${chartType}`;
  }

  showImprovementTips(area: string): void {
    const tips: Record<string, string> = {
      chemistry:
        "Focus on team communication drills, trust-building exercises, and collaborative training sessions.",
      performance:
        "Track your progress consistently, set incremental goals, and ensure adequate recovery.",
      speed:
        "Incorporate interval training, plyometrics, and proper warm-up routines.",
    };
    alert(
      tips[area] || "Continue consistent training and track your progress.",
    );
  }

  filterTrainingData(): void {
    this.logger.info("Opening training data filter");
    // For now, show available filter options
    alert(
      "Filter options: Last 7 days, Last 30 days, Last 90 days, Season. Use the dropdown selectors to filter data.",
    );
  }

  showBenchmarks(): void {
    this.logger.info("Showing position benchmarks");
    alert(
      "Position Benchmarks:\n\nQB: 4.5s 40-yard, 85% completion rate\nWR: 4.4s 40-yard, 90% catch rate\nRB: 4.6s 40-yard, 5+ YPC\nDB: 4.5s 40-yard, 3+ flag pulls/game",
    );
  }

  showOptimizationTips(): void {
    this.logger.info("Showing optimization tips");
    alert(
      "Optimization Tips:\n\n1. Focus on your weakest metrics\n2. Increase training frequency gradually\n3. Track rest and recovery\n4. Review game film weekly\n5. Work with position-specific drills",
    );
  }

  private getChartDataForExport(chartType: string): unknown {
    switch (chartType) {
      case "performance":
        return this.performanceChartData();
      case "chemistry":
        return this.chemistryChartData();
      case "distribution":
        return this.distributionChartData();
      case "position":
        return this.positionChartData();
      case "speed":
        return this.speedChartData();
      default:
        return { error: "Unknown chart type" };
    }
  }

  /**
   * Get icon class for goal metric type
   */
  getGoalIcon(metricType: DevelopmentGoal["metricType"]): string {
    const icons: Record<string, string> = {
      speed: "pi pi-bolt",
      agility: "pi pi-arrows-alt",
      strength: "pi pi-heart-fill",
      power: "pi pi-lightning",
      skill: "pi pi-star",
    };
    return icons[metricType] || "pi pi-bullseye";
  }

  /**
   * Calculate goal progress percentage
   */
  calculateGoalProgress(goal: DevelopmentGoal): number {
    const startValue = goal.startValue || goal.currentValue * 1.1;
    const improvement = startValue - goal.currentValue;
    const totalNeeded = startValue - goal.targetValue;
    if (totalNeeded === 0) return 100;
    return Math.min(
      100,
      Math.max(0, Math.round((improvement / totalNeeded) * 100)),
    );
  }

  /**
   * Get days remaining until goal deadline
   */
  getDaysRemaining(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Load development goals from API
   */
  private loadDevelopmentGoals(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) return;

    this.apiService
      .get(API_ENDPOINTS.analytics.summary, {
        type: "goals",
        userId: currentUser.id,
      })
      .subscribe({
        next: (response) => {
          const data = response.data as
            | {
                goals?: {
                  id: string;
                  title: string;
                  progress: number;
                  deadline: string;
                }[];
              }
            | undefined;
          if (response.success && Array.isArray(data?.goals)) {
            const goals = data.goals.map((g) => ({
              ...g,
              deadline: new Date(g.deadline),
            }));
            this.developmentGoals.set(goals as unknown as DevelopmentGoal[]);
          } else {
            // Set empty array if no goals
            this.developmentGoals.set([]);
          }
        },
        error: () => {
          // Fallback to empty goals
          this.developmentGoals.set([]);
        },
      });
  }

  // ============================================================================
  // SHARE WITH COACH
  // ============================================================================

  /**
   * Share analytics report with coach
   */
  async shareWithCoach(): Promise<void> {
    this.isSharing.set(true);

    try {
      const currentUser = this.authService.getUser();
      if (!currentUser?.id) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      // Build the report data
      const reportData = {
        playerId: currentUser.id,
        playerName: currentUser.name || currentUser.email,
        reportDate: new Date().toISOString(),
        message: this.shareMessage(),
        includedSections: {
          charts: this.shareOptions.includeCharts,
          goals: this.shareOptions.includeGoals,
          stats: this.shareOptions.includeStats,
          comments: this.shareOptions.includeComments,
        },
        // Include actual data based on options
        metrics: this.shareOptions.includeCharts ? this.metrics() : [],
        goals: this.shareOptions.includeGoals ? this.developmentGoals() : [],
        seasonStats: this.shareOptions.includeStats
          ? this.playerSeasonStats()
          : null,
        acwr: this.acwrData(),
      };

      // Send to coach via API
      this.apiService
        .post(API_ENDPOINTS.analytics.summary, {
          action: "share_with_coach",
          ...reportData,
        })
        .subscribe({
          next: (_response) => {
            this.isSharing.set(false);
            this.showShareDialog.set(false);
            this.shareMessage.set("");
            this.toastService.success(
              "Analytics report sent to your coach!",
            );
          },
          error: (error) => {
            this.isSharing.set(false);
            this.logger.error("Error sharing with coach:", error);
            // UX AUDIT FIX: Show actual error instead of false success
            this.toastService.error(TOAST.ERROR.ANALYTICS_SHARE_FAILED);
          },
        });
    } catch (error) {
      this.isSharing.set(false);
      this.logger.error("Error sharing analytics:", error);
      this.toastService.error(TOAST.ERROR.ANALYTICS_SHARE_FAILED);
    }
  }

  /**
   * Export analytics as PDF
   */
  exportAnalyticsPDF(): void {
    this.logger.info("Exporting analytics as PDF");

    try {
      const currentUser = this.authService.getUser();
      const playerName = currentUser?.name || currentUser?.email || "Player";
      const dateStr = new Date().toISOString().split("T")[0];

      // Build PDF content as HTML (for print-to-PDF)
      const content = this.generatePDFContent(playerName, dateStr);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        this.toastService.error(TOAST.ERROR.ALLOW_POPUPS_FOR_PDF);
        return;
      }

      printWindow.document.write(content);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, TIMEOUTS.UI_TRANSITION_DELAY);
      };

      this.toastService.success(
        "PDF export ready! Use your browser's print dialog to save.",
      );
    } catch (error) {
      this.logger.error("Error exporting PDF:", error);
      this.toastService.error(TOAST.ERROR.PDF_EXPORT_FAILED);
    }
  }

  /**
   * Load gap analysis data comparing player metrics to Olympic benchmarks
   */
  private loadGapAnalysis(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser?.id) {
      this.gapAnalysisData.set([]);
      return;
    }

    // Load from API or use fallback data
    this.apiService
      .get(API_ENDPOINTS.analytics.summary, {
        type: "gap_analysis",
        userId: currentUser.id,
      })
      .subscribe({
        next: (response) => {
          const data = response.data as
            | { gaps?: { area: string; current: number; target: number }[] }
            | undefined;
          if (response.success && Array.isArray(data?.gaps)) {
            // Map API response to expected format
            const mappedGaps = data.gaps.map((g) => ({
              metric: g.area,
              current: g.current,
              benchmark: g.target,
              unit: "",
            }));
            this.processGapAnalysisData(mappedGaps);
          } else {
            // Use sample data for demonstration
            this.loadSampleGapAnalysis();
          }
        },
        error: () => {
          this.loadSampleGapAnalysis();
        },
      });
  }

  /**
   * Show empty state when no gap analysis data is available
   * @description Previously loaded sample/mock data which could mislead athletes
   * about their actual performance. Now shows empty state to encourage real data entry.
   */
  private loadSampleGapAnalysis(): void {
    // NO-OP: Mock data removed to ensure calculation integrity
    // Athletes should see their real performance data only
    // Empty state encourages them to complete fitness tests
    this.gapAnalysisData.set([]);
    this.gapAnalysisSummary.set({
      achieved: 0,
      close: 0,
      needsWork: 0,
      overallScore: 0,
    });
    this.logger.info(
      "[Analytics] Gap analysis showing empty state - no mock data",
    );
  }

  /**
   * Load speed insights from real performance records
   * NO MOCK DATA - shows null when no data exists
   */
  private async loadSpeedInsightsFromRealData(): Promise<void> {
    const user = this.supabaseService.getCurrentUser();
    if (!user) {
      this.speedInsights.set(null);
      this.speedChartData.set(null);
      return;
    }

    try {
      // Fetch performance records from Supabase
      const { data: records, error } = await this.supabaseService.client
        .from("performance_records")
        .select("dash_40, sprint_10m, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (error || !records || records.length === 0) {
        this.logger.info("[Analytics] No performance records found for speed insights");
        this.speedInsights.set(null);
        this.speedChartData.set(null);
        return;
      }

      // Calculate best times from real data
      const dash40Times = records
        .map((r) => r.dash_40)
        .filter((t): t is number => t !== null && t > 0);
      const sprint10Times = records
        .map((r) => r.sprint_10m)
        .filter((t): t is number => t !== null && t > 0);

      const best40 = dash40Times.length > 0 ? Math.min(...dash40Times) : null;
      const best10 = sprint10Times.length > 0 ? Math.min(...sprint10Times) : null;

      // Calculate improvement (first vs best for 40-yard)
      let improvement: string | null = null;
      if (dash40Times.length >= 2) {
        // Get the oldest (first) and best 40-yard times
        const oldest40 = records
          .filter((r) => r.dash_40 !== null && r.dash_40 > 0)
          .slice(-1)[0]?.dash_40;
        if (oldest40 && best40) {
          const diff = oldest40 - best40;
          improvement = diff > 0 ? `-${diff.toFixed(2)}s` : `+${Math.abs(diff).toFixed(2)}s`;
        }
      }

      this.speedInsights.set({
        best40: best40 ? `${best40.toFixed(2)}s` : null,
        best10: best10 ? `${best10.toFixed(2)}s` : null,
        improvement,
      });

      // Build speed chart from real data
      if (records.length >= 2) {
        const chartRecords = records.slice(0, 7).reverse();
        const labels = chartRecords.map((r) =>
          new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        );

        const datasets = [];

        // 40-yard dataset
        const dash40Data = chartRecords.map((r) => r.dash_40 || null);
        if (dash40Data.some((v) => v !== null)) {
          datasets.push({
            label: "40-Yard Dash",
            data: dash40Data,
            borderColor: "var(--ds-primary-green)",
            backgroundColor: "var(--ds-primary-green-subtle)",
            tension: 0.4,
          });
        }

        // 10-yard dataset
        const sprint10Data = chartRecords.map((r) => r.sprint_10m || null);
        if (sprint10Data.some((v) => v !== null)) {
          datasets.push({
            label: "10-Yard Sprint",
            data: sprint10Data,
            borderColor: "rgba(16, 201, 107, 0.6)",
            backgroundColor: "rgba(16, 201, 107, 0.1)",
            tension: 0.4,
          });
        }

        if (datasets.length > 0) {
          this.speedChartData.set({ labels, datasets });
        } else {
          this.speedChartData.set(null);
        }
      } else {
        this.speedChartData.set(null);
      }

      this.logger.info("[Analytics] Speed insights loaded from real data");
    } catch (error) {
      this.logger.error("[Analytics] Error loading speed insights:", error);
      this.speedInsights.set(null);
      this.speedChartData.set(null);
    }
  }

  /**
   * Process gap analysis data and calculate summary
   */
  private processGapAnalysisData(
    data: Array<{
      metric: string;
      current: number;
      benchmark: number;
      unit: string;
    }>,
  ): void {
    const processedData = data.map((item) => {
      // For time-based metrics (lower is better), invert the gap
      const isTimeBased = item.unit === "s";
      const gap = isTimeBased
        ? item.benchmark - item.current // Positive means faster than benchmark
        : item.current - item.benchmark; // Positive means higher than benchmark

      return {
        ...item,
        gap: Number(gap.toFixed(2)),
      };
    });

    this.gapAnalysisData.set(processedData);

    // Calculate summary
    let achieved = 0;
    let close = 0;
    let needsWork = 0;

    processedData.forEach((item) => {
      if (item.gap >= 0) {
        achieved++;
      } else if (item.gap > -10) {
        close++;
      } else {
        needsWork++;
      }
    });

    // Calculate overall score as percentage of benchmarks met or exceeded
    const totalMetrics = processedData.length;
    const overallScore =
      totalMetrics > 0
        ? Math.round(((achieved + close * 0.5) / totalMetrics) * 100)
        : 0;

    this.gapAnalysisSummary.set({
      achieved,
      close,
      needsWork,
      overallScore,
    });
  }

  /**
   * Generate PDF-ready HTML content
   */
  private generatePDFContent(playerName: string, dateStr: string): string {
    const metrics = this.metrics();
    const goals = this.developmentGoals();
    const acwr = this.acwrData();
    const seasonStats = this.playerSeasonStats();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FlagFit Pro Analytics - ${playerName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* ds-exception: PDF export font stack */
            padding: var(--ds-space-10);
            max-width: 800px;
            margin: 0 auto;
            color: #1a1a2e;
          }
          .header {
            text-align: center;
            margin-bottom: var(--ds-space-10);
            padding-bottom: var(--ds-space-5);
            border-bottom: 2px solid #10c96b;
          }
          .header h1 {
            color: #10c96b;
            margin: 0;
            font-size: var(--ds-font-size-1-75rem);
          }
          .header p {
            color: #666;
            margin: calc(var(--ds-space-5) / 2) 0 0;
          }
          .section {
            margin-bottom: var(--ds-space-8);
          }
          .section h2 {
            color: #1a1a2e;
            font-size: var(--ds-font-size-lg);
            border-bottom: 1px solid #eee;
            padding-bottom: var(--ds-space-2);
            margin-bottom: var(--ds-space-4);
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--ds-space-4);
          }
          .metric-card {
            background: var(--surface-secondary);
            padding: var(--ds-space-4);
            border-radius: var(--radius-lg);
            text-align: center;
          }
          .metric-value {
            font-size: var(--ds-font-size-2xl);
            font-weight: var(--ds-font-weight-bold);
            color: var(--ds-primary-green);
          }
          .metric-label {
            color: var(--color-text-secondary);
            font-size: var(--ds-font-size-sm);
          }
          .goal-item {
            background: var(--surface-secondary);
            padding: var(--ds-space-3);
            border-radius: var(--radius-lg);
            margin-bottom: var(--ds-space-2);
          }
          .goal-name {
            font-weight: var(--ds-font-weight-bold);
            color: var(--color-text-primary);
          }
          .goal-progress {
            color: #666;
            font-size: var(--ds-font-size-sm);
          }
          .stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          .stats-table th, .stats-table td {
            padding: var(--ds-space-2) var(--ds-space-3);
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .stats-table th {
            background: #f8f9fa;
            font-weight: var(--ds-font-weight-semibold);
          }
          .footer {
            margin-top: var(--ds-space-10);
            padding-top: var(--ds-space-5);
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: var(--ds-font-size-xs);
          }
          @media print {
            body { padding: var(--ds-space-5); }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏈 FlagFit Pro Analytics Report</h1>
          <p>${playerName} • ${dateStr}</p>
        </div>

        <div class="section">
          <h2>📊 Key Metrics</h2>
          <div class="metrics-grid">
            ${metrics
              .map(
                (m) => `
              <div class="metric-card">
                <div class="metric-value">${m.value}</div>
                <div class="metric-label">${m.label}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        ${
          acwr
            ? `
          <div class="section">
            <h2>⚡ Training Load (ACWR)</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${acwr.acwr}</div>
                <div class="metric-label">Current ACWR</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${acwr.riskZone || "N/A"}</div>
                <div class="metric-label">Risk Zone</div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        ${
          goals.length > 0
            ? `
          <div class="section">
            <h2>🎯 Development Goals</h2>
            ${goals
              .map(
                (g) => `
              <div class="goal-item">
                <div class="goal-name">${g.metricName}</div>
                <div class="goal-progress">
                  Target: ${g.targetValue}${g.targetUnit} • 
                  Current: ${g.currentValue}${g.targetUnit} •
                  Progress: ${this.calculateGoalProgress(g)}%
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          seasonStats
            ? `
          <div class="section">
            <h2>📈 Season Statistics</h2>
            <table class="stats-table">
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Games Played</td><td>${seasonStats.gamesPlayed}</td></tr>
              <tr><td>Attendance Rate</td><td>${seasonStats.attendanceRate?.toFixed(1)}%</td></tr>
              <tr><td>Passing Yards</td><td>${seasonStats.totalPassingYards}</td></tr>
              <tr><td>Completion %</td><td>${seasonStats.completionPercentage?.toFixed(1)}%</td></tr>
              <tr><td>Rushing Yards</td><td>${seasonStats.totalRushingYards}</td></tr>
              <tr><td>Flag Pulls</td><td>${seasonStats.totalFlagPulls}</td></tr>
            </table>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Generated by FlagFit Pro • ${formatDate(new Date(), "PPp")}</p>
          <p>This report is confidential and intended for coaching purposes only.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Load team rankings for comparison badges
   */
  private loadTeamRankings(): void {
    this.teamRankingService.loadTeamRankings();
  }

  /**
   * Get emoji for rank display
   */
  getRankEmoji(rank: number): string {
    return this.teamRankingService.getRankEmoji(rank);
  }
}
