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
import { Router, RouterModule } from "@angular/router";
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
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageLoadingStateComponent } from "../../shared/components/page-loading-state/page-loading-state.component";
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
import { ConsentBlockedMessageComponent } from "../../shared/components/consent-blocked-message/consent-blocked-message.component";
import { CONSENT_BLOCKED_MESSAGES } from "../../shared/utils/privacy-ux-copy";

/**
 * Interface for consent information returned from API
 */
interface ConsentInfo {
  blockedPlayerIds: string[];
  partialDataNotice?: string;
}

type PlayerFilterType = 'all' | 'starters' | 'injured' | 'at_risk';
type SortField = 'name' | 'position' | 'performance' | 'acwr' | 'readiness';

@Component({
  selector: "app-coach-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
    PageErrorStateComponent,
    PageLoadingStateComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      @if (isPageLoading()) {
        <app-page-loading-state
          message="Loading coach dashboard..."
          variant="skeleton"
        ></app-page-loading-state>
      }

      <!-- Error State -->
      @else if (hasPageError()) {
        <app-page-error-state
          title="Unable to load dashboard"
          [message]="pageErrorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
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

        <!-- Partial Data Notice (when some players have blocked consent) -->
        @if (hasBlockedPlayers()) {
          <div class="partial-data-notice">
            <div class="notice-icon">
              <i class="pi pi-info-circle"></i>
            </div>
            <div class="notice-content">
              <h4>{{ partialDataMessage().title }}</h4>
              <p>{{ partialDataMessage().reason }}</p>
              <a [routerLink]="partialDataMessage().helpLink" class="notice-link">
                <i class="pi pi-external-link"></i>
                {{ partialDataMessage().actionLabel }}
              </a>
            </div>
          </div>
        }

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
                  <tr 
                    [class.at-risk-row]="player.riskLevel === 'high'" 
                    [class.injured-row]="player.status === 'injured'"
                    [class.consent-blocked-row]="isPlayerBlocked(player.playerId)"
                  >
                    <td>
                      <div class="player-cell">
                        <div class="avatar-wrapper">
                          <p-avatar 
                            [label]="player.avatarInitials" 
                            shape="circle"
                            [style]="getAvatarStyle(player)"
                          ></p-avatar>
                          @if (isPlayerBlocked(player.playerId)) {
                            <div class="blocked-badge" pTooltip="Data not shared">
                              <i class="pi pi-lock"></i>
                            </div>
                          }
                        </div>
                        <div class="player-info">
                          <span class="player-name">{{ player.playerName }}</span>
                          @if (player.jerseyNumber) {
                            <span class="jersey-number">#{{ player.jerseyNumber }}</span>
                          }
                          @if (isPlayerBlocked(player.playerId)) {
                            <span class="blocked-label">Data not shared</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="player.position" [severity]="getPositionSeverity(player.position)"></p-tag>
                    </td>
                    <td>
                      @if (isPlayerBlocked(player.playerId)) {
                        <span class="blocked-data">—</span>
                      } @else {
                        <div class="performance-cell">
                          <span class="perf-score" [class]="getPerformanceClass(player.performanceScore)">
                            {{ player.performanceScore }}%
                          </span>
                          <i [class]="getTrendIcon(player.performanceTrend)" [ngClass]="'trend-' + player.performanceTrend"></i>
                        </div>
                      }
                    </td>
                    <td>
                      @if (isPlayerBlocked(player.playerId)) {
                        <span class="blocked-data">—</span>
                      } @else {
                        <span [class]="getACWRClass(player.acwr)">
                          {{ player.acwr | number:'1.2-2' }}
                        </span>
                      }
                    </td>
                    <td>
                      @if (isPlayerBlocked(player.playerId)) {
                        <span class="blocked-data">—</span>
                      } @else {
                        <div class="readiness-cell">
                          <p-progressBar 
                            [value]="player.readiness" 
                            [showValue]="false"
                            [style]="{ height: '8px', width: '60px' }"
                            [styleClass]="getReadinessBarClass(player.readiness)"
                          ></p-progressBar>
                          <span class="readiness-value">{{ player.readiness }}</span>
                        </div>
                      }
                    </td>
                    <td>
                      @if (isPlayerBlocked(player.playerId)) {
                        <p-tag value="Private" severity="secondary" pTooltip="Ask athlete to enable sharing"></p-tag>
                      } @else {
                        <p-tag 
                          [value]="getStatusLabel(player.status)" 
                          [severity]="getStatusSeverity(player.status)"
                        ></p-tag>
                      }
                    </td>
                    <td>
                      <div class="action-buttons">
                        @if (isPlayerBlocked(player.playerId)) {
                          <p-button 
                            icon="pi pi-envelope" 
                            [text]="true" 
                            [rounded]="true"
                            pTooltip="Request data sharing"
                            (onClick)="requestDataSharing(player.playerId)"
                          ></p-button>
                        } @else {
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
                        }
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
      </div>
      } <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrls: ['./coach-dashboard.component.scss'],
})
export class CoachDashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private teamStatsService = inject(TeamStatisticsService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(true);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>('Something went wrong while loading the dashboard. Please try again.');

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

  // Consent blocked players tracking
  consentInfo = signal<ConsentInfo>({ blockedPlayerIds: [] });

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

  /**
   * Check if any players have blocked consent
   */
  hasBlockedPlayers = computed(() => {
    return this.consentInfo().blockedPlayerIds.length > 0;
  });

  /**
   * Get the partial data message from centralized privacy copy
   */
  partialDataMessage = computed(() => {
    return CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;
  });

  ngOnInit(): void {
    this.headerService.setDashboardHeader();
    this.initializePage();
  }

  /**
   * Initialize page with error handling
   */
  private initializePage(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);
    this.loadDashboardData();
  }

  /**
   * Retry loading the page
   */
  retryLoad(): void {
    this.initializePage();
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
        this.isPageLoading.set(false);
        this.hasPageError.set(false);
        
        this.teamOverview.set(data.overview);
        this.players.set(data.players.members);
        
        // Update consent info from players data
        if (data.players.consentInfo) {
          this.consentInfo.set({
            blockedPlayerIds: data.players.consentInfo.blockedPlayerIds,
            partialDataNotice: data.players.dataState === 'partial' ? 
              'Some player data is hidden due to privacy settings.' : undefined
          });
        } else if (data.overview.consentInfo) {
          // Fallback to overview consent info
          this.consentInfo.set({
            blockedPlayerIds: data.overview.consentInfo.blockedPlayerIds,
            partialDataNotice: data.overview.dataState === 'partial' ? 
              'Some player data is hidden due to privacy settings.' : undefined
          });
        }

        this.recentGames.set(data.recentGames);
        this.upcomingGames.set(data.upcomingGames);
        this.trainingSessions.set(data.trainingSessions);
        this.riskAlerts.set(data.riskAlerts);
        this.performanceTrend.set(data.performanceTrend);
      },
      error: (error) => {
        this.isPageLoading.set(false);
        this.hasPageError.set(true);
        this.logger.error('Error loading dashboard data:', error);
        
        // Set user-friendly error message
        if (error?.status === 401 || error?.status === 403) {
          this.pageErrorMessage.set('Your session has expired. Please log in again.');
        } else if (error?.status >= 500) {
          this.pageErrorMessage.set('The server is temporarily unavailable. Please try again later.');
        } else {
          this.pageErrorMessage.set('Failed to load dashboard data. Please try again.');
        }
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

  /**
   * Check if a player has blocked consent
   */
  isPlayerBlocked(playerId: string): boolean {
    return this.consentInfo().blockedPlayerIds.includes(playerId);
  }

  /**
   * Request data sharing from a player with blocked consent
   */
  requestDataSharing(playerId: string): void {
    this.toastService.info('Sending data sharing request to athlete...');
    this.router.navigate(['/settings/privacy'], { 
      queryParams: { player: playerId, action: 'request' } 
    });
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
