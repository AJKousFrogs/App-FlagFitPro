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
import { RouterModule } from "@angular/router";
import {
  TeamNotificationService,
  CoachActivityItem,
  ActivityType,
} from "../../core/services/team-notification.service";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { TIMEOUTS } from "../../core/constants/app.constants";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { Avatar } from "primeng/avatar";
import { Badge } from "primeng/badge";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Skeleton } from "primeng/skeleton";

import { ScrollPanel } from "primeng/scrollpanel";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { getInitials } from "../../shared/utils/format.utils";

@Component({
  selector: "app-coach-activity-feed",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    Avatar,
    Badge,
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
            <p-badge [value]="unreadCount()" severity="danger"></p-badge>
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
      @if (activities().length > 0) {
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
                      <p-avatar
                        [label]="
                          getInitialsStr(activity.player?.full_name || 'P')
                        "
                        shape="circle"
                        class="activity-avatar-icon"
                      ></p-avatar>
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
      @if (showSummary() && activities().length > 0) {
        <div class="activity-summary">
          <div class="summary-item">
            <i class="pi pi-chart-bar"></i>
            <span>{{ todayStatsCount() }} stats logged today</span>
          </div>
          <div class="summary-item">
            <i class="pi pi-check-circle"></i>
            <span>{{ todayTrainingCount() }} training sessions</span>
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

  // Inputs - Angular 21 signal inputs
  readonly compact = input(false);
  readonly showSummary = input(true);
  readonly maxHeight = input("calc(var(--size-200) * 2)");
  readonly limit = input(20);

  // State from service
  readonly activities = this.notificationService.activityFeed;
  readonly groupedActivities = this.notificationService.groupedActivityFeed;
  readonly loading = this.notificationService.loading;
  readonly unreadCount = this.notificationService.unreadActivityCount;

  // Local state
  private readonly _loadingMore = signal(false);
  private readonly _hasMore = signal(true);

  readonly loadingMore = computed(() => this._loadingMore());
  readonly hasMore = computed(() => this._hasMore());

  get activityFeedHeight(): string {
    return this.maxHeight();
  }

  // Computed stats
  readonly todayStatsCount = computed(() => {
    const today = new Date().toDateString();
    return this.activities().filter(
      (a) =>
        a.activity_type === "stats_uploaded" &&
        new Date(a.created_at).toDateString() === today,
    ).length;
  });

  readonly todayTrainingCount = computed(() => {
    const today = new Date().toDateString();
    return this.activities().filter(
      (a) =>
        a.activity_type === "training_completed" &&
        new Date(a.created_at).toDateString() === today,
    ).length;
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
    await this.notificationService.loadActivityFeed();
  }

  async refresh(): Promise<void> {
    await this.loadActivities();
  }

  async loadMore(): Promise<void> {
    this._loadingMore.set(true);
    try {
      // Would implement pagination
      // For now, just simulate
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.UI_TRANSITION_DELAY),
      );
      this._hasMore.set(false);
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
    // Mark as read
    if (!activity.is_read) {
      await this.notificationService.markActivityRead(activity.id);
    }

    // Navigate based on activity type
    // Would implement navigation to relevant page
    this.logger.info("Activity clicked:", toLogContext(activity));
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

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }
}
