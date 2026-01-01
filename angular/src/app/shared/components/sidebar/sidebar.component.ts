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
  styles: [
    `
      :host {
        display: block;
      }

      /* Reset any potential styling bleeding through */
      :host::before,
      :host::after {
        display: none !important;
        content: none !important;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: 250px;
        background: var(--surface-primary, #ffffff);
        border-right: 1px solid var(--color-border-primary, #e0e0e0);
        z-index: 1000;
        transition: transform 0.3s ease;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .sidebar::before,
      .sidebar::after {
        display: none !important;
        content: none !important;
      }

      .sidebar-close-btn {
        display: none;
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        width: 44px;
        height: 44px;
        border: none;
        background: var(--p-surface-100);
        border-radius: 50%;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.2s;
        z-index: 10;
      }

      .sidebar-close-btn:hover {
        background: var(--p-surface-200);
        color: var(--text-primary);
      }

      .sidebar-close-btn:focus-visible {
        outline: 2px solid var(--color-brand-primary);
        outline-offset: 2px;
      }

      .sidebar-close-btn:focus:not(:focus-visible) {
        outline: none;
      }

      .sidebar-logo {
        padding: var(--space-4) var(--space-5);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        cursor: pointer;
        background: var(--surface-primary, #ffffff);
        border-bottom: 1px solid var(--color-border-primary, #e0e0e0);
        transition: all 0.2s ease;
        min-height: 64px;
        text-decoration: none;
      }

      .sidebar-logo:hover {
        background: var(--surface-secondary, #f8f8f8);
      }

      .sidebar-logo:hover .logo-icon-wrapper {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .logo-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(8, 153, 73, 0.2);
        flex-shrink: 0;
      }

      .logo-icon-wrapper i {
        font-size: 1.25rem;
        color: #ffffff;
      }

      .logo-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary, #1a1a1a);
        letter-spacing: -0.01em;
      }

      .user-section {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        border-bottom: 1px solid var(--p-surface-200);
        background: var(--p-surface-50);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-brand-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .user-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: capitalize;
      }

      .nav-section {
        padding: var(--space-2);
        flex: 1;
        overflow-y: auto;
      }

      .nav-group {
        margin-bottom: var(--space-2);
      }

      .nav-group-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
        margin-top: var(--space-2);
      }

      .nav-group-header i {
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .nav-group:first-child .nav-group-header {
        margin-top: 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-1);
        border-radius: var(--p-border-radius);
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.2s;
        border: none;
        background: transparent;
        width: 100%;
        cursor: pointer;
        font-size: 0.875rem;
        font-family: inherit;
        min-height: 44px; /* WCAG touch target minimum */
      }

      .nav-item:focus-visible {
        outline: 2px solid var(--color-brand-primary);
        outline-offset: 2px;
      }

      .nav-item:focus:not(:focus-visible) {
        outline: none;
      }

      .nav-item:hover {
        background: var(--p-surface-50);
        color: var(--color-brand-primary);
      }

      .nav-item.active {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        font-weight: 600;
      }

      .nav-item-icon {
        display: flex;
        align-items: center;
        position: relative;
        width: 24px;
        justify-content: center;
      }

      .nav-item-icon i {
        font-size: 1.125rem;
      }

      .nav-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        transform: scale(0.75);
      }

      .sidebar-footer {
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
        margin-top: auto;
      }

      .logout-btn {
        color: var(--color-status-error);
      }

      .logout-btn:hover {
        background: var(--color-status-error-bg);
        color: var(--color-status-error);
      }

      .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        -webkit-backdrop-filter: blur(2px);
        backdrop-filter: blur(2px);
      }

      @media (max-width: 768px) {
        .sidebar {
          transform: translateX(-100%);
          width: 280px;
        }

        .sidebar.sidebar-open {
          transform: translateX(0);
        }

        .sidebar-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-overlay.active {
          display: block;
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
      }

      @media (max-width: 1024px) and (min-width: 769px) {
        .sidebar {
          width: 72px;
        }

        .logo-text,
        .nav-item-label,
        .user-info,
        .nav-group-label,
        .sidebar-footer .nav-item-label {
          display: none;
        }

        .sidebar-logo {
          justify-content: center;
          padding: var(--space-3);
        }

        .logo-icon-wrapper {
          width: 36px;
          height: 36px;
        }

        .user-section {
          justify-content: center;
          padding: var(--space-3);
        }

        .nav-group-header {
          justify-content: center;
          padding: var(--space-2);
        }

        .nav-item {
          justify-content: center;
          padding: var(--space-3);
        }

        .nav-item-icon {
          width: auto;
        }
      }
    `,
  ],
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
      ariaLabel: "Training Hub",
      group: "primary",
    },
    {
      label: "Today's Practice",
      route: "/training/daily",
      icon: "pi-play",
      ariaLabel: "Today's Practice",
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
}
