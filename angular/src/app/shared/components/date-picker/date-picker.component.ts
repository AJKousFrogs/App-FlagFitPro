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
import { DatePicker } from "primeng/datepicker";

/**
 * Date Picker Component - Angular 21
 *
 * A wrapper around PrimeNG DatePicker with consistent styling and simplified API
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-date-picker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePicker],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="date-picker-group">
      @if (label()) {
        <label [for]="id()" class="form-label">{{ label() }}</label>
      }
      <p-datepicker
        [id]="id()"
        [(ngModel)]="dateValue"
        [showIcon]="true"
        [disabled]="disabled()"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [dateFormat]="dateFormat()"
        [showButtonBar]="showButtonBar()"
        [placeholder]="placeholder()"
        [showTime]="showTime()"
        [hourFormat]="hourFormat()"
        [class.is-invalid]="invalid()"
        (onSelect)="onDateChange()"
        (onClear)="onDateChange()"
        (onBlur)="onBlur()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="
          errorMessage() ? id() + '-error' : helpText() ? id() + '-help' : null
        "
      >
      </p-datepicker>
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
  styleUrl: './date-picker.component.scss',
})
export class DatePickerComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`date-picker-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  placeholder = input<string>("Select date");
  dateFormat = input<string>("mm/dd/yy");
  showButtonBar = input<boolean>(true);
  showTime = input<boolean>(false);
  hourFormat = input<"12" | "24">("12");
  minDate = input<Date | null>(null);
  maxDate = input<Date | null>(null);

  // Value signal
  dateValue = signal<Date | null>(null);
  private onChangeFn = (value: Date | null) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<Date | null>();

  onDateChange(): void {
    const value = this.dateValue();
    this.onChangeFn(value);
    this.changed.emit(value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | null): void {
    this.dateValue.set(value || null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}
