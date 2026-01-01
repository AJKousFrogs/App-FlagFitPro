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
  styles: [
    `
      .toast-container {
        position: fixed;
        top: var(--space-5);
        right: var(--space-5);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        z-index: var(--z-index-notification);
        max-width: 400px;
      }

      .toast-item {
        padding: var(--space-4) var(--space-5);
        border-radius: var(--radius-lg);
        color: var(--color-text-on-primary);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-body-sm);
        box-shadow: var(--shadow-md);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        animation: slideIn var(--transition-slow) ease-out;
        line-height: var(--line-height-normal);
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .success {
        background: var(--ds-primary-green);
        border-left: 4px solid var(--ds-primary-green-hover);
      }
      .error {
        background: var(--color-status-error);
        border-left: 4px solid var(--primitive-error-600, #dc2626);
      }
      .warning {
        background: var(--color-status-warning);
        border-left: 4px solid var(--primitive-warning-500, #f59e0b);
        color: var(--color-text-primary);
      }
      .info {
        background: var(--color-status-info);
        border-left: 4px solid var(--primitive-primary-600, #0ab85a);
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        flex: 1;
      }

      .toast-icon {
        font-size: 1rem;
        flex-shrink: 0;
      }

      .toast-message {
        flex: 1;
      }

      .toast-action-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        margin-left: 0.5rem;
      }

      .toast-action-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .toast-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0.8;
        padding: 0;
        margin-left: 0.5rem;
        line-height: 1;
      }

      .toast-close-btn:hover {
        opacity: 1;
      }
    `,
  ],
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
