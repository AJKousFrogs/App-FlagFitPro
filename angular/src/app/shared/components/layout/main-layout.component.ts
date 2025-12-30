import { Component, ChangeDetectionStrategy } from "@angular/core";

import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { QuickActionsFABComponent } from "../quick-actions-fab/quick-actions-fab.component";
import { SmartBreadcrumbsComponent } from "../smart-breadcrumbs/smart-breadcrumbs.component";
import { BottomNavComponent } from "../bottom-nav/bottom-nav.component";
import { OfflineBannerComponent } from "../offline-banner/offline-banner.component";

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
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {}
