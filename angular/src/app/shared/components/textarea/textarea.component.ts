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
 * Textarea Component - Angular 21
 *
 * A textarea form component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-textarea",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      @if (label()) {
        <label [for]="id()">{{ label() }}</label>
      }
      <textarea
        [id]="id()"
        [placeholder]="placeholder() || ''"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [rows]="rows()"
        [cols]="cols()"
        [maxlength]="maxlength() || null"
        [class.is-invalid]="invalid()"
        [class.is-valid]="valid()"
        [value]="value()"
        (blur)="onBlur()"
        (input)="onChange($event)"
        class="form-control"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
        [attr.aria-label]="ariaLabel() || undefined"
      ></textarea>
      @if (showCharCount() && maxlength()) {
        <div class="char-count">{{ value().length }} / {{ maxlength() }}</div>
      }
      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error">
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
        gap: 0.5rem;
      }

      label {
        font-weight: 600;
        color: var(--p-text-color);
        font-size: 0.875rem;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        font-size: 1rem;
        font-family: inherit;
        line-height: 1.5;
        resize: vertical;
        min-height: 6rem;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--p-primary-color);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
      }

      .form-control:disabled {
        background-color: var(--p-surface-100);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-control:read-only {
        background-color: var(--p-surface-50);
        cursor: default;
      }

      .form-control.is-invalid {
        border-color: var(--p-error-color);
      }

      .form-control.is-invalid:focus {
        border-color: var(--p-error-color);
        box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
      }

      .form-control.is-valid {
        border-color: var(--p-success-color, #4caf50);
      }

      .form-control.is-valid:focus {
        border-color: var(--p-success-color, #4caf50);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
      }

      .char-count {
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
        text-align: right;
      }

      .form-help {
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
      }

      .form-error {
        font-size: 0.75rem;
        color: var(--p-error-color);
      }
    `,
  ],
})
export class TextareaComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`textarea-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  placeholder = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  invalid = input<boolean>(false);
  valid = input<boolean>(false);
  rows = input<number>(4);
  cols = input<number>();
  maxlength = input<number>();
  showCharCount = input<boolean>(false);
  ariaLabel = input<string>();

  // Value signal
  value = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
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
    // Handled via disabled input
  }
}
