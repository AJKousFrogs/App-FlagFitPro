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
import { ToggleSwitchModule, ToggleSwitchChangeEvent } from "primeng/toggleswitch";

@Component({
  selector: "app-toggle-switch",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ToggleSwitchModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-toggle-switch-wrapper flex align-items-center gap-2">
      <p-toggleswitch
        [(ngModel)]="modelValue"
        [inputId]="inputId()"
        [disabled]="isDisabled()"
        (onChange)="onChange($event)"
        styleClass="app-toggle-switch"
      ></p-toggleswitch>
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
    .app-toggle-switch-wrapper {
      display: flex;
      align-items: center;
    }
  `]
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>("");
  disabled = input(false);
  inputId = input<string>(`app-toggle-${Math.random().toString(36).substr(2, 9)}`);

  // Outputs
  change = output<ToggleSwitchChangeEvent>();

  // Internal
  protected modelValue = signal<boolean>(false);
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: boolean) => void = () => {};
  private onModelTouched: () => void = () => {};

  onChange(event: ToggleSwitchChangeEvent) {
    this.modelValue.set(event.checked);
    this.onModelChange(event.checked);
    this.change.emit(event);
    this.onModelTouched();
  }

  writeValue(value: boolean): void {
    this.modelValue.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
