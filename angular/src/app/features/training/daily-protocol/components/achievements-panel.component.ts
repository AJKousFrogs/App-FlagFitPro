import { Component, signal, computed, inject, DestroyRef } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
import { DialogModule } from "primeng/dialog";
import { TabsModule } from "primeng/tabs";
import { SkeletonModule } from "primeng/skeleton";
import { ApiService } from "../../../../core/services/api.service";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  progressMax: number;
  progressPercent: number;
}

interface Streak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  isActive: boolean;
  atRisk: boolean;
}

interface Stats {
  total_sessions: number;
  total_exercises: number;
  total_training_minutes: number;
  total_load_au: number;
  total_throws: number;
  tournaments_completed: number;
  total_achievements: number;
  total_points: number;
}

@Component({
  selector: "app-achievements-panel",
  imports: [ TagModule, TooltipModule, ProgressBar, DialogModule, TabsModule, SkeletonModule,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <div class="achievements-panel">
      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-header">
          <h3>🏆 Achievements</h3>
          <app-icon-button icon="pi-external-link" variant="text" ariaLabel="external-link" />
        </div>

        @if (loading()) {
          <div class="loading-state">
            <p-skeleton height="60px" styleClass="mb-2" />
            <p-skeleton height="40px" />
          </div>
        } @else {
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-value">{{ summary()?.totalEarned || 0 }}</span>
              <span class="stat-label">Earned</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ stats()?.total_points || 0 }}</span>
              <span class="stat-label">Points</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ currentStreak() }}</span>
              <span class="stat-label">🔥 Streak</span>
            </div>
          </div>

          <!-- Active Streaks -->
          @if (activeStreaks().length > 0) {
            <div class="active-streaks">
              @for (streak of activeStreaks(); track streak.streak_type) {
                <div class="streak-badge" [class.at-risk]="streak.atRisk">
                  <span class="streak-icon">{{ getStreakIcon(streak.streak_type) }}</span>
                  <span class="streak-count">{{ streak.current_streak }}</span>
                  @if (streak.atRisk) {
                    <span class="risk-badge">!</span>
                  }
                </div>
              }
            </div>
          }

          <!-- Next Achievement -->
          @if (summary()?.nextAchievement) {
            <div class="next-achievement">
              <div class="next-header">
                <span class="next-icon">{{ summary()?.nextAchievement?.icon }}</span>
                <div class="next-info">
                  <span class="next-name">{{ summary()?.nextAchievement?.name }}</span>
                  <span class="next-progress"
                    >{{ summary()?.nextAchievement?.progress }}/{{ summary()?.nextAchievement?.progressMax }}</span
                  >
                </div>
              </div>
              <p-progressBar
                [value]="summary()?.nextAchievement?.progressPercent || 0"
                [showValue]="false"
                styleClass="h-2"
              />
            </div>
          }

          <!-- Recent Achievements -->
          @if (recentAchievements().length > 0) {
            <div class="recent-achievements">
              <span class="recent-label">Recent:</span>
              @for (ach of recentAchievements(); track ach.id) {
                <span class="recent-badge" [pTooltip]="ach.name">{{ ach.icon }}</span>
              }
            </div>
          }
        }
      </div>

      <!-- Full Dialog -->
      <p-dialog
        [(visible)]="showFullDialog"
        header="🏆 Achievements & Progress"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '800px' }"
        [contentStyle]="{ 'max-height': '70vh', overflow: 'auto' }"
      >
        <p-tabs>
          <p-tabpanel value="all">
            <ng-template #header>
              <span>All ({{ summary()?.totalEarned }}/{{ summary()?.totalAvailable }})</span>
            </ng-template>

            <div class="achievements-grid">
              @for (category of categories(); track category) {
                <div class="category-section">
                  <h4>{{ getCategoryLabel(category) }}</h4>
                  <div class="achievements-list">
                    @for (ach of getAchievementsByCategory(category); track ach.id) {
                      <div class="achievement-card" [class.earned]="ach.earned" [class.tier-{{ ach.tier }}]="true">
                        <div class="ach-icon" [class.grayscale]="!ach.earned">{{ ach.icon }}</div>
                        <div class="ach-content">
                          <div class="ach-header">
                            <span class="ach-name">{{ ach.name }}</span>
                            <p-tag [value]="ach.tier" [severity]="getTierSeverity(ach.tier)" />
                          </div>
                          <p class="ach-desc">{{ ach.description }}</p>
                          @if (!ach.earned && ach.progressPercent > 0) {
                            <div class="ach-progress">
                              <p-progressBar [value]="ach.progressPercent" [showValue]="false" styleClass="h-1" />
                              <span class="progress-text">{{ ach.progress }}/{{ ach.progressMax }}</span>
                            </div>
                          }
                          @if (ach.earned) {
                            <span class="earned-date">Earned {{ formatDate(ach.earnedAt) }}</span>
                          }
                        </div>
                        <span class="ach-points">{{ ach.points }} pts</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="streaks">
            <ng-template #header>
              <span>🔥 Streaks</span>
            </ng-template>

            <div class="streaks-detail">
              @for (streak of streaks(); track streak.streak_type) {
                <div class="streak-card" [class.active]="streak.isActive" [class.at-risk]="streak.atRisk">
                  <div class="streak-header">
                    <span class="streak-type-icon">{{ getStreakIcon(streak.streak_type) }}</span>
                    <span class="streak-type-name">{{ getStreakLabel(streak.streak_type) }}</span>
                  </div>
                  <div class="streak-stats">
                    <div class="streak-stat">
                      <span class="streak-value">{{ streak.current_streak }}</span>
                      <span class="streak-label">Current</span>
                    </div>
                    <div class="streak-stat">
                      <span class="streak-value">{{ streak.longest_streak }}</span>
                      <span class="streak-label">Best</span>
                    </div>
                  </div>
                  @if (streak.atRisk) {
                    <div class="risk-warning">⚠️ Complete today to keep your streak!</div>
                  }
                  @if (!streak.isActive && streak.current_streak === 0) {
                    <div class="start-prompt">Start your streak today!</div>
                  }
                </div>
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="stats">
            <ng-template #header>
              <span>📊 Stats</span>
            </ng-template>

            <div class="stats-detail">
              <div class="stats-grid">
                <div class="stat-card">
                  <span class="stat-icon">🏃</span>
                  <span class="stat-value">{{ stats()?.total_sessions || 0 }}</span>
                  <span class="stat-label">Training Sessions</span>
                </div>
                <div class="stat-card">
                  <span class="stat-icon">💪</span>
                  <span class="stat-value">{{ stats()?.total_exercises || 0 }}</span>
                  <span class="stat-label">Exercises Completed</span>
                </div>
                <div class="stat-card">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-value">{{ formatMinutes(stats()?.total_training_minutes || 0) }}</span>
                  <span class="stat-label">Training Time</span>
                </div>
                <div class="stat-card">
                  <span class="stat-icon">📈</span>
                  <span class="stat-value">{{ stats()?.total_load_au || 0 }}</span>
                  <span class="stat-label">Total Load (AU)</span>
                </div>
                @if (stats()?.total_throws && stats()!.total_throws > 0) {
                  <div class="stat-card highlight">
                    <span class="stat-icon">🎯</span>
                    <span class="stat-value">{{ stats()?.total_throws }}</span>
                    <span class="stat-label">Career Throws</span>
                  </div>
                }
                <div class="stat-card">
                  <span class="stat-icon">🏆</span>
                  <span class="stat-value">{{ stats()?.tournaments_completed || 0 }}</span>
                  <span class="stat-label">Tournaments</span>
                </div>
              </div>

              <div class="points-summary">
                <h4>Total Points: {{ stats()?.total_points || 0 }}</h4>
                <p>Earned from {{ stats()?.total_achievements || 0 }} achievements</p>
              </div>
            </div>
          </p-tabpanel>
        </p-tabs>
      </p-dialog>
    </div>
  `,
  styleUrl: './achievements-panel.component.scss',
})
export class AchievementsPanelComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly achievements = signal<Achievement[]>([]);
  readonly grouped = signal<Record<string, Achievement[]>>({});
  readonly summary = signal<{
    totalEarned: number;
    totalAvailable: number;
    totalPoints: number;
    nextAchievement?: Achievement;
  } | null>(null);
  readonly streaks = signal<Streak[]>([]);
  readonly stats = signal<Stats | null>(null);

  showFullDialog = false;

  readonly categories = computed(() => Object.keys(this.grouped()));

  readonly activeStreaks = computed(() => this.streaks().filter((s) => s.isActive || s.atRisk));

  readonly currentStreak = computed(() => {
    const training = this.streaks().find((s) => s.streak_type === "training");
    return training?.current_streak || 0;
  });

  readonly recentAchievements = computed(() =>
    this.achievements()
      .filter((a) => a.earned)
      .sort((a, b) => new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime())
      .slice(0, 5)
  );

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.loadAchievements();
    this.loadStreaks();
    this.loadStats();
  }

  async loadAchievements(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(this.api.get('/api/achievements'));
      if (response?.success && response.data) {
        this.achievements.set(response.data.achievements || []);
        this.grouped.set(response.data.grouped || {});
        this.summary.set(response.data.summary);
      } else if (response?.achievements) {
        // Direct response without wrapper
        this.achievements.set(response.achievements);
        this.grouped.set(response.grouped || {});
        this.summary.set(response.summary);
      }
    } catch (err) {
      console.error("Failed to load achievements:", err);
    } finally {
      this.loading.set(false);
    }
  }

  async loadStreaks(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(this.api.get('/api/achievements/streaks'));
      if (response?.success && response.data) {
        this.streaks.set(response.data.streaks || []);
      } else if (response?.streaks) {
        this.streaks.set(response.streaks);
      }
    } catch (err) {
      console.error("Failed to load streaks:", err);
    }
  }

  async loadStats(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(this.api.get('/api/achievements/stats'));
      if (response?.success && response.data) {
        this.stats.set(response.data.stats);
      } else if (response?.stats) {
        this.stats.set(response.stats);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  getAchievementsByCategory(category: string): Achievement[] {
    return this.grouped()[category] || [];
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      streak: "🔥 Streak Achievements",
      volume: "🏃 Training Volume",
      milestone: "⭐ Milestones",
      position: "🎯 Position-Specific",
      tournament: "🏆 Tournament",
      recovery: "💚 Recovery & Wellness",
      social: "👥 Social",
    };
    return labels[category] || category;
  }

  getTierSeverity(tier: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
      bronze: "secondary",
      silver: "info",
      gold: "warn",
      platinum: "contrast",
    };
    return severities[tier] || "secondary";
  }

  getStreakIcon(type: string): string {
    const icons: Record<string, string> = {
      training: "🔥",
      protocol: "📋",
      wellness: "💚",
      qb_throwing: "🎯",
      arm_care: "💪",
    };
    return icons[type] || "📊";
  }

  getStreakLabel(type: string): string {
    const labels: Record<string, string> = {
      training: "Training Days",
      protocol: "Protocol Completions",
      wellness: "Wellness Check-ins",
      qb_throwing: "Throwing Days",
      arm_care: "Arm Care Sessions",
    };
    return labels[type] || type;
  }

  formatDate(date?: string): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
