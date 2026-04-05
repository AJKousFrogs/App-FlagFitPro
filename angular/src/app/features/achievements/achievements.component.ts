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
import { ProgressBarComponent } from "../../shared/components/progress-bar/progress-bar.component";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
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

interface AchievementApiRecord extends Achievement {
  earned?: boolean;
  earnedAt?: string;
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
    icon: "pi-heart",
    points: 10,
    isUnlocked: false,
  },
  {
    id: "wellness-streak-7",
    name: "7-Day Streak",
    description: "7 consecutive wellness check-ins",
    category: "wellness",
    icon: "pi-heart",
    points: 25,
    isUnlocked: false,
  },
  {
    id: "wellness-streak-30",
    name: "30-Day Streak",
    description: "30 consecutive wellness check-ins",
    category: "wellness",
    icon: "pi-heart",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "acwr-sweet-spot",
    name: "ACWR Sweet Spot",
    description: "Stay in optimal ACWR zone for 7 consecutive days",
    category: "wellness",
    icon: "pi-bullseye",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "10 check-ins before 6:00 AM",
    category: "wellness",
    icon: "pi-sun",
    points: 25,
    isUnlocked: false,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "10 check-ins after 10:00 PM",
    category: "wellness",
    icon: "pi-moon",
    points: 25,
    isUnlocked: false,
  },

  // Training
  {
    id: "training-first",
    name: "First Session",
    description: "Log your first training session",
    category: "training",
    icon: "pi-replay",
    points: 15,
    isUnlocked: false,
  },
  {
    id: "training-50",
    name: "Halfway There",
    description: "Complete 50 training sessions",
    category: "training",
    icon: "pi-replay",
    points: 35,
    isUnlocked: false,
  },
  {
    id: "training-century",
    name: "Century Club",
    description: "Complete 100 training sessions",
    category: "training",
    icon: "pi-replay",
    points: 75,
    isUnlocked: false,
  },
  {
    id: "training-iron",
    name: "Iron Warrior",
    description: "Complete 500 training sessions",
    category: "training",
    icon: "pi-replay",
    points: 150,
    isUnlocked: false,
  },

  // Performance
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Beat your 40-yard PR by 0.1s",
    category: "performance",
    icon: "pi-bolt",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "vertical-king",
    name: "Vertical King",
    description: "Vertical jump PR > 36 inches",
    category: "performance",
    icon: "pi-arrow-up",
    points: 50,
    isUnlocked: false,
  },
  {
    id: "first-game-win",
    name: "First Win",
    description: "Win your first game",
    category: "performance",
    icon: "pi-trophy",
    points: 100,
    isUnlocked: false,
  },
  {
    id: "touchdown-scorer",
    name: "TD Scorer",
    description: "Score your first touchdown",
    category: "performance",
    icon: "pi-bullseye",
    points: 50,
    isUnlocked: false,
  },

  // Social
  {
    id: "team-player",
    name: "Team Player",
    description: "Complete 10 team practices",
    category: "social",
    icon: "pi-users",
    points: 20,
    isUnlocked: false,
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Help a teammate with their training",
    category: "social",
    icon: "pi-user-plus",
    points: 40,
    isUnlocked: false,
  },

  // Special
  {
    id: "perfect-week",
    name: "Perfect Week",
    description: "Complete all scheduled activities for a week",
    category: "special",
    icon: "pi-star",
    points: 75,
    isUnlocked: false,
  },
  {
    id: "comeback",
    name: "Comeback",
    description: "Complete return-to-play protocol successfully",
    category: "special",
    icon: "pi-heart",
    points: 100,
    isUnlocked: false,
  },
];

const CATEGORY_LABELS: Record<
  AchievementCategory,
  { label: string; icon: string }
> = {
  wellness: { label: "Wellness", icon: "pi-heart" },
  training: { label: "Training", icon: "pi-chart-line" },
  performance: { label: "Performance", icon: "pi-trophy" },
  social: { label: "Social", icon: "pi-users" },
  special: { label: "Special", icon: "pi-star" },
};

