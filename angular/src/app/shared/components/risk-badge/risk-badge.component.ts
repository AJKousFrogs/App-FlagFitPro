/**
 * Risk Badge Component
 *
 * Phase 3 - Unified Risk Indicator
 * Standardized component for displaying risk levels across all contexts
 *
 * Usage:
 * <app-risk-badge [level]="'high'" [showIcon]="true" [placement]="'top-right'"></app-risk-badge>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type RiskPlacement = "top-right" | "top-left" | "inline" | "banner";

@Component({
  selector: "app-risk-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule, StatusTagComponent],
  template: `
    <div
      class="risk-badge"
      [class]="'risk-' + level() + ' placement-' + placement()"
      [pTooltip]="tooltip() || getDefaultTooltip()"
      [tooltipPosition]="'top'"
    >
      @if (showIcon()) {
        <i [class]="getIconClass()" class="risk-icon"></i>
      }
      <span class="risk-label">{{ getLabel() }}</span>
      @if (showTag()) {
        <app-status-tag
          [value]="getLabel()"
          [severity]="getSeverity()"
          size="sm"
        />
      }
    </div>
  `,
  styles: [
    `
      .risk-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-family: var(--font-family-sans);
        font-size: var(--font-size-h4);
        font-weight: var(--font-weight-semibold);
        text-transform: none;
        letter-spacing: 0;
        line-height: var(--line-height-tight);
        min-height: var(--space-8);
        transition: all var(--motion-fast) var(--ease-standard);
      }

      /* Risk Level Colors - SEMANTIC RULE: Risk MUST be red ONLY */
      /* Severity is handled by intensity (opacity, size), NOT color */
      .risk-low {
        background: var(--color-status-error);
        color: var(--color-text-on-primary);
        opacity: 0.4; /* Subtle intensity for low risk */
      }

      .risk-moderate {
        background: var(--color-status-error);
        color: var(--color-text-on-primary);
        opacity: 0.6; /* Normal intensity for moderate risk */
      }

      .risk-high {
        background: var(--color-status-error);
        color: var(--color-text-on-primary);
        opacity: 0.9; /* Strong intensity for high risk */
      }

      .risk-critical {
        background: var(--color-status-error);
        color: var(--color-text-on-primary);
        opacity: 1; /* Full intensity for critical risk */
        animation: pulse-risk 2s infinite;
      }

      @keyframes pulse-risk {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      /* Placement Styles */
      .risk-badge.placement-top-right {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        z-index: 10;
      }

      .risk-badge.placement-top-left {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 10;
      }

      .risk-badge.placement-inline {
        display: inline-flex;
        position: static;
      }

      .risk-badge.placement-banner {
        width: 100%;
        justify-content: center;
        padding: var(--space-3) var(--space-4);
        font-size: var(--font-size-body);
      }

      .risk-icon {
        font-size: var(--font-caption-size);
      }

      .risk-label {
        font-weight: var(--font-weight-semibold);
      }

      .risk-tag {
        margin-left: var(--space-1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .risk-badge.placement-top-right,
        .risk-badge.placement-top-left {
          position: static;
          margin-bottom: var(--space-2);
        }
      }
    `,
  ],
})
export class RiskBadgeComponent {
  // Required inputs
  level = input.required<RiskLevel>();

  // Optional inputs
  placement = input<RiskPlacement>("inline");
  showIcon = input<boolean>(true);
  showTag = input<boolean>(false);
  tooltip = input<string | null>(null);

  // Computed values
  getLabel = computed(() => {
    const l = this.level();
    const labels: Record<RiskLevel, string> = {
      low: "Low Risk",
      moderate: "Moderate Risk",
      high: "High Risk",
      critical: "Critical Risk",
    };
    return labels[l] || "Risk";
  });

  getIconClass(): string {
    const l = this.level();
    const icons: Record<RiskLevel, string> = {
      low: "pi pi-check-circle",
      moderate: "pi pi-exclamation-circle",
      high: "pi pi-exclamation-triangle",
      critical: "pi pi-exclamation-triangle",
    };
    return icons[l] || "pi pi-info-circle";
  }

  getSeverity():
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "contrast" {
    const l = this.level();
    const severities: Record<
      RiskLevel,
      "secondary" | "success" | "info" | "warning" | "danger" | "contrast"
    > = {
      low: "success",
      moderate: "warning",
      high: "warning",
      critical: "danger",
    };
    return severities[l] || "info";
  }

  getDefaultTooltip(): string {
    const l = this.level();
    const tooltips: Record<RiskLevel, string> = {
      low: "Low injury risk - continue current training load",
      moderate: "Moderate injury risk - monitor closely",
      high: "High injury risk - reduce training load",
      critical: "Critical injury risk - immediate action required",
    };
    return tooltips[l] || "Risk assessment";
  }
}
