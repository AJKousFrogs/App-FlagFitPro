import {
  Component,
  OnInit,
  inject,
  signal,
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
import { WorkoutCalendarComponent, WorkoutEntry } from "../../shared/components/workout-calendar/workout-calendar.component";
import { RestTimerComponent } from "../../shared/components/rest-timer/rest-timer.component";
import {
  SwipeGestureDirective,
  SwipeEvent,
} from "../../shared/directives/swipe-gesture.directive";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { WellnessService } from "../../core/services/wellness.service";

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
          <div class="wellness-alert-banner" [class]="'alert-' + wellnessAlert()!.severity">
            <div class="alert-icon">
              @if (wellnessAlert()!.severity === 'critical') {
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
              <button class="alert-dismiss" (click)="dismissWellnessAlert()">✕</button>
            </div>
          </div>
        }

        <!-- Readiness Score Badge -->
        @if (readinessScore() > 0 && !wellnessAlert()) {
          <div class="readiness-badge" [class]="readinessStatus()">
            <span class="readiness-icon">
              @if (readinessStatus() === 'excellent') { 🟢 }
              @else if (readinessStatus() === 'good') { 🔵 }
              @else if (readinessStatus() === 'caution') { 🟡 }
              @else { 🔴 }
            </span>
            <span class="readiness-label">Readiness: {{ readinessScore() }}%</span>
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
  private wellnessService = inject(WellnessService);
  private router = inject(Router);

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

  // Wellness-based training alerts
  wellnessAlert = signal<{
    severity: 'warning' | 'critical' | 'info';
    message: string;
    recommendations: string[];
  } | null>(null);
  readinessScore = signal(0);
  readinessStatus = signal<'excellent' | 'good' | 'caution' | 'rest'>('good');
  wellnessAlertDismissed = signal(false);

  ngOnInit(): void {
    // Configure header for training page
    this.headerService.setTrainingHeader();
    this.loadTrainingData();
    this.checkWellnessForTraining();
  }

  /**
   * Check today's wellness data and show training alerts if needed
   */
  private checkWellnessForTraining(): void {
    const latestWellness = this.wellnessService.latestWellnessEntry();
    
    if (!latestWellness) {
      // No wellness data today - prompt to check in
      return;
    }

    // Check if wellness data is from today
    const today = new Date().toISOString().split('T')[0];
    if (latestWellness.date !== today) {
      return; // Data is from a previous day
    }

    // Calculate readiness score
    const readiness = this.wellnessService.calculateReadinessScore(latestWellness);
    this.readinessScore.set(readiness.score);
    this.readinessStatus.set(readiness.status);

    // Check for training alerts
    if (!this.wellnessAlertDismissed()) {
      const alert = this.wellnessService.getTrainingAlert(latestWellness);
      if (alert) {
        this.wellnessAlert.set(alert);
      }
    }
  }

  goToWellnessCheckin(): void {
    this.router.navigate(['/wellness']);
  }

  dismissWellnessAlert(): void {
    this.wellnessAlertDismissed.set(true);
    this.wellnessAlert.set(null);
  }

  async loadTrainingData(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) {
      this.loadFallbackData();
      return;
    }

    try {
      // Load real training sessions from Supabase
      const { data: sessions, error: sessionsError } = await this.supabaseService.client
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Calculate real stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeekSessions = (sessions || []).filter(s => 
        new Date(s.scheduled_date) >= weekStart && s.status === 'completed'
      );
      const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      
      // Calculate streak
      let streak = 0;
      const sortedSessions = [...(sessions || [])].filter(s => s.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || b.scheduled_date).getTime() - new Date(a.completed_at || a.scheduled_date).getTime());
      
      if (sortedSessions.length > 0) {
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        
        for (const session of sortedSessions) {
          const sessionDate = new Date(session.completed_at || session.scheduled_date);
          sessionDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) {
            streak++;
            checkDate = sessionDate;
          } else {
            break;
          }
        }
      }

      // Find next scheduled session
      const upcomingSessions = (sessions || []).filter(s => 
        s.status === 'scheduled' && new Date(s.scheduled_date) >= now
      ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

      const nextSession = upcomingSessions[0];
      const nextSessionText = nextSession 
        ? this.formatNextSession(nextSession)
        : 'No upcoming sessions';

      // Set real stats
      this.trainingStats.set([
        {
          label: "This Week",
          value: `${thisWeekSessions.length}/7`,
          icon: "pi-bolt",
          color: "#f1c40f",
          trend: thisWeekSessions.length > 0 ? "🔥 Sessions Completed" : "Start training!",
          trendType: thisWeekSessions.length >= 4 ? "positive" : "neutral",
        },
        {
          label: "Current Streak",
          value: streak > 0 ? `${streak} days` : "0 days",
          icon: "pi-bullseye",
          color: "#89c300",
          trend: streak >= 7 ? "📊 Great consistency!" : streak > 0 ? "Keep it going!" : "Start your streak!",
          trendType: streak >= 7 ? "positive" : "neutral",
        },
        {
          label: "Total Hours",
          value: `${(totalMinutes / 60).toFixed(1)}h`,
          icon: "pi-clock",
          color: "#10c96b",
          trend: `⬆️ ${(thisWeekSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60).toFixed(1)}h this week`,
          trendType: "positive",
        },
        {
          label: "Next Session",
          value: nextSession?.session_type || "Schedule one",
          icon: "pi-calendar",
          color: "#89c300",
          trend: nextSessionText,
          trendType: "neutral",
        },
      ]);

      // Load real weekly schedule from database
      await this.loadWeeklySchedule(user.id);

      // Load available workouts (templates)
      await this.loadAvailableWorkouts();

      // Load real achievements
      await this.loadAchievements(user.id, streak, sessions?.length || 0);

    } catch (error) {
      console.error('Error loading training data:', error);
      this.loadFallbackData();
    }
  }

  private formatNextSession(session: any): string {
    const date = new Date(session.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDay = new Date(date);
    sessionDay.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((sessionDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (daysDiff === 0) return `📅 Today at ${time}`;
    if (daysDiff === 1) return `📅 Tomorrow at ${time}`;
    return `📅 ${date.toLocaleDateString('en-US', { weekday: 'short' })} at ${time}`;
  }

  private async loadWeeklySchedule(userId: string): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data: scheduledSessions } = await this.supabaseService.client
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_date', weekStart.toISOString())
      .lt('scheduled_date', weekEnd.toISOString())
      .order('scheduled_date', { ascending: true });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedule = days.map((name, index) => {
      const daySessions = (scheduledSessions || []).filter(s => {
        const sessionDate = new Date(s.scheduled_date);
        return sessionDate.getDay() === index;
      });

      return {
        name,
        sessions: daySessions.map(s => ({
          time: new Date(s.scheduled_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          title: s.session_type || 'Training'
        }))
      };
    });

    this.weeklySchedule.set(schedule);
  }

  private async loadAvailableWorkouts(): Promise<void> {
    // These are workout templates - could be loaded from a workout_templates table
    // For now, using sensible defaults for Olympic flag football training
    this.workouts.set([
      {
        type: "speed",
        title: "Sprint Training",
        description: "40-yard dash work, acceleration drills",
        duration: "45 min",
        intensity: "High intensity",
        location: "Track / Field",
        icon: "🏃",
        iconBg: "linear-gradient(135deg, #f1c40f, #f39c12)",
      },
      {
        type: "agility",
        title: "Route Running",
        description: "Cuts, breaks, and route precision",
        duration: "40 min",
        intensity: "High intensity",
        location: "Field",
        icon: "⚡",
        iconBg: "linear-gradient(135deg, #3498db, #2980b9)",
      },
      {
        type: "strength",
        title: "Functional Strength",
        description: "Core, legs, and explosive power",
        duration: "60 min",
        intensity: "Medium intensity",
        location: "Gym",
        icon: "💪",
        iconBg: "linear-gradient(135deg, var(--color-brand-primary-light), var(--ds-primary-green))",
      },
      {
        type: "skills",
        title: "Flag Pulling Drills",
        description: "Defensive positioning and timing",
        duration: "30 min",
        intensity: "Medium intensity",
        location: "Field",
        icon: "🎯",
        iconBg: "linear-gradient(135deg, #9b59b6, #8e44ad)",
      },
    ]);
  }

  private async loadAchievements(userId: string, currentStreak: number, totalSessions: number): Promise<void> {
    const achievements: Array<{ icon: string; title: string; date: string }> = [];

    // Real achievements based on actual data
    if (currentStreak >= 7) {
      achievements.push({ icon: "🔥", title: `${currentStreak}-Day Streak`, date: "Current" });
    }
    if (totalSessions >= 10) {
      achievements.push({ icon: "🏃", title: "10 Sessions Complete", date: "Milestone" });
    }
    if (totalSessions >= 25) {
      achievements.push({ icon: "⭐", title: "25 Sessions Complete", date: "Milestone" });
    }
    if (totalSessions >= 50) {
      achievements.push({ icon: "🏆", title: "50 Sessions Complete", date: "Milestone" });
    }

    // If no achievements yet, show encouraging message
    if (achievements.length === 0) {
      achievements.push({ icon: "🎯", title: "First Achievement Awaits", date: "Complete 10 sessions" });
    }

    this.achievements.set(achievements);
  }

  private loadFallbackData(): void {
    // Empty state - encourage user to start training
    this.trainingStats.set([
      {
        label: "This Week",
        value: "0/7",
        icon: "pi-bolt",
        color: "#f1c40f",
        trend: "Start training!",
        trendType: "neutral",
      },
      {
        label: "Current Streak",
        value: "0 days",
        icon: "pi-bullseye",
        color: "#89c300",
        trend: "Begin your journey",
        trendType: "neutral",
      },
      {
        label: "Total Hours",
        value: "0h",
        icon: "pi-clock",
        color: "#10c96b",
        trend: "Log your first session",
        trendType: "neutral",
      },
      {
        label: "Next Session",
        value: "Schedule one",
        icon: "pi-calendar",
        color: "#89c300",
        trend: "📅 Plan your training",
        trendType: "neutral",
      },
    ]);

    this.weeklySchedule.set([
      { name: "Monday", sessions: [] },
      { name: "Tuesday", sessions: [] },
      { name: "Wednesday", sessions: [] },
      { name: "Thursday", sessions: [] },
      { name: "Friday", sessions: [] },
      { name: "Saturday", sessions: [] },
      { name: "Sunday", sessions: [] },
    ]);

    this.workouts.set([
      {
        type: "speed",
        title: "Sprint Training",
        description: "40-yard dash work, acceleration drills",
        duration: "45 min",
        intensity: "High intensity",
        location: "Track / Field",
        icon: "🏃",
        iconBg: "linear-gradient(135deg, #f1c40f, #f39c12)",
      },
      {
        type: "agility",
        title: "Route Running",
        description: "Cuts, breaks, and route precision",
        duration: "40 min",
        intensity: "High intensity",
        location: "Field",
        icon: "⚡",
        iconBg: "linear-gradient(135deg, #3498db, #2980b9)",
      },
      {
        type: "strength",
        title: "Functional Strength",
        description: "Core, legs, and explosive power",
        duration: "60 min",
        intensity: "Medium intensity",
        location: "Gym",
        icon: "💪",
        iconBg: "linear-gradient(135deg, var(--color-brand-primary-light), var(--ds-primary-green))",
      },
    ]);

    this.achievements.set([
      { icon: "🎯", title: "First Achievement Awaits", date: "Complete 10 sessions" },
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
    // Navigate to full schedule view
    this.router.navigate(['/training/schedule']);
  }

  startWorkout(workout: Workout): void {
    // Navigate to workout page with workout context
    this.toastService.info(`Starting ${workout.title}`);
    this.router.navigate(['/workout'], { 
      queryParams: { 
        type: workout.type, 
        title: workout.title,
        duration: workout.duration 
      } 
    });
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
