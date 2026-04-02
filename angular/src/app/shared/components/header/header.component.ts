import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  ViewEncapsulation,
  viewChild,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { HeaderService } from "../../../core/services/header.service";
import { NotificationsPanelComponent } from "../notifications-panel/notifications-panel.component";
import { SearchPanelComponent } from "../search-panel/search-panel.component";
import { HeaderActionsComponent } from "./header-actions.component";
import { HeaderLeftComponent } from "./header-left.component";
import { HeaderSearchComponent } from "./header-search.component";

@Component({
  selector: "app-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    SearchPanelComponent,
    NotificationsPanelComponent,
    HeaderLeftComponent,
    HeaderSearchComponent,
    HeaderActionsComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  private readonly headerService = inject(HeaderService);
  private readonly router = inject(Router);

  notificationsPanel =
    viewChild<NotificationsPanelComponent>("notificationsPanel");

  toggleSidebar = output<void>();
  readonly sidebarCollapsed = input(false);
  readonly mobileNav = input(false);

  readonly sidebarToggleIcon = computed(() =>
    this.mobileNav()
      ? "pi-bars"
      : this.sidebarCollapsed()
        ? "pi-angle-right"
        : "pi-angle-left",
  );

  readonly sidebarToggleTooltip = computed(() =>
    this.mobileNav()
      ? "Open navigation"
      : this.sidebarCollapsed()
        ? "Expand sidebar"
        : "Collapse sidebar",
  );

  readonly sidebarToggleAriaLabel = computed(() =>
    this.mobileNav()
      ? "Open navigation menu"
      : this.sidebarCollapsed()
        ? "Expand sidebar"
        : "Collapse sidebar",
  );

  readonly config = computed(() => this.headerService.getConfig()());

  readonly searchPlaceholder = computed(() => {
    const configured = this.config().searchPlaceholder?.trim();
    if (!configured) return "Search workouts, exercises...";
    return configured.length > 32
      ? "Search workouts, exercises..."
      : configured;
  });

  readonly searchShortcutModifier = computed(() =>
    this.isApplePlatform() ? "Cmd" : "Ctrl",
  );

  private isApplePlatform(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onSearch(): void {
    void this.router.navigate(["/search"]);
  }

  toggleNotifications(): void {
    const panel = this.notificationsPanel();
    if (panel) panel.toggle();
  }
}
