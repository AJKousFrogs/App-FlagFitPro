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
import { RouterModule } from "@angular/router";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, Tooltip, StatusTagComponent],
  template: `
    <div
      class="incomplete-data-badge"
      [class]="'severity-' + severity() + ' placement-' + placement()"
      [pTooltip]="tooltip() || getDefaultTooltip()"
      [tooltipPosition]="'top'"
    >
      <app-status-tag
        [value]="getLabel()"
        [severity]="getSeverityTag()"
        [icon]="showIcon() ? getStatusTagIcon() : undefined"
        [size]="placement() === 'card' ? 'md' : 'sm'"
      />
      @if (showTag()) {
        <app-status-tag
          [value]="getSeverityLabel()"
          severity="secondary"
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
  styleUrl: "./incomplete-data-badge.component.scss",
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

  getStatusTagIcon(): string {
    const s = this.severity();
    return s === "critical"
      ? "pi-exclamation-triangle"
      : "pi-exclamation-circle";
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
