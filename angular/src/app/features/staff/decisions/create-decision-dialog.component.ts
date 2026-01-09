/**
 * Create Decision Dialog Component
 *
 * Multi-step wizard for creating decisions
 */

import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TIME } from "@core/constants";
import type {
    CreateDecisionRequest,
    DecisionCategory,
    DecisionType,
    ReviewTrigger,
} from "@core/models/decision-ledger.models";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { RosterService } from "@features/roster/roster.service";
import { ConfidenceIndicatorComponent } from "@shared/components/confidence-indicator/confidence-indicator.component";
import { ModalComponent } from "@shared/components/modal/modal.component";
import { StepperComponent } from "@shared/components/stepper/stepper.component";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";

@Component({
  selector: "app-create-decision-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    Select,
    InputTextModule,
    Textarea,
    CheckboxModule,
    TagModule,
    ModalComponent,
    StepperComponent,
    ConfidenceIndicatorComponent,
  ],
  template: `
    <app-modal
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [header]="'Create Decision'"
      [size]="'lg'"
      [closable]="true"
      [showFooter]="true"
      [showDefaultButtons]="false"
    >
      <!-- Stepper -->
      <app-stepper
        [steps]="steps()"
        [activeStepIndex]="currentStep()"
        (stepClick)="goToStep($event)"
      ></app-stepper>

      <!-- Step Content -->
      <div class="step-content">
        <!-- Step 1: Select Athlete -->
        @if (currentStep() === 0) {
          <div class="step-panel">
            <h3>Select Athlete</h3>
            <p-select
              [options]="athletes()"
              [(ngModel)]="formData.athleteId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select an athlete"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full"
            ></p-select>
            @if (formData.athleteId) {
              <div class="athlete-info">
                <p>Selected: {{ getAthleteName(formData.athleteId) }}</p>
              </div>
            }
          </div>
        }

        <!-- Step 2: Select Decision Type -->
        @if (currentStep() === 1) {
          <div class="step-panel">
            <h3>Select Decision Type</h3>
            <p-select
              [options]="decisionTypeOptions"
              [(ngModel)]="formData.decisionType"
              placeholder="Select decision type"
              styleClass="w-full"
              (onValueChange)="onDecisionTypeChange()"
            ></p-select>
            @if (formData.decisionType) {
              <div class="info-box">
                <p>
                  <strong>Required Data Points:</strong>
                  {{ getRequiredDataPoints(formData.decisionType).join(", ") }}
                </p>
              </div>
            }
          </div>
        }

        <!-- Step 3: Enter Summary -->
        @if (currentStep() === 2) {
          <div class="step-panel">
            <h3>Decision Summary</h3>
            <p>Provide a clear, concise summary of the decision</p>
            <textarea
              pInputTextarea
              [(ngModel)]="formData.decisionSummary"
              placeholder="e.g., Reduced sprint volume by 50% due to elevated ACWR"
              rows="3"
              [maxlength]="500"
              styleClass="w-full"
            ></textarea>
            <div class="char-count">
              {{ formData.decisionSummary.length }}/500 characters
            </div>
          </div>
        }

        <!-- Step 4: Select Data Points -->
        @if (currentStep() === 3) {
          <div class="step-panel">
            <h3>Data Points Used</h3>
            <p>Select the data points that informed this decision</p>
            <div class="data-points-grid">
              @for (point of availableDataPoints(); track point) {
                <div class="data-point-item">
                  <p-checkbox
                    [(ngModel)]="point.selected"
                    [binary]="true"
                    variant="filled"
                    [inputId]="point.id"
                  ></p-checkbox>
                  <label [for]="point.id">
                    {{ point.label }}
                    @if (point.required) {
                      <p-tag value="Required" severity="danger"></p-tag>
                    }
                  </label>
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 5: Set Constraints -->
        @if (currentStep() === 4) {
          <div class="step-panel">
            <h3>Constraints</h3>
            <p>Add any constraints or limitations</p>
            <div class="constraints-list">
              @for (
                constraint of formData.decisionBasis.constraints;
                track $index
              ) {
                <div class="constraint-item">
                  <input
                    type="text"
                    pInputText
                    [(ngModel)]="formData.decisionBasis.constraints[$index]"
                    placeholder="e.g., RTP Phase 2, No sprinting >80%"
                    styleClass="w-full"
                  />
                  <p-button
                    icon="pi pi-times"
                    [text]="true"
                    severity="danger"
                    (onClick)="removeConstraint($index)"
                  ></p-button>
                </div>
              }
              <p-button
                label="Add Constraint"
                icon="pi pi-plus"
                [outlined]="true"
                (onClick)="addConstraint()"
              ></p-button>
            </div>
          </div>
        }

        <!-- Step 6: Set Review Trigger -->
        @if (currentStep() === 5) {
          <div class="step-panel">
            <h3>Review Trigger</h3>
            <p>When should this decision be reviewed?</p>
            <p-select
              [options]="reviewTriggerOptions"
              [(ngModel)]="formData.reviewTrigger"
              placeholder="Select review trigger"
              styleClass="w-full"
              (onValueChange)="onReviewTriggerChange()"
            ></p-select>
            @if (formData.reviewTrigger) {
              <div class="review-info">
                <p>
                  <strong>Review Date:</strong>
                  {{ calculateReviewDate() | date: "short" }}
                </p>
              </div>
            }
          </div>
        }

        <!-- Step 7: Review & Confirm -->
        @if (currentStep() === 6) {
          <div class="step-panel">
            <h3>Review & Confirm</h3>
            <div class="review-summary">
              <div class="summary-item">
                <label>Athlete:</label>
                <p>{{ getAthleteName(formData.athleteId) }}</p>
              </div>
              <div class="summary-item">
                <label>Decision Type:</label>
                <p>{{ getDecisionTypeLabel(formData.decisionType) }}</p>
              </div>
              <div class="summary-item">
                <label>Summary:</label>
                <p>{{ formData.decisionSummary }}</p>
              </div>
              <div class="summary-item">
                <label>Review Date:</label>
                <p>{{ calculateReviewDate() | date: "short" }}</p>
              </div>
            </div>

            <!-- Confidence Preview -->
            <div class="confidence-preview">
              <h4>Confidence Score</h4>
              <app-confidence-indicator
                [score]="calculatedConfidence()"
                [missingInputs]="missingRequiredData()"
                [showDetails]="true"
              ></app-confidence-indicator>
              @if (calculatedConfidence() < 0.7) {
                <div class="confidence-warning">
                  <p-tag
                    severity="warn"
                    value="Low Confidence - Consider collecting more data"
                  ></p-tag>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <ng-container footer>
        <p-button
          label="Cancel"
          [outlined]="true"
          (onClick)="onCancel()"
        ></p-button>
        @if (currentStep() > 0) {
          <p-button
            label="Back"
            [outlined]="true"
            (onClick)="previousStep()"
          ></p-button>
        }
        @if (currentStep() < 6) {
          <p-button
            label="Next"
            (onClick)="nextStep()"
            [disabled]="!canProceed()"
          ></p-button>
        } @else {
          <p-button
            label="Create Decision"
            (onClick)="onConfirm()"
            [disabled]="!canCreate()"
            [loading]="isCreating()"
          ></p-button>
        }
      </ng-container>
    </app-modal>
  `,
  styles: [
    `
      .step-content {
        padding: var(--space-4);
        min-height: 400px;
      }

      .step-panel {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .step-panel h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .athlete-info,
      .info-box,
      .review-info {
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
        margin-top: var(--space-2);
      }

      .char-count {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        text-align: right;
      }

      .data-points-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--space-3);
      }

      .data-point-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .constraints-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .constraint-item {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }

      .review-summary {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
      }

      .summary-item {
        display: flex;
        gap: var(--space-2);
      }

      .summary-item label {
        font-weight: 600;
        min-width: 120px;
      }

      .confidence-preview {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: var(--surface-ground);
        border-radius: var(--radius-md);
      }

      .confidence-warning {
        margin-top: var(--space-2);
      }
    `,
  ],
})
export class CreateDecisionDialogComponent {
  // Inputs/Outputs
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  created = output<CreateDecisionRequest>();

