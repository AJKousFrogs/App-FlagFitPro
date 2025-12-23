import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
  output,
  computed,
  effect,
  model,
} from "@angular/core";

import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { toSignal } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { AvatarModule } from "primeng/avatar";
import { MenuModule } from "primeng/menu";
import { BadgeModule } from "primeng/badge";
import { AuthService } from "../../../core/services/auth.service";
import {
  HeaderService,
  HeaderConfig,
} from "../../../core/services/header.service";
import { MenuItem } from "primeng/api";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-header",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    MenuModule,
    BadgeModule,
  ],
  template: `
    <header class="app-header" [class]="headerClass()">
      <!-- Left Section -->
      <div class="header-left">
        <!-- Mobile Menu Toggle -->
        <button
          type="button"
          class="mobile-menu-toggle"
          (click)="onToggleSidebar()"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
        >
          <i class="pi pi-bars"></i>
        </button>

        <!-- Logo (conditional) -->
        @if (config().showLogo) {
          <div class="logo-container">
            <img
              src="/assets/images/flagfit-logo.svg"
              alt="FlagFit Pro"
              class="logo"
              (error)="onLogoError($event)"
            />
          </div>
        }

        <!-- Breadcrumbs (conditional) -->
        @if (config().showBreadcrumbs) {
          <nav class="breadcrumbs">
            <span class="breadcrumb-item">{{ currentSection() }}</span>
            @if (currentPage()) {
              <i class="pi pi-chevron-right separator"></i>
            }
            @if (currentPage()) {
              <span class="breadcrumb-item current">{{ currentPage() }}</span>
            }
          </nav>
        }

        <!-- Search (left position) -->
        @if (config().searchPosition === "left") {
          <div class="search-container">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
              />
            </span>
          </div>
        }
      </div>

      <!-- Center Section -->
      <div class="header-center">
        <!-- Search (center position) -->
        @if (config().searchPosition === "center") {
          <div class="search-container">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
              />
            </span>
          </div>
        }
      </div>

      <!-- Right Section -->
      <div class="header-right">
        <!-- Search (right position) -->
        @if (config().searchPosition === "right") {
          <div class="search-container">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
              />
            </span>
          </div>
        }

        <!-- Notifications -->
        <p-button
          icon="pi pi-bell"
          [text]="true"
          [rounded]="true"
          [badge]="
            notificationCount() > 0 ? notificationCount().toString() : undefined
          "
          badgeClass="p-badge-danger"
          (onClick)="toggleNotifications()"
          ariaLabel="Notifications"
          class="header-icon-btn"
        ></p-button>

        <!-- Settings -->
        <p-button
          icon="pi pi-cog"
          [text]="true"
          [rounded]="true"
          (onClick)="openSettings()"
          ariaLabel="Settings"
          class="header-icon-btn"
        ></p-button>

        <!-- Theme Toggle -->
        <div class="theme-toggle">
          <p-button
            [icon]="isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'"
            [text]="true"
            [rounded]="true"
            (onClick)="toggleTheme()"
            [ariaLabel]="
              isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'
            "
            class="header-icon-btn"
          ></p-button>
          <span class="theme-label">{{
            isDarkTheme() ? "Dark" : "Light"
          }}</span>
        </div>

        <!-- User Menu -->
        <p-menu #userMenu [model]="userMenuItems()" [popup]="true"></p-menu>
        <p-avatar
          [label]="userInitials()"
          shape="circle"
          [style]="{
            'background-color': 'var(--ds-primary-green)',
            color: 'var(--color-text-on-primary)',
          }"
          (click)="userMenu.toggle($event)"
          class="user-avatar"
        ></p-avatar>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        display: flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: var(--surface-primary);
        border-bottom: 1px solid var(--p-surface-200);
        height: var(--header-height, 70px);
        position: sticky;
        top: 0;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .header-left,
      .header-center,
      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .header-left {
        flex: 0 0 auto;
        min-width: 0;
      }

      .header-center {
        flex: 1 1 auto;
        justify-content: center;
        padding: 0 2rem;
      }

      .header-right {
        flex: 0 0 auto;
        justify-content: flex-end;
      }

      .mobile-menu-toggle {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--space-2);
        color: var(--text-primary);
      }

      /* Logo Styles */
      .logo-container {
        display: flex;
        align-items: center;
      }

      .logo {
        height: 40px;
        width: auto;
      }

      /* Breadcrumbs */
      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 1rem;
      }

      .breadcrumb-item {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }

      .breadcrumb-item.current {
        color: var(--text-color);
        font-weight: 500;
      }

      .separator {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
      }

      /* Search Styles */
      .search-container {
        position: relative;
      }

      .search-wrapper {
        width: 100%;
      }

      .search-input {
        width: 300px;
        max-width: 100%;
        transition: width 0.3s ease;
      }

      .search-input:focus {
        width: 400px;
      }

      /* Theme Toggle */
      .theme-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .theme-label {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
        min-width: 35px;
      }

      /* User Avatar */
      .user-avatar {
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .user-avatar:hover {
        transform: scale(1.05);
      }

      .header-icon-btn {
        width: 2.5rem;
        height: 2.5rem;
      }

      /* Variants */
      .app-header.variant-compact {
        height: 60px;
        padding: 0.5rem 1rem;
      }

      .app-header.variant-minimal {
        height: 50px;
        padding: 0.25rem 1rem;
        border-bottom: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .app-header {
          padding: 0.5rem 1rem;
        }

        .header-center {
          display: none; /* Hide center search on mobile */
        }

        .search-input {
          width: 200px;
        }

        .search-input:focus {
          width: 250px;
        }

        .theme-label {
          display: none; /* Hide theme label on mobile */
        }

        .breadcrumbs {
          display: none; /* Hide breadcrumbs on mobile */
        }

        .mobile-menu-toggle {
          display: block;
        }
      }

      @media (max-width: 480px) {
        .header-left .search-container,
        .header-right .search-container {
          display: none; /* Hide search completely on very small screens */
        }

        .header-right {
          gap: 0.5rem;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  toggleSidebar = output<void>();

  // Angular 21: Use model() for two-way binding (replaces ngModel)
  searchQuery = model("");

  notificationCount = signal(0);
  isDarkTheme = signal(false);
  userInitials = signal("JD");
  currentSection = signal("");
  currentPage = signal("");

  config = computed(() => this.headerService.getConfig()());

  headerClass = computed(() => `variant-${this.config().variant || "default"}`);

  userMenuItems = computed<MenuItem[]>(() => [
    {
      label: "Profile",
      icon: "pi pi-user",
      command: () => this.router.navigate(["/profile"]),
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      command: () => this.router.navigate(["/settings"]),
    },
    { separator: true },
    {
      label: "Logout",
      icon: "pi pi-sign-out",
      command: () => this.logout(),
    },
  ]);

  // Angular 21: Use toSignal() for router events instead of subscription
  private navigationEnd$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
  );

  private navigationEnd = toSignal(this.navigationEnd$, { initialValue: null });

  constructor() {
    // Angular 21: Initialize data in constructor
    this.updateBreadcrumbs();
    this.loadThemePreference();
    this.loadUserData();
    this.loadNotifications();

    // Angular 21: Use effect() for reactive side effects
    effect(() => {
      // React to navigation changes
      if (this.navigationEnd()) {
        this.updateBreadcrumbs();
      }
    });

    // Angular 21: Use effect() for theme changes
    effect(() => {
      const isDark = this.isDarkTheme();
      document.body.classList.toggle("dark-theme", isDark);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      }
    });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onSearch(): void {
    if (this.searchQuery().trim()) {
      // Implement search logic
      this.logger.debug("Searching for:", this.searchQuery());
      // TODO: Navigate to search results or trigger search service
    }
  }

  toggleNotifications(): void {
    // Toggle notifications panel
    // TODO: Implement notifications panel toggle
    this.logger.debug("Toggle notifications");
  }

  openSettings(): void {
    this.router.navigate(["/settings"]);
  }

  toggleTheme(): void {
    this.isDarkTheme.update((current) => !current);
    // Theme changes are handled by effect() in constructor
  }

  logout(): void {
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
    // Fallback if logo image doesn't exist
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
    // Could show text logo as fallback
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

  private loadThemePreference(): void {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme === "dark";
      this.isDarkTheme.set(isDark);
      // Theme application handled by effect()
    }
  }

  private loadUserData(): void {
    const user = this.authService.getUser();
    if (user?.name) {
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
    }
  }

  private loadNotifications(): void {
    // TODO: Load actual notification count from service
    // For now, set a mock value
    this.notificationCount.set(3);
  }
}
