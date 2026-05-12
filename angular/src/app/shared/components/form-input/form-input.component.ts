/**
 * Enhanced Form Input Component
 * Modern form input with inline validation, success states, and accessibility
 */

import {
  Component,
  effect,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  forwardRef,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
let nextFormInputId = 0;

export type InputType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "date"
  | "number"
  | "search";
export type ValidationState = "idle" | "validating" | "valid" | "invalid";

@Component({
  selector: "app-form-input",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="form-field form-input"
      [class.has-error]="showError()"
      [class.has-success]="showSuccess()"
    >
      <!-- Label -->
      @if (label()) {
        <label
          [for]="inputId()"
          [class.required]="required()"
          class="form-label input-label"
        >
          {{ label() }}
          @if (required()) {
            <span class="form-required" aria-hidden="true">*</span>
          }
          @if (optional() && !required()) {
            <span class="optional-badge">Optional</span>
          }
        </label>
      }

      <!-- Input Container -->
      <div class="form-field__control form-input__control">
        <!-- Prefix Icon -->
        @if (prefixIcon()) {
          <i [class]="'prefix-icon pi ' + prefixIcon()" aria-hidden="true"></i>
        }

        <!-- Input Field — p-inputtext: shared padding/height/border with Prime form controls -->
        <input
          class="p-inputtext"
          [id]="inputId()"
          [name]="inputId()"
          [type]="showPassword() ? 'text' : type()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [readonly]="readonly()"
          [autocomplete]="autocomplete()"
          [value]="textValue()"
          (input)="onInputEvent($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          [class.has-prefix]="prefixIcon()"
          [class.has-suffix]="
            suffixIcon() ||
            type() === 'password' ||
            validationState() !== 'idle'
          "
          [attr.aria-required]="required()"
          [attr.aria-invalid]="showError()"
          [attr.aria-describedby]="getAriaDescribedBy()"
        />

        <!-- Password Toggle -->
        @if (type() === "password") {
          <button
            type="button"
            class="form-field__toggle"
            (click)="togglePassword()"
            [disabled]="isDisabled()"
            [attr.aria-label]="
              showPassword() ? 'Hide password' : 'Show password'
            "
          >
            <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        }

        <!-- Validation Icon -->
        @if (validationState() !== "idle" && type() !== "password") {
          <div class="form-input__validation-icon" aria-hidden="true">
            @if (validationState() === "validating") {
              <i class="pi pi-spin pi-spinner"></i>
            } @else if (validationState() === "valid") {
              <i class="pi pi-check-circle icon-success"></i>
            } @else if (validationState() === "invalid") {
              <i class="pi pi-times-circle icon-error"></i>
            }
          </div>
        }

        <!-- Suffix Icon -->
        @if (
          suffixIcon() && type() !== "password" && validationState() === "idle"
        ) {
          <i [class]="'suffix-icon pi ' + suffixIcon()" aria-hidden="true"></i>
        }
      </div>

      <!-- Hint Text -->
      @if (hint() && !showError()) {
        <small [id]="inputId() + '-hint'" class="form-feedback form-help">
          <i class="pi pi-info-circle" aria-hidden="true"></i>
          {{ hint() }}
        </small>
      }

      <!-- Success Message -->
      @if (showSuccess() && successMessage()) {
        <small [id]="inputId() + '-success'" class="form-feedback form-success">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          {{ successMessage() }}
        </small>
      }

      <!-- Error Message -->
      @if (showError()) {
        <small
          [id]="inputId() + '-error'"
          class="form-feedback form-error"
          role="alert"
        >
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          {{ errorMessage() }}
        </small>
      }

      <!-- Character Count -->
      @if (maxLength() && showCharCount()) {
        <div class="char-count" [class.near-limit]="isNearLimit()">
          {{ textValue().length }} / {{ maxLength() }}
        </div>
      }
    </div>
  `,
  styleUrl: "./form-input.component.scss",
})
export class FormInputComponent implements ControlValueAccessor {
  /**
   * One-way value from parent (`[value]`). When omitted, ControlValueAccessor drives the field.
   */
  value = input<string | undefined>(undefined);

  // Configuration inputs
  inputId = input<string>(`form-input-${++nextFormInputId}`);
  label = input<string>("");
  type = input<InputType>("text");
  placeholder = input<string>("");
  hint = input<string>("");
  required = input<boolean>(false);
  optional = input<boolean>(false);
  readonly = input<boolean>(false);
  autocomplete = input<string>("off");
  prefixIcon = input<string>("");
  suffixIcon = input<string>("");
  maxLength = input<number>(0);
  showCharCount = input<boolean>(false);

  // Validation inputs
  errorMessage = input<string>("");
  successMessage = input<string>("");
  validationState = input<ValidationState>("idle");

  // Outputs
  valueChange = output<string>();
  focused = output<void>();
  blurred = output<void>();

  // Internal state
  textValue = signal<string>("");
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // ControlValueAccessor callbacks
  private onChange = (_value: string) => {};
  private onTouched = () => {};

  // Computed properties
  showError = computed(() => {
    return (
      this.isTouched() &&
      !!this.errorMessage() &&
      this.validationState() === "invalid"
    );
  });

  showSuccess = computed(() => {
    return this.isTouched() && this.validationState() === "valid";
  });

  isNearLimit = computed(() => {
    const max = this.maxLength();
    const len = this.textValue().length;
    return max > 0 && len >= max * 0.9;
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.textValue.set(v);
      }
    });
  }

  /**
   * Get aria-describedby value
   */
  getAriaDescribedBy(): string | null {
    const ids: string[] = [];

    if (this.showError()) {
      ids.push(this.inputId() + "-error");
    } else if (this.showSuccess()) {
      ids.push(this.inputId() + "-success");
    } else if (this.hint()) {
      ids.push(this.inputId() + "-hint");
    }

    return ids.length > 0 ? ids.join(" ") : null;
  }

  /**
   * Handle input change
   */
  onInput(newValue: string): void {
    this.textValue.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  onInputEvent(event: Event): void {
    this.onInput(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.isTouched.set(true);
    this.onTouched();
    this.blurred.emit();
  }

  /**
   * Handle focus event
   */
  onFocus(): void {
    this.focused.emit();
  }

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.textValue.set(value || "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
