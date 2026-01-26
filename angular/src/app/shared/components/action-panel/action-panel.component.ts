/**
 * Action Panel Component
 *
 * Phase 3 - Blocking Action Panel
 * A prominent, blocking panel that requires user action before proceeding.
 *
 * Visual Grammar (from semantic-meaning.types.ts):
 * - Color: White surface + strong border (not colored background)
 * - Icon: → (arrow) or ✔︎ (checkmark)
 * - Placement: Inline, blocking progression
 *
 * Rule: If action is required and blocking, it must:
 * - contain the action
 * - be dismissible only by action
 * - never be passive text
 *
 * Usage:
 * <app-action-panel
 *   [actionType]="'complete-wellness'"
 *   [urgency]="'critical'"
 *   [blocking]="true"
 *   [message]="'Complete your wellness check-in to get personalized training recommendations'"
 *   [actionLabel]="'Complete Check-in'"
 *   [actionRoute]="['/wellness']">
 * </app-action-panel>
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../button/button.component";

export type ActionPanelUrgency = "low" | "medium" | "high" | "critical";
export type ActionPanelType =
  | "complete-profile"
  | "complete-wellness"
  | "log-training"
  | "modify-session"
  | "review-plan"
  | "contact-coach"
  | "general";

@Component({
  selector: "app-action-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <div
      class="action-panel"
      [class]="'urgency-' + urgency() + (blocking() ? ' blocking' : '')"
      role="alert"
      [attr.aria-live]="urgency() === 'critical' ? 'assertive' : 'polite'"
    >
      <div class="action-panel-content">
        <div class="action-panel-icon">
          <i [class]="getIconClass()"></i>
        </div>

        <div class="action-panel-body">
          <h3 class="action-panel-title">{{ getTitle() }}</h3>
          <p class="action-panel-message">{{ message() }}</p>
        </div>

        <div class="action-panel-actions">
          @if (actionRoute()) {
            <app-button
              [routerLink]="actionRoute()!"
              [class]="'action-panel-btn urgency-' + urgency()"
              iconRight="pi-arrow-right"
              >{{ actionLabel() || "Take Action" }}</app-button
            >
          } @else {
            <app-button
              (clicked)="actionClicked.emit()"
              [class]="'action-panel-btn urgency-' + urgency()"
              iconRight="pi-arrow-right"
              >{{ actionLabel() || "Take Action" }}</app-button
            >
          }
        </div>
      </div>

      @if (blocking()) {
        <div class="blocking-overlay-indicator">
          <i class="pi pi-lock"></i>
          <span>Action required to continue</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .action-panel {
        background: var(--surface-primary, #ffffff);
        border-radius: var(--radius-lg, var(--ds-font-size-xs));
        padding: var(--space-6, var(--ds-font-size-2xl));
        margin: var(--space-4, var(--ds-font-size-md)) 0;
        border: 2px solid var(--color-border-secondary);
        transition: all 0.3s ease;
      }

      /* Urgency-based border styling - follows semantic grammar */
      .action-panel.urgency-low {
        border-color: var(--color-status-info, #3b82f6);
        border-width: 2px;
      }

      .action-panel.urgency-medium {
        border-color: var(--ds-primary-orange, #f97316);
        border-width: 2px;
      }

      .action-panel.urgency-high {
        border-color: var(--ds-primary-orange, #f97316);
        border-width: 3px;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
      }

      .action-panel.urgency-critical {
        border-color: var(--color-status-error, #ef4444);
        border-width: 3px;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        animation: pulse-panel 2s infinite;
      }

      @keyframes pulse-panel {
        0%,
        100% {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.08);
        }
      }

      /* Blocking state - more prominent */
      .action-panel.blocking {
        position: relative;
        z-index: 10;
      }

      .action-panel.blocking::before {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: calc(var(--radius-lg, var(--ds-font-size-xs)) + 4px);
        background: linear-gradient(
          135deg,
          rgba(249, 115, 22, 0.1) 0%,
          rgba(239, 68, 68, 0.1) 100%
        );
        z-index: -1;
      }

      .action-panel.blocking.urgency-critical::before {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.15) 0%,
          rgba(239, 68, 68, 0.1) 100%
        );
      }

      .action-panel-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4, var(--ds-font-size-md));
      }

      .action-panel-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md, 8px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-2xl);
      }

      .urgency-low .action-panel-icon {
        background: rgba(59, 130, 246, 0.1);
        color: var(--color-status-info, #3b82f6);
      }

      .urgency-medium .action-panel-icon {
        background: rgba(249, 115, 22, 0.1);
        color: var(--ds-primary-orange, #f97316);
      }

      .urgency-high .action-panel-icon {
        background: rgba(249, 115, 22, 0.15);
        color: var(--ds-primary-orange, #f97316);
      }

      .urgency-critical .action-panel-icon {
        background: rgba(239, 68, 68, 0.15);
        color: var(--color-status-error, #ef4444);
      }

      .action-panel-body {
        flex: 1;
        min-width: 0;
      }

      .action-panel-title {
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1, 0.25rem) 0;
        line-height: var(--ds-line-height-tight);
      }

      .action-panel-message {
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        margin: 0;
        line-height: var(--ds-line-height-normal);
      }

      .action-panel-actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
      }

      .action-panel-btn {
        font-weight: var(--ds-font-weight-semibold);
        white-space: nowrap;
      }

      .action-panel-btn.urgency-low {
        background: var(--color-status-info, #3b82f6);
        border-color: var(--color-status-info, #3b82f6);
      }

      .action-panel-btn.urgency-medium {
        background: var(--ds-primary-orange, #f97316);
        border-color: var(--ds-primary-orange, #f97316);
      }

      .action-panel-btn.urgency-high {
        background: var(--ds-primary-orange, #f97316);
        border-color: var(--ds-primary-orange, #f97316);
      }

      .action-panel-btn.urgency-critical {
        background: var(--color-status-error, #ef4444);
        border-color: var(--color-status-error, #ef4444);
        animation: pulse-btn 1.5s infinite;
      }

      @keyframes pulse-btn {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }

      .blocking-overlay-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2, var(--ds-font-size-0-5rem));
        margin-top: var(--space-4, var(--ds-font-size-md));
        padding-top: var(--space-3, var(--ds-font-size-xs));
        border-top: 1px dashed var(--color-border-secondary);
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-tertiary);
        font-weight: var(--ds-font-weight-medium);
      }

      .blocking-overlay-indicator i {
        font-size: var(--ds-font-size-sm);
      }

      /* Responsive */
      @media (max-width: 640px) {
        .action-panel-content {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }

        .action-panel-icon {
          align-self: center;
        }

        .action-panel-actions {
          justify-content: center;
          margin-top: var(--space-2, var(--ds-font-size-0-5rem));
        }

        .action-panel-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class ActionPanelComponent {
  // Required inputs
  actionType = input.required<ActionPanelType>();
  message = input.required<string>();

  // Optional inputs
  urgency = input<ActionPanelUrgency>("medium");
  actionLabel = input<string | null>(null);
  actionRoute = input<string[] | null>(null);
  blocking = input<boolean>(true);
  placement = input<"top" | "inline">("inline");

  // Output events
  actionClicked = output<void>();

  getIconClass(): string {
    const type = this.actionType();
    const icons: Record<ActionPanelType, string> = {
      "complete-profile": "pi pi-user-edit",
      "complete-wellness": "pi pi-heart",
      "log-training": "pi pi-plus-circle",
      "modify-session": "pi pi-sliders-h",
      "review-plan": "pi pi-file-edit",
      "contact-coach": "pi pi-comments",
      general: "pi pi-exclamation-circle",
    };
    return icons[type] || "pi pi-exclamation-circle";
  }

  getTitle(): string {
    const type = this.actionType();
    const urgency = this.urgency();

    const titles: Record<ActionPanelType, string> = {
      "complete-profile": "Complete Your Profile",
      "complete-wellness": "Wellness Check-in Required",
      "log-training": "Log Your Training",
      "modify-session": "Session Needs Attention",
      "review-plan": "Review Training Plan",
      "contact-coach": "Contact Your Coach",
      general: "Action Required",
    };

    let title = titles[type] || "Action Required";

    if (urgency === "critical") {
      title = `⚠️ ${title}`;
    }

    return title;
  }
}
