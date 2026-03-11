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
  styleUrl: "./action-panel.component.scss",
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
