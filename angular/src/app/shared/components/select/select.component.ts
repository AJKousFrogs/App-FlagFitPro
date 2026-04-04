import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
  output,
  signal,
  computed,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { SelectModule, type SelectChangeEvent } from "primeng/select";

type SelectValue = SelectChangeEvent["value"];
type SelectResolvedValue<T> = T extends { value: infer V } ? V | null : T | null;

@Component({
  selector: "app-select",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-select-wrapper w-full">
      @if (label()) {
        <label [for]="inputId()" class="block mb-1 text-sm font-medium text-surface-900 dark:text-surface-0">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <p-select
        [ngModel]="innerValue"
        [options]="options()"
        [optionLabel]="optionLabel()"
        [optionValue]="optionValue()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [filter]="filter()"
        [filterBy]="filterBy()"
        [showClear]="showClear()"
        [inputId]="inputId()"
        [styleClass]="'w-full ' + styleClass()"
        [panelStyleClass]="panelStyleClass()"
        [appendTo]="appendTo()"
        (onChange)="onSelectChange($event)"
        (onBlur)="onBlur()"
      >
        <!-- Custom Template Support if needed in future -->
      </p-select>
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
  `]
})
export class SelectComponent<T = unknown> implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  label = input<string>("");
  options = input.required<T[]>();
  optionLabel = input<string>("label");
  optionValue = input<string>("value");
  placeholder = input<string>("Select an option");
  disabled = input(false);
  required = input(false);
  filter = input(false);
  filterBy = input<string>("label");
  showClear = input(false);
  inputId = input<string>(`app-select-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  panelStyleClass = input<string>("");
  appendTo = input<string | HTMLElement>("body");
  hint = input<string>("");
  /** When true, allows custom text entry (PrimeNG Select). */
  editable = input(false);

  // Outputs
  change = output<SelectValue>();
  valueChange = output<SelectResolvedValue<T>>();
  /** Same payload as PrimeNG `onChange` — for templates using `(onChange)`. */
  onChange = output<SelectChangeEvent>();
  /** Emits resolved option value — for templates using `(ngModelChange)`. */
  ngModelChange = output<SelectResolvedValue<T>>();

  /**
   * Plain value — NgModel + p-select does not work with WritableSignal two-way
   * binding.
   */
  protected innerValue: SelectValue = null;
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: SelectValue) => void = () => {};
  private onModelTouched: () => void = () => {};

  onSelectChange(event: SelectChangeEvent): void {
    this.innerValue = event.value;
    this.onModelChange(event.value);
    this.change.emit(event.value);
    const resolved = this.resolveValue(event.value);
    this.valueChange.emit(resolved);
    this.onChange.emit(event);
    this.ngModelChange.emit(resolved);
    this.onModelTouched();
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.onModelTouched();
  }

  writeValue(value: SelectValue): void {
    this.innerValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: SelectValue) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  private resolveValue(value: SelectValue): SelectResolvedValue<T> {
    if (value == null) {
      return null as SelectResolvedValue<T>;
    }

    const optionValueKey = this.optionValue();
    if (
      typeof value === "object" &&
      value !== null &&
      optionValueKey in value
    ) {
      return (value as Record<string, unknown>)[optionValueKey] as SelectResolvedValue<T>;
    }

    return value as SelectResolvedValue<T>;
  }
}
