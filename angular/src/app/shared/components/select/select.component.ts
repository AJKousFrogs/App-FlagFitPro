import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
  signal,
  computed,
  model,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";

@Component({
  selector: "app-select",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SelectModule, FormsModule],
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
        [(ngModel)]="value"
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
export class SelectComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>("");
  options = input.required<any[]>();
  optionLabel = input<string>("label");
  optionValue = input<string>("value");
  placeholder = input<string>("Select an option");
  disabled = input(false);
  required = input(false);
  filter = input(false);
  filterBy = input<string>("label");
  showClear = input(false);
  inputId = input<string>(`app-select-${Math.random().toString(36).substr(2, 9)}`);
  styleClass = input<string>("");
  panelStyleClass = input<string>("");
  appendTo = input<any>("body");
  hint = input<string>("");

  // Outputs
  change = output<any>();

  // Internal
  protected value = signal<any>(null);
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: any) => void = () => {};
  private onModelTouched: () => void = () => {};

  onSelectChange(event: any) {
    this.onModelChange(event.value);
    this.change.emit(event.value);
    this.onModelTouched();
  }

  onBlur() {
    this.onModelTouched();
  }

  writeValue(value: any): void {
    this.value.set(value);
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
