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
import { CheckboxModule, CheckboxChangeEvent } from "primeng/checkbox";

@Component({
  selector: "app-checkbox",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CheckboxModule, FormsModule],
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
        [(ngModel)]="modelValue"
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

  // Internal
  protected modelValue = signal<boolean | T | null>(false);
  private _cvaDisabled = signal(false);

  // Computed
  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: boolean | T | null) => void = () => {};
  private onModelTouched: () => void = () => {};

  onCheckboxChange(event: CheckboxChangeEvent) {
    this.modelValue.set(event.checked);
    this.onModelChange(event.checked);
    this.change.emit(event);
    this.onModelTouched();
  }

  writeValue(value: boolean | T | null): void {
    this.modelValue.set(value);
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
