/**
 * Review Decision Dialog Component
 *
 * Dialog for reviewing decisions
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { ButtonComponent } from "@shared/components/button/button.component";
import { Select, type SelectChangeEvent } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Checkbox, type CheckboxChangeEvent } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";

import { StatusTagComponent } from "@shared/components/status-tag/status-tag.component";
import { AppDialogComponent } from "@shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "@shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "@shared/components/dialog-header/dialog-header.component";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { LoggerService } from "@core/services/logger.service";
import type {
  DecisionLedgerEntry,
  ReviewDecisionRequest,
  ReviewOutcome,
} from "@core/models/decision-ledger.models";

@Component({
  selector: "app-review-decision-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    Select,
    Textarea,
    Checkbox,
    DatePicker,
    StatusTagComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [blockScroll]="true"
      [styleClass]="'dialog-lg decision-dialog decision-dialog--review'"
    >
      <app-dialog-header
        icon="check-circle"
        title="Review Decision"
        subtitle="Document the outcome, any consequences, and the next review point."
        (close)="onCancel()"
      />

      @if (decision()) {
        <!-- Decision Context -->
        <div class="review-context">
          <h3>Decision Context</h3>
          <div class="context-item">
            <label>Athlete:</label>
            <p>{{ decision()!.athleteName }}</p>
          </div>
          <div class="context-item">
            <label>Decision:</label>
            <p>{{ decision()!.decisionSummary }}</p>
          </div>
          <div class="context-item">
            <label>Made By:</label>
            <p>{{ decision()!.madeBy.name }} ({{ decision()!.madeBy.role }})</p>
          </div>
          <div class="context-item">
            <label>Created:</label>
            <p>{{ formatDate(decision()!.createdAt) }}</p>
          </div>
          <div class="context-item">
            <label>Review Due:</label>
            <p>
              {{ formatDate(decision()!.reviewDate) }}
              @if (isOverdue()) {
                <app-status-tag severity="danger" value="Overdue" size="sm" />
              }
            </p>
          </div>
        </div>

        <!-- Review Options -->
        <div class="review-options">
          <h3>Review Outcome</h3>
          <p-select
            inputId="review-outcome-select"
            [options]="reviewOutcomeOptions"
            [ngModel]="formData.reviewOutcome"
            (onChange)="onReviewOutcomeSelect($event)"
            placeholder="Select review outcome"
            class="w-full"
            [attr.aria-label]="'Select review outcome'"
          ></p-select>

          @if (formData.reviewOutcome === "extended") {
            <div class="extension-options">
              <label for="new-review-date">New Review Date</label>
              <p-datepicker
                inputId="new-review-date"
                [ngModel]="formData.newReviewDate"
                (onSelect)="onNewReviewDateChange($event)"
                [minDate]="minDate"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                class="w-full"
                [attr.aria-label]="'Select new review date'"
              ></p-datepicker>
            </div>
          }
        </div>

        <!-- Review Notes -->
        <div class="review-notes">
          <h3>Review Notes</h3>
          <textarea
            pInputTextarea
            [value]="formData.reviewNotes"
            (input)="onReviewNotesInput($event)"
            placeholder="Add notes about this review..."
            rows="4"
            class="w-full"
          ></textarea>
        </div>

        <!-- Outcome Tracking -->
        <div class="outcome-tracking">
          <h3>Outcome Tracking</h3>
          <div class="outcome-item">
            <p-checkbox
              [ngModel]="formData.outcomeData.goalAchieved"
              (onChange)="onGoalAchievedChange($event)"
              [binary]="true"
              variant="filled"
              inputId="goal-achieved"
            ></p-checkbox>
            <label for="goal-achieved">Goal was achieved</label>
          </div>

          <div class="consequences-list">
            <label>Unintended Consequences</label>
            @for (
              consequence of formData.outcomeData.unintendedConsequences;
              track $index
            ) {
              <div class="consequence-item">
                <input
                  type="text"
                  pInputText
                  [value]="formData.outcomeData.unintendedConsequences[$index]"
                  (input)="onConsequenceInput($index, $event)"
                  placeholder="Describe any unintended consequences"
                  class="w-full"
                />
                <app-button
                  iconLeft="pi-times"
                  variant="danger"
                  (clicked)="removeConsequence($index)"
                />
              </div>
            }
            <app-button
              iconLeft="pi-plus"
              variant="outlined"
              (clicked)="addConsequence()"
              >Add Consequence</app-button
            >
          </div>

          <div class="lessons-learned">
            <label>Lessons Learned</label>
            <textarea
              pInputTextarea
              [value]="formData.outcomeData.lessonsLearned"
              (input)="onLessonsLearnedInput($event)"
              placeholder="What did we learn from this decision?"
              rows="3"
              class="w-full"
            ></textarea>
          </div>
        </div>
      }

      <!-- Footer -->
      <app-dialog-footer
        cancelLabel="Cancel"
        primaryLabel="Submit Review"
        [disabled]="!canSubmit()"
        [loading]="isSubmitting()"
        (cancel)="onCancel()"
        (primary)="onConfirm()"
      />
    </app-dialog>
  `,
  styleUrl: "./review-decision-dialog.component.scss",
})
export class ReviewDecisionDialogComponent {
  // Inputs/Outputs
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  decision = input<DecisionLedgerEntry | null>(null);
  reviewed = output<ReviewDecisionRequest>();

  // Services
  private decisionService = inject(DecisionLedgerService);
  private logger = inject(LoggerService);

  // State
  isSubmitting = signal(false);
  minDate = new Date();
  formData = {
    decisionId: "",
    reviewOutcome: "maintained" as ReviewOutcome,
    reviewNotes: "",
    outcomeData: {
      athleteStateBefore: {} as Record<string, unknown>,
      athleteStateAfter: {} as Record<string, unknown>,
      goalAchieved: false,
      unintendedConsequences: [] as string[],
      lessonsLearned: "",
    },
    newReviewDate: undefined as Date | undefined,
  };

  // Computed
  reviewOutcomeOptions = [
    { label: "Maintain Decision", value: "maintained" },
    { label: "Modify Decision", value: "modified" },
    { label: "Reverse Decision", value: "reversed" },
    { label: "Extend Decision", value: "extended" },
  ];

  isOverdue = computed(() => {
    const d = this.decision();
    if (!d) return false;
    return new Date(d.reviewDate) < new Date();
  });

  // Methods
  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    const currentDecision = this.decision();
    if (visible && currentDecision) {
      this.formData.decisionId = currentDecision.id;
    } else if (!visible) {
      this.reset();
    }
  }

  onOutcomeChange(): void {
    // Reset extension date if not extending
    if (this.formData.reviewOutcome !== "extended") {
      this.formData.newReviewDate = undefined;
    }
  }

  addConsequence(): void {
    this.formData.outcomeData.unintendedConsequences.push("");
  }

  removeConsequence(index: number): void {
    this.formData.outcomeData.unintendedConsequences.splice(index, 1);
  }

  onReviewOutcomeSelect(event: SelectChangeEvent): void {
    this.formData.reviewOutcome =
      (event.value as ReviewOutcome | null | undefined) ?? ("maintained" as ReviewOutcome);
    this.onOutcomeChange();
  }

  onNewReviewDateChange(value: Date | null): void {
    this.formData.newReviewDate = value ?? undefined;
  }

  onReviewNotesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.formData.reviewNotes = input?.value ?? "";
  }

  onGoalAchievedChange(event: CheckboxChangeEvent): void {
    this.formData.outcomeData.goalAchieved = Boolean(event.checked);
  }

  onConsequenceInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.formData.outcomeData.unintendedConsequences[index] =
      input?.value ?? "";
  }

  onLessonsLearnedInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.formData.outcomeData.lessonsLearned = input?.value ?? "";
  }

  canSubmit(): boolean {
    return !!this.formData.reviewOutcome;
  }

  async onConfirm(): Promise<void> {
    if (!this.canSubmit() || !this.decision()) return;

    this.isSubmitting.set(true);

    try {
      this.reviewed.emit({ ...this.formData });
      this.reset();
    } catch (error) {
      this.logger.error("Error submitting review", error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  reset(): void {
    this.formData = {
      decisionId: "",
      reviewOutcome: "maintained" as ReviewOutcome,
      reviewNotes: "",
      outcomeData: {
        athleteStateBefore: {} as Record<string, unknown>,
        athleteStateAfter: {} as Record<string, unknown>,
        goalAchieved: false,
        unintendedConsequences: [] as string[],
        lessonsLearned: "",
      },
      newReviewDate: undefined as Date | undefined,
    };
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
