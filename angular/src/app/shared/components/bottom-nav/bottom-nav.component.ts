import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import {
  getMobileMoreNavigationItems,
  getMobilePrimaryNavigationItems,
  isExactNavigationRoute,
} from "../../../core/navigation/app-navigation.config";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { RouteShellService } from "../../../core/services/route-shell.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { NavItemComponent } from "../nav-item.component";
import { BackdropComponent } from "../backdrop/backdrop.component";
import { CloseButtonComponent } from "../close-button/close-button.component";

@Component({
  selector: "app-bottom-nav",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NavItemComponent,
    BackdropComponent,
    CloseButtonComponent,
  ],
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
          [exact]="isExactRoute(item.route)"
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
      <app-backdrop
        [visible]="showMoreMenu()"
        [styleClass]="'more-menu-overlay'"
        (backdropClick)="toggleMoreMenu()"
      />
      <div
        class="more-menu"
        role="dialog"
        aria-modal="true"
        aria-label="More navigation items"
      >
        <div class="more-menu-header">
          <span>More</span>
          <app-close-button
            ariaLabel="Close more menu"
            [styleClass]="'close-btn'"
            (clicked)="toggleMoreMenu()"
          />
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
    }
  `,
  styleUrl: "./bottom-nav.component.scss",
})
export class BottomNavComponent implements OnInit {
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private notificationState = inject(NotificationStateService);
  private routeShell = inject(RouteShellService);
  private readonly destroyRef = inject(DestroyRef);

  showMoreMenu = signal(false);

  isVisible = computed(() => {
    const isAuthenticated = this.supabase.isAuthenticated();
    return isAuthenticated && this.routeShell.showBottomNav();
  });

  private readonly currentUserRole = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role || "player";
  });

  visibleNavItems = computed(() => {
    const userRole = this.currentUserRole();
    const unreadCount = this.notificationState.unreadCount();
    const items = getMobilePrimaryNavigationItems(userRole);

    return items.map((item) => ({
      ...item,
      badge: item.route === "/chat" ? unreadCount : undefined,
    }));
  });

  moreNavItems = computed(() => {
    const userRole = this.currentUserRole();
    const unreadCount = this.notificationState.unreadCount();

    return getMobileMoreNavigationItems(userRole)
      .map((item) => ({
        ...item,
        badge: item.route === "/chat" ? unreadCount : undefined,
      }));
  });

  hasMoreItems = computed(() => this.moreNavItems().length > 0);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.showMoreMenu.set(false);
      });
  }

  toggleMoreMenu(): void {
    this.showMoreMenu.update((v) => !v);
  }

  isExactRoute(route: string): boolean {
    return isExactNavigationRoute(route);
  }
}
