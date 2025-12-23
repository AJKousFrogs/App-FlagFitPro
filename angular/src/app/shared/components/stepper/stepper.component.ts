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
import { ButtonModule } from "primeng/button";

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
  imports: [CommonModule, StepsModule, ButtonModule],
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
            <p-button
              label="Previous"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              (onClick)="previous()"
            >
            </p-button>
          }
          <div class="stepper-actions-right">
            @if (currentStepIndex() < steps().length - 1) {
              <p-button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                [disabled]="!canProceed()"
                (onClick)="next()"
              >
              </p-button>
            } @else {
              <p-button
                [label]="finishLabel()"
                icon="pi pi-check"
                severity="success"
                [disabled]="!canProceed()"
                (onClick)="finish()"
              >
              </p-button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stepper-group {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .stepper-content {
        min-height: 300px;
        padding: 1.5rem 0;
      }

      .step-panel {
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .stepper-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-surface-border);
      }

      .stepper-actions-right {
        display: flex;
        gap: 0.75rem;
      }

      :host ::ng-deep .stepper-vertical .p-steps {
        flex-direction: column;
      }
    `,
  ],
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
