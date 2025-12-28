import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { InputTextModule } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin } from "rxjs";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";
import { DEFAULT_CHART_OPTIONS, LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import {
  TeamStatisticsService,
  TeamOverviewStats,
  PlayerPerformanceStats,
  GameResult,
  UpcomingGame,
  TrainingSession,
  RiskAlert,
  TeamMessage,
} from "../../core/services/team-statistics.service";

type PlayerFilterType = 'all' | 'starters' | 'injured' | 'at_risk';
type SortField = 'name' | 'position' | 'performance' | 'acwr' | 'readiness';

@Component({
  selector: "app-coach-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ChartModule,
    DialogModule,
    TooltipModule,
    ProgressBar,
    AvatarModule,
    BadgeModule,
    InputTextModule,
    Textarea,
    DatePicker,
    Select,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="dashboard-content">
        <!-- Header with Team Name & Quick Actions -->
        <div class="dashboard-header">
          <div class="header-info">
            <h1 class="team-name">
              <span class="team-icon">🏈</span>
              {{ teamOverview().teamName }} Dashboard
            </h1>
            <p class="header-subtitle">
              {{ teamOverview().season }} Season • {{ teamOverview().wins }}-{{ teamOverview().losses }}{{ teamOverview().ties > 0 ? '-' + teamOverview().ties : '' }} Record
              <span class="streak-badge" [class.winning]="teamOverview().streak.startsWith('W')">
                {{ teamOverview().streak }}
              </span>
            </p>
          </div>
          <div class="header-actions">
            <p-button
              icon="pi pi-plus"
              label="Create Session"
              (onClick)="openCreateSession()"
            ></p-button>
            <p-button
              icon="pi pi-send"
              label="Team Message"
              [outlined]="true"
              (onClick)="openTeamMessage()"
            ></p-button>
          </div>
        </div>

        <!-- Key Stats Row -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">🏆</div>
            <div class="stat-info">
              <div class="stat-value">{{ teamOverview().wins }}-{{ teamOverview().losses }}</div>
              <div class="stat-label">Season Record</div>
              <div class="stat-detail">{{ teamOverview().winPercentage }}% Win Rate</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ teamOverview().activePlayers }}/{{ teamOverview().totalPlayers }}</div>
              <div class="stat-label">Active Players</div>
              <div class="stat-detail" [class.warning]="teamOverview().injuredPlayers > 0">
                {{ teamOverview().injuredPlayers }} injured
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
              <div class="stat-value">{{ teamOverview().overallRating }}</div>
              <div class="stat-label">Team Rating</div>
              <div class="stat-detail">Off: {{ teamOverview().offenseRating }} • Def: {{ teamOverview().defenseRating }}</div>
            </div>
          </div>
          
          <div class="stat-card" [class.alert]="teamOverview().playersAtRisk > 0">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">{{ teamOverview().playersAtRisk }}</div>
              <div class="stat-label">Risk Alerts</div>
              <div class="stat-detail">Players need attention</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🤝</div>
            <div class="stat-info">
              <div class="stat-value">{{ teamOverview().teamChemistry | number:'1.1-1' }}</div>
              <div class="stat-label">Team Chemistry</div>
              <div class="stat-detail">Out of 10</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <div class="stat-value">{{ upcomingGames()[0]?.daysUntil || '-' }}</div>
              <div class="stat-label">Days to Game</div>
              <div class="stat-detail">vs {{ upcomingGames()[0]?.opponent || 'TBD' }}</div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="main-grid">
          <!-- Left Column: Performance & Alerts -->
          <div class="left-column">
            <!-- Team Performance Trend -->
            @defer (on viewport) {
              <p-card class="chart-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <h3><i class="pi pi-chart-line"></i> Team Performance Trend</h3>
                    <p-button 
                      icon="pi pi-external-link" 
                      [text]="true" 
                      [rounded]="true"
                      pTooltip="View detailed analytics"
                      (onClick)="navigateToAnalytics()"
                    ></p-button>
                  </div>
                </ng-template>
                @if (performanceChartData()) {
                  <p-chart
                    type="line"
                    [data]="performanceChartData()"
                    [options]="lineChartOptions"
                    [style]="{ height: '250px' }"
                  ></p-chart>
                }
                <div class="chart-insights">
                  <div class="insight">
                    <span class="insight-value">{{ latestPerformanceScore() }}</span>
                    <span class="insight-label">Current</span>
                  </div>
                  <div class="insight">
                    <span class="insight-value trend-up">+{{ performanceImprovement() }}</span>
                    <span class="insight-label">Season Δ</span>
                  </div>
                  <div class="insight">
                    <span class="insight-value">{{ teamOverview().practiceAttendanceRate }}%</span>
                    <span class="insight-label">Attendance</span>
                  </div>
                </div>
              </p-card>
            } @placeholder {
              <p-card class="chart-card">
                <div class="loading-placeholder">Loading performance chart...</div>
              </p-card>
            }

            <!-- Risk Alerts -->
            <p-card class="alerts-card" [class.has-alerts]="riskAlerts().length > 0">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>
                    <i class="pi pi-exclamation-triangle"></i> 
                    Risk Alerts
                    @if (riskAlerts().length > 0) {
                      <p-badge [value]="riskAlerts().length.toString()" severity="danger"></p-badge>
                    }
                  </h3>
                </div>
              </ng-template>
              
              @if (riskAlerts().length > 0) {
                <div class="alerts-list">
                  @for (alert of riskAlerts(); track alert.playerId) {
                    <div class="alert-item" [class.critical]="alert.severity === 'critical'">
                      <div class="alert-header">
                        <p-avatar 
                          [label]="getPlayerInitials(alert.playerName)" 
                          shape="circle"
                          [style]="{ 'background-color': alert.severity === 'critical' ? 'var(--red-500)' : 'var(--yellow-500)', color: 'white' }"
                        ></p-avatar>
                        <div class="alert-player">
                          <span class="player-name">{{ alert.playerName }}</span>
                          <span class="player-position">{{ alert.position }}</span>
                        </div>
                        <p-tag 
                          [value]="alert.severity | titlecase" 
                          [severity]="alert.severity === 'critical' ? 'danger' : 'warn'"
                        ></p-tag>
                      </div>
                      <p class="alert-message">{{ alert.message }}</p>
                      <p class="alert-recommendation">
                        <i class="pi pi-lightbulb"></i> {{ alert.recommendation }}
                      </p>
                      <div class="alert-metrics">
                        @if (alert.acwr) {
                          <span class="metric" [class.danger]="alert.acwr > 1.5">
                            ACWR: {{ alert.acwr | number:'1.2-2' }}
                          </span>
                        }
                        @if (alert.readiness) {
                          <span class="metric" [class.danger]="alert.readiness < 60">
                            Readiness: {{ alert.readiness }}/100
                          </span>
                        }
                      </div>
                      <div class="alert-actions">
                        <p-button 
                          label="View Player" 
                          [text]="true" 
                          size="small"
                          (onClick)="viewPlayer(alert.playerId)"
                        ></p-button>
                        <p-button 
                          label="Adjust Load" 
                          [outlined]="true" 
                          size="small"
                          (onClick)="adjustPlayerLoad(alert.playerId)"
                        ></p-button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-alerts">
                  <i class="pi pi-check-circle"></i>
                  <p>All players are in good condition</p>
                </div>
              }
            </p-card>
          </div>

          <!-- Center Column: Player Roster -->
          <div class="center-column">
            <p-card class="roster-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3><i class="pi pi-users"></i> Team Roster</h3>
                  <div class="roster-filters">
                    <p-button 
                      [label]="'All (' + players().length + ')'" 
                      [text]="playerFilter() === 'all'"
                      [outlined]="playerFilter() !== 'all'"
                      size="small"
                      (onClick)="setPlayerFilter('all')"
                    ></p-button>
                    <p-button 
                      [label]="'At Risk (' + atRiskCount() + ')'" 
                      [text]="playerFilter() === 'at_risk'"
                      [outlined]="playerFilter() !== 'at_risk'"
                      size="small"
                      severity="warn"
                      (onClick)="setPlayerFilter('at_risk')"
                    ></p-button>
                    <p-button 
                      [label]="'Injured (' + injuredCount() + ')'" 
                      [text]="playerFilter() === 'injured'"
                      [outlined]="playerFilter() !== 'injured'"
                      size="small"
                      severity="danger"
                      (onClick)="setPlayerFilter('injured')"
                    ></p-button>
                  </div>
                </div>
              </ng-template>

              <p-table
                [value]="filteredPlayers()"
                [paginator]="filteredPlayers().length > 8"
                [rows]="8"
                [rowsPerPageOptions]="[8, 15, 25]"
                [scrollable]="true"
                scrollHeight="500px"
                styleClass="p-datatable-sm"
                [rowHover]="true"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 200px" pSortableColumn="playerName">
                      Player <p-sortIcon field="playerName"></p-sortIcon>
                    </th>
                    <th style="width: 80px" pSortableColumn="position">
                      Pos <p-sortIcon field="position"></p-sortIcon>
                    </th>
                    <th style="width: 100px" pSortableColumn="performanceScore">
                      Perf <p-sortIcon field="performanceScore"></p-sortIcon>
                    </th>
                    <th style="width: 90px" pSortableColumn="acwr">
                      ACWR <p-sortIcon field="acwr"></p-sortIcon>
                    </th>
                    <th style="width: 100px" pSortableColumn="readiness">
                      Ready <p-sortIcon field="readiness"></p-sortIcon>
                    </th>
                    <th style="width: 90px">Status</th>
                    <th style="width: 80px">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-player>
                  <tr [class.at-risk-row]="player.riskLevel === 'high'" [class.injured-row]="player.status === 'injured'">
                    <td>
                      <div class="player-cell">
                        <p-avatar 
                          [label]="player.avatarInitials" 
                          shape="circle"
                          [style]="getAvatarStyle(player)"
                        ></p-avatar>
                        <div class="player-info">
                          <span class="player-name">{{ player.playerName }}</span>
                          @if (player.jerseyNumber) {
                            <span class="jersey-number">#{{ player.jerseyNumber }}</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="player.position" [severity]="getPositionSeverity(player.position)"></p-tag>
                    </td>
                    <td>
                      <div class="performance-cell">
                        <span class="perf-score" [class]="getPerformanceClass(player.performanceScore)">
                          {{ player.performanceScore }}%
                        </span>
                        <i [class]="getTrendIcon(player.performanceTrend)" [ngClass]="'trend-' + player.performanceTrend"></i>
                      </div>
                    </td>
                    <td>
                      <span [class]="getACWRClass(player.acwr)">
                        {{ player.acwr | number:'1.2-2' }}
                      </span>
                    </td>
                    <td>
                      <div class="readiness-cell">
                        <p-progressBar 
                          [value]="player.readiness" 
                          [showValue]="false"
                          [style]="{ height: '8px', width: '60px' }"
                          [styleClass]="getReadinessBarClass(player.readiness)"
                        ></p-progressBar>
                        <span class="readiness-value">{{ player.readiness }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag 
                        [value]="getStatusLabel(player.status)" 
                        [severity]="getStatusSeverity(player.status)"
                      ></p-tag>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <p-button 
                          icon="pi pi-eye" 
                          [text]="true" 
                          [rounded]="true"
                          pTooltip="View Details"
                          (onClick)="viewPlayer(player.playerId)"
                        ></p-button>
                        <p-button 
                          icon="pi pi-chart-bar" 
                          [text]="true" 
                          [rounded]="true"
                          pTooltip="View Stats"
                          (onClick)="viewPlayerStats(player.playerId)"
                        ></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="7" class="empty-message">
                      No players found matching the filter.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>
          </div>

          <!-- Right Column: Schedule & Games -->
          <div class="right-column">
            <!-- Upcoming Games -->
            <p-card class="games-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3><i class="pi pi-calendar"></i> Upcoming Games</h3>
                  <p-button 
                    icon="pi pi-plus" 
                    [text]="true" 
                    [rounded]="true"
                    pTooltip="Schedule Game"
                    (onClick)="scheduleGame()"
                  ></p-button>
                </div>
              </ng-template>
              
              <div class="games-list">
                @for (game of upcomingGames(); track game.gameId) {
                  <div class="game-item" [class.imminent]="game.daysUntil <= 3">
                    <div class="game-date">
                      <span class="date-day">{{ game.date | date:'d' }}</span>
                      <span class="date-month">{{ game.date | date:'MMM' }}</span>
                    </div>
                    <div class="game-info">
                      <span class="opponent">vs {{ game.opponent }}</span>
                      <span class="location">{{ game.location }}</span>
                      <span class="game-type">{{ game.gameType }}</span>
                    </div>
                    <div class="game-countdown">
                      <p-tag 
                        [value]="getCountdownLabel(game.daysUntil)" 
                        [severity]="game.daysUntil <= 3 ? 'danger' : game.daysUntil <= 7 ? 'warn' : 'info'"
                      ></p-tag>
                    </div>
                  </div>
                } @empty {
                  <div class="no-games">
                    <p>No upcoming games scheduled</p>
                    <p-button label="Schedule Game" [outlined]="true" size="small" (onClick)="scheduleGame()"></p-button>
                  </div>
                }
              </div>
            </p-card>

            <!-- Recent Results -->
            <p-card class="results-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3><i class="pi pi-history"></i> Recent Results</h3>
                </div>
              </ng-template>
              
              <div class="results-list">
                @for (game of recentGames(); track game.gameId) {
                  <div class="result-item" [class]="game.result">
                    <div class="result-badge" [class]="game.result">
                      {{ game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'T' }}
                    </div>
                    <div class="result-info">
                      <span class="opponent">vs {{ game.opponent }}</span>
                      <span class="score">{{ game.teamScore }} - {{ game.opponentScore }}</span>
                    </div>
                    <span class="result-date">{{ game.date | date:'MMM d' }}</span>
                  </div>
                } @empty {
                  <div class="no-results">No recent games</div>
                }
              </div>
            </p-card>

            <!-- Training Schedule -->
            <p-card class="schedule-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3><i class="pi pi-clock"></i> Training Schedule</h3>
                  <p-button 
                    icon="pi pi-plus" 
                    [text]="true" 
                    [rounded]="true"
                    pTooltip="Add Session"
                    (onClick)="openCreateSession()"
                  ></p-button>
                </div>
              </ng-template>
              
              <div class="schedule-list">
                @for (session of trainingSessions(); track session.sessionId) {
                  <div class="session-item" [class]="session.type">
                    <div class="session-time">
                      <span class="time">{{ session.time }}</span>
                      <span class="day">{{ session.date | date:'EEE' }}</span>
                    </div>
                    <div class="session-info">
                      <span class="session-title">{{ session.title }}</span>
                      <span class="session-meta">
                        {{ session.duration }} min • {{ getSessionTypeLabel(session.type) }}
                      </span>
                    </div>
                    <p-tag 
                      [value]="session.status | titlecase" 
                      [severity]="getSessionStatusSeverity(session.status)"
                    ></p-tag>
                  </div>
                } @empty {
                  <div class="no-sessions">
                    <p>No sessions scheduled</p>
                  </div>
                }
              </div>
            </p-card>

            <!-- Quick Actions -->
            <p-card class="actions-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3><i class="pi pi-bolt"></i> Quick Actions</h3>
                </div>
              </ng-template>
              
              <div class="quick-actions">
                <button class="action-btn" (click)="openCreateSession()">
                  <i class="pi pi-calendar-plus"></i>
                  <span>Create Practice</span>
                </button>
                <button class="action-btn" (click)="viewAllStats()">
                  <i class="pi pi-chart-bar"></i>
                  <span>View All Stats</span>
                </button>
                <button class="action-btn" (click)="openTeamMessage()">
                  <i class="pi pi-comments"></i>
                  <span>Team Message</span>
                </button>
                <button class="action-btn" (click)="viewInjuryReport()">
                  <i class="pi pi-heart"></i>
                  <span>Injury Report</span>
                </button>
                <button class="action-btn" (click)="navigateToAnalytics()">
                  <i class="pi pi-chart-line"></i>
                  <span>Analytics</span>
                </button>
                <button class="action-btn" (click)="manageRoster()">
                  <i class="pi pi-users"></i>
                  <span>Manage Roster</span>
                </button>
              </div>
            </p-card>
          </div>
        </div>
      </div>

      <!-- Create Session Dialog -->
      <p-dialog
        header="Create Training Session"
        [(visible)]="showCreateSessionDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        <div class="session-form">
          <div class="form-field">
            <label for="sessionTitle">Session Title</label>
            <input
              id="sessionTitle"
              type="text"
              pInputText
              [(ngModel)]="newSession.title"
              placeholder="e.g., Offensive Drills"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="sessionType">Type</label>
            <p-select
              id="sessionType"
              [(ngModel)]="newSession.type"
              [options]="sessionTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="form-field">
            <label for="sessionDate">Date & Time</label>
            <p-datepicker
              id="sessionDate"
              [(ngModel)]="newSession.date"
              [showTime]="true"
              [showIcon]="true"
              dateFormat="mm/dd/yy"
              styleClass="w-full"
            ></p-datepicker>
          </div>
          <div class="form-field">
            <label for="sessionDuration">Duration (minutes)</label>
            <input
              id="sessionDuration"
              type="number"
              pInputText
              [(ngModel)]="newSession.duration"
              placeholder="90"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label for="sessionNotes">Notes</label>
            <textarea
              pTextarea
              id="sessionNotes"
              [(ngModel)]="newSession.notes"
              placeholder="Session notes..."
              rows="3"
              class="w-full"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" (onClick)="showCreateSessionDialog = false"></p-button>
          <p-button label="Create" icon="pi pi-check" (onClick)="createSession()"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Team Message Dialog -->
      <p-dialog
        header="Send Team Message"
        [(visible)]="showTeamMessageDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        <div class="message-form">
          <div class="form-field">
            <label for="messageContent">Message</label>
            <textarea
              pTextarea
              id="messageContent"
              [(ngModel)]="teamMessageContent"
              placeholder="Type your message to the team..."
              rows="5"
              class="w-full"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" (onClick)="showTeamMessageDialog = false"></p-button>
          <p-button label="Send" icon="pi pi-send" (onClick)="sendTeamMessage()"></p-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styles: [`
    .dashboard-content {
      padding: var(--space-4);
      background: var(--surface-ground);
      min-height: 100vh;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
      padding: var(--space-4);
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
    }

    .team-name {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-color);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .team-icon {
      font-size: var(--text-3xl);
    }

    .header-subtitle {
      color: var(--text-color-secondary);
      margin: var(--space-1) 0 0 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .streak-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: var(--text-xs);
      font-weight: var(--font-weight-bold);
      background: var(--surface-200);
      color: var(--text-color-secondary);
    }

    .streak-badge.winning {
      background: var(--green-100);
      color: var(--green-700);
    }

    .header-actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }

    .stat-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      box-shadow: var(--card-shadow);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid var(--surface-border);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-card.primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-700));
      color: white;
      border: none;
    }

    .stat-card.primary .stat-label,
    .stat-card.primary .stat-detail {
      color: rgba(255, 255, 255, 0.85);
    }

    .stat-card.alert {
      border-color: var(--red-300);
      background: var(--red-50);
    }

    .stat-icon {
      font-size: var(--text-2xl);
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
      line-height: 1.2;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-color-secondary);
      margin-top: 2px;
    }

    .stat-detail {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
      margin-top: 2px;
    }

    .stat-detail.warning {
      color: var(--red-500);
    }

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: var(--space-4);
    }

    .left-column,
    .center-column,
    .right-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    /* Card Headers */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--surface-border);
    }

    .card-header h3 {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .card-header h3 i {
      color: var(--primary-color);
    }

    /* Chart Card */
    .chart-card {
      min-height: 350px;
    }

    .chart-insights {
      display: flex;
      justify-content: space-around;
      padding: var(--space-3) 0;
      border-top: 1px solid var(--surface-border);
      margin-top: var(--space-3);
    }

    .insight {
      text-align: center;
    }

    .insight-value {
      display: block;
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
      color: var(--primary-color);
    }

    .insight-value.trend-up {
      color: var(--green-500);
    }

    .insight-label {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    /* Alerts Card */
    .alerts-card.has-alerts {
      border-left: 4px solid var(--red-500);
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-3);
    }

    .alert-item {
      padding: var(--space-3);
      background: var(--yellow-50);
      border-radius: var(--border-radius);
      border: 1px solid var(--yellow-200);
    }

    .alert-item.critical {
      background: var(--red-50);
      border-color: var(--red-200);
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    .alert-player {
      flex: 1;
    }

    .alert-player .player-name {
      display: block;
      font-weight: var(--font-weight-semibold);
    }

    .alert-player .player-position {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    .alert-message {
      margin: var(--space-2) 0;
      font-size: var(--text-sm);
      color: var(--text-color);
    }

    .alert-recommendation {
      margin: var(--space-2) 0;
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .alert-recommendation i {
      color: var(--yellow-600);
    }

    .alert-metrics {
      display: flex;
      gap: var(--space-3);
      margin: var(--space-2) 0;
    }

    .alert-metrics .metric {
      font-size: var(--text-xs);
      padding: 2px 8px;
      background: var(--surface-100);
      border-radius: 4px;
    }

    .alert-metrics .metric.danger {
      background: var(--red-100);
      color: var(--red-700);
    }

    .alert-actions {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .no-alerts {
      text-align: center;
      padding: var(--space-6);
      color: var(--green-600);
    }

    .no-alerts i {
      font-size: var(--text-3xl);
      margin-bottom: var(--space-2);
    }

    .no-alerts p {
      margin: 0;
      color: var(--text-color-secondary);
    }

    /* Roster Card */
    .roster-filters {
      display: flex;
      gap: var(--space-1);
    }

    .player-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .player-info {
      display: flex;
      flex-direction: column;
    }

    .player-info .player-name {
      font-weight: var(--font-weight-medium);
    }

    .player-info .jersey-number {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    .performance-cell {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .perf-score {
      font-weight: var(--font-weight-semibold);
    }

    .perf-score.excellent { color: var(--green-600); }
    .perf-score.good { color: var(--primary-color); }
    .perf-score.average { color: var(--yellow-600); }
    .perf-score.poor { color: var(--red-600); }

    .trend-up { color: var(--green-500); }
    .trend-down { color: var(--red-500); }
    .trend-stable { color: var(--text-color-secondary); }

    .readiness-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .readiness-value {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      min-width: 24px;
    }

    .action-buttons {
      display: flex;
      gap: 0;
    }

    .at-risk-row {
      background: var(--yellow-50) !important;
    }

    .injured-row {
      background: var(--red-50) !important;
    }

    .empty-message {
      text-align: center;
      padding: var(--space-6);
      color: var(--text-color-secondary);
    }

    /* ACWR Classes */
    .acwr-safe { color: var(--green-600); font-weight: var(--font-weight-semibold); }
    .acwr-moderate { color: var(--yellow-600); font-weight: var(--font-weight-semibold); }
    .acwr-high { color: var(--orange-600); font-weight: var(--font-weight-semibold); }
    .acwr-danger { color: var(--red-600); font-weight: var(--font-weight-bold); }

    /* Readiness Progress Bar Styles */
    :host ::ng-deep .readiness-high .p-progressbar-value {
      background: var(--green-500);
    }
    :host ::ng-deep .readiness-medium .p-progressbar-value {
      background: var(--yellow-500);
    }
    :host ::ng-deep .readiness-low .p-progressbar-value {
      background: var(--red-500);
    }

    /* Games Card */
    .games-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .game-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--surface-50);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      transition: all 0.2s;
    }

    .game-item:hover {
      background: var(--surface-100);
    }

    .game-item.imminent {
      border-color: var(--red-300);
      background: var(--red-50);
    }

    .game-date {
      text-align: center;
      min-width: 45px;
    }

    .game-date .date-day {
      display: block;
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
      color: var(--primary-color);
      line-height: 1;
    }

    .game-date .date-month {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
      text-transform: uppercase;
    }

    .game-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .game-info .opponent {
      font-weight: var(--font-weight-semibold);
    }

    .game-info .location,
    .game-info .game-type {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    .no-games {
      text-align: center;
      padding: var(--space-4);
      color: var(--text-color-secondary);
    }

    /* Results Card */
    .results-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      border-radius: var(--border-radius);
    }

    .result-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--text-sm);
    }

    .result-badge.win {
      background: var(--green-500);
      color: white;
    }

    .result-badge.loss {
      background: var(--red-500);
      color: white;
    }

    .result-badge.tie {
      background: var(--gray-400);
      color: white;
    }

    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .result-info .opponent {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
    }

    .result-info .score {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    .result-date {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    /* Schedule Card */
    .schedule-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--surface-50);
      border-radius: var(--border-radius);
      border-left: 3px solid var(--primary-color);
    }

    .session-item.game_prep {
      border-left-color: var(--orange-500);
    }

    .session-item.conditioning {
      border-left-color: var(--purple-500);
    }

    .session-item.film_study {
      border-left-color: var(--blue-500);
    }

    .session-time {
      text-align: center;
      min-width: 50px;
    }

    .session-time .time {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-weight-semibold);
    }

    .session-time .day {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    .session-info {
      flex: 1;
    }

    .session-info .session-title {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
    }

    .session-info .session-meta {
      font-size: var(--text-xs);
      color: var(--text-color-secondary);
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-3);
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .action-btn:hover {
      background: var(--primary-50);
      border-color: var(--primary-200);
      transform: translateY(-2px);
    }

    .action-btn i {
      font-size: var(--text-xl);
      color: var(--primary-color);
    }

    .action-btn span {
      font-size: var(--text-xs);
      color: var(--text-color);
      font-weight: var(--font-weight-medium);
    }

    /* Form Styles */
    .session-form,
    .message-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-2);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-field label {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-color);
    }

    .loading-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-color-secondary);
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .main-grid {
        grid-template-columns: 1fr 1fr;
      }

      .right-column {
        grid-column: span 2;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .main-grid {
        grid-template-columns: 1fr;
      }

      .right-column {
        grid-column: auto;
        display: flex;
        flex-direction: column;
      }

      .dashboard-header {
        flex-direction: column;
        gap: var(--space-3);
        text-align: center;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .roster-filters {
        flex-wrap: wrap;
      }
    }
  `],
})
export class CoachDashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private teamStatsService = inject(TeamStatisticsService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  // Data signals
  teamOverview = signal<TeamOverviewStats>({
    teamId: '',
    teamName: 'Loading...',
    season: new Date().getFullYear().toString(),
    wins: 0,
    losses: 0,
    ties: 0,
    winPercentage: 0,
    streak: '-',
    totalPlayers: 0,
    activePlayers: 0,
    injuredPlayers: 0,
    overallRating: 0,
    offenseRating: 0,
    defenseRating: 0,
    teamChemistry: 0,
    practiceAttendanceRate: 0,
    gameAttendanceRate: 0,
    avgTeamWorkload: 0,
    playersAtRisk: 0,
    trainingConsistency: 0,
  });

  players = signal<PlayerPerformanceStats[]>([]);
  recentGames = signal<GameResult[]>([]);
  upcomingGames = signal<UpcomingGame[]>([]);
  trainingSessions = signal<TrainingSession[]>([]);
  riskAlerts = signal<RiskAlert[]>([]);
  teamMessages = signal<TeamMessage[]>([]);
  performanceTrend = signal<{ labels: string[]; scores: number[] }>({ labels: [], scores: [] });

  // UI state
  playerFilter = signal<PlayerFilterType>('all');
  showCreateSessionDialog = false;
  showTeamMessageDialog = false;
  teamMessageContent = '';

  // New session form
  newSession = {
    title: '',
    type: 'practice',
    date: new Date(),
    duration: 90,
    notes: '',
  };

  sessionTypes = [
    { label: 'Practice', value: 'practice' },
    { label: 'Game Prep', value: 'game_prep' },
    { label: 'Conditioning', value: 'conditioning' },
    { label: 'Film Study', value: 'film_study' },
  ];

  // Chart options
  lineChartOptions = {
    ...LINE_CHART_OPTIONS,
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
      legend: { display: false },
    },
    scales: {
      y: {
        min: 60,
        max: 100,
        ticks: { stepSize: 10 },
      },
    },
  };

  // Computed values
  filteredPlayers = computed(() => {
    const filter = this.playerFilter();
    const allPlayers = this.players();
    
    switch (filter) {
      case 'injured':
        return allPlayers.filter(p => p.status === 'injured');
      case 'at_risk':
        return allPlayers.filter(p => p.riskLevel === 'high' || p.status === 'at_risk');
      default:
        return allPlayers;
    }
  });

  atRiskCount = computed(() => 
    this.players().filter(p => p.riskLevel === 'high' || p.status === 'at_risk').length
  );

  injuredCount = computed(() => 
    this.players().filter(p => p.status === 'injured').length
  );

  performanceChartData = computed(() => {
    const trend = this.performanceTrend();
    if (!trend.labels.length) return null;
    
    return {
      labels: trend.labels,
      datasets: [{
        label: 'Team Performance',
        data: trend.scores,
        borderColor: 'rgb(var(--primary-500))',
        backgroundColor: 'rgba(var(--primary-500), 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      }],
    };
  });

  latestPerformanceScore = computed(() => {
    const scores = this.performanceTrend().scores;
    return scores.length ? scores[scores.length - 1] : 0;
  });

  performanceImprovement = computed(() => {
    const scores = this.performanceTrend().scores;
    if (scores.length < 2) return 0;
    return scores[scores.length - 1] - scores[0];
  });

  ngOnInit(): void {
    this.headerService.setDashboardHeader();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const user = this.authService.getUser();
    // Use user ID as team identifier for now, or default
    const teamId = user?.id || 'default';

    // Load all data in parallel
    forkJoin({
      overview: this.teamStatsService.getTeamOverview(teamId),
      players: this.teamStatsService.getTeamPlayersStats(teamId),
      recentGames: this.teamStatsService.getRecentGames(teamId, 5),
      upcomingGames: this.teamStatsService.getUpcomingGames(teamId, 5),
      trainingSessions: this.teamStatsService.getTrainingSchedule(teamId, 7),
      riskAlerts: this.teamStatsService.getRiskAlerts(teamId),
      performanceTrend: this.teamStatsService.getPerformanceTrend(teamId, 10),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data) => {
        this.teamOverview.set(data.overview);
        this.players.set(data.players);
        this.recentGames.set(data.recentGames);
        this.upcomingGames.set(data.upcomingGames);
        this.trainingSessions.set(data.trainingSessions);
        this.riskAlerts.set(data.riskAlerts);
        this.performanceTrend.set(data.performanceTrend);
      },
      error: (error) => {
        this.logger.error('Error loading dashboard data:', error);
        this.toastService.error('Failed to load some dashboard data');
      },
    });
  }

  // Filter methods
  setPlayerFilter(filter: PlayerFilterType): void {
    this.playerFilter.set(filter);
  }

  // Navigation methods
  viewPlayer(playerId: string): void {
    this.router.navigate(['/roster'], { queryParams: { player: playerId } });
  }

  viewPlayerStats(playerId: string): void {
    this.router.navigate(['/analytics'], { queryParams: { player: playerId } });
  }

  adjustPlayerLoad(playerId: string): void {
    this.toastService.info('Opening load adjustment for player...');
    this.router.navigate(['/training'], { queryParams: { player: playerId, action: 'adjust-load' } });
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/analytics']);
  }

  viewAllStats(): void {
    this.router.navigate(['/analytics']);
  }

  viewInjuryReport(): void {
    this.router.navigate(['/roster'], { queryParams: { filter: 'injured' } });
  }

  manageRoster(): void {
    this.router.navigate(['/roster']);
  }

  scheduleGame(): void {
    this.router.navigate(['/game-tracker'], { queryParams: { action: 'schedule' } });
  }

  // Dialog methods
  openCreateSession(): void {
    this.newSession = {
      title: '',
      type: 'practice',
      date: new Date(),
      duration: 90,
      notes: '',
    };
    this.showCreateSessionDialog = true;
  }

  createSession(): void {
    if (!this.newSession.title) {
      this.toastService.warn('Please enter a session title');
      return;
    }
    
    this.toastService.success(`Training session "${this.newSession.title}" created`);
    this.showCreateSessionDialog = false;
    // In real implementation, would call API to create session
  }

  openTeamMessage(): void {
    this.teamMessageContent = '';
    this.showTeamMessageDialog = true;
  }

  sendTeamMessage(): void {
    if (!this.teamMessageContent.trim()) {
      this.toastService.warn('Please enter a message');
      return;
    }
    
    this.toastService.success('Message sent to team');
    this.showTeamMessageDialog = false;
    // In real implementation, would call API to send message
  }

  // Helper methods
  getPlayerInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarStyle(player: PlayerPerformanceStats): Record<string, string> {
    if (player.status === 'injured') {
      return { 'background-color': 'var(--red-500)', color: 'white' };
    }
    if (player.riskLevel === 'high') {
      return { 'background-color': 'var(--orange-500)', color: 'white' };
    }
    return { 'background-color': 'var(--primary-100)', color: 'var(--primary-700)' };
  }

  getPositionSeverity(position: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const positionColors: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'QB': 'success',
      'WR': 'info',
      'RB': 'warn',
      'DB': 'secondary',
      'Rusher': 'danger',
    };
    return positionColors[position] || 'info';
  }

  getPerformanceClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'average';
    return 'poor';
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    const icons = {
      up: 'pi pi-arrow-up',
      down: 'pi pi-arrow-down',
      stable: 'pi pi-minus',
    };
    return icons[trend];
  }

  getACWRClass(acwr: number): string {
    if (acwr <= 1.0) return 'acwr-safe';
    if (acwr <= 1.3) return 'acwr-moderate';
    if (acwr <= 1.5) return 'acwr-high';
    return 'acwr-danger';
  }

  getReadinessBarClass(readiness: number): string {
    if (readiness >= 75) return 'readiness-high';
    if (readiness >= 55) return 'readiness-medium';
    return 'readiness-low';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active',
      injured: 'Injured',
      inactive: 'Inactive',
      at_risk: 'At Risk',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      active: 'success',
      injured: 'danger',
      inactive: 'info',
      at_risk: 'warn',
    };
    return severities[status] || 'info';
  }

  getCountdownLabel(days: number): string {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  getSessionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      practice: 'Practice',
      game_prep: 'Game Prep',
      conditioning: 'Conditioning',
      film_study: 'Film Study',
    };
    return labels[type] || type;
  }

  getSessionStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      scheduled: 'info',
      in_progress: 'warn',
      completed: 'success',
      cancelled: 'danger',
    };
    return severities[status] || 'info';
  }
}
