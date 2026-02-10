/**
 * Coach Override Badge Component
 *
 * Phase 3 - Unified Coach Override Indicator
 * Standardized component for displaying coach override indicators across all contexts
 *
 * Usage:
 * <app-coach-override-badge [overrideType]="'load-adjustment'" [placement]="'top-right'"></app-coach-override-badge>
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { getTimeAgo } from "../../utils/date.utils";

export type CoachOverrideType =
  | "load-adjustment"
  | "session-modification"
  | "plan-change"
  | "threshold-override"
  | "general";
export type CoachOverridePlacement =
  | "top-right"
  | "top-left"
  | "inline"
  | "card";

@Component({
  selector: "app-coach-override-badge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip, StatusTagComponent],
  template: `
    <div
      class="coach-override-badge"
      [class]="'placement-' + placement()"
      [pTooltip]="tooltip() || getDefaultTooltip()"
      [tooltipPosition]="'top'"
    >
      @if (showIcon()) {
        <i class="pi pi-info-circle override-icon"></i>
      }
      <span class="override-label">{{ getLabel() }}</span>
      @if (showTag()) {
        <app-status-tag
          [value]="getOverrideTypeLabel()"
          severity="info"
          size="sm"
        />
      }
      @if (showTimestamp() && timestamp()) {
        <span class="override-timestamp">{{ getTimeAgoStr() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .coach-override-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        text-transform: var(--ds-text-transform-none);
        letter-spacing: var(--ds-letter-spacing-normal);
        line-height: var(--ds-line-height-tight);
        min-height: var(--space-8);
        transition: all var(--motion-fast) var(--ease-standard);
        background: var(--color-status-info-subtle);
        color: var(--color-status-info);
        border-left: var(--space-0-75) solid var(--color-status-info);
      }

      /* Placement Styles */
      .coach-override-badge.placement-top-right {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        z-index: 10;
      }

      .coach-override-badge.placement-top-left {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 10;
      }

      .coach-override-badge.placement-inline {
        display: inline-flex;
        position: static;
      }

      .coach-override-badge.placement-card {
        width: 100%;
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-3);
      }

      .override-icon {
        font-size: var(--ds-font-size-xs);
        color: var(--color-status-info);
      }

      .override-label {
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-status-info);
      }

      .override-tag {
        margin-left: var(--space-1);
      }

      .override-timestamp {
        margin-left: var(--space-2);
        font-size: var(--ds-font-size-md);
        opacity: 0.9;
        font-weight: var(--ds-font-weight-regular);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .coach-override-badge.placement-top-right,
        .coach-override-badge.placement-top-left {
          position: static;
          margin-bottom: var(--space-2);
        }
      }
    `,
  ],
})
export class CoachOverrideBadgeComponent {
  // Required inputs
  overrideType = input<CoachOverrideType>("general");

  // Optional inputs
  placement = input<CoachOverridePlacement>("inline");
  showIcon = input<boolean>(true);
  showTag = input<boolean>(false);
  showTimestamp = input<boolean>(false);
  timestamp = input<Date | null>(null);
  tooltip = input<string | null>(null);

  // Computed values
  getLabel = computed(() => {
    return "Coach Override";
  });

  getOverrideTypeLabel = computed(() => {
    const type = this.overrideType();
    const labels: Record<CoachOverrideType, string> = {
      "load-adjustment": "Load Adjusted",
      "session-modification": "Session Modified",
      "plan-change": "Plan Changed",
      "threshold-override": "Threshold Override",
      general: "Coach Override",
    };
    return labels[type] || "Coach Override";
  });

  getDefaultTooltip(): string {
    const type = this.overrideType();
    const labels: Record<CoachOverrideType, string> = {
      "load-adjustment": "Your coach has adjusted your training load",
      "session-modification": "Your coach has modified your training session",
      "plan-change": "Your coach has changed your training plan",
      "threshold-override": "Your coach has overridden system thresholds",
      general: "Your coach has made an adjustment to your training",
    };
    return labels[type] || "Coach override";
  }

  /**
   * Get time ago string using centralized utility
   */
  getTimeAgoStr(): string {
    const timestamp = this.timestamp();
    return timestamp ? getTimeAgo(timestamp) : "";
  }
}