  // Services
  private decisionService = inject(DecisionLedgerService);
  private rosterService = inject(RosterService);

  // State
  currentStep = signal(0);
  isCreating = signal(false);
  formData: CreateDecisionRequest = {
    athleteId: "",
    decisionType: "other" as DecisionType,
    decisionSummary: "",
    decisionCategory: "tactical" as DecisionCategory,
    decisionBasis: {
      dataPoints: [],
      constraints: [],
      rationale: "",
      confidence: 0.8,
      dataQuality: {
        completeness: 1.0,
        staleDays: 0,
      },
    },
    reviewTrigger: "in_7d" as ReviewTrigger,
  };

  // Computed
  athletes = computed(() => {
    const players = this.rosterService.allPlayers();
    return players.map((p) => ({
      id: p.id,
      name: p.name || "Unknown",
    }));
  });

  steps = computed(() => [
    { id: "athlete", label: "Athlete", completed: !!this.formData.athleteId },
    {
      id: "type",
      label: "Type",
      completed: !!this.formData.decisionType,
    },
    {
      id: "summary",
      label: "Summary",
      completed: !!this.formData.decisionSummary,
    },
    {
      id: "data",
      label: "Data Points",
      completed: this.formData.decisionBasis.dataPoints.length > 0,
    },
    {
      id: "constraints",
      label: "Constraints",
      completed: true,
    },
    {
      id: "review",
      label: "Review Trigger",
      completed: !!this.formData.reviewTrigger,
    },
    { id: "confirm", label: "Confirm", completed: false },
  ]);

