import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  isDevMode,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from "@angular/core";

import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { MenuItem } from "primeng/api";
import { Avatar } from "primeng/avatar";
import { Dialog } from "primeng/dialog";
import { InputGroup } from "primeng/inputgroup";
import { InputGroupAddon } from "primeng/inputgroupaddon";
import { InputText } from "primeng/inputtext";
import { Menu } from "primeng/menu";
import { Toolbar } from "primeng/toolbar";
import { Tooltip } from "primeng/tooltip";
import { filter } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { HeaderService } from "../../../core/services/header.service";
import { LoggerService } from "../../../core/services/logger.service";
import { NotificationStateService } from "../../../core/services/notification-state.service";
import { SearchService } from "../../../core/services/search.service";
import { ThemeService } from "../../../core/services/theme.service";
import { TrainingStatsCalculationService } from "../../../core/services/training-stats-calculation.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { BadgeComponent } from "../badge/badge.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import {
  WeatherData,
  WeatherService,
} from "../../../core/services/weather.service";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { NotificationsPanelComponent } from "../notifications-panel/notifications-panel.component";
import { SearchPanelComponent } from "../search-panel/search-panel.component";

@Component({
  selector: "app-header",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    InputText,
    InputGroup,
    InputGroupAddon,
    Avatar,
    ButtonComponent,
    Tooltip,
    Toolbar,
    Menu,
    Dialog,
    SearchPanelComponent,
    NotificationsPanelComponent,
    IconButtonComponent,
    BadgeComponent,
    StatusTagComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationStateService);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private trainingStatsService = inject(TrainingStatsCalculationService);
  private weatherService = inject(WeatherService);
  private confirmDialog = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  notificationsPanel =
    viewChild<NotificationsPanelComponent>("notificationsPanel");
  userMenu = viewChild<import("primeng/menu").Menu>("userMenu");

  // Close user menu on Escape
  @HostListener("document:keydown.escape")
  onEscapePress(): void {
    if (this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
    if (this.showShortcutsDialog()) {
      this.showShortcutsDialog.set(false);
    }
  }

  // Show shortcuts dialog on "?"
  @HostListener("document:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent): void {
    // Show shortcuts on "?" (Shift + /)
    if (event.key === "?" && !this.isInputFocused()) {
      event.preventDefault();
      this.showShortcutsDialog.set(true);
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

  // Keyboard shortcuts dialog
  showShortcutsDialog = signal(false);
  shortcuts = [
    {
      key: "⌘K / Ctrl+K",
      description: "Open Global Search",
      icon: "pi-search",
    },
    { key: "⌘D / Ctrl+D", description: "Go to Dashboard", icon: "pi-home" },
    { key: "⌘T / Ctrl+T", description: "Go to Training", icon: "pi-bolt" },
    {
      key: "⌘N / Ctrl+N",
      description: "Toggle Notifications",
      icon: "pi-bell",
    },
    { key: "Escape", description: "Close Dialogs/Menus", icon: "pi-times" },
    {
      key: "?",
      description: "Show Keyboard Shortcuts",
      icon: "pi-question-circle",
    },
  ];

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

  // Weather data for header widget
  weatherData = signal<WeatherData | null>(null);
  weatherLoading = signal(false);

  // Dev-only API health indicator
  readonly showApiStatus = isDevMode();
  apiHealthStatus = signal<"checking" | "healthy" | "degraded" | "down">(
    "checking",
  );
  apiHealthLatencyMs = signal<number | null>(null);
  private apiHealthInterval: ReturnType<typeof setInterval> | null = null;

  // Computed weather location from API response, with fallback
  weatherLocation = computed(() => {
    const data = this.weatherData();
    return data?.location || "Training Ground";
  });

  // Computed weather icon based on condition
  weatherIcon = computed(() => {
    const data = this.weatherData();
    if (!data) return "pi-cloud";

    const condition = data.condition?.toLowerCase() || "";
    if (condition.includes("sun") || condition.includes("clear"))
      return "pi-sun";
    if (condition.includes("cloud")) return "pi-cloud";
    if (condition.includes("rain")) return "pi-cloud";
    if (condition.includes("snow")) return "pi-snowflake";
    if (condition.includes("storm") || condition.includes("thunder"))
      return "pi-bolt";
    return "pi-cloud";
  });

  // Weather tooltip with more details
  weatherTooltip = computed(() => {
    const data = this.weatherData();
    if (!data) return "Weather data unavailable";

    let tooltip = `${data.condition} - ${data.temp}°F`;
    if (data.humidity) tooltip += ` | Humidity: ${data.humidity}%`;
    if (data.description) tooltip += `\n${data.description}`;
    return tooltip;
  });

  apiHealthLabel = computed(() => {
    switch (this.apiHealthStatus()) {
      case "healthy":
        return "API OK";
      case "degraded":
        return "API Slow";
      case "down":
        return "API Down";
      default:
        return "API Check";
    }
  });

  apiHealthSeverity = computed(() => {
    switch (this.apiHealthStatus()) {
      case "healthy":
        return "success";
      case "degraded":
        return "warning";
      case "down":
        return "danger";
      default:
        return "info";
    }
  });

  apiHealthTooltip = computed(() => {
    const latency = this.apiHealthLatencyMs();
    if (this.apiHealthStatus() === "healthy") {
      return latency ? `API healthy · ${Math.round(latency)}ms` : "API healthy";
    }
    if (this.apiHealthStatus() === "degraded") {
      return latency
        ? `API slow · ${Math.round(latency)}ms`
        : "API responding slowly";
    }
    if (this.apiHealthStatus() === "down") {
      return "API unreachable · run netlify dev";
    }
    return "Checking API health...";
  });

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

  ngOnInit(): void {
    this.loadWeatherData();
    if (this.showApiStatus) {
      this.checkApiHealth();
      this.apiHealthInterval = setInterval(
        () => this.checkApiHealth(),
        60000,
      );
    }
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
    const panel = this.notificationsPanel();
    if (panel) {
      panel.toggle();
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
    const menu = this.userMenu();
    if (menu) {
      menu.toggle(event);
    }
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    const menu = this.userMenu();
    if (menu) {
      menu.hide();
    }
    this.isUserMenuOpen.set(false);
  }

  navigateTo(path: string): void {
    this.closeUserMenu();
    this.router.navigate([path]);
  }

  async logout(): Promise<void> {
    this.closeUserMenu();
    const confirmed = await this.confirmDialog.confirmLogout();
    if (!confirmed) return;
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
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
    const role = (user as { role?: string } | null)?.role || "Player";
    this.userRole.set(role.charAt(0).toUpperCase() + role.slice(1));

    // Load real user stats from training service
    this.loadUserStats();
  }

  private loadUserStats(): void {
    // Fetch real training stats from the service
    this.trainingStatsService
      .getTrainingStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return (
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      activeElement?.getAttribute("contenteditable") === "true"
    );
  }

  private loadWeatherData(): void {
    this.weatherLoading.set(true);

    // Try to get user's geolocation for accurate weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Got location, fetch weather with coordinates
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          this.fetchWeatherWithCoords(coords);
        },
        () => {
          // Geolocation denied or failed, use default location
          this.fetchWeatherByLocation();
        },
        { timeout: 5000, enableHighAccuracy: false },
      );
    } else {
      // Geolocation not supported
      this.fetchWeatherByLocation();
    }
  }

  private fetchWeatherWithCoords(coords: { lat: number; lon: number }): void {
    this.weatherService
      .getWeatherData(undefined, coords)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.weatherData.set(data);
          }
          this.weatherLoading.set(false);
        },
        error: (err) => {
          this.logger.error("Failed to load weather data with coords:", err);
          // Fallback to location-based
          this.fetchWeatherByLocation();
        },
      });
  }

  private fetchWeatherByLocation(): void {
    // Don't pass a location - let the API use its defaults
    // The actual location will be returned in the response
    this.weatherService
      .getWeatherData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.weatherData.set(data);
          this.weatherLoading.set(false);
        },
        error: (err) => {
          this.logger.error("Failed to load weather data:", err);
          this.weatherData.set(null);
          this.weatherLoading.set(false);
        },
      });
  }

  getWeatherSeverityClass(): string {
    const data = this.weatherData();
    if (!data) return "";

    switch (data.suitability) {
      case "excellent":
        return "weather-excellent";
      case "good":
        return "weather-good";
      case "fair":
        return "weather-fair";
      case "poor":
        return "weather-poor";
      default:
        return "";
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.apiHealthInterval) {
      clearInterval(this.apiHealthInterval);
    }
  }

  private checkApiHealth(): void {
    const start = performance.now();
    this.api
      .head("/api/health", {
        headers: { "Cache-Control": "no-store" },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const latency = performance.now() - start;
          this.apiHealthLatencyMs.set(latency);
          this.apiHealthStatus.set(latency > 1500 ? "degraded" : "healthy");
        },
        error: () => {
          this.apiHealthLatencyMs.set(null);
          this.apiHealthStatus.set("down");
        },
      });
  }
}
