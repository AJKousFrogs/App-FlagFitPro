import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { DropdownModule } from "primeng/dropdown";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  DEFAULT_CHART_OPTIONS,
  LINE_CHART_OPTIONS,
  BAR_CHART_OPTIONS,
  DOUGHNUT_CHART_OPTIONS,
} from "../../shared/config/chart.config";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import {
  PlayerStatisticsService,
  PlayerGameStats,
  PlayerSeasonStats,
  PlayerMultiSeasonStats,
} from "../../core/services/player-statistics.service";
import { AuthService } from "../../core/services/auth.service";

interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative";
}

@Component({
  selector: "app-analytics",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    DropdownModule,
    TableModule,
    TabViewModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="analytics-page">
        <app-page-header
          title="FlagFit Pro Analytics"
          subtitle="Advanced Performance Analytics & Team Insights"
          icon="pi-chart-bar"
        ></app-page-header>

        <!-- Key Metrics Overview -->
        <div class="metrics-grid">
          <p-card
            *ngFor="let metric of metrics(); trackBy: trackByMetricLabel"
            class="metric-card"
          >
            <div class="metric-icon">
              <i [class]="'pi ' + metric.icon"></i>
            </div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-trend" [class]="'trend-' + metric.trendType">
              {{ metric.trend }}
            </div>
          </p-card>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <!-- Performance Trends Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Performance Trends</h3>
                <div class="chart-actions">
                  <p-button
                    label="Export"
                    [outlined]="true"
                    size="small"
                  ></p-button>
                  <p-button label="Customize" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart
              *ngIf="performanceChartData()"
              type="line"
              [data]="performanceChartData()"
              [options]="lineChartOptions"
            ></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">91</div>
                <div class="insight-label">Current Score</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">+13</div>
                <div class="insight-label">Total Improvement</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">+5.2%</div>
                <div class="insight-label">Weekly Trend</div>
              </div>
            </div>
          </p-card>

          <!-- Team Chemistry Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Team Chemistry Analysis</h3>
                <div class="chart-actions">
                  <p-button
                    label="Details"
                    [outlined]="true"
                    size="small"
                  ></p-button>
                  <p-button label="Improve" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart
              *ngIf="chemistryChartData()"
              type="radar"
              [data]="chemistryChartData()"
              [options]="radarChartOptions"
            ></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">8.4</div>
                <div class="insight-label">Overall Score</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">9.1</div>
                <div class="insight-label">Trust Level</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">7.5</div>
                <div class="insight-label">Leadership</div>
              </div>
            </div>
          </p-card>

          <!-- Training Distribution Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Training Session Distribution</h3>
                <div class="chart-actions">
                  <p-button
                    label="Filter"
                    [outlined]="true"
                    size="small"
                  ></p-button>
                  <p-button label="Schedule" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart
              *ngIf="distributionChartData()"
              type="doughnut"
              [data]="distributionChartData()"
              [options]="DOUGHNUT_CHART_OPTIONS"
            ></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">30</div>
                <div class="insight-label">Agility Sessions</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">25</div>
                <div class="insight-label">Speed Sessions</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">20</div>
                <div class="insight-label">Technical Sessions</div>
              </div>
            </div>
          </p-card>

          <!-- Position Performance Chart -->
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <div class="chart-header">
                <h3 class="chart-title">Position Performance Comparison</h3>
                <div class="chart-actions">
                  <p-button
                    label="Benchmarks"
                    [outlined]="true"
                    size="small"
                  ></p-button>
                  <p-button label="Optimize" size="small"></p-button>
                </div>
              </div>
            </ng-template>
            <p-chart
              *ngIf="positionChartData()"
              type="bar"
              [data]="positionChartData()"
              [options]="BAR_CHART_OPTIONS"
            ></p-chart>
            <div class="chart-insights">
              <div class="insight-item">
                <div class="insight-value">94</div>
                <div class="insight-label">Lorenzo S. #21</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">91</div>
                <div class="insight-label">Aljosa K. #55</div>
              </div>
              <div class="insight-item">
                <div class="insight-value">89</div>
                <div class="insight-label">Vince M. #10</div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Full Width Charts -->
        <p-card class="chart-card full-width">
          <ng-template pTemplate="header">
            <div class="chart-header">
              <h3 class="chart-title">Speed Development Progress</h3>
              <div class="chart-controls">
                <p-dropdown
                  [options]="timePeriods"
                  [(ngModel)]="selectedTimePeriod"
                  placeholder="Time Period"
                  styleClass="w-full md:w-14rem"
                ></p-dropdown>
                <p-dropdown
                  [options]="metricOptions"
                  [(ngModel)]="selectedMetric"
                  placeholder="Metrics"
                  styleClass="w-full md:w-14rem"
                ></p-dropdown>
              </div>
            </div>
          </ng-template>
          <p-chart
            *ngIf="speedChartData()"
            type="line"
            [data]="speedChartData()"
            [options]="lineChartOptions"
          ></p-chart>
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
          <p-tabView>
            <p-tabPanel header="Per Game Stats">
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
            </p-tabPanel>

            <p-tabPanel header="Season Stats">
              <div *ngIf="playerSeasonStats()" class="season-stats">
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
                        playerSeasonStats()?.attendanceRate | number: "1.1-1"
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
                      <strong>{{ playerSeasonStats()?.totalTargets }}</strong>
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
                        playerSeasonStats()?.avgRushingYards | number: "1.1-1"
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
                      <strong>{{ playerSeasonStats()?.totalFlagPulls }}</strong>
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
            </p-tabPanel>

            <p-tabPanel header="Multi-Season Stats">
              <div *ngIf="playerMultiSeasonStats()" class="multi-season-stats">
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
                      <td>{{ season.attendanceRate | number: "1.1-1" }}%</td>
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
            </p-tabPanel>
          </p-tabView>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .analytics-page {
        padding: var(--space-6);
      }

      .page-header {
        margin-bottom: var(--space-8);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-8);
      }

      .metric-card {
        text-align: center;
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto var(--space-4);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-primary-50);
        color: var(--p-primary-600);
        border-radius: 50%;
        font-size: 1.5rem;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .metric-trend {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .trend-positive {
        color: var(--color-success);
      }

      .trend-negative {
        color: var(--color-warning);
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-6);
      }

      .chart-card {
        min-height: 400px;
      }

      .chart-card.full-width {
        grid-column: 1 / -1;
      }

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .chart-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .chart-actions {
        display: flex;
        gap: var(--space-2);
      }

      .chart-controls {
        display: flex;
        gap: var(--space-3);
      }

      .chart-insights {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .insight-item {
        flex: 1;
        text-align: center;
      }

      .insight-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-1);
      }

      .insight-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }

        .chart-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .chart-controls {
          flex-direction: column;
          width: 100%;
        }
      }

      .player-stats-card {
        margin-top: var(--space-6);
      }

      .stats-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
      }

      .stat-summary-item {
        text-align: center;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .stat-value.error {
        color: var(--color-error);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--p-border-radius);
      }

      .stat-card h4,
      .stat-card h5 {
        margin: 0 0 var(--space-4) 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--p-surface-200);
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      .stat-row span {
        color: var(--text-secondary);
      }

      .stat-row strong {
        color: var(--text-primary);
        font-weight: 600;
      }

      .multi-season-stats h4 {
        margin: var(--space-6) 0 var(--space-4) 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);
  private playerStatsService = inject(PlayerStatisticsService);
  private authService = inject(AuthService);

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

  selectedTimePeriod: string = "Last 7 Weeks";
  selectedMetric: string = "40-Yard & 10-Yard";

  timePeriods = ["Last 7 Weeks", "Last 30 Days", "Season Progress"];
  metricOptions = [
    "40-Yard & 10-Yard",
    "All Sprint Distances",
    "Agility Tests",
  ];

  readonly lineChartOptions = LINE_CHART_OPTIONS;
  readonly BAR_CHART_OPTIONS = BAR_CHART_OPTIONS;
  readonly DOUGHNUT_CHART_OPTIONS = DOUGHNUT_CHART_OPTIONS;

  radarChartOptions = {
    ...DEFAULT_CHART_OPTIONS,
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
      },
    },
  };

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.loadPlayerStatistics();
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
        console.error("Error loading player game stats:", error);
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
          console.error("Error loading season stats:", error);
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
          console.error("Error loading multi-season stats:", error);
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
          if (response.success && response.data?.metrics) {
            this.metrics.set(response.data.metrics);
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
              labels: response.data.labels,
              datasets: [
                {
                  label: "Performance Score",
                  data: response.data.values,
                  borderColor: "#089949",
                  backgroundColor: "rgba(8, 153, 73, 0.1)",
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
              labels: response.data.labels,
              datasets: [
                {
                  label: "Team Chemistry",
                  data: response.data.values,
                  borderColor: "#089949",
                  backgroundColor: "rgba(16, 201, 107, 0.2)",
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
              labels: response.data.labels,
              datasets: [
                {
                  data: response.data.values,
                  backgroundColor: [
                    "#089949",
                    "#10c89b",
                    "#f1c40f",
                    "#e74c3c",
                    "#3498db",
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
              labels: response.data.labels,
              datasets: [
                {
                  label: "Performance",
                  data: response.data.values,
                  backgroundColor: "#089949",
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
            this.speedChartData.set({
              labels: response.data.labels,
              datasets: response.data.datasets.map((ds: any) => ({
                ...ds,
                borderColor: ds.label.includes("40") ? "#089949" : "#10c96b",
                backgroundColor: ds.label.includes("40")
                  ? "rgba(8, 153, 73, 0.1)"
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
    this.loadFallbackMetrics();
    this.loadFallbackPerformanceChart();
    this.loadFallbackChemistryChart();
    this.loadFallbackDistributionChart();
    this.loadFallbackPositionChart();
    this.loadFallbackSpeedChart();
  }

  loadFallbackMetrics(): void {
    this.metrics.set([
      {
        icon: "pi-chart-bar",
        value: "87%",
        label: "Overall Performance",
        trend: "+5.2% this week",
        trendType: "positive",
      },
      {
        icon: "pi-users",
        value: "8.4",
        label: "Team Chemistry",
        trend: "+0.6 improvement",
        trendType: "positive",
      },
      {
        icon: "pi-bolt",
        value: "4.52s",
        label: "40-Yard Dash",
        trend: "-0.13s faster",
        trendType: "positive",
      },
      {
        icon: "pi-trophy",
        value: "73%",
        label: "Olympic Qualification",
        trend: "+8% progress",
        trendType: "positive",
      },
    ]);
  }

  loadFallbackPerformanceChart(): void {
    this.performanceChartData.set({
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
      datasets: [
        {
          label: "Performance Score",
          data: [78, 82, 85, 79, 88, 91, 87],
          borderColor: "#089949",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  loadFallbackChemistryChart(): void {
    this.chemistryChartData.set({
      labels: ["Communication", "Coordination", "Trust", "Cohesion", "Leadership", "Adaptability"],
      datasets: [
        {
          label: "Team Chemistry",
          data: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
          borderColor: "#089949",
          backgroundColor: "rgba(16, 201, 107, 0.2)",
          borderWidth: 2,
        },
      ],
    });
  }

  loadFallbackDistributionChart(): void {
    this.distributionChartData.set({
      labels: ["Speed Training", "Strength", "Agility", "Endurance", "Technique"],
      datasets: [
        {
          data: [30, 25, 20, 15, 10],
          backgroundColor: ["#089949", "#10c89b", "#f1c40f", "#e74c3c", "#3498db"],
        },
      ],
    });
  }

  loadFallbackPositionChart(): void {
    this.positionChartData.set({
      labels: ["QB", "WR", "RB", "DB", "Rusher"],
      datasets: [
        {
          label: "Performance",
          data: [94, 91, 89, 87, 85],
          backgroundColor: "#089949",
        },
      ],
    });
  }

  loadFallbackSpeedChart(): void {
    this.speedChartData.set({
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
      datasets: [
        {
          label: "40-Yard",
          data: [4.65, 4.58, 4.52, 4.49, 4.47, 4.46, 4.46],
          borderColor: "#089949",
          backgroundColor: "rgba(8, 153, 73, 0.1)",
        },
        {
          label: "10-Yard",
          data: [1.65, 1.6, 1.57, 1.55, 1.54, 1.54, 1.54],
          borderColor: "#10c96b",
          backgroundColor: "rgba(16, 201, 107, 0.1)",
        },
      ],
    });
  }

  trackByMetricLabel(index: number, metric: Metric): string {
    return metric.label;
  }
}
