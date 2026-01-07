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

interface _CollapsibleGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  isExpanded: boolean;
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
        <!-- PRIMARY NAVIGATION (4-5 core items) -->
        <div class="primary-nav">
          @for (item of primaryNavItems(); track trackByRoute($index, item)) {
            <a
              [routerLink]="item.route"
              [attr.data-testid]="getNavTestId(item.route)"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{
                exact: item.route === '/dashboard' || item.route === '/todays-practice',
              }"
              class="nav-item"
              [class.nav-item-primary]="true"
              [attr.aria-label]="item.ariaLabel"
              [id]="'nav-' + item.route.replace('/', '')"
              (click)="onNavItemClick()"
            >
              <span class="nav-item-icon">
                <i [class]="'pi ' + item.icon"></i>
              </span>
              <span class="nav-item-label">{{ item.label }}</span>
            </a>
          }
        </div>

        <!-- ADDITIONAL NAVIGATION ITEMS -->
        @if (additionalItems().length > 0) {
          <div class="additional-nav">
            @for (item of additionalItems(); track trackByRoute($index, item)) {
              <a
                [routerLink]="item.route"
                [attr.data-testid]="getNavTestId(item.route)"
                routerLinkActive="active"
                class="nav-item"
                [attr.aria-label]="item.ariaLabel"
                [id]="'nav-' + item.route.replace('/', '')"
                (click)="onNavItemClick()"
              >
                <span class="nav-item-icon">
                  <i [class]="'pi ' + item.icon"></i>
                </span>
                <span class="nav-item-label">{{ item.label }}</span>
              </a>
            }
          </div>
        }

        <!-- COLLAPSIBLE "ME" GROUP -->
        <div class="me-group-container">
          <button
            class="me-group-header"
            (click)="toggleMeGroup()"
            [attr.aria-expanded]="meGroupExpanded()"
            aria-controls="me-group-items"
          >
            <span class="me-group-icon">
              <i [class]="meGroupExpanded() ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
            </span>
            <span class="me-group-label">Me</span>
          </button>

          @if (meGroupExpanded()) {
            <div id="me-group-items" class="me-group-items">
              @for (item of meItems(); track trackByRoute($index, item)) {
                <a
                  [routerLink]="item.route"
                  [attr.data-testid]="getNavTestId(item.route)"
                  routerLinkActive="active"
                  class="nav-item nav-item-sub"
                  [attr.aria-label]="item.ariaLabel"
                  [id]="'nav-' + item.route.replace('/', '')"
                  (click)="onNavItemClick()"
                >
                  <span class="nav-item-icon">
                    <i [class]="'pi ' + item.icon"></i>
                  </span>
                  <span class="nav-item-label">{{ item.label }}</span>
                </a>
              }
            </div>
          }
        </div>
      </nav>

      <!-- Bottom Section (Profile quick access + Logout) -->
      <div class="sidebar-footer">
        <a
          routerLink="/profile"
          routerLinkActive="active"
          class="nav-item"
          aria-label="Profile - Quick access"
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
  
  // State persistence for "Me" group expansion
  meGroupExpanded = signal(this.loadMeGroupState());

  /**
   * FULL NAVIGATION STRUCTURE
   * All navigation items restored for complete functionality
   */
  private athleteNavItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/dashboard",
      icon: "pi-home",
      ariaLabel: "Dashboard - Overview of your training and progress",
      group: "primary",
    },
    {
      label: "Today",
      route: "/todays-practice",
      icon: "pi-calendar",
      ariaLabel: "Today's Practice - Your training for today",
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
      label: "Wellness",
      route: "/wellness",
      icon: "pi-heart",
      ariaLabel: "Wellness & Recovery - Daily check-in and recovery metrics",
      group: "primary",
    },
    {
      label: "Analytics",
      route: "/analytics",
      icon: "pi-chart-line",
      ariaLabel: "Analytics - Performance metrics and insights",
      group: "primary",
    },
    {
      label: "Performance",
      route: "/performance-tracking",
      icon: "pi-bullseye",
      ariaLabel: "Performance Tracking - Track and analyze your performance metrics",
      group: "primary",
    },
    {
      label: "Team",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Team - Roster, games, and team calendar",
      group: "primary",
    },
    {
      label: "Team Chat",
      route: "/team-chat",
      icon: "pi-comments",
      ariaLabel: "Team Chat - Communicate with your team",
      group: "primary",
    },
    {
      label: "Tournaments",
      route: "/tournaments",
      icon: "pi-trophy",
      ariaLabel: "Tournaments - Games and competitions",
      group: "primary",
    },
    {
      label: "Tournament Fuel",
      route: "/game/nutrition",
      icon: "pi-apple",
      ariaLabel: "Tournament Fuel - Nutrition and hydration for tournament days",
      group: "primary",
    },
    {
      label: "Travel Recovery",
      route: "/travel/recovery",
      icon: "pi-map-marker",
      ariaLabel: "Travel Recovery - Recovery protocols for travel days",
      group: "primary",
    },
    {
      label: "Game Tracker",
      route: "/game-tracker",
      icon: "pi-flag",
      ariaLabel: "Game Tracker - Track live games and statistics",
      group: "primary",
    },
    {
      label: "Merlin AI",
      route: "/chat",
      icon: "pi-sparkles",
      ariaLabel: "Merlin AI Coach - Chat with your AI coach",
      group: "primary",
    },
    {
      label: "Community",
      route: "/community",
      icon: "pi-globe",
      ariaLabel: "Community - Connect with other players and share experiences",
      group: "primary",
    },
    {
      label: "Exercise Library",
      route: "/exercise-library",
      icon: "pi-book",
      ariaLabel: "Exercise Library - Browse exercise database",
      group: "primary",
    },
    {
      label: "Video Library",
      route: "/training/videos",
      icon: "pi-video",
      ariaLabel: "Video Library - Training videos and drills",
      group: "primary",
    },
    {
      label: "ACWR",
      route: "/acwr",
      icon: "pi-chart-bar",
      ariaLabel: "ACWR Dashboard - Acute Chronic Workload Ratio monitoring",
      group: "primary",
    },
  ];

  private coachNavItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/coach/dashboard",
      icon: "pi-home",
      ariaLabel: "Coach Dashboard - Team overview and insights",
      group: "primary",
    },
    {
      label: "Players",
      route: "/coach/team",
      icon: "pi-users",
      ariaLabel: "Players - Roster management and player monitoring",
      group: "primary",
    },
    {
      label: "Team Chat",
      route: "/team-chat",
      icon: "pi-comments",
      ariaLabel: "Team Chat - Communicate with your team",
      group: "primary",
    },
    {
      label: "Planning",
      route: "/coach/programs",
      icon: "pi-calendar",
      ariaLabel: "Planning - Programs, practice planner, and calendar",
      group: "primary",
    },
    {
      label: "Analytics",
      route: "/coach/analytics",
      icon: "pi-chart-line",
      ariaLabel: "Analytics - Team performance metrics and insights",
      group: "primary",
    },
    {
      label: "Performance",
      route: "/performance-tracking",
      icon: "pi-bullseye",
      ariaLabel: "Performance Tracking - Track and analyze team performance metrics",
      group: "primary",
    },
    {
      label: "Competition",
      route: "/tournaments",
      icon: "pi-trophy",
      ariaLabel: "Competition - Games and tournaments",
      group: "primary",
    },
    {
      label: "Travel Recovery",
      route: "/travel/recovery",
      icon: "pi-map-marker",
      ariaLabel: "Travel Recovery - Recovery protocols for travel days",
      group: "primary",
    },
    {
      label: "Game Tracker",
      route: "/game-tracker",
      icon: "pi-flag",
      ariaLabel: "Game Tracker - Track live games and statistics",
      group: "primary",
    },
    {
      label: "Merlin AI",
      route: "/chat",
      icon: "pi-sparkles",
      ariaLabel: "Merlin AI Coach - Chat with your AI coach",
      group: "primary",
    },
    {
      label: "Community",
      route: "/community",
      icon: "pi-globe",
      ariaLabel: "Community - Connect with players and share experiences",
      group: "primary",
    },
    {
      label: "Exercise Library",
      route: "/exercise-library",
      icon: "pi-book",
      ariaLabel: "Exercise Library - Browse exercise database",
      group: "primary",
    },
    {
      label: "Video Library",
      route: "/training/videos",
      icon: "pi-video",
      ariaLabel: "Video Library - Training videos and drills",
      group: "primary",
    },
    {
      label: "Knowledge Base",
      route: "/coach/knowledge",
      icon: "pi-bookmark",
      ariaLabel: "Knowledge Base - Training resources and guides",
      group: "primary",
    },
  ];

  /**
   * "Me" group items - collapsible accordion
   */
  private meGroupItems: NavItem[] = [
    {
      label: "Profile",
      route: "/profile",
      icon: "pi-user",
      ariaLabel: "Profile - View and edit your profile",
      group: "me",
    },
    {
      label: "Settings",
      route: "/settings",
      icon: "pi-cog",
      ariaLabel: "Settings - App preferences and account settings",
      group: "me",
    },
    {
      label: "Achievements",
      route: "/achievements",
      icon: "pi-trophy",
      ariaLabel: "Achievements - View your progress and badges",
      group: "me",
    },
  ];

  /**
   * Additional navigation items (shown after primary nav)
   * Currently empty - can be used for less frequently accessed items
   */
  private additionalNavItems: NavItem[] = [];

  /**
   * Primary navigation items based on user role
   */
  primaryNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const isCoach = ["coach", "assistant_coach", "admin"].includes(userRole);
    
    return isCoach ? this.coachNavItems : this.athleteNavItems;
  });

  /**
   * Additional navigation items filtered by role
   */
  additionalItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    return this.additionalNavItems.filter(
      (item) => !item.roles || item.roles.includes(userRole)
    );
  });

  /**
   * "Me" group items (always same for all roles)
   */
  meItems = computed(() => this.meGroupItems);

  /**
   * Navigation groups for organized display
   */
  navGroups = [
    { id: 'primary', label: 'Main', icon: 'pi-home' },
    { id: 'me', label: 'Me', icon: 'pi-user' }
  ];

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
    // Auto-close sidebar on navigation (mobile)
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
    // Auto-close sidebar on mobile after navigation
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
   * Toggle "Me" group expansion and persist state
   */
  toggleMeGroup(): void {
    this.meGroupExpanded.update((val) => {
      const newVal = !val;
      this.saveMeGroupState(newVal);
      return newVal;
    });
  }

  /**
   * Load "Me" group expanded state from localStorage
   */
  private loadMeGroupState(): boolean {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebar-me-group-expanded");
    return saved === "true";
  }

  /**
   * Save "Me" group expanded state to localStorage
   */
  private saveMeGroupState(isExpanded: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "sidebar-me-group-expanded",
      isExpanded.toString(),
    );
  }

  /**
   * Generate data-testid for navigation items
   */
  getNavTestId(route: string): string {
    const cleaned = route.replace(/^\//, "").replace(/\//g, "-");
    return `nav-${cleaned || "home"}`;
  }

  /**
   * Get navigation items for a specific group
   */
  getGroupItems(groupId: string): NavItem[] {
    if (groupId === 'primary') {
      return this.primaryNavItems();
    } else if (groupId === 'me') {
      return this.meItems();
    }
    return [];
  }
}
