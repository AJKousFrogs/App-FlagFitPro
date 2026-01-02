import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MenuModule } from "primeng/menu";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { MenuItem } from "primeng/api";
import { DataSourceBannerComponent } from "../../shared/components/data-source-banner/data-source-banner.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { LiveIndicatorComponent } from "../../shared/components/live-indicator/live-indicator.component";
import { NoDataEntryComponent } from "../../shared/components/no-data-entry/no-data-entry.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { PageLoadingStateComponent } from "../../shared/components/page-loading-state/page-loading-state.component";
import { ReadinessWidgetComponent } from "../../shared/components/readiness-widget/readiness-widget.component";
import {
  TrafficLightIndicatorComponent,
  TrafficLightStatus,
} from "../../shared/components/traffic-light-indicator/traffic-light-indicator.component";
import { TrafficLightRiskComponent } from "../../shared/components/traffic-light-risk/traffic-light-risk.component";
import {
  TrendCardComponent,
  TrendData,
} from "../../shared/components/trend-card/trend-card.component";
// Core Services
import { AcwrService } from "../../core/services/acwr.service";
import { AuthService } from "../../core/services/auth.service";
import {
  DATA_REQUIREMENTS,
  DataSourceService,
  DataState,
} from "../../core/services/data-source.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TrainingDataService } from "../../core/services/training-data.service";
import { TrendsService } from "../../core/services/trends.service";
import { ActionableInsightsComponent } from "../../shared/components/actionable-insights/actionable-insights.component";
import { GameDayCountdownComponent } from "../../shared/components/game-day-countdown/game-day-countdown.component";
import { MorningBriefingComponent } from "../../shared/components/morning-briefing/morning-briefing.component";
import { RealtimeBaseComponent } from "../../shared/components/realtime-base.component";
import { TournamentModeWidgetComponent } from "../../shared/components/tournament-mode-widget/tournament-mode-widget.component";
import { DailyMetricsLogComponent } from "./components/daily-metrics-log.component";
// New Dashboard Widgets
import { TodaysScheduleComponent } from "../../shared/components/todays-schedule/todays-schedule.component";
import { SupplementTrackerComponent } from "../../shared/components/supplement-tracker/supplement-tracker.component";
import { HydrationTrackerComponent } from "../../shared/components/hydration-tracker/hydration-tracker.component";
import { BodyCompositionCardComponent } from "../../shared/components/body-composition-card/body-composition-card.component";

// Type for training session data
interface TrainingSession {
  rpe?: number;
  intensity_level?: number;
  duration_minutes?: number;
  duration?: number;
  session_date?: string;
  date?: string;
  session_type?: string;
  type?: string;
}

