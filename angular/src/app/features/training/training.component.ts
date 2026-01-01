import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router } from "@angular/router";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { TrainingBuilderComponent } from "../../shared/components/training-builder/training-builder.component";
import {
  SwipeGestureDirective,
  SwipeEvent,
} from "../../shared/directives/swipe-gesture.directive";
import { HeaderService } from "../../core/services/header.service";
import { TrainingStateService } from "../../core/services/training-state.service";
import { TrainingDataLoaderService } from "../../core/services/training-data-loader.service";
import {
  Workout,
  Achievement,
  TrainingStatCard,
  WeeklyScheduleDay,
} from "../../core/models/training.models";

@Component({
  selector: "app-training",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    ToastModule,
    DialogModule,
    MainLayoutComponent,
    StatsGridComponent,
    TrainingBuilderComponent,
    SwipeGestureDirective,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div
        class="training-page"
        [class.refreshing]="isRefreshing()"
        appSwipeGesture
        [enablePullToRefresh]="true"
        (pullToRefresh)="refreshTrainingData()"
      >
        <!-- Wellness Alert Banner -->
        @if (wellnessAlert()) {
          <div
            class="wellness-alert-banner"
            [class]="'alert-' + wellnessAlert()!.severity"
          >
            <div class="alert-icon">
              @if (wellnessAlert()!.severity === "critical") {
                🚨
              } @else {
                ⚠️
              }
            </div>
            <div class="alert-content">
              <h3>{{ wellnessAlert()!.message }}</h3>
              <ul class="alert-recommendations">
                @for (rec of wellnessAlert()!.recommendations; track rec) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </div>
            <div class="alert-actions">
              <button class="alert-btn" (click)="goToWellnessCheckin()">
                Update Wellness
              </button>
              <button class="alert-dismiss" (click)="dismissWellnessAlert()">
                ✕
              </button>
            </div>
          </div>
        }

        <!-- Readiness Score Badge -->
        @if (readinessScore() > 0 && !wellnessAlert()) {
          <div class="readiness-badge" [class]="readinessStatus()">
            <span class="readiness-icon">
              @if (readinessStatus() === "excellent") {
                🟢
              } @else if (readinessStatus() === "good") {
                🔵
              } @else if (readinessStatus() === "caution") {
                🟡
              } @else {
                🔴
              }
            </span>
            <span class="readiness-label"
              >Readiness: {{ readinessScore() }}%</span
            >
          </div>
        }

        <!-- Hero Section -->
        <div class="hero-section">
          <p-card class="hero-card">
            <div class="hero-badge">Training Hub</div>
            <h1 class="hero-title">
              Welcome back, <span>{{ userName() }}!</span>
            </h1>
            <p class="hero-subtitle">Ready to dominate today?</p>
            <div class="hero-note">Your Weekly Performance Snapshot</div>
          </p-card>
        </div>

        <!-- Smart Training Session Builder -->
        <app-training-builder></app-training-builder>

        <!-- Training Stats Grid -->
        <app-stats-grid [stats]="trainingStats()"></app-stats-grid>

        <!-- Weekly Schedule -->
        <p-card class="schedule-card">
          <ng-template pTemplate="header">
            <div class="section-header">
              <h2>
                <i class="pi pi-calendar"></i>
                Weekly Training Schedule
              </h2>
              <p-button
                label="View Details"
                icon="pi pi-th-large"
                [outlined]="true"
                (onClick)="toggleScheduleView()"
              ></p-button>
            </div>
          </ng-template>
          <div class="weekly-schedule-grid">
            @for (day of weeklySchedule(); track trackByDayName($index, day)) {
              <div class="schedule-day">
                <div class="day-name">{{ day.name }}</div>
                <div class="day-sessions">
                  @for (
                    session of day.sessions;
                    track trackBySessionTime($index, session)
                  ) {
                    <div class="session-item">
                      <div class="session-time">{{ session.time }}</div>
                      <div class="session-title">{{ session.title }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </p-card>

        <!-- Training Grid -->
        <div class="training-grid">
          <!-- Workouts Section -->
          <p-card class="workouts-section">
            <ng-template pTemplate="header">
              <h2>
                <i class="pi pi-bolt"></i>
                Available Workouts
              </h2>
            </ng-template>
            <div class="workouts-list">
              @for (
                workout of workouts();
                track trackByWorkoutTitle($index, workout)
              ) {
                <div
                  class="workout-card"
                  [style.border-color]="workout.iconBg"
                  [class.swiping-right]="
                    swipingWorkoutId() === workout.title &&
                    swipeDirection() === 'right'
                  "
                  [class.swiping-left]="
                    swipingWorkoutId() === workout.title &&
                    swipeDirection() === 'left'
                  "
                  appSwipeGesture
                  (swipeRight)="onSwipeRight($event, workout)"
                  (swipeLeft)="onSwipeLeft($event, workout)"
                >
                  <div class="workout-icon" [style.background]="workout.iconBg">
                    <i [class]="workout.icon"></i>
                  </div>
                  <div class="workout-content">
                    <h3 class="workout-title">{{ workout.title }}</h3>
                    <p class="workout-description">{{ workout.description }}</p>
                    <div class="workout-meta">
                      <span>⏱️ {{ workout.duration }}</span>
                      <span>🔥 {{ workout.intensity }}</span>
                      <span>📍 {{ workout.location }}</span>
                    </div>
                  </div>
                  <p-button
                    label="Start"
                    (onClick)="startWorkout(workout)"
                  ></p-button>
                </div>
              }
            </div>
          </p-card>

          <!-- Progress & Achievements -->
          <p-card class="progress-section">
            <ng-template pTemplate="header">
              <h2>
                <i class="pi pi-chart-line"></i>
                Progress & Achievements
              </h2>
            </ng-template>
            <div class="achievements-list">
              @for (
                achievement of achievements();
                track trackByAchievementTitle($index, achievement)
              ) {
                <div class="achievement-item">
                  <div class="achievement-icon">{{ achievement.icon }}</div>
                  <div class="achievement-content">
                    <div class="achievement-title">{{ achievement.title }}</div>
                    <div class="achievement-date">{{ achievement.date }}</div>
                  </div>
                </div>
              }
            </div>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .training-page {
        padding: var(--space-6);
        position: relative;
      }

      .training-page::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--color-brand-primary);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s;
        z-index: 10;
      }

      /* Wellness Alert Banner */
      .wellness-alert-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-5);
        border-radius: var(--radius-xl);
        margin-bottom: var(--space-6);
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .wellness-alert-banner.alert-critical {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border: 2px solid var(--color-status-error);
      }

      .wellness-alert-banner.alert-warning {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px solid var(--color-status-warning);
      }

      .alert-icon {
        font-size: var(--text-3xl);
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;
      }

      .alert-content h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--text-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .alert-recommendations {
        margin: 0;
        padding-left: var(--space-4);
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .alert-recommendations li {
        margin-bottom: var(--space-1);
      }

      .alert-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .alert-btn {
        padding: var(--space-2) var(--space-4);
        background: var(--color-brand-primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: background 0.2s;
      }

      .alert-btn:hover {
        background: var(--color-brand-primary-dark);
      }

      .alert-dismiss {
        background: none;
        border: none;
        font-size: var(--text-xl);
        cursor: pointer;
        padding: var(--space-1);
        opacity: 0.6;
        transition: opacity 0.2s;
      }

      .alert-dismiss:hover {
        opacity: 1;
      }

      /* Readiness Badge */
      .readiness-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-4);
      }

      .readiness-badge.excellent {
        background: var(--color-status-success-subtle);
        color: var(--color-status-success);
      }

      .readiness-badge.good {
        background: #dbeafe;
        color: #2563eb;
      }

      .readiness-badge.caution {
        background: var(--color-status-warning-subtle);
        color: #d97706;
      }

      .readiness-badge.rest {
        background: var(--color-status-error-subtle);
        color: var(--color-status-error);
      }

      @media (max-width: 640px) {
        .wellness-alert-banner {
          flex-direction: column;
        }

        .alert-actions {
          flex-direction: row;
          width: 100%;
        }

        .alert-btn {
          flex: 1;
        }
      }

      .training-page.refreshing::before {
        transform: scaleX(1);
        animation: refresh-indicator 1s ease-in-out;
      }

      @keyframes refresh-indicator {
        0% {
          transform: scaleX(0);
        }
        50% {
          transform: scaleX(1);
        }
        100% {
          transform: scaleX(0);
        }
      }

      .hero-section {
        margin-bottom: var(--space-8);
      }

      .hero-card {
        background: linear-gradient(
          135deg,
          var(--color-brand-primary),
          var(--color-brand-secondary)
        );
        color: white;
        border: none;
      }

      .hero-badge {
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: var(--font-body-sm);
        opacity: 0.9;
        margin-bottom: var(--space-4);
        color: inherit; /* Inherit white from hero-card */
      }

      .hero-title {
        font-size: var(--font-display-sm);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-4);
        color: inherit; /* Inherit white from hero-card */

        span {
          color: inherit; /* Ensure nested span also inherits white */
        }
      }

      .hero-subtitle {
        font-size: var(--font-heading-sm);
        opacity: 0.9;
        margin-bottom: var(--space-6);
        color: inherit; /* Inherit white from hero-card */
      }

      .hero-note {
        font-size: var(--font-body-sm);
        opacity: 0.7;
        color: inherit; /* Inherit white from hero-card */
      }

      .schedule-cta-card {
        margin-bottom: var(--space-8);
      }

      .cta-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-6);
        flex-wrap: wrap;
      }

      .cta-text h2 {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-4);
        color: var(--color-brand-primary);
      }

      .cta-text p {
        max-width: 600px;
        color: var(--text-secondary);
        margin: 0;
      }

      .schedule-card {
        margin-bottom: var(--space-8);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .section-header h2 {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin: 0;
      }

      .weekly-schedule-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .schedule-day {
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
      }

      .day-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-3);
      }

      .session-item {
        padding: var(--space-2);
        margin-bottom: var(--space-2);
        background: white;
        border-radius: var(--p-border-radius);
      }

      .session-time {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .session-title {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .training-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--space-6);
      }

      .workouts-section,
      .progress-section {
        height: 100%;
      }

      .workouts-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .workout-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-5);
        border: 2px solid;
        border-radius: var(--p-border-radius);
        transition: all 0.2s;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .workout-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .workout-card.swiping-right {
        transform: translateX(100px);
        opacity: 0.7;
        background: var(--color-brand-primary-subtle);
      }

      .workout-card.swiping-left {
        transform: translateX(-100px);
        opacity: 0.7;
        background: var(--color-status-warning-light);
      }

      .workout-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }

      .workout-card.swiping-right::before {
        content: "✓ Complete";
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-brand-primary);
        color: var(--color-text-on-primary);
        font-weight: var(--font-weight-semibold);
        opacity: 1;
      }

      .workout-card.swiping-left::before {
        content: "⏱ Postpone";
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-status-warning);
        color: var(--color-text-on-primary);
        font-weight: var(--font-weight-semibold);
        opacity: 1;
      }

      .workout-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--p-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--icon-2xl);
        color: var(--color-text-on-primary);
      }

      .workout-content {
        flex: 1;
      }

      .workout-title {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-2);
      }

      .workout-description {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .workout-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .achievements-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .achievement-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
      }

      .achievement-icon {
        font-size: var(--icon-3xl);
      }

      .achievement-title {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .achievement-date {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .training-grid {
          grid-template-columns: 1fr;
        }

        .cta-content {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class TrainingComponent implements OnInit {
  // Refactored: Now using dedicated services for state and data loading
  private trainingState = inject(TrainingStateService);
  private trainingDataLoader = inject(TrainingDataLoaderService);
  private toastService = inject(ToastService);
  private headerService = inject(HeaderService);
  private router = inject(Router);

  // Expose state signals to template (readonly references)
  readonly userName = this.trainingState.userName;
  readonly trainingStats = this.trainingState.trainingStats;
  readonly weeklySchedule = this.trainingState.weeklySchedule;
  readonly workouts = this.trainingState.workouts;
  readonly achievements = this.trainingState.achievements;
  readonly swipingWorkoutId = this.trainingState.swipingWorkoutId;
  readonly swipeDirection = this.trainingState.swipeDirection;
  readonly isRefreshing = this.trainingState.isRefreshing;
  readonly wellnessAlert = this.trainingState.wellnessAlert;
  readonly readinessScore = this.trainingState.readinessScore;
  readonly readinessStatus = this.trainingState.readinessStatus;

  // Computed signals from state service
  readonly hasWorkouts = this.trainingState.hasWorkouts;
  readonly shouldShowWellnessAlert = this.trainingState.shouldShowWellnessAlert;

  async ngOnInit(): Promise<void> {
    // Configure header for training page
    this.headerService.setTrainingHeader();

    // Load all training data using data loader service
    await this.loadData();
  }

  /**
   * Load all training data and update state
   * Refactored: Delegates to data loader service
   */
  private async loadData(): Promise<void> {
    try {
      const data = await this.trainingDataLoader.loadAllTrainingData();

      // Update state service with loaded data
      this.trainingState.setAllTrainingData({
        userName: data.userName || "Athlete",
        stats: data.stats,
        schedule: data.schedule,
        workouts: data.workouts,
        achievements: data.achievements,
        wellnessAlert: data.wellnessData.alert,
        readinessScore: data.wellnessData.readinessScore,
        readinessStatus: data.wellnessData.readinessStatus,
      });
    } catch (error) {
      console.error("Error loading training data:", error);
      this.toastService.error("Failed to load training data");
    }
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  goToWellnessCheckin(): void {
    this.router.navigate(["/wellness"]);
  }

  toggleScheduleView(): void {
    this.router.navigate(["/training/schedule"]);
  }

  openScheduleBuilder(): void {
    this.router.navigate(["/training/builder"]);
  }

  // ============================================================================
  // WELLNESS METHODS
  // ============================================================================

  dismissWellnessAlert(): void {
    this.trainingState.dismissWellnessAlert();
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
    // Set swipe animation state
    this.trainingState.setSwipeState(workout.title, "right");

    // Animate, then complete workout
    setTimeout(async () => {
      const success =
        await this.trainingDataLoader.markWorkoutComplete(workout);

      if (success) {
        this.trainingState.removeWorkout(workout.title);
        this.toastService.success(`${workout.title} marked as complete!`);
      } else {
        this.toastService.error("Failed to mark workout as complete");
      }

      this.trainingState.clearSwipeState();
    }, 300);
  }

  /**
   * Handle swipe left gesture - postpones workout to tomorrow
   */
  async onSwipeLeft(event: SwipeEvent, workout: Workout): Promise<void> {
    // Set swipe animation state
    this.trainingState.setSwipeState(workout.title, "left");

    // Animate, then postpone workout
    setTimeout(async () => {
      const success = await this.trainingDataLoader.postponeWorkout(workout);

      if (success) {
        this.trainingState.removeWorkout(workout.title);
        this.toastService.info(`${workout.title} postponed to tomorrow`);
      } else {
        this.toastService.error("Failed to postpone workout");
      }

      this.trainingState.clearSwipeState();
    }, 300);
  }

  /**
   * Refresh all training data
   * Triggered by pull-to-refresh gesture
   */
  async refreshTrainingData(): Promise<void> {
    this.trainingState.setRefreshing(true);

    await this.loadData();

    setTimeout(() => {
      this.trainingState.setRefreshing(false);
      this.toastService.success("Training data refreshed");
    }, 1000);
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
