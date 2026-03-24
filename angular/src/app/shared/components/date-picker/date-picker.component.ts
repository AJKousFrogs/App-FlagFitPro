import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
  signal,
  computed,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { DatePickerModule } from "primeng/datepicker";

@Component({
  selector: "app-date-picker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePickerModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-date-picker-wrapper w-full">
      @if (label()) {
        <label [for]="inputId()" class="block mb-1 text-sm font-medium text-surface-900 dark:text-surface-0">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <p-datepicker
        [(ngModel)]="value"
        [inputId]="inputId()"
        [placeholder]="placeholder()"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [dateFormat]="dateFormat()"
        [showIcon]="showIcon()"
        [disabled]="isDisabled()"
        [styleClass]="'w-full ' + styleClass()"
        [inputStyleClass]="'w-full ' + inputStyleClass()"
        [appendTo]="appendTo()"
        (onSelect)="onSelect($event)"
        (onBlur)="onBlur()"
      ></p-datepicker>
      @if (hint()) {
        <small class="block mt-1 text-surface-500">{{ hint() }}</small>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    :host ::ng-deep .p-datepicker {
        width: 100%;
    }
    :host ::ng-deep .p-datepicker-input {
        width: 100%;
    }
  `]
})
export class DatePickerComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>("");
  placeholder = input<string>("");
  minDate = input<Date | undefined>(undefined);
  maxDate = input<Date | undefined>(undefined);
  dateFormat = input<string>("mm/dd/yy");
  showIcon = input(true);
  disabled = input(false);
  required = input(false);
  inputId = input<string>(`app-datepicker-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  inputStyleClass = input<string>("");
  appendTo = input<string | HTMLElement | "body" | null>("body");
  hint = input<string>("");

  // Outputs
  select = output<Date | Date[] | null>();

  // Internal
  protected value = signal<Date | Date[] | null>(null);
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: Date | Date[] | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  onSelect(value: Date | Date[] | null) {
    this.onModelChange(value);
    this.select.emit(value);
    this.onModelTouched();
  }

  onBlur() {
    this.onModelTouched();
  }

  writeValue(value: Date | Date[] | string | null): void {
    // Handle string dates if passed, though usually it should be Date object
    if (value && typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            this.value.set(date);
            return;
        }
    }
    this.value.set(value as Date | Date[] | null);
  }

  registerOnChange(fn: (value: Date | Date[] | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