@Component({
  selector: "app-athlete-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    MenuModule,
    MainLayoutComponent,
    // Status Layer
    MorningBriefingComponent,
    TournamentModeWidgetComponent,
    GameDayCountdownComponent,
    TrafficLightRiskComponent,
    // Actions Layer
    TodaysScheduleComponent,
    SupplementTrackerComponent,
    DailyMetricsLogComponent,
    // Tracking Layer
    BodyCompositionCardComponent,
    HydrationTrackerComponent,
    TrendCardComponent,
    ReadinessWidgetComponent,
    // Live indicator
    LiveIndicatorComponent,
    // Runtime guard components
    PageErrorStateComponent,
    PageLoadingStateComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Loading State -->
      @if (isLoading()) {
        <app-page-loading-state
          message="Loading your dashboard..."
          variant="skeleton"
        ></app-page-loading-state>
      }

      <!-- Error State -->
      @else if (hasError()) {
        <app-page-error-state
          [title]="errorTitle()"
          [message]="errorMessage()"
          (retry)="retryLoad()"
        ></app-page-error-state>
      }

      <!-- Content -->
      @else {
        <div class="dashboard-content">
          <!-- ═══════════════════════════════════════════════════════════════
               LAYER 1: TODAY'S STATUS (Passive, read-only)
               Shows current state - ACWR, Readiness, Injury Risk, Hydration
          ═══════════════════════════════════════════════════════════════ -->
          <section class="dashboard-layer layer-status">
            <!-- Morning Briefing with integrated KPIs -->
            <app-morning-briefing></app-morning-briefing>

            <!-- Tournament Mode Widget - Shows when in active tournament -->
            <app-tournament-mode-widget></app-tournament-mode-widget>

            <!-- Game Day Countdown - Shows when game is within 48 hours -->
            @if (upcomingGame()) {
              <app-game-day-countdown
                [game]="upcomingGame()"
              ></app-game-day-countdown>
            }

            <!-- Injury Risk - Compact horizontal view -->
            <div class="status-card injury-risk-compact">
              <app-traffic-light-risk
                [riskZone]="acwrRiskZoneFull()"
                [acwrValue]="acwrValue()"
              ></app-traffic-light-risk>
            </div>
          </section>

          <!-- ═══════════════════════════════════════════════════════════════
               LAYER 2: TODAY'S ACTIONS (Primary interaction)
               What you need to do today - Schedule, Supplements, Log Session
          ═══════════════════════════════════════════════════════════════ -->
          <section class="dashboard-layer layer-actions">
            <div class="layer-header">
              <h2 class="layer-title">Today's Actions</h2>
              @if (isFirstTimeUser()) {
                <span class="layer-badge badge-new">Get Started</span>
              }
            </div>

            <!-- First-time user: Single primary CTA -->
            @if (isFirstTimeUser()) {
              <div class="onboarding-cta">
                <div class="onboarding-content">
                  <div class="onboarding-icon">
                    <i class="pi pi-flag"></i>
                  </div>
                  <div class="onboarding-text">
                    <h3>You're at the starting line</h3>
                    <p>Log your first training session to activate insights and injury tracking.</p>
                  </div>
                </div>
                <p-button
                  label="Log First Session"
                  icon="pi pi-plus"
                  severity="success"
                  size="large"
                  routerLink="/training/log"
                  styleClass="onboarding-btn"
                ></p-button>
              </div>
            }

            <!-- Actions Grid: Schedule + Supplements -->
            <div class="actions-grid">
              <div class="action-col">
                <app-todays-schedule></app-todays-schedule>
              </div>
              <div class="action-col">
                <app-supplement-tracker></app-supplement-tracker>
              </div>
            </div>

            <!-- Quick Actions Row (Secondary) -->
            <div class="quick-actions-row">
              <button
                class="quick-action-btn secondary"
                (click)="openDailyMetricsLog()"
              >
                <i class="pi pi-chart-line"></i>
                <span>Log Metrics</span>
              </button>
              <button
                class="quick-action-btn secondary"
                routerLink="/wellness"
              >
                <i class="pi pi-heart"></i>
                <span>Wellness Check</span>
              </button>
              @if (hasUpcomingGame()) {
                <button
                  class="quick-action-btn highlight"
                  routerLink="/game/readiness"
                >
                  <i class="pi pi-flag"></i>
                  <span>Game Day</span>
                </button>
              }
            </div>
          </section>

          <!-- ═══════════════════════════════════════════════════════════════
               LAYER 3: LONG-TERM TRACKING (Secondary)
               Body Composition, Training History, Trends
          ═══════════════════════════════════════════════════════════════ -->
          <section class="dashboard-layer layer-tracking">
            <div class="layer-header">
              <h2 class="layer-title">Tracking</h2>
              <span class="layer-subtitle">Long-term progress</span>
            </div>

            <!-- Tracking Grid: Body Comp + Hydration (compact) -->
            <div class="tracking-grid">
              <div class="tracking-col">
                <app-body-composition-card></app-body-composition-card>
              </div>
              <div class="tracking-col">
                <app-hydration-tracker></app-hydration-tracker>
              </div>
            </div>

            <!-- Performance Trends (collapsed if no data) -->
            @if (!isFirstTimeUser() && hasTrendData()) {
              <div class="trends-section">
                <h3 class="subsection-title">Performance Trends</h3>
                <div class="trends-grid">
                  @for (trend of trendCards(); track trend.title) {
                    <app-trend-card [data]="trend"></app-trend-card>
                  }
                </div>
              </div>
            } @else if (!isFirstTimeUser()) {
              <!-- Muted placeholder for trends -->
              <div class="trends-placeholder">
                <i class="pi pi-chart-line"></i>
                <span>Trends will appear after logging more sessions</span>
              </div>
            }

            <!-- Readiness Widget (if user has data) -->
            @if (!isFirstTimeUser() && athleteId()) {
              <div class="readiness-section">
                <app-readiness-widget
                  [athleteId]="athleteId()!"
                ></app-readiness-widget>
              </div>
            }
          </section>

          <!-- Live Indicator -->
          <div class="live-status">
            <app-live-indicator
              [isLive]="realtimeService.isConnected()"
            ></app-live-indicator>
          </div>
        </div>
      }
      <!-- End of @else for content -->

      <!-- Daily Metrics Log Dialog -->
      @if (showDailyMetricsLog()) {
        <app-daily-metrics-log
          (close)="closeDailyMetricsLog()"
          (saved)="onMetricsSaved()"
        ></app-daily-metrics-log>
      }
    </app-main-layout>
  `,
  styleUrls: ["./athlete-dashboard.component.scss"],
})
export class AthleteDashboardComponent
  extends RealtimeBaseComponent
  implements OnInit
{
  private authService = inject(AuthService);
  private acwrService = inject(AcwrService);
  private readinessService = inject(ReadinessService);
  private trendsService = inject(TrendsService);
  private headerService = inject(HeaderService);
  private trainingDataService = inject(TrainingDataService);
  private dataSourceService = inject(DataSourceService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private supabaseService = inject(SupabaseService);

  // Runtime guard signals - prevent white screen crashes
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  errorTitle = signal<string>("Unable to load dashboard");
  errorMessage = signal<string>(
    "Something went wrong while loading your dashboard. Please try again.",
  );

  athleteId = signal<string | undefined>(undefined);
  todayWorkload = signal<number>(0);
  nextSession = signal<{ title: string; date: Date } | null>(null);
  trendCards = signal<TrendData[]>([]);

  // Game day detection - show Game Day Check-in button when game is within 2 days
  hasUpcomingGame = signal<boolean>(false);

  // Upcoming game data for countdown widget
  upcomingGame = signal<{
    id: string;
    opponent: string;
    date: Date;
    time: string;
    location: string;
    isHome: boolean;
  } | null>(null);

  // Data source tracking - CRITICAL FOR ATHLETE SAFETY
  totalTrainingSessions = signal<number>(0);
  dataState = computed(() => {
    const count = this.totalTrainingSessions();
    if (count === 0) return DataState.NO_DATA;
    if (count < 28) return DataState.INSUFFICIENT_DATA;
    return DataState.REAL_DATA;
  });
  isFirstTimeUser = computed(() => this.dataSourceService.isFirstTimeUser());
  hasTrendData = computed(
    () => this.trendCards().length > 0 && !this.isFirstTimeUser(),
  );

  // Daily metrics log dialog
  showDailyMetricsLog = signal<boolean>(false);

  acwrValue = computed(() => this.acwrService.acwrRatio());
  acwrRiskZone = computed(() => this.acwrService.riskZone().label);
  acwrRiskZoneFull = computed(() => this.acwrService.riskZone());

  acwrStatus = computed<TrafficLightStatus>(() => {
    const ratio = this.acwrValue();
    if (ratio === 0) return "yellow";
    if (ratio < 0.8) return "orange";
    if (ratio <= 1.3) return "green";
    if (ratio <= 1.5) return "yellow";
    return "red";
  });

  readinessScore = computed(() => this.readinessService.current()?.score || 0);
  readinessLevel = computed(
    () => this.readinessService.current()?.level || "moderate",
  );

  readinessStatus = computed<TrafficLightStatus>(() => {
    const score = this.readinessScore();
    if (score >= 75) return "green";
    if (score >= 55) return "yellow";
    return "red";
  });

  // Quick actions menu items (Decision 33: overflow menu for secondary actions)
  quickActionItems = computed<MenuItem[]>(() => [
    {
      label: "Quick Wellness",
      icon: "pi pi-heart",
      routerLink: "/wellness",
    },
    {
      label: "Log Performance",
      icon: "pi pi-bolt",
      routerLink: "/performance-tracking",
    },
    {
      label: "Today's Practice",
      icon: "pi pi-play",
      routerLink: "/training/daily",
    },
    { separator: true },
    {
      label: "View Training History",
      icon: "pi pi-history",
      routerLink: "/training/history",
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      routerLink: "/settings",
    },
  ]);

  ngOnInit(): void {
    this.headerService.setDashboardHeader();
    this.initializeDashboard();
  }

  /**
   * Initialize dashboard with error handling
   */
  private initializeDashboard(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      this.loadDashboardData();
      this.setupRealtimeSubscriptions();
      this.checkDataSource();
      this.checkForUpcomingGame();

      // Set loading to false after initial data load attempt
      // Individual data loads handle their own errors gracefully
      setTimeout(() => this.isLoading.set(false), 500);
    } catch (error) {
      this.handleInitError(error);
    }
  }

  /**
   * Handle initialization errors
   */
  private handleInitError(error: unknown): void {
    this.isLoading.set(false);
    this.hasError.set(true);
    this.errorTitle.set("Unable to load dashboard");

    if (error instanceof Error) {
      this.logger.error("[AthleteDashboard] Init error:", error.message);
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        this.errorMessage.set(
          "Unable to connect to the server. Please check your internet connection.",
        );
      } else if (
        error.message.includes("auth") ||
        error.message.includes("401")
      ) {
        this.errorMessage.set("Your session has expired. Please log in again.");
      } else {
        this.errorMessage.set(
          "Something went wrong while loading your dashboard. Please try again.",
        );
      }
    } else {
      this.errorMessage.set("An unexpected error occurred. Please try again.");
    }
  }

  /**
   * Retry loading the dashboard
   */
  retryLoad(): void {
    this.initializeDashboard();
  }

  /**
   * Check if athlete has a game within the next 2 days
   * Shows Game Day Check-in button for pre-competition readiness
   */
  private async checkForUpcomingGame(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    try {
      // Check for games in the next 2 days
      const today = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(today.getDate() + 2);

      // Use correct column names: opponent_name instead of opponent, home_away instead of is_home
      const { data: games } = await this.supabaseService.client
        .from("games")
        .select("id, game_date, opponent_name, location, status, home_away")
        .gte("game_date", today.toISOString().split("T")[0])
        .lte("game_date", twoDaysFromNow.toISOString().split("T")[0])
        .order("game_date", { ascending: true })
        .limit(1);

      if (games && games.length > 0) {
        this.hasUpcomingGame.set(true);
        const game = games[0];
        this.upcomingGame.set({
          id: game.id,
          opponent: game.opponent_name || "TBD",
          date: new Date(game.game_date),
          time: "12:00 PM", // game_time column doesn't exist
          location: game.location || "TBD",
          isHome: game.home_away === "home",
        });
        this.logger.info(
          "[Dashboard] Upcoming game detected - showing Game Day Check-in",
        );
      } else {
        // Also check team_members for tournament availability
        const { data: teamMember } = await this.supabaseService.client
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId)
          .single();

        if (teamMember?.team_id) {
          // Use 'games' table with team_id filter (team_games doesn't exist)
          const { data: teamGames } = await this.supabaseService.client
            .from("games")
            .select("id, game_date, opponent_name, location, home_away")
            .eq("team_id", teamMember.team_id)
            .gte("game_date", today.toISOString().split("T")[0])
            .lte("game_date", twoDaysFromNow.toISOString().split("T")[0])
            .order("game_date", { ascending: true })
            .limit(1);

          if (teamGames && teamGames.length > 0) {
            this.hasUpcomingGame.set(true);
            const game = teamGames[0];
            this.upcomingGame.set({
              id: game.id,
              opponent: game.opponent_name || "TBD",
              date: new Date(game.game_date),
              time: "12:00 PM", // game_time column doesn't exist
              location: game.location || "TBD",
              isHome: game.home_away === "home",
            });
          }
        }
      }
    } catch (error) {
      // If tables don't exist or query fails, show no upcoming game
      this.hasUpcomingGame.set(false);
      this.upcomingGame.set(null);
    }
  }

  /**
   * Check data source to determine if user has real data
   * CRITICAL: This prevents showing mock data that could lead to injury
   */
  private checkDataSource(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    // Check how many training sessions the user has logged
    this.trainingDataService
      .getTrainingSessions({ limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions) => {
          const count = sessions?.length || 0;
          this.totalTrainingSessions.set(count);

          // Update global data source service
          this.dataSourceService.checkUserHasRealData(count);

          // Register ACWR metric requirements
          this.dataSourceService.registerMetric(
            "acwr",
            DATA_REQUIREMENTS.acwr.name,
            count,
            DATA_REQUIREMENTS.acwr.minimumDataPoints,
            count > 0 ? "real" : "unknown",
          );

          // Register readiness metric requirements
          this.dataSourceService.registerMetric(
            "readiness",
            DATA_REQUIREMENTS.readiness.name,
            count,
            DATA_REQUIREMENTS.readiness.minimumDataPoints,
            count > 0 ? "real" : "unknown",
          );

          this.logger.info(
            `[Dashboard] User has ${count} training sessions logged`,
          );
        },
        error: () => {
          this.dataSourceService.checkUserHasRealData(0);
        },
      });
  }

  /**
   * Set up real-time subscriptions for live data updates
   */
  private setupRealtimeSubscriptions(): void {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    // Subscribe to training sessions updates
    const trainingUnsub = this.realtimeService.subscribeToTrainingSessions(
      (event) => {
        this.logger.debug("🔴 LIVE: Training session updated", event);
        // Reload today's workload when training data changes
        this.loadTodayWorkload(userId);
        this.loadNextSession(userId);
      },
    );
    this.addSubscription(trainingUnsub);

    // Subscribe to readiness updates
    const readinessUnsub = this.realtimeService.subscribeToReadiness(
      (event) => {
        this.logger.debug("🔴 LIVE: Readiness updated", event);
        // Reload readiness when it changes
        this.readinessService
          .calculateToday(userId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      },
    );
    this.addSubscription(readinessUnsub);

    // Subscribe to performance metrics updates
    const performanceUnsub = this.realtimeService.subscribeToPerformance(
      (event) => {
        this.logger.debug("🔴 LIVE: Performance metrics updated", event);
        // Reload trends when performance data changes
        this.loadTrends(userId);
      },
    );
    this.addSubscription(performanceUnsub);

    this.logger.debug(
      "✅ Real-time subscriptions active for athlete dashboard",
    );
  }

  loadDashboardData(): void {
    const user = this.authService.getUser();
    const userId = user?.id;

    if (!userId) return;

    this.athleteId.set(userId);

    // Load today's workload
    this.loadTodayWorkload(userId);

    // Load next session
    this.loadNextSession(userId);

    // Load readiness
    this.readinessService
      .calculateToday(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Load trend data
    this.loadTrends(userId);
  }

  loadTodayWorkload(userId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Use TrainingDataService for consistent data access
    this.trainingDataService
      .getTrainingSessions({
        startDate: todayStr,
        endDate: todayStr,
        limit: 50,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions: TrainingSession[]) => {
          const workload = sessions.reduce(
            (sum: number, session: TrainingSession) => {
              const rpe = session.rpe || session.intensity_level || 0;
              const duration =
                session.duration_minutes || session.duration || 0;
              return sum + rpe * duration;
            },
            0,
          );
          this.todayWorkload.set(workload);
        },
        error: () => {
          this.todayWorkload.set(0);
        },
      });
  }

  loadNextSession(_userId: string): void {
    // Use TrainingDataService with includeUpcoming flag
    this.trainingDataService
      .getTrainingSessions({
        includeUpcoming: true,
        limit: 1,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions: TrainingSession[]) => {
          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            const sessionDate = session.session_date || session.date;
            if (sessionDate) {
              this.nextSession.set({
                title:
                  session.session_type || session.type || "Training Session",
                date: new Date(sessionDate),
              });
            }
          }
        },
        error: () => {
          this.nextSession.set(null);
        },
      });
  }

  loadTrends(userId: string): void {
    const trends: TrendData[] = [];

    // Load change of direction trend
    this.trendsService
      .getChangeOfDirectionTrend(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          trends.push({
            title: "Change of Direction Sessions",
            subtitle: "Last 4 weeks",
            value: data.current,
            change: this.trendsService.calculateChange(
              data.current,
              data.previous,
            ),
            changeLabel: "vs previous 4 weeks",
            icon: "pi-sync",
          });
          this.trendCards.set([...trends]);
        },
        error: () => {
          // No trend data available
          this.logger.debug("No change of direction trend data available");
        },
      });

    // Load sprint volume trend
    this.trendsService
      .getSprintVolumeTrend(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          trends.push({
            title: "Sprint Volume",
            subtitle: "Last 4 weeks",
            value: data.current,
            change: this.trendsService.calculateChange(
              data.current,
              data.previous,
            ),
            changeLabel: "vs previous 4 weeks",
            icon: "pi-bolt",
          });
          this.trendCards.set([...trends]);
        },
        error: () => {
          // No trend data available
          this.logger.debug("No sprint volume trend data available");
        },
      });

    // Load game performance trend
    this.trendsService
      .getGamePerformanceTrend(userId, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          trends.push({
            title: "Game Performance",
            subtitle: "Last 5 games",
            value: `${data.averagePerformance.toFixed(1)}%`,
            change:
              data.trend === "improving"
                ? 5.2
                : data.trend === "declining"
                  ? -3.1
                  : 0,
            changeLabel: "average",
            icon: "pi-chart-line",
          });
          this.trendCards.set([...trends]);
        },
        error: () => {
          // No trend data available
          this.logger.debug("No game performance trend data available");
        },
      });
  }

  /**
   * Open daily metrics log dialog
   */
  openDailyMetricsLog(): void {
    this.showDailyMetricsLog.set(true);
  }

  /**
   * Close daily metrics log dialog
   */
  closeDailyMetricsLog(): void {
    this.showDailyMetricsLog.set(false);
  }

  /**
   * Handle metrics saved event
   */
  onMetricsSaved(): void {
    this.showDailyMetricsLog.set(false);
    // Reload dashboard data to show updated metrics
    const userId = this.authService.getUser()?.id;
    if (userId) {
      this.loadDashboardData();
    }
  }
}
