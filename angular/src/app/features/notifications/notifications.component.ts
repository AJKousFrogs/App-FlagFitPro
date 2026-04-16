import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import {
  Notification,
  NotificationCategory,
  NotificationStateService,
} from "../../core/services/notification-state.service";

type NotificationStatusFilter = "all" | "unread" | "read";
type NotificationPriorityFilter = "all" | "urgent" | "high" | "attention";

interface NotificationCategoryTab {
  id: NotificationCategory | "all";
  label: string;
  icon: string;
}

@Component({
  selector: "app-notifications",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
      <div
        class="notifications-page ui-page-shell ui-page-shell--content-lg ui-page-stack"
      >
        <app-page-header
          title="Notifications"
          eyebrow="INBOX"
          subtitle="Review updates, coach messages, and system alerts in one place."
          icon="pi-bell"
        >
          <div class="page-actions">
            <app-button
              variant="outlined"
              iconLeft="pi-cog"
              routerLink="/settings/notifications"
            >
              Notification Settings
            </app-button>
            <app-button
              variant="secondary"
              iconLeft="pi-refresh"
              [loading]="isRefreshing()"
              (clicked)="refresh()"
            >
              Refresh
            </app-button>
          </div>
        </app-page-header>

        <section class="summary-grid" aria-label="Notification overview">
          <app-card-shell title="Unread" headerIcon="pi-envelope">
            <p class="summary-value">{{ notificationService.unreadCount() }}</p>
            <p class="summary-copy">Items that still need attention.</p>
          </app-card-shell>

          <app-card-shell title="Priority" headerIcon="pi-exclamation-circle">
            <p class="summary-value">
              {{ notificationService.highPriorityUnread().length }}
            </p>
            <p class="summary-copy">High and urgent alerts not yet reviewed.</p>
          </app-card-shell>

          <app-card-shell title="Realtime" headerIcon="pi-wifi">
            <p class="summary-value">
              {{
                notificationService.state().isRealtimeConnected
                  ? "Connected"
                  : "Offline"
              }}
            </p>
            <p class="summary-copy">
              {{
                notificationService.state().isRealtimeConnected
                  ? "New notifications will appear automatically."
                  : "Refresh to pull the latest updates."
              }}
            </p>
          </app-card-shell>
        </section>

        <section class="overview-grid" aria-label="Inbox highlights">
          <app-card-shell title="Needs Attention" headerIcon="pi-bell">
            @if (priorityNotifications().length > 0) {
              <div class="spotlight-list">
                @for (notification of priorityNotifications(); track notification.id) {
                  <button
                    type="button"
                    class="spotlight-item"
                    (click)="openNotification(notification)"
                  >
                    <span class="spotlight-item__title">
                      {{ notification.title || getNotificationLabel(notification) }}
                    </span>
                    <span class="spotlight-item__meta">
                      {{ formatPriority(notification.priority || "normal") }} ·
                      {{ formatTimestamp(notification.created_at) }}
                    </span>
                  </button>
                }
              </div>
            } @else {
              <p class="summary-copy">
                No urgent or high-priority items are waiting right now.
              </p>
            }
          </app-card-shell>

          <app-card-shell title="Inbox State" headerIcon="pi-compass">
            <div class="overview-metrics">
              <div class="overview-metric">
                <span class="overview-metric__label">Visible now</span>
                <strong>{{ filteredNotifications().length }}</strong>
              </div>
              <div class="overview-metric">
                <span class="overview-metric__label">Current mode</span>
                <strong>{{ selectedStatusLabel() }}</strong>
              </div>
            </div>
            <p class="summary-copy">
              {{ selectedFilterSummary() }}
            </p>
          </app-card-shell>
        </section>

        <app-card-shell title="Filters" headerIcon="pi-filter">
          <div class="filters-stack">
            <div class="filter-search">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search title, message, sender, or category"
                aria-label="Search notifications"
              />
            </div>

            <div class="filter-row" role="tablist" aria-label="Notification priority">
              @for (filter of priorityFilters; track filter.id) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.filter-chip--active]="selectedPriority() === filter.id"
                  (click)="selectedPriority.set(filter.id)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>

            <div class="filter-row" role="tablist" aria-label="Notification status">
              @for (filter of statusFilters; track filter.id) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.filter-chip--active]="selectedStatus() === filter.id"
                  (click)="selectedStatus.set(filter.id)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>

            <div class="filter-row" role="tablist" aria-label="Notification categories">
              @for (tab of categoryTabs; track tab.id) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.filter-chip--active]="selectedCategory() === tab.id"
                  (click)="selectedCategory.set(tab.id)"
                >
                  <i [class]="'pi ' + tab.icon" aria-hidden="true"></i>
                  <span>{{ tab.label }}</span>
                  <span class="filter-count">{{ getCategoryCount(tab.id) }}</span>
                </button>
              }
            </div>
          </div>

          <div class="bulk-actions">
            <app-button
              variant="text"
              iconLeft="pi-filter-slash"
              [disabled]="!hasActiveFilters()"
              (clicked)="resetFilters()"
            >
              Reset filters
            </app-button>
          </div>
        </app-card-shell>

        @if (notificationService.state().error) {
          <app-card-shell
            title="Could not load notifications"
            headerIcon="pi-exclamation-triangle"
            tone="warning"
          >
            <p class="error-copy">
              {{ notificationService.state().error }}
            </p>
          </app-card-shell>
        }

        <div class="bulk-actions">
          <app-button
            variant="text"
            iconLeft="pi-check-circle"
            [disabled]="notificationService.unreadCount() === 0"
            (clicked)="markAllAsRead()"
          >
            Mark all as read
          </app-button>
          <app-button
            variant="text"
            iconLeft="pi-trash"
            [disabled]="notificationService.readNotifications().length === 0"
            (clicked)="clearRead()"
          >
            Clear read
          </app-button>
        </div>

        @if (isLoading()) {
          <section class="list-stack" aria-label="Loading notifications">
            @for (item of [1, 2, 3]; track item) {
              <app-card-shell>
                <div class="notification-skeleton"></div>
              </app-card-shell>
            }
          </section>
        } @else if (filteredNotifications().length === 0) {
          <app-empty-state
            icon="pi-bell-slash"
            heading="No notifications match these filters"
            description="Try another category or check back after your next team, training, or system update."
          />
        } @else {
          <section class="list-stack" aria-label="Notification list">
            @for (notification of filteredNotifications(); track notification.id) {
              <app-card-shell
                class="notification-card"
                [title]="notification.title || getNotificationLabel(notification)"
                [headerIcon]="getNotificationIcon(notification)"
                [tone]="getNotificationTone(notification)"
              >
                <div
                  class="notification-entry"
                  [class.notification-entry--unread]="!notification.read"
                >
                  <div class="notification-meta">
                    <span class="notification-pill">{{
                      getNotificationLabel(notification)
                    }}</span>
                    <span class="notification-time">{{
                      formatTimestamp(notification.created_at)
                    }}</span>
                  </div>

                  <p class="notification-message">{{ notification.message }}</p>

                  <div class="notification-footer">
                    <div class="notification-source">
                      @if (notification.sender_name) {
                        <span>{{ notification.sender_name }}</span>
                      } @else {
                        <span>FlagFit Pro</span>
                      }
                      @if (notification.priority && notification.priority !== "normal") {
                        <span class="notification-priority">
                          {{ formatPriority(notification.priority) }}
                        </span>
                      }
                    </div>

                    <div class="notification-actions">
                      @if (!notification.read) {
                        <app-button
                          size="sm"
                          variant="text"
                          iconLeft="pi-check"
                          (clicked)="markAsRead(notification, $event)"
                        >
                          Mark read
                        </app-button>
                      }

                      @if (notification.action_url) {
                        <app-button
                          size="sm"
                          variant="text"
                          iconLeft="pi-arrow-right"
                          (clicked)="openNotification(notification, $event)"
                        >
                          Open
                        </app-button>
                      }

                      <app-button
                        size="sm"
                        variant="text"
                        iconLeft="pi-times"
                        (clicked)="dismiss(notification, $event)"
                      >
                        Dismiss
                      </app-button>
                    </div>
                  </div>
                </div>
              </app-card-shell>
            }
          </section>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./notifications.component.scss",
})
export class NotificationsComponent implements OnInit {
  protected readonly notificationService = inject(NotificationStateService);
  private readonly router = inject(Router);

