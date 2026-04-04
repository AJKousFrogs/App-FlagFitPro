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
import { CheckboxModule, CheckboxChangeEvent } from "primeng/checkbox";

@Component({
  selector: "app-checkbox",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-checkbox-wrapper flex align-items-center gap-2">
      <p-checkbox
        [binary]="binary()"
        [name]="name()"
        [value]="value()"
        [disabled]="isDisabled()"
        [ngModel]="checked"
        (onChange)="onCheckboxChange($event)"
        [inputId]="inputId()"
        styleClass="app-checkbox"
      ></p-checkbox>
      <label [for]="inputId()" class="cursor-pointer flex align-items-center gap-2" [class.text-gray-500]="isDisabled()">
        @if (label()) {
          {{ label() }}
        }
        <ng-content></ng-content>
      </label>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    .app-checkbox-wrapper {
      display: flex;
      align-items: center;
    }
  `]
})
export class CheckboxComponent<T = unknown> implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  label = input<string>("");
  name = input<string>("");
  value = input<T | null>(null);
  binary = input(true);
  disabled = input(false);
  inputId = input<string>(`app-checkbox-${Math.random().toString(36).slice(2, 11)}`);
  labelPosition = input<"left" | "right">("right");

  // Outputs
  change = output<CheckboxChangeEvent>();
  checkedChange = output<boolean>();

  /** Plain boolean — NgModel on p-checkbox does not support two-way binding to WritableSignal. */
  protected checked = false;
  private _cvaDisabled = signal(false);

  // Computed
  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: boolean | T | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  onCheckboxChange(event: CheckboxChangeEvent): void {
    const next = Boolean(event.checked);
    this.checked = next;
    this.onModelChange(next);
    this.change.emit(event);
    this.checkedChange.emit(next);
    this.onModelTouched();
    this.cdr.markForCheck();
  }

  writeValue(value: boolean | T | null): void {
    this.checked = Boolean(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: boolean | T | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
