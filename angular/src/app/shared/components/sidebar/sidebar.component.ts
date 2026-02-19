import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import { AuthService } from "../../../core/services/auth.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { NavItemComponent } from "../nav-item.component";

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
  imports: [RouterModule, NavItemComponent],
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
        type="button"
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
        <div class="nav-group">
          <div class="nav-group-title">{{ navGroups[0].label }}</div>
          <div class="nav-group-items">
            @for (item of primaryNavItems(); track trackByRoute($index, item)) {
              <app-nav-item
                [route]="item.route"
                [label]="item.label"
                [icon]="item.icon"
                [ariaLabel]="item.ariaLabel"
                [testId]="getNavTestId(item.route)"
                [itemId]="'nav-' + item.route.replace('/', '')"
                [exact]="
                  item.route === '/dashboard' ||
                  item.route === '/todays-practice'
                "
                variant="sidebar"
                [itemClass]="'nav-item-primary'"
                (clicked)="onNavItemClick()"
              />
            }
          </div>
        </div>

        @if (additionalItems().length > 0) {
          <div class="nav-group">
            <div class="nav-group-title">More</div>
            <div class="nav-group-items">
              @for (
                item of additionalItems();
                track trackByRoute($index, item)
              ) {
                <app-nav-item
                  [route]="item.route"
                  [label]="item.label"
                  [icon]="item.icon"
                  [ariaLabel]="item.ariaLabel"
                  [testId]="getNavTestId(item.route)"
                  [itemId]="'nav-' + item.route.replace('/', '')"
                  variant="sidebar"
                  (clicked)="onNavItemClick()"
                />
              }
            </div>
          </div>
        }

        <!-- COLLAPSIBLE "ME" GROUP -->
        <div class="me-group-container">
          <button
            class="me-group-header"
            (click)="toggleMeGroup()"
            [attr.aria-expanded]="meGroupExpanded()"
            aria-controls="me-group-items"
            type="button"
          >
            <span class="me-group-icon">
              <i
                [class]="
                  meGroupExpanded()
                    ? 'pi pi-chevron-down'
                    : 'pi pi-chevron-right'
                "
              ></i>
            </span>
            <span class="me-group-label">Me</span>
          </button>

          @if (meGroupExpanded()) {
            <div id="me-group-items" class="me-group-items">
              @for (item of meItems(); track trackByRoute($index, item)) {
                <app-nav-item
                  [route]="item.route"
                  [label]="item.label"
                  [icon]="item.icon"
                  [ariaLabel]="item.ariaLabel"
                  [testId]="getNavTestId(item.route)"
                  [itemId]="'nav-' + item.route.replace('/', '')"
                  variant="sidebar"
                  [itemClass]="'nav-item-sub'"
                  (clicked)="onNavItemClick()"
                />
              }
            </div>
          }
        </div>
      </nav>

      <!-- Bottom Section (Profile quick access + Logout) -->
      <div class="sidebar-footer">
        <app-nav-item
          route="/profile"
          label="Profile"
          icon="pi-user"
          ariaLabel="Profile - Quick access"
          variant="sidebar"
          (clicked)="onNavItemClick()"
        />
        <app-nav-item
          label="Logout"
          icon="pi-sign-out"
          ariaLabel="Log out"
          variant="sidebar"
          [itemClass]="'logout-btn'"
          (clicked)="logout()"
        />
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
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  isOpen = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.renderer.removeClass(document.body, "sidebar-open");
      }
    });
    // Effect to manage body scroll lock when sidebar is open on mobile
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const isOpen = this.isOpen();
        if (window.innerWidth <= 768) {
          if (isOpen) {
            this.renderer.addClass(document.body, "sidebar-open");
          } else {
            this.renderer.removeClass(document.body, "sidebar-open");
          }
        }
      });
    }
  }

  /**
   * Close sidebar on Escape key press
   */
  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    if (this.isOpen()) {
      this.closeSidebar();
    }
  }

  // State persistence for "Me" group expansion
  meGroupExpanded = signal(this.loadMeGroupState());

  /**
   * FULL NAVIGATION STRUCTURE
   * All navigation items restored for complete functionality
   */
  private athleteNavItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/player-dashboard",
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
      ariaLabel:
        "Performance Tracking - Track and analyze your performance metrics",
      group: "primary",
    },
    {
      label: "Roster",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Roster - Teammates, roles, and availability",
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
      label: "Game Nutrition",
      route: "/game/nutrition",
      icon: "pi-apple",
      ariaLabel:
        "Game Nutrition - Nutrition and hydration for tournament days",
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
      ariaLabel: "Merlin AI - Chat with your Merlin AI",
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
      label: "Roster",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Roster - Player management and monitoring",
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
      ariaLabel:
        "Performance Tracking - Track and analyze team performance metrics",
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
      ariaLabel: "Merlin AI - Chat with your Merlin AI",
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
      label: "Help",
      route: "/help",
      icon: "pi-question-circle",
      ariaLabel: "Help Center - Get support and guidance",
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
   */
  private additionalNavItems: NavItem[] = [
    {
      label: "Staff Hub",
      route: "/staff",
      icon: "pi-building",
      ariaLabel: "Staff Hub - Access nutritionist, physio, and psychology dashboards",
      roles: [
        "physiotherapist",
        "nutritionist",
        "psychologist",
        "strength_conditioning_coach",
      ],
      group: "secondary",
    },
    {
      label: "Team Hub",
      route: "/team/workspace",
      icon: "pi-briefcase",
      ariaLabel: "Team Hub - Collaborative team workspace",
      roles: ["coach", "assistant_coach", "admin"],
      group: "secondary",
    },
    {
      label: "Team Management",
      route: "/coach/team",
      icon: "pi-sitemap",
      ariaLabel: "Team Management - Manage team settings and roster",
      roles: ["coach", "assistant_coach", "admin"],
      group: "secondary",
    },
    {
      label: "Exercise DB",
      route: "/exercisedb",
      icon: "pi-database",
      ariaLabel: "Exercise DB - Manage exercise database (coach)",
      roles: ["coach", "assistant_coach", "admin"],
      group: "secondary",
    },
  ];

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
      (item) => !item.roles || item.roles.includes(userRole),
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
    { id: "primary", label: "Main", icon: "pi-home" },
    { id: "me", label: "Me", icon: "pi-user" },
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
      .slice(0, UI_LIMITS.SIDEBAR_SHORTCUTS_COUNT);
  });

  userRoleLabel = computed(() => {
    const user = this.authService.getUser();
    const role = user?.role || "player";
    return role.replace(/_/g, " ");
  });

  ngOnInit(): void {
    // Auto-close sidebar on navigation (mobile)
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.closeSidebar();
        }
      });
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

  async logout(): Promise<void> {
    const confirmed = await this.confirmDialog.confirmLogout();
    if (!confirmed) return;
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
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
    localStorage.setItem("sidebar-me-group-expanded", isExpanded.toString());
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
    if (groupId === "primary") {
      return this.primaryNavItems();
    } else if (groupId === "me") {
      return this.meItems();
    }
    return [];
  }
}