  readonly selectedCategory = signal<NotificationCategory | "all">("all");
  readonly selectedStatus = signal<NotificationStatusFilter>("all");
  readonly selectedPriority = signal<NotificationPriorityFilter>("all");
  readonly searchQuery = signal("");
  readonly isRefreshing = signal(false);

  readonly categoryTabs: readonly NotificationCategoryTab[] = [
    { id: "all", label: "All", icon: "pi-list" },
    { id: "team", label: "Team", icon: "pi-users" },
    { id: "training", label: "Training", icon: "pi-bolt" },
    { id: "coach", label: "Coach", icon: "pi-comments" },
    { id: "wellness", label: "Wellness", icon: "pi-heart" },
    { id: "system", label: "System", icon: "pi-cog" },
  ];

  readonly statusFilters = [
    { id: "all" as const, label: "All" },
    { id: "unread" as const, label: "Unread" },
    { id: "read" as const, label: "Read" },
  ];
  readonly priorityFilters = [
    { id: "all" as const, label: "All priorities" },
    { id: "attention" as const, label: "Needs attention" },
    { id: "urgent" as const, label: "Urgent" },
    { id: "high" as const, label: "High" },
  ];

  readonly isLoading = computed(
    () => this.notificationService.state().loading && this.notificationService.activeNotifications().length === 0,
  );

