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
} from "@angular/core";

import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { filter } from "rxjs/operators";
import { AuthService } from "../../../core/services/auth.service";
import {
    HeaderService
} from "../../../core/services/header.service";
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
  imports: [
    RouterModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    SearchPanelComponent,
    NotificationsPanelComponent,
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

        <!-- Olympic Countdown (replaces logo) -->
        @if (config().showLogo) {
          <div class="olympic-countdown-header">
            <div class="countdown-label-header">
              <span class="countdown-event">LA28 OLYMPICS</span>
            </div>
            <div class="countdown-timer-header">
              <div class="countdown-segment-header">
                <span class="countdown-value-header">{{ olympicCountdown().days }}</span>
                <span class="countdown-unit-header">D</span>
              </div>
              <span class="countdown-sep">:</span>
              <div class="countdown-segment-header">
                <span class="countdown-value-header">{{ formatNumber(olympicCountdown().hours) }}</span>
                <span class="countdown-unit-header">H</span>
              </div>
              <span class="countdown-sep">:</span>
              <div class="countdown-segment-header">
                <span class="countdown-value-header">{{ formatNumber(olympicCountdown().minutes) }}</span>
                <span class="countdown-unit-header">M</span>
              </div>
              <span class="countdown-sep">:</span>
              <div class="countdown-segment-header">
                <span class="countdown-value-header">{{ formatNumber(olympicCountdown().seconds) }}</span>
                <span class="countdown-unit-header">S</span>
              </div>
            </div>
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
                id="header-search-left"
                name="search"
                type="search"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
                autocomplete="off"
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
                id="header-search-center"
                name="search"
                type="search"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
                autocomplete="off"
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
                id="header-search-right"
                name="search"
                type="search"
                pInputText
                [placeholder]="config().searchPlaceholder || 'Search...'"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (keyup.enter)="onSearch()"
                class="search-input"
                aria-label="Search"
                autocomplete="off"
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
            [icon]="themeIcon()"
            [text]="true"
            [rounded]="true"
            (onClick)="cycleTheme()"
            [ariaLabel]="themeAriaLabel()"
            class="header-icon-btn"
            [pTooltip]="themeTooltip()"
            tooltipPosition="bottom"
          ></p-button>
          <span class="theme-label">{{ themeLabel() }}</span>
        </div>

        <!-- User Menu -->
        <div class="user-menu-container">
          <button 
            class="user-avatar-wrapper" 
            (click)="toggleUserMenu()"
            [attr.aria-expanded]="isUserMenuOpen()"
            aria-haspopup="true"
            aria-label="User menu"
          >
            <p-avatar
              [label]="userInitials()"
              shape="circle"
              size="large"
              styleClass="user-avatar-inner"
            ></p-avatar>
          </button>
          
          <!-- Custom User Dropdown -->
          @if (isUserMenuOpen()) {
            <div class="user-dropdown" (click)="$event.stopPropagation()">
              <!-- User Info Header -->
              <div class="user-dropdown-header">
                <div class="user-dropdown-avatar">
                  <p-avatar
                    [label]="userInitials()"
                    shape="circle"
                    size="xlarge"
                    styleClass="dropdown-avatar-inner"
                  ></p-avatar>
                </div>
                <div class="user-dropdown-info">
                  <span class="user-dropdown-name">{{ userName() }}</span>
                  <span class="user-dropdown-email">{{ userEmail() }}</span>
                  <span class="user-dropdown-role">{{ userRole() }}</span>
                </div>
              </div>
              
              <!-- Menu Items -->
              <div class="user-dropdown-menu">
                <button class="user-dropdown-item" (click)="navigateTo('/profile')">
                  <i class="pi pi-user"></i>
                  <span>My Profile</span>
                  <i class="pi pi-chevron-right item-arrow"></i>
                </button>
                <button class="user-dropdown-item" (click)="navigateTo('/settings')">
                  <i class="pi pi-cog"></i>
                  <span>Settings</span>
                  <i class="pi pi-chevron-right item-arrow"></i>
                </button>
                <button class="user-dropdown-item" (click)="navigateTo('/settings/privacy')">
                  <i class="pi pi-shield"></i>
                  <span>Privacy & Security</span>
                  <i class="pi pi-chevron-right item-arrow"></i>
                </button>
              </div>
              
              <!-- Quick Stats -->
              <div class="user-dropdown-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ userStats().trainingSessions }}</span>
                  <span class="stat-label">Sessions</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ userStats().streak }}</span>
                  <span class="stat-label">Day Streak</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ userStats().level }}</span>
                  <span class="stat-label">Level</span>
                </div>
              </div>
              
              <!-- Logout -->
              <div class="user-dropdown-footer">
                <button class="logout-btn" (click)="logout()">
                  <i class="pi pi-sign-out"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
    
    <!-- Backdrop for closing menu -->
    @if (isUserMenuOpen()) {
      <div class="user-menu-backdrop" (click)="closeUserMenu()"></div>
    }

    <!-- Search Panel -->
    <app-search-panel></app-search-panel>

    <!-- Notifications Panel -->
    <app-notifications-panel #notificationsPanel></app-notifications-panel>
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
        min-width: 44px; /* WCAG touch target minimum */
        min-height: 44px;
      }

      /* Olympic Countdown in Header */
      .olympic-countdown-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, rgba(8, 153, 73, 0.08) 0%, rgba(8, 153, 73, 0.02) 100%);
        border: 1px solid rgba(8, 153, 73, 0.15);
        border-radius: 12px;
      }

      .countdown-label-header {
        display: flex;
        flex-direction: column;
      }

      .countdown-event {
        font-family: 'Poppins', sans-serif;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--ds-primary-green, #089949);
        text-transform: uppercase;
      }

      .countdown-timer-header {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .countdown-segment-header {
        display: flex;
        align-items: baseline;
        gap: 0.125rem;
      }

      .countdown-value-header {
        font-family: 'JetBrains Mono', 'SF Mono', monospace;
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--color-text-primary, #1a1a1a);
        font-variant-numeric: tabular-nums;
        min-width: 1.5ch;
      }

      .countdown-unit-header {
        font-family: 'Poppins', sans-serif;
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--color-text-secondary, #6b7280);
        text-transform: uppercase;
      }

      .countdown-sep {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-tertiary, #9ca3af);
        padding: 0 0.125rem;
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
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-wrapper i {
        position: absolute;
        left: 1rem;
        color: var(--text-tertiary, #64748b);
        font-size: 1rem;
        z-index: 1;
        pointer-events: none;
      }

      .search-input {
        width: 300px;
        max-width: 100%;
        transition: all 0.3s ease;
        padding-left: 2.75rem !important;
        border-radius: 12px !important;
        border: 1px solid var(--p-surface-200, #333) !important;
        background: var(--p-surface-50, #1a1f2e) !important;
        height: 44px;
      }

      .search-input::placeholder {
        color: var(--text-tertiary, #64748b);
      }

      .search-input:focus {
        width: 400px;
        border-color: var(--ds-primary-green, #089949) !important;
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.15) !important;
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

      /* User Menu Container */
      .user-menu-container {
        position: relative;
      }

      /* User Avatar Button */
      .user-avatar-wrapper {
        cursor: pointer;
        padding: 3px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--ds-primary-green-light, #0ab85a) 0%, var(--ds-primary-green, #089949) 100%);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: var(--space-2);
        border: none;
      }

      .user-avatar-wrapper:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.35);
      }

      .user-avatar-wrapper:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
      }

      :host ::ng-deep .user-avatar-inner {
        width: 40px !important;
        height: 40px !important;
        background: linear-gradient(135deg, var(--ds-primary-green, #089949) 0%, var(--ds-primary-green-dark, #067a3b) 100%) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        letter-spacing: 0.5px;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      :host ::ng-deep .user-avatar-inner .p-avatar-text {
        font-weight: 700;
        letter-spacing: 1px;
      }

      /* User Dropdown Menu */
      .user-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: 320px;
        background: var(--surface-primary, #ffffff);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        z-index: 1100;
        overflow: hidden;
        animation: dropdownSlideIn 0.2s ease-out;
      }

      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Dropdown Header with User Info */
      .user-dropdown-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, rgba(8, 153, 73, 0.08) 0%, rgba(8, 153, 73, 0.02) 100%);
        border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
      }

      .user-dropdown-avatar {
        flex-shrink: 0;
      }

      :host ::ng-deep .dropdown-avatar-inner {
        width: 56px !important;
        height: 56px !important;
        background: linear-gradient(135deg, var(--ds-primary-green, #089949) 0%, var(--ds-primary-green-dark, #067a3b) 100%) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        font-size: 1.25rem !important;
        letter-spacing: 1px;
        border: 3px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .user-dropdown-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
        flex: 1;
      }

      .user-dropdown-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-dropdown-email {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-dropdown-role {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ds-primary-green, #089949);
        background: rgba(8, 153, 73, 0.12);
        padding: 0.125rem 0.5rem;
        border-radius: 6px;
        width: fit-content;
        margin-top: 0.25rem;
      }

      /* Dropdown Menu Items */
      .user-dropdown-menu {
        padding: 0.5rem;
      }

      .user-dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        width: 100%;
        padding: 0.875rem 1rem;
        background: transparent;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        color: var(--color-text-primary, #1a1a1a);
        text-align: left;
      }

      .user-dropdown-item:hover {
        background: var(--surface-secondary, #f8f8f8);
      }

      .user-dropdown-item:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: -2px;
      }

      .user-dropdown-item i:first-child {
        width: 20px;
        font-size: 1.125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .user-dropdown-item span {
        flex: 1;
        font-weight: 500;
      }

      .user-dropdown-item .item-arrow {
        font-size: 0.75rem;
        color: var(--color-text-tertiary, #9ca3af);
        opacity: 0;
        transform: translateX(-4px);
        transition: all 0.15s ease;
      }

      .user-dropdown-item:hover .item-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      .user-dropdown-item:hover i:first-child {
        color: var(--ds-primary-green, #089949);
      }

      /* Quick Stats */
      .user-dropdown-stats {
        display: flex;
        justify-content: space-around;
        padding: 1rem;
        background: var(--surface-secondary, #f8f8f8);
        border-top: 1px solid var(--color-border-secondary, #f0f0f0);
        border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
      }

      .stat-value {
        font-family: 'Poppins', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--ds-primary-green, #089949);
      }

      .stat-label {
        font-size: 0.6875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--color-text-secondary, #6b7280);
      }

      /* Logout Footer */
      .user-dropdown-footer {
        padding: 0.75rem 1rem;
      }

      .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.75rem;
        background: transparent;
        border: 2px solid var(--color-border-primary, #e0e0e0);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-secondary, #6b7280);
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.08);
        border-color: #ef4444;
        color: #ef4444;
      }

      .logout-btn:focus-visible {
        outline: 2px solid #ef4444;
        outline-offset: 2px;
      }

      .logout-btn i {
        font-size: 1.125rem;
      }

      /* Backdrop */
      .user-menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1050;
        background: transparent;
      }

      .header-icon-btn {
        width: 2.75rem; /* 44px - WCAG touch target minimum */
        height: 2.75rem;
        min-width: 2.75rem;
        min-height: 2.75rem;
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

        /* User Dropdown - Fullscreen on mobile */
        .user-dropdown {
          position: fixed;
          top: auto;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-height: 85vh;
          border-radius: 20px 20px 0 0;
          animation: dropdownSlideUp 0.3s ease-out;
          overflow-y: auto;
        }

        @keyframes dropdownSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .user-menu-backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .user-dropdown-header {
          padding: 1.5rem;
        }

        :host ::ng-deep .dropdown-avatar-inner {
          width: 64px !important;
          height: 64px !important;
          font-size: 1.5rem !important;
        }

        .user-dropdown-name {
          font-size: 1.125rem;
        }

        .user-dropdown-menu {
          padding: 0.75rem;
        }

        .user-dropdown-item {
          padding: 1rem 1.25rem;
        }

        .user-dropdown-stats {
          padding: 1.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
        }

        .user-dropdown-footer {
          padding: 1rem 1.25rem 1.5rem;
          padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0));
        }

        .logout-btn {
          padding: 1rem;
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

        .header-icon-btn {
          width: 2.5rem;
          height: 2.5rem;
          min-width: 2.5rem;
          min-height: 2.5rem;
        }
      }
    `,
  ],
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

  @ViewChild('notificationsPanel') notificationsPanel!: NotificationsPanelComponent;

  // Close user menu on Escape
  @HostListener('document:keydown.escape')
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

  // Olympic countdown - LA 2028 Opening Ceremony: July 14, 2028
  olympicCountdown = signal({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  private olympicDate = new Date('2028-07-14T20:00:00-07:00'); // Pacific Time
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
  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
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
    if (logoContainer && !logoContainer.querySelector('.logo-text')) {
      const textLogo = document.createElement('span');
      textLogo.className = 'logo-text';
      textLogo.innerHTML = '<i class="pi pi-football" style="margin-right: 8px; color: var(--ds-primary-green);"></i>FlagFit Pro';
      textLogo.style.cssText = 'font-weight: 700; font-size: 1.25rem; color: var(--text-primary); display: flex; align-items: center;';
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
      this.userName.set(user.email.split('@')[0]);
    }

    // Set email
    if (user?.email) {
      this.userEmail.set(user.email);
    }

    // Set role (from user data or default)
    const role = (user as any)?.role || 'Player';
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
          level: level
        });
      },
      error: (err) => {
        this.logger.error('Failed to load user stats:', err);
        // Keep default zeros on error
        this.userStats.set({
          trainingSessions: 0,
          streak: 0,
          level: 0
        });
      }
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
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
    return num.toString().padStart(2, '0');
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
