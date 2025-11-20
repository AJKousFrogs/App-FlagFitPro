import { Injectable, computed, signal, inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs/operators";
import { toSignal } from "@angular/core/rxjs-interop";

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

  // Track current route
  private currentRoute$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event) => (event as NavigationEnd).url),
  );

  currentRoute = toSignal(this.currentRoute$, { initialValue: this.router.url });

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

    // Always start with Dashboard
    items.push({
      label: "Dashboard",
      route: "/dashboard",
      icon: "pi-home",
    });

    // Build path segments
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
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
    return items.map((item, index) => {
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
    console.log("Export report action");
    // Implement export logic
  }

  private comparePeriods(): void {
    console.log("Compare periods action");
    // Implement comparison logic
  }

  private shareDashboard(): void {
    console.log("Share dashboard action");
    // Implement sharing logic
  }

  private importCSV(): void {
    console.log("Import CSV action");
    // Implement import logic
  }

  private exportRoster(): void {
    console.log("Export roster action");
    // Implement export logic
  }

  private setBenchmark(): void {
    console.log("Set benchmark action");
    // Implement benchmark logic
  }

  private setReminder(): void {
    console.log("Set reminder action");
    // Implement reminder logic
  }
}

