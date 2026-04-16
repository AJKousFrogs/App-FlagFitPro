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
  OnDestroy,
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
  template: `
    <div class="activity-feed" [class.compact]="compact()">
      <!-- Header -->
      <div class="feed-header">
        <div class="header-title">
          <i class="pi pi-bell"></i>
          <h3>Player Activity</h3>
          @if (unreadCount() > 0) {
            <app-badge variant="danger">{{ unreadCount() }}</app-badge>
          }
        </div>
        <div class="header-actions">
          @if (unreadCount() > 0) {
            <app-button variant="text" size="sm" (clicked)="markAllRead()"
              >Mark all read</app-button
            >
          }
          <app-icon-button
            icon="pi-refresh"
            variant="text"
            [loading]="loading()"
            (clicked)="refresh()"
            ariaLabel="Refresh activity feed"
            tooltip="Refresh"
          />
        </div>
      </div>

      @if (activities().length > 0) {
        <div class="feed-filters">
          <div class="feed-search">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search player, title, or activity"
              aria-label="Search player activity"
            />
          </div>
          <div class="feed-filter-chips">
            @for (option of filterOptions; track option.value) {
              <app-button
                size="sm"
                [variant]="activityFilter() === option.value ? 'primary' : 'outlined'"
                (clicked)="setActivityFilter(option.value)"
              >
                {{ option.label }}
              </app-button>
            }
          </div>
          <p class="feed-filter-summary">{{ filterSummary() }}</p>
        </div>
      }

      <!-- Loading State -->
      @if (loading() && activities().length === 0) {
        <div class="loading-state">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-item">
              <p-skeleton
                shape="circle"
                size="var(--icon-container-md)"
              ></p-skeleton>
              <div class="skeleton-content">
                <p-skeleton
                  width="60%"
                  height="var(--ds-font-size-sm)"
                ></p-skeleton>
                <p-skeleton
                  width="80%"
                  height="var(--ds-font-size-xs)"
                ></p-skeleton>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && activities().length === 0) {
        <app-empty-state
          icon="pi-inbox"
          heading="No recent player activity"
          description="Activity will appear here when players log training or stats"
        />
      }

      <!-- Activity List -->
      @if (activities().length > 0 && filteredActivities().length === 0) {
        <app-empty-state
          icon="pi-search"
          heading="No activity matches your filters"
          description="Try a different search or reset the activity type filter."
        />
      }

      @if (filteredActivities().length > 0) {
        <p-scrollPanel class="activity-scroll-panel">
          <div class="activity-list">
            @for (group of groupedActivities(); track group.date) {
              <div class="date-group">
                <div class="date-label">{{ group.date }}</div>
                @for (activity of group.items; track activity.id) {
                  <div
                    class="activity-item"
                    [class.unread]="!activity.is_read"
                    (click)="onActivityClick(activity)"
                  >
                    <!-- Player Avatar -->
                    <div
                      class="activity-avatar"
                      [class]="getActivityTypeClass(activity.activity_type)"
                    >
                      <app-avatar
                        [label]="
                          getInitialsStr(activity.player?.full_name || 'P')
                        "
                        shape="circle"
                        styleClass="activity-avatar-icon"
                      />
                      <div class="activity-icon-badge">
                        <i
                          [class]="getActivityIcon(activity.activity_type)"
                        ></i>
                      </div>
                    </div>

                    <!-- Activity Content -->
                    <div class="activity-content">
                      <div class="activity-title">
                        {{ activity.title }}
                      </div>
                      @if (activity.description) {
                        <div class="activity-description">
                          {{ activity.description }}
                        </div>
                      }
                      <div class="activity-meta">
                        <span class="item-time">
                          {{ formatTime(activity.created_at) }}
                        </span>
                        @if (activity.player?.position) {
                          <app-status-tag
                            [value]="activity.player?.position ?? ''"
                            severity="info"
                            size="sm"
                          />
                        }
                      </div>
                    </div>

                    <!-- Unread Indicator -->
                    @if (!activity.is_read) {
                      <div class="unread-dot"></div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Load More -->
            @if (hasMore()) {
              <div class="load-more">
                <app-button
                  variant="text"
                  [loading]="loadingMore()"
                  (clicked)="loadMore()"
                  >Load more</app-button
                >
              </div>
            }
          </div>
        </p-scrollPanel>
      }

      <!-- Quick Stats Summary -->
      @if (showSummary() && filteredActivities().length > 0) {
        <div class="activity-summary">
          <div class="meta-row">
            <i class="pi pi-chart-bar meta-row__icon" aria-hidden="true"></i>
            <span class="meta-row__text"
              >{{ todayStatsCount() }} stats logged today</span
            >
          </div>
          <div class="meta-row">
            <i
              class="pi pi-check-circle meta-row__icon"
              aria-hidden="true"
            ></i>
            <span class="meta-row__text"
              >{{ todayTrainingCount() }} training sessions</span
            >
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./coach-activity-feed.component.scss",
  host: {
    "[style.--activity-feed-height]": "activityFeedHeight",
  },
})
export class CoachActivityFeedComponent implements OnDestroy {
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
  readonly filterOptions: Array<{ value: ActivityFilter; label: string }> = [
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
    const groups: Map<string, CoachActivityItem[]> = new Map();

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

  ngOnDestroy(): void {
    // Cleanup handled by service
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
