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
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { BadgeModule } from "primeng/badge";
import { RippleModule } from "primeng/ripple";
import { Subscription, filter } from "rxjs";
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
  // Consolidated to 4 core items as per new architecture
  private athleteNavItems: NavItem[] = [
    { label: "Today", icon: "pi-calendar", route: "/todays-practice" },
    { label: "Training", icon: "pi-bolt", route: "/training/advanced" },
    { label: "AI Coach", icon: "pi-sparkles", route: "/chat" },
    { label: "Profile", icon: "pi-user", route: "/profile" },
  ];

  private coachNavItems: NavItem[] = [
    { label: "Dashboard", icon: "pi-home", route: "/coach/dashboard" },
    { label: "Team", icon: "pi-users", route: "/team/workspace" },
    { label: "Analytics", icon: "pi-chart-line", route: "/coach/analytics" },
    { label: "Profile", icon: "pi-user", route: "/profile" },
  ];

  private secondaryNavItems: NavItem[] = [
    { label: "Wellness", icon: "pi-heart", route: "/wellness", roles: ["player"] },
    { label: "ACWR", icon: "pi-chart-bar", route: "/acwr", roles: ["player"] },
    { label: "Tests", icon: "pi-list-check", route: "/tests", roles: ["player", "coach"] },
    { label: "Library", icon: "pi-book", route: "/knowledge-base", roles: ["player", "coach"] },
    { label: "Settings", icon: "pi-cog", route: "/settings" },
  ];

  visibleNavItems = computed(() => {
    const userRole = this.authService.getUser()?.role || "player";
    const unreadCount = this.notificationState.unreadCount();
    const items = userRole === "coach" ? this.coachNavItems : this.athleteNavItems;
    
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
