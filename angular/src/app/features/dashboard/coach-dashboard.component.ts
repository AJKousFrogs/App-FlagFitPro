import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { forkJoin } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import {
  GameResult,
  PlayerPerformanceStats,
  RiskAlert,
  TeamOverviewStats,
  TeamStatisticsService,
  TrainingSession,
  UpcomingGame,
} from "../../core/services/team-statistics.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import {
  AppLoadingComponent,
  ButtonComponent,
  CardComponent,
} from "../../shared/components/ui-components";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { DatePipe, DecimalPipe } from "@angular/common";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import { CONSENT_BLOCKED_MESSAGES } from "../../shared/utils/privacy-ux-copy";

/**
 * Interface for consent information returned from API
 */
interface ConsentInfo {
  blockedPlayerIds: string[];
  partialDataNotice?: string;
}

type PlayerFilterType = "all" | "starters" | "injured" | "at_risk";
// SortField reserved for future use
// type SortField = "name" | "position" | "performance" | "acwr" | "readiness";

@Component({
  selector: "app-coach-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    CardModule,
    TableModule,
    TagModule,
    ChartModule,
    DialogModule,
    TooltipModule,
    AvatarModule,
    BadgeModule,
    InputTextModule,
    Textarea,
    DatePicker,
    Select,
    AppLoadingComponent,
    ButtonComponent,
    CardComponent,
    MainLayoutComponent,
    PageErrorStateComponent,
    DatePipe,
    DecimalPipe,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      <app-loading
        [visible]="isPageLoading()"
        variant="skeleton"
        message="Loading coach dashboard..."
      ></app-loading>

      <!-- Error State -->
      @if (hasPageError()) {
        <app-page-error-state
          title="Unable to load dashboard"
          [message]="pageErrorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="dashboard-content section-stack">
          <!-- Lead with Coach Priority Command & Merlin Insight -->
          <section class="priority-command-center">
            <div class="merlin-coach-card">
              <div class="merlin-avatar">
                <i class="pi pi-sparkles"></i>
              </div>
              <div class="merlin-content">
                <h3>Merlin's Team Briefing</h3>
                <p>{{ merlinCoachInsight() }}</p>
                <div class="merlin-actions">
                  <app-button
                    variant="text"
                    size="sm"
                    icon="comments"
                    routerLink="/chat"
                    >Discuss Team Strategy</app-button
                  >
                </div>
              </div>
            </div>

            @if (riskAlerts().length > 0) {
              <div class="priority-athletes-strip">
                <div class="strip-header">
                  <span class="strip-title"
                    ><i class="pi pi-exclamation-triangle"></i> Needs Attention
                    Now</span
                  >
                  <p-badge
                    [value]="riskAlerts().length.toString()"
                    severity="danger"
                  ></p-badge>
                </div>
                <div class="athlete-scroll">
                  @for (alert of riskAlerts(); track alert.playerId) {
                    <div
                      class="priority-athlete-card"
                      (click)="viewPlayer(alert.playerId)"
                    >
                      <p-avatar
                        [label]="getPlayerInitials(alert.playerName)"
                        shape="circle"
                        [style]="{
                          'background-color':
                            alert.severity === 'critical'
                              ? 'var(--red-500)'
                              : 'var(--yellow-500)',
                          color: 'white',
                        }"
                      >
                      </p-avatar>
                      <div class="pa-info">
                        <span class="pa-name">{{ alert.playerName }}</span>
                        <span class="pa-reason">{{ alert.message }}</span>
                      </div>
                      <i class="pi pi-chevron-right"></i>
                    </div>
                  }
                </div>
              </div>
            }
          </section>

          <!-- Header with Team Name & Quick Actions -->
          <div class="dashboard-header compact-header toolbar-row">
            <div class="header-info toolbar-row__start">
              <h1 class="team-name toolbar-row__title">
                <i class="team-icon pi pi-flag"></i>
                {{ teamOverview().teamName }}
              </h1>
              <p class="header-subtitle toolbar-row__subtitle">
                {{ teamOverview().season }} • {{ teamOverview().wins }}-{{
                  teamOverview().losses
                }}
                <span
                  class="streak-badge"
                  [class.winning]="teamOverview().streak.startsWith('W')"
                >
                  {{ teamOverview().streak }}
                </span>
              </p>
            </div>
            <div class="header-actions toolbar-row__end">
              <app-button iconLeft="pi-plus" size="sm" (clicked)="openCreateSession()"
                >Practice</app-button
              >
              <app-button
                iconLeft="pi-send"
                size="sm"
                variant="outlined"
                (clicked)="openTeamMessage()"
                >Message</app-button
              >
            </div>
          </div>

          <!-- Key Stats Row - Refactored for Compactness -->
          <div class="stats-compact-row">
            <div class="sc-item" pTooltip="Average Team Readiness">
              <span class="sc-label">Team Readiness</span>
              <span class="sc-value"
                >{{ teamOverview().practiceAttendanceRate }}%</span
              >
            </div>
            <div class="sc-divider"></div>
            <div class="sc-item" pTooltip="Players in Danger Zone">
              <span class="sc-label">At Risk</span>
              <span
                class="sc-value"
                [class.warning]="teamOverview().playersAtRisk > 0"
                >{{ teamOverview().playersAtRisk }}</span
              >
            </div>
            <div class="sc-divider"></div>
            <div class="sc-item" pTooltip="Current Injuries">
              <span class="sc-label">Injured</span>
              <span
                class="sc-value"
                [class.warning]="teamOverview().injuredPlayers > 0"
                >{{ teamOverview().injuredPlayers }}</span
              >
            </div>
            <div class="sc-divider"></div>
            <div class="sc-item" pTooltip="Team Chemistry Score">
              <span class="sc-label">Chemistry</span>
              <span class="sc-value">{{
                teamOverview().teamChemistry | number: "1.1-1"
              }}</span>
            </div>
          </div>

          <!-- Main Content Grid - Streamlined for Phase 2 -->
          @if (hasBlockedPlayers()) {
            <div class="partial-data-notice">
              <div class="notice-icon">
                <i class="pi pi-info-circle"></i>
              </div>
              <div class="notice-content">
                <h4>{{ partialDataMessage().title }}</h4>
                <p>{{ partialDataMessage().reason }}</p>
                <a
                  [routerLink]="partialDataMessage().helpLink"
                  class="notice-link"
                >
                  <i class="pi pi-external-link"></i>
                  {{ partialDataMessage().actionLabel }}
                </a>
              </div>
            </div>
          }

          <!-- Main Content Grid - Streamlined for Phase 2 -->
          <div class="dashboard-workspace">
            <!-- Left Workspace: Roster & Performance -->
            <div class="workspace-main">
              <app-card [flush]="true">
                <div class="workspace-tabs-header">
                  <div class="tab-triggers">
                    <button
                      class="tab-trigger"
                      [class.active]="activeTab === 'roster'"
                      (click)="activeTab = 'roster'"
                    >
                      <i class="pi pi-users"></i> Team Roster
                    </button>
                    <button
                      class="tab-trigger"
                      [class.active]="activeTab === 'analytics'"
                      (click)="activeTab = 'analytics'"
                    >
                      <i class="pi pi-chart-line"></i> Performance
                    </button>
                  </div>
                  <div class="tab-actions">
                    <app-button
                      variant="text"
                      size="sm"
                      icon="external-link"
                      ariaLabel="Open analytics"
                      (clicked)="navigateToAnalytics()"
                    ></app-button>
                  </div>
                </div>

                <div class="tab-content">
                  @if (activeTab === "roster") {
                    <div class="roster-workspace">
                      <div class="workspace-filters">
                        <app-button
                          [variant]="
                            playerFilter() === 'all' ? 'primary' : 'text'
                          "
                          size="sm"
                          (clicked)="setPlayerFilter('all')"
                          >All</app-button
                        >
                        <app-button
                          [variant]="
                            playerFilter() === 'at_risk' ? 'danger' : 'text'
                          "
                          size="sm"
                          (clicked)="setPlayerFilter('at_risk')"
                          >At Risk</app-button
                        >
                        <app-button
                          [variant]="
                            playerFilter() === 'injured' ? 'danger' : 'text'
                          "
                          size="sm"
                          (clicked)="setPlayerFilter('injured')"
                          >Injured</app-button
                        >
                      </div>

                      <p-table
                        [value]="filteredPlayers()"
                        [paginator]="filteredPlayers().length > 10"
                        [rows]="10"
                        styleClass="p-datatable-sm"
                        [rowHover]="true"
                      >
                        <ng-template pTemplate="header">
                          <tr>
                            <th pSortableColumn="playerName">Player</th>
                            <th pSortableColumn="position">Pos</th>
                            <th pSortableColumn="performanceScore">Perf</th>
                            <th pSortableColumn="acwr">ACWR</th>
                            <th pSortableColumn="readiness">Ready</th>
                            <th>Status</th>
                          </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-player>
                          <tr
                            (click)="viewPlayer(player.playerId)"
                            class="clickable-row"
                          >
                            <td>
                              <div class="player-cell">
                                <p-avatar
                                  [label]="player.avatarInitials"
                                  shape="circle"
                                  [style]="getAvatarStyle(player)"
                                ></p-avatar>
                                <div class="player-info">
                                  <span class="player-name">{{
                                    player.playerName
                                  }}</span>
                                  <span class="jersey-number"
                                    >#{{ player.jerseyNumber || "--" }}</span
                                  >
                                </div>
                              </div>
                            </td>
                            <td>
                              <p-tag
                                [value]="player.position"
                                [severity]="
                                  getPositionSeverity(player.position)
                                "
                              ></p-tag>
                            </td>
                            <td>
                              <span
                                class="perf-score"
                                [class]="
                                  getPerformanceClass(player.performanceScore)
                                "
                                >{{ player.performanceScore }}%</span
                              >
                            </td>
                            <td>
                              <span [class]="getACWRClass(player.acwr)">{{
                                player.acwr | number: "1.2-2"
                              }}</span>
                            </td>
                            <td>
                              <div class="readiness-compact">
                                <div
                                  class="r-dot"
                                  [class]="
                                    getReadinessBarClass(player.readiness)
                                  "
                                ></div>
                                <span>{{ player.readiness }}</span>
                              </div>
                            </td>
                            <td>
                              <p-tag
                                [value]="getStatusLabel(player.status)"
                                [severity]="getStatusSeverity(player.status)"
                              ></p-tag>
                            </td>
                          </tr>
                        </ng-template>
                      </p-table>
                    </div>
                  }

                  @if (activeTab === "analytics") {
                    <div class="analytics-workspace">
                      <div class="analytics-hero">
                        <div class="chart-container">
                          @if (performanceChartData()) {
                            <p-chart
                              type="line"
                              [data]="performanceChartData()"
                              [options]="lineChartOptions"
                              [style]="{ height: '200px' }"
                            ></p-chart>
                          }
                        </div>
                        <div class="hero-stats">
                          <div class="h-stat">
                            <span class="h-label">Current Strength</span>
                            <span class="h-value"
                              >{{ latestPerformanceScore() }}%</span
                            >
                          </div>
                          <div class="h-stat">
                            <span class="h-label">Attendance</span>
                            <span class="h-value"
                              >{{
                                teamOverview().practiceAttendanceRate
                              }}%</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </app-card>
            </div>

            <!-- Right Workspace: Schedule & Quick -->
            <div class="workspace-side">
              <app-card
                title="Today schedule"
                headerIcon="pi-calendar"
                [compact]="true"
              >
                <div class="schedule-mini">
                  @for (
                    game of upcomingGames().slice(0, 2);
                    track game.gameId
                  ) {
                    <div class="mini-event game">
                      <div class="ev-date">
                        <span class="d">{{ game.date | date: "d" }}</span>
                        <span class="m">{{ game.date | date: "MMM" }}</span>
                      </div>
                      <div class="ev-info">
                        <span class="t">vs {{ game.opponent }}</span>
                        <span class="s">Game Day</span>
                      </div>
                    </div>
                  }
                  @for (
                    session of trainingSessions().slice(0, 2);
                    track session.sessionId
                  ) {
                    <div class="mini-event practice">
                      <div class="ev-date">
                        <span class="d">{{ session.date | date: "d" }}</span>
                        <span class="m">{{ session.date | date: "MMM" }}</span>
                      </div>
                      <div class="ev-info">
                        <span class="t">{{ session.title }}</span>
                        <span class="s">{{ session.time }}</span>
                      </div>
                    </div>
                  }
                </div>
                <div class="card-footer">
                  <app-button
                    variant="text"
                    size="sm"
                    [fullWidth]="true"
                    routerLink="/calendar"
                    >Full Schedule</app-button
                  >
                </div>
              </app-card>

              <div class="quick-command-grid">
                <app-button
                  variant="outlined"
                  icon="calendar-plus"
                  (clicked)="openCreateSession()"
                  >New Practice</app-button
                >
                <app-button
                  variant="outlined"
                  icon="send"
                  (clicked)="openTeamMessage()"
                  >Msg Team</app-button
                >
                <app-button
                  variant="outlined"
                  icon="heart"
                  (clicked)="viewInjuryReport()"
                  >Injuries</app-button
                >
                <app-button
                  variant="outlined"
                  icon="users"
                  (clicked)="manageRoster()"
                  >Roster</app-button
                >
              </div>
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
              <label for="coach-sessionTitle">Session Title</label>
              <input
                id="coach-sessionTitle"
                name="sessionTitle"
                type="text"
                pInputText
                [(ngModel)]="newSession.title"
                placeholder="e.g., Offensive Drills"
                class="w-full"
                autocomplete="off"
              />
            </div>
            <div class="form-field">
              <label for="coach-sessionType">Type</label>
              <p-select
                inputId="coach-sessionType"
                [(ngModel)]="newSession.type"
                [options]="sessionTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-field">
              <label for="coach-sessionDate">Date & Time</label>
              <p-datepicker
                inputId="coach-sessionDate"
                [(ngModel)]="newSession.date"
                [showTime]="true"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                styleClass="w-full"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label for="coach-sessionDuration">Duration (minutes)</label>
              <input
                id="coach-sessionDuration"
                name="sessionDuration"
                type="number"
                pInputText
                [(ngModel)]="newSession.duration"
                placeholder="90"
                class="w-full"
                autocomplete="off"
              />
            </div>
            <div class="form-field">
              <label for="coach-sessionNotes">Notes</label>
              <textarea
                pTextarea
                id="coach-sessionNotes"
                name="sessionNotes"
                [(ngModel)]="newSession.notes"
                placeholder="Session notes..."
                rows="3"
                class="w-full"
                autocomplete="off"
              ></textarea>
            </div>
          </div>
          <ng-template pTemplate="footer">
            <app-button
              variant="text"
              (clicked)="showCreateSessionDialog = false"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="createSession()"
              >Create</app-button
            >
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
            <app-button variant="text" (clicked)="showTeamMessageDialog = false"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-send" (clicked)="sendTeamMessage()"
              >Send</app-button
            >
          </ng-template>
        </p-dialog>
      }
      <!-- End of @else for content -->
    </app-main-layout>
  `,
  styleUrls: ["./coach-dashboard.component.scss"],
})
export class CoachDashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly headerService = inject(HeaderService);
  private readonly teamStatsService = inject(TeamStatisticsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // Workspace state
  activeTab: "roster" | "analytics" = "roster";

  // Runtime guard signals - prevent white screen crashes
  isPageLoading = signal<boolean>(true);
  hasPageError = signal<boolean>(false);
  pageErrorMessage = signal<string>(
    "Something went wrong while loading the dashboard. Please try again.",
  );

  // Data signals
  teamOverview = signal<TeamOverviewStats>({
    teamId: "",
    teamName: "Loading...",
    season: new Date().getFullYear().toString(),
    wins: 0,
    losses: 0,
    ties: 0,
    winPercentage: 0,
    streak: "-",
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
  performanceTrend = signal<{ labels: string[]; scores: number[] }>({
    labels: [],
    scores: [],
  });

  // Consent blocked players tracking
  consentInfo = signal<ConsentInfo>({ blockedPlayerIds: [] });

  // UI state
  playerFilter = signal<PlayerFilterType>("all");
  showCreateSessionDialog = false;
  showTeamMessageDialog = false;
  teamMessageContent = "";

  // New session form
  newSession = {
    title: "",
    type: "practice",
    date: new Date(),
    duration: 90,
    notes: "",
  };

  sessionTypes = [
    { label: "Practice", value: "practice" },
    { label: "Game Prep", value: "game_prep" },
    { label: "Conditioning", value: "conditioning" },
    { label: "Film Study", value: "film_study" },
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
  merlinCoachInsight = computed(() => {
    const alerts = this.riskAlerts();
    const overview = this.teamOverview();
    const injured = this.injuredCount();

    if (alerts.length > 3) {
      return `Coach, we have ${alerts.length} athletes at high risk today. I recommend adjusting the intensity of today's practice to prevent further injuries.`;
    }

    if (injured > 0) {
      return `With ${injured} athletes currently injured, we should focus on position-specific modifications for the upcoming sessions.`;
    }

    if (overview.avgTeamWorkload > 1.3) {
      return `Team-wide ACWR is trending high (${overview.avgTeamWorkload.toFixed(2)}). Consider a deload week to maintain performance for the end of the season.`;
    }

    return "The squad is looking sharp today! Compliance is high, and readiness scores are optimal. Great day for a high-intensity session.";
  });

  filteredPlayers = computed(() => {
    const filter = this.playerFilter();
    const allPlayers = this.players();

    switch (filter) {
      case "injured":
        return allPlayers.filter((p) => p.status === "injured");
      case "at_risk":
        return allPlayers.filter(
          (p) => p.riskLevel === "high" || p.status === "at_risk",
        );
      default:
        return allPlayers;
    }
  });

  atRiskCount = computed(
    () =>
      this.players().filter(
        (p) => p.riskLevel === "high" || p.status === "at_risk",
      ).length,
  );

  injuredCount = computed(
    () => this.players().filter((p) => p.status === "injured").length,
  );

  performanceChartData = computed(() => {
    const trend = this.performanceTrend();
    if (!trend.labels.length) return null;

    return {
      labels: trend.labels,
      datasets: [
        {
          label: "Team Performance",
          data: trend.scores,
          borderColor: "rgb(var(--primary-500))",
          backgroundColor: "rgba(var(--primary-500), 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
      ],
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
  readonly partialDataMessage = computed(() => {
    return CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;
  });

  constructor() {
    // Initialize on construction (Angular 21 pattern)
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
    const teamId = user?.id || "default";

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
              partialDataNotice:
                data.players.dataState === "partial"
                  ? "Some player data is hidden due to privacy settings."
                  : undefined,
            });
          } else if (data.overview.consentInfo) {
            // Fallback to overview consent info
            this.consentInfo.set({
              blockedPlayerIds: data.overview.consentInfo.blockedPlayerIds,
              partialDataNotice:
                data.overview.dataState === "partial"
                  ? "Some player data is hidden due to privacy settings."
                  : undefined,
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
          this.logger.error("Error loading dashboard data:", error);

          // Set user-friendly error message
          if (error?.status === 401 || error?.status === 403) {
            this.pageErrorMessage.set(
              "Your session has expired. Please log in again.",
            );
          } else if (error?.status >= 500) {
            this.pageErrorMessage.set(
              "The server is temporarily unavailable. Please try again later.",
            );
          } else {
            this.pageErrorMessage.set(
              "Failed to load dashboard data. Please try again.",
            );
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
    this.router.navigate(["/roster"], { queryParams: { player: playerId } });
  }

  viewPlayerStats(playerId: string): void {
    this.router.navigate(["/analytics"], { queryParams: { player: playerId } });
  }

  adjustPlayerLoad(playerId: string): void {
    this.toastService.info("Opening load adjustment for player...");
    this.router.navigate(["/training"], {
      queryParams: { player: playerId, action: "adjust-load" },
    });
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
    this.toastService.info("Sending data sharing request to athlete...");
    this.router.navigate(["/settings/privacy"], {
      queryParams: { player: playerId, action: "request" },
    });
  }

  navigateToAnalytics(): void {
    this.router.navigate(["/analytics"]);
  }

  viewAllStats(): void {
    this.router.navigate(["/analytics"]);
  }

  viewInjuryReport(): void {
    this.router.navigate(["/roster"], { queryParams: { filter: "injured" } });
  }

  manageRoster(): void {
    this.router.navigate(["/roster"]);
  }

  scheduleGame(): void {
    this.router.navigate(["/game-tracker"], {
      queryParams: { action: "schedule" },
    });
  }

  // Dialog methods
  openCreateSession(): void {
    this.newSession = {
      title: "",
      type: "practice",
      date: new Date(),
      duration: 90,
      notes: "",
    };
    this.showCreateSessionDialog = true;
  }

  createSession(): void {
    if (!this.newSession.title) {
      this.toastService.warn("Please enter a session title");
      return;
    }

    this.toastService.success(
      `Training session "${this.newSession.title}" created`,
    );
    this.showCreateSessionDialog = false;
    // In real implementation, would call API to create session
  }

  openTeamMessage(): void {
    this.teamMessageContent = "";
    this.showTeamMessageDialog = true;
  }

  sendTeamMessage(): void {
    if (!this.teamMessageContent.trim()) {
      this.toastService.warn("Please enter a message");
      return;
    }

    this.toastService.success("Message sent to team");
    this.showTeamMessageDialog = false;
    // In real implementation, would call API to send message
  }

  // Helper methods
  getPlayerInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarStyle(player: PlayerPerformanceStats): Record<string, string> {
    if (player.status === "injured") {
      return { "background-color": "var(--red-500)", color: "white" };
    }
    if (player.riskLevel === "high") {
      return { "background-color": "var(--orange-500)", color: "white" };
    }
    return {
      "background-color": "var(--primary-100)",
      color: "var(--primary-700)",
    };
  }

  getPositionSeverity(
    position: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const positionColors: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      QB: "success",
      WR: "info",
      RB: "warn",
      DB: "secondary",
      Rusher: "danger",
    };
    return positionColors[position] || "info";
  }

  getPerformanceClass(score: number): string {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    return "poor";
  }

  getTrendIcon(trend: "up" | "down" | "stable"): string {
    const icons = {
      up: "pi pi-arrow-up",
      down: "pi pi-arrow-down",
      stable: "pi pi-minus",
    };
    return icons[trend];
  }

  getACWRClass(acwr: number): string {
    if (acwr <= 1.0) return "acwr-safe";
    if (acwr <= 1.3) return "acwr-moderate";
    if (acwr <= 1.5) return "acwr-high";
    return "acwr-danger";
  }

  getReadinessBarClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: "Active",
      injured: "Injured",
      inactive: "Inactive",
      at_risk: "At Risk",
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    const severities: Record<string, "success" | "info" | "warn" | "danger"> = {
      active: "success",
      injured: "danger",
      inactive: "info",
      at_risk: "warn",
    };
    return severities[status] || "info";
  }

  getCountdownLabel(days: number): string {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  }

  getSessionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      practice: "Practice",
      game_prep: "Game Prep",
      conditioning: "Conditioning",
      film_study: "Film Study",
    };
    return labels[type] || type;
  }

  getSessionStatusSeverity(
    status: string,
  ): "success" | "info" | "warn" | "danger" {
    const severities: Record<string, "success" | "info" | "warn" | "danger"> = {
      scheduled: "info",
      in_progress: "warn",
      completed: "success",
      cancelled: "danger",
    };
    return severities[status] || "info";
  }
}
