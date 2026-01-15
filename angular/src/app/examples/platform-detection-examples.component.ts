/**
 * Example Component with iOS Platform Detection
 *
 * This example shows three ways to use platform detection:
 * 1. Host bindings
 * 2. PlatformHostDirective
 * 3. Service injection
 */

import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlatformDetectionService } from "../core/services/platform-detection.service";
import { PlatformHostDirective } from "../shared/directives/platform-host.directive";

// ============================================================================
// METHOD 1: Manual Host Bindings
// ============================================================================

@Component({
  selector: "app-example-manual-host",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Platform Detection - Manual Host Bindings</h2>
      <p>This component has platform classes on its host element</p>

      <div class="platform-info">
        <p>Check this component's host element in DevTools</p>
        <p>It will have classes like: .platform-ios, .browser-safari</p>
      </div>

      <!-- This will use platform-specific styles -->
      <div class="flex flex-wrap gap-2">
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 1rem;
      }

      // Platform-specific styles
      :host(.platform-ios) {
        .flex-wrap {
          // iOS fix for gap with flex-wrap
          gap: 0 !important;
          margin: -0.5rem;

          > * {
            margin: 0.5rem;
          }
        }
      }

      .item {
        padding: 1rem;
        background: var(--surface-100);
        border-radius: 0.5rem;
      }
    `,
  ],
  // Manual host bindings
  host: {
    "[class.platform-ios]": "platformService.isIOS()",
    "[class.platform-android]": "platformService.isAndroid()",
    "[class.browser-safari]": "platformService.isSafari()",
    "[class.platform-mobile]": "platformService.isMobile()",
  },
})
export class ExampleManualHostComponent {
  platformService = inject(PlatformDetectionService);
}

// ============================================================================
// METHOD 2: Using PlatformHostDirective (Recommended)
// ============================================================================

@Component({
  selector: "app-example-directive-host",
  standalone: true,
  imports: [CommonModule],
  // Automatically adds all platform classes
  hostDirectives: [PlatformHostDirective],
  template: `
    <div class="container">
      <h2>Platform Detection - Directive Host</h2>
      <p>This component uses PlatformHostDirective</p>

      <div class="platform-info">
        <p>Platform classes are automatically added!</p>
      </div>

      <!-- This will use platform-specific styles -->
      <div class="flex flex-wrap gap-2">
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
        <div class="item">Item 4</div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 1rem;
      }

      // Platform-specific styles automatically work
      :host(.platform-ios) {
        .flex-wrap {
          gap: 0 !important;
          margin: -0.5rem;
          > * {
            margin: 0.5rem;
          }
        }
      }

      .item {
        padding: 1rem;
        background: var(--surface-200);
        border-radius: 0.5rem;
      }
    `,
  ],
})
export class ExampleDirectiveHostComponent {
  // No need to inject service if only using styles
}

// ============================================================================
// METHOD 3: Service Injection for Conditional Logic
// ============================================================================

@Component({
  selector: "app-example-service-logic",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Platform Detection - Service Logic</h2>
      <p>This component uses service for conditional rendering</p>

      <div class="platform-info">
        <div class="info-row">
          <span class="label">Platform:</span>
          <span class="value">{{
            platformInfo.isIOS
              ? "iOS"
              : platformInfo.isAndroid
                ? "Android"
                : "Desktop"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">Browser:</span>
          <span class="value">{{
            platformInfo.isSafari
              ? "Safari"
              : platformInfo.isChrome
                ? "Chrome"
                : "Other"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">Device:</span>
          <span class="value">{{
            platformInfo.isMobile
              ? "Mobile"
              : platformInfo.isTablet
                ? "Tablet"
                : "Desktop"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">OS Version:</span>
          <span class="value">{{ platformInfo.osVersion || "Unknown" }}</span>
        </div>
      </div>

      <!-- Conditional rendering based on platform -->
      @if (platformInfo.isIOS) {
        <div class="ios-warning">
          ⚠️ iOS detected - Using margin-based spacing instead of gap
        </div>
      }

      <!-- Platform-specific layout -->
      <div
        [class]="
          platformInfo.isIOS
            ? 'flex flex-wrap gap-ios-2'
            : 'flex flex-wrap gap-2'
        "
      >
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
        <div class="item">Item 4</div>
        <div class="item">Item 5</div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 1rem;
      }

      .platform-info {
        background: var(--surface-50);
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
      }

      .info-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        .label {
          font-weight: 600;
          min-width: 100px;
        }

        .value {
          color: var(--text-color-secondary);
        }
      }

      .ios-warning {
        background: var(--yellow-100);
        color: var(--yellow-900);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        border-left: 4px solid var(--yellow-500);
      }

      .item {
        padding: 1rem;
        background: var(--surface-300);
        border-radius: 0.5rem;
        min-width: 100px;
      }
    `,
  ],
})
export class ExampleServiceLogicComponent {
  private platformService = inject(PlatformDetectionService);

