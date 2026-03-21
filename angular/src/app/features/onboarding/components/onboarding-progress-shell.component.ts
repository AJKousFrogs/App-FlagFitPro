import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { Step, StepList, Stepper } from "primeng/stepper";
import { AlertComponent } from "../../../shared/components/alert/alert.component";

type OnboardingStepSummary = {
  label: string;
  icon: string;
};

type CompletionStats = {
  completed: number;
  total: number;
  percent: number;
  remaining: number;
};

@Component({
  selector: "app-onboarding-progress-shell",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressBarComponent, Stepper, StepList, Step, AlertComponent],
  templateUrl: "./onboarding-progress-shell.component.html",
  styleUrl: "./onboarding-progress-shell.component.scss",
})
export class OnboardingProgressShellComponent {
  completionStats = input<CompletionStats>({
    completed: 0,
    total: 0,
    percent: 0,
    remaining: 0,
  });
  currentStep = input(0);
  stepPosition = input("");
  currentStepLabel = input("Setup");
  lastSaved = input<string | Date | null>(null);
  isSaving = input(false);
  hasPendingRequirements = input(false);
  pendingRequirementLabels = input<string[]>([]);
  steps = input<OnboardingStepSummary[]>([]);

  stepperChange = output<number>();

  onStepperValueChange(value: number | undefined): void {
    if (typeof value === "number") {
      this.stepperChange.emit(value);
    }
  }
}
