/**
 * Incomplete Data Badge Component
 *
 * Phase 3 - Unified Incomplete Data Indicator
 * Standardized component for displaying incomplete/missing data across all contexts
 *
 * Usage:
 * <app-incomplete-data-badge [severity]="'warning'" [daysMissing]="3" [dataType]="'wellness'"></app-incomplete-data-badge>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TooltipModule } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { ButtonModule } from "primeng/button";

export type IncompleteDataSeverity = "warning" | "critical";
export type IncompleteDataType =
  | "wellness"
  | "training"
  | "rpe"
  | "sleep"
  | "general";
export type IncompleteDataPlacement =
  | "top-right"
  | "top-left"
  | "inline"
  | "card";

@Component({
  selector: "app-incomplete-data-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TooltipModule,
    ButtonModule,
    StatusTagComponent,
  ],
  template: `
    <div
      class="incomplete-data-badge"
      [class]="'severity-' + severity() + ' placement-' + placement()"
      [pTooltip]="tooltip() || getDefaultTooltip()"
      [tooltipPosition]="'top'"
    >
      <i [class]="getIconClass()" class="badge-icon"></i>
      <span class="badge-label">{{ getLabel() }}</span>
      @if (showTag()) {
        <app-status-tag
          [value]="getSeverityLabel()"
          [severity]="getSeverityTag()"
          size="sm"
        />
      }
      @if (showDaysCount() && daysMissing() > 0) {
        <span class="days-count"
          >{{ daysMissing() }} day{{ daysMissing()! > 1 ? "s" : "" }}</span
        >
      }
    </div>
  `,
  styles: [
    `
      .incomplete-data-badge {
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

      /* Severity Colors - SEMANTIC RULE: Incomplete Data MUST be orange/amber ONLY */
      .incomplete-data-badge.severity-warning {
        background: var(--ds-primary-orange-subtle);
        color: var(--ds-primary-orange);
        border-left: var(--border-2) solid var(--ds-primary-orange);
      }

      .incomplete-data-badge.severity-critical {
        background: var(--ds-primary-orange-subtle);
        color: var(--ds-primary-orange);
        border-left: var(--border-2) solid var(--ds-primary-orange);
        font-weight: var(--font-weight-bold); /* Intensity difference */
      }

      /* Placement Styles */
      /* NOTE: top-right/top-left placements require parent to have position: relative */
      .incomplete-data-badge.placement-top-right {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        z-index: 10;
      }

      .incomplete-data-badge.placement-top-left {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 10;
      }

      .incomplete-data-badge.placement-inline {
        display: inline-flex;
        position: static;
      }

      .incomplete-data-badge.placement-card {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-3);
        position: static; /* Ensure card placement doesn't escape bounds */
      }

      /* Responsive - ensure badges don't escape on mobile */
      @media (max-width: 768px) {
        .incomplete-data-badge.placement-top-right,
        .incomplete-data-badge.placement-top-left {
          position: static;
          margin-bottom: var(--space-2);
          width: 100%;
        }
      }

      .badge-icon {
        font-size: var(--font-caption-size);
      }

      .badge-label {
        font-weight: var(--font-weight-semibold);
      }

      .severity-tag {
        margin-left: var(--space-1);
      }

      .days-count {
        margin-left: var(--space-1);
        font-size: var(--font-size-h4);
        opacity: 0.9;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .incomplete-data-badge.placement-top-right,
        .incomplete-data-badge.placement-top-left {
          position: static;
          margin-bottom: var(--space-2);
        }
      }
    `,
  ],
})
export class IncompleteDataBadgeComponent {
  // Required inputs
  severity = input.required<IncompleteDataSeverity>();
  dataType = input<IncompleteDataType>("general");

  // Optional inputs
  daysMissing = input<number>(0);
  placement = input<IncompleteDataPlacement>("inline");
  showIcon = input<boolean>(true);
  showTag = input<boolean>(false);
  showDaysCount = input<boolean>(true);
  tooltip = input<string | null>(null);
  confidenceImpact = input<number>(0); // 0.0 to 1.0 - how much confidence is reduced

  // Computed values
  getLabel = computed(() => {
    const type = this.dataType();
    const labels: Record<IncompleteDataType, string> = {
      wellness: "Missing Wellness Data",
      training: "Missing Training Data",
      rpe: "Missing RPE Data",
      sleep: "Missing Sleep Data",
      general: "Incomplete Data",
    };
    return labels[type] || "Incomplete Data";
  });

  getIconClass(): string {
    const s = this.severity();
    return s === "critical"
      ? "pi pi-exclamation-triangle"
      : "pi pi-exclamation-circle";
  }

  getSeverityLabel(): string {
    const s = this.severity();
    return s === "critical" ? "Critical" : "Warning";
  }

  getSeverityTag():
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "contrast" {
    const s = this.severity();
    return s === "critical" ? "danger" : "warning";
  }

  getDefaultTooltip(): string {
    const type = this.dataType();
    const days = this.daysMissing();
    const s = this.severity();

    let message = `Missing ${type} data`;
    if (days > 0) {
      message += ` for ${days} day${days > 1 ? "s" : ""}`;
    }
    if (s === "critical") {
      message += ". This affects ACWR accuracy and injury risk assessment.";
    } else {
      message += ". This may reduce data confidence.";
    }

    return message;
  }
}
