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
  templateUrl: "./achievements-panel.component.html",
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
      streak: "Streak Achievements",
      volume: "Training Volume",
      milestone: "Milestones",
      position: "Position-Specific",
      tournament: "Tournament",
      recovery: "Recovery & Wellness",
      social: "Social",
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
      training: "pi-bolt",
      protocol: "pi-clipboard",
      wellness: "pi-heart",
      qb_throwing: "pi-bullseye",
      arm_care: "pi-chart-line",
    };
    return icons[type] || "pi-chart-bar";
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
