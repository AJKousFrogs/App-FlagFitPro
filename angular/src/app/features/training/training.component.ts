import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { ToastModule } from "primeng/toast";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { TrainingBuilderComponent } from "../../shared/components/training-builder/training-builder.component";
import {
  SwipeGestureDirective,
  SwipeEvent,
} from "../../shared/directives/swipe-gesture.directive";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { SupabaseService } from "../../core/services/supabase.service";

interface StatCard {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconBg: string;
}

interface Workout {
  type: string;
  title: string;
  description: string;
  duration: string;
  intensity: string;
  location: string;
  icon: string;
  iconBg: string;
}

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
      }

      .hero-title {
        font-size: var(--font-display-sm);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-4);
      }

      .hero-subtitle {
        font-size: var(--font-heading-sm);
        opacity: 0.9;
        margin-bottom: var(--space-6);
      }

      .hero-note {
        font-size: var(--font-body-sm);
        opacity: 0.7;
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
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private headerService = inject(HeaderService);
  private supabaseService = inject(SupabaseService);

  userName = signal("Alex");
  stats = signal<StatCard[]>([]);
  trainingStats = signal<Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
    trend: string;
    trendType: "positive" | "negative" | "neutral";
  }>>([]);
  weeklySchedule = signal<Array<{
    name: string;
    sessions: Array<{ time: string; title: string }>;
  }>>([]);
  workouts = signal<Workout[]>([]);
  achievements = signal<Array<{
    icon: string;
    title: string;
    date: string;
  }>>([]);
  swipingWorkoutId = signal<string | null>(null);
  swipeDirection = signal<"left" | "right" | null>(null);
  isRefreshing = signal(false);

  ngOnInit(): void {
    // Configure header for training page
    this.headerService.setTrainingHeader();
    this.loadTrainingData();
  }

  loadTrainingData(): void {
    // Load stats for StatsGridComponent
    this.trainingStats.set([
      {
        label: "This Week",
        value: "4/7",
        icon: "pi-bolt",
        color: "#f1c40f",
        trend: "🔥 Sessions Completed",
        trendType: "positive",
      },
      {
        label: "Current Streak",
        value: "12 days",
        icon: "pi-bullseye",
        color: "#89c300",
        trend: "📊 Personal best streak!",
        trendType: "positive",
      },
      {
        label: "Total Hours",
        value: "28.5h",
        icon: "pi-clock",
        color: "#10c96b",
        trend: "⬆️ +4.2h this week",
        trendType: "positive",
      },
      {
        label: "Next Session",
        value: "Olympic Prep",
        icon: "pi-calendar",
        color: "#89c300",
        trend: "📅 Today at 3:00 PM",
        trendType: "neutral",
      },
    ]);

    // Load weekly schedule
    this.weeklySchedule.set([
      {
        name: "Monday",
        sessions: [
          { time: "10:00 AM", title: "Speed Training" },
          { time: "3:00 PM", title: "Strength" },
        ],
      },
      {
        name: "Tuesday",
        sessions: [{ time: "9:00 AM", title: "Agility Drills" }],
      },
      {
        name: "Wednesday",
        sessions: [{ time: "2:00 PM", title: "Endurance" }],
      },
      {
        name: "Thursday",
        sessions: [{ time: "10:00 AM", title: "Speed Training" }],
      },
      { name: "Friday", sessions: [{ time: "3:00 PM", title: "Recovery" }] },
      {
        name: "Saturday",
        sessions: [{ time: "9:00 AM", title: "Game Practice" }],
      },
      { name: "Sunday", sessions: [] },
    ]);

    // Load workouts
    this.workouts.set([
      {
        type: "speed",
        title: "Speed Training",
        description: "Sprint intervals and agility drills",
        duration: "45 min",
        intensity: "High intensity",
        location: "Track required",
        icon: "🏃",
        iconBg: "linear-gradient(135deg, #f1c40f, #f39c12)",
      },
      {
        type: "strength",
        title: "Strength Training",
        description: "Core and functional strength",
        duration: "60 min",
        intensity: "Medium intensity",
        location: "Gym access",
        icon: "💪",
        iconBg:
          "linear-gradient(135deg, var(--color-brand-primary-light), var(--ds-primary-green))",
      },
      {
        type: "agility",
        title: "Agility & Coordination",
        description: "Ladder drills and cone work",
        duration: "30 min",
        intensity: "High intensity",
        location: "Field required",
        icon: "🏃",
        iconBg: "linear-gradient(135deg, #3498db, #2980b9)",
      },
    ]);

    // Load achievements
    this.achievements.set([
      { icon: "🏆", title: "7-Day Streak", date: "2 days ago" },
      { icon: "⚡", title: "Speed Master", date: "1 week ago" },
      { icon: "💪", title: "Strength Champion", date: "2 weeks ago" },
    ]);
  }

  openScheduleBuilder(): void {
    // Training builder is now integrated directly in the template
    // Scroll to builder if needed
    const builderElement = document.querySelector("app-training-builder");
    if (builderElement) {
      builderElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  toggleScheduleView(): void {
    // Toggle schedule view - implementation pending
  }

  startWorkout(workout: Workout): void {
    // Start workout - implementation pending
    this.toastService.info(`Starting ${workout.title}`);
  }

  onSwipeRight(event: SwipeEvent, workout: Workout): void {
    this.swipingWorkoutId.set(workout.title);
    this.swipeDirection.set("right");

    setTimeout(() => {
      this.markWorkoutComplete(workout);
      this.swipingWorkoutId.set(null);
      this.swipeDirection.set(null);
    }, 300);
  }

  onSwipeLeft(event: SwipeEvent, workout: Workout): void {
    this.swipingWorkoutId.set(workout.title);
    this.swipeDirection.set("left");

    setTimeout(() => {
      this.postponeWorkout(workout);
      this.swipingWorkoutId.set(null);
      this.swipeDirection.set(null);
    }, 300);
  }

  async markWorkoutComplete(workout: Workout): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Log completed workout to training_sessions
      await this.supabaseService.client
        .from("training_sessions")
        .insert({
          user_id: user.id,
          session_type: workout.type || workout.title,
          duration_minutes: parseInt(workout.duration) || 45,
          intensity: workout.intensity?.toLowerCase() || "moderate",
          status: "completed",
          completed_at: new Date().toISOString(),
          scheduled_date: new Date().toISOString(),
          notes: `Completed: ${workout.title}`,
        });

      this.toastService.success(`${workout.title} marked as complete! 🎉`);

      // Remove from workouts list
      this.workouts.update((workouts) =>
        workouts.filter((w) => w.title !== workout.title)
      );
    } catch (error) {
      this.toastService.error("Failed to mark workout as complete");
    }
  }

  async postponeWorkout(workout: Workout): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      // Schedule for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await this.supabaseService.client
        .from("training_sessions")
        .insert({
          user_id: user.id,
          session_type: workout.type || workout.title,
          duration_minutes: parseInt(workout.duration) || 45,
          intensity: workout.intensity?.toLowerCase() || "moderate",
          status: "scheduled",
          scheduled_date: tomorrow.toISOString(),
          notes: `Postponed: ${workout.title}`,
        });

      this.toastService.info(`${workout.title} postponed to tomorrow`);

      // Remove from today's workouts
      this.workouts.update((workouts) =>
        workouts.filter((w) => w.title !== workout.title)
      );
    } catch (error) {
      this.toastService.error("Failed to postpone workout");
    }
  }

  refreshTrainingData(): void {
    this.isRefreshing.set(true);
    this.loadTrainingData();

    setTimeout(() => {
      this.isRefreshing.set(false);
      this.toastService.success("Training data has been refreshed");
    }, 1000);
  }

  trackByStatTitle(index: number, stat: StatCard): string {
    return stat.title;
  }

  trackByDayName(index: number, day: { name: string; sessions: Array<{ time: string; title: string }> }): string {
    return day.name;
  }

  trackBySessionTime(index: number, session: { time: string; title: string }): string {
    return session.time || index.toString();
  }

  trackByWorkoutTitle(index: number, workout: Workout): string {
    return workout.title;
  }

  trackByAchievementTitle(index: number, achievement: { icon: string; title: string; date: string }): string {
    return achievement.title || index.toString();
  }
}
