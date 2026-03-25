import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";

import { InputText } from "primeng/inputtext";
import { Select, type SelectChangeEvent } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { forkJoin } from "rxjs";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { FeatureFlagsService } from "../../core/services/feature-flags.service";
import {
  MissingDataDetectionService,
  PlayerMissingData,
} from "../../core/services/missing-data-detection.service";
import { ContinuityIndicatorsService } from "../../core/services/continuity-indicators.service";
import { OverrideLoggingService } from "../../core/services/override-logging.service";
import {
  OwnershipTransitionService,
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import { AccountabilityTrackingService } from "../../core/services/accountability-tracking.service";
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
import { TOAST } from "../../core/constants/toast-messages.constants";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import {
  AppLoadingComponent,
  AppDialogComponent,
  ButtonComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { formatDate, getTimeAgo } from "../../shared/utils/date.utils";
import {
  getStatusSeverity as getStatusSeverityValue,
} from "../../shared/utils/status.utils";
import { DatePipe } from "@angular/common";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import { CONSENT_BLOCKED_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { UI_LIMITS } from "../../core/constants";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { CoachDashboardPartialDataNoticeComponent } from "./components/coach-dashboard-partial-data-notice.component";
import { CoachDashboardPrioritySectionComponent } from "./components/coach-dashboard-priority-section.component";
import { CoachDashboardProtocolsSectionComponent } from "./components/coach-dashboard-protocols-section.component";
import { CoachDashboardRosterSectionComponent } from "./components/coach-dashboard-roster-section.component";
import { CoachDashboardSummarySectionComponent } from "./components/coach-dashboard-summary-section.component";

/**
 * Coach Dashboard Component
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar (Pending Cleanup)
 * ============================================================
 * This page is marked as canonical but requires cleanup before freeze.
 *
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - Must be cleaned to full compliance before canonical freeze
 *
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * CLEANUP REQUIRED:
 * - Remove PrimeNG overrides from component SCSS
 * - Replace raw spacing values with tokens
 * - Replace raw colors with tokens
 */

/**
 * Interface for consent information returned from API
 */
interface ConsentInfo {
  blockedPlayerIds: string[];
  partialDataNotice?: string;
}

type PlayerFilterType = "all" | "starters" | "injured" | "at_risk";

@Component({
  selector: "app-coach-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    InputText,
    Textarea,
    Select,
    AppLoadingComponent,
    AppDialogComponent,
    ButtonComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageErrorStateComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    DatePipe,
    CoachDashboardPartialDataNoticeComponent,
    CoachDashboardSummarySectionComponent,
    CoachDashboardPrioritySectionComponent,
    CoachDashboardProtocolsSectionComponent,
    CoachDashboardRosterSectionComponent,
  ],
  templateUrl: "./coach-dashboard.component.html",

  styleUrl: "./coach-dashboard.component.scss",
})
export class CoachDashboardComponent {
  // Expose constants for template use
  readonly UI_LIMITS = UI_LIMITS;
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly headerService = inject(HeaderService);
  private readonly teamStatsService = inject(TeamStatisticsService);
  private readonly toastService = inject(ToastService);
  private readonly missingDataService = inject(MissingDataDetectionService);
  private readonly continuityService = inject(ContinuityIndicatorsService);
  private readonly overrideService = inject(OverrideLoggingService);
  private readonly ownershipTransitionService = inject(
    OwnershipTransitionService,
  );
  private readonly accountabilityService = inject(
    AccountabilityTrackingService,
  );
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // Next-gen preview
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;

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
  playerOverrideCounts = signal<Record<string, number>>({});
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

  // Missing data tracking
  playersWithMissingData = signal<PlayerMissingData[]>([]);

  // Ownership transitions tracking
  pendingTransitions = signal<OwnershipTransition[]>([]);

  // Team continuity tracking
  teamContinuity = signal<{
    gameDayRecovery: Array<{
      playerId: string;
      playerName: string;
      dayNumber: number;
    }>;
    loadCaps: Array<{
      playerId: string;
      playerName: string;
      sessionsRemaining: number;
    }>;
    travelRecovery: Array<{
      playerId: string;
      playerName: string;
      daysRemaining: number;
    }>;
  }>({
    gameDayRecovery: [],
    loadCaps: [],
    travelRecovery: [],
  });

  // UI state
  playerFilter = signal<PlayerFilterType>("all");
  showCreateSessionDialog = false;
  showTeamMessageDialog = false;
  showRequestAccessDialog = false;
  teamMessageContent = "";
  requestAccessPlayerId: string | null = null;
  requestAccessMessage = "";

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
    const missingData = this.playersWithMissingData();
    const atRisk = this.atRiskCount();

    // Structured team briefing format
    const sections: string[] = [];

    // Priority alerts
    if (alerts.length > 0) {
      const criticalAlerts = alerts.filter(
        (a) => a.severity === "critical",
      ).length;
      const wellnessLow = alerts.filter(
        (a) =>
          a.alertType === "low_readiness" &&
          a.readiness !== undefined &&
          a.readiness < 40,
      ).length;

      if (criticalAlerts > 0) {
        sections.push(
          `🚨 ${criticalAlerts} critical alert(s) requiring immediate attention`,
        );
      }
      if (wellnessLow > 0) {
        sections.push(`⚠️ ${wellnessLow} player(s) with wellness below 40%`);
      }
      if (alerts.length > 0) {
        sections.push(
          `📊 ${alerts.length} total risk alert(s) across the team`,
        );
      }
    }

    // Missing data
    if (missingData.length > 0) {
      sections.push(
        `📋 ${missingData.length} player(s) with incomplete wellness data`,
      );
    }

    // Injury status
    if (injured > 0) {
      sections.push(`🏥 ${injured} player(s) currently injured`);
    }

    // Team workload
    if (overview.avgTeamWorkload > 1.3) {
      sections.push(
        `⚡ Team ACWR trending high (${overview.avgTeamWorkload.toFixed(2)}) - consider deload`,
      );
    }

    // Positive status
    if (sections.length === 0) {
      return "✅ Team Briefing: The squad is looking sharp today! Compliance is high, and readiness scores are optimal. Great day for a high-intensity session.";
    }

    return `📋 Team Briefing: ${sections.join(". ")}. ${atRisk > 0 ? `Recommendation: Review ${atRisk} at-risk player(s) before today's session.` : "All systems go for today's practice."}`;
  });

  filteredPlayers = computed(() => {
    const filter = this.playerFilter();
    const allPlayers = this.players();

    switch (filter) {
      case "injured":
        return allPlayers.filter((p) => p.status === "injured");
      case "at_risk":
        return allPlayers.filter(
          (p) =>
            p.riskLevel === "high" ||
            p.status === "at_risk" ||
            (p.readiness !== null &&
              p.readiness !== undefined &&
              p.readiness < 40) || // Wellness < 40%
            (p.acwr !== null && p.acwr !== undefined && p.acwr > 1.3), // ACWR > 1.3
        );
      default:
        return allPlayers;
    }
  });

  atRiskCount = computed(
    () =>
      this.players().filter(
        (p) =>
          p.riskLevel === "high" ||
          p.status === "at_risk" ||
          (p.readiness !== null &&
            p.readiness !== undefined &&
            p.readiness < 40) || // Wellness < 40%
          (p.acwr !== null && p.acwr !== undefined && p.acwr > 1.3), // ACWR > 1.3
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
          borderColor: "var(--color-chart-primary)",
          backgroundColor: "rgba(var(--ds-primary-green-rgb), 0.1)",
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

          // Load missing data detection
          this.loadMissingData(teamId);

          // Check and create coach reminders for missing wellness
          this.missingDataService
            .checkAndCreateCoachReminders(teamId)
            .catch((error) => {
              this.logger.error(
                "[CoachDashboard] Error checking reminders:",
                error,
              );
            });

          // Load team continuity
          this.loadTeamContinuity(teamId);

          // Load override counts
          this.loadOverrideCounts();

          // Load pending ownership transitions
          this.loadPendingTransitions();

          // Load accountability items
          this.accountabilityService
            .loadAccountabilityItems("coach")
            .catch((error) => {
              this.logger.warn(
                "[CoachDashboard] Error loading accountability items:",
                error,
              );
            });
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

  /**
   * Load players with missing wellness data
   */
  private async loadMissingData(teamId: string): Promise<void> {
    try {
      const playersWithMissing =
        await this.missingDataService.getPlayersWithMissingWellness(teamId);
      this.playersWithMissingData.set(playersWithMissing);
    } catch (error) {
      this.logger.error("[CoachDashboard] Error loading missing data:", error);
    }
  }

  /**
   * Load team continuity events
   */
  private async loadTeamContinuity(teamId: string): Promise<void> {
    try {
      const continuity = await this.continuityService.getTeamContinuity(teamId);
      this.teamContinuity.set(continuity);
    } catch (error) {
      this.logger.error(
        "[CoachDashboard] Error loading team continuity:",
        error,
      );
    }
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
    this.router.navigate(["/coach/analytics"], {
      queryParams: { player: playerId, source: "dashboard-stats" },
    });
  }

  adjustPlayerLoad(playerId: string): void {
    this.toastService.info(TOAST.INFO.OPENING_LOAD_ADJUSTMENT);
    this.router.navigate(["/coach/analytics"], {
      queryParams: { player: playerId, source: "dashboard" },
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
    this.toastService.info(TOAST.INFO.SENDING_DATA_REQUEST);
    this.openRequestAccessDialog(playerId);
  }

  navigateToAnalytics(): void {
    this.router.navigate(["/coach/analytics"]);
  }

  viewAllStats(): void {
    this.router.navigate(["/coach/analytics"]);
  }

  viewInjuryReport(): void {
    this.router.navigate(["/roster"], { queryParams: { filter: "injured" } });
  }

  manageRoster(): void {
    this.router.navigate(["/roster"]);
  }

  planTomorrow(): void {
    // Navigate to calendar with tomorrow's date pre-selected
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    this.router.navigate(["/coach/planning"], {
      queryParams: { date: dateStr },
    });
  }

  scheduleGame(): void {
    this.router.navigate(["/tournaments"]);
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

  onNewSessionTitleChange(value: string): void {
    this.newSession = { ...this.newSession, title: value };
  }

  onNewSessionTitleInput(event: Event): void {
    this.onNewSessionTitleChange(this.readInputValue(event));
  }

  onNewSessionTypeChange(value: string | null): void {
    this.newSession = { ...this.newSession, type: value ?? "practice" };
  }

  onNewSessionTypeSelect(event: SelectChangeEvent): void {
    this.onNewSessionTypeChange(
      typeof event.value === "string" ? event.value : null,
    );
  }

  getNewSessionDateInputValue(): string {
    const date = this.newSession.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onNewSessionDateInput(value: string): void {
    if (!value) {
      return;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return;
    }

    this.newSession = { ...this.newSession, date: parsedDate };
  }

  onNewSessionDateInputEvent(event: Event): void {
    this.onNewSessionDateInput(this.readInputValue(event));
  }

  onNewSessionDurationChange(value: number | string): void {
    const parsedValue =
      typeof value === "number" ? value : Number.parseInt(value, 10);
    this.newSession = {
      ...this.newSession,
      duration: Number.isFinite(parsedValue)
        ? parsedValue
        : this.newSession.duration,
    };
  }

  onNewSessionDurationInput(event: Event): void {
    this.onNewSessionDurationChange(this.readInputValue(event));
  }

  onNewSessionNotesChange(value: string): void {
    this.newSession = { ...this.newSession, notes: value };
  }

  onNewSessionNotesInput(event: Event): void {
    this.onNewSessionNotesChange(this.readInputValue(event));
  }

  createSession(): void {
    if (!this.newSession.title) {
      this.toastService.warn(TOAST.WARN.ENTER_SESSION_TITLE);
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

  onTeamMessageContentChange(value: string): void {
    this.teamMessageContent = value;
  }

  onTeamMessageContentInput(event: Event): void {
    this.onTeamMessageContentChange(this.readInputValue(event));
  }

  async sendTeamMessage(): Promise<void> {
    if (!this.teamMessageContent.trim()) {
      this.toastService.warn(TOAST.WARN.ENTER_MESSAGE);
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.teamMessage, {
          message: this.teamMessageContent.trim(),
        }),
      );

      this.toastService.success(TOAST.SUCCESS.MESSAGE_SENT_TO_TEAM);
      this.showTeamMessageDialog = false;
      this.teamMessageContent = "";
    } catch (error) {
      this.logger.error("[CoachDashboard] Failed to send team message", error);
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  requestDataAccess(playerId: string, event: Event): void {
    event.stopPropagation(); // Prevent row click
    this.openRequestAccessDialog(playerId);
  }

  private openRequestAccessDialog(playerId: string): void {
    const player = this.players().find((p) => p.playerId === playerId);
    this.requestAccessPlayerId = playerId;
    this.requestAccessMessage = `Hi ${player?.playerName || "there"}, I'd like to request access to your wellness and training data to better support your performance. This will help me provide personalized training recommendations.`;
    this.showRequestAccessDialog = true;
  }

  async sendAccessRequest(): Promise<void> {
    if (!this.requestAccessPlayerId || !this.requestAccessMessage.trim()) {
      this.toastService.warn(TOAST.WARN.ENTER_MESSAGE);
      return;
    }

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.coach.accessRequest, {
          playerId: this.requestAccessPlayerId,
          message: this.requestAccessMessage.trim(),
        }),
      );

      this.toastService.success(TOAST.SUCCESS.ACCESS_REQUEST_SENT);
      this.showRequestAccessDialog = false;
      this.requestAccessPlayerId = null;
      this.requestAccessMessage = "";
    } catch (error) {
      this.logger.error("[CoachDashboard] Failed to send access request", error);
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  cancelAccessRequest(): void {
    this.showRequestAccessDialog = false;
    this.requestAccessPlayerId = null;
    this.requestAccessMessage = "";
  }

  onRequestAccessMessageChange(value: string): void {
    this.requestAccessMessage = value;
  }

  onRequestAccessMessageInput(event: Event): void {
    this.onRequestAccessMessageChange(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  // Helper methods
  getTrendIcon(trend: "up" | "down" | "stable"): string {
    const icons = {
      up: "pi pi-arrow-up",
      down: "pi pi-arrow-down",
      stable: "pi pi-minus",
    };
    return icons[trend];
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
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    return getStatusSeverityValue(status);
  }

  /**
   * Load override counts for all players
   */
  private async loadOverrideCounts(): Promise<void> {
    const players = this.players();
    if (players.length === 0) return;

    const counts: Record<string, number> = {};

    // Load override counts for each player (last 7 days)
    await Promise.all(
      players.map(async (player) => {
        const count = await this.overrideService.getPlayerOverrideCount(
          player.playerId,
          7,
        );
        counts[player.playerId] = count;
      }),
    );

    this.playerOverrideCounts.set(counts);
  }

  /**
   * Get override count for a player
   */
  getPlayerOverrideCount(playerId: string): number {
    return this.playerOverrideCounts()[playerId] || 0;
  }

  /**
   * View override history for a player
   */
  async viewOverrideHistory(playerId: string, event: Event): Promise<void> {
    event.stopPropagation(); // Prevent row click
    await this.showOverrideHistory(playerId);
  }

  async viewOverrideHistoryFromSection(playerId: string): Promise<void> {
    await this.showOverrideHistory(playerId);
  }

  private async showOverrideHistory(playerId: string): Promise<void> {
    const overrides = await this.overrideService.getPlayerOverrides(
      playerId,
      10,
    );
    const player = this.players().find((p) => p.playerId === playerId);

    if (overrides.length === 0) {
      this.toastService.info(TOAST.INFO.NO_OVERRIDES_FOUND);
      return;
    }

    // Show override history in a simple format
    const overrideList = overrides
      .map(
        (o) =>
          `${formatDate(o.createdAt || "", "P")}: ${o.overrideType} - ${o.reason || "No reason provided"}`,
      )
      .join("\n");

    // For now, show in console/log - could be enhanced with a modal
    this.logger.info(
      `Override history for ${player?.playerName}:`,
      overrideList,
    );
    this.toastService.info(
      `${overrides.length} override(s) found. Check console for details.`,
    );
  }

  /**
   * Load pending ownership transitions for coach
   */
  private async loadPendingTransitions(): Promise<void> {
    try {
      const transitions =
        await this.ownershipTransitionService.getPendingTransitions(
          "coach",
          10,
        );
      this.pendingTransitions.set(transitions);
    } catch (error) {
      this.logger.error(
        "[CoachDashboard] Error loading pending transitions:",
        error,
      );
    }
  }

  /**
   * Get player name from player ID
   */
  getPlayerName(playerId: string): string {
    const player = this.players().find((p) => p.playerId === playerId);
    return player?.playerName || "Unknown Player";
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(date: Date | undefined): string {
    return getTimeAgo(date);
  }
}
