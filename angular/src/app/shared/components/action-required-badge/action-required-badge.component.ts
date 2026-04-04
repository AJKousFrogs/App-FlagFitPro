/**
 * Action Required Badge Component
 *
 * Phase 3 - Unified Action Required Indicator
 * Standardized component for displaying required actions across all contexts
 *
 * Usage:
 * <app-action-required-badge [actionType]="'complete-profile'" [urgency]="'high'"></app-action-required-badge>
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
import { ButtonComponent } from "../button/button.component";

export type ActionUrgency = "low" | "medium" | "high" | "critical";
export type ActionPlacement = "top" | "inline" | "banner" | "button";
export type ActionType =
  | "complete-profile"
  | "complete-wellness"
  | "log-training"
  | "modify-session"
  | "review-plan"
  | "contact-coach"
  | "general";

@Component({
  selector: "app-action-required-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    Tooltip,
    ButtonComponent,
    StatusTagComponent,
  ],
  template: `
    @if (placement() === "button" && actionRoute()) {
      <app-button
        [iconLeft]="getIconClass().replace('pi ', '')"
        [routerLink]="actionRoute()!"
        [class]="'action-btn urgency-' + urgency()"
        >{{ getLabel() }}</app-button
      >
    } @else {
      <div
        class="action-required-badge"
        [class]="'urgency-' + urgency() + ' placement-' + placement()"
        [pTooltip]="tooltip() || getDefaultTooltip()"
        [tooltipPosition]="'top'"
      >
        <app-status-tag
          [value]="getLabel()"
          [severity]="getSeverity()"
          [icon]="showIcon() ? getStatusTagIcon() : undefined"
          [size]="placement() === 'banner' || placement() === 'top' ? 'md' : 'sm'"
        />
        @if (showTag()) {
          <app-status-tag
            [value]="getUrgencyLabel()"
            severity="secondary"
            size="sm"
          />
        }
      </div>
    }
  `,
  styleUrl: "./action-required-badge.component.scss",
})
export class ActionRequiredBadgeComponent {
  // Required inputs
  actionType = input.required<ActionType>();
  urgency = input<ActionUrgency>("medium");

  // Optional inputs
  placement = input<ActionPlacement>("inline");
  showIcon = input<boolean>(true);
  showTag = input<boolean>(false);
  tooltip = input<string | null>(null);
  actionRoute = input<string[] | null>(null);

  // Computed values
  getLabel = computed(() => {
    const type = this.actionType();
    const labels: Record<ActionType, string> = {
      "complete-profile": "Complete Your Profile",
      "complete-wellness": "Complete Wellness Check-in",
      "log-training": "Log Training Session",
      "modify-session": "Modify Today's Session",
      "review-plan": "Review Training Plan",
      "contact-coach": "Contact Coach",
      general: "Action Required",
    };
    return labels[type] || "Action Required";
  });

  getIconClass(): string {
    const type = this.actionType();
    const icons: Record<ActionType, string> = {
      "complete-profile": "pi pi-user-edit",
      "complete-wellness": "pi pi-heart",
      "log-training": "pi pi-plus",
      "modify-session": "pi pi-sliders-h",
      "review-plan": "pi pi-file-edit",
      "contact-coach": "pi pi-comments",
      general: "pi pi-exclamation-circle",
    };
    return icons[type] || "pi pi-exclamation-circle";
  }

  getStatusTagIcon(): string {
    return this.getIconClass().replace("pi ", "");
  }

  getUrgencyLabel(): string {
    const u = this.urgency();
    const labels: Record<ActionUrgency, string> = {
      low: "Low Priority",
      medium: "Action Required",
      high: "Urgent",
      critical: "Critical",
    };
    return labels[u] || "Action Required";
  }

  getSeverity():
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "contrast" {
    const u = this.urgency();
    const severities: Record<
      ActionUrgency,
      "secondary" | "success" | "info" | "warning" | "danger" | "contrast"
    > = {
      low: "info",
      medium: "warning",
      high: "warning",
      critical: "danger",
    };
    return severities[u] || "warning";
  }

  getDefaultTooltip(): string {
    const _type = this.actionType(); // Available for future type-specific tooltips
    const u = this.urgency();
    let message = this.getLabel();
    if (u === "critical") {
      message += " - Immediate action required";
    } else if (u === "high") {
      message += " - Urgent";
    }
    return message;
  }
}
