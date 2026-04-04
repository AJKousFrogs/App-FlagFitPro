import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal, viewChild, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { MenuItem } from "primeng/api";
import { AvatarComponent } from "../avatar/avatar.component";
import { Menu } from "primeng/menu";
import { Tooltip } from "primeng/tooltip";

import { NotificationStateService } from "../../../core/services/notification-state.service";
import { ThemeService } from "../../../core/services/theme.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";

import { HeaderWeatherWidgetComponent } from "./header-weather-widget.component";


@Component({
  selector: "app-header-actions",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Menu, AvatarComponent, Tooltip, HeaderWeatherWidgetComponent],
  templateUrl: "./header-actions.component.html",
  encapsulation: ViewEncapsulation.None,
  host: {
    "(document:keydown.escape)": "onEscapePress()",
  },
})
export class HeaderActionsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notificationService = inject(NotificationStateService);
  private readonly themeService = inject(ThemeService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  // Parent-owned panel toggle (the panel lives in HeaderComponent template).
  readonly toggleNotifications = output<void>();

  // User menu state
  private readonly userMenu = viewChild<import("primeng/menu").Menu>("userMenu");
  private readonly isUserMenuOpen = signal(false);

  readonly userInitials = signal("JD");

  readonly notificationCount = signal(0);

  // Theme derived signals
  readonly themeIcon = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "auto") return "pi pi-desktop";
    return mode === "dark" ? "pi pi-sun" : "pi pi-moon";
  });

  readonly themeLabel = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "auto") return "Auto";
    return mode === "dark" ? "Dark" : "Light";
  });

  readonly themeTooltip = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "light") return "Switch to Dark mode";
    if (mode === "dark") return "Switch to Auto mode";
    return "Switch to Light mode";
  });

  readonly userMenuItems = computed<MenuItem[]>(() => [
    {
      label: "View Profile",
      icon: "pi pi-user",
      command: () => this.navigateTo("/profile"),
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      command: () => this.navigateTo("/settings"),
    },
    { separator: true },
    {
      label: "Sign Out",
      icon: "pi pi-sign-out",
      command: () => this.logout(),
    },
  ]);

  ngOnInit(): void {
    this.loadUserData();
    this.loadNotifications();
  }

  onEscapePress(): void {
    if (!this.isUserMenuOpen()) return;
    this.closeUserMenu();
  }

  openSettings(): void {
    this.navigateTo("/settings");
  }

  cycleTheme(): void {
    this.themeService.cycleMode();
  }

  toggleUserMenu(event: Event): void {
    const menu = this.userMenu();
    if (menu) menu.toggle(event);
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    const menu = this.userMenu();
    if (menu) menu.hide();
    this.isUserMenuOpen.set(false);
  }

  navigateTo(path: string): void {
    this.closeUserMenu();
    void this.router.navigate([path]);
  }

  async logout(): Promise<void> {
    this.closeUserMenu();

    const confirmed = await this.confirmDialog.confirmLogout();
    if (!confirmed) return;

    try {
      await this.supabase.signOut();
      await this.router.navigate(["/login"]);
    } catch (err) {
      this.logger.error("Logout failed:", err);
      await this.router.navigate(["/login"]);
    }
  }

  private loadNotifications(): void {
    const count = this.notificationService.unreadCount();
    this.notificationCount.set(count);
  }

  private loadUserData(): void {
    const user = this.supabase.currentUser();
    const metadata = user?.user_metadata as
      | { fullName?: string; firstName?: string; lastName?: string }
      | undefined;
    const fullName =
      metadata?.fullName ||
      [metadata?.firstName, metadata?.lastName].filter(Boolean).join(" ");

    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const initials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        this.userInitials.set(initials);
      } else {
        this.userInitials.set(nameParts[0]?.[0]?.toUpperCase() ?? "JD");
      }
      return;
    }

    if (user?.email) {
      this.userInitials.set(user.email[0]?.toUpperCase() ?? "JD");
    }
  }
}
