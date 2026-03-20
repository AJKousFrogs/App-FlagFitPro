import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { ProgressBar } from "primeng/progressbar";
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
  imports: [CommonModule, ProgressBar, Stepper, StepList, Step, AlertComponent],
  templateUrl: "./onboarding-progress-shell.component.html",
  styleUrl: "./onboarding-progress-shell.component.scss",
})
export class OnboardingProgressShellComponent {
  @Input() completionStats: CompletionStats = {
    completed: 0,
    total: 0,
    percent: 0,
    remaining: 0,
  };
  @Input() currentStep = 0;
  @Input() stepPosition = "";
  @Input() currentStepLabel = "Setup";
  @Input() lastSaved: string | Date | null = null;
  @Input() isSaving = false;
  @Input() hasPendingRequirements = false;
  @Input() pendingRequirementLabels: string[] = [];
  @Input() steps: OnboardingStepSummary[] = [];

  @Output() stepperChange = new EventEmitter<number>();

  onStepperValueChange(value: number | undefined): void {
    if (typeof value === "number") {
      this.stepperChange.emit(value);
    }
  }
}
