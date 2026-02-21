/**
 * Player Dashboard Component
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar
 * ==========================================
 * This page is FROZEN as a design system exemplar.
 *
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - This page demonstrates correct design system usage
 *
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * The main overview page for athletes showing:
 * - Announcement banner (important team messages)
 * - Today's readiness and wellness status
 * - Weekly training progress
 * - Upcoming schedule highlights
 * - Quick access to key features
 * - Merlin AI Merlin insights
 */

import { CommonModule, DecimalPipe } from "@angular/common";
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
import { Card } from "primeng/card";
import { Message } from "primeng/message";
import { ProgressBar } from "primeng/progressbar";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Timeline } from "primeng/timeline";
import { Tooltip } from "primeng/tooltip";
import { of } from "rxjs";
import { catchError } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { TrainingStatsCalculationService } from "../../core/services/training-stats-calculation.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { WellnessService } from "../../core/services/wellness.service";
import { ChannelService } from "../../core/services/channel.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { DataConfidenceService } from "../../core/services/data-confidence.service";
import { ContinuityIndicatorsService } from "../../core/services/continuity-indicators.service";
import { AcwrSpikeDetectionService } from "../../core/services/acwr-spike-detection.service";
import {
  PrivacySettingsService,
  METRIC_CATEGORIES,
} from "../../core/services/privacy-settings.service";
import { ConfidenceIndicatorComponent } from "../../shared/components/confidence-indicator/confidence-indicator.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { LINE_CHART_OPTIONS } from "../../shared/config/chart.config";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";
import { ChartSkeletonComponent } from "../../shared/components/chart-skeleton/chart-skeleton.component";
import { DashboardSkeletonComponent } from "../../shared/components/dashboard-skeleton/dashboard-skeleton.component";
import { CoachOverrideNotificationComponent } from "../../shared/components/coach-override-notification/coach-override-notification.component";
import {
  OverrideLoggingService,
  CoachOverride,
} from "../../core/services/override-logging.service";
import { OwnershipTransitionBadgeComponent } from "../../shared/components/ownership-transition-badge/ownership-transition-badge.component";
import {
  OwnershipTransitionService,
  OwnershipTransition,
} from "../../core/services/ownership-transition.service";
import { MissingDataExplanationComponent } from "../../shared/components/missing-data-explanation/missing-data-explanation.component";
import {
  MissingDataDetectionService,
  MissingDataStatus,
} from "../../core/services/missing-data-detection.service";
import { SemanticMeaningRendererComponent } from "../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
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
import { getReadinessLevel } from "../../core/constants/wellness.constants";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { PlayerDashboardDataService } from "./services/player-dashboard-data.service";
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DecimalPipe,
    Card,
    StatusTagComponent,
    ButtonComponent,

    LazyChartComponent,
    ChartSkeletonComponent,
    DashboardSkeletonComponent,
    Tooltip,
    ProgressBar,
    Message,
    Timeline,
    MainLayoutComponent,
    PageErrorStateComponent,
    ConfidenceIndicatorComponent,
    CoachOverrideNotificationComponent,
    OwnershipTransitionBadgeComponent,
    MissingDataExplanationComponent,
    SemanticMeaningRendererComponent,
  ],
  templateUrl: "./player-dashboard.component.html",
  styleUrl: "./player-dashboard.component.scss",
})
export class PlayerDashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
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
  // Per audit: use currentUser() signal for reactivity, not getUser() method
  currentUserId = computed(() => this.authService.currentUser()?.id ?? "");

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

  // ACWR progress tracking (UX Audit Fix #5)
  trainingDaysLogged = signal<number | null>(null); // Calculate from real training sessions
  acwrDataSufficient = computed(() => {
    const days = this.trainingDaysLogged();
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
      label: "Analytics",
      icon: "pi pi-chart-bar",
      route: "/analytics",
      description: "Performance analytics",
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
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  });

  merlinInsight = computed(() => {
    const readiness = this.readinessScore();
    const acwrVal = this.acwr();

    // CRITICAL: Only provide insights if we have real data
    if (readiness === null && acwrVal === null) {
      return "Complete a wellness check-in and log training sessions to get personalized insights.";
    }

    if (readiness !== null && readiness < 50) {
      return "Your readiness is low today. Consider a lighter session focused on recovery and mobility.";
    }
    if (acwrVal !== null && acwrVal > 1.3) {
      return "Your training load is elevated. Take it easy today to avoid overtraining and reduce injury risk.";
    }
    if (
      readiness !== null &&
      readiness >= 80 &&
      acwrVal !== null &&
      acwrVal <= 1.0
    ) {
      return "You're in great shape! Today is perfect for a high-intensity session. Let's push it!";
    }
    return "Solid day ahead! Stick to your plan and focus on quality over quantity in today's session.";
  });

  weeklyProgress = computed(() => {
    const completed = this.weeklySessionsCompleted();
    const planned = this.weeklySessionsPlanned();
    return planned > 0 ? Math.round((completed / planned) * 100) : 0;
  });

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
    const teamSettings = this.privacySettingsService.teamSettings();
    const totalMetrics = METRIC_CATEGORIES.length; // 6 metrics

    if (teamSettings.length === 0) {
      return {
        sharedMetrics: 0,
        totalMetrics,
        sharingEnabled: false,
      };
    }

    // Count shared metrics across all teams
    // For simplicity, count metrics shared with at least one team
    const sharedCategories = new Set<string>();
    teamSettings.forEach((teamSetting) => {
      if (
        teamSetting.performanceSharingEnabled ||
        teamSetting.healthSharingEnabled
      ) {
        // Add all allowed metric categories
        teamSetting.allowedMetricCategories?.forEach((category) => {
          sharedCategories.add(category);
        });

        // If performance sharing is enabled, add performance and training_load
        if (teamSetting.performanceSharingEnabled) {
          sharedCategories.add("performance");
          sharedCategories.add("training_load");
        }

        // If health sharing is enabled, add wellness, readiness, injury_history
        if (teamSetting.healthSharingEnabled) {
          sharedCategories.add("wellness");
          sharedCategories.add("readiness");
          sharedCategories.add("injury_history");
        }
      }
    });

    return {
      sharedMetrics: sharedCategories.size,
      totalMetrics,
      sharingEnabled: sharedCategories.size > 0,
    };
  });

  // Continuity Events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  continuityEvents = signal<any[]>([]);

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

    // Trigger data loading in UnifiedTrainingService to populate schedule
    // This ensures today's schedule is available
    this.unifiedTrainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.logger.info("[Dashboard] Today's overview data loaded");
        },
        error: (error) => {
          this.logger.error("[Dashboard] Error loading today's overview:", error);
        },
      });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Load user info
    const user = this.authService.getUser();
    if (user?.name) {
      this.userName.set(user.name.split(" ")[0]);
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
        // CRITICAL: Only set ACWR if we have real data - no fallback defaults
        if (stats?.acwr !== undefined && typeof stats.acwr === "number") {
          this.acwr.set(stats.acwr);
        } else {
          this.acwr.set(null); // No data - show empty state
        }

        this.currentStreak.set(stats?.currentStreak ?? 0);
        this.weeklySessionsCompleted.set(stats?.weeklySessions ?? 0);

        // Training days logged: use when backend provides it; fallback to null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const statsAny = stats as any;
        this.trainingDaysLogged.set(statsAny?.trainingDaysLogged ?? null);

        // Load readiness score from wellness service
        this.loadReadinessScore();

        // Load continuity events
        this.loadContinuityEvents();

        // Load privacy settings
        // Note: loadTeamSettings is a private method, handled internally by the service

        // Load ACWR spike detection if ACWR is high
        this.checkAcwrSpike();

        // Phase 2.1 - Load recent coach override notifications
        this.loadRecentOverrides();

        // Phase 2.1 - Load active ownership transitions
        this.loadActiveTransitions();

        // Phase 2.2 - Load missing wellness data status
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

        this.isLoading.set(false);
      });
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
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      const events = await this.continuityService.getPlayerContinuity(user.id);
      this.continuityEvents.set(events);
    } catch (error) {
      this.logger.error("[Dashboard] Error loading continuity events:", error);
    }
  }

  private async checkAcwrSpike(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    const acwrValue = this.acwr();
    if (acwrValue !== null && acwrValue > 1.5) {
      try {
        await this.acwrSpikeDetection.checkAndCapLoad(user.id, acwrValue);
        // Reload continuity events to show the new load cap
        await this.loadContinuityEvents();
      } catch (error) {
        this.logger.error("[Dashboard] Error checking ACWR spike:", error);
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
      this.logger.error("[Dashboard] Error loading recent overrides:", error);
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
        this.logger.error("[Dashboard] Error loading coach names:", error);
        return;
      }

      // Update cache
      profiles?.forEach((profile) => {
        cache[profile.id] = profile.full_name || "Your coach";
      });

      this.coachNamesCache.set(cache);
    } catch (error) {
      this.logger.error("[Dashboard] Error loading coach names:", error);
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
      this.logger.error("[Dashboard] Error loading active transitions:", error);
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
        "[Dashboard] Error loading missing wellness status:",
        error,
      );
    }
  }

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      recovery_protocol: "🏈",
      load_cap: "⚠️",
      travel_recovery: "🛫",
      rtp_protocol: "🏥",
      wellness_focus: "💚",
    };
    return icons[type] || "📋";
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
      const teamId = this.teamMembershipService.teamId();
      if (!teamId) {
        this.toastService.warn(TOAST.WARN.NO_TEAM);
        this.router.navigate(["/team-chat"]);
        return;
      }

      // Get coach using centralized service
      const coach = await this.teamMembershipService.getTeamCoach();
      if (!coach?.userId) {
        this.toastService.warn(TOAST.WARN.NO_COACH);
        this.router.navigate(["/team-chat"]);
        return;
      }

      // Create or find existing DM channel with the coach
      const dmChannel = await this.channelService.createDirectMessage(
        coach.userId,
        teamId,
      );

      // Navigate to team chat with the DM channel selected
      this.router.navigate(["/team-chat"], {
        queryParams: { channel: dmChannel.id },
      });
    } catch (error) {
      this.logger.error("Error contacting coach:", error);
      this.toastService.error(TOAST.ERROR.CHAT_START_FAILED);
      // Fallback to team chat
      this.router.navigate(["/team-chat"]);
    }
  }

  /**
   * Check if user has completed onboarding/profile
   * Uses centralized ProfileCompletionService for consistency
   * UX Audit Fix #3
   */
  hasCompletedOnboarding(): boolean {
    // Use ProfileCompletionService for consistent calculation
    const status = this.profileCompletionService.completionStatus();
    // Profile is considered "complete" for onboarding if required fields are filled
    // or if percentage is >= 80% (allowing some optional fields to be missing)
    return status.missingRequired.length === 0 || status.percentage >= 80;
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
    this.router.navigate(["/acwr"]);
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
    const score = this.readinessScore();
    if (score === null) return "No data";
    return getReadinessLevel(score).label;
  }

  getReadinessSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    const score = this.readinessScore();
    if (score === null) return "info";
    const severity = getReadinessLevel(score).severity;
    return severity === "warning" ? "warning" : severity;
  }

  getAcwrStatus(): string {
    const value = this.acwr();
    if (value === null) return "No data";
    if (value <= 1.0) return "Optimal";
    if (value <= 1.3) return "Elevated";
    return "High";
  }

  getAcwrSeverity():
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "secondary"
    | "primary" {
    const value = this.acwr();
    if (value === null) return "info";
    if (value <= 1.0) return "success";
    if (value <= 1.3) return "warning";
    return "danger";
  }

  getEventSeverity(
    type: string,
  ): "success" | "warning" | "danger" | "info" | "secondary" | "primary" {
    switch (type) {
      case "game":
        return "danger";
      case "tournament":
        return "warning";
      default:
        return "success";
    }
  }
}
