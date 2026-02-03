import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressBar } from "primeng/progressbar";

/**
 * Progress Indicator Component - Angular 19+
 *
 * A standardized progress indicator component for showing completion status
 * Uses Angular signals for reactive state management
 *
 * Enhanced with time estimates (UX Best Practice - Nielsen Norman Group)
 */
@Component({
  selector: "app-progress-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressBar],
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
            [styleClass]="progressBarClass()"
          >
          </p-progressBar>
        } @else if (variant() === "circular") {
          <div
            class="circular-progress"
            [ngClass]="circularSizeClass()"
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

      <!-- Time Estimate (UX Best Practice) -->
      @if (timeEstimate()) {
        <div class="time-estimate" [attr.aria-label]="timeEstimateAriaLabel()">
          <i class="pi pi-clock" aria-hidden="true"></i>
          <span>{{ formattedTimeEstimate() }}</span>
        </div>
      }

      <!-- Helper Text -->
      @if (helperText()) {
        <div class="progress-helper">{{ helperText() }}</div>
      }
    </div>
  `,
  styleUrl: "./progress-indicator.component.scss",
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

  // Time estimate inputs
  /**
   * Estimated time remaining in seconds
   * Set to null to hide time estimate
   */
  timeEstimate = input<number | null>(null);

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

  progressBarClass = computed(() => {
    return this.size() === "sm"
      ? "progress-bar-sm"
      : this.size() === "lg"
        ? "progress-bar-lg"
        : "progress-bar-md";
  });

  circularSizeClass = computed(() => {
    return this.size() === "sm"
      ? "circular-size-sm"
      : this.size() === "lg"
        ? "circular-size-lg"
        : "circular-size-md";
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

  /**
   * Format time estimate for display
   */
  formattedTimeEstimate = computed(() => {
    const seconds = this.timeEstimate();
    if (seconds === null || seconds === undefined) return "";

    if (seconds < 60) {
      return `~${Math.max(1, Math.round(seconds))} sec remaining`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `~${minutes} min remaining`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `~${hours} hr remaining`;
    }
    return `~${hours} hr ${remainingMinutes} min remaining`;
  });

  /**
   * ARIA label for time estimate
   */
  timeEstimateAriaLabel = computed(() => {
    const formatted = this.formattedTimeEstimate();
    return `Estimated time: ${formatted}`;
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
