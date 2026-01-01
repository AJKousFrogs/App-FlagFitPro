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
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  Input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import {
  TeamNotificationService,
  CoachActivityItem,
  ActivityType,
} from "../../core/services/team-notification.service";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { TagModule } from "primeng/tag";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { LoggerService } from "../../core/services/logger.service";

@Component({
  selector: "app-coach-activity-feed",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    ScrollPanelModule,
  ],
  template: `
    <div class="activity-feed" [class.compact]="compact">
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
            <p-button
              label="Mark all read"
              [text]="true"
              size="small"
              (onClick)="markAllRead()"
            ></p-button>
          }
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            pTooltip="Refresh"
            (onClick)="refresh()"
            [loading]="loading()"
          ></p-button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading() && activities().length === 0) {
        <div class="loading-state">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-item">
              <p-skeleton shape="circle" size="40px"></p-skeleton>
              <div class="skeleton-content">
                <p-skeleton width="60%" height="14px"></p-skeleton>
                <p-skeleton width="80%" height="12px"></p-skeleton>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && activities().length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No recent player activity</p>
          <span
            >Activity will appear here when players log training or stats</span
          >
        </div>
      }

      <!-- Activity List -->
      @if (activities().length > 0) {
        <p-scrollPanel [style]="{ width: '100%', height: maxHeight }">
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
                    <div class="activity-avatar">
                      <p-avatar
                        [label]="getInitials(activity.player?.full_name || 'P')"
                        shape="circle"
                        [style]="{
                          'background-color': getActivityColor(
                            activity.activity_type
                          ),
                          color: '#fff',
                        }"
                      ></p-avatar>
                      <div
                        class="activity-icon-badge"
                        [style.background]="
                          getActivityColor(activity.activity_type)
                        "
                      >
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
                        <span class="activity-time">
                          {{ formatTime(activity.created_at) }}
                        </span>
                        @if (activity.player?.position) {
                          <p-tag
                            [value]="activity.player?.position ?? ''"
                            [rounded]="true"
                            severity="info"
                          ></p-tag>
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
                <p-button
                  label="Load more"
                  [text]="true"
                  (onClick)="loadMore()"
                  [loading]="loadingMore()"
                ></p-button>
              </div>
            }
          </div>
        </p-scrollPanel>
      }

      <!-- Quick Stats Summary -->
      @if (showSummary && activities().length > 0) {
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
  styles: [
    `
      .activity-feed {
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        overflow: hidden;
      }

      .activity-feed.compact {
        border: 1px solid var(--p-surface-200);
      }

      .feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--p-surface-200);
        background: var(--p-surface-50);
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-title i {
        color: var(--color-brand-primary);
        font-size: 1.25rem;
      }

      .header-title h3 {
        margin: 0;
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .loading-state {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .skeleton-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .empty-state {
        padding: var(--space-8) var(--space-4);
        text-align: center;
        color: var(--text-secondary);
      }

      .empty-state i {
        font-size: 3rem;
        margin-bottom: var(--space-3);
        opacity: 0.5;
      }

      .empty-state p {
        margin: 0 0 var(--space-2);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .empty-state span {
        font-size: var(--font-body-sm);
      }

      .activity-list {
        padding: var(--space-2);
      }

      .date-group {
        margin-bottom: var(--space-4);
      }

      .date-label {
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: var(--space-2) var(--space-3);
        margin-bottom: var(--space-2);
      }

      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .activity-item:hover {
        background: var(--p-surface-50);
      }

      .activity-item.unread {
        background: var(--color-brand-light);
      }

      .activity-item.unread:hover {
        background: var(--color-brand-light);
        filter: brightness(0.98);
      }

      .activity-avatar {
        position: relative;
        flex-shrink: 0;
      }

      .activity-icon-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--surface-primary);
      }

      .activity-icon-badge i {
        font-size: 10px;
        color: white;
      }

      .activity-content {
        flex: 1;
        min-width: 0;
      }

      .activity-title {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
        line-height: 1.4;
      }

      .activity-description {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .activity-meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .activity-time {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-brand-primary);
        flex-shrink: 0;
        margin-top: var(--space-2);
      }

      .load-more {
        text-align: center;
        padding: var(--space-3);
      }

      .activity-summary {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: var(--p-surface-50);
        border-top: 1px solid var(--p-surface-200);
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .summary-item i {
        color: var(--color-brand-primary);
      }

      /* Compact mode adjustments */
      .compact .feed-header {
        padding: var(--space-3);
      }

      .compact .header-title h3 {
        font-size: var(--font-body-md);
      }

      .compact .activity-item {
        padding: var(--space-2);
      }

      .compact .activity-title {
        font-size: var(--font-body-sm);
      }
    `,
  ],
})
export class CoachActivityFeedComponent implements OnInit, OnDestroy {
  private notificationService = inject(TeamNotificationService);
  private logger = inject(LoggerService);

  // Inputs
  @Input() compact = false;
  @Input() showSummary = true;
  @Input() maxHeight = "400px";
  @Input() limit = 20;

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

  ngOnInit(): void {
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
      await new Promise((resolve) => setTimeout(resolve, 500));
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
    this.logger.info("Activity clicked:", activity);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getActivityIcon(type: ActivityType): string {
    return this.notificationService.getActivityIcon(type);
  }

  getActivityColor(type: ActivityType): string {
    return this.notificationService.getActivityColor(type);
  }

  formatTime(timestamp: string): string {
    return this.notificationService.formatActivityTime(timestamp);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
}
