/**
 * Data Source Banner Component
 *
 * CRITICAL SAFETY COMPONENT
 *
 * Displays prominent warnings when:
 * - Using mock/demo data (could lead to injury if acted upon)
 * - Insufficient data for reliable calculations
 * - First-time user with no data entries
 *
 * This component should be placed at the top of any dashboard
 * or page that displays performance metrics.
 */

import { Component, input, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { RouterModule } from "@angular/router";
import { DataSourceService, DataSourceType } from "../../core/services/data-source.service";

export type BannerSeverity = "info" | "warning" | "danger" | "success";

@Component({
  selector: "app-data-source-banner",
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  template: `
    @if (shouldShow()) {
      <div
        class="data-source-banner"
        [class.banner-info]="severity() === 'info'"
        [class.banner-warning]="severity() === 'warning'"
        [class.banner-danger]="severity() === 'danger'"
        [class.banner-success]="severity() === 'success'"
        role="alert"
        [attr.aria-live]="severity() === 'danger' ? 'assertive' : 'polite'"
      >
        <div class="banner-content">
          <div class="banner-icon">
            <i [class]="iconClass()"></i>
          </div>
          <div class="banner-text">
            <strong class="banner-title">{{ title() }}</strong>
            <p class="banner-message">{{ message() }}</p>
          </div>
        </div>
        <div class="banner-actions">
          @if (showAction() && actionRoute()) {
            <p-button
              [label]="actionLabel()"
              [icon]="actionIcon()"
              [routerLink]="actionRoute()"
              [outlined]="true"
              size="small"
              styleClass="banner-action-btn"
            ></p-button>
          }
          @if (dismissible()) {
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              size="small"
              (onClick)="dismiss()"
              ariaLabel="Dismiss banner"
            ></p-button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .data-source-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-4);
        gap: var(--space-4);
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .banner-info {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border: 1px solid #2196f3;
        color: #1565c0;
      }

      .banner-warning {
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        border: 1px solid #ff9800;
        color: #e65100;
      }

      .banner-danger {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border: 2px solid #f44336;
        color: #c62828;
      }

      .banner-success {
        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        border: 1px solid #4caf50;
        color: #2e7d32;
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex: 1;
      }

      .banner-icon {
        font-size: var(--icon-2xl);
        flex-shrink: 0;
      }

      .banner-danger .banner-icon {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .banner-text {
        flex: 1;
      }

      .banner-title {
        display: block;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
      }

      .banner-message {
        font-size: var(--font-body-sm);
        margin: 0;
        opacity: 0.9;
      }

      .banner-actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .banner-action-btn {
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .data-source-banner {
          flex-direction: column;
          align-items: flex-start;
        }

        .banner-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class DataSourceBannerComponent {
  private dataSourceService = inject(DataSourceService);

  // Inputs for manual override (optional)
  customTitle = input<string | null>(null);
  customMessage = input<string | null>(null);
  customSeverity = input<BannerSeverity | null>(null);
  forMetric = input<string | null>(null); // Specific metric to check
  dismissible = input<boolean>(true);
  showAction = input<boolean>(true);
  actionLabel = input<string>("Log Data");
  actionIcon = input<string>("pi pi-plus");
  actionRoute = input<string | null>("/training/log");

  // Internal state
  private dismissed = false;

  // Computed values based on data source service
  shouldShow = computed(() => {
    if (this.dismissed) return false;

    const source = this.dataSourceService.globalSource();
    const isDemoMode = this.dataSourceService.isDemoMode();

    // Always show if in demo mode or using mock data
    if (isDemoMode || source.source === "mock") return true;

    // Show if first-time user
    if (source.isFirstTimeUser) return true;

    // Show if not enough data
    if (!source.hasEnoughData) return true;

    // Check specific metric if provided
    const metricId = this.forMetric();
    if (metricId) {
      const metricSources = this.dataSourceService.metricSources();
      const metric = metricSources.get(metricId);
      if (metric && !metric.isReliable) return true;
    }

    return false;
  });

  severity = computed<BannerSeverity>(() => {
    if (this.customSeverity()) return this.customSeverity()!;

    const source = this.dataSourceService.globalSource();
    const isDemoMode = this.dataSourceService.isDemoMode();

    // Demo/mock data = danger (could cause injury)
    if (isDemoMode || source.source === "mock") return "danger";

    // First-time user = info (welcoming)
    if (source.isFirstTimeUser) return "info";

    // Not enough data = warning
    if (!source.hasEnoughData) return "warning";

    return "success";
  });

  title = computed(() => {
    if (this.customTitle()) return this.customTitle()!;

    const source = this.dataSourceService.globalSource();
    const isDemoMode = this.dataSourceService.isDemoMode();

    if (isDemoMode || source.source === "mock") {
      return "⚠️ Demo Data - Not Your Real Metrics";
    }

    if (source.isFirstTimeUser) {
      return "👋 Welcome! Start Tracking Your Performance";
    }

    if (!source.hasEnoughData) {
      return "📊 Building Your Performance Profile";
    }

    return "✅ Using Your Real Data";
  });

  message = computed(() => {
    if (this.customMessage()) return this.customMessage()!;

    const source = this.dataSourceService.globalSource();
    const isDemoMode = this.dataSourceService.isDemoMode();

    if (isDemoMode || source.source === "mock") {
      return "These metrics are for demonstration only. DO NOT make training decisions based on this data. Log your real workouts to see accurate metrics.";
    }

    if (source.isFirstTimeUser) {
      return "No training data logged yet. Start by logging your first workout to see personalized metrics and recommendations.";
    }

    if (!source.hasEnoughData) {
      const remaining = source.minimumDataRequired - source.realDataCount;
      return `You have ${source.realDataCount} entries. ${remaining} more needed for reliable ACWR and recovery calculations.`;
    }

    return "Your dashboard is showing metrics based on your logged training data.";
  });

  iconClass = computed(() => {
    const sev = this.severity();
    switch (sev) {
      case "danger":
        return "pi pi-exclamation-triangle";
      case "warning":
        return "pi pi-info-circle";
      case "info":
        return "pi pi-user-plus";
      case "success":
        return "pi pi-check-circle";
      default:
        return "pi pi-info-circle";
    }
  });

  dismiss(): void {
    this.dismissed = true;
  }
}
