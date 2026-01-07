import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../button/button.component";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { RadioButton } from "primeng/radiobutton";
import { TooltipModule } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

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
    DialogModule,
    TextareaModule,
    RadioButton,
    TooltipModule,
    ButtonComponent,
  ],
  template: `
    <div class="ai-feedback" [class.compact]="compact()">
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
        @if (!compact()) {
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
          @if (
            detailedFeedbackType === "helpful" ||
            detailedFeedbackType === "thumbs_up"
          ) {
            <div class="outcome-question">
              <label class="section-label"
                >Did this help you achieve your goal?</label
              >
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
          <app-button variant="text" (clicked)="dialogVisible = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-send"
            [disabled]="!detailedFeedbackType"
            (clicked)="submitDetailedFeedback()"
            >Submit Feedback</app-button
          >
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrl: "./ai-feedback.component.scss",
})
export class AiFeedbackComponent {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // Angular 21: Use input() signals instead of @Input()
  messageId = input.required<string>();
  sessionId = input<string | undefined>(undefined);
  compact = input<boolean>(false);

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  feedbackSubmitted = output<FeedbackData>();

  // State
  selectedFeedback = signal<FeedbackType | null>(null);
  submitted = signal(false);
  dialogVisible = false;
  detailedFeedbackType: FeedbackType | null = null;
  feedbackComment = "";
  outcomeAnswer: "yes" | "partially" | "no" | null = null;

  // Feedback type options
  feedbackTypes = [
    {
      value: "not_helpful" as FeedbackType,
      label: "Not helpful",
      icon: "pi pi-thumbs-down",
    },
    {
      value: "incorrect" as FeedbackType,
      label: "Incorrect information",
      icon: "pi pi-times-circle",
    },
    {
      value: "unsafe" as FeedbackType,
      label: "Unsafe advice",
      icon: "pi pi-exclamation-triangle",
    },
    {
      value: "irrelevant" as FeedbackType,
      label: "Not relevant to my question",
      icon: "pi pi-question-circle",
    },
    {
      value: "helpful" as FeedbackType,
      label: "Actually helpful",
      icon: "pi pi-thumbs-up",
    },
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
      this.outcomeAnswer,
    );

    this.dialogVisible = false;
  }

  private async submitFeedback(
    type: FeedbackType,
    reason?: string,
    outcome?: string | null,
  ): Promise<void> {
    const feedbackData: FeedbackData = {
      message_id: this.messageId(),
      chat_session_id: this.sessionId(),
      feedback_type: type,
      feedback_reason: reason || undefined,
      outcome: outcome || undefined,
    };

    try {
      await firstValueFrom(
        this.apiService.post("/api/ai/feedback", feedbackData),
      );

      this.selectedFeedback.set(type);
      this.submitted.set(true);
      this.feedbackSubmitted.emit(feedbackData);
    } catch (error) {
      this.logger.error("Error submitting feedback:", error);
      // Still mark as submitted locally to prevent spam
      this.selectedFeedback.set(type);
      this.submitted.set(true);
      this.feedbackSubmitted.emit(feedbackData);
    }
  }
}
