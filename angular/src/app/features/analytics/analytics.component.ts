import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    HostListener,
    QueryList,
    ViewChildren,
    inject,
    signal,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChartModule, UIChart } from "primeng/chart";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabPanel, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
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
import { TrainingDataService } from "../../core/services/training-data.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
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

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

@Component({
  selector: "app-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    Tabs,
    TabPanel,
    Select,
    MainLayoutComponent,
    PageHeaderComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
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
          ></app-page-header>

          <!-- Key Metrics Overview -->
          <div class="metrics-grid">
            @for (
              metric of metrics();
              track trackByMetricLabel($index, metric)
            ) {
              <p-card class="metric-card">
                <div class="metric-icon">
                  <i [class]="'pi ' + metric.icon"></i>
                </div>
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-trend" [class]="'trend-' + metric.trendType">
                  {{ metric.trend }}
                </div>
              </p-card>
            }
          </div>

          <!-- Charts Grid -->
          <div class="charts-grid">
            <!-- Performance Trends Chart -->
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Load vs Performance</h3>
                      <p class="chart-subtitle">Acute/Chronic Workload vs Subjective Wellness</p>
                    </div>
                    @if (performanceChartData()) {
                      <div class="chart-actions">
                        <p-button
                          icon="pi pi-refresh"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          aria-label="Reset zoom"
                          pTooltip="Reset Zoom"
                          (onClick)="resetChartZoom('performance')"
                        ></p-button>
                        <p-button
                          icon="pi pi-download"
                          [outlined]="true"
                          size="small"
                          (onClick)="exportChart('performance')"
                        ></p-button>
                      </div>
                    }
                  </div>
                </ng-template>
                @if (performanceChartData()) {
                  <div class="chart-container">
                    <p-chart
                      type="line"
                      [data]="performanceChartData()"
                      [options]="lineChartOptions"
                    ></p-chart>
                  </div>
                  <div class="chart-insights">
                    <div class="insight-item">
                      <div class="insight-value">{{ acwrData()?.acwr || '0.00' }}</div>
                      <div class="insight-label">Current ACWR</div>
                    </div>
                    <div class="insight-item">
                      <div class="insight-value" [class]="acwrData()?.riskZone">{{ acwrData()?.riskZone || 'N/A' | titlecase }}</div>
                      <div class="insight-label">Safety Zone</div>
                    </div>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi {{ noDataMessage.icon }} empty-icon"></i>
                    <h4>{{ noDataMessage.title }}</h4>
                    <p>{{ noDataMessage.reason }}</p>
                    <p-button
                      [label]="noDataMessage.actionLabel"
                      icon="pi pi-bolt"
                      [routerLink]="noDataMessage.helpLink"
                    ></p-button>
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
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Skill Proficiency Radar</h3>
                      <p class="chart-subtitle">Comparative assessment across core competencies</p>
                    </div>
                  </div>
                </ng-template>
                @if (chemistryChartData()) {
                  <div class="chart-container radar">
                    <p-chart
                      type="radar"
                      [data]="chemistryChartData()"
                      [options]="radarChartOptions"
                    ></p-chart>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi pi-users empty-icon"></i>
                    <h4>Proficiency Data Coming Soon</h4>
                    <p>
                      Log more varied training sessions to populate your skill proficiency radar.
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
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Training Mix</h3>
                      <p class="chart-subtitle">Distribution of focus areas over 30 days</p>
                    </div>
                  </div>
                </ng-template>
                @if (distributionChartData()) {
                  <div class="chart-container doughnut">
                    <p-chart
                      type="doughnut"
                      [data]="distributionChartData()"
                      [options]="DOUGHNUT_CHART_OPTIONS"
                    ></p-chart>
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
                <div class="loading-placeholder">
                  Loading training mix...
                </div>
              </p-card>
            }

            <!-- Position Performance Chart -->
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="chart-header">
                    <div class="title-group">
                      <h3 class="chart-title">Benchmark Comparison</h3>
                      <p class="chart-subtitle">Your metrics vs Olympic standard benchmarks</p>
                    </div>
                  </div>
                </ng-template>
                @if (positionChartData()) {
                  <div class="chart-container">
                    <p-chart
                      type="bar"
                      [data]="positionChartData()"
                      [options]="BAR_CHART_OPTIONS"
                    ></p-chart>
                  </div>
                } @else {
                  <div class="empty-chart-state">
                    <i class="pi pi-chart-bar empty-icon"></i>
                    <h4>Benchmarks Coming Soon</h4>
                    <p>
                      Complete your profile and log tests to see comparative analytics.
                    </p>
                  </div>
                }
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">
                  Loading benchmarks...
                </div>
              </p-card>
            }
          </div>

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
              <p-chart
                type="line"
                [data]="speedChartData()"
                [options]="lineChartOptions"
              ></p-chart>
            }
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">4.46s</div>
                <div class="insight-label">Best 40-Yard</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">1.54s</div>
                <div class="insight-label">Best 10-Yard</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">-0.19s</div>
                <div class="insight-label">Total Improvement</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">4.40s</div>
                <div class="insight-label">Olympic Target</div>
              </div>
            </div>
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
                    <div class="stat-label">Games Played</div>
                    <div class="stat-value">{{ playerGameStats().length }}</div>
                  </div>
                  <div class="stat-summary-item">
                    <div class="stat-label">Games Missed</div>
                    <div class="stat-value error">{{ gamesMissed() }}</div>
                  </div>
                  <div class="stat-summary-item">
                    <div class="stat-label">Attendance Rate</div>
                    <div class="stat-value">{{ attendanceRate() }}%</div>
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
                        <p-tag
                          [value]="game.present ? 'Present' : 'Missed'"
                          [severity]="game.present ? 'success' : 'danger'"
                        >
                        </p-tag>
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
                        <div class="stat-label">Season</div>
                        <div class="stat-value">
                          {{ playerSeasonStats()?.season }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Games Played</div>
                        <div class="stat-value">
                          {{ playerSeasonStats()?.gamesPlayed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Games Missed</div>
                        <div class="stat-value error">
                          {{ playerSeasonStats()?.gamesMissed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Attendance Rate</div>
                        <div class="stat-value">
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
                        <div class="stat-label">Total Seasons</div>
                        <div class="stat-value">
                          {{ playerMultiSeasonStats()?.totalSeasons }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Total Games Played</div>
                        <div class="stat-value">
                          {{ playerMultiSeasonStats()?.totalGamesPlayed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Total Games Missed</div>
                        <div class="stat-value error">
                          {{ playerMultiSeasonStats()?.totalGamesMissed }}
                        </div>
                      </div>
                      <div class="stat-summary-item">
                        <div class="stat-label">Overall Attendance</div>
                        <div class="stat-value">
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
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrls: ["./analytics.component.scss"],
})
export class AnalyticsComponent implements AfterViewInit {
  @ViewChildren(UIChart) chartRefs!: QueryList<UIChart>;
  private readonly apiService = inject(ApiService);
  private readonly playerStatsService = inject(PlayerStatisticsService);
  private readonly authService = inject(AuthService);
  private readonly trainingStatsService = inject(TrainingStatsCalculationService);
  private readonly trainingDataService = inject(TrainingDataService);
  private readonly logger = inject(LoggerService);
  private readonly acwrService = inject(AcwrService);

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(true);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>(
    "Something went wrong while loading analytics. Please try again.",
  );

  // Centralized UX copy for data states
  readonly noDataMessage = DATA_STATE_MESSAGES.NO_DATA;

  metrics = signal<Metric[]>([]);
  performanceChartData = signal<any>(null);
  chemistryChartData = signal<any>(null);
  distributionChartData = signal<any>(null);
  positionChartData = signal<any>(null);
  speedChartData = signal<any>(null);

  // Player statistics
  playerGameStats = signal<PlayerGameStats[]>([]);
  playerSeasonStats = signal<PlayerSeasonStats | null>(null);
  playerMultiSeasonStats = signal<PlayerMultiSeasonStats | null>(null);

  // Training statistics
  trainingStats = signal<any>(null);
  acwrData = signal<any>(null);

  selectedTimePeriod: string = "Last 7 Weeks";
  selectedMetric: string = "40-Yard & 10-Yard";

  timePeriods = ["Last 7 Weeks", "Last 30 Days", "Season Progress"];
  metricOptions = [
    "40-Yard & 10-Yard",
    "All Sprint Distances",
    "Agility Tests",
  ];

  // Enhanced chart options with zoom, pan, custom tooltips
  readonly lineChartOptions = ENHANCED_LINE_CHART_OPTIONS;
  readonly BAR_CHART_OPTIONS = ENHANCED_BAR_CHART_OPTIONS;
  readonly DOUGHNUT_CHART_OPTIONS = ENHANCED_DOUGHNUT_CHART_OPTIONS;
  readonly radarChartOptions = ENHANCED_RADAR_CHART_OPTIONS;

  // Chart instances map for export/zoom functionality
  private chartInstances = new Map<string, any>();

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializePage();
  }

  ngAfterViewInit(): void {
    // Store chart instances for export/zoom functionality
    setTimeout(() => {
      this.chartRefs.forEach((chartRef, index) => {
        if (chartRef.chart) {
          // Map chart instances by type
          const chartTypes = [
            "performance",
            "chemistry",
            "distribution",
            "position",
            "speed",
          ];
          if (chartTypes[index]) {
            this.chartInstances.set(chartTypes[index], chartRef.chart);
          }
        }
      });
    }, 500);
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    // Update font sizes for all charts on resize
    this.chartInstances.forEach((chart) => {
      updateChartFontSizes(chart);
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

      // Set loading to false after initial data load starts
      setTimeout(() => this.isPageLoading.set(false), 500);
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
              trend: `+${stats.sessionsThisWeek || 0} this week`,
              trendType: (stats.sessionsThisWeek || 0) > 0 ? ("positive" as const) : ("neutral" as const),
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
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [
              {
                data: values,
                backgroundColor: [
                  "#089949",
                  "#10c89b",
                  "#f1c40f",
                  "#e74c3c",
                  "#3498db",
                ],
                borderWidth: 0,
                hoverOffset: 10
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
          if (response.success && (response.data as any)?.metrics) {
            this.metrics.set((response.data as any).metrics);
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
              labels: (response.data as any).labels,
              datasets: [
                {
                  label: "Performance Score",
                  data: (response.data as any).values,
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
              labels: (response.data as any).labels,
              datasets: [
                {
                  label: "Team Chemistry",
                  data: (response.data as any).values,
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
              labels: (response.data as any).labels,
              datasets: [
                {
                  data: (response.data as any).values,
                  backgroundColor: [
                    "#089949", // var(--ds-primary-green)
                    "#10c89b", // var(--color-brand-primary-light)
                    "#f1c40f", // var(--color-status-success)
                    "#e74c3c", // var(--color-status-error)
                    "#3498db", // Blue
                  ],
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
              labels: (response.data as any).labels,
              datasets: [
                {
                  label: "Performance",
                  data: (response.data as any).values,
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
            this.speedChartData.set({
              labels: speedData.labels,
              datasets: speedData.datasets.map((ds) => ({
                ...ds,
                borderColor: ds.label.includes("40")
                  ? "var(--ds-primary-green)"
                  : "#10c96b",
                backgroundColor: ds.label.includes("40")
                  ? "var(--ds-primary-green-subtle)"
                  : "rgba(16, 201, 107, 0.1)",
              })),
            });
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
  exportChart(chartType: string): void {
    this.logger.info(`Exporting ${chartType} chart as PNG`);

    const chart = this.chartInstances.get(chartType);

    if (!chart) {
      this.logger.error(`Chart instance not found for type: ${chartType}`);
      return;
    }

    try {
      // Export chart as PNG image
      exportChartAsPNG(chart, `${chartType}-analytics`);
      this.logger.info(`Chart exported successfully: ${chartType}`);
    } catch (error) {
      this.logger.error(`Failed to export chart: ${chartType}`, error);
    }
  }

  resetChartZoom(chartType: string): void {
    this.logger.info(`Resetting zoom for ${chartType} chart`);

    const chart = this.chartInstances.get(chartType);

    if (!chart) {
      this.logger.error(`Chart instance not found for type: ${chartType}`);
      return;
    }

    try {
      resetChartZoom(chart);
      this.logger.info(`Zoom reset successfully: ${chartType}`);
    } catch (error) {
      this.logger.error(`Failed to reset zoom: ${chartType}`, error);
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
    const queryParams = { focus: chartType };
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
}