  // Expose platform info to template
  platformInfo = this.platformService.getPlatformInfo();

  constructor() {
    // Log platform info on component init
    console.log("🔍 [ExampleComponent] Platform info:", this.platformInfo);

    // Conditional logic based on platform
    if (this.platformService.isIOS()) {
      console.log("📱 Running on iOS - applying iOS-specific optimizations");
      this.applyIOSOptimizations();
    }
  }

  private applyIOSOptimizations(): void {
    // iOS-specific logic here
    // e.g., disable animations, adjust touch targets, etc.
    console.log("✅ iOS optimizations applied");
  }
}

// ============================================================================
// COMPLETE EXAMPLE: Real-World Component
// ============================================================================

@Component({
  selector: "app-dashboard-card",
  standalone: true,
  imports: [CommonModule],
  hostDirectives: [PlatformHostDirective],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>{{ title }}</h3>
        @if (platformInfo.isIOS) {
          <span class="ios-badge">iOS</span>
        }
      </div>

      <div class="card-content">
        <!-- Stats grid with platform-aware gap -->
        <div [class]="getStatsGridClass()">
          <div class="stat">
            <div class="stat-block__label">Sessions</div>
            <div class="stat-block__value">24</div>
          </div>
          <div class="stat">
            <div class="stat-block__label">Minutes</div>
            <div class="stat-block__value">480</div>
          </div>
          <div class="stat">
            <div class="stat-block__label">Load</div>
            <div class="stat-block__value">3.2k</div>
          </div>
        </div>

        <!-- Actions with platform-aware spacing -->
        <div [class]="getActionsClass()">
          <button class="btn btn-primary">View Details</button>
          <button class="btn btn-secondary">Export</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .card {
        background: var(--surface-card);
        border-radius: var(--border-radius);
        padding: 1rem;
        box-shadow: var(--card-shadow);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .ios-badge {
          background: var(--blue-500);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
      }

      .stat {
        padding: 0.75rem;
        background: var(--surface-100);
        border-radius: 0.5rem;
        text-align: center;

        .stat-block__label {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-block__value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary-color);
        }
      }

      // Platform-specific fixes
      :host(.platform-ios) {
        // Fix gap issues on iOS
        .flex.gap-2,
        .flex.gap-3 {
          gap: 0 !important;
          margin: -0.5rem;

          > * {
            margin: 0.5rem;
          }
        }
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &.btn-primary {
          background: var(--primary-color);
          color: white;
        }

        &.btn-secondary {
          background: var(--surface-200);
          color: var(--text-color);
        }
      }
    `,
  ],
})
export class DashboardCardComponent {
  private platformService = inject(PlatformDetectionService);

  platformInfo = this.platformService.getPlatformInfo();
  title = "Training Statistics";

  /**
   * Get platform-aware class for stats grid
   */
  getStatsGridClass(): string {
    const baseClass = "flex flex-wrap";
    const gapClass = this.platformInfo.isIOS ? "gap-ios-2" : "gap-2";
    return `${baseClass} ${gapClass}`;
  }

  /**
   * Get platform-aware class for actions
   */
  getActionsClass(): string {
    const baseClass = "flex flex-wrap";
    const gapClass = this.platformInfo.isIOS ? "gap-ios-2" : "gap-2";
    const marginClass = this.platformInfo.isMobile ? "mt-3" : "mt-4";
    return `${baseClass} ${gapClass} ${marginClass}`;
  }
}
