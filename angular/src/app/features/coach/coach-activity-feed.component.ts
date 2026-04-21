/**
 * Coach Activity Feed Component
 *
 * Real-time activity feed showing player actions:
 * - Stats uploads
 * - Training completions
 * - Wellness logs
 * - Achievements
 *
 * Designed for coach dashboard integration.
 */

import {
  Component,
  inject,
  signal,
  computed,
  input,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  TeamNotificationService,
  CoachActivityItem,
  ActivityType,
} from "../../core/services/team-notification.service";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { BadgeComponent } from "../../shared/components/badge/badge.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Skeleton } from "primeng/skeleton";

import { ScrollPanel } from "primeng/scrollpanel";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { getInitials } from "../../shared/utils/format.utils";

const ACTIVITY_PAGE_SIZE = 20;
type ActivityFilter = "all" | ActivityType | "unread";

@Component({
  selector: "app-coach-activity-feed",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    AvatarComponent,
    BadgeComponent,
    StatusTagComponent,
    Skeleton,
    ScrollPanel,
    ButtonComponent,
    EmptyStateComponent,
    IconButtonComponent,
  ],
  templateUrl: "./coach-activity-feed.component.html",
  styleUrl: "./coach-activity-feed.component.scss",
  host: {
    "[style.--activity-feed-height]": "activityFeedHeight",
  },
})
export class CoachActivityFeedComponent {
  private readonly notificationService = inject(TeamNotificationService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Inputs - Angular 21 signal inputs
  readonly compact = input(false);
  readonly showSummary = input(true);
  readonly maxHeight = input("calc(var(--size-200) * 2)");
  readonly limit = input(20);

  // State from service
  readonly activities = this.notificationService.activityFeed;
  readonly loading = this.notificationService.loading;
  readonly unreadCount = this.notificationService.unreadActivityCount;

  // Local state
  private readonly _loadingMore = signal(false);
  private readonly _hasMore = signal(true);
  readonly searchQuery = signal("");
  readonly activityFilter = signal<ActivityFilter>("all");
  readonly filterOptions: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "training_completed", label: "Training" },
    { value: "wellness_logged", label: "Wellness" },
    { value: "stats_uploaded", label: "Stats" },
  ];

  readonly loadingMore = computed(() => this._loadingMore());
  readonly hasMore = computed(() => this._hasMore());

  get activityFeedHeight(): string {
    return this.maxHeight();
  }

  readonly filteredActivities = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.activityFilter();

    return this.activities().filter((activity) => {
      if (filter === "unread" && activity.is_read) {
        return false;
      }

      if (
        filter !== "all" &&
        filter !== "unread" &&
        activity.activity_type !== filter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        activity.player?.full_name,
        activity.player?.position,
        activity.title,
        activity.description,
        activity.activity_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  });

  readonly groupedActivities = computed(() => {
    const groups = new Map<string, CoachActivityItem[]>();

    this.filteredActivities().forEach((activity) => {
      const date = this.getActivityDateLabel(activity.created_at);
      const existing = groups.get(date) || [];
      groups.set(date, [...existing, activity]);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  });

  // Computed stats
  readonly todayStatsCount = computed(() => {
    const today = new Date().toDateString();
    return this.filteredActivities().filter(
      (a) =>
        a.activity_type === "stats_uploaded" &&
        new Date(a.created_at).toDateString() === today,
    ).length;
  });

  readonly todayTrainingCount = computed(() => {
    const today = new Date().toDateString();
    return this.filteredActivities().filter(
      (a) =>
        a.activity_type === "training_completed" &&
        new Date(a.created_at).toDateString() === today,
    ).length;
  });

  readonly filterSummary = computed(() => {
    const total = this.activities().length;
    const filtered = this.filteredActivities().length;
    const filterLabel =
      this.filterOptions.find((option) => option.value === this.activityFilter())
        ?.label ?? "All";

    if (!this.searchQuery().trim() && this.activityFilter() === "all") {
      return `${total} activity items`;
    }

    return `${filtered} of ${total} items shown · ${filterLabel}`;
  });

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    this.loadActivities();
  }


  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async loadActivities(): Promise<void> {
    const activities = await this.notificationService.loadActivityFeed({
      limit: this.limit(),
    });
    this._hasMore.set(activities.length >= this.limit());
  }

  async refresh(): Promise<void> {
    await this.loadActivities();
  }

  setActivityFilter(filter: ActivityFilter): void {
    this.activityFilter.set(filter);
  }

  async loadMore(): Promise<void> {
    this._loadingMore.set(true);
    try {
      const nextBatch = await this.notificationService.loadActivityFeed({
        limit: ACTIVITY_PAGE_SIZE,
        offset: this.activities().length,
        append: true,
      });
      this._hasMore.set(nextBatch.length >= ACTIVITY_PAGE_SIZE);
    } finally {
      this._loadingMore.set(false);
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  async markAllRead(): Promise<void> {
    await this.notificationService.markAllActivityRead();
  }

  async onActivityClick(activity: CoachActivityItem): Promise<void> {
    if (!activity.is_read) {
      await this.notificationService.markActivityRead(activity.id);
    }

    const playerId = activity.player_id || activity.player?.id || null;

    switch (activity.activity_type) {
      case "stats_uploaded":
      case "wellness_logged":
        if (playerId) {
          await this.router.navigate(["/roster"], {
            queryParams: { player: playerId },
          });
          return;
        }
        break;
      case "training_completed":
      case "achievement_earned":
        if (playerId) {
          await this.router.navigate(["/coach/development"], {
            queryParams: { player: playerId, source: "activity" },
          });
          return;
        }
        break;
      case "injury_reported":
        await this.router.navigate(["/coach/injuries"]);
        return;
      case "message_sent":
        await this.router.navigate(["/team-chat"]);
        return;
      default:
        break;
    }

    this.logger.info("Activity clicked without route mapping:", toLogContext(activity));
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getActivityIcon(type: ActivityType): string {
    return this.notificationService.getActivityIcon(type);
  }

  getActivityTypeClass(type: ActivityType): string {
    return `activity-${type}`;
  }

  formatTime(timestamp: string): string {
    return this.notificationService.formatActivityTime(timestamp);
  }

  private getActivityDateLabel(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }
}
