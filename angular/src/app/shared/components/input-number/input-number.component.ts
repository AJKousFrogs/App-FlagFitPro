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
  ViewEncapsulation,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { InputNumberModule } from "primeng/inputnumber";

@Component({
  selector: "app-input-number",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: "app-input-number-host" },
  imports: [InputNumberModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputNumberComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-input-number-wrapper" style="width: 100%">
      @if (label()) {
        <label [for]="inputId()" style="display: block; margin-bottom: var(--space-1); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-medium); color: var(--color-text-primary)">
          {{ label() }}
          @if (required()) {
            <span style="color: var(--color-status-danger)">*</span>
          }
        </label>
      }
      <p-inputNumber
        [ngModel]="innerValue"
        (ngModelChange)="onInnerNgModelChange($event)"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [inputId]="inputId()"
        [class]="'w-full ' + styleClass()"
        [inputStyleClass]="'w-full ' + inputStyleClass()"
        [showButtons]="showButtons()"
        [buttonLayout]="buttonLayout()"
        [mode]="mode()"
        [currency]="currency()"
        [prefix]="prefix()"
        [suffix]="suffix()"
        [minFractionDigits]="minFractionDigits()"
        [maxFractionDigits]="maxFractionDigits()"
        (onBlur)="onBlur()"
      ></p-inputNumber>
      @if (hint()) {
        <small style="display: block; margin-top: var(--space-1); color: var(--color-text-secondary)">{{ hint() }}</small>
      }
    </div>
  `,
  styles: [`
    .app-input-number-host {
      display: block;
      width: 100%;
    }
    .app-input-number-host .p-inputnumber {
      width: 100%;
    }
  `]
})
export class InputNumberComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  label = input<string>("");
  placeholder = input<string>("");
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  step = input<number>(1);
  disabled = input(false);
  required = input(false);
  inputId = input<string>(`app-input-number-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  inputStyleClass = input<string>("");
  showButtons = input(false);
  buttonLayout = input<"stacked" | "horizontal" | "vertical">("stacked");
  mode = input<"decimal" | "currency">("decimal");
  currency = input<string | undefined>(undefined);
  prefix = input<string | undefined>(undefined);
  suffix = input<string | undefined>(undefined);
  minFractionDigits = input<number>(0);
  maxFractionDigits = input<number>(2);
  hint = input<string>("");

  // Outputs
  change = output<number | null>();
  valueChange = output<number | null>();

  /**
   * Plain value — NgModel + p-inputNumber does not work with WritableSignal
   * two-way binding.
   */
  protected innerValue: number | null = null;
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: number | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  onInnerNgModelChange(val: number | null): void {
    this.innerValue = val;
    this.onModelChange(val);
    this.change.emit(val);
    this.valueChange.emit(val);
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.onModelTouched();
  }

  writeValue(value: number | null): void {
    this.innerValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
