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
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TagModule, TooltipModule, ButtonModule],
  template: `
    @if (placement() === "button" && actionRoute()) {
      <button
        pButton
        [label]="getLabel()"
        [icon]="getIconClass()"
        [routerLink]="actionRoute()!"
        [class]="'action-btn urgency-' + urgency()"
        styleClass="p-button-primary"
      ></button>
    } @else {
      <div
        class="action-required-badge"
        [class]="'urgency-' + urgency() + ' placement-' + placement()"
        [pTooltip]="tooltip() || getDefaultTooltip()"
        [tooltipPosition]="'top'"
      >
        @if (showIcon()) {
          <i [class]="getIconClass()" class="action-icon"></i>
        }
        <span class="action-label">{{ getLabel() }}</span>
        @if (showTag()) {
          <p-tag
            [value]="getUrgencyLabel()"
            [severity]="getSeverity()"
            styleClass="urgency-tag"
          ></p-tag>
        }
      </div>
    }
  `,
  styles: [
    `
      .action-required-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-family: var(--font-family-sans);
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-semibold);
        text-transform: none;
        letter-spacing: 0;
        line-height: var(--line-height-tight);
        min-height: var(--space-8);
        transition: all 0.2s ease;
        cursor: pointer;
      }

      /* Urgency Colors - SEMANTIC RULE: Action Required MUST be white surface + strong border */
      /* Urgency handled by border color/intensity, NOT background color */
      .action-required-badge.urgency-low {
        background: var(--surface-primary, #ffffff);
        color: var(--color-text-primary);
        border: 2px solid var(--color-status-info);
      }

      .action-required-badge.urgency-medium {
        background: var(--surface-primary, #ffffff);
        color: var(--color-text-primary);
        border: 2px solid var(--ds-primary-orange, #f97316);
      }

      .action-required-badge.urgency-high {
        background: var(--surface-primary, #ffffff);
        color: var(--color-text-primary);
        border: 3px solid var(--ds-primary-orange, #f97316);
        font-weight: var(--font-weight-semibold);
      }

      .action-required-badge.urgency-critical {
        background: var(--surface-primary, #ffffff);
        color: var(--color-text-primary);
        border: 3px solid var(--color-status-error);
        font-weight: var(--font-weight-bold);
        animation: pulse-action 2s infinite;
      }

      @keyframes pulse-action {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.8;
        }
      }

      /* Placement Styles */
      .action-required-badge.placement-top {
        width: 100%;
        justify-content: center;
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-3);
      }

      .action-required-badge.placement-inline {
        display: inline-flex;
        position: static;
      }

      .action-required-badge.placement-banner {
        width: 100%;
        justify-content: flex-start;
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-2);
      }

      .action-icon {
        font-size: var(--font-size-badge);
      }

      .action-label {
        font-weight: var(--font-weight-semibold);
      }

      .urgency-tag {
        margin-left: var(--space-1);
      }

      /* Button variant */
      .action-btn {
        min-height: var(--space-8);
      }

      .action-btn.urgency-high,
      .action-btn.urgency-critical {
        background: var(--color-status-error);
        border-color: var(--color-status-error);
      }

      .action-btn.urgency-high:hover,
      .action-btn.urgency-critical:hover {
        background: var(--color-status-error);
        opacity: 0.9;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .action-required-badge {
          font-size: var(--font-size-h4);
          padding: var(--space-2) var(--space-3);
        }
      }
    `,
  ],
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

  getSeverity(): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    const u = this.urgency();
    const severities: Record<ActionUrgency, "secondary" | "success" | "info" | "warn" | "danger" | "contrast"> = {
      low: "info",
      medium: "warn",
      high: "warn",
      critical: "danger",
    };
    return severities[u] || "warn";
  }

  getDefaultTooltip(): string {
    const type = this.actionType();
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