  decisionTypeOptions = [
    { label: "Load Adjustment", value: "load_adjustment" },
    { label: "RTP Clearance", value: "rtp_clearance" },
    { label: "RTP Progression", value: "rtp_progression" },
    { label: "Nutrition Change", value: "nutrition_change" },
    { label: "Hydration Adjustment", value: "hydration_adjustment" },
    { label: "Mental Protocol", value: "mental_protocol" },
    { label: "Tactical Modification", value: "tactical_modification" },
    { label: "Recovery Intervention", value: "recovery_intervention" },
    { label: "Medical Constraint", value: "medical_constraint" },
    { label: "Supplement Change", value: "supplement_change" },
    {
      label: "Training Program Assignment",
      value: "training_program_assignment",
    },
    { label: "Session Modification", value: "session_modification" },
    { label: "Readiness Override", value: "readiness_override" },
    { label: "ACWR Override", value: "acwr_override" },
    { label: "Other", value: "other" },
  ];

  reviewTriggerOptions = [
    { label: "In 24 hours", value: "in_24h" },
    { label: "In 72 hours", value: "in_72h" },
    { label: "In 7 days", value: "in_7d" },
    { label: "In 14 days", value: "in_14d" },
    { label: "In 4 weeks", value: "in_4w" },
    { label: "After next session", value: "after_next_session" },
    { label: "After next game", value: "after_next_game" },
    { label: "After 3 sessions", value: "after_3_sessions" },
    { label: "After 5 sessions", value: "after_5_sessions" },
  ];

  availableDataPoints = computed(() => {
    const required = this.getRequiredDataPoints(this.formData.decisionType);
    const allPoints = [
      { id: "acwr", label: "ACWR", required: required.includes("acwr") },
      {
        id: "readiness",
        label: "Readiness Score",
        required: required.includes("readiness"),
      },
      {
        id: "session_rpe",
        label: "Session RPE",
        required: required.includes("session_rpe"),
      },
      { id: "sleep", label: "Sleep", required: required.includes("sleep") },
      {
        id: "wellness",
        label: "Wellness",
        required: required.includes("wellness"),
      },
      {
        id: "pain_score",
        label: "Pain Score",
        required: required.includes("pain_score"),
      },
      {
        id: "mobility",
        label: "Mobility",
        required: required.includes("mobility"),
      },
      {
        id: "strength",
        label: "Strength",
        required: required.includes("strength"),
      },
      {
        id: "training_load",
        label: "Training Load",
        required: required.includes("training_load"),
      },
      {
        id: "hydration",
        label: "Hydration",
        required: required.includes("hydration"),
      },
      {
        id: "energy_availability",
        label: "Energy Availability",
        required: required.includes("energy_availability"),
      },
      {
        id: "stress",
        label: "Stress",
        required: required.includes("stress"),
      },
      {
        id: "confidence",
        label: "Confidence",
        required: required.includes("confidence"),
      },
    ];

    // Set selected state
    return allPoints.map((point) => ({
      ...point,
      selected: this.formData.decisionBasis.dataPoints.includes(point.label),
    }));
  });

  calculatedConfidence = computed(() => {
    const selected = this.availableDataPoints().filter((p) => p.selected);
    const required = this.getRequiredDataPoints(this.formData.decisionType);
    const completeness =
      required.length > 0 ? selected.length / required.length : 1.0;
    return Math.min(completeness, 0.95); // Cap at 0.95
  });

  missingRequiredData = computed(() => {
    const required = this.getRequiredDataPoints(this.formData.decisionType);
    const selected = this.availableDataPoints()
      .filter((p) => p.selected)
      .map((p) => p.id);
    return required.filter((r) => !selected.includes(r));
  });

