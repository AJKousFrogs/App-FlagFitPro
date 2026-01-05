import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { BadgeModule } from "primeng/badge";
import { filter, Subscription } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { NotificationStateService } from "../../../core/services/notification-state.service";

interface NavItem {
  label: string;
  route: string;
  icon: string;
  ariaLabel: string;
  badge?: number;
  roles?: string[]; // Optional: restrict to specific roles
  group?: string; // Navigation group for organization
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, BadgeModule],
  template: `
    <div
      class="sidebar"
      [class.sidebar-open]="isOpen()"
      role="navigation"
      aria-label="Main navigation"
    >
      <!-- Close button for mobile -->
      <button
        class="sidebar-close-btn"
        (click)="closeSidebar()"
        aria-label="Close navigation"
      >
        <i class="pi pi-times"></i>
      </button>

      <a
        class="sidebar-logo"
        routerLink="/dashboard"
        title="FlagFit Pro - Go to Dashboard"
        aria-label="Go to dashboard"
      >
        <div class="logo-icon-wrapper">
          <i class="pi pi-flag-fill"></i>
        </div>
        <span class="logo-text">FlagFit Pro</span>
      </a>

      <!-- User Info Section -->
      <div class="user-section">
        <div class="user-avatar">
          {{ userInitials() }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ userName() }}</span>
          <span class="user-role">{{ userRoleLabel() }}</span>
        </div>
      </div>

      <nav class="nav-section" aria-label="Main navigation">
        @for (group of navGroups; track group.id) {
          @if (getGroupItems(group.id).length > 0) {
            <div
              class="nav-group"
              role="group"
              [attr.aria-label]="group.label + ' navigation'"
            >
              <div class="nav-group-header">
                <i [class]="'pi ' + group.icon" aria-hidden="true"></i>
                <span class="nav-group-label">{{ group.label }}</span>
              </div>
              @for (
                item of getGroupItems(group.id);
                track trackByRoute($index, item)
              ) {
                <a
                  [routerLink]="item.route"
                  [attr.data-testid]="getNavTestId(item.route)"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{
                    exact: item.route === '/dashboard',
                  }"
                  class="nav-item"
                  [attr.aria-label]="item.ariaLabel"
                  [id]="'nav-' + item.route.replace('/', '')"
                  (click)="onNavItemClick()"
                >
                  <span class="nav-item-icon">
                    <i [class]="'pi ' + item.icon"></i>
                    @if (item.badge && item.badge > 0) {
                      <p-badge
                        [value]="item.badge.toString()"
                        severity="danger"
                        class="nav-badge"
                      ></p-badge>
                    }
                  </span>
                  <span class="nav-item-label">{{ item.label }}</span>
                </a>
              }
            </div>
          }
        }
      </nav>

      <!-- Bottom Section -->
      <div class="sidebar-footer">
        <a
          routerLink="/profile"
          routerLinkActive="active"
          class="nav-item"
          aria-label="Profile"
          (click)="onNavItemClick()"
        >
          <span class="nav-item-icon">
            <i class="pi pi-user"></i>
          </span>
          <span class="nav-item-label">Profile</span>
        </a>
        <button class="nav-item logout-btn" (click)="logout()">
          <span class="nav-item-icon">
            <i class="pi pi-sign-out"></i>
          </span>
          <span class="nav-item-label">Logout</span>
        </button>
      </div>
    </div>
    <div
      class="sidebar-overlay"
      [class.active]="isOpen()"
      (click)="closeSidebar()"
      aria-hidden="true"
    ></div>
  `,
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationState = inject(NotificationStateService);
  private routerSub?: Subscription;

  isOpen = signal(false);

  /**
   * Navigation groups for better organization and cognitive load reduction
   */
  navGroups = [
    { id: "primary", label: "Daily", icon: "pi-home" },
    { id: "wellness", label: "Wellness", icon: "pi-heart" },
    { id: "competition", label: "Competition", icon: "pi-flag-fill" },
    { id: "team", label: "Team", icon: "pi-users" },
    { id: "resources", label: "Resources", icon: "pi-book" },
    { id: "community", label: "Community", icon: "pi-comments" },
  ];

  /**
   * Reorganized navigation for better UX flow with grouping:
   * - Primary: Most-used daily features
   * - Wellness: Health & recovery
   * - Competition: Game-related features
   * - Team: Team management
   * - Resources: Learning materials
   * - Community: Social features
   */
  private baseNavItems: NavItem[] = [
    // === PRIMARY (Daily Use) ===
    {
      label: "Dashboard",
      route: "/dashboard",
      icon: "pi-home",
      ariaLabel: "Dashboard Overview",
      group: "primary",
    },
    {
      label: "Training",
      route: "/training",
      icon: "pi-bolt",
      ariaLabel: "Training Schedule - View and manage your training calendar",
      group: "primary",
    },
    {
      label: "Today's Practice",
      route: "/todays-practice",
      icon: "pi-play",
      ariaLabel: "Today's Practice - Your training for today with videos",
      group: "primary",
    },
    {
      label: "Analytics",
      route: "/analytics",
      icon: "pi-chart-bar",
      ariaLabel: "Performance Analytics",
      group: "primary",
    },
    // === WELLNESS & RECOVERY ===
    {
      label: "Wellness",
      route: "/wellness",
      icon: "pi-heart",
      ariaLabel: "Wellness & Recovery",
      group: "wellness",
    },
    {
      label: "Travel Recovery",
      route: "/travel/recovery",
      icon: "pi-globe",
      ariaLabel: "Travel & Jet Lag Recovery",
      group: "wellness",
    },
    // === COMPETITION ===
    {
      label: "Game Day",
      route: "/game/readiness",
      icon: "pi-flag-fill",
      ariaLabel: "Game Day Readiness",
      group: "competition",
    },
    {
      label: "Tournament Fuel",
      route: "/game/nutrition",
      icon: "pi-apple",
      ariaLabel: "Tournament Nutrition",
      group: "competition",
    },
    {
      label: "Game Tracker",
      route: "/game-tracker",
      icon: "pi-video",
      ariaLabel: "Live Game Tracker",
      group: "competition",
    },
    {
      label: "Tournaments",
      route: "/tournaments",
      icon: "pi-trophy",
      ariaLabel: "Tournament Schedule",
      group: "competition",
    },
    // === TEAM ===
    {
      label: "Roster",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Team Roster",
      group: "team",
    },
    {
      label: "Depth Chart",
      route: "/depth-chart",
      icon: "pi-sitemap",
      ariaLabel: "Depth Chart",
      roles: ["coach", "assistant_coach", "admin"],
      group: "team",
    },
    // === RESOURCES ===
    {
      label: "Training Videos",
      route: "/training/videos",
      icon: "pi-youtube",
      ariaLabel: "Training Video Library",
      group: "resources",
    },
    {
      label: "Exercise Library",
      route: "/exercise-library",
      icon: "pi-book",
      ariaLabel: "Exercise Library",
      group: "resources",
    },
    // === COMMUNITY ===
    {
      label: "AI Coach",
      route: "/chat",
      icon: "pi-sparkles",
      ariaLabel: "AI Coach Merlin",
      group: "community",
    },
    {
      label: "Team Chat",
      route: "/team-chat",
      icon: "pi-comments",
      ariaLabel: "Team Chat Channels",
      group: "community",
    },
    {
      label: "Community",
      route: "/community",
      icon: "pi-users",
      ariaLabel: "Community Hub",
      group: "community",
    },
  ];

  visibleNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const unreadCount = this.notificationState.unreadCount();

    return this.baseNavItems
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => ({
        ...item,
        badge: item.route === "/chat" ? unreadCount : undefined,
      }));
  });

  userName = computed(() => {
    const user = this.authService.getUser();
    return user?.name || user?.email?.split("@")[0] || "User";
  });

  userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });

  userRoleLabel = computed(() => {
    const user = this.authService.getUser();
    const role = user?.role || "player";
    return role.replace(/_/g, " ");
  });

  ngOnInit(): void {
    // Close sidebar on navigation (mobile)
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.closeSidebar();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isOpen.update((val) => !val);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }

  onNavItemClick(): void {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
    this.closeSidebar();
  }

  trackByRoute(index: number, item: NavItem): string {
    return item.route;
  }

  /**
   * Get navigation items for a specific group
   */
  getGroupItems(groupId: string): NavItem[] {
    return this.visibleNavItems().filter((item) => item.group === groupId);
  }

  /**
   * Generate data-testid for navigation items
   */
  getNavTestId(route: string): string {
    const cleaned = route.replace(/^\//, "").replace(/\//g, "-");
    return `nav-${cleaned || "home"}`;
  }
}
