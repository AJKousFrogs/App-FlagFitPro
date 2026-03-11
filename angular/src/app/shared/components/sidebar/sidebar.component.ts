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
  Renderer2,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import {
  AppNavigationItem,
  getMeNavigationItems,
  getPrimaryNavigationItems,
  getSecondaryNavigationItems,
  isExactNavigationRoute,
} from "../../../core/navigation/app-navigation.config";
import { AuthService } from "../../../core/services/auth.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
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
      <div
        class="user-section"
        [attr.title]="isCollapsed() ? userName() + ' - ' + userRoleLabel() : null"
      >
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
                [exact]="isExactRoute(item.route)"
                variant="sidebar"
                [itemClass]="navItemClass('nav-item-primary')"
                [tooltipDisabled]="!isCollapsed()"
                tooltipPosition="right"
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
                  [itemClass]="navItemClass()"
                  [tooltipDisabled]="!isCollapsed()"
                  tooltipPosition="right"
                  (clicked)="onNavItemClick()"
                />
              }
            </div>
          </div>
        }

        @if (isCollapsed()) {
          <div class="nav-group me-group-container me-group-container--collapsed">
            @for (item of meItems(); track trackByRoute($index, item)) {
              <app-nav-item
                [route]="item.route"
                [label]="item.label"
                [icon]="item.icon"
                [ariaLabel]="item.ariaLabel"
                [testId]="getNavTestId(item.route)"
                [itemId]="'nav-' + item.route.replace('/', '')"
                variant="sidebar"
                [itemClass]="navItemClass()"
                [tooltipDisabled]="!isCollapsed()"
                tooltipPosition="right"
                (clicked)="onNavItemClick()"
              />
            }
          </div>
        } @else {
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
                    [itemClass]="navItemClass('nav-item-sub')"
                    [tooltipDisabled]="!isCollapsed()"
                    tooltipPosition="right"
                    (clicked)="onNavItemClick()"
                  />
                }
              </div>
            }
          </div>
        }
      </nav>

      <!-- Bottom Section (Profile quick access + Logout) -->
      <div class="sidebar-footer">
        @if (!isCollapsed()) {
          <app-nav-item
            route="/profile"
            label="Profile"
            icon="pi-user"
            ariaLabel="Profile - Quick access"
            variant="sidebar"
            [itemClass]="navItemClass()"
            [tooltipDisabled]="!isCollapsed()"
            tooltipPosition="right"
            (clicked)="onNavItemClick()"
          />
        }
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
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly collapsed = input(false);
  readonly mobileViewport = input(false);
  isOpen = signal(false);
  readonly isCollapsed = computed(
    () => this.collapsed() && !this.mobileViewport(),
  );

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
        if (this.mobileViewport()) {
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
  onEscapePress(): void {
    if (this.isOpen()) {
      this.closeSidebar();
    }
  }

  // State persistence for "Me" group expansion
  meGroupExpanded = signal(this.loadMeGroupState());

  /**
   * Primary navigation items based on user role
   */
  primaryNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    return getPrimaryNavigationItems(userRole);
  });

  /**
   * Additional navigation items filtered by role
   */
  additionalItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    return getSecondaryNavigationItems(userRole);
  });

  /**
   * "Me" group items (always same for all roles)
   */
  meItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    return getMeNavigationItems(userRole);
  });

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

  async logout(): Promise<void> {
    const confirmed = await this.confirmDialog.confirmLogout();
    if (!confirmed) return;
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
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
  getGroupItems(groupId: string): AppNavigationItem[] {
    if (groupId === "primary") {
      return this.primaryNavItems();
    } else if (groupId === "me") {
      return this.meItems();
    }
    return [];
  }

  navItemClass(...classes: string[]): string {
    const resolved = classes.filter(Boolean);
    if (this.isCollapsed()) {
      resolved.push("nav-item--collapsed");
    }
    return resolved.join(" ");
  }
}
