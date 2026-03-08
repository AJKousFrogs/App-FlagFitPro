/**
 * Training Schedule Component
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
 * - Replace raw spacing values with tokens
 * - Replace raw colors with tokens
 */

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { TrainingBuilderComponent } from "../../shared/components/training-builder/training-builder.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import {
  SwipeGestureDirective,
  SwipeEvent,
} from "../../shared/directives/swipe-gesture.directive";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { ApiResponse } from "../../core/models/common.models";
import {
  Workout,
  Achievement,
  WeeklyScheduleDay,
} from "../../core/models/training.models";
import { UI_LIMITS } from "../../core/constants/app.constants";
import { getProtocolReadinessPresentation } from "../../core/utils/protocol-metrics-presentation";

interface AchievementApiRecord {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned?: boolean;
  earnedAt?: string;
}

interface AchievementStreak {
  streak_type: string;
  current_streak?: number;
}

@Component({
  selector: "app-training",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatusTagComponent,
    Tooltip,
    MainLayoutComponent,
    StatsGridComponent,
    TrainingBuilderComponent,
    SwipeGestureDirective,
    ButtonComponent,
    AlertComponent,
    CardShellComponent,
  ],
  templateUrl: "./training.component.html",
  styleUrl: "./training.component.scss",
})
export class TrainingComponent {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly toastService = inject(ToastService);
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // Expose constants to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // Expose state signals to template (readonly references)
  readonly userName = this.trainingService.userName;
  readonly trainingStats = this.trainingService.trainingStats;
  readonly weeklySchedule = this.trainingService.weeklySchedule;
  readonly workouts = this.trainingService.workouts;
  readonly achievements = this.trainingService.achievements;
  readonly isRefreshing = this.trainingService.isRefreshing;
  readonly wellnessAlert = this.trainingService.wellnessAlert;
  readonly readinessScore = this.trainingService.readinessScore;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly todayProtocol = this.trainingService.todayProtocol;

  // Computed signals from state service
  readonly hasWorkouts = computed(() => this.workouts().length > 0);
  readonly shouldShowWellnessAlert = computed(
    () => this.wellnessAlert() !== null,
  );
  readonly wellnessAlertVariant = computed(() =>
    this.wellnessAlert()?.severity === "critical" ? "error" : "warning",
  );
  readonly wellnessAlertTitle = computed(() =>
    this.wellnessAlert()?.severity === "critical"
      ? "Recovery check-in required"
      : "Recovery update recommended",
  );

  // New signals for achievements/streaks integration
  readonly streakCount = signal(0);
  readonly totalAchievements = signal(0);
  readonly recentAchievements = signal<
    Array<{ id: string; icon: string; title: string; description: string }>
  >([]);
  readonly daysUntilOlympics = signal(0);
  readonly overallProgress = signal(0);

  // Position-specific signals
  readonly playerPosition = signal<string | null>(null);
  readonly positionLabel = signal("Athlete");
  readonly positionIcon = signal("🏈");
  readonly positionQuickActions = signal<
    Array<{ icon: string; label: string; route: string; tooltip: string }>
  >([]);
  readonly positionWorkouts = signal<
    Array<{
      title: string;
      description: string;
      icon: string;
      priority: "high" | "medium" | "low";
    }>
  >([]);

  // Computed for readiness badge status
  readonly readinessPresentation = computed(() =>
    getProtocolReadinessPresentation(
      this.todayProtocol(),
      this.readinessScore(),
    ),
  );
  readonly readinessStatus = computed(
    () => this.readinessPresentation().cssClass,
  );

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    // Configure header for training page
    this.headerService.setTrainingHeader();

    // Load player settings to get position
    await this.loadPlayerPosition();

    // Load all training data using data loader service
    await this.loadData();

    // Load achievements data
    await this.loadAchievementsData();

