import {
  Component,
  ChangeDetectionStrategy,
  inject,
  HostListener,
  OnInit,
} from "@angular/core";

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
  standalone: true,
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
    <!-- Offline Banner -->
    <app-offline-banner></app-offline-banner>

    <div class="dashboard-container">
      <app-sidebar #sidebar></app-sidebar>
      <main class="main-content">
        <app-header (toggleSidebar)="sidebar.toggleSidebar()"></app-header>
        <app-smart-breadcrumbs></app-smart-breadcrumbs>
        <div class="content-wrapper">
          <ng-content></ng-content>
        </div>
      </main>

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
  styleUrls: ["./main-layout.component.scss"],
})
export class MainLayoutComponent implements OnInit {
  private themeService = inject(ThemeService);
  private profileNotificationService = inject(ProfileNotificationService);

  ngOnInit(): void {
    // Check profile completion on every page load
    // This ensures users are reminded to complete their profile
    this.profileNotificationService.checkAndNotify();
  }

  /**
   * Listen for custom events from keyboard shortcuts service
   */
  @HostListener("window:toggle-sidebar")
  onToggleSidebar(): void {
    // This will be handled by the sidebar component
    // We dispatch a custom event that the sidebar listens to
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sidebar-toggle-request"));
    }
  }

  @HostListener("window:toggle-theme")
  onToggleTheme(): void {
    this.themeService.toggle();
  }
}
