import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    forwardRef,
    input,
    signal,
} from "@angular/core";
import {
    ControlValueAccessor,
    FormsModule,
    NG_VALUE_ACCESSOR,
} from "@angular/forms";

/**
 * Textarea Component - Angular 21
 *
 * A textarea form component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-textarea",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      @if (label()) {
        <label [for]="id()">{{ label() }}</label>
      }
      <textarea
        [id]="id()"
        [placeholder]="placeholder() || ''"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [rows]="rows()"
        [cols]="cols()"
        [attr.maxlength]="maxlength() || null"
        [class.is-invalid]="invalid()"
        [class.is-valid]="valid()"
        [value]="value()"
        (blur)="onBlur()"
        (input)="onChange($event)"
        class="form-control"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="errorMessage() ? id() + '-error' : null"
        [attr.aria-label]="ariaLabel() || undefined"
      ></textarea>
      @if (showCharCount() && maxlength()) {
        <div class="char-count">{{ value().length }} / {{ maxlength() }}</div>
      }
      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`textarea-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  placeholder = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  invalid = input<boolean>(false);
  valid = input<boolean>(false);
  rows = input<number>(4);
  cols = input<number>();
  maxlength = input<number>();
  showCharCount = input<boolean>(false);
  ariaLabel = input<string>();

  // Value signal
  value = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChangeFn(newValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value || "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}
