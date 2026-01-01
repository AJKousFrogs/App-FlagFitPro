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
  styles: [
    `
      :host {
        display: block;
      }

      /* Backdrop */
      .notifications-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Panel */
      .notifications-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 380px;
        max-width: 100vw;
        height: 100vh;
        background: var(--surface-primary, #0f172a);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notifications-panel.open {
        transform: translateX(0);
      }

      /* Header */
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--p-surface-200, #333);
        background: var(--surface-primary, #0f172a);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .header-icon {
        font-size: 1.25rem;
        color: var(--ds-primary-green, #089949);
      }

      .panel-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }

      .unread-badge {
        background: var(--color-status-error, #ef4444);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.125rem 0.5rem;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mark-read-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--ds-primary-green, #089949);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .mark-read-btn:hover {
        background: rgba(8, 153, 73, 0.1);
      }

      .close-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: var(--p-surface-100, #1e293b);
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .close-btn:hover {
        background: var(--p-surface-200, #334155);
        color: var(--text-primary, #ffffff);
      }

      /* Content */
      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      /* Loading State */
      .loading-state {
        padding: 1rem 1.5rem;
      }

      .notification-skeleton {
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
      }

      .skeleton-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--p-surface-200, #333);
        animation: pulse 1.5s ease-in-out infinite;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 0.25rem;
      }

      .skeleton-line {
        height: 14px;
        border-radius: 4px;
        background: var(--p-surface-200, #333);
        animation: pulse 1.5s ease-in-out infinite;
      }

      .skeleton-line.long {
        width: 85%;
      }

      .skeleton-line.short {
        width: 50%;
        height: 12px;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 0.7;
        }
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--p-surface-100, #1e293b);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .empty-icon i {
        font-size: 2rem;
        color: var(--text-tertiary, #64748b);
      }

      .empty-state h4 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }

      .empty-state p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary, #94a3b8);
        max-width: 260px;
        line-height: 1.5;
      }

      /* Notifications List */
      .notifications-list {
        padding: 0.5rem 0;
      }

      .notification-group {
        margin-bottom: 0.5rem;
      }

      .group-header {
        padding: 0.625rem 1.5rem;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-tertiary, #64748b);
        background: var(--p-surface-50, #1a1f2e);
      }

      .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        padding: 1rem 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        border-left: 3px solid transparent;
      }

      .notification-item:hover {
        background: var(--p-surface-100, #1e293b);
      }

      .notification-item.unread {
        background: rgba(8, 153, 73, 0.08);
        border-left-color: var(--ds-primary-green, #089949);
      }

      .notification-item.unread:hover {
        background: rgba(8, 153, 73, 0.12);
      }

      .notification-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.125rem;
      }

      .notification-icon.type-training {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
      }

      .notification-icon.type-achievement {
        background: rgba(234, 179, 8, 0.15);
        color: #fbbf24;
      }

      .notification-icon.type-team {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
      }

      .notification-icon.type-wellness {
        background: rgba(8, 153, 73, 0.15);
        color: #10c96b;
      }

      .notification-icon.type-general {
        background: var(--p-surface-200, #333);
        color: var(--text-secondary, #94a3b8);
      }

      .notification-icon.type-game {
        background: rgba(249, 115, 22, 0.15);
        color: #fb923c;
      }

      .notification-icon.type-injury_risk {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
      }

      .notification-body {
        flex: 1;
        min-width: 0;
      }

      .notification-message {
        margin: 0 0 0.375rem;
        font-size: 0.875rem;
        color: var(--text-primary, #ffffff);
        line-height: 1.45;
      }

      .notification-time {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: var(--text-tertiary, #64748b);
      }

      .notification-time i {
        font-size: 0.6875rem;
      }

      .unread-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ds-primary-green, #089949);
        flex-shrink: 0;
        margin-top: 0.5rem;
        box-shadow: 0 0 8px rgba(8, 153, 73, 0.5);
      }

      .dismiss-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--text-tertiary, #64748b);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .notification-item:hover .dismiss-btn {
        opacity: 1;
      }

      .dismiss-btn:hover {
        background: var(--p-surface-200, #333);
        color: var(--text-primary, #ffffff);
      }

      /* Footer */
      .panel-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--p-surface-200, #333);
        background: var(--surface-primary, #0f172a);
      }

      .view-all-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 12px;
        background: var(--ds-primary-green, #089949);
        color: white;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .view-all-btn:hover {
        background: var(--ds-primary-green-dark, #067a3b);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .view-all-btn i {
        font-size: 0.875rem;
        transition: transform 0.2s;
      }

      .view-all-btn:hover i {
        transform: translateX(3px);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .notifications-panel {
          width: 100vw;
        }

        .mark-read-btn span {
          display: none;
        }
      }
    `,
  ],
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
