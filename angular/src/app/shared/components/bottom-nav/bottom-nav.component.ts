import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import {
  getMobilePrimaryNavigationItems,
  isExactNavigationRoute,
} from "../../../core/navigation/app-navigation.config";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { RouteShellService } from "../../../core/services/route-shell.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { NavItemComponent } from "../nav-item.component";

@Component({
  selector: "app-bottom-nav",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavItemComponent],
  template: `
    <nav
      class="bottom-nav"
      [class.hidden]="!isVisible()"
      [class.bottom-nav--has-fab]="hasFabSlot()"
      aria-label="Primary navigation"
    >
      @for (item of visibleNavItems(); track item.route; let i = $index) {
        <app-nav-item
          [route]="item.route"
          [label]="item.label"
          [icon]="item.icon"
          [badge]="item.badge && item.badge > 0 ? item.badge : null"
          [exact]="isExactRoute(item.route)"
          variant="bottom"
          [itemClass]="i === fabIndex() ? 'nav-item--fab' : ''"
        />
      }
    </nav>
  `,
  styleUrl: "./bottom-nav.component.scss",
})
export class BottomNavComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly routeShell = inject(RouteShellService);

  readonly isVisible = computed(() => {
    const isAuthenticated = this.supabase.isAuthenticated();
    return isAuthenticated && this.routeShell.showBottomNav();
  });

  private readonly currentUserRole = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role || "player";
  });

  readonly visibleNavItems = computed(() => {
    const userRole = this.currentUserRole();
    const unreadCount = this.notificationState.unreadCount();
    const items = getMobilePrimaryNavigationItems(userRole);

    return items.map((item) => ({
      ...item,
      badge: item.route === "/chat" ? unreadCount : undefined,
    }));
  });

  /**
   * Index of the slot rendered as a protruding center FAB. Set to the
   * middle slot when there are exactly 5 mobilePrimary items (the Phase 2
   * shell shape). For other counts we skip the FAB treatment.
   */
  readonly fabIndex = computed(() => {
    const count = this.visibleNavItems().length;
    return count === 5 ? 2 : -1;
  });

  readonly hasFabSlot = computed(() => this.fabIndex() >= 0);

  isExactRoute(route: string): boolean {
    return isExactNavigationRoute(route);
  }
}
