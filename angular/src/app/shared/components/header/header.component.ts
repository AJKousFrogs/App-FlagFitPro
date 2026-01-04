import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    HostListener,
    inject,
    model,
    OnDestroy,
    output,
    signal,
    ViewChild,
    ViewEncapsulation,
} from "@angular/core";

import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { MenuItem } from "primeng/api";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { IconButtonComponent } from "../button/icon-button.component";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { TagModule } from "primeng/tag";
import { ToolbarModule } from "primeng/toolbar";
import { TooltipModule } from "primeng/tooltip";
import { filter } from "rxjs/operators";
import { AuthService } from "../../../core/services/auth.service";
import { HeaderService } from "../../../core/services/header.service";
import { LoggerService } from "../../../core/services/logger.service";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { SearchService } from "../../../core/services/search.service";
import { ThemeService } from "../../../core/services/theme.service";
import { TrainingStatsCalculationService } from "../../../core/services/training-stats-calculation.service";
import { NotificationsPanelComponent } from "../notifications-panel/notifications-panel.component";
import { SearchPanelComponent } from "../search-panel/search-panel.component";

@Component({
  selector: "app-header",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    ToolbarModule,
    TagModule,
    MenuModule,
    SearchPanelComponent,
    NotificationsPanelComponent,
    ButtonModule,
    IconButtonComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnDestroy {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationStateService);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private trainingStatsService = inject(TrainingStatsCalculationService);

  @ViewChild("notificationsPanel")
  notificationsPanel!: NotificationsPanelComponent;

  @ViewChild("userMenu") userMenu!: import("primeng/menu").Menu;

  // Close user menu on Escape
  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    if (this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  toggleSidebar = output<void>();

  // Angular 21: Use model() for two-way binding (replaces ngModel)
  searchQuery = model("");

  notificationCount = signal(0);
  // Theme computed signals from service
  isDarkTheme = computed(() => this.themeService.isDark());
  themeMode = computed(() => this.themeService.mode());

  themeIcon = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "auto") return "pi pi-desktop";
    return mode === "dark" ? "pi pi-sun" : "pi pi-moon";
  });

  themeLabel = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "auto") return "Auto";
    return mode === "dark" ? "Dark" : "Light";
  });

  themeTooltip = computed(() => {
    const mode = this.themeService.mode();
    if (mode === "light") return "Switch to Dark mode";
    if (mode === "dark") return "Switch to Auto mode";
    return "Switch to Light mode";
  });

  themeAriaLabel = computed(() => {
    return `Current theme: ${this.themeLabel()}. Click to change.`;
  });

  // User menu state
  isUserMenuOpen = signal(false);
  userInitials = signal("JD");
  userName = signal("User");
  userEmail = signal("user@example.com");
  userRole = signal("Player");
  userStats = signal({ trainingSessions: 0, streak: 0, level: 0 });

  // User menu items for p-menu
  userMenuItems = computed<MenuItem[]>(() => [
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

  // Olympic countdown - LA 2028 Opening Ceremony: July 14, 2028
  olympicCountdown = signal({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  private olympicDate = new Date("2028-07-14T20:00:00-07:00"); // Pacific Time
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  currentSection = signal("");
  currentPage = signal("");

  config = computed(() => this.headerService.getConfig()());

  headerClass = computed(() => `variant-${this.config().variant || "default"}`);

  // Angular 21: Use toSignal() for router events instead of subscription
  private navigationEnd$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
  );

  private navigationEnd = toSignal(this.navigationEnd$, { initialValue: null });

  constructor() {
    // Angular 21: Initialize data in constructor
    this.updateBreadcrumbs();
    this.loadUserData();
    this.loadNotifications();
    this.startOlympicCountdown();

    // Angular 21: Use effect() for reactive side effects
    effect(() => {
      // React to navigation changes
      if (this.navigationEnd()) {
        this.updateBreadcrumbs();
      }
    });

    // Theme is now managed by ThemeService
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onSearch(): void {
    if (this.searchQuery().trim()) {
      // Open search panel with query
      this.searchService.open();
      this.searchService.search(this.searchQuery());
    } else {
      // Just open search panel
      this.searchService.open();
    }
  }

  toggleNotifications(): void {
    // Toggle notifications panel
    if (this.notificationsPanel) {
      this.notificationsPanel.toggle();
    }
  }

  openSettings(): void {
    this.router.navigate(["/settings"]);
  }

  cycleTheme(): void {
    this.themeService.cycleMode();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  // User Menu Methods
  toggleUserMenu(event: Event): void {
    if (this.userMenu) {
      this.userMenu.toggle(event);
    }
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    if (this.userMenu) {
      this.userMenu.hide();
    }
    this.isUserMenuOpen.set(false);
  }

  navigateTo(path: string): void {
    this.closeUserMenu();
    this.router.navigate([path]);
  }

  logout(): void {
    this.closeUserMenu();
    // Angular 21: Use toSignal() for one-time operations or handle directly
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful, navigation handled by auth service
      },
      error: () => {
        // Error handled by error interceptor
      },
    });
  }

  onLogoError(event: Event): void {
    // Fallback if logo image doesn't exist - show text logo
    const img = event.target as HTMLImageElement;
    img.style.display = "none";

    // Create fallback text logo
    const logoContainer = img.parentElement;
    if (logoContainer && !logoContainer.querySelector(".logo-text")) {
      const textLogo = document.createElement("span");
      textLogo.className = "logo-text d-flex align-center font-bold text-lg";
      textLogo.innerHTML =
        '<i class="pi pi-football mr-2 icon-primary"></i>FlagFit Pro';
      logoContainer.appendChild(textLogo);
    }
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url;
    if (url.includes("/dashboard")) {
      this.currentSection.set("Dashboard");
      this.currentPage.set("");
    } else if (url.includes("/training")) {
      this.currentSection.set("Training");
      if (url.includes("/overview")) {
        this.currentPage.set("Overview");
      } else {
        this.currentPage.set("");
      }
    } else if (url.includes("/analytics")) {
      this.currentSection.set("Analytics");
      this.currentPage.set("");
    } else if (url.includes("/roster")) {
      this.currentSection.set("Roster");
      this.currentPage.set("");
    } else if (url.includes("/settings")) {
      this.currentSection.set("Settings");
      this.currentPage.set("");
    } else if (url.includes("/profile")) {
      this.currentSection.set("Profile");
      this.currentPage.set("");
    } else {
      this.currentSection.set("");
      this.currentPage.set("");
    }
  }

  private loadUserData(): void {
    const user = this.authService.getUser();
    if (user?.name) {
      // Set full name
      this.userName.set(user.name);

      // Try to extract initials from name
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const initials =
          `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
        this.userInitials.set(initials);
      } else {
        this.userInitials.set(nameParts[0][0].toUpperCase());
      }
    } else if (user?.email) {
      const initials = user.email[0].toUpperCase();
      this.userInitials.set(initials);
      this.userName.set(user.email.split("@")[0]);
    }

    // Set email
    if (user?.email) {
      this.userEmail.set(user.email);
    }

    // Set role (from user data or default)
    const role = (user as any)?.role || "Player";
    this.userRole.set(role.charAt(0).toUpperCase() + role.slice(1));

    // Load real user stats from training service
    this.loadUserStats();
  }

  private loadUserStats(): void {
    // Fetch real training stats from the service
    this.trainingStatsService.getTrainingStats().subscribe({
      next: (stats) => {
        // Calculate level based on total sessions (simple formula: 1 level per 10 sessions)
        const level = Math.floor(stats.totalSessions / 10);

        this.userStats.set({
          trainingSessions: stats.totalSessions || 0,
          streak: stats.currentStreak || 0,
          level: level,
        });
      },
      error: (err) => {
        this.logger.error("Failed to load user stats:", err);
        // Keep default zeros on error
        this.userStats.set({
          trainingSessions: 0,
          streak: 0,
          level: 0,
        });
      },
    });
  }

  private loadNotifications(): void {
    // Load actual notification count from service
    const count = this.notificationService.unreadCount();
    this.notificationCount.set(count);
  }

  // Olympic countdown methods
  private startOlympicCountdown(): void {
    this.updateOlympicCountdown();

    this.countdownInterval = setInterval(() => {
      this.updateOlympicCountdown();
    }, 1000);
  }

  private updateOlympicCountdown(): void {
    const now = new Date().getTime();
    const target = this.olympicDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      this.olympicCountdown.set({ days, hours, minutes, seconds });
    } else {
      this.olympicCountdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  formatNumber(num: number): string {
    return num.toString().padStart(2, "0");
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
