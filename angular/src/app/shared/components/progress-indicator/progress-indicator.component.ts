import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressBarModule } from "primeng/progressbar";

/**
 * Progress Indicator Component - Angular 19+
 *
 * A standardized progress indicator component for showing completion status
 * Uses Angular signals for reactive state management
 */
@Component({
  selector: "app-progress-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressBarModule],
  template: `
    <div [class]="containerClass()">
      <!-- Label -->
      @if (label()) {
        <div class="progress-header">
          <label class="progress-label">{{ label() }}</label>
          @if (showValue()) {
            <span class="progress-value">{{ displayValue() }}</span>
          }
        </div>
      }

      <!-- Progress Bar -->
      <div class="progress-bar-wrapper">
        @if (variant() === "linear") {
          <p-progressBar
            [value]="value()"
            [showValue]="false"
            [style]="progressBarStyle()"
          >
          </p-progressBar>
        } @else if (variant() === "circular") {
          <div
            class="circular-progress"
            [style.width]="size() + 'px'"
            [style.height]="size() + 'px'"
          >
            <svg class="circular-svg" viewBox="0 0 100 100">
              <circle
                class="circular-background"
                cx="50"
                cy="50"
                r="45"
                [attr.stroke]="backgroundColor()"
                [attr.stroke-width]="strokeWidth()"
                fill="none"
              />
              <circle
                class="circular-progress-circle"
                cx="50"
                cy="50"
                r="45"
                [attr.stroke]="color()"
                [attr.stroke-width]="strokeWidth()"
                [attr.stroke-dasharray]="circumference()"
                [attr.stroke-dashoffset]="dashOffset()"
                fill="none"
                [attr.stroke-linecap]="strokeLinecap()"
              />
            </svg>
            @if (showValue()) {
              <div class="circular-value">{{ displayValue() }}</div>
            }
          </div>
        } @else if (variant() === "steps") {
          <div class="steps-progress">
            @for (step of steps(); track step.label) {
              <div
                class="step-item"
                [class.active]="step.completed || step.active"
                [class.completed]="step.completed"
              >
                <div class="step-marker">
                  @if (step.completed) {
                    <i class="pi pi-check"></i>
                  } @else {
                    <span class="step-number">{{ step.number }}</span>
                  }
                </div>
                <div class="step-label">{{ step.label }}</div>
                @if (!isLastStep(step)) {
                  <div class="step-connector"></div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Helper Text -->
      @if (helperText()) {
        <div class="progress-helper">{{ helperText() }}</div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .progress-indicator-container {
        width: 100%;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2, 0.5rem);
      }

      .progress-label {
        font-size: var(--font-body-md, 1rem);
        font-weight: 500;
        color: var(--text-primary, #1a1a1a);
        margin: 0;
      }

      .progress-value {
        font-size: var(--font-body-md, 1rem);
        font-weight: 600;
        color: var(--color-brand-primary, #089949);
      }

      .progress-bar-wrapper {
        width: 100%;
      }

      /* Circular Progress */
      .circular-progress {
        position: relative;
        margin: 0 auto;
      }

      .circular-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .circular-background {
        opacity: 0.2;
      }

      .circular-progress-circle {
        transition: stroke-dashoffset 0.3s ease;
      }

      .circular-value {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: var(--font-heading-md, 1.25rem);
        font-weight: 600;
        color: var(--text-primary, #1a1a1a);
      }

      /* Steps Progress */
      .steps-progress {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        position: relative;
      }

      .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        position: relative;
      }

      .step-marker {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-200, #e5e7eb);
        color: var(--text-secondary, #6b7280);
        font-weight: 600;
        margin-bottom: var(--space-2, 0.5rem);
        transition: all 0.3s ease;
      }

      .step-item.active .step-marker {
        background: var(--color-brand-primary, #089949);
        color: var(--color-text-on-primary, #ffffff);
      }

      .step-item.completed .step-marker {
        background: var(--p-success-color, #10c96b);
        color: var(--color-text-on-primary, #ffffff);
      }

      .step-number {
        font-size: var(--font-body-sm, 0.875rem);
      }

      .step-label {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
        text-align: center;
        max-width: 100px;
      }

      .step-item.active .step-label {
        color: var(--text-primary, #1a1a1a);
        font-weight: 500;
      }

      .step-connector {
        position: absolute;
        top: 1.25rem;
        left: calc(50% + 1.25rem);
        right: calc(-50% + 1.25rem);
        height: 2px;
        background: var(--p-surface-200, #e5e7eb);
        z-index: -1;
      }

      .step-item.completed .step-connector {
        background: var(--p-success-color, #10c96b);
      }

      .progress-helper {
        margin-top: var(--space-2, 0.5rem);
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      /* Size variants */
      .progress-sm .progress-label {
        font-size: var(--font-body-sm, 0.875rem);
      }

      .progress-sm .circular-value {
        font-size: var(--font-body-md, 1rem);
      }

      .progress-lg .progress-label {
        font-size: var(--font-body-lg, 1.125rem);
      }

      .progress-lg .circular-value {
        font-size: var(--font-heading-lg, 1.5rem);
      }
    `,
  ],
})
export class ProgressIndicatorComponent {
  // Configuration
  value = input.required<number>(); // 0-100 for linear/circular, step index for steps
  label = input<string>();
  helperText = input<string>();
  variant = input<"linear" | "circular" | "steps">("linear");
  size = input<"sm" | "md" | "lg">("md");
  showValue = input<boolean>(true);
  color = input<string>("var(--color-brand-primary, #089949)");
  backgroundColor = input<string>("var(--p-surface-200, #e5e7eb)");
  strokeWidth = input<number>(8);
  strokeLinecap = input<"round" | "butt" | "square">("round");
  steps = input<
    Array<{
      label: string;
      number: number;
      completed: boolean;
      active: boolean;
    }>
  >([]);

  // Computed values
  displayValue = computed(() => {
    if (this.variant() === "steps") {
      const completed = this.steps().filter((s) => s.completed).length;
      return `${completed} / ${this.steps().length}`;
    }
    return `${Math.round(this.value())}%`;
  });

  containerClass = computed(() => {
    const sizeClass = this.size() !== "md" ? `progress-${this.size()}` : "";
    return `progress-indicator-container ${sizeClass}`.trim();
  });

  progressBarStyle = computed(() => {
    return {
      height:
        this.size() === "sm" ? "4px" : this.size() === "lg" ? "12px" : "8px",
    };
  });

  circumference = computed(() => {
    const radius = 45;
    return 2 * Math.PI * radius;
  });

  dashOffset = computed(() => {
    const circumference = this.circumference();
    const progress = this.value() / 100;
    return circumference - progress * circumference;
  });

  isLastStep(step: {
    label: string;
    number: number;
    completed: boolean;
    active: boolean;
  }): boolean {
    const steps = this.steps();
    return steps.indexOf(step) === steps.length - 1;
  }
}
