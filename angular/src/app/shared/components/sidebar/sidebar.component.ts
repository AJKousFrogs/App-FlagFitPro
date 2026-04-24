import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import {
  AppNavigationItem,
  getMeNavigationItems,
  getNavGroupsForRole,
  isExactNavigationRoute,
} from "../../../core/navigation/app-navigation.config";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ShellBodyStateService } from "../../../core/services/shell-body-state.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { BackdropComponent } from "../backdrop/backdrop.component";
import { CloseButtonComponent } from "../close-button/close-button.component";
import { NavItemComponent } from "../nav-item.component";

@Component({
  selector: "app-sidebar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    NavItemComponent,
    CloseButtonComponent,
    BackdropComponent,
  ],
  template: `
    <div
      class="sidebar"
      [class.sidebar-open]="isOpen()"
      [class.sidebar-collapsed]="isCollapsed()"
      role="navigation"
      aria-label="Main navigation"
    >
      <!-- Close button for mobile -->
      <app-close-button
        class="sidebar-close-btn"
        ariaLabel="Close navigation"
        size="lg"
        (clicked)="closeSidebar()"
      />

      <a
        class="sidebar-logo"
        [routerLink]="homeRoute()"
        title="FlagFit Pro - Go to Home"
        aria-label="Go to home"
      >
        <div class="logo-icon-wrapper">
          <i class="pi pi-flag-fill"></i>
        </div>
        <span class="logo-text">FlagFit Pro</span>
      </a>

      <nav class="nav-section" aria-label="Main navigation">
        @for (group of navGroupsForRole(); track group.id) {
          <div class="nav-group">
            @if (!isCollapsed()) {
              <div class="nav-group-title">{{ group.label }}</div>
            }
            <div class="nav-group-items">
              @for (item of group.items; track trackByRoute($index, item)) {
                <app-nav-item
                  [route]="item.route"
                  [label]="item.label"
                  [icon]="item.icon"
                  [ariaLabel]="item.ariaLabel"
                  [testId]="getNavTestId(item.route)"
                  [itemId]="'nav-' + item.route.replace('/', '')"
                  [exact]="isExactRoute(item.route)"
                  variant="sidebar"
                  [itemClass]="navItemClass()"
                  [tooltipDisabled]="!isCollapsed()"
                  tooltipPosition="right"
                  (clicked)="onNavItemClick()"
                />
              }
            </div>
          </div>
        }

        <!-- Me group — simple, always visible -->
        <div class="nav-group me-group-container">
          @if (!isCollapsed()) {
            <div class="nav-group-title">Me</div>
          }
          <div class="nav-group-items">
            @for (item of meItems(); track trackByRoute($index, item)) {
              <app-nav-item
                [route]="item.route"
                [label]="item.label"
                [icon]="item.icon"
                [ariaLabel]="item.ariaLabel"
                [testId]="getNavTestId(item.route)"
                [itemId]="'nav-' + item.route.replace('/', '')"
                variant="sidebar"
                [itemClass]="isCollapsed() ? navItemClass() : navItemClass('nav-item-sub')"
                [tooltipDisabled]="!isCollapsed()"
                tooltipPosition="right"
                (clicked)="onNavItemClick()"
              />
            }
          </div>
        </div>
      </nav>

      <!-- User card + logout -->
      <div class="sidebar-footer">
        <div
          class="user-card"
          [class.user-card--collapsed]="isCollapsed()"
          [attr.title]="isCollapsed() ? userName() + ' · ' + userRoleLabel() : null"
        >
          <div class="user-avatar">{{ userInitials() }}</div>
          @if (!isCollapsed()) {
            <div class="user-info">
              <span class="user-name">{{ userName() }}</span>
              <span class="user-role">{{ userRoleLabel() }}</span>
            </div>
            <button
              class="user-settings-btn"
              type="button"
              (click)="navigateToSettings()"
              aria-label="Settings"
            >
              <i class="pi pi-cog" aria-hidden="true"></i>
            </button>
          }
        </div>
        <app-nav-item
          label="Logout"
          icon="pi-sign-out"
          ariaLabel="Log out"
          variant="sidebar"
          [itemClass]="navItemClass('logout-btn')"
          [tooltipDisabled]="!isCollapsed()"
          tooltipPosition="right"
          (clicked)="logout()"
        />
      </div>
    </div>
    <app-backdrop
      [visible]="isOpen()"
      [blur]="true"
      [dismissible]="true"
      [styleClass]="'sidebar-backdrop'"
      (backdropClick)="closeSidebar()"
    />
  `,
  styleUrl: "./sidebar.component.scss",
  host: {
    "(document:keydown.escape)": "onEscapePress()",
  },
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly shellBodyState = inject(ShellBodyStateService);
  private readonly homeRouteService = inject(HomeRouteService);
  private readonly platform = inject(PlatformService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private releaseSidebarBodyLock: (() => void) | null = null;

  readonly collapsed = input(false);
  readonly mobileViewport = input(false);
  isOpen = signal(false);
  readonly isCollapsed = computed(
    () => this.collapsed() && !this.mobileViewport(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.releaseMobileBodyLock());
    // Effect to manage body scroll lock when sidebar is open on mobile
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const shouldLockBody = this.mobileViewport() && this.isOpen();

        if (shouldLockBody) {
          this.ensureMobileBodyLock();
        } else {
          this.releaseMobileBodyLock();
        }
      });
    }
  }

  /**
   * Close sidebar on Escape key press
   */
  onEscapePress(): void {
    if (this.isOpen()) {
      this.closeSidebar();
    }
  }

  // State persistence for "Me" group expansion
  meGroupExpanded = signal(this.loadMeGroupState());

  private readonly currentUser = computed(() => this.supabase.currentUser());

  private readonly currentUserRole = computed(() => {
    const metadata = this.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role || "player";
  });

  /**
   * Ordered nav groups for the sidebar — 4 semantic groups for athletes, 2 for coaches.
   */
  navGroupsForRole = computed(() => {
    return getNavGroupsForRole(this.currentUserRole());
  });

  /**
   * "Me" group items (always same for all roles)
   */
  meItems = computed(() => {
    const userRole = this.currentUserRole();
    return getMeNavigationItems(userRole);
  });

  homeRoute = computed(() => this.homeRouteService.getHomeRoute());

  userName = computed(() => {
    const user = this.currentUser();
    const metadata = user?.user_metadata as
      | { fullName?: string; firstName?: string; lastName?: string }
      | undefined;
    const fullName =
      metadata?.fullName ||
      [metadata?.firstName, metadata?.lastName].filter(Boolean).join(" ");
    return fullName || user?.email?.split("@")[0] || "User";
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
    const role = this.currentUserRole();
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
        if (this.mobileViewport()) {
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
    if (this.mobileViewport()) {
      this.closeSidebar();
    }
  }

  navigateToSettings(): void {
    void this.router.navigate(["/settings"]);
    this.onNavItemClick();
  }

  async logout(): Promise<void> {
    const confirmed = await this.confirmDialog.confirmLogout();
    if (!confirmed) return;

    await this.supabase.signOut();
    await this.router.navigate(["/login"]);
    this.closeSidebar();
  }

  trackByRoute(index: number, item: AppNavigationItem): string {
    return item.route;
  }

  isExactRoute(route: string): boolean {
    return isExactNavigationRoute(route);
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
    const saved = this.platform.getLocalStorage("sidebar-me-group-expanded");
    return saved === "true";
  }

  /**
   * Save "Me" group expanded state to localStorage
   */
  private saveMeGroupState(isExpanded: boolean): void {
    if (typeof window === "undefined") return;
    this.platform.setLocalStorage(
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
  getGroupItems(groupId: string): AppNavigationItem[] {
    const group = this.navGroupsForRole().find((g) => g.id === groupId);
    return group?.items ?? [];
  }

  navItemClass(...classes: string[]): string {
    const resolved = classes.filter(Boolean);
    if (this.isCollapsed()) {
      resolved.push("nav-item--collapsed");
    }
    return resolved.join(" ");
  }

  private ensureMobileBodyLock(): void {
    this.releaseSidebarBodyLock ??= this.shellBodyState.acquireSidebarLock();
  }

  private releaseMobileBodyLock(): void {
    this.releaseSidebarBodyLock?.();
    this.releaseSidebarBodyLock = null;
  }
}
