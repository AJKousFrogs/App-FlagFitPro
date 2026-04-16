/** Athlete home: readiness, training, schedule, insights. */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";
import { Timeline } from "primeng/timeline";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import {
  type TrainingStatsData,
} from "../../core/services/training-stats-calculation.service";
import type { TrainingSession } from "../../core/services/training-data.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { WellnessService } from "../../core/services/wellness.service";
import { ChannelService } from "../../core/services/channel.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import {
  ContinuityIndicatorsService,
  type ContinuityEvent,
} from "../../core/services/continuity-indicators.service";
import { AcwrSpikeDetectionService } from "../../core/services/acwr-spike-detection.service";
import {
  PrivacySettingsService,
} from "../../core/services/privacy-settings.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import { DashboardSkeletonComponent } from "../../shared/components/dashboard-skeleton/dashboard-skeleton.component";
import {
  CoachOverride,
} from "../../core/services/override-logging.service";
import {
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import {
  MissingDataStatus,
} from "../../core/services/missing-data-detection.service";
import type {
  ActionRequiredMeaning,
  IncompleteDataMeaning,
} from "../../core/semantics/semantic-meaning.types";
import { ProfileCompletionService } from "../../core/services/profile-completion.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { FeatureFlagsService } from "../../core/services/feature-flags.service";
import { NextGenMetricsService } from "../../core/services/next-gen-metrics.service";
import { TRAINING, UI_LIMITS } from "../../core/constants/app.constants";
import { getTimeAgo } from "../../shared/utils/date.utils";
import {
  getProtocolAcwrDisplay,
  getProtocolReadinessPresentation,
} from "../../core/utils/protocol-metrics-presentation";
import { PlayerDashboardDataService } from "./services/player-dashboard-data.service";
import { PlayerDashboardSetupCardComponent } from "./components/player-dashboard-setup-card.component";
import { PlayerDashboardInsightsGridComponent } from "./components/player-dashboard-insights-grid.component";
import { PlayerDashboardStatsOverviewComponent } from "./components/player-dashboard-stats-overview.component";
import { PlayerDashboardStatusStackComponent } from "./components/player-dashboard-status-stack.component";
import { PlayerDashboardEventsSectionComponent } from "./components/player-dashboard-events-section.component";
import { SmartTrainingDataService } from "../training/services/smart-training-data.service";
import {
  computeWellnessCheckinStreak,
  getDashboardEventIcon,
  getDashboardGreeting,
  getDashboardMerlinInsight,
  getDashboardPrivacySharingStatus,
  getWeeklyProgress,
  hasCompletedDashboardOnboarding,
  mapTeamEventToDashboardDisplay,
  type DashboardUpcomingEventDisplay,
} from "./utils/player-dashboard-presenters";
import type { SimpleChartData } from "../../core/models/chart.models";
import { getStartOfTrainingWeek } from "../../core/utils/unified-training-transforms";
import type { DashboardAnnouncementBanner } from "./models/dashboard-announcement.types";

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: "app-player-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonComponent,
    CardShellComponent,
    PlayerDashboardSetupCardComponent,
    PlayerDashboardInsightsGridComponent,

    DashboardSkeletonComponent,
    Timeline,
    MainLayoutComponent,
    PageErrorStateComponent,
    PlayerDashboardStatsOverviewComponent,
    PlayerDashboardStatusStackComponent,
    PlayerDashboardEventsSectionComponent,
  ],
  templateUrl: "./player-dashboard.component.html",
  styleUrl: "./player-dashboard.component.scss",
})
export class PlayerDashboardComponent {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly headerService = inject(HeaderService);
  private readonly unifiedTrainingService = inject(UnifiedTrainingService);
  private readonly wellnessService = inject(WellnessService);
  private readonly dataConfidenceService = inject(DataConfidenceService);
  private readonly continuityService = inject(ContinuityIndicatorsService);
  private readonly acwrSpikeDetection = inject(AcwrSpikeDetectionService);
  private readonly privacySettingsService = inject(PrivacySettingsService);
  private readonly playerDashboardDataService = inject(PlayerDashboardDataService);
  private readonly channelService = inject(ChannelService);
  private readonly toastService = inject(ToastService);
  private readonly profileCompletionService = inject(ProfileCompletionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly nextGenMetricsService = inject(NextGenMetricsService);
  private readonly teamNotificationService = inject(TeamNotificationService);
  private readonly smartTrainingDataService = inject(SmartTrainingDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  /** Dates (YYYY-MM-DD) in the current ISO week with a completed training session */
  private readonly weekLoggedDateKeys = signal<ReadonlySet<string>>(
    new Set(),
  );

  private lastAnnouncementSyncId: string | null = null;

  // Expose UI_LIMITS for template usage
  readonly UI_LIMITS = UI_LIMITS;

  // Loading state
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal("Failed to load dashboard. Please try again.");

  // User info
  userName = signal("Athlete");
  private readonly currentUser = computed(() => this.supabase.currentUser());
  currentUserId = computed(() => this.currentUser()?.id ?? "");
  private overviewLoadedForUser = signal<string | null>(null);

  // Announcement (first unread team chat announcement)
  announcement = signal<DashboardAnnouncementBanner | null>(null);
  announcementDismissed = signal(false);

  // Phase 2.1 - Coach Override Notifications
  recentOverrides = signal<CoachOverride[]>([]);
  coachNamesCache = signal<Record<string, string>>({});

  // Phase 2.1 - Ownership Transitions
  activeTransitions = signal<OwnershipTransition[]>([]);

  // Phase 2.2 - Missing Data Status
  missingWellnessStatus = signal<MissingDataStatus | null>(null);

  // Program assignment state (from UnifiedTrainingService)
  needsProgramAssignment = computed(() =>
    this.unifiedTrainingService.needsProgramAssignment(),
  );

  // Stats - CRITICAL: No defaults - only real data
  acwr = signal<number | null>(null); // Load from training stats - no fallback
  currentStreak = signal(0);
  weeklySessionsCompleted = signal(0);
  weeklySessionsPlanned = signal(7);

  // Next-gen preview
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;
  nextGenPreview = this.nextGenMetricsService.loadPreview;
  nextGenReadinessScore = computed(() => {
    const preview = this.nextGenPreview();
    return preview?.readiness?.score ?? null;
  });

  /** 0–100 readiness from latest wellness entry (fallback when protocol has no score) */
  readonly wellnessReadinessFallback = computed(() => {
    const latest = this.wellnessService.latestWellnessEntry();
    if (!latest) return null;
    const score = this.wellnessService.getWellnessScore(latest);
    return Math.round(score * 10);
  });

  private readonly todayLocalDateKey = computed(() =>
    this.formatDateOnlyLocal(new Date()),
  );

  readonly wellnessCheckedInToday = computed(() => {
    const latest = this.wellnessService.latestWellnessEntry();
    if (!latest?.date) return false;
    return latest.date === this.todayLocalDateKey();
  });

  readonly checkinStreak = computed(() =>
    computeWellnessCheckinStreak(this.wellnessService.wellnessData()),
  );

  readonly daysSinceLastCheckin = computed(() => {
    const latest = this.wellnessService.latestWellnessEntry();
    if (!latest?.date) return 0;
    const last = this.parseLocalDateOnly(latest.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);
    return Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
  });

  readonly checkinOverdue = computed(() => {
    const latest = this.wellnessService.latestWellnessEntry();
    if (!latest?.date) return false;
    return this.daysSinceLastCheckin() > 1;
  });

  readonly todayProtocol = this.unifiedTrainingService.todayProtocol;

  // ACWR progress tracking (UX Audit Fix #5)
  trainingDaysLogged = signal<number | null>(null); // Calculate from real training sessions
  acwrDataSufficient = computed(() => {
    if (this.todayProtocol()?.acwr_presentation?.value !== null) {
      return true;
    }

    const days =
      this.todayProtocol()?.confidence_metadata?.acwr?.trainingDaysLogged ??
      this.trainingDaysLogged();
    return days !== null && days >= TRAINING.MIN_DAYS_FOR_CHRONIC;
  });

  // Expose TRAINING constant for template usage
  readonly TRAINING = TRAINING;

  /** Mon–Sun: completed = logged training session that calendar day */
  readonly weekDays = computed(() => {
    const schedule = this.unifiedTrainingService.weeklySchedule();
    const logged = this.weekLoggedDateKeys();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapDay = (
      name: string,
      dayDate: Date,
    ): {
      name: string;
      short: string;
      completed: boolean;
      isToday: boolean;
      isFuture: boolean;
    } => {
      const dateKey = this.formatDateOnlyLocal(dayDate);
      const d = new Date(dayDate);
      d.setHours(0, 0, 0, 0);
      const completed = logged.has(dateKey) && d.getTime() <= today.getTime();
      const isToday = d.getTime() === today.getTime();
      const isFuture = d.getTime() > today.getTime();
      return {
        name,
        short: name.slice(0, 3),
        completed,
        isToday,
        isFuture,
      };
    };

    if (schedule.length >= 7) {
      return schedule.map((day) => {
        const dayDate =
          day.date instanceof Date ? day.date : new Date(day.date ?? "");
        return mapDay(day.name, dayDate);
      });
    }

    const weekStart = getStartOfTrainingWeek();
    const names = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return names.map((name, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return mapDay(name, d);
    });
  });

  // Schedule - use computed from UnifiedTrainingService
  todaySchedule = computed(() => {
    const items = this.unifiedTrainingService.todaysScheduleItems();
    // Transform TodayScheduleItem to ScheduleItem format for dashboard
    return items.map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      duration: item.duration || 60,
      completed: item.status === "completed",
      icon: item.icon,
    }));
  });

  tomorrowSchedule = computed(() => {
    const items = this.unifiedTrainingService.tomorrowScheduleItems();
    // Transform TodayScheduleItem to ScheduleItem format for dashboard
    return items.map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      duration: item.duration || 60,
      completed: false, // Tomorrow items are never completed
      icon: item.icon,
    }));
  });

  upcomingEvents = signal<DashboardUpcomingEventDisplay[]>([]);

  // Performance chart - uses Chart.js format
  performanceChartData = signal<SimpleChartData | null>(null);

  // Quick actions (order preserved from wireframe)
  quickActions: QuickAction[] = [
    {
      label: "Wellness",
      icon: "pi pi-heart",
      route: "/wellness",
      description: "Check your wellness",
    },
    {
      label: "Schedule",
      icon: "pi pi-calendar",
      route: "/training",
      description: "View full schedule",
    },
    {
      label: "Performance",
      icon: "pi pi-chart-bar",
      route: "/performance/insights",
      description: "Performance insights",
    },
    {
      label: "Today",
      icon: "pi pi-play",
      route: "/todays-practice",
      description: "Open today’s training plan",
    },
  ];

  chartOptions = {
    ...LINE_CHART_OPTIONS,
    plugins: {
      ...LINE_CHART_OPTIONS.plugins,
      legend: { display: false },
    },
    scales: {
      y: { display: false },
      x: { display: false },
    },
  };

  // Computed
  greeting = computed(() => getDashboardGreeting());

  merlinInsight = computed(() => {
    return getDashboardMerlinInsight(
      this.dashboardReadinessPresentation().score,
      this.dashboardAcwrDisplay().value,
    );
  });

  weeklyProgress = computed(() =>
    getWeeklyProgress(
      this.weeklySessionsCompleted(),
      this.weeklySessionsPlanned(),
    ),
  );

  readonly dashboardReadinessPresentation = computed(() =>
    getProtocolReadinessPresentation(
      this.todayProtocol(),
      this.wellnessReadinessFallback(),
    ),
  );

  readonly dashboardAcwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.acwr(),
      this.trainingDaysLogged(),
    ),
  );

  // Data Confidence Calculations
  readinessConfidence = computed(() => {
    const wellnessData = this.wellnessService.wellnessData();
    if (!wellnessData || wellnessData.length === 0) {
      return {
        score: 0,
        missingInputs: ["wellness_data"],
        staleData: ["wellness"],
      };
    }
    // Map wellness data to format expected by confidence service
    const mappedData = wellnessData.map((w) => ({
      date: w.date,
      sleep: w.sleep,
      energy: w.energy,
      soreness: w.soreness,
      stress: w.stress,
      mood: w.mood,
    }));
    return this.dataConfidenceService.calculateWellnessConfidence(mappedData);
  });

  acwrConfidence = computed(() => {
    const daysLogged = this.trainingDaysLogged();
    return this.dataConfidenceService.calculateACWRConfidence(daysLogged || 0);
  });

  // Privacy Sharing Status
  privacySharingStatus = computed(() => {
    return getDashboardPrivacySharingStatus(
      this.privacySettingsService.teamSettings(),
    );
  });

  // Continuity Events
  continuityEvents = signal<ContinuityEvent[]>([]);
  readonly overrideDisplayItems = computed(() =>
    this.recentOverrides().map((override) => ({
      override,
      coachName: this.getCoachName(override.coachId),
    })),
  );
  readonly announcementTimeAgo = computed(() =>
    getTimeAgo(this.announcement()?.postedAt),
  );

  readonly continuityDisplayEvents = computed(() =>
    this.continuityEvents().map((event) => ({
      ...event,
      icon: getDashboardEventIcon(event.type),
    })),
  );

  constructor() {
    this.headerService.setDashboardHeader();

    // Load centralized services first (for consistent data across views)
    this.profileCompletionService.loadProfileData();
    this.teamMembershipService.loadMembership();
    void this.privacySettingsService.loadSettings();

    this.loadData();

    effect(() => {
      if (this.nextGenEnabled()) {
        this.nextGenMetricsService.refreshLoadPreview();
      } else {
        this.nextGenMetricsService.clearPreview();
      }
    });

    effect(() => {
      const schedule = this.unifiedTrainingService.weeklySchedule();
      const planned = schedule.reduce(
        (sum, day) => sum + (day.sessions?.length || 0),
        0,
      );
      this.weeklySessionsPlanned.set(planned);
    });

    // Check if we need to refresh program assignment (e.g., after onboarding)
    const refreshProgramAssignment = sessionStorage.getItem(
      "refreshProgramAssignment",
    );
    if (refreshProgramAssignment === "true") {
      sessionStorage.removeItem("refreshProgramAssignment");
      // Force refresh program assignment check
      this.unifiedTrainingService.loadProgramAssignment();
    }

    // Load overview once per authenticated user to avoid auth-transition request loops.
    effect(() => {
      const userId = this.currentUserId();
      if (!userId) {
        this.overviewLoadedForUser.set(null);
        return;
      }
      if (this.overviewLoadedForUser() === userId) return;

      this.overviewLoadedForUser.set(userId);
      this.unifiedTrainingService
        .getTodayOverview()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.logger.info("player_dashboard_today_overview_loaded");
          },
          error: (error) => {
            this.logger.error(
              "player_dashboard_today_overview_failed",
              error,
            );
          },
        });
    });

    effect(() => {
      const unread = this.teamNotificationService.unreadAnnouncements();
      const first = unread[0];
      if (!first) {
        this.announcement.set(null);
        this.lastAnnouncementSyncId = null;
        return;
      }
      if (first.id !== this.lastAnnouncementSyncId) {
        this.lastAnnouncementSyncId = first.id;
        this.announcementDismissed.set(false);
      }
      this.announcement.set({
        id: first.id,
        message: first.message,
        coachName: first.author_name?.trim() || null,
        postedAt: first.created_at ? new Date(first.created_at) : null,
        priority: first.is_important ? "important" : "info",
      });
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const user = this.currentUser();
    const metadata = user?.user_metadata as
      | { fullName?: string; firstName?: string }
      | undefined;
    const fullName = metadata?.fullName || metadata?.firstName;
    if (fullName) {
      this.userName.set(fullName.split(" ")[0]);
    }

    const today = new Date();
    const weekStart = getStartOfTrainingWeek(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekStartStr = this.formatDateOnlyLocal(weekStart);
    const weekEndStr = this.formatDateOnlyLocal(weekEnd);

    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - 13);
    const trendStartStr = this.formatDateOnlyLocal(trendStart);
    const todayStr = this.formatDateOnlyLocal(today);

    this.playerDashboardDataService
      .loadTrainingSnapshot(
        weekStartStr,
        weekEndStr,
        trendStartStr,
        todayStr,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ stats, weekSessions, trendSessions }) => {
        if (stats === null) {
          this.hasError.set(true);
          this.errorMessage.set(
            "Failed to load dashboard. Please try again.",
          );
          this.isLoading.set(false);
          return;
        }

        this.applyTrainingStats(stats);
        this.applyWeekLoggedDates(weekSessions);
        this.performanceChartData.set(this.buildLoadTrendChart(trendSessions));
        void this.refreshDashboardInsights();
        void this.loadUpcomingTeamEventsForDashboard();
        this.isLoading.set(false);
      });
  }

  private applyTrainingStats(
    stats: TrainingStatsData | null | undefined,
  ): void {
    // CRITICAL: Only set ACWR if we have real data - no fallback defaults
    if (stats?.acwr !== undefined && typeof stats.acwr === "number") {
      this.acwr.set(stats.acwr);
    } else {
      this.acwr.set(null);
    }

    this.currentStreak.set(stats?.currentStreak ?? 0);
    this.weeklySessionsCompleted.set(stats?.weeklySessions ?? 0);
    this.trainingDaysLogged.set(null);
  }

  private applyWeekLoggedDates(sessions: TrainingSession[]): void {
    const keys = new Set<string>();
    for (const s of sessions) {
      if (!this.isSessionCompleted(s)) continue;
      const raw = s.session_date || s.date;
      if (!raw) continue;
      const key =
        typeof raw === "string"
          ? raw.split("T")[0]
          : this.formatDateOnlyLocal(new Date(raw));
      keys.add(key);
    }
    this.weekLoggedDateKeys.set(keys);
  }

  private isSessionCompleted(s: TrainingSession): boolean {
    if (s.status === "deleted" || s.status === "cancelled") return false;
    if (s.status === "completed") return true;
    return Boolean(s.completed_at);
  }

  private buildLoadTrendChart(sessions: TrainingSession[]): SimpleChartData | null {
    const byDay = new Map<string, number>();
    const labelsOrdered: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(12, 0, 0, 0);
      const key = this.formatDateOnlyLocal(d);
      byDay.set(key, 0);
      labelsOrdered.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }

    for (const s of sessions) {
      const raw = s.session_date || s.date;
      if (!raw || !this.isSessionCompleted(s)) continue;
      const key =
        typeof raw === "string"
          ? raw.split("T")[0]
          : this.formatDateOnlyLocal(new Date(raw));
      if (!byDay.has(key)) continue;
      const duration = s.duration_minutes ?? s.duration ?? 0;
      const rpe = s.rpe ?? s.intensity_level ?? 5;
      byDay.set(key, (byDay.get(key) ?? 0) + duration * rpe);
    }

    const data = labelsOrdered.map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = this.formatDateOnlyLocal(d);
      return byDay.get(key) ?? 0;
    });

    if (data.every((v) => v === 0)) {
      return null;
    }

    return {
      labels: labelsOrdered,
      datasets: [
        {
          label: "Training load",
          data,
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "var(--ds-primary-green-subtle)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }

  private async loadUpcomingTeamEventsForDashboard(): Promise<void> {
    const todayStr = this.formatDateOnlyLocal(new Date());
    try {
      const { events, error } =
        await this.smartTrainingDataService.fetchUpcomingTeamEvents(todayStr);
      if (error) {
        this.logger.warn("player_dashboard_team_events_query", error);
      }
      this.upcomingEvents.set(
        events.map((e, i) => mapTeamEventToDashboardDisplay(e, i)),
      );
    } catch (error) {
      this.logger.error("player_dashboard_team_events_failed", error);
      this.upcomingEvents.set([]);
    }
  }

  private formatDateOnlyLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  private parseLocalDateOnly(ymd: string): Date {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  private refreshDashboardInsights(): void {
    void this.loadContinuityEvents();
    void this.checkAcwrSpike();
    void this.loadTrustSignals();
  }

  private getCurrentUserId(): string | null {
    return this.currentUserId() || null;
  }

  private async loadContinuityEvents(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const events = await this.continuityService.getPlayerContinuity(userId);
      this.continuityEvents.set(events);
    } catch (error) {
      this.logger.error("player_dashboard_continuity_events_failed", error);
    }
  }

  private async checkAcwrSpike(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const acwrValue = this.acwr();
    if (acwrValue !== null && acwrValue > 1.5) {
      try {
        await this.acwrSpikeDetection.checkAndCapLoad(userId, acwrValue);
        // Reload continuity events to show the new load cap
        await this.loadContinuityEvents();
      } catch (error) {
        this.logger.error("player_dashboard_acwr_spike_check_failed", error);
      }
    }
  }

  private async loadTrustSignals(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const trustSnapshot =
        await this.playerDashboardDataService.loadTrustSnapshot(userId);

      this.recentOverrides.set(trustSnapshot.overrides);
      this.activeTransitions.set(trustSnapshot.activeTransitions);
      this.missingWellnessStatus.set(trustSnapshot.missingWellnessStatus);

      if (trustSnapshot.overrides.length > 0) {
        await this.loadCoachNames(trustSnapshot.overrides);
      }
    } catch (error) {
      this.logger.error("player_dashboard_trust_signals_load_failed", error);
    }
  }

  /**
   * Phase 3: Convert onboarding requirement to semantic ActionRequiredMeaning
   */
  getOnboardingActionRequiredMeaning(): ActionRequiredMeaning | null {
    if (this.hasCompletedOnboarding()) {
      return null; // No action required if onboarding is complete
    }

    return {
      type: "action-required",
      urgency: "high",
      actionType: "complete-profile",
      message: "Complete your profile to unlock your training program",
      actionLabel: "Complete Profile (2 min)",
      actionRoute: ["/onboarding"],
      blocking: true,
    };
  }

  /**
   * Phase 3: Convert ACWR confidence to semantic IncompleteDataMeaning
   */
  getACWRIncompleteDataMeaning(): IncompleteDataMeaning | null {
    const confidence = this.acwrConfidence();
    if (confidence.score >= 0.9) {
      return null; // No incomplete data if confidence is high
    }

    // Map confidence score to severity
    const severity = confidence.score < 0.5 ? "critical" : "warning";
    const confidenceImpact = 1.0 - confidence.score; // Inverse of confidence

    // Determine data type from missing inputs
    let dataType: IncompleteDataMeaning["dataType"] = "general";
    if (
      confidence.missingInputs.includes("wellness") ||
      confidence.missingInputs.includes("wellness_data")
    ) {
      dataType = "wellness";
    } else if (
      confidence.missingInputs.includes("training") ||
      confidence.missingInputs.includes("training_sessions")
    ) {
      dataType = "training";
    }

    return {
      type: "incomplete-data",
      severity,
      dataType,
      affectedMetric: "acwr",
      confidenceImpact,
      message: `ACWR calculation confidence is ${(confidence.score * 100).toFixed(0)}%. Missing: ${confidence.missingInputs.join(", ")}.`,
    };
  }

  /**
   * Load coach names for override notifications
   */
  private async loadCoachNames(overrides: CoachOverride[]): Promise<void> {
    const coachIds = [...new Set(overrides.map((o) => o.coachId))];
    const cache = { ...this.coachNamesCache() };

    // Only fetch names we don't have cached
    const missingIds = coachIds.filter((id) => !cache[id]);

    if (missingIds.length === 0) return;

    try {
      // Use 'users' table instead of 'profiles' (profiles table doesn't exist)
      const { profiles, error } =
        await this.playerDashboardDataService.fetchCoachProfiles(missingIds);

      if (error) {
        this.logger.error("player_dashboard_coach_names_failed", error);
        return;
      }

      // Update cache
      profiles?.forEach((profile) => {
        cache[profile.id] = profile.full_name || "Your coach";
      });

      this.coachNamesCache.set(cache);
    } catch (error) {
      this.logger.error("player_dashboard_coach_names_failed", error);
    }
  }

  /**
   * Get coach name from cache or return default
   */
  getCoachName(coachId: string): string {
    return this.coachNamesCache()[coachId] || "Your coach";
  }

  async dismissAnnouncement(): Promise<void> {
    const ann = this.announcement();
    if (ann?.id) {
      try {
        await this.teamNotificationService.markAnnouncementRead(ann.id);
      } catch (error) {
        this.logger.error("player_dashboard_announcement_dismiss_failed", error);
      }
    }
    this.announcementDismissed.set(true);
  }

  /**
   * Open direct message with the player's coach
   * Creates a 1:1 DM channel if it doesn't exist, then navigates to team chat
   * Uses TeamMembershipService for centralized team queries
   */
  async contactCoach(): Promise<void> {
    try {
      const dmChannelId = await this.resolveCoachDirectMessageChannel();
      this.navigateToTeamChat(dmChannelId ? { channel: dmChannelId } : undefined);
    } catch (error) {
      this.logger.error("Error contacting coach:", error);
      this.toastService.error(TOAST.ERROR.CHAT_START_FAILED);
      this.navigateToTeamChat();
    }
  }

  private async resolveCoachDirectMessageChannel(): Promise<string | null> {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) {
      this.toastService.warn(TOAST.WARN.NO_TEAM);
      return null;
    }

    const coach = await this.teamMembershipService.getTeamCoach();
    if (!coach?.userId) {
      this.toastService.warn(TOAST.WARN.NO_COACH);
      return null;
    }

    const dmChannel = await this.channelService.createDirectMessage(
      coach.userId,
      teamId,
    );

    return dmChannel.id;
  }

  private navigateToTeamChat(queryParams?: { channel: string }): void {
    this.router.navigate(["/team-chat"], queryParams ? { queryParams } : undefined);
  }

  /**
   * Check if user has completed onboarding/profile
   * Uses centralized ProfileCompletionService for consistency
   * UX Audit Fix #3
   */
  hasCompletedOnboarding(): boolean {
    return hasCompletedDashboardOnboarding(
      this.profileCompletionService.completionStatus(),
    );
  }

  /**
   * Navigate to wellness check-in page
   * UX Audit Fix #4
   */
  navigateToWellness(): void {
    this.router.navigate(["/wellness"]);
  }

  /**
   * Navigate to ACWR details page
   * UX Audit Fix #5
   */
  navigateToACWR(): void {
    this.router.navigate(["/performance/load"]);
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(date: Date | null | undefined): string {
    return getTimeAgo(date);
  }
}
