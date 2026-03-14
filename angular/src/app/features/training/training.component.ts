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

import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { TrainingBuilderComponent } from "../../shared/components/training-builder/training-builder.component";
import {
  TrainingOverviewSectionComponent,
  TrainingPriorityWorkoutView,
} from "./components/training-overview-section.component";
import { TrainingScheduleWorkoutsSectionComponent } from "./components/training-schedule-workouts-section.component";
import { TrainingFooterSectionComponent } from "./components/training-footer-section.component";
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
} from "../../core/models/training.models";
import { getProtocolReadinessPresentation } from "../../core/utils/protocol-metrics-presentation";
import {
  resolveTrainingPositionUI,
  TrainingPositionQuickAction,
  TrainingPositionWorkout,
} from "./training-position-config";

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
    MainLayoutComponent,
    StatsGridComponent,
    TrainingBuilderComponent,
    SwipeGestureDirective,
    TrainingOverviewSectionComponent,
    TrainingScheduleWorkoutsSectionComponent,
    TrainingFooterSectionComponent,
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
  readonly positionQuickActions = signal<TrainingPositionQuickAction[]>([]);
  readonly positionWorkouts = signal<TrainingPositionWorkout[]>([]);

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
    const config = resolveTrainingPositionUI(position);

    this.positionLabel.set(config.label);
    this.positionIcon.set(config.icon);
    this.positionQuickActions.set(config.quickActions);
    this.positionWorkouts.set(config.priorityWorkouts);
  }

  /**
   * Check if a day name is today
   */
  readonly currentDayName = computed(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );

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
    this.router.navigate(["/todays-practice"]);
  }

  goToRoadmap(): void {
    this.router.navigate(["/todays-practice"]);
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

  startPriorityWorkoutFromSection(
    workout: TrainingPriorityWorkoutView,
  ): void {
    this.startPriorityWorkout(workout);
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
    this.router.navigate(["/todays-practice"], {
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

  trackBySessionTime(
    index: number,
    session: { time: string; title: string },
  ): string {
    return session.time || index.toString();
  }
}