    // Calculate Olympics countdown
    this.calculateOlympicsCountdown();
  }

  /**
   * Load all training data and update state
   * Refactored: Delegates to unified training service
   */
  private async loadData(): Promise<void> {
    try {
      await firstValueFrom(this.trainingService.getTodayOverview());
    } catch (error) {
      this.logger.error("Error loading training data", error);
      this.toastService.error(TOAST.ERROR.LOAD_FAILED);
    }
  }

  /**
   * Load achievements and streaks data
   * UX AUDIT FIX: Added user feedback on error (previously silent)
   */
  private async loadAchievementsData(): Promise<void> {
    try {
      const response: ApiResponse<{ achievements?: AchievementApiRecord[] }> =
        await firstValueFrom(
        this.api.get(API_ENDPOINTS.achievements.list),
      );
      if (response?.success && response.data) {
        const earned =
          response.data.achievements?.filter(
            (a) => a.earned,
          ) || [];
        this.totalAchievements.set(earned.length);
        this.recentAchievements.set(
          earned
            .sort(
              (a, b) =>
                new Date(b.earnedAt || 0).getTime() -
                new Date(a.earnedAt || 0).getTime(),
            )
            .slice(0, 5)
            .map(
              (a) => ({
                id: a.id,
                icon: a.icon,
                title: a.name,
                description: a.description,
              }),
            ),
        );
      }

      // Load streaks
      const streaksResponse: ApiResponse<{ streaks?: AchievementStreak[] }> =
        await firstValueFrom(
        this.api.get(API_ENDPOINTS.achievements.streaks),
      );
      if (streaksResponse?.success && streaksResponse.data?.streaks) {
        const trainingStreak = streaksResponse.data.streaks.find(
          (s) => s.streak_type === "training",
        );
        this.streakCount.set(trainingStreak?.current_streak || 0);
      }
    } catch (error) {
      this.logger.error("Error loading achievements data", error);
      // UX FIX: Show non-blocking toast instead of silent failure
      // Only show on non-404 errors (404 means user has no achievements yet - expected)
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status !== 404) {
          this.toastService.warn(TOAST.ERROR.ACHIEVEMENTS_LOAD_FAILED);
        }
      }
    }
  }

  /**
   * Calculate days until LA 2028 Olympics
   */
  private calculateOlympicsCountdown(): void {
    const olympicsDate = new Date("2028-07-14");
    const now = new Date();
    const diff = olympicsDate.getTime() - now.getTime();
    this.daysUntilOlympics.set(Math.ceil(diff / (1000 * 60 * 60 * 24)));

    // Calculate rough progress (from 2025 to 2028 = ~1277 days)
    const totalDays = 1277;
    const daysCompleted = totalDays - this.daysUntilOlympics();
    this.overallProgress.set(
      Math.min(100, Math.max(0, Math.round((daysCompleted / totalDays) * 100))),
    );
  }

  /**
   * Load player position and configure position-specific UI
   */
  private async loadPlayerPosition(): Promise<void> {
    try {
      const response: ApiResponse<{ position?: string }> =
        await firstValueFrom(
        this.api.get(API_ENDPOINTS.playerSettings.get),
      );
      if (response?.success && response.data?.position) {
        const position = response.data.position;
        this.playerPosition.set(position);
        this.configurePositionUI(position);
      } else {
        // Default to generic athlete
        this.configurePositionUI("athlete");
      }
    } catch (error) {
      this.logger.error("Error loading player position", error);
      this.configurePositionUI("athlete");
    }
  }

  /**
   * Configure UI based on player position
   */
  private configurePositionUI(position: string): void {
    const positionConfig: Record<
      string,
      {
        label: string;
        icon: string;
        quickActions: Array<{
          icon: string;
          label: string;
          route: string;
          tooltip: string;
        }>;
        priorityWorkouts: Array<{
          title: string;
          description: string;
          icon: string;
          priority: "high" | "medium" | "low";
        }>;
      }
    > = {
      // Quarterback
      qb: {
        label: "Quarterback",
        icon: "🎯",
        quickActions: [
          {
            icon: "🎯",
            label: "Throwing",
            route: "/training/qb/throwing",
            tooltip: "Track throwing sessions & arm care",
          },
          {
            icon: "💪",
            label: "Arm Care",
            route: "/training/qb/throwing",
            tooltip: "Rotator cuff & arm health",
          },
          {
            icon: "🦵",
            label: "Hip Mobility",
            route: "/training",
            tooltip: "Hip & shoulder mobility",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Throwing Progression",
            description: "Structured throw count with arm care",
            icon: "🎯",
            priority: "high",
          },
          {
            title: "Hip 90/90 Mobility",
            description: "QB-specific hip rotation",
            icon: "🦵",
            priority: "high",
          },
          {
            title: "Rotator Cuff Warm-up",
            description: "Pre-throwing arm prep",
            icon: "💪",
            priority: "high",
          },
          {
            title: "Footwork Drills",
            description: "Drop-back & pocket movement",
            icon: "👟",
            priority: "medium",
          },
        ],
      },
      quarterback: {
        label: "Quarterback",
        icon: "🎯",
        quickActions: [
          {
            icon: "🎯",
            label: "Throwing",
            route: "/training/qb/throwing",
            tooltip: "Track throwing sessions & arm care",
          },
          {
            icon: "💪",
            label: "Arm Care",
            route: "/training/qb/throwing",
            tooltip: "Rotator cuff & arm health",
          },
          {
            icon: "🦵",
            label: "Hip Mobility",
            route: "/training",
            tooltip: "Hip & shoulder mobility",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Throwing Progression",
            description: "Structured throw count with arm care",
            icon: "🎯",
            priority: "high",
          },
          {
            title: "Hip 90/90 Mobility",
            description: "QB-specific hip rotation",
            icon: "🦵",
            priority: "high",
          },
          {
            title: "Rotator Cuff Warm-up",
            description: "Pre-throwing arm prep",
            icon: "💪",
            priority: "high",
          },
          {
            title: "Footwork Drills",
            description: "Drop-back & pocket movement",
            icon: "👟",
            priority: "medium",
          },
        ],
      },
      // Center
      center: {
        label: "Center",
        icon: "🎯",
        quickActions: [
          {
            icon: "🎯",
            label: "Snap Drills",
            route: "/training",
            tooltip: "Snap mechanics & accuracy",
          },
          {
            icon: "💪",
            label: "Core Work",
            route: "/training",
            tooltip: "Core stability for snapping",
          },
          {
            icon: "🏃",
            label: "Blocking",
            route: "/training",
            tooltip: "Pass protection drills",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Snap Mechanics",
            description: "Shotgun & under-center snaps",
            icon: "🎯",
            priority: "high",
          },
          {
            title: "Core Stability",
            description: "Anti-rotation & bracing",
            icon: "💪",
            priority: "high",
          },
          {
            title: "Hip Hinge Drills",
            description: "Proper snap position",
            icon: "🦵",
            priority: "high",
          },
          {
            title: "Hand-Eye Coordination",
            description: "Snap accuracy under pressure",
            icon: "👁️",
            priority: "medium",
          },
        ],
      },
      // Blitzer (Rusher who chases QB)
      blitzer: {
        label: "Blitzer",
        icon: "⚡",
        quickActions: [
          {
            icon: "⚡",
            label: "Decel Drills",
            route: "/training",
            tooltip: "Deceleration & change of direction",
          },
          {
            icon: "🏃",
            label: "Sprint Work",
            route: "/training",
            tooltip: "Acceleration & top speed",
          },
          {
            icon: "🦵",
            label: "Agility",
            route: "/training",
            tooltip: "Lateral movement & cuts",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "3-Step Deceleration",
            description: "Controlled stopping at speed",
            icon: "⚡",
            priority: "high",
          },
          {
            title: "Change of Direction",
            description: "Quick cuts & redirects",
            icon: "↩️",
            priority: "high",
          },
          {
            title: "Sprint Mechanics",
            description: "Acceleration technique",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Reactive Agility",
            description: "Read & react drills",
            icon: "👁️",
            priority: "medium",
          },
        ],
      },
      rusher: {
        label: "Rusher",
        icon: "⚡",
        quickActions: [
          {
            icon: "⚡",
            label: "Decel Drills",
            route: "/training",
            tooltip: "Deceleration & change of direction",
          },
          {
            icon: "🏃",
            label: "Sprint Work",
            route: "/training",
            tooltip: "Acceleration & top speed",
          },
          {
            icon: "🦵",
            label: "Agility",
            route: "/training",
            tooltip: "Lateral movement & cuts",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "3-Step Deceleration",
            description: "Controlled stopping at speed",
            icon: "⚡",
            priority: "high",
          },
          {
            title: "Change of Direction",
            description: "Quick cuts & redirects",
            icon: "↩️",
            priority: "high",
          },
          {
            title: "Sprint Mechanics",
            description: "Acceleration technique",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Reactive Agility",
            description: "Read & react drills",
            icon: "👁️",
            priority: "medium",
          },
        ],
      },
      // Wide Receiver
      wr: {
        label: "Wide Receiver",
        icon: "🏃",
        quickActions: [
          {
            icon: "🏃",
            label: "Route Running",
            route: "/training",
            tooltip: "Route technique & timing",
          },
          {
            icon: "⚡",
            label: "Speed Work",
            route: "/training",
            tooltip: "Sprint & acceleration",
          },
          {
            icon: "🤲",
            label: "Catching",
            route: "/training",
            tooltip: "Hand-eye coordination",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Route Trees",
            description: "Full route combinations",
            icon: "🗺️",
            priority: "high",
          },
          {
            title: "Release Moves",
            description: "Off the line techniques",
            icon: "💨",
            priority: "high",
          },
          {
            title: "Sprint Training",
            description: "Top-end speed development",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Catching Drills",
            description: "Contested & over-shoulder",
            icon: "🤲",
            priority: "medium",
          },
        ],
      },
      "wide receiver": {
        label: "Wide Receiver",
        icon: "🏃",
        quickActions: [
          {
            icon: "🏃",
            label: "Route Running",
            route: "/training",
            tooltip: "Route technique & timing",
          },
          {
            icon: "⚡",
            label: "Speed Work",
            route: "/training",
            tooltip: "Sprint & acceleration",
          },
          {
            icon: "🤲",
            label: "Catching",
            route: "/training",
            tooltip: "Hand-eye coordination",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Route Trees",
            description: "Full route combinations",
            icon: "🗺️",
            priority: "high",
          },
          {
            title: "Release Moves",
            description: "Off the line techniques",
            icon: "💨",
            priority: "high",
          },
          {
            title: "Sprint Training",
            description: "Top-end speed development",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Catching Drills",
            description: "Contested & over-shoulder",
            icon: "🤲",
            priority: "medium",
          },
        ],
      },
      // Defensive Back
      db: {
        label: "Defensive Back",
        icon: "🛡️",
        quickActions: [
          {
            icon: "🛡️",
            label: "Coverage",
            route: "/training",
            tooltip: "Man & zone techniques",
          },
          {
            icon: "🏃",
            label: "Backpedal",
            route: "/training",
            tooltip: "Backpedal & transition",
          },
          {
            icon: "👁️",
            label: "Ball Drills",
            route: "/training",
            tooltip: "Interception technique",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Backpedal & Break",
            description: "Hip turn & transition",
            icon: "↩️",
            priority: "high",
          },
          {
            title: "Mirror Drills",
            description: "Shadowing receivers",
            icon: "🪞",
            priority: "high",
          },
          {
            title: "Sprint Training",
            description: "Recovery speed",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Ball Skills",
            description: "High-point & intercept",
            icon: "🏈",
            priority: "medium",
          },
        ],
      },
      "defensive back": {
        label: "Defensive Back",
        icon: "🛡️",
        quickActions: [
          {
            icon: "🛡️",
            label: "Coverage",
            route: "/training",
            tooltip: "Man & zone techniques",
          },
          {
            icon: "🏃",
            label: "Backpedal",
            route: "/training",
            tooltip: "Backpedal & transition",
          },
          {
            icon: "👁️",
            label: "Ball Drills",
            route: "/training",
            tooltip: "Interception technique",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Backpedal & Break",
            description: "Hip turn & transition",
            icon: "↩️",
            priority: "high",
          },
          {
            title: "Mirror Drills",
            description: "Shadowing receivers",
            icon: "🪞",
            priority: "high",
          },
          {
            title: "Sprint Training",
            description: "Recovery speed",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Ball Skills",
            description: "High-point & intercept",
            icon: "🏈",
            priority: "medium",
          },
        ],
      },
      // Default/Athlete
      athlete: {
        label: "Athlete",
        icon: "🏈",
        quickActions: [
          {
            icon: "🏃",
            label: "Speed",
            route: "/training",
            tooltip: "Sprint & acceleration",
          },
          {
            icon: "📊",
            label: "Periodization",
            route: "/training/periodization",
            tooltip: "View your training plan",
          },
          {
            icon: "💚",
            label: "Recovery",
            route: "/travel/recovery",
            tooltip: "Recovery protocols",
          },
          {
            icon: "🏆",
            label: "Achievements",
            route: "/training",
            tooltip: "View all achievements",
          },
        ],
        priorityWorkouts: [
          {
            title: "Sprint Training",
            description: "Speed development",
            icon: "🏃",
            priority: "high",
          },
          {
            title: "Agility Drills",
            description: "Change of direction",
            icon: "↩️",
            priority: "high",
          },
          {
            title: "Core Stability",
            description: "Athletic foundation",
            icon: "💪",
            priority: "medium",
          },
          {
            title: "Mobility Work",
            description: "Flexibility & range",
            icon: "🧘",
            priority: "medium",
          },
        ],
      },
    };

    const normalizedPosition = position.toLowerCase().trim();
    const config =
      positionConfig[normalizedPosition] || positionConfig["athlete"];

    this.positionLabel.set(config.label);
    this.positionIcon.set(config.icon);
    this.positionQuickActions.set(config.quickActions);
    this.positionWorkouts.set(config.priorityWorkouts);
  }

  /**
   * Check if a day name is today
   */
  isToday(dayName: string): boolean {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return dayName.toLowerCase() === today.toLowerCase();
  }

  /**
   * Check if current player is a QB
   */
  isQB(): boolean {
    const pos = this.playerPosition()?.toLowerCase();
    return pos === "qb" || pos === "quarterback";
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  goToWellnessCheckin(): void {
    this.router.navigate(["/wellness"]);
  }

  goToDailyProtocol(): void {
    this.router.navigate(["/todays-practice"]);
  }

  toggleScheduleView(): void {
    this.router.navigate(["/training/schedule"]);
  }

  openScheduleBuilder(): void {
    this.router.navigate(["/training/builder"]);
  }

  goToQBThrowing(): void {
    this.router.navigate(["/training/qb/throwing"]);
  }

  goToPeriodization(): void {
    this.router.navigate(["/training/periodization"]);
  }

  goToRecovery(): void {
    this.router.navigate(["/travel/recovery"]);
  }

  goToAchievements(): void {
    // Open achievements dialog in daily protocol or navigate
    this.router.navigate(["/training"]);
  }

  goToRoadmap(): void {
    // Navigate to daily protocol which has the LA28 roadmap
    this.router.navigate(["/training"]);
  }

  showAllWorkouts(): void {
    // Could open a dialog or navigate to a workouts page
    this.toastService.info(TOAST.INFO.SHOWING_ALL_WORKOUTS);
  }

  /**
   * Navigate to position-specific action
   */
  navigateToAction(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Start a position-priority workout
   */
  startPriorityWorkout(workout: {
    title: string;
    description: string;
    icon: string;
    priority: string;
  }): void {
    this.toastService.info(`Starting ${workout.title}`);
    // Navigate to daily protocol which will handle the workout
    this.router.navigate(["/training"], {
      queryParams: {
        focus: workout.title.toLowerCase().replace(/\s+/g, "-"),
      },
    });
  }

  // ============================================================================
  // WELLNESS METHODS
  // ============================================================================

  dismissWellnessAlert(): void {
    this.trainingService.dismissWellnessAlert();
  }

  // ============================================================================
  // WORKOUT ACTION METHODS
  // ============================================================================

  /**
   * Start a workout session
   * Navigates to workout page with context
   */
  startWorkout(workout: Workout): void {
    this.toastService.info(`Starting ${workout.title}`);
    this.router.navigate(["/workout"], {
      queryParams: {
        type: workout.type,
        title: workout.title,
        duration: workout.duration,
      },
    });
  }

  /**
   * Handle swipe right gesture - marks workout as complete
   */
  async onSwipeRight(event: SwipeEvent, workout: Workout): Promise<void> {
    const success = await this.trainingService.markWorkoutComplete(workout);

    if (success) {
      this.trainingService.removeWorkout(workout.title);
      this.toastService.success(`${workout.title} marked as complete!`);
    } else {
      this.toastService.error(TOAST.ERROR.SESSION_COMPLETE_FAILED);
    }
  }

  /**
   * Handle swipe left gesture - postpones workout to tomorrow
   */
  async onSwipeLeft(event: SwipeEvent, workout: Workout): Promise<void> {
    const success = await this.trainingService.postponeWorkout(workout);

    if (success) {
      this.trainingService.removeWorkout(workout.title);
      this.toastService.info(`${workout.title} postponed to tomorrow`);
    } else {
      this.toastService.error(TOAST.ERROR.SESSION_POSTPONE_FAILED);
    }
  }

  /**
   * Refresh all training data
   * Triggered by pull-to-refresh gesture
   */
  async refreshTrainingData(): Promise<void> {
    await this.loadData();
    this.toastService.success(TOAST.SUCCESS.TRAINING_DATA_REFRESHED);
  }

  // ============================================================================
  // TRACKBY FUNCTIONS - Template Optimization
  // ============================================================================

  trackByDayName(index: number, day: WeeklyScheduleDay): string {
    return day.name;
  }

  trackBySessionTime(
    index: number,
    session: { time: string; title: string },
  ): string {
    return session.time || index.toString();
  }

  trackByWorkoutTitle(index: number, workout: Workout): string {
    return workout.title || workout.id || index.toString();
  }

  trackByAchievementTitle(index: number, achievement: Achievement): string {
    return achievement.title || achievement.id || index.toString();
  }
}
