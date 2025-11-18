import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

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
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    MainLayoutComponent,
    StatsGridComponent,
  ],
  template: `
    <app-main-layout>
      <div class="training-page">
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

        <!-- Custom Schedule Builder CTA -->
        <p-card class="schedule-cta-card">
          <div class="cta-content">
            <div class="cta-text">
              <h2>
                <i class="pi pi-calendar-plus"></i>
                Build Your Custom Training Schedule
              </h2>
              <p>
                Join 20 players from 12 nations who follow personalized training
                plans. Create a schedule that fits your game days, timezone, and
                goals.
              </p>
            </div>
            <p-button
              label="Create Schedule"
              icon="pi pi-plus"
              (onClick)="openScheduleBuilder()"
            ></p-button>
          </div>
        </p-card>

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
            <div
              *ngFor="let day of weeklySchedule(); trackBy: trackByDayName"
              class="schedule-day"
            >
              <div class="day-name">{{ day.name }}</div>
              <div class="day-sessions">
                <div
                  *ngFor="
                    let session of day.sessions;
                    trackBy: trackBySessionTime
                  "
                  class="session-item"
                >
                  <div class="session-time">{{ session.time }}</div>
                  <div class="session-title">{{ session.title }}</div>
                </div>
              </div>
            </div>
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
              <div
                *ngFor="let workout of workouts(); trackBy: trackByWorkoutTitle"
                class="workout-card"
                [style.border-color]="workout.iconBg"
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
              <div
                *ngFor="
                  let achievement of achievements();
                  trackBy: trackByAchievementTitle
                "
                class="achievement-item"
              >
                <div class="achievement-icon">{{ achievement.icon }}</div>
                <div class="achievement-content">
                  <div class="achievement-title">{{ achievement.title }}</div>
                  <div class="achievement-date">{{ achievement.date }}</div>
                </div>
              </div>
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
        font-size: 0.875rem;
        opacity: 0.9;
        margin-bottom: var(--space-4);
      }

      .hero-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: var(--space-4);
      }

      .hero-subtitle {
        font-size: 1.25rem;
        opacity: 0.9;
        margin-bottom: var(--space-6);
      }

      .hero-note {
        font-size: 0.875rem;
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
        font-size: 1.5rem;
        font-weight: 700;
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
        font-size: 1.5rem;
        font-weight: 700;
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
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .session-title {
        font-size: 0.875rem;
        font-weight: 500;
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
      }

      .workout-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .workout-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--p-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .workout-content {
        flex: 1;
      }

      .workout-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
      }

      .workout-description {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .workout-meta {
        display: flex;
        gap: var(--space-4);
        font-size: 0.75rem;
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
        font-size: 2rem;
      }

      .achievement-title {
        font-weight: 600;
        color: var(--text-primary);
      }

      .achievement-date {
        font-size: 0.875rem;
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

  userName = signal("Alex");
  stats = signal<StatCard[]>([]);
  trainingStats = signal<any[]>([]);
  weeklySchedule = signal<any[]>([]);
  workouts = signal<Workout[]>([]);
  achievements = signal<any[]>([]);

  ngOnInit(): void {
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
        iconBg: "linear-gradient(135deg, #10c96b, #089949)",
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
    // Open schedule builder modal - implementation pending
  }

  toggleScheduleView(): void {
    // Toggle schedule view - implementation pending
  }

  startWorkout(workout: Workout): void {
    // Start workout - implementation pending
  }

  trackByStatTitle(index: number, stat: StatCard): string {
    return stat.title;
  }

  trackByDayName(index: number, day: any): string {
    return day.name;
  }

  trackBySessionTime(index: number, session: any): string {
    return session.time || index.toString();
  }

  trackByWorkoutTitle(index: number, workout: Workout): string {
    return workout.title;
  }

  trackByAchievementTitle(index: number, achievement: any): string {
    return achievement.title || index.toString();
  }
}
