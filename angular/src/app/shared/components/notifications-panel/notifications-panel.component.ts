/**
 * Notifications Panel Component
 *
 * Enhanced slide-out panel displaying user notifications
 * Features:
 * - Real-time notification updates via Supabase
 * - Mark as read / dismiss functionality
 * - Grouped by date and filterable by category
 * - Action links with navigation
 * - Swipe to dismiss on mobile
 * - Virtual scrolling for performance
 * - Flag football specific notification styling
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  HostListener,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ScrollerModule } from "primeng/scroller";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import {
  Notification,
  NotificationCategory,
  NotificationStateService,
} from "../../../core/services/notification-state.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { TIMEOUTS, TIME } from "../../../core/constants/app.constants";

@Component({
  selector: "app-notifications-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ScrollerModule, BadgeModule, TooltipModule],
  template: `
    <!-- Backdrop -->
    @if (visible) {
      <div class="notifications-backdrop" (click)="close()"></div>
    }

    <!-- Panel -->
    <div
      class="notifications-panel"
      [class.open]="visible"
      role="dialog"
      aria-label="Notifications panel"
      [attr.aria-hidden]="!visible"
    >
      <!-- Header -->
      <div class="panel-header">
        <div class="header-left">
          <i class="pi pi-bell header-icon"></i>
          <h3>Notifications</h3>
          @if (notificationService.unreadCount() > 0) {
            <span class="unread-badge">{{
              notificationService.unreadCount() > 99
                ? "99+"
                : notificationService.unreadCount()
            }}</span>
          }
          @if (notificationService.state().isRealtimeConnected) {
            <span
              class="realtime-indicator"
              pTooltip="Real-time updates active"
              tooltipPosition="bottom"
            >
              <i class="pi pi-wifi"></i>
            </span>
          }
        </div>
        <div class="header-actions">
          @if (notificationService.unreadCount() > 0) {
            <button
              class="mark-read-btn"
              (click)="markAllAsRead()"
              pTooltip="Mark all as read"
              tooltipPosition="bottom"
            >
              <i class="pi pi-check-circle"></i>
              <span>Mark all read</span>
            </button>
          }
          @if (notificationService.readNotifications().length > 0) {
            <button
              class="clear-read-btn"
              (click)="clearAllRead()"
              pTooltip="Clear read notifications"
              tooltipPosition="bottom"
            >
              <i class="pi pi-trash"></i>
            </button>
          }
          <button class="close-btn" (click)="close()" aria-label="Close">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="category-filter" role="tablist">
        <button
          class="filter-tab"
          [class.active]="selectedCategory() === null"
          (click)="selectCategory(null)"
          role="tab"
          [attr.aria-selected]="selectedCategory() === null"
        >
          All
          @if (notificationService.unreadCount() > 0) {
            <span class="tab-badge">{{ notificationService.unreadCount() }}</span>
          }
        </button>
        @for (cat of categoryTabs; track cat.id) {
          <button
            class="filter-tab"
            [class.active]="selectedCategory() === cat.id"
            (click)="selectCategory(cat.id)"
            role="tab"
            [attr.aria-selected]="selectedCategory() === cat.id"
            [pTooltip]="cat.tooltip"
            tooltipPosition="bottom"
          >
            <i [class]="'pi ' + cat.icon"></i>
            @if (getCategoryCount(cat.id) > 0) {
              <span class="tab-badge">{{ getCategoryCount(cat.id) }}</span>
            }
          </button>
        }
      </div>

      <!-- Content -->
      <div class="panel-content">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="notification-skeleton">
                <div class="skeleton-icon"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line long"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && filteredNotifications().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              @if (selectedCategory()) {
                <i [class]="'pi ' + getCategoryIcon(selectedCategory()!)"></i>
              } @else {
                <i class="pi pi-bell-slash"></i>
              }
            </div>
            <h4>{{ getEmptyStateTitle() }}</h4>
            <p>{{ getEmptyStateMessage() }}</p>
          </div>
        }

        <!-- Notifications List with Virtual Scroll -->
        @if (!isLoading() && filteredNotifications().length > 0) {
          <div class="notifications-list">
            @for (group of groupedNotifications(); track group.date) {
              <div class="notification-group">
                <div class="group-header">
                  <span>{{ group.label }}</span>
                  <span class="group-count">{{ group.notifications.length }}</span>
                </div>
                @for (notification of group.notifications; track notification.id) {
                  <div
                    class="notification-item"
                    [class.unread]="!notification.read"
                    [class.high-priority]="notification.priority === 'high'"
                    [class.dismissing]="dismissingIds().has(notification.id)"
                    [attr.data-category]="notification.category || 'general'"
                    [attr.data-severity]="notification.severity || 'info'"
                    (click)="handleNotificationClick(notification)"
                    role="listitem"
                    tabindex="0"
                    (keydown.enter)="handleNotificationClick(notification)"
                    (keydown.delete)="dismissNotification($event, notification)"
                  >
                    <!-- Category/Severity Icon -->
                    <div
                      class="notification-icon"
                      [class]="getIconClass(notification.category || notification.type)"
                    >
                      <i [class]="getIcon(notification.category || notification.type)"></i>
                    </div>

                    <!-- Content -->
                    <div class="notification-body">
                      @if (notification.title) {
                        <h4 class="notification-title">{{ notification.title }}</h4>
                      }
                      <p class="notification-message">{{ notification.message }}</p>
                      <div class="notification-meta">
                        <span class="notification-time">
                          <i class="pi pi-clock"></i>
                          {{ getRelativeTime(notification.created_at) }}
                        </span>
                        @if (notification.sender_name) {
                          <span class="notification-sender">
                            <i class="pi pi-user"></i>
                            {{ notification.sender_name }}
                          </span>
                        }
                        @if (notification.action_url) {
                          <span class="notification-action-hint">
                            <i class="pi pi-external-link"></i>
                            Tap to view
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Indicators -->
                    <div class="notification-indicators">
                      @if (!notification.read) {
                        <div class="unread-indicator" aria-label="Unread"></div>
                      }
                      @if (notification.priority === 'high') {
                        <i
                          class="pi pi-exclamation-circle priority-indicator"
                          pTooltip="High priority"
                          tooltipPosition="left"
                        ></i>
                      }
                    </div>

                    <!-- Dismiss Button -->
                    <button
                      class="dismiss-btn"
                      (click)="dismissNotification($event, notification)"
                      aria-label="Dismiss notification"
                      pTooltip="Dismiss"
                      tooltipPosition="left"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button class="settings-btn" (click)="openNotificationSettings()">
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </button>
        <button class="view-all-btn" (click)="viewAllNotifications()">
          <span>View All</span>
          <i class="pi pi-arrow-right"></i>
        </button>
      </div>
    </div>
  `,
  styleUrl: "./notifications-panel.component.scss",
})
export class NotificationsPanelComponent {
  notificationService = inject(NotificationStateService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  visible = false;
  isLoading = signal(false);
  selectedCategory = signal<NotificationCategory | null>(null);
  dismissingIds = signal<Set<string>>(new Set());

  // Category tabs for filtering
  categoryTabs: { id: NotificationCategory; icon: string; tooltip: string }[] = [
    { id: "game", icon: "pi-flag", tooltip: "Games" },
    { id: "team", icon: "pi-users", tooltip: "Team" },
    { id: "training", icon: "pi-bolt", tooltip: "Training" },
    { id: "tournament", icon: "pi-trophy", tooltip: "Tournaments" },
    { id: "coach", icon: "pi-user", tooltip: "Coach" },
    { id: "wellness", icon: "pi-heart", tooltip: "Wellness" },
    { id: "achievement", icon: "pi-star", tooltip: "Achievements" },
  ];

  // Close on Escape key
  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    if (this.visible) {
      this.close();
    }
  }

  // Base notifications (active, not dismissed)
  notifications = computed(() => this.notificationService.activeNotifications());

  // Filtered by category
  filteredNotifications = computed(() => {
    const category = this.selectedCategory();
    const all = this.notifications();

    if (!category) {
      return all;
    }

    return all.filter((n) => n.category === category);
  });

  // Get count for a specific category
  getCategoryCount(category: NotificationCategory): number {
    return this.notifications().filter(
      (n) => n.category === category && !n.read,
    ).length;
  }

  groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const groups: {
      date: string;
      label: string;
      notifications: Notification[];
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const todayNotifications: Notification[] = [];
    const yesterdayNotifications: Notification[] = [];
    const thisWeekNotifications: Notification[] = [];
    const olderNotifications: Notification[] = [];

    notifications.forEach((n) => {
      const date = new Date(n.created_at);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        todayNotifications.push(n);
      } else if (date.getTime() === yesterday.getTime()) {
        yesterdayNotifications.push(n);
      } else if (date >= thisWeek) {
        thisWeekNotifications.push(n);
      } else {
        olderNotifications.push(n);
      }
    });

    // Sort each group by created_at descending (newest first)
    const sortByDate = (a: Notification, b: Notification) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    if (todayNotifications.length > 0) {
      groups.push({
        date: "today",
        label: "Today",
        notifications: todayNotifications.sort(sortByDate),
      });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({
        date: "yesterday",
        label: "Yesterday",
        notifications: yesterdayNotifications.sort(sortByDate),
      });
    }
    if (thisWeekNotifications.length > 0) {
      groups.push({
        date: "week",
        label: "This Week",
        notifications: thisWeekNotifications.sort(sortByDate),
      });
    }
    if (olderNotifications.length > 0) {
      groups.push({
        date: "older",
        label: "Older",
        notifications: olderNotifications.sort(sortByDate),
      });
    }

    return groups;
  });

  open(): void {
    this.visible = true;
    this.loadNotifications();
  }

  close(): void {
    this.visible = false;
  }

  toggle(): void {
    if (this.visible) {
      this.close();
    } else {
      this.open();
    }
  }

  selectCategory(category: NotificationCategory | null): void {
    this.selectedCategory.set(category);
  }

  async loadNotifications(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Try direct Supabase load first (faster, includes realtime setup)
      await this.notificationService.loadNotificationsDirect();
    } catch {
      // Fall back to API endpoint
      try {
        await this.notificationService.loadNotifications();
      } catch {
        // Error handled by service
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();
      this.toastService.success(TOAST.SUCCESS.NOTIFICATIONS_MARKED_READ);
    } catch {
      this.toastService.error(TOAST.ERROR.NOTIFICATIONS_MARK_READ_FAILED);
    }
  }

  async clearAllRead(): Promise<void> {
    try {
      await this.notificationService.dismissAllRead();
      this.toastService.info(TOAST.INFO.NOTIFICATIONS_CLEARED);
    } catch {
      this.toastService.error(TOAST.ERROR.NOTIFICATIONS_CLEAR_FAILED);
    }
  }

  async handleNotificationClick(notification: Notification): Promise<void> {
    // Mark as read
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      this.router.navigateByUrl(notification.action_url);
      this.close();
    }
  }

  async dismissNotification(
    event: Event,
    notification: Notification,
  ): Promise<void> {
    event.stopPropagation();

    // Add to dismissing set for animation
    this.dismissingIds.update((ids) => {
      const newSet = new Set(ids);
      newSet.add(notification.id);
      return newSet;
    });

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.DEBOUNCE_TIME));

    try {
      await this.notificationService.dismissNotification(notification.id);
    } catch {
      // Revert animation state on error
      this.dismissingIds.update((ids) => {
        const newSet = new Set(ids);
        newSet.delete(notification.id);
        return newSet;
      });
      this.toastService.error(TOAST.ERROR.NOTIFICATION_DISMISS_FAILED);
    }
  }

  viewAllNotifications(): void {
    this.router.navigate(["/settings"], {
      queryParams: { tab: "notifications" },
    });
    this.close();
  }

  openNotificationSettings(): void {
    this.router.navigate(["/settings"], {
      queryParams: { tab: "notifications" },
    });
    this.close();
  }

  /**
   * Get relative time string (e.g., "2 hours ago", "Yesterday")
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / TIME.MS_PER_MINUTE);
    const diffHours = Math.floor(diffMs / TIME.MS_PER_HOUR);
    const diffDays = Math.floor(diffMs / TIME.MS_PER_DAY);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get empty state title based on filter
   */
  getEmptyStateTitle(): string {
    const category = this.selectedCategory();
    if (category) {
      const categoryNames: Record<NotificationCategory, string> = {
        game: "game",
        team: "team",
        training: "training",
        wellness: "wellness",
        achievement: "achievement",
        tournament: "tournament",
        coach: "coach",
        system: "system",
        general: "",
      };
      return `No ${categoryNames[category]} notifications`;
    }
    return "No notifications";
  }

  /**
   * Get empty state message based on filter
   */
  getEmptyStateMessage(): string {
    const category = this.selectedCategory();
    if (category) {
      const messages: Record<NotificationCategory, string> = {
        game: "Game invites and updates will appear here.",
        team: "Team announcements and roster changes will appear here.",
        training: "Training reminders and schedule updates will appear here.",
        wellness: "Wellness alerts and recovery tips will appear here.",
        achievement: "Your achievements and milestones will appear here.",
        tournament: "Tournament updates and bracket changes will appear here.",
        coach: "Coach messages and feedback will appear here.",
        system: "System updates will appear here.",
        general: "General notifications will appear here.",
      };
      return messages[category];
    }
    return "You're all caught up! We'll notify you when something important happens.";
  }

  /**
   * Get icon class for category
   */
  getCategoryIcon(category: NotificationCategory): string {
    const icons: Record<NotificationCategory, string> = {
      game: "pi-flag",
      team: "pi-users",
      training: "pi-bolt",
      wellness: "pi-heart",
      achievement: "pi-trophy",
      tournament: "pi-star",
      coach: "pi-user",
      system: "pi-cog",
      general: "pi-bell",
    };
    return icons[category] || "pi-bell";
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      // Categories
      game: "pi pi-flag",
      team: "pi pi-users",
      training: "pi pi-bolt",
      wellness: "pi pi-heart",
      achievement: "pi pi-trophy",
      tournament: "pi pi-star",
      coach: "pi pi-user",
      system: "pi pi-cog",
      general: "pi pi-bell",
      // Legacy types
      injury_risk: "pi pi-exclamation-triangle",
      weather: "pi pi-cloud",
      // Specific notification types
      game_invite: "pi pi-envelope",
      game_reminder: "pi pi-clock",
      game_score_update: "pi pi-chart-bar",
      team_invite: "pi pi-user-plus",
      training_reminder: "pi pi-calendar",
      training_canceled: "pi pi-times-circle",
      achievement_unlocked: "pi pi-star-fill",
      personal_record: "pi pi-chart-line",
      coach_override: "pi pi-pencil",
      coach_feedback: "pi pi-comment",
      wellness_alert: "pi pi-exclamation-circle",
    };
    return icons[type] || "pi pi-bell";
  }

  getIconClass(type: string): string {
    // Map categories to their CSS classes
    const categoryMap: Record<string, string> = {
      game: "type-game",
      team: "type-team",
      training: "type-training",
      wellness: "type-wellness",
      achievement: "type-achievement",
      tournament: "type-tournament",
      coach: "type-coach",
      system: "type-system",
      general: "type-general",
      injury_risk: "type-injury_risk",
    };
    return categoryMap[type] || `type-${type}`;
  }
}
