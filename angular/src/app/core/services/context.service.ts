import { Injectable, inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { LoggerService } from "./logger.service";

export interface QuickAction {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: {
    text: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  };
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
  current?: boolean;
  badge?: {
    text: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  };
}

@Injectable({
  providedIn: "root",
})
export class ContextService {
  private router = inject(Router);
  private logger = inject(LoggerService);

  // Track current route
  private currentRoute$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event) => (event as NavigationEnd).url),
  );

  currentRoute = toSignal(this.currentRoute$, {
    initialValue: this.router.url,
  });

  // Route to page metadata mapping
  private routeMetadata: Record<
    string,
    {
      label: string;
      icon: string;
      parent?: string;
      quickActions: QuickAction[];
    }
  > = {
    "/dashboard": {
      label: "Dashboard",
      icon: "pi-th-large",
      quickActions: [
        {
          label: "Quick Training",
          icon: "pi-play",
          route: "/training",
        },
        {
          label: "View Analytics",
          icon: "pi-chart-bar",
          route: "/analytics",
        },
        {
          label: "Add Session",
          icon: "pi-plus",
          route: "/performance-tracking",
        },
        {
          label: "View Roster",
          icon: "pi-users",
          route: "/roster",
        },
      ],
    },
    "/training": {
      label: "Training",
      icon: "pi-bolt",
      parent: "/dashboard",
      quickActions: [
        {
          label: "New Workout",
          icon: "pi-plus-circle",
          route: "/workout",
        },
        {
          label: "Exercise Library",
          icon: "pi-book",
          route: "/exercise-library",
        },
        {
          label: "Schedule",
          icon: "pi-calendar",
          route: "/training",
        },
        {
          label: "Analytics",
          icon: "pi-chart-line",
          route: "/analytics",
        },
      ],
    },
    "/analytics": {
      label: "Analytics",
      icon: "pi-chart-bar",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Export Report",
          icon: "pi-download",
          action: () => this.exportReport(),
        },
        {
          label: "Set Goals",
          icon: "pi-flag",
          route: "/settings",
        },
        {
          label: "Compare Periods",
          icon: "pi-calendar-times",
          action: () => this.comparePeriods(),
        },
        {
          label: "Share Dashboard",
          icon: "pi-share-alt",
          action: () => this.shareDashboard(),
        },
      ],
    },
    "/performance/insights": {
      label: "Analytics",
      icon: "pi-chart-bar",
      parent: "/dashboard",
      quickActions: [
        {
          label: "View Performance Tests",
          icon: "pi-bullseye",
          route: "/performance/tests",
        },
        {
          label: "Set Goals",
          icon: "pi-flag",
          route: "/settings",
        },
        {
          label: "Compare Periods",
          icon: "pi-calendar-times",
          action: () => this.comparePeriods(),
        },
      ],
    },
    "/roster": {
      label: "Roster",
      icon: "pi-users",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Add Player",
          icon: "pi-user-plus",
          route: "/roster",
        },
        {
          label: "Import CSV",
          icon: "pi-file-import",
          action: () => this.importCSV(),
        },
        {
          label: "Team Stats",
          icon: "pi-chart-pie",
          route: "/analytics",
        },
        {
          label: "Export Roster",
          icon: "pi-file-export",
          action: () => this.exportRoster(),
        },
      ],
    },
    "/performance-tracking": {
      label: "Performance Tracking",
      icon: "pi-bullseye",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Log Session",
          icon: "pi-plus",
          route: "/performance-tracking",
        },
        {
          label: "View Trends",
          icon: "pi-chart-line",
          route: "/analytics",
        },
        {
          label: "Set Benchmark",
          icon: "pi-flag",
          action: () => this.setBenchmark(),
        },
        {
          label: "Compare Players",
          icon: "pi-users",
          route: "/roster",
        },
      ],
    },
    "/performance/tests": {
      label: "Performance Tests",
      icon: "pi-bullseye",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Log Session",
          icon: "pi-plus",
          route: "/performance/tests",
        },
        {
          label: "View Trends",
          icon: "pi-chart-line",
          route: "/performance/insights",
        },
        {
          label: "Compare Players",
          icon: "pi-users",
          route: "/roster",
        },
      ],
    },
    "/tournaments": {
      label: "Tournaments",
      icon: "pi-trophy",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Create Tournament",
          icon: "pi-plus",
          route: "/tournaments",
        },
        {
          label: "View Schedule",
          icon: "pi-calendar",
          route: "/tournaments",
        },
        {
          label: "Standings",
          icon: "pi-list",
          route: "/tournaments",
        },
        {
          label: "Past Results",
          icon: "pi-history",
          route: "/tournaments",
        },
      ],
    },
    "/wellness": {
      label: "Wellness",
      icon: "pi-heart",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Log Wellness",
          icon: "pi-plus",
          route: "/wellness",
        },
        {
          label: "View Trends",
          icon: "pi-chart-line",
          route: "/analytics",
        },
        {
          label: "Set Reminder",
          icon: "pi-bell",
          action: () => this.setReminder(),
        },
        {
          label: "Wellness Tips",
          icon: "pi-info-circle",
          route: "/wellness",
        },
      ],
    },
    "/settings": {
      label: "Settings",
      icon: "pi-cog",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Profile",
          icon: "pi-user",
          route: "/profile",
        },
        {
          label: "Notifications",
          icon: "pi-bell",
          route: "/settings",
        },
        {
          label: "Preferences",
          icon: "pi-sliders-h",
          route: "/settings",
        },
        {
          label: "Help",
          icon: "pi-question-circle",
          route: "/settings",
        },
      ],
    },
    "/profile": {
      label: "Profile",
      icon: "pi-user",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Edit Profile",
          icon: "pi-pencil",
          route: "/settings",
        },
        {
          label: "View Stats",
          icon: "pi-chart-line",
          route: "/analytics",
        },
        {
          label: "Achievements",
          icon: "pi-trophy",
          route: "/profile",
        },
      ],
    },
    "/game-tracker": {
      label: "Game Tracker",
      icon: "pi-flag",
      parent: "/dashboard",
      quickActions: [
        {
          label: "New Game",
          icon: "pi-plus",
          route: "/game-tracker",
        },
        {
          label: "View Schedule",
          icon: "pi-calendar",
          route: "/game-tracker",
        },
        {
          label: "Game Stats",
          icon: "pi-chart-bar",
          route: "/analytics",
        },
      ],
    },
    "/chat": {
      label: "Chat",
      icon: "pi-comments",
      parent: "/dashboard",
      quickActions: [
        {
          label: "New Message",
          icon: "pi-plus",
          route: "/chat",
        },
        {
          label: "Team Chat",
          icon: "pi-users",
          route: "/chat",
        },
      ],
    },
    "/community": {
      label: "Community",
      icon: "pi-globe",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Browse Posts",
          icon: "pi-list",
          route: "/community",
        },
        {
          label: "Create Post",
          icon: "pi-plus",
          route: "/community",
        },
        {
          label: "Events",
          icon: "pi-calendar",
          route: "/community",
        },
      ],
    },
    "/team/workspace": {
      label: "Team Workspace",
      icon: "pi-users",
      parent: "/dashboard",
      quickActions: [
        {
          label: "Open Roster",
          icon: "pi-users",
          route: "/roster",
        },
        {
          label: "Attendance",
          icon: "pi-check-square",
          route: "/attendance",
        },
        {
          label: "Team Settings",
          icon: "pi-cog",
          route: "/coach/team",
        },
      ],
    },
    "/onboarding": {
      label: "Setup",
      icon: "pi-user-plus",
      quickActions: [],
    },
    "/exercise-library": {
      label: "Exercise Library",
      icon: "pi-book",
      parent: "/training",
      quickActions: [
        {
          label: "Add Exercise",
          icon: "pi-plus",
          route: "/exercise-library",
        },
        {
          label: "Filter by Category",
          icon: "pi-filter",
          route: "/exercise-library",
        },
      ],
    },
  };

  /**
   * Get quick actions for the current page
   */
  getQuickActions(page: string): QuickAction[] {
    const metadata = this.routeMetadata[page];
    return metadata?.quickActions || [];
  }

  /**
   * Build breadcrumb items from route
   */
  buildBreadcrumbItems(route: string): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];
    const segments = route.split("/").filter((s) => s);

    // If we're on the dashboard, don't show breadcrumbs at all (just one item makes no sense)
    if (route === "/dashboard" || route === "/" || segments.length === 0) {
      return [];
    }

    // Always start with Dashboard as home
    items.push({
      label: "Dashboard",
      route: "/dashboard",
      icon: "pi-home",
    });

    // Build path segments (skip 'dashboard' if it's the first segment since we already added it)
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dashboard as we already added it
      if (currentPath === "/dashboard") {
        return;
      }

      const metadata = this.routeMetadata[currentPath];

      if (metadata) {
        items.push({
          label: metadata.label,
          route: currentPath,
          icon: metadata.icon,
          current: index === segments.length - 1,
        });
      } else {
        // Fallback for unknown routes
        items.push({
          label: this.formatLabel(segment),
          route: currentPath,
          current: index === segments.length - 1,
        });
      }
    });

    return items;
  }

  /**
   * Enhance breadcrumb items with context (badges, etc.)
   */
  enhanceWithContext(items: BreadcrumbItem[]): BreadcrumbItem[] {
    // Add badges or context information
    return items.map((item, _index) => {
      const enhanced = { ...item };

      // Add badge for current page
      if (item.current) {
        // Could add context-specific badges here
      }

      return enhanced;
    });
  }

  /**
   * Get current page identifier
   */
  getCurrentPage(): string {
    return this.currentRoute() || "/dashboard";
  }

  /**
   * Format route segment to label
   */
  private formatLabel(segment: string): string {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Action handlers
  private exportReport(): void {
    this.logger.debug("Export report action");
    // Implement export logic
  }

  private comparePeriods(): void {
    this.logger.debug("Compare periods action");
    // Implement comparison logic
  }

  private shareDashboard(): void {
    this.logger.debug("Share dashboard action");
    // Implement sharing logic
  }

  private importCSV(): void {
    this.logger.debug("Import CSV action");
    // Implement import logic
  }

  private exportRoster(): void {
    this.logger.debug("Export roster action");
    // Implement export logic
  }

  private setBenchmark(): void {
    this.logger.debug("Set benchmark action");
    // Implement benchmark logic
  }

  private setReminder(): void {
    this.logger.debug("Set reminder action");
    // Implement reminder logic
  }
}
