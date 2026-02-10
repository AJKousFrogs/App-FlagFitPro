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
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";

import { StatusTagComponent } from "@shared/components/status-tag/status-tag.component";
import { ModalComponent } from "@shared/components/modal/modal.component";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { LoggerService } from "@core/services/logger.service";
import type {
  DecisionLedgerEntry,
  ReviewDecisionRequest,
  ReviewOutcome,
} from "@core/models/decision-ledger.models";

@Component({
  selector: "app-review-decision-dialog",
  standalone: true,
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
    ModalComponent,
  ],
  template: `
    <app-modal
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [header]="'Review Decision'"
      [size]="'lg'"
      [closable]="true"
      [showFooter]="true"
      [showDefaultButtons]="false"
    >
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
            [(ngModel)]="formData.reviewOutcome"
            placeholder="Select review outcome"
            styleClass="w-full"
            (onValueChange)="onOutcomeChange()"
            [attr.aria-label]="'Select review outcome'"
          ></p-select>

          @if (formData.reviewOutcome === "extended") {
            <div class="extension-options">
              <label for="new-review-date">New Review Date</label>
              <p-datepicker
                inputId="new-review-date"
                [(ngModel)]="formData.newReviewDate"
                [minDate]="minDate"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                styleClass="w-full"
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
            [(ngModel)]="formData.reviewNotes"
            placeholder="Add notes about this review..."
            rows="4"
            styleClass="w-full"
          ></textarea>
        </div>

        <!-- Outcome Tracking -->
        <div class="outcome-tracking">
          <h3>Outcome Tracking</h3>
          <div class="outcome-item">
            <p-checkbox
              [(ngModel)]="formData.outcomeData.goalAchieved"
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
                  [(ngModel)]="
                    formData.outcomeData.unintendedConsequences[$index]
                  "
                  placeholder="Describe any unintended consequences"
                  styleClass="w-full"
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
              [(ngModel)]="formData.outcomeData.lessonsLearned"
              placeholder="What did we learn from this decision?"
              rows="3"
              styleClass="w-full"
            ></textarea>
          </div>
        </div>
      }

      <!-- Footer -->
      <ng-container footer>
        <app-button variant="outlined" (clicked)="onCancel()"
          >Cancel</app-button
        >
        <app-button
          (clicked)="onConfirm()"
          [disabled]="!canSubmit()"
          [loading]="isSubmitting()"
          >Submit Review</app-button
        >
      </ng-container>
    </app-modal>
  `,
  styles: [
    `
      .review-context,
      .review-options,
      .review-notes,
      .outcome-tracking {
        margin-bottom: var(--space-6);
      }

      .review-context h3,
      .review-options h3,
      .review-notes h3,
      .outcome-tracking h3 {
        font-size: var(--ds-font-size-lg);
        font-weight: var(--ds-font-weight-semibold);
        margin: 0 0 var(--space-3) 0;
      }

      .context-item {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .context-item label {
        font-weight: var(--ds-font-weight-semibold);
        min-width: var(--size-120);
      }

      .extension-options {
        margin-top: var(--space-3);
      }

      .outcome-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }

      .consequences-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-top: var(--space-3);
      }

      .consequence-item {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }

      .lessons-learned {
        margin-top: var(--space-3);
      }

      .lessons-learned label {
        display: block;
        font-weight: var(--ds-font-weight-semibold);
        margin-bottom: var(--space-2);
      }
    `,
  ],
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
