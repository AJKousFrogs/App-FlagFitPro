/**
 * Create Decision Dialog Component
 *
 * Multi-step wizard for creating decisions
 */

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { TIME } from "@core/constants";
import type {
  CreateDecisionRequest,
  DecisionCategory,
  DecisionType,
  ReviewTrigger,
} from "@core/models/decision-ledger.models";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { LoggerService } from "@core/services/logger.service";
import { RosterService } from "@features/roster/roster.service";
import { ConfidenceIndicatorComponent } from "@shared/components/confidence-indicator/confidence-indicator.component";
import { StepperComponent } from "@shared/components/stepper/stepper.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { AppDialogComponent } from "@shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "@shared/components/dialog-header/dialog-header.component";
import { CheckboxComponent } from "@shared/components/checkbox/checkbox.component";
import { type CheckboxChangeEvent } from "primeng/checkbox";

import { FormInputComponent } from "@shared/components/form-input/form-input.component";
import { SelectComponent } from "@shared/components/select/select.component";

import { StatusTagComponent } from "@shared/components/status-tag/status-tag.component";
import { TextareaComponent } from "@shared/components/textarea/textarea.component";

@Component({
  selector: "app-create-decision-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    SelectComponent,
    FormInputComponent,
    TextareaComponent,
    CheckboxComponent,
    StatusTagComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    StepperComponent,
    ConfidenceIndicatorComponent,
  ],
  templateUrl: "./create-decision-dialog.component.html",
  styleUrl: "./create-decision-dialog.component.scss",
})
export class CreateDecisionDialogComponent {
  // Inputs/Outputs
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  created = output<CreateDecisionRequest>();

  // Services
  private decisionService = inject(DecisionLedgerService);
  private rosterService = inject(RosterService);
  private logger = inject(LoggerService);

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

  onAthleteSelect(value: string | null | undefined): void {
    this.formData.athleteId = typeof value === "string" ? value : "";
  }

  onDecisionTypeSelect(value: DecisionType | null | undefined): void {
    this.formData.decisionType = value ?? ("other" as DecisionType);
    this.onDecisionTypeChange();
  }

  onDecisionSummaryInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.formData.decisionSummary = input?.value ?? "";
  }

  onDataPointToggle(label: string, event: CheckboxChangeEvent): void {
    const isChecked = Boolean(event.checked);
    const current = this.formData.decisionBasis.dataPoints;

    if (isChecked && !current.includes(label)) {
      this.formData.decisionBasis.dataPoints = [...current, label];
    } else if (!isChecked && current.includes(label)) {
      this.formData.decisionBasis.dataPoints = current.filter(
        (point) => point !== label,
      );
    }
  }

  onReviewTriggerSelect(value: ReviewTrigger | null | undefined): void {
    this.formData.reviewTrigger = value ?? ("in_7d" as ReviewTrigger);
    this.onReviewTriggerChange();
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
      this.logger.error("Error creating decision", error);
    } finally {
      this.isCreating.set(false);
    }
  }

  onCancel(): void {
    this.reset();
    this.visibleChange.emit(false);
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
