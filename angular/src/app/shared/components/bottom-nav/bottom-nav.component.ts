import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { NavItemComponent } from "../nav-item.component";

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  roles?: string[];
}

@Component({
  selector: "app-bottom-nav",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NavItemComponent],
  template: `
    <nav
      class="bottom-nav"
      [class.hidden]="!isVisible()"
      aria-label="Primary navigation"
    >
      @for (item of visibleNavItems(); track item.route) {
        <app-nav-item
          [route]="item.route"
          [label]="item.label"
          [icon]="item.icon"
          [badge]="item.badge && item.badge > 0 ? item.badge : null"
          [exact]="item.route === '/dashboard'"
          variant="bottom"
        />
      }

      <!-- More menu for additional items -->
      @if (hasMoreItems()) {
        <app-nav-item
          label="More"
          icon="pi-ellipsis-h"
          ariaLabel="More navigation items"
          variant="bottom"
          (clicked)="toggleMoreMenu()"
        />
      }
    </nav>

    <!-- More menu overlay -->
    @if (showMoreMenu()) {
      <div class="more-menu-overlay" (click)="toggleMoreMenu()">
        <div class="more-menu" (click)="$event.stopPropagation()">
          <div class="more-menu-header">
            <span>More</span>
            <button
              class="close-btn"
              (click)="toggleMoreMenu()"
              aria-label="Close more menu"
              type="button"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="more-menu-items">
            @for (item of moreNavItems(); track item.route) {
              <app-nav-item
                [route]="item.route"
                [label]="item.label"
                [icon]="item.icon"
                [badge]="item.badge && item.badge > 0 ? item.badge : null"
                variant="menu"
                (clicked)="toggleMoreMenu()"
              />
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: "./bottom-nav.component.scss",
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationState = inject(NotificationStateService);
  private routerSub?: Subscription;

  showMoreMenu = signal(false);
  currentRoute = signal("");

  // Routes where bottom nav should be hidden (like login, landing)
  private hiddenRoutes = [
    "/",
    "/login",
    "/register",
    "/reset-password",
    "/update-password",
    "/verify-email",
    "/onboarding",
  ];

  isVisible = computed(() => {
    const route = this.currentRoute();
    const isAuthenticated = this.authService.isAuthenticated();
    return (
      isAuthenticated &&
      !this.hiddenRoutes.some((r) => route === r || route.startsWith("/auth"))
    );
  });

  // Primary nav items (shown in bottom bar)
  // Consolidated to 4 core items as per new architecture
  private athleteNavItems: NavItem[] = [
    { label: "Dashboard", icon: "pi-home", route: "/player-dashboard" },
    { label: "Today", icon: "pi-calendar", route: "/todays-practice" },
    { label: "Training", icon: "pi-bolt", route: "/training" },
    { label: "Wellness", icon: "pi-heart", route: "/wellness" },
  ];

  private coachNavItems: NavItem[] = [
    { label: "Dashboard", icon: "pi-home", route: "/coach/dashboard" },
    { label: "Roster", icon: "pi-users", route: "/roster" },
    { label: "Planning", icon: "pi-calendar", route: "/coach/programs" },
    { label: "Analytics", icon: "pi-chart-line", route: "/coach/analytics" },
  ];

  private secondaryNavItems: NavItem[] = [
    { label: "Merlin AI", icon: "pi-sparkles", route: "/chat" },
    { label: "Performance", icon: "pi-bullseye", route: "/performance-tracking" },
    { label: "Analytics", icon: "pi-chart-line", route: "/analytics", roles: ["player"] },
    { label: "ACWR", icon: "pi-chart-bar", route: "/acwr", roles: ["player"] },
    { label: "Roster", icon: "pi-users", route: "/roster", roles: ["player"] },
    { label: "Team Chat", icon: "pi-comments", route: "/team-chat" },
    { label: "Community", icon: "pi-globe", route: "/community" },
    { label: "Tournaments", icon: "pi-trophy", route: "/tournaments" },
    { label: "Game Tracker", icon: "pi-flag", route: "/game-tracker" },
    { label: "Game Nutrition", icon: "pi-apple", route: "/game/nutrition" },
    { label: "Travel Recovery", icon: "pi-map-marker", route: "/travel/recovery" },
    { label: "Exercise Library", icon: "pi-book", route: "/exercise-library" },
    { label: "Video Library", icon: "pi-video", route: "/training/videos" },
    { label: "Staff Hub", icon: "pi-building", route: "/staff", roles: ["physiotherapist", "nutritionist", "psychologist", "strength_conditioning_coach"] },
    { label: "Exercise DB", icon: "pi-database", route: "/exercisedb", roles: ["coach", "assistant_coach", "admin"] },
    { label: "Coach Knowledge", icon: "pi-bookmark", route: "/coach/knowledge", roles: ["coach", "assistant_coach", "admin"] },
    { label: "Team Hub", icon: "pi-briefcase", route: "/team/workspace", roles: ["coach", "assistant_coach", "admin"] },
    { label: "Team Management", icon: "pi-sitemap", route: "/coach/team", roles: ["coach", "assistant_coach", "admin"] },
    { label: "Help", icon: "pi-question-circle", route: "/help" },
    { label: "Settings", icon: "pi-cog", route: "/settings" },
    { label: "Profile", icon: "pi-user", route: "/profile" },
  ];

  visibleNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const isCoach = ["coach", "assistant_coach", "admin"].includes(userRole);
    const unreadCount = this.notificationState.unreadCount();
    const items =
      isCoach ? this.coachNavItems : this.athleteNavItems;

    return items.map((item) => ({
      ...item,
      badge: item.route === "/chat" ? unreadCount : undefined,
    }));
  });

  moreNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const unreadCount = this.notificationState.unreadCount();

    // All other routes move to the "More" menu for power users
    return this.secondaryNavItems
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .filter(
        (item) =>
          !this.visibleNavItems().some(
            (visible) => visible.route === item.route,
          ),
      )
      .map((item) => ({
        ...item,
        badge: item.route === "/chat" ? unreadCount : undefined,
      }));
  });

  hasMoreItems = computed(() => this.moreNavItems().length > 0);

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
        this.showMoreMenu.set(false);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleMoreMenu(): void {
    this.showMoreMenu.update((v) => !v);
  }
}
