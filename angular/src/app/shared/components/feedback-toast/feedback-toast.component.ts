import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FeedbackService,
  FeedbackMessage,
} from "../../../core/services/feedback.service";

/**
 * FeedbackToastComponent
 * Renders user-facing notifications (success, error, warning, info)
 * managed by the FeedbackService.
 */
@Component({
  selector: "app-feedback-toast",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="status" aria-live="polite">
      <div
        *ngFor="let msg of feedbackService.messages()"
        class="toast-item"
        [ngClass]="msg.type"
        [attr.id]="msg.id"
      >
        <div class="toast-content">
          <span class="toast-icon">{{ getIcon(msg.type) }}</span>
          <span class="toast-message">{{ msg.message }}</span>
          <button
            *ngIf="msg.action"
            class="toast-action-btn"
            (click)="handleAction(msg)"
          >
            {{ msg.action.label }}
          </button>
        </div>
        <button
          class="toast-close-btn"
          (click)="feedbackService.removeMessage(msg.id)"
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </div>
  `,
  styleUrl: './feedback-toast.component.scss',
})
export class FeedbackToastComponent {
  public feedbackService = inject(FeedbackService);

  getIcon(type: string): string {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  }

  handleAction(msg: FeedbackMessage): void {
    if (msg.action) {
      msg.action.callback();
      this.feedbackService.removeMessage(msg.id);
    }
  }
}