  readonly filteredNotifications = computed(() => {
    const category = this.selectedCategory();
    const status = this.selectedStatus();
    const priority = this.selectedPriority();
    const query = this.searchQuery().trim().toLowerCase();

    return this.notificationService
      .activeNotifications()
      .filter((notification) => category === "all" || notification.category === category)
      .filter((notification) => {
        if (status === "unread") return !notification.read;
        if (status === "read") return notification.read;
        return true;
      })
      .filter((notification) => {
        if (priority === "urgent") {
          return notification.priority === "urgent";
        }
        if (priority === "high") {
          return notification.priority === "high";
        }
        if (priority === "attention") {
          return this.getPriorityWeight(notification.priority) >= 2 || !notification.read;
        }
        return true;
      })
      .filter((notification) => {
        if (!query) {
          return true;
        }

        const searchableText = [
          notification.title,
          notification.message,
          notification.sender_name,
          notification.category,
          notification.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort((left, right) => {
        if (left.read !== right.read) {
          return left.read ? 1 : -1;
        }

        const priorityDelta = this.getPriorityWeight(right.priority) - this.getPriorityWeight(left.priority);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
  });

  readonly priorityNotifications = computed(() =>
    this.notificationService
      .activeNotifications()
      .filter((notification) => !notification.read && this.getPriorityWeight(notification.priority) >= 2)
      .sort((left, right) => {
        const priorityDelta = this.getPriorityWeight(right.priority) - this.getPriorityWeight(left.priority);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      })
      .slice(0, 3),
  );

  readonly hasActiveFilters = computed(
    () =>
      this.selectedCategory() !== "all" ||
      this.selectedStatus() !== "all" ||
      this.selectedPriority() !== "all" ||
      this.searchQuery().trim().length > 0,
  );

  readonly selectedStatusLabel = computed(() => {
    switch (this.selectedStatus()) {
      case "unread":
        return "Unread only";
      case "read":
        return "Reviewed";
      default:
        return "All activity";
    }
  });

  readonly selectedFilterSummary = computed(() => {
    const category = this.selectedCategory();
    const status = this.selectedStatusLabel();
    const priority =
      this.priorityFilters.find((filter) => filter.id === this.selectedPriority())
        ?.label ?? "All priorities";

    if (category === "all") {
      return `${status} across all notification categories · ${priority}.`;
    }

    return `${status} for ${category.replace("_", " ")} notifications · ${priority}.`;
  });

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await this.notificationService.loadNotifications();
    } finally {
      this.isRefreshing.set(false);
    }
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  async clearRead(): Promise<void> {
    await this.notificationService.dismissAllRead();
  }

  resetFilters(): void {
    this.selectedCategory.set("all");
    this.selectedStatus.set("all");
    this.selectedPriority.set("all");
    this.searchQuery.set("");
  }

  async markAsRead(notification: Notification, event?: Event): Promise<void> {
    event?.stopPropagation();
    await this.notificationService.markAsRead(notification.id);
  }

  async dismiss(notification: Notification, event?: Event): Promise<void> {
    event?.stopPropagation();
    await this.notificationService.dismissNotification(notification.id);
  }

  async openNotification(notification: Notification, event?: Event): Promise<void> {
    event?.stopPropagation();

    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }

    if (!notification.action_url) {
      return;
    }

    if (/^https?:\/\//.test(notification.action_url)) {
      window.location.assign(notification.action_url);
      return;
    }

    await this.router.navigateByUrl(notification.action_url);
  }

  getCategoryCount(category: NotificationCategory | "all"): number {
    if (category === "all") {
      return this.notificationService.activeNotifications().length;
    }

    return this.notificationService
      .activeNotifications()
      .filter((notification) => notification.category === category).length;
  }

  getNotificationLabel(notification: Notification): string {
    return (notification.category ?? "general").replace("_", " ");
  }

  getNotificationIcon(notification: Notification): string {
    switch (notification.category) {
      case "team":
        return "pi-users";
      case "training":
        return "pi-bolt";
      case "wellness":
        return "pi-heart";
      case "coach":
        return "pi-comments";
      case "achievement":
        return "pi-trophy";
      case "system":
        return "pi-cog";
      default:
        return "pi-bell";
    }
  }

  getNotificationTone(
    notification: Notification,
  ): "default" | "success" | "warning" | "danger" | "brand" {
    switch (notification.severity) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      default:
        return notification.priority === "urgent" ? "danger" : "brand";
    }
  }

  formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  formatPriority(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  private getPriorityWeight(priority: string | null | undefined): number {
    switch (priority) {
      case "urgent":
        return 3;
      case "high":
        return 2;
      case "normal":
        return 1;
      default:
        return 0;
    }
  }
}
