import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy,
  HostBinding,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Button Component - Angular 21 Premium Edition
 *
 * A versatile button component with multiple variants, sizes, and premium interactions
 * Uses Angular 21 signals for reactive state management
 * Features:
 * - Ripple effect on click
 * - Hover lift animation
 * - Press feedback
 * - Loading state with spinner
 * - Icon support
 */
@Component({
  selector: "app-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClass()"
      [disabled]="disabled() || loading()"
      [type]="type()"
      (click)="onClick($event)"
      (mousedown)="onMouseDown()"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseUp()"
      [attr.aria-label]="ariaLabel() || undefined"
      [attr.aria-busy]="loading() || undefined"
      [attr.aria-disabled]="disabled() || undefined"
    >
      <!-- Ripple effect container -->
      <span class="btn-ripple-container">
        @for (ripple of ripples(); track ripple.id) {
          <span
            class="btn-ripple"
            [style.left.px]="ripple.x"
            [style.top.px]="ripple.y"
            [style.width.px]="ripple.size"
            [style.height.px]="ripple.size"
          ></span>
        }
      </span>

      <!-- Loading spinner -->
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="spinner-svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
          </svg>
        </span>
      }

      <!-- Icon (left) -->
      @if (icon() && iconPosition() === "left" && !loading()) {
        <i [class]="'btn-icon pi ' + icon()" aria-hidden="true"></i>
      }

      <!-- Button content -->
      <span
        class="btn-content"
        [class.btn-content-hidden]="loading() && !showLabelOnLoading()"
      >
        <ng-content></ng-content>
      </span>

      <!-- Icon (right) -->
      @if (icon() && iconPosition() === "right" && !loading()) {
        <i [class]="'btn-icon pi ' + icon()" aria-hidden="true"></i>
      }
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 500;
        font-family: var(--font-family-sans);
        line-height: 1.5;
        border: 2px solid transparent;
        border-radius: var(--radius-lg);
        cursor: pointer;
        overflow: hidden;
        white-space: nowrap;
        text-decoration: none;
        vertical-align: middle;
        user-select: none;
        -webkit-tap-highlight-color: transparent;

        /* Premium transition */
        transition:
          transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          background-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          border-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
        will-change: transform, box-shadow;
      }

      button:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb), 0.3);
      }

      button:focus:not(:focus-visible) {
        outline: none;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      /* Ripple Effect */
      .btn-ripple-container {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }

      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(255, 255, 255, 0.4) 0%,
          transparent 70%
        );
        transform: translate(-50%, -50%) scale(0);
        animation: ripple-expand 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        pointer-events: none;
      }

      @keyframes ripple-expand {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(2.5);
          opacity: 0;
        }
      }

      /* Spinner */
      .btn-spinner {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .spinner-svg {
        width: 1.25rem;
        height: 1.25rem;
        animation: spinner-rotate 0.8s linear infinite;
      }

      .spinner-svg circle {
        stroke: currentColor;
        stroke-dasharray: 60;
        stroke-dashoffset: 45;
        stroke-linecap: round;
      }

      @keyframes spinner-rotate {
        to {
          transform: rotate(360deg);
        }
      }

      /* Icon */
      .btn-icon {
        font-size: 1.125rem;
        line-height: 1;
        transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* Content */
      .btn-content {
        transition: opacity 150ms ease;
      }

      .btn-content-hidden {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }

      /* ================================
         VARIANTS
         ================================ */

      /* Primary */
      .btn-primary {
        background-color: var(--ds-primary-green);
        color: var(--color-text-on-primary);
        border-color: var(--ds-primary-green);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-primary:hover:not(:disabled) {
          background-color: var(--ds-primary-green-hover);
          border-color: var(--ds-primary-green-hover);
          transform: translateY(-2px);
          box-shadow:
            0 6px 20px rgba(var(--ds-primary-green-rgb), 0.35),
            0 3px 10px rgba(0, 0, 0, 0.1);
        }
      }

      .btn-primary:active:not(:disabled),
      .btn-primary.btn-pressed {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      /* Secondary */
      .btn-secondary {
        background-color: var(--surface-primary);
        color: var(--ds-primary-green);
        border-color: var(--color-border-primary);
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-secondary:hover:not(:disabled) {
          background-color: var(--surface-secondary);
          border-color: var(--ds-primary-green);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }

      .btn-secondary:active:not(:disabled),
      .btn-secondary.btn-pressed {
        transform: translateY(0) scale(0.98);
        background-color: var(--surface-tertiary);
      }

      .btn-secondary .btn-ripple {
        background: radial-gradient(
          circle,
          rgba(var(--ds-primary-green-rgb), 0.2) 0%,
          transparent 70%
        );
      }

      /* Outlined */
      .btn-outlined {
        background-color: transparent;
        color: var(--ds-primary-green);
        border-color: var(--ds-primary-green);
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-outlined:hover:not(:disabled) {
          background-color: rgba(var(--ds-primary-green-rgb), 0.08);
          border-color: var(--ds-primary-green-hover);
          transform: translateY(-2px);
        }
      }

      .btn-outlined:active:not(:disabled),
      .btn-outlined.btn-pressed {
        transform: translateY(0) scale(0.98);
        background-color: rgba(var(--ds-primary-green-rgb), 0.12);
      }

      .btn-outlined .btn-ripple {
        background: radial-gradient(
          circle,
          rgba(var(--ds-primary-green-rgb), 0.2) 0%,
          transparent 70%
        );
      }

      /* Text (Ghost) */
      .btn-text {
        background-color: transparent;
        color: var(--ds-primary-green);
        border-color: transparent;
        padding: 0.5rem 0.75rem;
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-text:hover:not(:disabled) {
          background-color: rgba(var(--ds-primary-green-rgb), 0.08);
        }
      }

      .btn-text:active:not(:disabled),
      .btn-text.btn-pressed {
        background-color: rgba(var(--ds-primary-green-rgb), 0.12);
        transform: scale(0.98);
      }

      .btn-text .btn-ripple {
        background: radial-gradient(
          circle,
          rgba(var(--ds-primary-green-rgb), 0.15) 0%,
          transparent 70%
        );
      }

      /* Danger */
      .btn-danger {
        background-color: var(--color-status-error);
        color: var(--color-text-on-primary);
        border-color: var(--color-status-error);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-danger:hover:not(:disabled) {
          background-color: var(--primitive-error-600, #dc2626);
          border-color: var(--primitive-error-600, #dc2626);
          transform: translateY(-2px);
          box-shadow:
            0 6px 20px rgba(239, 68, 68, 0.35),
            0 3px 10px rgba(0, 0, 0, 0.1);
        }
      }

      .btn-danger:active:not(:disabled),
      .btn-danger.btn-pressed {
        transform: translateY(0) scale(0.98);
        background-color: var(--primitive-error-700, #b91c1c);
      }

      .btn-danger:focus-visible {
        box-shadow: 0 0 0 3px rgba(var(--primitive-error-500-rgb), 0.3);
      }

      /* Success */
      .btn-success {
        background-color: var(--color-status-success);
        color: var(--color-text-primary);
        border-color: var(--color-status-success);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      @media (hover: hover) and (pointer: fine) {
        .btn-success:hover:not(:disabled) {
          background-color: var(--primitive-success-600, #d4a617);
          border-color: var(--primitive-success-600, #d4a617);
          transform: translateY(-2px);
          box-shadow:
            0 6px 20px rgba(241, 196, 15, 0.35),
            0 3px 10px rgba(0, 0, 0, 0.1);
        }
      }

      .btn-success:active:not(:disabled),
      .btn-success.btn-pressed {
        transform: translateY(0) scale(0.98);
        background-color: var(--primitive-success-700, #b7941f);
      }

      .btn-success:focus-visible {
        box-shadow: 0 0 0 3px rgba(var(--primitive-success-500-rgb), 0.3);
      }

      /* ================================
         SIZES
         ================================ */

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        border-radius: var(--radius-md);
      }

      .btn-sm .btn-icon {
        font-size: 0.875rem;
      }

      .btn-sm .spinner-svg {
        width: 1rem;
        height: 1rem;
      }

      .btn-lg {
        padding: 1rem 2rem;
        font-size: 1.125rem;
        border-radius: var(--radius-xl);
      }

      .btn-lg .btn-icon {
        font-size: 1.25rem;
      }

      .btn-lg .spinner-svg {
        width: 1.5rem;
        height: 1.5rem;
      }

      .btn-xl {
        padding: 1.25rem 2.5rem;
        font-size: 1.25rem;
        border-radius: var(--radius-xl);
      }

      /* Full Width */
      .btn-block {
        width: 100%;
      }

      /* Icon Only */
      .btn-icon-only {
        padding: 0.75rem;
        aspect-ratio: 1;
      }

      .btn-icon-only.btn-sm {
        padding: 0.5rem;
      }

      .btn-icon-only.btn-lg {
        padding: 1rem;
      }

      /* Rounded */
      .btn-rounded {
        border-radius: 9999px;
      }

      /* ================================
         TOUCH DEVICE OPTIMIZATIONS
         ================================ */

      @media (hover: none) and (pointer: coarse) {
        button:active:not(:disabled) {
          transform: scale(0.97);
        }

        .btn-primary:active:not(:disabled),
        .btn-danger:active:not(:disabled),
        .btn-success:active:not(:disabled) {
          opacity: 0.9;
        }
      }

      /* ================================
         REDUCED MOTION
         ================================ */

      @media (prefers-reduced-motion: reduce) {
        button {
          transition: none;
        }

        .btn-ripple {
          animation: none;
        }

        .spinner-svg {
          animation: none;
        }

        button:hover,
        button:active {
          transform: none;
        }
      }
    `,
  ],
})
export class ButtonComponent {
  // Angular 21: Use input() signals instead of @Input()
  variant = input<
    "primary" | "secondary" | "outlined" | "text" | "danger" | "success"
  >("primary");
  size = input<"sm" | "md" | "lg" | "xl">("md");
  disabled = input<boolean>(false);
  type = input<"button" | "submit" | "reset">("button");
  loading = input<boolean>(false);
  ariaLabel = input<string>("");
  icon = input<string>("");
  iconPosition = input<"left" | "right">("left");
  iconOnly = input<boolean>(false);
  rounded = input<boolean>(false);
  block = input<boolean>(false);
  showLabelOnLoading = input<boolean>(false);

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  clicked = output<MouseEvent>();

  // Internal state
  isPressed = signal(false);
  ripples = signal<Array<{ id: number; x: number; y: number; size: number }>>(
    [],
  );
  private rippleId = 0;

  // Computed class string
  buttonClass = computed(() => {
    const classes = ["btn", `btn-${this.variant()}`];

    if (this.size() !== "md") {
      classes.push(`btn-${this.size()}`);
    }

    if (this.iconOnly()) {
      classes.push("btn-icon-only");
    }

    if (this.rounded()) {
      classes.push("btn-rounded");
    }

    if (this.block()) {
      classes.push("btn-block");
    }

    if (this.isPressed()) {
      classes.push("btn-pressed");
    }

    return classes.join(" ");
  });

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.createRipple(event);
      this.clicked.emit(event);
    }
  }

  onMouseDown(): void {
    if (!this.disabled() && !this.loading()) {
      this.isPressed.set(true);
    }
  }

  onMouseUp(): void {
    this.isPressed.set(false);
  }

  private createRipple(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = {
      id: this.rippleId++,
      x,
      y,
      size,
    };

    this.ripples.update((ripples) => [...ripples, ripple]);

    // Remove ripple after animation
    setTimeout(() => {
      this.ripples.update((ripples) =>
        ripples.filter((r) => r.id !== ripple.id),
      );
    }, 600);
  }
}
