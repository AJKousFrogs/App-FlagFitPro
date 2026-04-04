import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
export interface StepperStep {
  id: string;
  label: string;
  icon?: string;
  completed?: boolean;
  disabled?: boolean;
}

@Component({
  selector: "app-stepper",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="stepper-container">
      <nav class="stepper-nav" role="navigation" aria-label="Step navigation">
        @for (step of steps(); track step.id; let i = $index) {
          <button
            type="button"
            class="stepper-step"
            [class.active]="activeStepIndex() === i"
            [class.completed]="step.completed || i < activeStepIndex()"
            [class.disabled]="step.disabled"
            [attr.aria-current]="activeStepIndex() === i ? 'step' : null"
            [attr.aria-label]="'Step ' + (i + 1) + ': ' + step.label"
            (click)="!step.disabled && onStepClick(i)"
          >
            <div class="step-indicator">
              @if (step.completed || i < activeStepIndex()) {
                <i class="pi pi-check"></i>
              } @else {
                <span class="step-number">{{ i + 1 }}</span>
              }
            </div>
            <span class="step-label">{{ step.label }}</span>
            @if (i < steps().length - 1) {
              <div class="step-connector"></div>
            }
          </button>
        }
      </nav>
    </div>
  `,
  styleUrl: "./stepper.component.scss",
})
export class StepperComponent {
  steps = input.required<StepperStep[]>();
  activeStepIndex = input<number>(0);

  stepClick = output<number>();

  onStepClick(index: number): void {
    if (!this.steps()[index]?.disabled) {
      this.stepClick.emit(index);
    }
  }
}
