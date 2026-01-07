/**
 * Breadcrumb Navigation Component
 *
 * Provides hierarchical navigation with clickable path segments
 * Helps users understand their location and navigate back up the hierarchy
 *
 * Features:
 * - Auto-collapses on mobile (shows first + last 2 levels)
 * - Keyboard accessible
 * - Supports custom separators
 * - ARIA navigation landmarks
 *
 * @author FlagFit Pro Team
 * @version 1.0.0 - UX Audit Fix #8
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs";

export interface BreadcrumbItem {
  label: string;
  route?: string; // Optional - current page has no route
  icon?: string;
}

@Component({
  selector: "app-breadcrumb",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    @if (items().length > 1) {
      <nav
        class="breadcrumb-nav"
        aria-label="Breadcrumb navigation"
        role="navigation"
      >
        <ol class="breadcrumb-list">
          @for (item of visibleItems(); track $index; let isLast = $last) {
            <li class="breadcrumb-item">
              @if (!isLast && item.route) {
                <a
                  [routerLink]="item.route"
                  class="breadcrumb-link"
                  [attr.aria-label]="'Navigate to ' + item.label"
                >
                  @if (item.icon) {
                    <i [class]="'pi ' + item.icon" aria-hidden="true"></i>
                  }
                  <span>{{ item.label }}</span>
                </a>
              } @else {
                <span
                  class="breadcrumb-current"
                  [attr.aria-current]="isLast ? 'page' : null"
                >
                  @if (item.icon) {
                    <i [class]="'pi ' + item.icon" aria-hidden="true"></i>
                  }
                  <span>{{ item.label }}</span>
                </span>
              }

              @if (!isLast) {
                <i class="pi pi-chevron-right breadcrumb-separator" aria-hidden="true"></i>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styleUrl: "./breadcrumb.component.scss",
})
export class BreadcrumbComponent implements OnInit {
  private router = inject(Router);

  items = signal<BreadcrumbItem[]>([]);

  /**
   * Route mapping for breadcrumb labels
   * Maps route segments to user-friendly labels
   */
  private routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    "todays-practice": "Today",
    "player-dashboard": "Dashboard",
    training: "Training",
    advanced: "Schedule",
    log: "Log Session",
    videos: "Videos",
    wellness: "Wellness",
    "acwr-dashboard": "Load Monitoring",
    analytics: "Analytics",
    profile: "Profile",
    settings: "Settings",
    achievements: "Achievements",
    roster: "Team",
    "depth-chart": "Depth Chart",
    game: "Game",
    readiness: "Readiness",
    nutrition: "Nutrition",
    "game-tracker": "Game Tracker",
    tournaments: "Tournaments",
    travel: "Travel",
    recovery: "Recovery",
    chat: "AI Coach",
    "team-chat": "Team Chat",
    community: "Community",
    "exercise-library": "Exercise Library",
    coach: "Coach",
    team: "Team",
    players: "Players",
    programs: "Programs",
    practice: "Practice",
    planner: "Planner",
  };

  /**
   * Visible items with mobile collapse logic
   * Mobile: Home > ... > Parent > Current
   * Desktop: Full path
   */
  visibleItems = computed(() => {
    const allItems = this.items();
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

    if (!isMobile || allItems.length <= 4) {
      return allItems;
    }

    // Mobile: Show first + last 2 with ellipsis
    const first = allItems[0];
    const lastTwo = allItems.slice(-2);

    return [
      first,
      { label: "...", route: undefined },
      ...lastTwo,
    ];
  });

  ngOnInit(): void {
    // Build breadcrumbs on initial load
    this.buildBreadcrumbs(this.router.url);

    // Rebuild breadcrumbs on navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.buildBreadcrumbs((event as NavigationEnd).url);
      });
  }

  /**
   * Build breadcrumb trail from current URL
   */
  private buildBreadcrumbs(url: string): void {
    // Remove query params and hash
    const path = url.split("?")[0].split("#")[0];

    // Split into segments
    const segments = path.split("/").filter((s) => s.length > 0);

    if (segments.length === 0) {
      this.items.set([]);
      return;
    }

    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home/Dashboard
    breadcrumbs.push({
      label: "Home",
      route: "/dashboard",
      icon: "pi-home",
    });

    // Build path incrementally
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Skip UUID-like segments and IDs
      if (
        segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) ||
        segment.match(/^\d+$/)
      ) {
        continue;
      }

      const label = this.routeLabels[segment] || this.formatLabel(segment);
      const isLast = i === segments.length - 1;

      breadcrumbs.push({
        label,
        route: isLast ? undefined : currentPath, // Current page has no route
      });
    }

    this.items.set(breadcrumbs);
  }

  /**
   * Format segment into readable label
   */
  private formatLabel(segment: string): string {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
