import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  signal,
  viewChild,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { QuickActionsFABComponent } from "../quick-actions-fab/quick-actions-fab.component";
import { SmartBreadcrumbsComponent } from "../smart-breadcrumbs/smart-breadcrumbs.component";
import { BottomNavComponent } from "../bottom-nav/bottom-nav.component";
import { OfflineBannerComponent } from "../offline-banner/offline-banner.component";
import { KeyboardShortcutsModalComponent } from "../keyboard-shortcuts-modal/keyboard-shortcuts-modal.component";
import { ScrollToTopComponent } from "../scroll-to-top/scroll-to-top.component";
import { ThemeService } from "../../../core/services/theme.service";
import { ProfileNotificationService } from "../../../core/services/profile-notification.service";

@Component({
  selector: "app-main-layout",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SidebarComponent,
    HeaderComponent,
    QuickActionsFABComponent,
    SmartBreadcrumbsComponent,
    BottomNavComponent,
    OfflineBannerComponent,
    KeyboardShortcutsModalComponent,
    ScrollToTopComponent,
  ],
  template: `
    <div class="app-shell dashboard-container">
      <app-header
        class="app-shell__header"
        [sidebarCollapsed]="sidebarCollapsed()"
        [mobileNav]="mobileNav()"
        (toggleSidebar)="toggleSidebar()"
      ></app-header>

      <div class="app-shell__main">
        <app-sidebar
          #sidebar
          class="app-shell__sidebar"
          [collapsed]="sidebarCollapsed()"
          [mobileViewport]="mobileNav()"
        ></app-sidebar>

        <section class="app-shell__content" aria-label="Application content">
          <div class="app-main">
            <div class="page-container">
              <app-offline-banner></app-offline-banner>
              <app-smart-breadcrumbs class="app-shell__breadcrumbs"></app-smart-breadcrumbs>
              <div class="page-content content-wrapper">
                <ng-content></ng-content>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Quick Actions FAB (hidden on mobile, bottom nav takes over) -->
      <app-quick-actions-fab class="desktop-only"></app-quick-actions-fab>

      <!-- Mobile Bottom Navigation -->
      <footer class="app-footer">
        <app-bottom-nav></app-bottom-nav>
      </footer>

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
    "(window:resize)": "onWindowResize()",
    "[class.app-shell--sidebar-collapsed]": "sidebarCollapsed() && !mobileNav()",
  },
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private profileNotificationService = inject(ProfileNotificationService);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  readonly sidebar = viewChild(SidebarComponent);
  readonly sidebarCollapsed = signal(this.loadSidebarCollapsedState());
  readonly mobileNav = signal(false);

  ngOnInit(): void {
    // Check profile completion on every page load
    // This ensures users are reminded to complete their profile
    this.profileNotificationService.checkAndNotify();
    this.syncViewportState();
    this.applyShellBodyClass(true);
  }

  ngOnDestroy(): void {
    this.applyShellBodyClass(false);
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

    this.sidebarCollapsed.update((value) => {
      const next = !value;
      this.saveSidebarCollapsedState(next);
      return next;
    });
  }

  onWindowResize(): void {
    this.syncViewportState();
  }

  private applyShellBodyClass(enabled: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (enabled) {
      this.renderer.addClass(document.body, "app-shell-active");
    } else {
      this.renderer.removeClass(document.body, "app-shell-active");
    }
  }

  private syncViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const isMobile = window.matchMedia("(max-width: 48rem)").matches;
    this.mobileNav.set(isMobile);

    if (!isMobile) {
      this.sidebar()?.closeSidebar();
    }
  }

  private loadSidebarCollapsedState(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem("app-shell-sidebar-collapsed") === "true";
  }

  private saveSidebarCollapsedState(collapsed: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem("app-shell-sidebar-collapsed", String(collapsed));
  }
}
