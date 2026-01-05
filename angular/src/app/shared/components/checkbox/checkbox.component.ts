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
 * Checkbox Component - Angular 21
 *
 * A checkbox form component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-checkbox",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="checkbox-group">
      <label
        [for]="id()"
        [class.disabled]="disabled()"
        [class.checked]="value()"
        class="checkbox-label"
      >
        <input
          type="checkbox"
          [id]="id()"
          [checked]="value()"
          [disabled]="disabled()"
          [class.is-invalid]="invalid()"
          (change)="onChange($event)"
          (blur)="onBlur()"
          class="checkbox-input"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
        />
        <span class="checkbox-custom"></span>
        @if (label()) {
          <span class="checkbox-text">{{ label() }}</span>
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
  styleUrl: "./checkbox.component.scss",
})
export class CheckboxComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`checkbox-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Value signal
  value = signal<boolean>(false);
  private onChangeFn = (_value: boolean) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<boolean>();

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    this.value.set(newValue);
    this.onChangeFn(newValue);
    this.changed.emit(newValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.value.set(value || false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Handled via disabled input
  }
}
