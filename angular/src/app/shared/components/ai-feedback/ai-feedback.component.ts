import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { RadioButtonModule } from "primeng/radiobutton";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../../core/services/api.service";

/**
 * Feedback types for AI responses
 */
type FeedbackType =
  | "thumbs_up"
  | "thumbs_down"
  | "helpful"
  | "not_helpful"
  | "incorrect"
  | "unsafe"
  | "irrelevant";

/**
 * Feedback submission data
 */
interface FeedbackData {
  chat_session_id?: string;
  message_id: string;
  feedback_type: FeedbackType;
  feedback_reason?: string;
  outcome?: string;
}

/**
 * AI Feedback Component
 *
 * Allows users to provide feedback on AI responses.
 * Supports thumbs up/down, detailed feedback types, and optional comments.
 */
@Component({
  selector: "app-ai-feedback",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
    RadioButtonModule,
    TooltipModule,
  ],
  template: `
    <div class="ai-feedback" [class.compact]="compact">
      <!-- Quick Feedback Buttons -->
      <div class="quick-feedback">
        <button
          class="feedback-btn"
          [class.selected]="selectedFeedback() === 'thumbs_up'"
          [class.disabled]="submitted()"
          (click)="submitQuickFeedback('thumbs_up')"
          [disabled]="submitted()"
          pTooltip="Helpful"
          tooltipPosition="top"
        >
          <i class="pi pi-thumbs-up"></i>
        </button>
        <button
          class="feedback-btn"
          [class.selected]="selectedFeedback() === 'thumbs_down'"
          [class.disabled]="submitted()"
          (click)="openDetailedFeedback('thumbs_down')"
          [disabled]="submitted()"
          pTooltip="Not helpful"
          tooltipPosition="top"
        >
          <i class="pi pi-thumbs-down"></i>
        </button>
        @if (!compact) {
          <button
            class="feedback-btn text-btn"
            [class.disabled]="submitted()"
            (click)="openDetailedFeedback(null)"
            [disabled]="submitted()"
            pTooltip="More options"
            tooltipPosition="top"
          >
            <i class="pi pi-ellipsis-h"></i>
          </button>
        }
      </div>

      @if (submitted()) {
        <span class="feedback-thanks">
          <i class="pi pi-check-circle"></i>
          Thanks for your feedback!
        </span>
      }

      <!-- Detailed Feedback Dialog -->
      <p-dialog
        header="Provide Feedback"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
        [draggable]="false"
      >
        <div class="dialog-content">
          <p class="dialog-intro">
            Help us improve the AI coaching experience by sharing your feedback.
          </p>

          <!-- Feedback Type Selection -->
          <div class="feedback-types">
            <label class="section-label">What's the issue?</label>
            <div class="type-options">
              @for (type of feedbackTypes; track type.value) {
                <div class="type-option">
                  <p-radioButton
                    [inputId]="type.value"
                    [value]="type.value"
                    [(ngModel)]="detailedFeedbackType"
                  ></p-radioButton>
                  <label [for]="type.value" class="type-label">
                    <i [class]="type.icon"></i>
                    <span>{{ type.label }}</span>
                  </label>
                </div>
              }
            </div>
          </div>

          <!-- Optional Comment -->
          <div class="feedback-comment">
            <label class="section-label">Additional details (optional)</label>
            <textarea
              pInputTextarea
              [(ngModel)]="feedbackComment"
              placeholder="Tell us more about your experience..."
              [rows]="3"
              class="w-full"
            ></textarea>
          </div>

          <!-- Outcome Question (for helpful feedback) -->
          @if (detailedFeedbackType === 'helpful' || detailedFeedbackType === 'thumbs_up') {
            <div class="outcome-question">
              <label class="section-label">Did this help you achieve your goal?</label>
              <div class="outcome-options">
                <button
                  class="outcome-btn"
                  [class.selected]="outcomeAnswer === 'yes'"
                  (click)="outcomeAnswer = 'yes'"
                >
                  Yes
                </button>
                <button
                  class="outcome-btn"
                  [class.selected]="outcomeAnswer === 'partially'"
                  (click)="outcomeAnswer = 'partially'"
                >
                  Partially
                </button>
                <button
                  class="outcome-btn"
                  [class.selected]="outcomeAnswer === 'no'"
                  (click)="outcomeAnswer = 'no'"
                >
                  No
                </button>
              </div>
            </div>
          }
        </div>

        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="dialogVisible = false"
          ></p-button>
          <p-button
            label="Submit Feedback"
            icon="pi pi-send"
            (onClick)="submitDetailedFeedback()"
            [disabled]="!detailedFeedbackType"
          ></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [
    `
      .ai-feedback {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .ai-feedback.compact {
        gap: var(--space-2);
      }

      .quick-feedback {
        display: flex;
        gap: var(--space-1);
      }

      .feedback-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }

      .feedback-btn:hover:not(.disabled) {
        background: var(--p-surface-100);
        color: var(--text-primary);
      }

      .feedback-btn.selected {
        background: var(--color-brand-primary);
        border-color: var(--color-brand-primary);
        color: white;
      }

      .feedback-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .feedback-btn.text-btn {
        width: auto;
        padding: 0 var(--space-2);
      }

      .feedback-thanks {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: 0.75rem;
        color: #22c55e;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .dialog-intro {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .section-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .type-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .type-option {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .type-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        cursor: pointer;
        font-size: 0.875rem;
      }

      .type-label i {
        width: 16px;
        color: var(--text-secondary);
      }

      .outcome-question {
        padding-top: var(--space-2);
        border-top: 1px solid var(--p-surface-200);
      }

      .outcome-options {
        display: flex;
        gap: var(--space-2);
      }

      .outcome-btn {
        flex: 1;
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
      }

      .outcome-btn:hover {
        background: var(--p-surface-100);
      }

      .outcome-btn.selected {
        background: var(--color-brand-primary);
        border-color: var(--color-brand-primary);
        color: white;
      }

      @media (max-width: 480px) {
        .feedback-btn {
          width: 28px;
          height: 28px;
        }

        .feedback-btn i {
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class AiFeedbackComponent {
  private apiService = inject(ApiService);

  @Input({ required: true }) messageId!: string;
  @Input() sessionId?: string;
  @Input() compact = false;

  @Output() feedbackSubmitted = new EventEmitter<FeedbackData>();

  // State
  selectedFeedback = signal<FeedbackType | null>(null);
  submitted = signal(false);
  dialogVisible = false;
  detailedFeedbackType: FeedbackType | null = null;
  feedbackComment = "";
  outcomeAnswer: "yes" | "partially" | "no" | null = null;

  // Feedback type options
  feedbackTypes = [
    { value: "not_helpful" as FeedbackType, label: "Not helpful", icon: "pi pi-thumbs-down" },
    { value: "incorrect" as FeedbackType, label: "Incorrect information", icon: "pi pi-times-circle" },
    { value: "unsafe" as FeedbackType, label: "Unsafe advice", icon: "pi pi-exclamation-triangle" },
    { value: "irrelevant" as FeedbackType, label: "Not relevant to my question", icon: "pi pi-question-circle" },
    { value: "helpful" as FeedbackType, label: "Actually helpful", icon: "pi pi-thumbs-up" },
  ];

  async submitQuickFeedback(type: FeedbackType): Promise<void> {
    if (this.submitted()) return;

    this.selectedFeedback.set(type);
    await this.submitFeedback(type);
  }

  openDetailedFeedback(initialType: FeedbackType | null): void {
    if (this.submitted()) return;

    this.detailedFeedbackType = initialType;
    this.feedbackComment = "";
    this.outcomeAnswer = null;
    this.dialogVisible = true;
  }

  async submitDetailedFeedback(): Promise<void> {
    if (!this.detailedFeedbackType) return;

    await this.submitFeedback(
      this.detailedFeedbackType,
      this.feedbackComment,
      this.outcomeAnswer
    );

    this.dialogVisible = false;
  }

  private async submitFeedback(
    type: FeedbackType,
    reason?: string,
    outcome?: string | null
  ): Promise<void> {
    const feedbackData: FeedbackData = {
      message_id: this.messageId,
      chat_session_id: this.sessionId,
      feedback_type: type,
      feedback_reason: reason || undefined,
      outcome: outcome || undefined,
    };

    try {
      await this.apiService
        .post("/api/ai/feedback", feedbackData)
        .toPromise();

      this.selectedFeedback.set(type);
      this.submitted.set(true);
      this.feedbackSubmitted.emit(feedbackData);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Still mark as submitted locally to prevent spam
      this.selectedFeedback.set(type);
      this.submitted.set(true);
      this.feedbackSubmitted.emit(feedbackData);
    }
  }
}

