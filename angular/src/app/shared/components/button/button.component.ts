import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Button Component - Angular 21
 *
 * A versatile button component with multiple variants and sizes
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClass()"
      [disabled]="disabled()"
      [type]="type()"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel() || undefined"
    >
      @if (loading()) {
        <span class="spinner spinner-sm"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        font-size: 1rem;
        font-weight: 500;
        border: 1px solid transparent;
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        line-height: 1.5;
      }

      button:focus {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Variants */
      .btn-primary {
        background-color: var(--color-brand-primary);
        color: var(--color-text-on-primary);
        border-color: var(--color-brand-primary);
      }

      .btn-primary:hover:not(:disabled) {
        background-color: var(--color-brand-primary-hover);
        border-color: var(--color-brand-primary-hover);
      }

      .btn-secondary {
        background-color: var(--p-surface-200);
        color: var(--p-text-color);
        border-color: var(--p-surface-300);
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: var(--p-surface-300);
        border-color: var(--p-surface-400);
      }

      .btn-outlined {
        background-color: transparent;
        color: var(--color-brand-primary);
        border-color: var(--color-brand-primary);
      }

      .btn-outlined:hover:not(:disabled) {
        background-color: var(--color-brand-light);
        color: var(--color-brand-primary);
      }

      .btn-text {
        background-color: transparent;
        color: var(--color-brand-primary);
        border-color: transparent;
        padding: 0.5rem 0.75rem;
      }

      .btn-text:hover:not(:disabled) {
        background-color: var(--p-surface-100);
      }

      .btn-danger {
        background-color: var(--p-error-color);
        color: var(--p-text-on-error-color, #fff);
        border-color: var(--p-error-color);
      }

      .btn-danger:hover:not(:disabled) {
        background-color: var(--p-error-color-hover, #d32f2f);
        border-color: var(--p-error-color-hover, #d32f2f);
      }

      .btn-success {
        background-color: var(--p-success-color, #4caf50);
        color: var(--p-text-on-success-color, #fff);
        border-color: var(--p-success-color, #4caf50);
      }

      .btn-success:hover:not(:disabled) {
        background-color: var(--p-success-color-hover, #45a049);
        border-color: var(--p-success-color-hover, #45a049);
      }

      /* Sizes */
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }

      .btn-lg {
        padding: 0.75rem 1.5rem;
        font-size: 1.125rem;
      }

      /* Spinner */
      .spinner {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      .spinner-sm {
        width: 0.875rem;
        height: 0.875rem;
        border-width: 1.5px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
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
  size = input<"sm" | "md" | "lg">("md");
  disabled = input<boolean>(false);
  type = input<"button" | "submit" | "reset">("button");
  loading = input<boolean>(false);
  ariaLabel = input<string>("");

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  clicked = output<void>();

  // Computed class string
  buttonClass = computed(() => {
    const variantClass = `btn-${this.variant()}`;
    const sizeClass = this.size() !== "md" ? `btn-${this.size()}` : "";
    return `btn ${variantClass} ${sizeClass}`.trim();
  });

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
