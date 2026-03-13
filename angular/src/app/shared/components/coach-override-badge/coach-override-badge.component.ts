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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip, StatusTagComponent],
  template: `
    <div
      class="coach-override-badge"
      [class]="'placement-' + placement()"
      [pTooltip]="tooltip() || getDefaultTooltip()"
      [tooltipPosition]="'top'"
    >
      <app-status-tag
        [value]="getLabel()"
        severity="info"
        [icon]="showIcon() ? 'pi-info-circle' : undefined"
        [size]="placement() === 'card' ? 'md' : 'sm'"
      />
      @if (showTag()) {
        <app-status-tag
          [value]="getOverrideTypeLabel()"
          severity="secondary"
          size="sm"
        />
      }
      @if (showTimestamp() && timestamp()) {
        <span class="override-timestamp">{{ getTimeAgoStr() }}</span>
      }
    </div>
  `,
  styleUrl: "./coach-override-badge.component.scss",
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
