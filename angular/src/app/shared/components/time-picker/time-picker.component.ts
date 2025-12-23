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
 * Time Picker Component - Angular 21
 *
 * A time picker component for time selection
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-time-picker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="time-picker-group">
      @if (label()) {
        <label [for]="id()" class="form-label">{{ label() }}</label>
      }
      <input
        type="time"
        [id]="id()"
        [name]="name()"
        [value]="timeValue()"
        [min]="minTime()"
        [max]="maxTime()"
        [step]="step()"
        [disabled]="disabled()"
        [class.is-invalid]="invalid()"
        (input)="onChange($event)"
        (blur)="onBlur()"
        class="time-picker-input"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="
          errorMessage() ? id() + '-error' : helpText() ? id() + '-help' : null
        "
      />
      @if (helpText() && !errorMessage()) {
        <div [id]="id() + '-help'" class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error" role="alert">
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

      .time-picker-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .time-picker-input {
        width: 100%;
        max-width: 200px;
        padding: 0.625rem 1rem;
        font-size: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        background-color: var(--p-surface-0);
        color: var(--p-text-color);
        transition: all 0.2s ease;
      }

      .time-picker-input:focus {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
        border-color: var(--p-primary-color);
      }

      .time-picker-input.is-invalid {
        border-color: var(--p-error-color);
      }

      .time-picker-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--p-surface-100);
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
export class TimePickerComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`time-picker-${Math.random().toString(36).substr(2, 9)}`);
  name = input<string>("");
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  minTime = input<string>();
  maxTime = input<string>();
  step = input<number>(60); // Default 1 minute

  // Value signal
  timeValue = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<string>();

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.timeValue.set(newValue);
    this.onChangeFn(newValue);
    this.changed.emit(newValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.timeValue.set(value || "");
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
