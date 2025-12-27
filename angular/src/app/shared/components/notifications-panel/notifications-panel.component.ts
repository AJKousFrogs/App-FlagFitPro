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

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { DatePipe } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DrawerModule } from "primeng/drawer";
import { BadgeModule } from "primeng/badge";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import {
  NotificationStateService,
  Notification,
} from "../../../core/services/notification-state.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-notifications-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    DatePipe,
    ButtonModule,
    DrawerModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
  ],
  template: `
    <p-drawer
      [(visible)]="visible"
      position="right"
      [style]="{ width: '400px' }"
      styleClass="notifications-sidebar"
    >
      <ng-template pTemplate="header">
        <div class="notifications-header">
          <div class="header-title">
            <h3>Notifications</h3>
            @if (notificationService.unreadCount() > 0) {
              <p-badge
                [value]="notificationService.unreadCount().toString()"
                severity="danger"
              ></p-badge>
            }
          </div>
          @if (notificationService.unreadCount() > 0) {
            <p-button
              label="Mark all read"
              [text]="true"
              size="small"
              (onClick)="markAllAsRead()"
            ></p-button>
          }
        </div>
      </ng-template>

      <div class="notifications-content">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            @for (i of [1, 2, 3]; track i) {
              <div class="notification-skeleton">
                <p-skeleton shape="circle" size="40px"></p-skeleton>
                <div class="skeleton-content">
                  <p-skeleton width="80%" height="16px"></p-skeleton>
                  <p-skeleton width="60%" height="12px"></p-skeleton>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && notifications().length === 0) {
          <div class="empty-state">
            <i class="pi pi-bell-slash"></i>
            <h4>No notifications</h4>
            <p>You're all caught up!</p>
          </div>
        }

        <!-- Notifications List -->
        @if (!isLoading() && notifications().length > 0) {
          <div class="notifications-list">
            @for (group of groupedNotifications(); track group.date) {
              <div class="notification-group">
                <div class="group-header">{{ group.label }}</div>
                @for (notification of group.notifications; track notification.id) {
                  <div
                    class="notification-item"
                    [class.unread]="!notification.read"
                    (click)="handleNotificationClick(notification)"
                  >
                    <div class="notification-icon" [class]="getIconClass(notification.type)">
                      <i [class]="getIcon(notification.type)"></i>
                    </div>
                    <div class="notification-content">
                      <p class="notification-message">{{ notification.message }}</p>
                      <span class="notification-time">
                        {{ notification.created_at | date : "shortTime" }}
                      </span>
                    </div>
                    @if (!notification.read) {
                      <div class="unread-dot"></div>
                    }
                    <p-button
                      icon="pi pi-times"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      pTooltip="Dismiss"
                      (onClick)="dismissNotification($event, notification)"
                      class="dismiss-btn"
                    ></p-button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="notifications-footer">
          <p-button
            label="View All Notifications"
            [outlined]="true"
            (onClick)="viewAllNotifications()"
            styleClass="w-full"
          ></p-button>
        </div>
      </ng-template>
    </p-drawer>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      ::ng-deep .notifications-sidebar {
        .p-sidebar-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--p-surface-200);
        }

        .p-sidebar-content {
          padding: 0;
        }

        .p-sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--p-surface-200);
        }
      }

      .notifications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .header-title h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .notifications-content {
        height: calc(100vh - 150px);
        overflow-y: auto;
      }

      .loading-state {
        padding: var(--space-4);
      }

      .notification-skeleton {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3) 0;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        text-align: center;
        color: var(--text-secondary);
      }

      .empty-state i {
        font-size: 3rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .empty-state h4 {
        margin: 0 0 var(--space-2);
        font-weight: 600;
        color: var(--text-primary);
      }

      .empty-state p {
        margin: 0;
        font-size: 0.875rem;
      }

      .notifications-list {
        padding: var(--space-2) 0;
      }

      .notification-group {
        margin-bottom: var(--space-2);
      }

      .group-header {
        padding: var(--space-2) var(--space-4);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
        background: var(--p-surface-50);
      }

      .notification-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: var(--p-surface-100);
      }

      .notification-item.unread {
        background: var(--p-blue-50);
      }

      .notification-item.unread:hover {
        background: var(--p-blue-100);
      }

      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notification-icon.type-training {
        background: var(--p-blue-100);
        color: var(--p-blue-600);
      }

      .notification-icon.type-achievement {
        background: var(--p-yellow-100);
        color: var(--p-yellow-600);
      }

      .notification-icon.type-team {
        background: var(--p-purple-100);
        color: var(--p-purple-600);
      }

      .notification-icon.type-wellness {
        background: var(--p-green-100);
        color: var(--p-green-600);
      }

      .notification-icon.type-general {
        background: var(--p-surface-200);
        color: var(--text-secondary);
      }

      .notification-icon.type-game {
        background: var(--p-orange-100);
        color: var(--p-orange-600);
      }

      .notification-icon.type-injury_risk {
        background: var(--p-red-100);
        color: var(--p-red-600);
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-message {
        margin: 0 0 var(--space-1);
        font-size: 0.875rem;
        color: var(--text-primary);
        line-height: 1.4;
      }

      .notification-time {
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--p-blue-500);
        flex-shrink: 0;
        margin-top: var(--space-2);
      }

      .dismiss-btn {
        opacity: 0;
        transition: opacity 0.2s;
      }

      .notification-item:hover .dismiss-btn {
        opacity: 1;
      }

      .notifications-footer {
        padding: var(--space-2) 0;
      }
    `,
  ],
})
export class NotificationsPanelComponent {
  notificationService = inject(NotificationStateService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  visible = false;
  isLoading = signal(false);

  notifications = computed(() => this.notificationService.state().notifications);

  groupedNotifications = computed(() => {
    const notifications = this.notifications();
    const groups: { date: string; label: string; notifications: Notification[] }[] = [];

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
      groups.push({ date: "today", label: "Today", notifications: todayNotifications });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({ date: "yesterday", label: "Yesterday", notifications: yesterdayNotifications });
    }
    if (thisWeekNotifications.length > 0) {
      groups.push({ date: "week", label: "This Week", notifications: thisWeekNotifications });
    }
    if (olderNotifications.length > 0) {
      groups.push({ date: "older", label: "Older", notifications: olderNotifications });
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

  async dismissNotification(event: Event, notification: Notification): Promise<void> {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  viewAllNotifications(): void {
    // Navigate to settings page with notifications tab active
    // Since there's no dedicated notifications page, redirect to settings
    this.router.navigate(['/settings'], { queryParams: { tab: 'notifications' } });
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
