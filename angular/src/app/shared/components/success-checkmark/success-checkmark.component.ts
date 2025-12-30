/**
 * Success Checkmark Component
 *
 * Animated success checkmark with optional circle background.
 * Used for form submissions, completed actions, and achievements.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type SuccessSize = "sm" | "md" | "lg" | "xl";
export type SuccessVariant = "default" | "filled" | "outlined" | "minimal";

@Component({
  selector: "app-success-checkmark",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="success-checkmark-container"
      [class]="containerClass()"
      [class.animated]="animate()"
      [class.visible]="isVisible()"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- Circle background -->
      @if (showCircle()) {
        <div class="success-circle" [class.pulse]="pulse()"></div>
      }

      <!-- Checkmark SVG -->
      <svg
        class="checkmark-svg"
        viewBox="0 0 52 52"
        [attr.width]="svgSize()"
        [attr.height]="svgSize()"
      >
        @if (variant() === 'filled' || variant() === 'outlined') {
          <circle
            class="checkmark-circle"
            cx="26"
            cy="26"
            r="25"
            [class.filled]="variant() === 'filled'"
          />
        }
        <path
          class="checkmark-check"
          fill="none"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </svg>

      <!-- Optional label -->
      @if (label()) {
        <span class="success-label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .success-checkmark-container {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        position: relative;
      }

      /* ================================
         SIZE VARIANTS
         ================================ */

      .size-sm {
        --checkmark-size: 32px;
        --stroke-width: 3px;
      }

      .size-md {
        --checkmark-size: 48px;
        --stroke-width: 3px;
      }

      .size-lg {
        --checkmark-size: 64px;
        --stroke-width: 4px;
      }

      .size-xl {
        --checkmark-size: 96px;
        --stroke-width: 5px;
      }

      /* ================================
         CIRCLE BACKGROUND
         ================================ */

      .success-circle {
        position: absolute;
        width: calc(var(--checkmark-size) + 20px);
        height: calc(var(--checkmark-size) + 20px);
        background: var(--ds-primary-green-subtle);
        border-radius: 50%;
        opacity: 0;
        transform: scale(0);
      }

      .animated .success-circle {
        animation: circle-expand 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .success-circle.pulse {
        animation:
          circle-expand 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
          circle-pulse 2s ease-in-out 500ms infinite;
      }

      @keyframes circle-expand {
        0% {
          opacity: 0;
          transform: scale(0);
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 0.3;
          transform: scale(1);
        }
      }

      @keyframes circle-pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.2;
        }
      }

      /* ================================
         CHECKMARK SVG
         ================================ */

      .checkmark-svg {
        position: relative;
        z-index: 1;
        width: var(--checkmark-size);
        height: var(--checkmark-size);
      }

      .checkmark-circle {
        stroke: var(--ds-primary-green);
        stroke-width: var(--stroke-width);
        fill: none;
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-linecap: round;
      }

      .checkmark-circle.filled {
        fill: var(--ds-primary-green-subtle);
      }

      .animated .checkmark-circle {
        animation: circle-draw 600ms cubic-bezier(0.65, 0, 0.45, 1) forwards;
      }

      @keyframes circle-draw {
        100% {
          stroke-dashoffset: 0;
        }
      }

      .checkmark-check {
        stroke: var(--ds-primary-green);
        stroke-width: var(--stroke-width);
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
      }

      .animated .checkmark-check {
        animation: check-draw 400ms cubic-bezier(0.65, 0, 0.45, 1) 300ms forwards;
      }

      @keyframes check-draw {
        100% {
          stroke-dashoffset: 0;
        }
      }

      /* ================================
         VARIANT STYLES
         ================================ */

      .variant-minimal .checkmark-check {
        stroke-width: calc(var(--stroke-width) - 1px);
      }

      .variant-outlined .checkmark-circle {
        stroke-width: 2px;
      }

      /* ================================
         VISIBILITY
         ================================ */

      .success-checkmark-container:not(.visible) {
        opacity: 0;
        transform: scale(0.5);
      }

      .success-checkmark-container.visible {
        opacity: 1;
        transform: scale(1);
      }

      .animated.visible {
        animation: container-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)
          forwards;
      }

      @keyframes container-pop {
        0% {
          opacity: 0;
          transform: scale(0.5);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* ================================
         LABEL
         ================================ */

      .success-label {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--ds-primary-green);
        text-align: center;
        opacity: 0;
        transform: translateY(5px);
      }

      .animated .success-label {
        animation: label-fade 300ms ease-out 600ms forwards;
      }

      @keyframes label-fade {
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ================================
         COLOR VARIANTS
         ================================ */

      .color-success {
        --checkmark-color: var(--color-status-success);
      }

      .color-primary {
        --checkmark-color: var(--ds-primary-green);
      }

      .color-white {
        --checkmark-color: white;
      }

      .color-success .checkmark-check,
      .color-success .checkmark-circle {
        stroke: var(--color-status-success);
      }

      .color-white .checkmark-check,
      .color-white .checkmark-circle {
        stroke: white;
      }

      /* ================================
         REDUCED MOTION
         ================================ */

      @media (prefers-reduced-motion: reduce) {
        .animated .success-circle,
        .animated .checkmark-circle,
        .animated .checkmark-check,
        .animated .success-label,
        .animated.visible {
          animation: none;
        }

        .success-circle {
          opacity: 0.3;
          transform: scale(1);
        }

        .checkmark-circle {
          stroke-dashoffset: 0;
        }

        .checkmark-check {
          stroke-dashoffset: 0;
        }

        .success-label {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class SuccessCheckmarkComponent implements OnInit, OnDestroy {
  // Inputs
  size = input<SuccessSize>("md");
  variant = input<SuccessVariant>("default");
  color = input<"primary" | "success" | "white">("primary");
  animate = input<boolean>(true);
  showCircle = input<boolean>(true);
  pulse = input<boolean>(false);
  label = input<string>("");
  ariaLabel = input<string>("Success");
  autoHide = input<boolean>(false);
  autoHideDelay = input<number>(3000);

  // Outputs
  hidden = output<void>();
  animationComplete = output<void>();

  // Internal state
  isVisible = signal(false);
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed
  containerClass = computed(() => {
    return [
      `size-${this.size()}`,
      `variant-${this.variant()}`,
      `color-${this.color()}`,
    ].join(" ");
  });

  svgSize = computed(() => {
    const sizes: Record<SuccessSize, number> = {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    };
    return sizes[this.size()];
  });

  ngOnInit(): void {
    // Trigger visibility after a small delay for animation
    setTimeout(() => {
      this.isVisible.set(true);

      // Emit animation complete after animations finish
      if (this.animate()) {
        setTimeout(() => {
          this.animationComplete.emit();
        }, 700);
      }
    }, 50);

    // Auto-hide if enabled
    if (this.autoHide()) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, this.autoHideDelay());
    }
  }

  ngOnDestroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  /**
   * Show the checkmark
   */
  show(): void {
    this.isVisible.set(true);
  }

  /**
   * Hide the checkmark
   */
  hide(): void {
    this.isVisible.set(false);
    this.hidden.emit();
  }

  /**
   * Reset and replay the animation
   */
  replay(): void {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
    }, 50);
  }
}

