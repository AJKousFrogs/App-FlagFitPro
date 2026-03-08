import {
  Component,
  input,
  output,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
  inject,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { DatePicker } from "primeng/datepicker";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

let nextDatePickerId = 0;

/**
 * Date Picker Component - Angular 21
 *
 * A wrapper around PrimeNG DatePicker with consistent styling and simplified API
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-date-picker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DatePicker],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-field date-picker-group">
      @if (label()) {
        <label [for]="id()" class="form-label">{{ label() }}</label>
      }
      <p-datepicker
        [id]="id()"
        [formControl]="dateControl"
        [showIcon]="true"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [dateFormat]="dateFormat()"
        [showButtonBar]="showButtonBar()"
        [placeholder]="placeholder()"
        [showTime]="showTime()"
        [hourFormat]="hourFormat()"
        [class.is-invalid]="invalid()"
        (onBlur)="onBlur()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="
          errorMessage() ? id() + '-error' : helpText() ? id() + '-help' : null
        "
      >
      </p-datepicker>
      @if (helpText() && !errorMessage()) {
        <small [id]="id() + '-help'" class="form-help">{{ helpText() }}</small>
      }
      @if (errorMessage()) {
        <small [id]="id() + '-error'" class="form-error" role="alert">
          {{ errorMessage() }}
        </small>
      }
    </div>
  `,
  styleUrl: "./date-picker.component.scss",
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  // Configuration
  id = input<string>(`date-picker-${++nextDatePickerId}`);
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
  dateControl = new FormControl<Date | null>(null);
  private cvaDisabled = signal(false);
  private onChangeFn = (_value: Date | null) => {};
  private onTouchedFn = () => {};

  // Events
  changed = output<Date | null>();

  constructor() {
    this.dateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.dateValue.set(value);
        this.onChangeFn(value);
        this.changed.emit(value);
      });

    effect(() => {
      const shouldDisable = this.disabled() || this.cvaDisabled();
      if (shouldDisable) {
        this.dateControl.disable({ emitEvent: false });
      } else {
        this.dateControl.enable({ emitEvent: false });
      }
    });
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | null): void {
    const normalizedValue = value || null;
    this.dateValue.set(normalizedValue);
    this.dateControl.setValue(normalizedValue, { emitEvent: false });
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
