import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { TagModule } from "primeng/tag";
import { Tabs } from "primeng/tabs";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { AuthService } from "../../core/services/auth.service";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

@Component({
  selector: "app-profile",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    Tabs,
    MainLayoutComponent,
    StatsGridComponent
],
  template: `
    <app-main-layout>
      <div class="profile-page">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-section">
            <p-avatar
              [label]="userInitials()"
              size="xlarge"
              shape="circle"
              [style]="{
                'background-color': '#089949',
                color: '#fff',
                'font-size': '3rem',
              }"
              >
            </p-avatar>
            <p-button
              icon="pi pi-camera"
              [rounded]="true"
              [text]="true"
              styleClass="avatar-edit-btn"
              ariaLabel="Change profile picture"
            ></p-button>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ userName() }}</h1>
            <p class="profile-role">{{ userRole() }}</p>
            <p class="profile-email">{{ userEmail() }}</p>
          </div>
          <div class="profile-actions">
            <p-button
              label="Edit Profile"
              icon="pi pi-cog"
              [outlined]="true"
              [routerLink]="['/settings']"
            ></p-button>
          </div>
        </div>
    
        <!-- Profile Stats -->
        <app-stats-grid [stats]="stats()"></app-stats-grid>
    
        <!-- Profile Tabs -->
        <p-tabs>
          <p-tabpanel header="Overview" leftIcon="pi pi-chart-line">
            <div class="overview-content">
              <p-card>
                <ng-template pTemplate="header">
                  <h3>Recent Activity</h3>
                </ng-template>
                <div class="activity-list">
                  @for (
                    activity of activities(); track trackByActivityTitle($index,
                    activity)) {
                    <div
                      class="activity-item"
                      >
                      <div class="activity-icon">{{ activity.icon }}</div>
                      <div class="activity-content">
                        <div class="activity-title">{{ activity.title }}</div>
                        <div class="activity-time">{{ activity.time }}</div>
                      </div>
                    </div>
                  }
                </div>
              </p-card>
            </div>
          </p-tabpanel>
          <p-tabpanel header="Achievements" leftIcon="pi pi-trophy">
            <div class="achievements-grid">
              @for (
                achievement of achievements(); track trackByAchievementTitle($index,
                achievement)) {
                <p-card
                  class="achievement-card"
                  >
                  <div class="achievement-icon">{{ achievement.icon }}</div>
                  <h4 class="achievement-title">{{ achievement.title }}</h4>
                  <p class="achievement-description">
                    {{ achievement.description }}
                  </p>
                  <div class="achievement-date">{{ achievement.date }}</div>
                </p-card>
              }
            </div>
          </p-tabpanel>
          <p-tabpanel header="Statistics" leftIcon="pi pi-bar-chart">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Performance Statistics</h3>
              </ng-template>
              <div class="stats-grid">
                @for (
                  stat of performanceStats(); track trackByPerformanceStatLabel($index,
                  stat)) {
                  <div
                    class="performance-stat"
                    >
                    <div class="stat-label">{{ stat.label }}</div>
                    <div class="stat-value">{{ stat.value }}</div>
                    <p-tag
                      [value]="stat.trend"
                      [severity]="stat.trendType"
                    ></p-tag>
                  </div>
                }
              </div>
            </p-card>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
    `,
  styles: [
    `
      .profile-page {
        padding: var(--space-6);
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-6);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-6);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .profile-avatar-section {
        position: relative;
      }

      .avatar-edit-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        background: var(--surface-primary);
        border: 2px solid var(--p-surface-200);
      }

      .profile-info {
        flex: 1;
      }

      .profile-name {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .profile-role {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-1);
      }

      .profile-email {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .profile-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        text-align: center;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .overview-content {
        margin-top: var(--space-4);
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--p-surface-50);
      }

      .activity-icon {
        font-size: 2rem;
      }

      .activity-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .activity-time {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-top: var(--space-4);
      }

      .achievement-card {
        text-align: center;
        transition: transform 0.2s;
      }

      .achievement-card:hover {
        transform: translateY(-4px);
      }

      .achievement-icon {
        font-size: 3rem;
        margin-bottom: var(--space-3);
      }

      .achievement-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .achievement-description {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .achievement-date {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .performance-stat {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        text-align: center;
      }

      .performance-stat .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .performance-stat .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      @media (max-width: 768px) {
        .profile-header {
          flex-direction: column;
          text-align: center;
        }

        .profile-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  userName = signal("Loading...");
  userEmail = signal("Loading...");
  userRole = signal("Player");
  userInitials = signal("U");
  stats = signal<any[]>([]);
  activities = signal<any[]>([]);
  achievements = signal<any[]>([]);
  performanceStats = signal<any[]>([]);

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName.set(user.name || user.email || "User");
      this.userEmail.set(user.email || "");
      this.userRole.set(user.role || "Player");
      this.userInitials.set(this.getInitials(this.userName()));
    }

    // Load stats
    this.stats.set([
      { value: "24", label: "Training Sessions" },
      { value: "85%", label: "Performance Score" },
      { value: "7", label: "Day Streak" },
      { value: "3", label: "Tournaments" },
    ]);

    // Load activities
    this.activities.set([
      { icon: "🏃", title: "Completed Speed Training", time: "2 hours ago" },
      { icon: "🏆", title: "Achieved New Personal Best", time: "1 day ago" },
      { icon: "📊", title: "Updated Performance Metrics", time: "2 days ago" },
    ]);

    // Load achievements
    this.achievements.set([
      {
        icon: "🏆",
        title: "7-Day Streak",
        description: "Completed 7 consecutive training days",
        date: "2 days ago",
      },
      {
        icon: "⚡",
        title: "Speed Master",
        description: "Achieved sub-4.5s 40-yard dash",
        date: "1 week ago",
      },
    ]);

    // Load performance stats
    this.performanceStats.set([
      {
        label: "Overall Performance",
        value: "85%",
        trend: "+5%",
        trendType: "success",
      },
      { label: "Speed Score", value: "92", trend: "+8", trendType: "success" },
      { label: "Strength Score", value: "78", trend: "+3", trendType: "info" },
    ]);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  trackByActivityTitle(index: number, activity: any): string {
    return activity.title || index.toString();
  }

  trackByAchievementTitle(index: number, achievement: any): string {
    return achievement.title || index.toString();
  }

  trackByPerformanceStatLabel(index: number, stat: any): string {
    return stat.label || index.toString();
  }
}
