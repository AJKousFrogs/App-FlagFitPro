import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { StepsModule } from "primeng/steps";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";

export interface StepperStep {
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  valid?: boolean;
}

/**
 * Stepper Component - Angular 21
 *
 * A reusable stepper/wizard component for multi-step forms
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-stepper",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StepsModule, ButtonComponent, IconButtonComponent],
  template: `
    <div class="stepper-group">
      <p-steps
        [model]="steps()"
        [(activeIndex)]="currentStepIndex"
        [readonly]="readonly()"
        [class.stepper-vertical]="orientation() === 'vertical'"
        (activeIndexChange)="onStepChange($event)"
      >
      </p-steps>

      <div class="stepper-content">
        @for (step of steps(); track $index) {
          @if ($index === currentStepIndex()) {
            <div
              class="step-panel"
              [attr.aria-hidden]="$index !== currentStepIndex()"
            >
              <ng-content [ngProjectAs]="'step-' + $index"></ng-content>
            </div>
          }
        }
      </div>

      @if (showNavigation()) {
        <div class="stepper-actions">
          @if (currentStepIndex() > 0) {
            <app-button
              variant="outlined"
              iconLeft="pi-arrow-left"
              (clicked)="previous()"
              >Previous</app-button
            >
          }
          <div class="stepper-actions-right">
            @if (currentStepIndex() < steps().length - 1) {
              <app-button
                iconLeft="pi-arrow-right"
                [disabled]="!canProceed()"
                (clicked)="next()"
                >Next</app-button
              >
            } @else {
              <app-icon-button
                icon="pi-check"
                variant="success"
                [disabled]="!canProceed()"
                (clicked)="finish()"
                ariaLabel="check"
              />
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./stepper.component.scss",
})
export class StepperComponent {
  // Configuration
  steps = input.required<StepperStep[]>();
  activeIndex = input<number>(0);
  orientation = input<"horizontal" | "vertical">("horizontal");
  readonly = input<boolean>(false);
  showNavigation = input<boolean>(true);
  finishLabel = input<string>("Finish");
  allowStepClick = input<boolean>(true);

  // State
  currentStepIndex = signal<number>(0);

  // Computed
  canProceed = computed(() => {
    const currentStep = this.steps()[this.currentStepIndex()];
    return currentStep?.valid !== false && !currentStep?.disabled;
  });

  // Outputs
  stepChange = output<number>();
  stepClick = output<number>();
  finished = output<void>();

  constructor() {
    // Sync activeIndex input with currentStepIndex signal
    this.currentStepIndex.set(this.activeIndex());
  }

  onStepChange(index: number): void {
    if (this.allowStepClick() && index !== this.currentStepIndex()) {
      this.currentStepIndex.set(index);
      this.stepChange.emit(index);
      this.stepClick.emit(index);
    }
  }

  next(): void {
    if (
      this.currentStepIndex() < this.steps().length - 1 &&
      this.canProceed()
    ) {
      const nextIndex = this.currentStepIndex() + 1;
      this.currentStepIndex.set(nextIndex);
      this.stepChange.emit(nextIndex);
    }
  }

  previous(): void {
    if (this.currentStepIndex() > 0) {
      const prevIndex = this.currentStepIndex() - 1;
      this.currentStepIndex.set(prevIndex);
      this.stepChange.emit(prevIndex);
    }
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps().length && this.allowStepClick()) {
      this.currentStepIndex.set(index);
      this.stepChange.emit(index);
      this.stepClick.emit(index);
    }
  }

  finish(): void {
    if (this.canProceed()) {
      this.finished.emit();
    }
  }

  validateStep(index: number, isValid: boolean): void {
    const steps = [...this.steps()];
    if (steps[index]) {
      steps[index] = { ...steps[index], valid: isValid };
      // Note: This would require updating the steps input, which isn't directly mutable
      // In a real implementation, you'd manage this through a service or parent component
    }
  }
}
