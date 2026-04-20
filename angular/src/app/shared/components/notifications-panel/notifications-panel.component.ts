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
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { Tooltip } from "primeng/tooltip";

import { EmptyStateComponent } from "../empty-state/empty-state.component";
import { BackdropComponent } from "../backdrop/backdrop.component";
import { CloseButtonComponent } from "../close-button/close-button.component";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    Tooltip,
    EmptyStateComponent,
    BackdropComponent,
    CloseButtonComponent,
  ],
  templateUrl: "./notifications-panel.component.html",
  styleUrl: "./notifications-panel.component.scss",
  host: {
    "(document:keydown.escape)": "onEscapePress()",
  },
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
  categoryTabs: { id: NotificationCategory; icon: string; tooltip: string }[] =
    [
      { id: "game", icon: "pi-flag", tooltip: "Games" },
      { id: "team", icon: "pi-users", tooltip: "Team" },
      { id: "training", icon: "pi-bolt", tooltip: "Training" },
      { id: "tournament", icon: "pi-trophy", tooltip: "Tournaments" },
      { id: "coach", icon: "pi-user", tooltip: "Coach" },
      { id: "wellness", icon: "pi-heart", tooltip: "Wellness" },
      { id: "achievement", icon: "pi-star", tooltip: "Achievements" },
    ];

  // Close on Escape key
  onEscapePress(): void {
    if (this.visible) {
      this.close();
    }
  }

  // Base notifications (active, not dismissed)
  notifications = computed(() =>
    this.notificationService.activeNotifications(),
  );

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
