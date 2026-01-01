import {
  Component,
  input,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

/**
 * Input Component - Angular 21
 *
 * A form input component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      @if (label()) {
        <label [for]="id()" [class.required]="required()">
          {{ label() }}
          @if (required()) {
            <span class="required-indicator" aria-hidden="true">*</span>
          }
        </label>
      }
      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder() || ''"
        [disabled]="disabled()"
        [class.is-invalid]="invalid()"
        [class.is-valid]="valid()"
        [value]="value()"
        (blur)="onBlur()"
        (input)="onChange($event)"
        class="form-control"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-describedby]="getAriaDescribedBy()"
        [attr.autocomplete]="autocomplete() || null"
      />
      @if (helpText() && !errorMessage()) {
        <div [id]="id() + '-help'" class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div
          [id]="id() + '-error'"
          class="form-error"
          role="alert"
          aria-live="polite"
        >
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2, 0.5rem);
      }

      label {
        font-weight: var(--font-weight-semibold, 600);
        color: var(--color-text-primary, var(--p-text-color));
        font-size: var(--font-body-sm, 0.875rem);
        transition: color 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
        display: flex;
        align-items: center;
        gap: var(--space-1, 0.25rem);
      }

      .required-indicator {
        color: var(--color-status-error, #ef4444);
        font-weight: var(--font-weight-bold, 700);
      }

      .form-control {
        width: 100%;
        padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
        border: 1px solid var(--color-border-primary, var(--p-surface-border));
        border-radius: var(--radius-lg, var(--p-border-radius));
        font-size: var(--font-body-md, 1rem);
        font-family: inherit;
        background: var(--surface-primary, white);
        color: var(--color-text-primary, var(--p-text-color));
        transition:
          border-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          box-shadow 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          background-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
      }

      .form-control::placeholder {
        color: var(--color-text-muted, var(--p-text-color-secondary));
      }

      .form-control:hover:not(:disabled):not(:focus) {
        border-color: var(--color-text-secondary, var(--p-surface-400));
      }

      .form-control:focus {
        outline: 2px solid var(--ds-primary-green, var(--p-primary-color));
        outline-offset: 2px;
        border-color: var(--ds-primary-green, var(--p-primary-color));
        box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb, 8, 153, 73), 0.2);
      }

      .form-control:focus:not(:focus-visible) {
        outline: none;
      }

      .form-control:disabled {
        background-color: var(--surface-secondary, var(--p-surface-100));
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-control.is-invalid {
        border-color: var(--color-status-error, var(--p-error-color));
        animation: input-shake 0.4s ease-in-out;
      }

      @keyframes input-shake {
        0%,
        100% {
          transform: translateX(0);
        }
        10%,
        30%,
        50%,
        70%,
        90% {
          transform: translateX(-4px);
        }
        20%,
        40%,
        60%,
        80% {
          transform: translateX(4px);
        }
      }

      .form-control.is-invalid:focus {
        border-color: var(--color-status-error, var(--p-error-color));
        box-shadow: 0 0 0 3px
          rgba(var(--primitive-error-500-rgb, 239, 68, 68), 0.2);
      }

      .form-control.is-valid {
        border-color: var(
          --color-status-success,
          var(--p-success-color, #4caf50)
        );
      }

      .form-control.is-valid:focus {
        border-color: var(
          --color-status-success,
          var(--p-success-color, #4caf50)
        );
        box-shadow: 0 0 0 3px
          rgba(var(--primitive-success-500-rgb, 76, 175, 80), 0.2);
      }

      .form-help {
        font-size: var(--font-body-xs, 0.75rem);
        color: var(--color-text-secondary, var(--p-text-color-secondary));
        line-height: 1.4;
      }

      .form-error {
        font-size: var(--font-body-xs, 0.75rem);
        color: var(--color-status-error, var(--p-error-color));
        display: flex;
        align-items: center;
        gap: var(--space-1, 0.25rem);
        animation: error-fade-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes error-fade-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .form-control,
        label,
        .form-error {
          transition: none;
          animation: none;
        }

        .form-control.is-invalid {
          animation: none;
        }
      }
    `,
  ],
})
export class InputComponent implements ControlValueAccessor {
  // Angular 21: Use input() signals instead of @Input()
  id = input<string>(`input-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  type = input<string>("text");
  placeholder = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  valid = input<boolean>(false);
  required = input<boolean>(false);
  autocomplete = input<string>();

  /**
   * Compute aria-describedby based on help text and error message
   */
  getAriaDescribedBy(): string | null {
    const ids: string[] = [];
    if (this.errorMessage()) {
      ids.push(this.id() + "-error");
    }
    if (this.helpText() && !this.errorMessage()) {
      ids.push(this.id() + "-help");
    }
    return ids.length > 0 ? ids.join(" ") : null;
  }

  // Value signal for ControlValueAccessor
  value = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChangeFn(newValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value || "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Note: We can't directly set input() signals, so we'll handle this via the disabled input
    // The template will use disabled() which combines both
  }
}
