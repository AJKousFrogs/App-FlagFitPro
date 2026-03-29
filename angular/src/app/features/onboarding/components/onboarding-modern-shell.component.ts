import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  ViewEncapsulation,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { StepperModule } from "primeng/stepper";
import type { OnboardingStep } from "../models/onboarding.model";

@Component({
  selector: "app-onboarding-modern-shell",
  standalone: true,
  imports: [CommonModule, ProgressBarComponent, AlertComponent, StepperModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: "./onboarding-modern-shell.component.html",
  styleUrl: "./onboarding-modern-shell.component.scss",
})
export class OnboardingModernShellComponent {
  readonly steps = input.required<OnboardingStep[]>();
  readonly currentStep = input.required<number>();
  readonly stepPosition = input.required<number>();
  readonly currentStepLabel = input.required<string>();
  readonly lastSaved = input<string | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly hasPendingRequirements = input.required<boolean>();
  readonly pendingRequirementLabels = input.required<string[]>();
  readonly completionStats = input.required<{
    percent: number;
    completed: number;
    total: number;
    remaining: number;
  }>();

  readonly stepperChange = output<number>();

  readonly tasksRemainingText = computed(() => {
    const remaining = this.completionStats().remaining;
    return remaining === 1 ? "1 task remaining" : `${remaining} tasks remaining`;
  });

  onStepperValueChange(value: number | string | undefined): void {
    const numericValue = typeof value === "string" ? parseInt(value, 10) : value;
    if (typeof numericValue === "number" && !isNaN(numericValue)) {
      this.stepperChange.emit(numericValue);
    }
  }
}
