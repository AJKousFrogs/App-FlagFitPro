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
import { of } from "rxjs";
import { catchError } from "rxjs";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
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
  OverrideLoggingService,
  CoachOverride,
} from "../../core/services/override-logging.service";
import {
  OwnershipTransitionService,
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import {
  MissingDataDetectionService,
  MissingDataStatus,
} from "../../core/services/missing-data-detection.service";
import {
  CoachOverrideMeaning,
  IncompleteDataMeaning,
  ActionRequiredMeaning,
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
import {
  getDashboardEventIcon,
  getDashboardEventSeverity,
  getDashboardGreeting,
  getDashboardMerlinInsight,
  getDashboardPrivacySharingStatus,
  getWeeklyProgress,
  hasCompletedDashboardOnboarding,
} from "./utils/player-dashboard-presenters";
import type { SimpleChartData } from "../../core/models/chart.models";

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  description: string;
}

interface _ScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: number;
  completed: boolean;
  icon?: string;
}

interface AnnouncementBanner {
  message: string | null; // From backend
  coachName: string | null; // From backend
  postedAt: Date | null; // From backend
  priority: "info" | "important";
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
  ],
  templateUrl: "./player-dashboard.component.html",
  styleUrl: "./player-dashboard.component.scss",
})
export class PlayerDashboardComponent {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly headerService = inject(HeaderService);
  private readonly trainingStatsService = inject(
    TrainingStatsCalculationService,
  );
  private readonly unifiedTrainingService = inject(UnifiedTrainingService);
  private readonly wellnessService = inject(WellnessService);
  private readonly dataConfidenceService = inject(DataConfidenceService);
  private readonly continuityService = inject(ContinuityIndicatorsService);
  private readonly acwrSpikeDetection = inject(AcwrSpikeDetectionService);
  private readonly privacySettingsService = inject(PrivacySettingsService);
  private readonly overrideLoggingService = inject(OverrideLoggingService);
  private readonly ownershipTransitionService = inject(
    OwnershipTransitionService,
  );
  private readonly missingDataDetectionService = inject(
    MissingDataDetectionService,
  );
  private readonly playerDashboardDataService = inject(PlayerDashboardDataService);
  private readonly channelService = inject(ChannelService);
  private readonly toastService = inject(ToastService);
  private readonly profileCompletionService = inject(ProfileCompletionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly nextGenMetricsService = inject(NextGenMetricsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

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

  // Announcement
  announcement = signal<AnnouncementBanner | null>(null);
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
  readinessScore = signal<number | null>(null); // Load from wellness service
  acwr = signal<number | null>(null); // Load from training stats - no fallback
  currentStreak = signal(0);
  weeklySessionsCompleted = signal(0);
  weeklySessionsPlanned = signal(7);

  // Wellness check-in tracking (UX Audit Fix #4)
  wellnessCheckedInToday = signal(false);
  lastWellnessCheckin = signal<Date | null>(null);
  checkinStreak = signal(0);

  // Next-gen preview
  nextGenEnabled = this.featureFlags.nextGenMetricsPreview;
  nextGenPreview = this.nextGenMetricsService.loadPreview;
  nextGenReadinessScore = computed(() => {
    const preview = this.nextGenPreview();
    return preview?.readiness?.score ?? null;
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

  // Week days
  weekDays = signal<
    Array<{
      name: string;
      short: string;
      completed: boolean;
      isToday: boolean;
      isFuture: boolean;
    }>
  >([]);

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

  // Events
  upcomingEvents = signal<
    Array<{
      id: string;
      day: string;
      month: string;
      title: string;
      type: string;
      typeLabel: string;
    }>
  >([]);

  // Performance chart - uses Chart.js format
  performanceChartData = signal<SimpleChartData | null>(null);

  // Quick actions (order preserved from wireframe)
  quickActions: QuickAction[] = [
    {
      label: "Log Today’s Session",
      icon: "pi pi-plus",
      route: "/todays-practice",
      description: "Go to today’s practice and log your session",
    },
    {
      label: "Videos",
      icon: "pi pi-video",
      route: "/training/videos",
      description: "Watch training videos",
    },
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
      label: "Merlin AI",
      icon: "pi pi-sparkles",
      route: "/chat",
      description: "Talk to Merlin",
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
      this.readinessScore(),
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
      meaning: this.getCoachOverrideMeaning(override),
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

  readonly upcomingDisplayEvents = computed(() =>
    this.upcomingEvents().map((event) => ({
      ...event,
      severity: getDashboardEventSeverity(event.type),
    })),
  );

  constructor() {
    this.headerService.setDashboardHeader();

    // Load centralized services first (for consistent data across views)
    this.profileCompletionService.loadProfileData();
    this.teamMembershipService.loadMembership();

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
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Load user info
    const user = this.currentUser();
    const metadata = user?.user_metadata as
      | { fullName?: string; firstName?: string }
      | undefined;
    const fullName = metadata?.fullName || metadata?.firstName;
    if (fullName) {
      this.userName.set(fullName.split(" ")[0]);
    }

    // Initialize week days
    this.initializeWeekDays();

    // this.announcementService.getLatestAnnouncement().subscribe(announcement => this.announcement.set(announcement));
    // For now, set structure with null values - will be populated from backend
    this.announcement.set({
      message: null, // From backend: e.g., "Practice tomorrow moved to 6PM due to field availability."
      coachName: null, // From backend: e.g., "Coach Smith"
      postedAt: null, // From backend: e.g., new Date()
      priority: "info", // From backend: 'info' | 'important'
    });

    // Load training stats
    this.trainingStatsService
      .getTrainingStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.logger.error("Failed to load training stats:", error);
          return of(null);
        }),
      )
      .subscribe((stats) => {
        this.applyTrainingStats(stats);
        this.refreshDashboardInsights();
        this.isLoading.set(false);
      });
  }

  private applyTrainingStats(
    stats:
      | {
          acwr?: number | null;
          currentStreak?: number;
          weeklySessions?: number;
          trainingDaysLogged?: number | null;
        }
      | null
      | undefined,
  ): void {
    // CRITICAL: Only set ACWR if we have real data - no fallback defaults
    if (stats?.acwr !== undefined && typeof stats.acwr === "number") {
      this.acwr.set(stats.acwr);
    } else {
      this.acwr.set(null);
    }

    this.currentStreak.set(stats?.currentStreak ?? 0);
    this.weeklySessionsCompleted.set(stats?.weeklySessions ?? 0);
    this.trainingDaysLogged.set(stats?.trainingDaysLogged ?? null);
  }

  private refreshDashboardInsights(): void {
    this.loadReadinessScore();
    this.loadContinuityEvents();
    this.checkAcwrSpike();
    this.loadRecentOverrides();
    this.loadActiveTransitions();
    this.loadMissingWellnessStatus();

    // The chart data (weeklyData with label/value) will come from the API
    // this.performanceService.getWeeklyTrend().subscribe(...)
    // For now, performanceChartData remains null (shows empty state)

    // Today's schedule is loaded via UnifiedTrainingService.todaysScheduleItems()
    // which is computed from weeklySchedule signal. Data is loaded by getTodayOverview()
    // or loadAllTrainingData() which is called during component initialization.

    // The events data (day, month, title, type, typeLabel) will come from the API
    // this.eventsService.getUpcomingEvents().subscribe(...)
    // For now, upcomingEvents remains empty (section hidden)
  }

  private getCurrentUserId(): string | null {
    return this.currentUserId() || null;
  }

  private loadReadinessScore(): void {
    // Load latest wellness entry and calculate readiness score
    const latestWellness = this.wellnessService.latestWellnessEntry();
    if (latestWellness) {
      const score = this.wellnessService.getWellnessScore(latestWellness);
      // Wellness score is 0-10; dashboard readiness uses 0-100 scale.
      const normalizedScore = Math.round(score * 10);
      this.readinessScore.set(normalizedScore);
    } else {
      // No wellness data - set to null (show empty state)
      this.readinessScore.set(null);
    }
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

  /**
   * Phase 2.1 - Trust Repair: Load recent coach override notifications
   */
  private async loadRecentOverrides(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const overrides =
        await this.overrideLoggingService.getRecentUnreadOverrides(userId, 5);
      this.recentOverrides.set(overrides);

      // Load coach names for display
      if (overrides.length > 0) {
        await this.loadCoachNames(overrides);
      }
    } catch (error) {
      this.logger.error("player_dashboard_overrides_load_failed", error);
    }
  }

  /**
   * Phase 3: Convert MissingDataStatus to semantic IncompleteDataMeaning
   */
  getIncompleteDataMeaning(): IncompleteDataMeaning | null {
    const status = this.missingWellnessStatus();
    if (!status || !status.missing) {
      return null;
    }

    // Calculate confidence impact based on days missing
    let confidenceImpact = 0.1; // Base impact
    if (status.daysMissing >= 7) {
      confidenceImpact = 0.4; // Critical impact
    } else if (status.daysMissing >= 3) {
      confidenceImpact = 0.3; // High impact
    } else if (status.daysMissing >= 2) {
      confidenceImpact = 0.2; // Moderate impact
    }

    return {
      type: "incomplete-data",
      severity: status.severity === "critical" ? "critical" : "warning",
      dataType: "wellness",
      daysMissing: status.daysMissing,
      affectedMetric: "acwr",
      confidenceImpact,
      message: `Missing wellness data for ${status.daysMissing} day${status.daysMissing > 1 ? "s" : ""}. This reduces ACWR calculation accuracy.`,
    };
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
   * Phase 3: Convert CoachOverride to semantic CoachOverrideMeaning
   */
  getCoachOverrideMeaning(
    override: CoachOverride,
  ): CoachOverrideMeaning | null {
    if (!override.aiRecommendation || !override.coachDecision) {
      return null;
    }

    // Map override type to semantic override type
    const overrideTypeMap: Record<
      string,
      CoachOverrideMeaning["overrideType"]
    > = {
      training_load: "load-adjustment",
      session_modification: "session-modification",
      acwr_override: "threshold-override",
      recovery_protocol: "plan-change",
      other: "general",
    };

    return {
      type: "coach-override",
      overrideType: overrideTypeMap[override.overrideType] || "general",
      affectedEntity: `player-${override.playerId}`,
      aiRecommendation: override.aiRecommendation,
      coachDecision: override.coachDecision,
      coachId: override.coachId,
      coachName: this.getCoachName(override.coachId),
      reason: override.reason,
      timestamp: override.createdAt ? new Date(override.createdAt) : new Date(),
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

  /**
   * Phase 2.1 - Load active ownership transitions for player
   */
  private async loadActiveTransitions(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const transitions =
        await this.ownershipTransitionService.getPlayerTransitions(userId, 5);

      // Filter for active (pending or in_progress) transitions
      const active = transitions.filter(
        (t) => t.status === "pending" || t.status === "in_progress",
      );

      this.activeTransitions.set(active);
    } catch (error) {
        this.logger.error("player_dashboard_transitions_load_failed", error);
    }
  }

  /**
   * Phase 2.2 - Load missing wellness data status
   */
  private async loadMissingWellnessStatus(): Promise<void> {
    const userId = this.currentUserId();
    if (!userId) return;

    try {
      const status =
        await this.missingDataDetectionService.checkMissingWellness(userId);
      this.missingWellnessStatus.set(status);
    } catch (error) {
      this.logger.error(
        "player_dashboard_wellness_status_failed",
        error,
      );
    }
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const weekDays = days.map((short, index) => ({
      name: fullDays[index],
      short,
      completed: index < dayOfWeek,
      isToday: index === dayOfWeek,
      isFuture: index > dayOfWeek,
    }));

    this.weekDays.set(weekDays);
  }

  dismissAnnouncement(): void {
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
   * Check if wellness check-in is overdue (> 1 day since last check-in)
   * UX Audit Fix #4
   */
  checkinOverdue(): boolean {
    return this.daysSinceLastCheckin() > 1;
  }

  /**
   * Calculate days since last wellness check-in
   * UX Audit Fix #4
   */
  daysSinceLastCheckin(): number {
    const lastCheckin = this.lastWellnessCheckin();
    if (!lastCheckin) return 99; // Never checked in

    const now = new Date();
    const diffMs = now.getTime() - lastCheckin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(date: Date | null | undefined): string {
    return getTimeAgo(date);
  }

  getReadinessStatus(): string {
    return this.dashboardReadinessPresentation().label;
  }

  getReadinessSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    return this.dashboardReadinessPresentation().severity;
  }

  getAcwrStatus(): string {
    return this.dashboardAcwrDisplay().label;
  }

  getAcwrSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    return this.dashboardAcwrDisplay().severity;
  }

}
