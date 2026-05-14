import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  afterNextRender,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { filter, take } from "rxjs/operators";

import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { QuickActionsFABComponent } from "../quick-actions-fab/quick-actions-fab.component";
import { SmartBreadcrumbsComponent } from "../smart-breadcrumbs/smart-breadcrumbs.component";
import { BottomNavComponent } from "../bottom-nav/bottom-nav.component";
import { MoreMenuComponent } from "../more-menu/more-menu.component";
import { OfflineBannerComponent } from "../offline-banner/offline-banner.component";
import { KeyboardShortcutsModalComponent } from "../keyboard-shortcuts-modal/keyboard-shortcuts-modal.component";
import { ScrollToTopComponent } from "../scroll-to-top/scroll-to-top.component";
import { MobileHeaderComponent } from "./mobile-header.component";
import { ThemeService } from "../../../core/services/theme.service";
import { ProfileNotificationService } from "../../../core/services/profile-notification.service";
import { ShellBodyStateService } from "../../../core/services/shell-body-state.service";
import { PlatformService } from "../../../core/services/platform.service";

@Component({
  selector: "app-main-layout",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SidebarComponent,
    HeaderComponent,
    MobileHeaderComponent,
    QuickActionsFABComponent,
    SmartBreadcrumbsComponent,
    BottomNavComponent,
    MoreMenuComponent,
    OfflineBannerComponent,
    KeyboardShortcutsModalComponent,
    ScrollToTopComponent,
  ],
  template: `
    <div class="app-shell">
      <app-sidebar
        #sidebar
        class="app-shell__sidebar"
        [collapsed]="sidebarCollapsed() || tabletPortrait()"
        [mobileViewport]="mobileNav()"
      ></app-sidebar>

      <app-header
        class="app-shell__header"
        [sidebarCollapsed]="sidebarCollapsed()"
        [mobileNav]="mobileNav()"
        (toggleSidebar)="toggleSidebar()"
      ></app-header>

      <app-mobile-header
        class="app-shell__mobile-header"
        (toggleSidebar)="toggleSidebar()"
      ></app-mobile-header>

      <section
        class="app-shell__main app-main"
        data-scroll-root="app-shell-main"
        aria-label="Application content"
      >
        <div class="app-shell__page">
          <app-offline-banner></app-offline-banner>
          @if (!mobileNav()) {
            <app-smart-breadcrumbs class="app-shell__breadcrumbs"></app-smart-breadcrumbs>
          }
          <div class="app-shell__content-stack">
            <ng-content></ng-content>
          </div>
        </div>
      </section>

      <!-- Quick Actions FAB (hidden on mobile, bottom nav takes over) -->
      <app-quick-actions-fab class="desktop-only"></app-quick-actions-fab>

      <!-- Mobile Bottom Navigation -->
      <footer class="app-shell__footer">
        <app-bottom-nav></app-bottom-nav>
      </footer>

      <!-- Phase 2.5: shared More overlay (triggered from MobileHeader) -->
      <app-more-menu></app-more-menu>

      <!-- Scroll to Top Button (UX Audit Fix #10) -->
      <app-scroll-to-top></app-scroll-to-top>
    </div>

    <!-- Keyboard Shortcuts Modal (Global) -->
    <app-keyboard-shortcuts-modal></app-keyboard-shortcuts-modal>
  `,
  styleUrl: "./main-layout.component.scss",
  host: {
    "(window:toggle-sidebar)": "onToggleSidebar()",
    "(window:toggle-theme)": "onToggleTheme()",
    "[class.app-shell--sidebar-collapsed]": "sidebarCollapsed() && !mobileNav()",
  },
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private profileNotificationService = inject(ProfileNotificationService);
  private readonly shellBodyState = inject(ShellBodyStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);
  private releaseShellBodyClass: (() => void) | null = null;
  readonly sidebar = viewChild(SidebarComponent);
  readonly sidebarCollapsed = signal(this.loadSidebarCollapsedState());
  readonly mobileNav = signal(false);
  /**
   * Phase 2.5: tablet portrait (≥ md, < lg = 48.0625–64rem) forces the
   * sidebar into icon-rail mode independent of the user's collapse
   * preference. Restores the preference when leaving the range.
   */
  readonly tabletPortrait = signal(false);

  ngOnInit(): void {
    // Wait for the first NavigationEnd so router.url reflects the actual destination
    // before the profile notification service checks the current route for suppression.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        this.profileNotificationService.checkAndNotify();
      });
    this.initViewportState();
    this.releaseShellBodyClass = this.shellBodyState.acquireShell();
  }

  constructor() {
    afterNextRender(() => this.initHideOnScroll());
  }

  ngOnDestroy(): void {
    this.releaseShellBodyClass?.();
    this.releaseShellBodyClass = null;
  }

  /**
   * Listen for custom events from keyboard shortcuts service
   */
  onToggleSidebar(): void {
    this.toggleSidebar();
  }

  onToggleTheme(): void {
    this.themeService.toggle();
  }

  toggleSidebar(): void {
    if (this.mobileNav()) {
      this.sidebar()?.toggleSidebar();
      return;
    }

    // On tablet portrait the sidebar is force-collapsed as an icon rail;
    // the user's collapse preference can still be flipped under the hood
    // so it takes effect once they cross back over the lg breakpoint.
    this.sidebarCollapsed.update((value) => {
      const next = !value;
      this.saveSidebarCollapsedState(next);
      return next;
    });
  }

  private initViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Phase 2: mobile shell extends through tablet portrait (≤ md = 48rem).
    const mobileQuery = window.matchMedia("(max-width: 48rem)");
    const syncMobile = (matches: boolean) => {
      this.mobileNav.set(matches);
      if (!matches) {
        this.sidebar()?.closeSidebar();
      }
    };
    syncMobile(mobileQuery.matches);
    const onMobileChange = (event: MediaQueryListEvent) => syncMobile(event.matches);
    mobileQuery.addEventListener("change", onMobileChange);

    // Phase 2.5: tablet portrait (48.0625rem – 64rem) drives the
    // icon-rail sidebar. Stays in sync with the matching scss block in
    // sidebar.component.scss (line 317) and main-layout.scss (line 40).
    const tabletQuery = window.matchMedia(
      "(min-width: 48.0625rem) and (max-width: 64rem)",
    );
    const syncTablet = (matches: boolean) => this.tabletPortrait.set(matches);
    syncTablet(tabletQuery.matches);
    const onTabletChange = (event: MediaQueryListEvent) => syncTablet(event.matches);
    tabletQuery.addEventListener("change", onTabletChange);

    this.destroyRef.onDestroy(() => {
      mobileQuery.removeEventListener("change", onMobileChange);
      tabletQuery.removeEventListener("change", onTabletChange);
    });
  }

  /**
   * Phase 2: hide-on-scroll for the bottom nav. Watches the app-shell scroll
   * root and toggles `body.bottom-nav-hidden` based on scroll direction past
   * a small threshold. The bottom-nav SCSS reads that class to translateY
   * the bar off-screen. Skipped under prefers-reduced-motion.
   */
  private initHideOnScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const scrollRoot = document.querySelector<HTMLElement>(
      '[data-scroll-root="app-shell-main"]',
    );
    if (!scrollRoot) return;

    const THRESHOLD = 24;
    let lastY = scrollRoot.scrollTop;
    let ticking = false;

    const update = () => {
      const y = scrollRoot.scrollTop;
      const delta = y - lastY;

      if (Math.abs(delta) > THRESHOLD) {
        const hidden = delta > 0 && y > THRESHOLD;
        document.body.classList.toggle("bottom-nav-hidden", hidden);
        lastY = y;
      } else if (y <= 0) {
        // At the top — always show.
        document.body.classList.remove("bottom-nav-hidden");
        lastY = y;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      scrollRoot.removeEventListener("scroll", onScroll);
      document.body.classList.remove("bottom-nav-hidden");
    });
  }

  private loadSidebarCollapsedState(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.platform.getLocalStorage("app-shell-sidebar-collapsed") === "true";
  }

  private saveSidebarCollapsedState(collapsed: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.platform.setLocalStorage(
      "app-shell-sidebar-collapsed",
      String(collapsed),
    );
  }
}
