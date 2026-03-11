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
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { getStatusSeverity } from "../../utils/status.utils";

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type RiskPlacement = "top-right" | "top-left" | "inline" | "banner";

@Component({
  selector: "app-risk-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip, StatusTagComponent],
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
  styleUrl: "./risk-badge.component.scss",
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
    const severity = getStatusSeverity(this.level());
    return severity === "secondary" ? "contrast" : severity;
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
