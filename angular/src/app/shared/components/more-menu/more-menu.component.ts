import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { getMobileMoreNavigationItems } from "../../../core/navigation/app-navigation.config";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { BackdropComponent } from "../backdrop/backdrop.component";
import { CloseButtonComponent } from "../close-button/close-button.component";
import { NavItemComponent } from "../nav-item.component";
import { MoreMenuService } from "./more-menu.service";

/**
 * Phase 2.5 — the "More" overlay extracted out of BottomNavComponent so
 * the bar lands at exactly 5 slots (matching the reference apps). Mount
 * once in MainLayout; trigger from MobileHeaderComponent (or anywhere
 * else) via MoreMenuService.toggle().
 *
 * Items come from app-navigation.config.getMobileMoreNavigationItems()
 * keyed by the signed-in user's role; the chat badge passes the
 * NotificationStateService unread count through unchanged.
 */
@Component({
  selector: "app-more-menu",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackdropComponent, CloseButtonComponent, NavItemComponent],
  template: `
    @if (service.isOpen()) {
      <app-backdrop
        [visible]="service.isOpen()"
        [styleClass]="'more-menu-overlay'"
        (backdropClick)="service.close()"
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
            (clicked)="service.close()"
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
              (clicked)="service.close()"
            />
          }
        </div>
      </div>
    }
  `,
  styleUrl: "./more-menu.component.scss",
})
export class MoreMenuComponent implements OnInit {
  readonly service = inject(MoreMenuService);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUserRole = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role || "player";
  });

  readonly moreNavItems = computed(() => {
    const role = this.currentUserRole();
    const unreadCount = this.notificationState.unreadCount();
    return getMobileMoreNavigationItems(role).map((item) => ({
      ...item,
      badge: item.route === "/chat" ? unreadCount : undefined,
    }));
  });

  ngOnInit(): void {
    // Auto-close the overlay on any successful navigation so the user
    // doesn't see a lingering sheet after selecting a route.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.service.close());
  }
}
