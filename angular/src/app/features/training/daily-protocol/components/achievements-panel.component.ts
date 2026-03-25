import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { PageErrorStateComponent } from "../../../../shared/components/page-error-state/page-error-state.component";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Skeleton } from "primeng/skeleton";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { ApiService } from "../../../../core/services/api.service";
import { LoggerService } from "../../../../core/services/logger.service";
import { extractApiPayload } from "../../../../core/utils/api-response-mapper";
import { formatDate as formatDateUtil } from "../../../../shared/utils/date.utils";
import {
  AppDialogComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

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

interface AchievementsPayload {
  achievements?: Achievement[];
  grouped?: Record<string, Achievement[]>;
  summary?: { total: number; earned: number; points: number };
}

interface StreaksPayload {
  streaks?: Streak[];
}

interface StatsPayload {
  stats?: Stats;
}

@Component({
  selector: "app-achievements-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tag,
    StatusTagComponent,
    Tooltip,
    ProgressBar,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Skeleton,
    IconButtonComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
  ],
  template: `
    <div class="achievements-panel">
      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-header">
          <h3><i class="pi pi-trophy" aria-hidden="true"></i> Achievements</h3>
          <app-icon-button
            icon="pi-external-link"
            variant="text"
            ariaLabel="View all achievements"
            tooltip="View all"
          />
        </div>

        @if (loading()) {
          <div class="loading-state">
            <p-skeleton
              height="calc(var(--size-120) * 0.5)"
              class="mb-2"
            />
            <p-skeleton height="var(--icon-container-md)" />
          </div>
        } @else if (loadError() && !hasAnyData()) {
          <app-page-error-state
            title="Unable to load achievements"
            [message]="loadError()!"
            (retry)="retryLoadData()"
          />
        } @else {
          <div class="summary-stats">
            <div class="stat stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value">{{
                  summary()?.totalEarned || 0
                }}</span>
                <span class="stat-block__label">Earned</span>
              </div>
            </div>
            <div class="stat stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value">{{
                  stats()?.total_points || 0
                }}</span>
                <span class="stat-block__label">Points</span>
              </div>
            </div>
            <div class="stat stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value">{{ currentStreak() }}</span>
                <span class="stat-block__label"><i class="pi pi-bolt" aria-hidden="true"></i> Streak</span>
              </div>
            </div>
          </div>

          <!-- Active Streaks -->
          @if (activeStreaks().length > 0) {
            <div class="active-streaks">
              @for (streak of activeStreaks(); track streak.streak_type) {
                <div class="streak-badge" [class.at-risk]="streak.atRisk">
                  <span class="streak-icon">{{
                    getStreakIcon(streak.streak_type)
                  }}</span>
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
                <span class="next-icon">{{
                  summary()?.nextAchievement?.icon
                }}</span>
                <div class="next-info">
                  <span class="next-name">{{
                    summary()?.nextAchievement?.name
                  }}</span>
                  <span class="next-progress"
                    >{{ summary()?.nextAchievement?.progress }}/{{
                      summary()?.nextAchievement?.progressMax
                    }}</span
                  >
                </div>
              </div>
              <p-progressBar
                [value]="summary()?.nextAchievement?.progressPercent || 0"
                [showValue]="false"
                class="h-2"
              />
            </div>
          }

          <!-- Recent Achievements -->
          @if (recentAchievements().length > 0) {
            <div class="recent-achievements">
              <span class="recent-label">Recent:</span>
              @for (ach of recentAchievements(); track ach.id) {
                <span class="recent-badge" [pTooltip]="ach.name">{{
                  ach.icon
                }}</span>
              }
            </div>
          }
        }
      </div>

      <!-- Full Dialog -->
      <app-dialog
        [(visible)]="showFullDialog"
        [blockScroll]="true"
        [draggable]="false"
        styleClass="achievements-panel-dialog"
        ariaLabel="Achievements and progress"
      >
        <app-dialog-header
          icon="trophy"
          title="Achievements & Progress"
          subtitle="Track your milestones, streaks, and training stats"
          (close)="showFullDialog = false"
        />

        <p-tabs>
          <p-tabpanel value="all">
            <ng-template #header>
              <span
                >All ({{ summary()?.totalEarned }}/{{
                  summary()?.totalAvailable
                }})</span
              >
            </ng-template>

            <div class="achievements-grid">
              @for (category of categories(); track category) {
                <div class="category-section">
                  <h4>{{ getCategoryLabel(category) }}</h4>
                  <div class="achievements-list">
                    @for (
                      ach of getAchievementsByCategory(category);
                      track ach.id
                    ) {
                      <div
                        class="achievement-card"
                        [class.earned]="ach.earned"
                        [class.tier-{{ ach.tier }}]="true"
                      >
                        <div class="ach-icon" [class.grayscale]="!ach.earned">
                          {{ ach.icon }}
                        </div>
                        <div class="ach-content">
                          <div class="ach-header">
                            <span class="ach-name">{{ ach.name }}</span>
                            <app-status-tag
                              [value]="ach.tier"
                              [severity]="getTierSeverity(ach.tier)"
                              size="sm"
                            />
                          </div>
                          <p class="ach-desc">{{ ach.description }}</p>
                          @if (!ach.earned && ach.progressPercent > 0) {
                            <div class="ach-progress">
                              <p-progressBar
                                [value]="ach.progressPercent"
                                [showValue]="false"
                                class="h-1"
                              />
                              <span class="progress-text"
                                >{{ ach.progress }}/{{ ach.progressMax }}</span
                              >
                            </div>
                          }
                          @if (ach.earned) {
                            <span class="earned-date"
                              >Earned {{ formatDate(ach.earnedAt) }}</span
                            >
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
                <div
                  class="streak-card"
                  [class.active]="streak.isActive"
                  [class.at-risk]="streak.atRisk"
                >
                  <div class="streak-header">
                    <span class="streak-type-icon">{{
                      getStreakIcon(streak.streak_type)
                    }}</span>
                    <span class="streak-type-name">{{
                      getStreakLabel(streak.streak_type)
                    }}</span>
                  </div>
                  <div class="streak-stats">
                    <div class="streak-stat">
                      <span class="streak-value">{{
                        streak.current_streak
                      }}</span>
                      <span class="streak-label">Current</span>
                    </div>
                    <div class="streak-stat">
                      <span class="streak-value">{{
                        streak.longest_streak
                      }}</span>
                      <span class="streak-label">Best</span>
                    </div>
                  </div>
                  @if (streak.atRisk) {
                    <div class="risk-warning">
                      ⚠️ Complete today to keep your streak!
                    </div>
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
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      stats()?.total_sessions || 0
                    }}</span>
                    <span class="stat-block__label">Training Sessions</span>
                  </div>
                </div>
                <div class="stat-card">
                  <span class="stat-icon">💪</span>
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      stats()?.total_exercises || 0
                    }}</span>
                    <span class="stat-block__label">Exercises Completed</span>
                  </div>
                </div>
                <div class="stat-card">
                  <span class="stat-icon">⏱️</span>
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      formatMinutes(stats()?.total_training_minutes || 0)
                    }}</span>
                    <span class="stat-block__label">Training Time</span>
                  </div>
                </div>
                <div class="stat-card">
                  <span class="stat-icon"><i class="pi pi-chart-line" aria-hidden="true"></i></span>
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      stats()?.total_load_au || 0
                    }}</span>
                    <span class="stat-block__label">Total Load (AU)</span>
                  </div>
                </div>
                @if (stats()?.total_throws && stats()!.total_throws > 0) {
                  <div class="stat-card highlight">
                    <span class="stat-icon"><i class="pi pi-bullseye" aria-hidden="true"></i></span>
                    <div class="stat-block__content">
                      <span class="stat-block__value">{{
                        stats()?.total_throws
                      }}</span>
                      <span class="stat-block__label">Career Throws</span>
                    </div>
                  </div>
                }
                <div class="stat-card">
                  <span class="stat-icon"><i class="pi pi-trophy" aria-hidden="true"></i></span>
                  <div class="stat-block__content">
                    <span class="stat-block__value">{{
                      stats()?.tournaments_completed || 0
                    }}</span>
                    <span class="stat-block__label">Tournaments</span>
                  </div>
                </div>
              </div>

              <div class="points-summary">
                <h4>Total Points: {{ stats()?.total_points || 0 }}</h4>
                <p>
                  Earned from
                  {{ stats()?.total_achievements || 0 }} achievements
                </p>
              </div>
            </div>
          </p-tabpanel>
        </p-tabs>
      </app-dialog>
    </div>
  `,
  styleUrl: "./achievements-panel.component.scss",
})
export class AchievementsPanelComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
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

  readonly activeStreaks = computed(() =>
    this.streaks().filter((s) => s.isActive || s.atRisk),
  );

  readonly hasAnyData = computed(
    () =>
      this.achievements().length > 0 ||
      this.streaks().length > 0 ||
      this.stats() !== null ||
      this.summary() !== null,
  );

  readonly currentStreak = computed(() => {
    const training = this.streaks().find((s) => s.streak_type === "training");
    return training?.current_streak || 0;
  });

  readonly recentAchievements = computed(() =>
    this.achievements()
      .filter((a) => a.earned)
      .sort(
        (a, b) =>
          new Date(b.earnedAt || 0).getTime() -
          new Date(a.earnedAt || 0).getTime(),
      )
      .slice(0, 5),
  );

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const [achievementsLoaded, streaksLoaded, statsLoaded] =
        await Promise.all([
          this.loadAchievements(),
          this.loadStreaks(),
          this.loadStats(),
        ]);

      if (!achievementsLoaded && !streaksLoaded && !statsLoaded) {
        this.loadError.set(
          "We couldn't load your achievements right now. Please try again.",
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadAchievements(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.get<AchievementsPayload>("/api/achievements"),
      );
      const payload = extractApiPayload<AchievementsPayload>(response);

      if (payload) {
        this.achievements.set(payload.achievements || []);
        this.grouped.set(payload.grouped || {});
        if (payload.summary) {
          this.summary.set({
            totalEarned: payload.summary.earned,
            totalAvailable: payload.summary.total,
            totalPoints: payload.summary.points,
          });
        }
      }
      return true;
    } catch (err) {
      this.logger.error("Failed to load achievements", err);
      return false;
    }
  }

  async loadStreaks(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.get<StreaksPayload>("/api/achievements/streaks"),
      );
      const payload = extractApiPayload<StreaksPayload>(response);
      if (payload) {
        this.streaks.set(payload.streaks || []);
      }
      return true;
    } catch (err) {
      this.logger.error("Failed to load streaks", err);
      return false;
    }
  }

  async loadStats(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.get<StatsPayload>("/api/achievements/stats"),
      );
      const payload = extractApiPayload<StatsPayload>(response);
      if (payload?.stats) {
        this.stats.set(payload.stats);
      }
      return true;
    } catch (err) {
      this.logger.error("Failed to load stats", err);
      return false;
    }
  }

  retryLoadData(): void {
    void this.loadData();
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

  getTierSeverity(
    tier: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary" | "contrast"
    > = {
      bronze: "secondary",
      silver: "info",
      gold: "warning",
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
    return formatDateUtil(date, "PPP");
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
