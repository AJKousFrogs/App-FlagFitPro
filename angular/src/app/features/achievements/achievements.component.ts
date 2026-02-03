/**
 * Achievements System Component
 *
 * Gamifies the training experience by awarding badges and points for
 * completing training milestones, wellness streaks, and performance goals.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe, DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { Card } from "primeng/card";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { TABLE_COLUMN_WIDTHS } from "../../core/utils/design-tokens.util";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { UI_LIMITS } from "../../core/constants";

// ===== Interfaces =====
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  points: number;
  unlockedAt?: string;
  progress?: number;
  target?: number;
  isUnlocked: boolean;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  points: number;
  recentAchievement?: string;
  isCurrentUser: boolean;
}

type AchievementCategory =
  | "wellness"
  | "training"
  | "performance"
  | "social"
  | "special";

// ===== Constants =====
const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Wellness
  {
    id: "wellness-first",
    name: "First Check-in",
    description: "Complete your first wellness check-in",
    category: "wellness",
    icon: "💚",
    points: 10,
    isUnlocked: false,
  },
  {
    id: "wellness-streak-7",
    name: "7-Day Streak",
    description: "7 consecutive wellness check-ins",
    category: "wellness",
    icon: "💚",
    points: 25,
    isUnlocked: false,
  },
  {
    id: "wellness-streak-30",
    name: "30-Day Streak",
    description: "30 consecutive wellness check-ins",
    category: "wellness",
    icon: "💚",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "acwr-sweet-spot",
    name: "ACWR Sweet Spot",
    description: "Stay in optimal ACWR zone for 7 consecutive days",
    category: "wellness",
    icon: "🎯",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "10 check-ins before 6:00 AM",
    category: "wellness",
    icon: "🌅",
    points: 25,
    isUnlocked: false,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "10 check-ins after 10:00 PM",
    category: "wellness",
    icon: "🌙",
    points: 25,
    isUnlocked: false,
  },

  // Training
  {
    id: "training-first",
    name: "First Session",
    description: "Log your first training session",
    category: "training",
    icon: "🏋️",
    points: 15,
    isUnlocked: false,
  },
  {
    id: "training-50",
    name: "Halfway There",
    description: "Complete 50 training sessions",
    category: "training",
    icon: "🏋️",
    points: 35,
    isUnlocked: false,
  },
  {
    id: "training-century",
    name: "Century Club",
    description: "Complete 100 training sessions",
    category: "training",
    icon: "🏋️",
    points: 75,
    isUnlocked: false,
  },
  {
    id: "training-iron",
    name: "Iron Warrior",
    description: "Complete 500 training sessions",
    category: "training",
    icon: "🏋️",
    points: 150,
    isUnlocked: false,
  },

  // Performance
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Beat your 40-yard PR by 0.1s",
    category: "performance",
    icon: "⚡",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "vertical-king",
    name: "Vertical King",
    description: "Vertical jump PR > 36 inches",
    category: "performance",
    icon: "🦘",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "first-game-win",
    name: "First Win",
    description: "Win your first game",
    category: "performance",
    icon: "🏆",
    points: 100,
    isUnlocked: false,
  },
  {
    id: "touchdown-scorer",
    name: "TD Scorer",
    description: "Score your first touchdown",
    category: "performance",
    icon: "🎯",
    points: 50,
    isUnlocked: false,
  },

  // Social
  {
    id: "team-player",
    name: "Team Player",
    description: "Complete 10 team practices",
    category: "social",
    icon: "👥",
    points: 20,
    isUnlocked: false,
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Help a teammate with their training",
    category: "social",
    icon: "🤝",
    points: 40,
    isUnlocked: false,
  },

  // Special
  {
    id: "perfect-week",
    name: "Perfect Week",
    description: "Complete all scheduled activities for a week",
    category: "special",
    icon: "⭐",
    points: 75,
    isUnlocked: false,
  },
  {
    id: "comeback",
    name: "Comeback",
    description: "Complete return-to-play protocol successfully",
    category: "special",
    icon: "💪",
    points: 100,
    isUnlocked: false,
  },
];

const CATEGORY_LABELS: Record<
  AchievementCategory,
  { label: string; icon: string }
> = {
  wellness: { label: "Wellness", icon: "💚" },
  training: { label: "Training", icon: "🏋️" },
  performance: { label: "Performance", icon: "🏆" },
  social: { label: "Social", icon: "👥" },
  special: { label: "Special", icon: "⭐" },
};

@Component({
  selector: "app-achievements",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    Card,
    ProgressBar,
    Select,
    TableModule,
    StatusTagComponent,

    MainLayoutComponent,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
<div class="achievements-page">
        <app-page-header
          title="Achievements"
          subtitle="Earn badges and points for your training milestones"
          icon="pi-trophy"
        ></app-page-header>

        <!-- Stats Overview -->
        <div class="stats-grid">
          <p-card styleClass="stat-card highlight">
            <div class="stat-content">
              <div class="stat-icon-wrapper">
                <i class="pi pi-trophy stat-icon"></i>
              </div>
              <div class="stat-details stat-block__content">
                <span class="stat-block__label">Total Points</span>
                <span class="stat-block__value">{{
                  totalPoints() | number
                }}</span>
                <app-status-tag
                  [value]="'Top ' + userRankPercentile() + '%'"
                  severity="info"
                  size="sm"
                />
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper">
                <span class="stat-emoji">🎖️</span>
              </div>
              <div class="stat-details stat-block__content">
                <span class="stat-block__label">Achievements Unlocked</span>
                <span class="stat-block__value"
                  >{{ unlockedCount() }} / {{ totalAchievements() }}</span
                >
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper">
                <i class="pi pi-chart-line stat-icon"></i>
              </div>
              <div class="stat-details stat-block__content">
                <span class="stat-block__label">Progress</span>
                <span class="stat-block__value">{{ progressPercent() }}%</span>
                <p-progressBar
                  [value]="progressPercent()"
                  [showValue]="false"
                  styleClass="progress-mini"
                ></p-progressBar>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper">
                <i class="pi pi-bolt stat-icon"></i>
              </div>
              <div class="stat-details stat-block__content">
                <span class="stat-block__label">Recent Unlock</span>
                <span class="stat-block__value recent">{{
                  recentUnlock() ? recentUnlock()!.name : "None yet"
                }}</span>
                @if (recentUnlock()) {
                  <span class="stat-hint">{{
                    getTimeAgoStr(recentUnlock()!.unlockedAt!)
                  }}</span>
                }
              </div>
            </div>
          </p-card>
        </div>

        <!-- Recent Unlocks -->
        @if (recentUnlocks().length > 0) {
          <p-card header="Recently Unlocked" styleClass="recent-card">
            <div class="recent-grid">
              @for (
                achievement of recentUnlocks().slice(
                  0,
                  UI_LIMITS.RECOMMENDATIONS_PREVIEW
                );
                track achievement.id
              ) {
                <div class="achievement-card unlocked">
                  <div class="achievement-badge">
                    <span class="badge-icon">{{ achievement.icon }}</span>
                    <span class="badge-check"><i class="pi pi-check"></i></span>
                  </div>
                  <div class="achievement-info">
                    <h4>{{ achievement.name }}</h4>
                    <p>{{ achievement.description }}</p>
                    <div class="achievement-meta">
                      <span class="points">+{{ achievement.points }} pts</span>
                      <span class="date">{{
                        achievement.unlockedAt | date: "MMM d, y"
                      }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </p-card>
        }

        <!-- Achievement Categories -->
        <p-card styleClass="categories-card">
          <div class="category-tabs">
            @for (cat of categories; track cat.value) {
              <button
                class="category-tab"
                [class.active]="selectedCategory() === cat.value"
                (click)="selectedCategory.set(cat.value)"
              >
                <span class="tab-icon">{{ cat.icon }}</span>
                <span class="tab-label">{{ cat.label }}</span>
              </button>
            }
          </div>

          <div class="achievements-grid">
            @for (achievement of filteredAchievements(); track achievement.id) {
              <div
                class="achievement-card"
                [class.unlocked]="achievement.isUnlocked"
                [class.locked]="!achievement.isUnlocked"
              >
                <div
                  class="achievement-badge"
                  [class.locked]="!achievement.isUnlocked"
                >
                  @if (achievement.isUnlocked) {
                    <span class="badge-icon">{{ achievement.icon }}</span>
                    <span class="badge-check"><i class="pi pi-check"></i></span>
                  } @else {
                    <span class="badge-icon locked">🔒</span>
                  }
                </div>
                <div class="achievement-info">
                  <h4>{{ achievement.name }}</h4>
                  <p>{{ achievement.description }}</p>

                  @if (achievement.isUnlocked) {
                    <div class="achievement-meta">
                      <span class="points">+{{ achievement.points }} pts</span>
                      <span class="date">{{
                        achievement.unlockedAt | date: "MMM d, y"
                      }}</span>
                    </div>
                  } @else if (
                    achievement.progress !== undefined && achievement.target
                  ) {
                    <div class="achievement-progress">
                      <p-progressBar
                        [value]="
                          (achievement.progress / achievement.target) * 100
                        "
                        [showValue]="false"
                        styleClass="progress-achievement"
                      ></p-progressBar>
                      <span class="progress-text"
                        >{{ achievement.progress }}/{{
                          achievement.target
                        }}</span
                      >
                    </div>
                    <span class="points pending"
                      >{{ achievement.points }} pts</span
                    >
                  } @else {
                    <span class="points pending"
                      >{{ achievement.points }} pts</span
                    >
                  }
                </div>
              </div>
            }
          </div>
        </p-card>

        <!-- Team Leaderboard -->
        <p-card styleClass="leaderboard-card">
          <ng-template pTemplate="header">
            <div class="leaderboard-header">
              <div class="header-left">
                <i class="pi pi-trophy"></i>
                <span>Team Leaderboard</span>
              </div>
              <div class="header-filters">
                <p-select
                  [options]="timeRanges"
                  [(ngModel)]="selectedTimeRange"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Time Range"
                  styleClass="leaderboard-range-select"
                ></p-select>
              </div>
            </div>
          </ng-template>

          <p-table [value]="leaderboard()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th [style.width]="tableColumnWidths.rank">Rank</th>
                <th>Player</th>
                <th [style.width]="tableColumnWidths.score">Points</th>
                <th>Recent Achievement</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-entry>
              <tr [class.current-user]="entry.isCurrentUser">
                <td>
                  @if (entry.rank === 1) {
                    <span class="rank-medal">🥇</span>
                  } @else if (entry.rank === 2) {
                    <span class="rank-medal">🥈</span>
                  } @else if (entry.rank === 3) {
                    <span class="rank-medal">🥉</span>
                  } @else {
                    <span class="rank-number">{{ entry.rank }}</span>
                  }
                </td>
                <td>
                  @if (entry.isCurrentUser) {
                    <strong>⭐ {{ entry.playerName }}</strong>
                  } @else {
                    {{ entry.playerName }}
                  }
                </td>
                <td>
                  <strong>{{ entry.points | number }}</strong>
                </td>
                <td class="recent-achievement">
                  {{ entry.recentAchievement || "-" }}
                </td>
              </tr>
            </ng-template>
          </p-table>

          <div class="leaderboard-footer">
            <span
              >Your Rank: #{{ userRank() }} of
              {{ leaderboard().length }} players</span
            >
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./achievements.component.scss",
})
export class AchievementsComponent implements OnInit {
  // Expose constants for template use
  protected readonly UI_LIMITS = UI_LIMITS;
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // Design system tokens
  protected readonly tableColumnWidths = TABLE_COLUMN_WIDTHS;

  // State
  readonly achievements = signal<Achievement[]>([]);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly selectedCategory = signal<AchievementCategory | "all">("all");
  readonly isLoading = signal(true);

  selectedTimeRange = "week";

  // Constants
  readonly categories = [
    { value: "all" as const, label: "All", icon: "🏅" },
    ...Object.entries(CATEGORY_LABELS).map(([value, { label, icon }]) => ({
      value: value as AchievementCategory,
      label,
      icon,
    })),
  ];

  readonly timeRanges = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
  ];

  // Computed values
  readonly totalPoints = computed(() =>
    this.achievements()
      .filter((a) => a.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0),
  );

  readonly unlockedCount = computed(
    () => this.achievements().filter((a) => a.isUnlocked).length,
  );

  readonly totalAchievements = computed(() => this.achievements().length);

  readonly progressPercent = computed(() => {
    const total = this.totalAchievements();
    if (total === 0) return 0;
    return Math.round((this.unlockedCount() / total) * 100);
  });

  readonly recentUnlocks = computed(() =>
    this.achievements()
      .filter((a) => a.isUnlocked && a.unlockedAt)
      .sort(
        (a, b) =>
          new Date(b.unlockedAt ?? 0).getTime() -
          new Date(a.unlockedAt ?? 0).getTime(),
      ),
  );

  readonly recentUnlock = computed(() => this.recentUnlocks()[0] || null);

  readonly filteredAchievements = computed(() => {
    const category = this.selectedCategory();
    if (category === "all") return this.achievements();
    return this.achievements().filter((a) => a.category === category);
  });

  readonly userRank = computed(() => {
    const entry = this.leaderboard().find((e) => e.isCurrentUser);
    return entry?.rank || 0;
  });

  readonly userRankPercentile = computed(() => {
    const rank = this.userRank();
    const total = this.leaderboard().length;
    if (total === 0 || rank === 0) return 50;
    return Math.round((1 - rank / total) * 100);
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/achievements"),
      );
      if (response?.success && response.data) {
        if (response.data.achievements) {
          this.achievements.set(response.data.achievements);
        }
        if (response.data.leaderboard) {
          this.leaderboard.set(response.data.leaderboard);
        }
      }
    } catch (err) {
      this.logger.error("Failed to load achievements data", err);
      // Initialize with achievement definitions (all locked until user earns them)
      const initialAchievements = ACHIEVEMENT_DEFINITIONS.map((a) => ({
        ...a,
        isUnlocked: false,
      }));
      this.achievements.set(initialAchievements);
      this.leaderboard.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(dateStr: string): string {
    return getTimeAgo(dateStr);
  }
}
