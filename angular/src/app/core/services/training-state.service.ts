import { Injectable, signal, computed } from "@angular/core";
import {
  TrainingStatCard,
  WeeklyScheduleDay,
  Workout,
  Achievement,
  WellnessAlert,
  ReadinessStatus,
} from "../models/training.models";

/**
 * Training State Service
 *
 * Centralized state management for Training Component.
 * Manages all UI state using Angular signals for optimal reactivity.
 *
 * Responsibilities:
 * - Manage 14 signals for training data and UI state
 * - Provide computed signals for derived state
 * - Expose state mutation methods
 * - NO async operations (pure state management)
 *
 * Pattern follows notification-state.service and wellness-state patterns.
 *
 * @example
 * ```typescript
 * export class TrainingComponent {
 *   private trainingState = inject(TrainingStateService);
 *
 *   readonly stats = this.trainingState.trainingStats;
 *   readonly workouts = this.trainingState.workouts;
 * }
 * ```
 */
@Injectable({
  providedIn: "root",
})
export class TrainingStateService {
  // ============================================================================
  // SIGNALS - User State
  // ============================================================================

  private readonly _userName = signal<string>("");
  readonly userName = this._userName.asReadonly();

  // ============================================================================
  // SIGNALS - Training Data State
  // ============================================================================

  private readonly _trainingStats = signal<TrainingStatCard[]>([]);
  readonly trainingStats = this._trainingStats.asReadonly();

  private readonly _weeklySchedule = signal<WeeklyScheduleDay[]>([]);
  readonly weeklySchedule = this._weeklySchedule.asReadonly();

  private readonly _workouts = signal<Workout[]>([]);
  readonly workouts = this._workouts.asReadonly();

  private readonly _achievements = signal<Achievement[]>([]);
  readonly achievements = this._achievements.asReadonly();

  // ============================================================================
  // SIGNALS - UI Interaction State
  // ============================================================================

  private readonly _swipingWorkoutId = signal<string | null>(null);
  readonly swipingWorkoutId = this._swipingWorkoutId.asReadonly();

  private readonly _swipeDirection = signal<"left" | "right" | null>(null);
  readonly swipeDirection = this._swipeDirection.asReadonly();

  private readonly _isRefreshing = signal(false);
  readonly isRefreshing = this._isRefreshing.asReadonly();

  // ============================================================================
  // SIGNALS - Wellness Integration State
  // ============================================================================

  private readonly _wellnessAlert = signal<WellnessAlert | null>(null);
  readonly wellnessAlert = this._wellnessAlert.asReadonly();

  private readonly _readinessScore = signal(0);
  readonly readinessScore = this._readinessScore.asReadonly();

  private readonly _readinessStatus = signal<ReadinessStatus>("good");
  readonly readinessStatus = this._readinessStatus.asReadonly();

  private readonly _wellnessAlertDismissed = signal(false);
  readonly wellnessAlertDismissed = this._wellnessAlertDismissed.asReadonly();

  // ============================================================================
  // COMPUTED SIGNALS - Derived State
  // ============================================================================

  /**
   * Whether there are any workouts available
   */
  readonly hasWorkouts = computed(() => this.workouts().length > 0);

  /**
   * Whether there are any achievements to display
   */
  readonly hasAchievements = computed(() => this.achievements().length > 0);

  /**
   * Whether there are scheduled sessions in the weekly schedule
   */
  readonly hasScheduledSessions = computed(() =>
    this.weeklySchedule().some((day) => day.sessions.length > 0),
  );

  /**
   * Whether wellness alert should be displayed
   */
  readonly shouldShowWellnessAlert = computed(
    () => this.wellnessAlert() !== null && !this.wellnessAlertDismissed(),
  );

  /**
   * Current week session count
   */
  readonly weeklySessionCount = computed(() =>
    this.weeklySchedule().reduce(
      (total, day) => total + day.sessions.length,
      0,
    ),
  );

  /**
   * Workout count by intensity
   */
  readonly workoutsByIntensity = computed(() => {
    const workouts = this.workouts();
    return {
      low: workouts.filter((w) => w.intensity === "low").length,
      medium: workouts.filter((w) => w.intensity === "medium").length,
      high: workouts.filter((w) => w.intensity === "high").length,
    };
  });

  /**
   * Whether currently in swipe animation
   */
  readonly isSwping = computed(() => this.swipingWorkoutId() !== null);

  /**
   * Wellness status indicator
   */
  readonly wellnessStatus = computed(() => {
    const status = this.readinessStatus();
    const score = this.readinessScore();

    return {
      status,
      score,
      color: this.getStatusColor(status),
      icon: this.getStatusIcon(status),
      label: this.getStatusLabel(status),
    };
  });

  // ============================================================================
  // STATE MUTATION METHODS - User State
  // ============================================================================

  /**
   * Set user name
   */
  setUserName(name: string): void {
    this._userName.set(name);
  }

  // ============================================================================
  // STATE MUTATION METHODS - Training Data
  // ============================================================================

  /**
   * Set training statistics cards
   */
  setTrainingStats(stats: TrainingStatCard[]): void {
    this._trainingStats.set(stats);
  }

  /**
   * Set weekly schedule
   */
  setWeeklySchedule(schedule: WeeklyScheduleDay[]): void {
    this._weeklySchedule.set(schedule);
  }

