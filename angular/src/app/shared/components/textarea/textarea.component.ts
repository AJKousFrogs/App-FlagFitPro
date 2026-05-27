import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
  computed,
  numberAttribute,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { TextareaModule } from "primeng/textarea";

@Component({
  selector: "app-textarea",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextareaModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-textarea-wrapper" style="width: 100%">
      @if (label()) {
        <label [for]="inputId()" style="display: block; margin-bottom: var(--space-1); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-medium); color: var(--color-text-primary)">
          {{ label() }}
          @if (required()) {
            <span style="color: var(--color-status-danger)">*</span>
          }
        </label>
      }
      <textarea
        pTextarea
        [ngModel]="textValue()"
        (ngModelChange)="onTextChange($event)"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [id]="inputId()"
        [rows]="rows()"
        [autoResize]="autoResize()"
        [class]="'w-full ' + styleClass()"
        (blur)="onBlur()"
      ></textarea>
      @if (hint()) {
        <small style="display: block; margin-top: var(--space-1); color: var(--color-text-secondary)">{{ hint() }}</small>
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
export class TextareaComponent implements ControlValueAccessor {
  value = input<string | undefined>(undefined);

  // Inputs
  label = input<string>("");
  placeholder = input<string>("");
  rows = input(3, { transform: numberAttribute });
  autoResize = input(false);
  disabled = input(false);
  required = input(false);
  inputId = input<string>(`app-textarea-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  hint = input<string>("");

  // Outputs
  change = output<string>();
  valueChange = output<string>();

  // Internal
  protected textValue = signal<string>("");
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: string) => void = () => {};
  private onModelTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.textValue.set(v);
      }
    });
  }

  onTextChange(val: string): void {
    this.textValue.set(val);
    this.onModelChange(val);
    this.change.emit(val);
    this.valueChange.emit(val);
  }

  onBlur(): void {
    this.onModelTouched();
  }

  writeValue(value: string): void {
    this.textValue.set(value || "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