@Component({
  selector: "app-achievements",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    ProgressBarComponent,
    TableModule,
    StatusTagComponent,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="achievements-page bento-grid ui-page-shell">
        <!-- Header (Full Width) -->
        <div class="bento-item full-width no-padding header-bento">
          <app-page-header
            title="Milestones" eyebrow="MILESTONES"
            subtitle="Badges earned, streaks held, goals crushed."
            icon="pi-trophy"
          ></app-page-header>
        </div>

        <!-- Stats Bento (Full Width) -->
        <div class="bento-item full-width stats-bento">
          <div class="stats-inner-grid">
            <div class="stat-box highlight">
              <span class="lbl">Total Points</span>
              <span class="val">{{ totalPoints() | number }}</span>
              @if (totalPoints() > 0) {
                <app-status-tag [value]="'Top ' + userRankPercentile() + '%'" severity="info" size="sm" />
              }
            </div>
            <div class="stat-box">
              <span class="lbl">Badges Earned</span>
              <span class="val">{{ unlockedCount() }} / {{ totalAchievements() }}</span>
            </div>
            <div class="stat-box">
              <span class="lbl">Global Rank</span>
              <span class="val">#{{ userRank() }}</span>
            </div>
            <div class="stat-box progress-box">
              <span class="lbl">Season Progress</span>
              <span class="val">{{ progressPercent() }}%</span>
              <app-progress-bar [value]="progressPercent()" [showValue]="false" />
            </div>
          </div>
        </div>

        <!-- Recently Unlocked (Span 2) -->
        @if (recentUnlocks().length > 0) {
          <div class="bento-item span-2 recent-locks-bento">
            <h3 class="bento-title"><i class="pi pi-bolt"></i> Just Unlocked</h3>
            <div class="recent-list">
              @for (achievement of recentUnlocks().slice(0, 3); track achievement.id) {
                <div class="unlock-item">
                  <span class="icon">
                    @if (isPrimeIcon(achievement.icon)) {
                      <i [class]="normalizePrimeIcon(achievement.icon)" aria-hidden="true"></i>
                    } @else {
                      {{ achievement.icon }}
                    }
                  </span>
                  <div class="info">
                    <h4>{{ achievement.name }}</h4>
                    <p>{{ achievement.unlockedAt | date }}</p>
                  </div>
                  <span class="pts">+{{ achievement.points }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Points Leaderboard Preview (Span 1) -->
        <div class="bento-item leaderboard-preview-bento">
          <h3 class="bento-title"><i class="pi pi-list"></i> Leaderboard</h3>
          <div class="leaderboard-mini">
            @for (entry of leaderboard().slice(0, 2); track entry.playerId) {
              <div class="leader-row">
                <span class="rank">{{ entry.rank }}</span>
                <span class="name">{{ entry.playerName }}</span>
                <span class="p">{{ entry.points | number }}</span>
              </div>
            }
            <div class="leader-row you">
              <span class="rank">{{ userRank() }}</span>
              <span class="name">You</span>
              <span class="p">{{ totalPoints() | number }}</span>
            </div>
          </div>
        </div>

        <!-- Achievement Gallery (Full Width) -->
        <section class="bento-item full-width gallery-bento" aria-labelledby="gallery-heading">
          <header class="gallery-header">
            <h3 id="gallery-heading" class="bento-title">
              <i class="pi pi-th-large" aria-hidden="true"></i> Badge Gallery
            </h3>
            <nav class="category-filters" role="tablist" aria-label="Achievement categories">
              @for (cat of categories; track cat.value) {
                <button
                  type="button"
                  role="tab"
                  class="cat-chip"
                  [class.active]="selectedCategory() === cat.value"
                  [attr.aria-selected]="selectedCategory() === cat.value"
                  [attr.aria-label]="'Filter by ' + cat.label + ' achievements'"
                  (click)="selectedCategory.set(cat.value)"
                >
                  <i
                    class="cat-chip__icon"
                    [class]="normalizePrimeIcon(cat.icon)"
                    aria-hidden="true"
                  ></i>
                  {{ cat.label }}
                </button>
              }
            </nav>
          </header>

          <div class="badges-grid" role="list" aria-label="Achievement badges">
            @for (achievement of filteredAchievements(); track achievement.id) {
              <article
                class="badge-card"
                [class.locked]="!achievement.isUnlocked"
                role="listitem"
                [attr.aria-label]="achievement.name + ': ' + achievement.description + '. ' + achievement.points + ' points. ' + (achievement.isUnlocked ? 'Unlocked' : 'Locked')"
              >
                <div class="badge-visual" [attr.aria-hidden]="true">
                  @if (isPrimeIcon(achievement.icon)) {
                    <i [class]="normalizePrimeIcon(achievement.icon) + ' badge-icon'" aria-hidden="true"></i>
                  } @else {
                    <span class="emoji" role="img" [attr.aria-label]="achievement.name + ' icon'">{{ achievement.icon }}</span>
                  }
                  @if (achievement.isUnlocked) {
                    <i class="pi pi-check-circle check" [attr.aria-label]="'Unlocked'"></i>
                  }
                </div>
                <h4>{{ achievement.name }}</h4>
                <p>{{ achievement.description }}</p>
                <footer class="badge-footer">
                  <span class="pts" aria-label="{{ achievement.points }} points">{{ achievement.points }} PTS</span>
                  @if (!achievement.isUnlocked && achievement.target) {
                    <app-progress-bar
                      [value]="(achievement.progress || 0) / achievement.target * 100"
                      [showValue]="false"
                    />
                  }
                </footer>
              </article>
            }
          </div>
        </section>
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
  // Design system tokens
  protected readonly tableColumnWidths = TABLE_COLUMN_WIDTHS;

  // State
  readonly achievements = signal<Achievement[]>([]);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly selectedCategory = signal<AchievementCategory | "all">("all");
  readonly isLoading = signal(true);

  readonly selectedTimeRange = signal<"week" | "month" | "all">("week");

  // Constants
  readonly categories = [
    { value: "all" as const, label: "All", icon: "pi-th-large" },
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

  onTimeRangeChange(event: { value: "week" | "month" | "all" }): void {
    this.selectedTimeRange.set(event.value);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{
          achievements?: AchievementApiRecord[];
          leaderboard?: LeaderboardEntry[];
        }>(API_ENDPOINTS.achievements.list),
      );
      const payload = extractApiPayload<{
        achievements?: AchievementApiRecord[];
        leaderboard?: LeaderboardEntry[];
      }>(response);
      if (payload) {
        if (payload.achievements) {
          this.achievements.set(payload.achievements);
        }
        if (payload.leaderboard) {
          this.leaderboard.set(payload.leaderboard);
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

  /**
   * Check if an icon string is a PrimeIcon (handles both "pi-play" and "pi pi-play" formats)
   */
  isPrimeIcon(icon: string | undefined | null): boolean {
    if (!icon) return false;
    return icon.startsWith("pi-") || icon.startsWith("pi ");
  }

  /**
   * Normalize PrimeIcon class string to proper "pi pi-xxx" format
   * Handles: "pi-play" → "pi pi-play", "pi pi-play" → "pi pi-play"
   */
  normalizePrimeIcon(icon: string): string {
    if (!icon) return "pi pi-star";
    if (icon.startsWith("pi pi-")) return icon;
    if (icon.startsWith("pi-")) return `pi ${icon}`;
    if (icon.startsWith("pi ")) return icon.replace("pi ", "pi pi-").replace("pi-pi-", "pi-");
    return `pi pi-${icon}`;
  }
}
