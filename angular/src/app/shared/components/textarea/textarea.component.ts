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
import { TextareaModule } from "primeng/textarea";

@Component({
  selector: "app-textarea",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TextareaModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-textarea-wrapper w-full">
      @if (label()) {
        <label [for]="inputId()" class="block mb-1 text-sm font-medium text-surface-900 dark:text-surface-0">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <textarea
        pTextarea
        [(ngModel)]="value"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [id]="inputId()"
        [rows]="rows()"
        [autoResize]="autoResize()"
        [class]="'w-full ' + styleClass()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
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
export class TextareaComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>("");
  placeholder = input<string>("");
  rows = input(3);
  autoResize = input(false);
  disabled = input(false);
  required = input(false);
  inputId = input<string>(`app-textarea-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  hint = input<string>("");

  // Outputs
  change = output<string>();

  // Internal
  protected value = signal<string>("");
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: string) => void = () => {};
  private onModelTouched: () => void = () => {};

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.onModelChange(val);
    this.change.emit(val);
  }

  onBlur() {
    this.onModelTouched();
  }

  writeValue(value: string): void {
    this.value.set(value || "");
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
