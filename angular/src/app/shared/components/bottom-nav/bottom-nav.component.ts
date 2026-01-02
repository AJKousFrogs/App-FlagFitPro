import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { BadgeModule } from "primeng/badge";
import { RippleModule } from "primeng/ripple";
import { filter, Subscription } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { NotificationStateService } from "../../../core/services/notification-state.service";

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
  imports: [CommonModule, RouterModule, BadgeModule, RippleModule],
  template: `
    <nav class="bottom-nav" [class.hidden]="!isVisible()">
      @for (item of visibleNavItems(); track item.route) {
        <a
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
          class="nav-item"
          pRipple
        >
          <div class="nav-icon-wrapper">
            <i [class]="'pi ' + item.icon"></i>
            @if (item.badge && item.badge > 0) {
              <p-badge
                [value]="item.badge.toString()"
                severity="danger"
                class="nav-badge"
              ></p-badge>
            }
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }

      <!-- More menu for additional items -->
      @if (hasMoreItems()) {
        <button class="nav-item more-btn" (click)="toggleMoreMenu()" pRipple>
          <div class="nav-icon-wrapper">
            <i class="pi pi-ellipsis-h"></i>
          </div>
          <span class="nav-label">More</span>
        </button>
      }
    </nav>

    <!-- More menu overlay -->
    @if (showMoreMenu()) {
      <div class="more-menu-overlay" (click)="toggleMoreMenu()">
        <div class="more-menu" (click)="$event.stopPropagation()">
          <div class="more-menu-header">
            <span>More</span>
            <button class="close-btn" (click)="toggleMoreMenu()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="more-menu-items">
            @for (item of moreNavItems(); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="more-item"
                (click)="toggleMoreMenu()"
              >
                <i [class]="'pi ' + item.icon"></i>
                <span>{{ item.label }}</span>
                @if (item.badge && item.badge > 0) {
                  <p-badge
                    [value]="item.badge.toString()"
                    severity="danger"
                  ></p-badge>
                }
              </a>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './bottom-nav.component.scss',
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
  // Wellness promoted to primary for athletes - critical daily action
  private primaryNavItems: NavItem[] = [
    { label: "Home", icon: "pi-home", route: "/dashboard" },
    { label: "Training", icon: "pi-bolt", route: "/training" },
    { label: "Wellness", icon: "pi-heart", route: "/wellness" }, // Promoted!
    { label: "Analytics", icon: "pi-chart-line", route: "/analytics" },
  ];

  // Secondary nav items (shown in "More" menu)
  // Reorganized for better UX flow
  private secondaryNavItems: NavItem[] = [
    // Competition
    { label: "Game Day", icon: "pi-flag-fill", route: "/game/readiness" },
    { label: "Fuel Plan", icon: "pi-apple", route: "/game/nutrition" },
    { label: "Games", icon: "pi-video", route: "/game-tracker" },
    { label: "Tournaments", icon: "pi-trophy", route: "/tournaments" },
    // Recovery
    { label: "Travel", icon: "pi-globe", route: "/travel/recovery" },
    // Team
    { label: "Team", icon: "pi-users", route: "/roster" },
    {
      label: "Depth Chart",
      icon: "pi-sitemap",
      route: "/depth-chart",
      roles: ["coach", "assistant_coach"],
    },
    // Resources
    { label: "Videos", icon: "pi-youtube", route: "/training/videos" },
    // Community
    { label: "Community", icon: "pi-comments", route: "/community" },
    { label: "Chat", icon: "pi-inbox", route: "/chat" },
    // Account
    { label: "Profile", icon: "pi-user", route: "/profile" },
    { label: "Settings", icon: "pi-cog", route: "/settings" },
  ];

  visibleNavItems = computed(() => {
    const unreadCount = this.notificationState.unreadCount();
    return this.primaryNavItems.map((item) => ({
      ...item,
      badge: item.route === "/chat" ? unreadCount : undefined,
    }));
  });

  moreNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const unreadCount = this.notificationState.unreadCount();

    return this.secondaryNavItems
      .filter((item) => !item.roles || item.roles.includes(userRole))
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
