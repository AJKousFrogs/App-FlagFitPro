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
import { CommonModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { InputTextareaModule } from "primeng/inputtextarea";
import { CheckboxModule } from "primeng/checkbox";
import { CalendarModule } from "primeng/calendar";
import { TagModule } from "primeng/tag";
import { ModalComponent } from "@shared/components/modal/modal.component";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
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
    DialogModule,
    ButtonModule,
    DropdownModule,
    InputTextareaModule,
    CheckboxModule,
    CalendarModule,
    TagModule,
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
            <p>
              {{ decision()!.madeBy.name }} ({{ decision()!.madeBy.role }})
            </p>
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
                <p-tag severity="danger" value="Overdue"></p-tag>
              }
            </p>
          </div>
        </div>

        <!-- Review Options -->
        <div class="review-options">
          <h3>Review Outcome</h3>
          <p-dropdown
            [options]="reviewOutcomeOptions"
            [(ngModel)]="formData.reviewOutcome"
            placeholder="Select review outcome"
            styleClass="w-full"
            (onChange)="onOutcomeChange()"
          ></p-dropdown>

          @if (formData.reviewOutcome === "extended") {
            <div class="extension-options">
              <label>New Review Date</label>
              <p-calendar
                [(ngModel)]="formData.newReviewDate"
                [minDate]="new Date()"
                [showIcon]="true"
                dateFormat="mm/dd/yy"
                styleClass="w-full"
              ></p-calendar>
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
                  [(ngModel)]="formData.outcomeData.unintendedConsequences[$index]"
                  placeholder="Describe any unintended consequences"
                  styleClass="w-full"
                />
                <p-button
                  icon="pi pi-times"
                  [text]="true"
                  severity="danger"
                  (onClick)="removeConsequence($index)"
                ></p-button>
              </div>
            }
            <p-button
              label="Add Consequence"
              icon="pi pi-plus"
              [outlined]="true"
              (onClick)="addConsequence()"
            ></p-button>
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
        <p-button label="Cancel" [outlined]="true" (onClick)="onCancel()"></p-button>
        <p-button
          label="Submit Review"
          (onClick)="onConfirm()"
          [disabled]="!canSubmit()"
          [loading]="isSubmitting()"
        ></p-button>
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
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 var(--space-3) 0;
      }

      .context-item {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .context-item label {
        font-weight: 600;
        min-width: 120px;
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
        font-weight: 600;
        margin-bottom: var(--space-2);
      }
    `,
  ],
})
export class ReviewDecisionDialogComponent {
  // Inputs/Outputs
  visible = input<boolean>(false);
  decision = input<DecisionLedgerEntry | null>(null);
  reviewed = output<ReviewDecisionRequest>();

  // Services
  private decisionService = inject(DecisionLedgerService);

  // State
  isSubmitting = signal(false);
  formData: ReviewDecisionRequest = {
    decisionId: "",
    reviewOutcome: "maintained" as ReviewOutcome,
    reviewNotes: "",
    outcomeData: {
      athleteStateBefore: {},
      athleteStateAfter: {},
      goalAchieved: false,
      unintendedConsequences: [],
      lessonsLearned: "",
    },
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
    if (visible && this.decision()) {
      this.formData.decisionId = this.decision()!.id;
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
      console.error("Error submitting review:", error);
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
        athleteStateBefore: {},
        athleteStateAfter: {},
        goalAchieved: false,
        unintendedConsequences: [],
        lessonsLearned: "",
      },
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

