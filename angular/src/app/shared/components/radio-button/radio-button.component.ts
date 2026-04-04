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
import { RadioButtonModule, RadioButtonClickEvent } from "primeng/radiobutton";

@Component({
  selector: "app-radio-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioButtonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioButtonComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-radio-button-wrapper flex align-items-center gap-2">
      <p-radioButton
        [name]="name()"
        [value]="value()"
        [inputId]="inputId()"
        [disabled]="isDisabled()"
        [ngModel]="innerValue"
        (onClick)="onClick($event)"
        styleClass="app-radio-button"
      ></p-radioButton>
      @if (label()) {
        <label [for]="inputId()" class="cursor-pointer" [class.text-gray-500]="isDisabled()">
          {{ label() }}
        </label>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .app-radio-button-wrapper {
      display: flex;
      align-items: center;
    }
  `]
})
export class RadioButtonComponent<T = unknown> implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  name = input<string>("");
  value = input<T | null>(null);
  label = input<string>("");
  disabled = input(false);
  inputId = input<string>(`app-radio-${Math.random().toString(36).slice(2, 11)}`);

  // Outputs
  click = output<RadioButtonClickEvent>();
  valueChange = output<T | null>();

  /**
   * Selected value for the radio group (from CVA). Plain field — NgModel + p-radioButton
   * does not work with WritableSignal two-way binding.
   */
  protected innerValue: T | null = null;
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: T | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  onClick(event: RadioButtonClickEvent): void {
    const v = this.value();
    this.innerValue = v;
    this.onModelChange(v);
    this.click.emit(event);
    this.valueChange.emit(v);
    this.onModelTouched();
    this.cdr.markForCheck();
  }

  writeValue(value: T | null): void {
    this.innerValue = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
