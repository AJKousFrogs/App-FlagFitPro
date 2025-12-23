import {
  Component,
  input,
  output,
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
 * Radio Component - Angular 21
 *
 * A radio button form component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-radio",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
  template: `
    <div class="radio-group">
      <label
        [for]="id()"
        [class.disabled]="disabled()"
        [class.checked]="isChecked()"
        class="radio-label"
      >
        <input
          type="radio"
          [id]="id()"
          [name]="name()"
          [value]="value()"
          [checked]="isChecked()"
          [disabled]="disabled()"
          [class.is-invalid]="invalid()"
          (change)="onChange($event)"
          (blur)="onBlur()"
          class="radio-input"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
        />
        <span class="radio-custom"></span>
        @if (label()) {
          <span class="radio-text">{{ label() }}</span>
        }
        <ng-content></ng-content>
      </label>
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

      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .radio-label {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        user-select: none;
        font-size: 0.875rem;
        color: var(--p-text-color);
      }

      .radio-label.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .radio-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .radio-custom {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--p-surface-border);
        border-radius: 50%;
        background-color: var(--p-surface-0);
        transition: all 0.2s ease;
        flex-shrink: 0;
        position: relative;
      }

      .radio-label:hover .radio-custom:not(.disabled) {
        border-color: var(--p-primary-color);
      }

      .radio-label.checked .radio-custom {
        border-color: var(--p-primary-color);
      }

      .radio-label.checked .radio-custom::after {
        content: "";
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background-color: var(--p-primary-color);
      }

      .radio-input:focus + .radio-custom {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
      }

      .radio-input.is-invalid + .radio-custom {
        border-color: var(--p-error-color);
      }

      .radio-label.disabled .radio-custom {
        background-color: var(--p-surface-100);
        border-color: var(--p-surface-300);
        cursor: not-allowed;
      }

      .radio-text {
        flex: 1;
      }

      .form-help {
        font-size: 0.75rem;
        color: var(--p-text-color-secondary);
        margin-left: 2rem;
      }

      .form-error {
        font-size: 0.75rem;
        color: var(--p-error-color);
        margin-left: 2rem;
      }
    `,
  ],
})
export class RadioComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`radio-${Math.random().toString(36).substr(2, 9)}`);
  name = input<string>("radio-group");
  label = input<string>();
  value = input<any>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Selected value (from parent form control)
  selectedValue = signal<any>(null);
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<any>();

  isChecked = signal<boolean>(false);

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedValue.set(this.value());
      this.onChangeFn(this.value());
      this.changed.emit(this.value());
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedValue.set(value);
    this.isChecked.set(value === this.value());
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}
