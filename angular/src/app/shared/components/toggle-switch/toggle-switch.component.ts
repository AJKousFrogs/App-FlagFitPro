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
 * Toggle Switch Component - Angular 21
 *
 * A toggle switch component for binary on/off states
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-toggle-switch",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <div class="toggle-switch-group">
      <label
        [for]="id()"
        [class.disabled]="disabled()"
        [class.checked]="value()"
        [class.error]="invalid()"
        [class.toggle-sm]="size() === 'sm'"
        [class.toggle-lg]="size() === 'lg'"
        class="toggle-switch-label"
      >
        <input
          type="checkbox"
          [id]="id()"
          [checked]="value()"
          [disabled]="disabled()"
          [class.is-invalid]="invalid()"
          (change)="onChange($event)"
          (blur)="onBlur()"
          class="toggle-input"
          role="switch"
          [attr.aria-checked]="value()"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
        />
        <span class="toggle-slider"></span>
        @if (label()) {
          <span class="toggle-label-text">{{ label() }}</span>
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
  styleUrl: './toggle-switch.component.scss',
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`toggle-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  size = input<"sm" | "md" | "lg">("md");

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