  // Methods
  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    if (!visible) {
      this.reset();
    }
  }

  goToStep(index: number): void {
    if (this.canGoToStep(index)) {
      this.currentStep.set(index);
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 6) {
      this.currentStep.update((s) => s + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  canProceed(): boolean {
    const step = this.currentStep();
    if (step === 0) return !!this.formData.athleteId;
    if (step === 1) return !!this.formData.decisionType;
    if (step === 2) return !!this.formData.decisionSummary.trim();
    if (step === 3) return this.formData.decisionBasis.dataPoints.length > 0;
    if (step === 5) return !!this.formData.reviewTrigger;
    return true;
  }

  canGoToStep(index: number): boolean {
    // Can go to any previous step or current step
    return index <= this.currentStep();
  }

  canCreate(): boolean {
    return (
      !!this.formData.athleteId &&
      !!this.formData.decisionType &&
      !!this.formData.decisionSummary.trim() &&
      !!this.formData.reviewTrigger
    );
  }

  onDecisionTypeChange(): void {
    // Update category based on type
    const categoryMap: Record<DecisionType, DecisionCategory> = {
      load_adjustment: "load",
      rtp_clearance: "medical",
      rtp_progression: "medical",
      nutrition_change: "nutrition",
      hydration_adjustment: "nutrition",
      mental_protocol: "psychological",
      tactical_modification: "tactical",
      recovery_intervention: "recovery",
      medical_constraint: "medical",
      supplement_change: "nutrition",
      training_program_assignment: "load",
      session_modification: "load",
      readiness_override: "load",
      acwr_override: "load",
      other: "tactical",
    };
    this.formData.decisionCategory =
      categoryMap[this.formData.decisionType] || "tactical";
  }

  onReviewTriggerChange(): void {
    // Update data points based on selected data
    const selected = this.availableDataPoints()
      .filter((p) => p.selected)
      .map((p) => p.label);
    this.formData.decisionBasis.dataPoints = selected;
  }

  addConstraint(): void {
    this.formData.decisionBasis.constraints.push("");
  }

  removeConstraint(index: number): void {
    this.formData.decisionBasis.constraints.splice(index, 1);
  }

  calculateReviewDate(): Date {
    const trigger = this.formData.reviewTrigger;
    const now = new Date();

    if (trigger.startsWith("in_")) {
      const match = trigger.match(/in_(\d+)([hdw])/);
      if (match) {
        const [, amount, unit] = match;
        const hours =
          unit === "h"
            ? parseInt(amount)
            : unit === "d"
              ? parseInt(amount) * 24
              : parseInt(amount) * 24 * 7;
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
      }
    }

    return new Date(
      now.getTime() + TIME.DEFAULT_REVIEW_PERIOD_DAYS * TIME.MS_PER_DAY,
    );
  }

  async onConfirm(): Promise<void> {
    if (!this.canCreate()) return;

    this.isCreating.set(true);

    try {
      // Update decision basis with selected data points
      const selected = this.availableDataPoints()
        .filter((p) => p.selected)
        .map((p) => p.label);
      this.formData.decisionBasis.dataPoints = selected;
      this.formData.decisionBasis.confidence = this.calculatedConfidence();

      this.created.emit({ ...this.formData });
      this.reset();
    } catch (error) {
      console.error("Error creating decision:", error);
    } finally {
      this.isCreating.set(false);
    }
  }

  onCancel(): void {
    this.reset();
  }

  reset(): void {
    this.currentStep.set(0);
    this.formData = {
      athleteId: "",
      decisionType: "other" as DecisionType,
      decisionSummary: "",
      decisionCategory: "tactical" as DecisionCategory,
      decisionBasis: {
        dataPoints: [],
        constraints: [],
        rationale: "",
        confidence: 0.8,
        dataQuality: {
          completeness: 1.0,
          staleDays: 0,
        },
      },
      reviewTrigger: "in_7d" as ReviewTrigger,
    };
  }

  getRequiredDataPoints(type: DecisionType): string[] {
    const requirements: Record<DecisionType, string[]> = {
      load_adjustment: ["acwr", "readiness", "session_rpe", "sleep"],
      rtp_clearance: ["pain_score", "mobility", "strength", "load_tolerance"],
      rtp_progression: ["pain_score", "mobility", "strength"],
      nutrition_change: ["training_load", "hydration", "energy_availability"],
      hydration_adjustment: ["hydration", "training_load"],
      mental_protocol: ["stress", "confidence", "sleep", "readiness"],
      tactical_modification: ["readiness", "training_load"],
      recovery_intervention: ["readiness", "sleep", "wellness"],
      medical_constraint: ["pain_score", "mobility"],
      supplement_change: ["training_load", "hydration"],
      training_program_assignment: ["acwr", "readiness"],
      session_modification: ["readiness", "session_rpe"],
      readiness_override: ["readiness"],
      acwr_override: ["acwr"],
      other: [],
    };
    return requirements[type] || [];
  }

  getAthleteName(id: string): string {
    const athlete = this.athletes().find((a) => a.id === id);
    return athlete?.name || "Unknown";
  }

  getDecisionTypeLabel(type: DecisionType): string {
    const option = this.decisionTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  }
}
