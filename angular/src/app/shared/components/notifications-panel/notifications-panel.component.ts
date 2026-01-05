/**
 * Notifications Panel Component
 *
 * Slide-out panel displaying user notifications
 * Features:
 * - Real-time notification updates
 * - Mark as read functionality
 * - Grouped by date
 * - Action links
 */

import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import {
  Notification,
  NotificationStateService,
} from "../../../core/services/notification-state.service";

@Component({
  selector: "app-notifications-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, DatePipe],
  template: `
    <!-- Backdrop -->
    @if (visible) {
      <div class="notifications-backdrop" (click)="close()"></div>
    }

    <!-- Panel -->
    <div class="notifications-panel" [class.open]="visible">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-left">
          <i class="pi pi-bell header-icon"></i>
          <h3>Notifications</h3>
          @if (notificationService.unreadCount() > 0) {
            <span class="unread-badge">{{
              notificationService.unreadCount()
            }}</span>
          }
        </div>
        <div class="header-actions">
          @if (notificationService.unreadCount() > 0) {
            <button class="mark-read-btn" (click)="markAllAsRead()">
              <i class="pi pi-check-circle"></i>
              <span>Mark all read</span>
            </button>
          }
          <button class="close-btn" (click)="close()" aria-label="Close">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="panel-content">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            @for (i of [1, 2, 3]; track i) {
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
        @if (!isLoading() && notifications().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-bell-slash"></i>
            </div>
            <h4>No notifications</h4>
            <p>
              You're all caught up! We'll notify you when something important
              happens.
            </p>
          </div>
        }

        <!-- Notifications List -->
        @if (!isLoading() && notifications().length > 0) {
          <div class="notifications-list">
            @for (group of groupedNotifications(); track group.date) {
              <div class="notification-group">
                <div class="group-header">{{ group.label }}</div>
                @for (
                  notification of group.notifications;
                  track notification.id
                ) {
                  <div
                    class="notification-item"
                    [class.unread]="!notification.read"
                    (click)="handleNotificationClick(notification)"
                  >
                    <div
                      class="notification-icon"
                      [class]="getIconClass(notification.type)"
                    >
                      <i [class]="getIcon(notification.type)"></i>
                    </div>
                    <div class="notification-body">
                      <p class="notification-message">
                        {{ notification.message }}
                      </p>
                      <span class="notification-time">
                        <i class="pi pi-clock"></i>
                        {{ notification.created_at | date: "shortTime" }}
                      </span>
                    </div>
                    @if (!notification.read) {
                      <div class="unread-indicator"></div>
                    }
                    <button
                      class="dismiss-btn"
                      (click)="dismissNotification($event, notification)"
                      aria-label="Dismiss"
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
        <button class="view-all-btn" (click)="viewAllNotifications()">
          <span>View All Notifications</span>
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

  visible = false;
  isLoading = signal(false);

  notifications = computed(
    () => this.notificationService.state().notifications,
  );

  groupedNotifications = computed(() => {
    const notifications = this.notifications();
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

    if (todayNotifications.length > 0) {
      groups.push({
        date: "today",
        label: "Today",
        notifications: todayNotifications,
      });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({
        date: "yesterday",
        label: "Yesterday",
        notifications: yesterdayNotifications,
      });
    }
    if (thisWeekNotifications.length > 0) {
      groups.push({
        date: "week",
        label: "This Week",
        notifications: thisWeekNotifications,
      });
    }
    if (olderNotifications.length > 0) {
      groups.push({
        date: "older",
        label: "Older",
        notifications: olderNotifications,
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

  async loadNotifications(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.notificationService.loadNotifications();
    } catch {
      // Error handled by service
    } finally {
      this.isLoading.set(false);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();
    } catch {
      // Error handled by service
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
    this.notificationService.removeNotification(notification.id);
  }

  viewAllNotifications(): void {
    // Navigate to settings page with notifications tab active
    // Since there's no dedicated notifications page, redirect to settings
    this.router.navigate(["/settings"], {
      queryParams: { tab: "notifications" },
    });
    this.close();
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      training: "pi pi-calendar",
      achievement: "pi pi-trophy",
      team: "pi pi-users",
      wellness: "pi pi-heart",
      general: "pi pi-bell",
      game: "pi pi-flag",
      tournament: "pi pi-star",
      injury_risk: "pi pi-exclamation-triangle",
      weather: "pi pi-cloud",
    };
    return icons[type] || "pi pi-bell";
  }

  getIconClass(type: string): string {
    return `type-${type}`;
  }
}
