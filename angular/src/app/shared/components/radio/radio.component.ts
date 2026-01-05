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
  styleUrl: './radio.component.scss',
})
export class RadioComponent<T = unknown> implements ControlValueAccessor {
  // Configuration
  id = input<string>(`radio-${Math.random().toString(36).substr(2, 9)}`);
  name = input<string>("radio-group");
  label = input<string>();
  value = input<T>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Selected value (from parent form control)
  selectedValue = signal<T | null>(null);
  private onChangeFn = (_value: T | null) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<T>();

  isChecked = signal<boolean>(false);

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      const val = this.value() ?? null;
      this.selectedValue.set(val);
      this.onChangeFn(val);
      if (val !== null) {
        this.changed.emit(val);
      }
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: T | null): void {
    this.selectedValue.set(value);
    this.isChecked.set(value === this.value());
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Handled via disabled input
  }
}
