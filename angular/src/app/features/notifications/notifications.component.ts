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
  templateUrl: "./notifications.component.html",
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