  /**
   * Set available workouts
   */
  setWorkouts(workouts: Workout[]): void {
    this._workouts.set(workouts);
  }

  /**
   * Set achievements
   */
  setAchievements(achievements: Achievement[]): void {
    this._achievements.set(achievements);
  }

  /**
   * Add a single workout to the list
   */
  addWorkout(workout: Workout): void {
    this._workouts.update((current) => [...current, workout]);
  }

  /**
   * Remove workout by title or ID
   */
  removeWorkout(workoutIdentifier: string): void {
    this._workouts.update((current) =>
      current.filter(
        (w) => w.title !== workoutIdentifier && w.id !== workoutIdentifier,
      ),
    );
  }

  /**
   * Update a specific workout
   */
  updateWorkout(workoutId: string, updates: Partial<Workout>): void {
    this._workouts.update((current) =>
      current.map((w) => (w.id === workoutId ? { ...w, ...updates } : w)),
    );
  }

  /**
   * Mark workout as completed
   */
  markWorkoutCompleted(workoutId: string): void {
    this.updateWorkout(workoutId, { completed: true });
  }

  // ============================================================================
  // STATE MUTATION METHODS - UI Interaction
  // ============================================================================

  /**
   * Set refreshing state
   */
  setRefreshing(isRefreshing: boolean): void {
    this._isRefreshing.set(isRefreshing);
  }

  /**
   * Set swipe state for workout animation
   */
  setSwipeState(
    workoutId: string | null,
    direction: "left" | "right" | null,
  ): void {
    this._swipingWorkoutId.set(workoutId);
    this._swipeDirection.set(direction);
  }

  /**
   * Clear swipe state
   */
  clearSwipeState(): void {
    this._swipingWorkoutId.set(null);
    this._swipeDirection.set(null);
  }

  // ============================================================================
  // STATE MUTATION METHODS - Wellness Integration
  // ============================================================================

  /**
   * Set wellness alert
   */
  setWellnessAlert(alert: WellnessAlert | null): void {
    this._wellnessAlert.set(alert);
    // Reset dismissed state when new alert is set
    if (alert !== null) {
      this._wellnessAlertDismissed.set(false);
    }
  }

  /**
   * Set readiness score and status
   */
  setReadinessScore(score: number, status: ReadinessStatus): void {
    this._readinessScore.set(score);
    this._readinessStatus.set(status);
  }

  /**
   * Dismiss wellness alert (hides it from view)
   */
  dismissWellnessAlert(): void {
    this._wellnessAlertDismissed.set(true);
  }

  /**
   * Clear wellness alert completely
   */
  clearWellnessAlert(): void {
    this._wellnessAlert.set(null);
    this._wellnessAlertDismissed.set(false);
  }

  // ============================================================================
  // BULK STATE OPERATIONS
  // ============================================================================

  /**
   * Reset all state to initial values
   * Useful for logout or data refresh
   */
  resetState(): void {
    this._userName.set("");
    this._trainingStats.set([]);
    this._weeklySchedule.set([]);
    this._workouts.set([]);
    this._achievements.set([]);
    this._swipingWorkoutId.set(null);
    this._swipeDirection.set(null);
    this._isRefreshing.set(false);
    this._wellnessAlert.set(null);
    this._readinessScore.set(0);
    this._readinessStatus.set("good");
    this._wellnessAlertDismissed.set(false);
  }

  /**
   * Set all training data at once
   * Optimized for initial load
   */
  setAllTrainingData(data: {
    userName?: string;
    stats: TrainingStatCard[];
    schedule: WeeklyScheduleDay[];
    workouts: Workout[];
    achievements: Achievement[];
    wellnessAlert: WellnessAlert | null;
    readinessScore: number;
    readinessStatus: ReadinessStatus;
  }): void {
    if (data.userName) {
      this._userName.set(data.userName);
    }
    this._trainingStats.set(data.stats);
    this._weeklySchedule.set(data.schedule);
    this._workouts.set(data.workouts);
    this._achievements.set(data.achievements);
    this._wellnessAlert.set(data.wellnessAlert);
    this._readinessScore.set(data.readinessScore);
    this._readinessStatus.set(data.readinessStatus);
    this._wellnessAlertDismissed.set(false);
  }

  // ============================================================================
  // HELPER METHODS - Private
  // ============================================================================

  private getStatusColor(status: ReadinessStatus): string {
    const colorMap: Record<ReadinessStatus, string> = {
      excellent: "#10b981", // green-500
      good: "#3b82f6", // blue-500
      caution: "#f59e0b", // amber-500
      rest: "#ef4444", // red-500
    };
    return colorMap[status] || colorMap.good;
  }

  private getStatusIcon(status: ReadinessStatus): string {
    const iconMap: Record<ReadinessStatus, string> = {
      excellent: "pi-check-circle",
      good: "pi-thumbs-up",
      caution: "pi-exclamation-triangle",
      rest: "pi-times-circle",
    };
    return iconMap[status] || iconMap.good;
  }

  private getStatusLabel(status: ReadinessStatus): string {
    const labelMap: Record<ReadinessStatus, string> = {
      excellent: "Excellent",
      good: "Ready to Train",
      caution: "Train with Caution",
      rest: "Rest Recommended",
    };
    return labelMap[status] || labelMap.good;
  }
}
