import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

type OnboardingStepSummary = {
  label: string;
  icon: string;
  completed?: boolean;
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
  imports: [],
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

  navigateToStep(index: number): void {
    if (this.steps()[index]?.completed) {
      this.stepperChange.emit(index);
    }
  }
}
