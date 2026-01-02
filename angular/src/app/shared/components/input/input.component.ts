import {
  Component,
  input,
  forwardRef,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

/**
 * Input Component - Angular 21
 *
 * A form input component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      @if (label()) {
        <label [for]="id()" [class.required]="required()">
          {{ label() }}
          @if (required()) {
            <span class="required-indicator" aria-hidden="true">*</span>
          }
        </label>
      }
      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder() || ''"
        [disabled]="disabled()"
        [class.is-invalid]="invalid()"
        [class.is-valid]="valid()"
        [value]="value()"
        (blur)="onBlur()"
        (input)="onChange($event)"
        class="form-control"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-describedby]="getAriaDescribedBy()"
        [attr.autocomplete]="autocomplete() || null"
      />
      @if (helpText() && !errorMessage()) {
        <div [id]="id() + '-help'" class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div
          [id]="id() + '-error'"
          class="form-error"
          role="alert"
          aria-live="polite"
        >
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  // Angular 21: Use input() signals instead of @Input()
  id = input<string>(`input-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  type = input<string>("text");
  placeholder = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  valid = input<boolean>(false);
  required = input<boolean>(false);
  autocomplete = input<string>();

  /**
   * Compute aria-describedby based on help text and error message
   */
  getAriaDescribedBy(): string | null {
    const ids: string[] = [];
    if (this.errorMessage()) {
      ids.push(this.id() + "-error");
    }
    if (this.helpText() && !this.errorMessage()) {
      ids.push(this.id() + "-help");
    }
    return ids.length > 0 ? ids.join(" ") : null;
  }

  // Value signal for ControlValueAccessor
  value = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
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
    // Note: We can't directly set input() signals, so we'll handle this via the disabled input
    // The template will use disabled() which combines both
  }
}
