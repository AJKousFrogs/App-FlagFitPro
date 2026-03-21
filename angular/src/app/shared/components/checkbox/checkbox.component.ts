import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
  signal,
  model,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";

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
        [label]="label()"
        [name]="name()"
        [value]="value()"
        [disabled]="isDisabled()"
        [(ngModel)]="modelValue"
        (onChange)="onChange($event)"
        [inputId]="inputId()"
        styleClass="app-checkbox"
      ></p-checkbox>
      @if (label() || hasLabelContent()) {
        <label [for]="inputId()" class="cursor-pointer flex align-items-center gap-2" [class.text-gray-500]="isDisabled()">
          @if (label()) {
            {{ label() }}
          }
          <ng-content></ng-content>
        </label>
      }
      </div>
      `,
      ...
      itemTemplate = contentChild<TemplateRef<any>>("item");
      protected hasLabelContent = signal(false); // We can't easily detect ng-content presence without ViewChild but we can just always render the label if ng-content is used
      }
      display: inline-block;
    }
    .app-checkbox-wrapper {
      display: flex;
      align-items: center;
    }
  `]
})
export class CheckboxComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>("");
  name = input<string>("");
  value = input<any>(null);
  binary = input(true);
  disabled = input(false);
  inputId = input<string>(`app-checkbox-${Math.random().toString(36).substr(2, 9)}`);
  labelPosition = input<"left" | "right">("right");

  // Outputs
  change = output<any>();

  // Internal
  protected modelValue = signal<boolean | any>(false);
  private _cvaDisabled = signal(false);

  // Computed
  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: any) => void = () => {};
  private onModelTouched: () => void = () => {};

  onChange(event: any) {
    this.modelValue.set(event.checked);
    this.onModelChange(event.checked);
    this.change.emit(event);
    this.onModelTouched();
  }

  writeValue(value: any): void {
    this.modelValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
