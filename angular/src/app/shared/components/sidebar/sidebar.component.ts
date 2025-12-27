import { Component, signal, ChangeDetectionStrategy, inject, computed, OnInit, OnDestroy } from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
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
      
      <div
        class="sidebar-logo"
        (click)="navigateToDashboard()"
        title="FlagFit Pro"
        aria-label="Go to dashboard"
      >
        <i class="pi pi-activity icon-logo"></i>
        <span class="logo-text">FlagFit Pro</span>
      </div>

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
        @for (item of visibleNavItems(); track trackByRoute($index, item)) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="nav-item"
            [attr.aria-label]="item.ariaLabel"
            [id]="'nav-' + item.route.replace('/', '')"
            (click)="onNavItemClick()"
          >
            <span class="nav-item-icon">
              <i [class]="'pi ' + item.icon"></i>
              @if (item.badge && item.badge > 0) {
                <p-badge [value]="item.badge.toString()" severity="danger" class="nav-badge"></p-badge>
              }
            </span>
            <span class="nav-item-label">{{ item.label }}</span>
          </a>
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
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: 250px;
        background: var(--surface-primary);
        border-right: 1px solid var(--p-surface-200);
        z-index: 1000;
        transition: transform 0.3s ease;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .sidebar-close-btn {
        display: none;
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        width: 36px;
        height: 36px;
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

      .sidebar-logo {
        padding: var(--space-5);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        cursor: pointer;
        color: var(--color-brand-primary);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .icon-logo {
        font-size: 1.75rem;
      }

      .logo-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
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
        padding: var(--space-4);
        flex: 1;
        overflow-y: auto;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-2);
        border-radius: var(--p-border-radius);
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.2s;
        border: none;
        background: transparent;
        width: 100%;
        cursor: pointer;
        font-size: 0.9375rem;
        font-family: inherit;
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
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }

      @media (max-width: 1024px) and (min-width: 769px) {
        .sidebar {
          width: 72px;
        }

        .logo-text,
        .nav-item-label,
        .user-info,
        .sidebar-footer .nav-item-label {
          display: none;
        }

        .sidebar-logo {
          justify-content: center;
          padding: var(--space-4);
        }

        .user-section {
          justify-content: center;
          padding: var(--space-3);
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

  private baseNavItems: NavItem[] = [
    {
      label: "Overview",
      route: "/dashboard",
      icon: "pi-th-large",
      ariaLabel: "Dashboard Overview",
    },
    {
      label: "Training",
      route: "/training",
      icon: "pi-bolt",
      ariaLabel: "Training",
    },
    {
      label: "Analytics",
      route: "/analytics",
      icon: "pi-chart-bar",
      ariaLabel: "Analytics",
    },
    {
      label: "Game Tracker",
      route: "/game-tracker",
      icon: "pi-flag",
      ariaLabel: "Game Tracker",
    },
    {
      label: "Wellness",
      route: "/wellness",
      icon: "pi-heart",
      ariaLabel: "Wellness",
    },
    {
      label: "Roster",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Roster",
    },
    {
      label: "Depth Chart",
      route: "/depth-chart",
      icon: "pi-sitemap",
      ariaLabel: "Depth Chart",
      roles: ["coach", "assistant_coach", "admin"],
    },
    {
      label: "Tournaments",
      route: "/tournaments",
      icon: "pi-trophy",
      ariaLabel: "Tournaments",
    },
    {
      label: "Community",
      route: "/community",
      icon: "pi-globe",
      ariaLabel: "Community",
    },
    {
      label: "Chat",
      route: "/chat",
      icon: "pi-comments",
      ariaLabel: "Chat",
    },
    {
      label: "Settings",
      route: "/settings",
      icon: "pi-cog",
      ariaLabel: "Settings",
    },
  ];

  visibleNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const unreadCount = this.notificationState.unreadCount();
    
    return this.baseNavItems
      .filter(item => !item.roles || item.roles.includes(userRole))
      .map(item => ({
        ...item,
        badge: item.route === "/chat" ? unreadCount : undefined
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
      .map(n => n[0])
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
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.closeSidebar();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.closeSidebar();
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
    this.router.navigate(['/login']);
    this.closeSidebar();
  }

  trackByRoute(index: number, item: NavItem): string {
    return item.route;
  }
}
