/**
 * Enhanced Form Input Component
 * Modern form input with inline validation, success states, and accessibility
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  forwardRef,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";

export type InputType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "number"
  | "search";
export type ValidationState = "idle" | "validating" | "valid" | "invalid";

@Component({
  selector: "app-form-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="form-input-wrapper"
      [class.has-error]="showError()"
      [class.has-success]="showSuccess()"
    >
      <!-- Label -->
      @if (label()) {
        <label
          [for]="inputId()"
          [class.required]="required()"
          class="input-label"
        >
          {{ label() }}
          @if (optional() && !required()) {
            <span class="optional-badge">Optional</span>
          }
        </label>
      }

      <!-- Input Container -->
      <div class="input-container">
        <!-- Prefix Icon -->
        @if (prefixIcon()) {
          <i [class]="'prefix-icon pi ' + prefixIcon()"></i>
        }

        <!-- Input Field -->
        <input
          [id]="inputId()"
          [name]="inputId()"
          [type]="showPassword() ? 'text' : type()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [readonly]="readonly()"
          [autocomplete]="autocomplete()"
          [value]="value()"
          (input)="onInput($any($event.target).value)"
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
            class="password-toggle"
            (click)="togglePassword()"
            [attr.aria-label]="
              showPassword() ? 'Hide password' : 'Show password'
            "
            tabindex="-1"
          >
            <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        }

        <!-- Validation Icon -->
        @if (validationState() !== "idle" && type() !== "password") {
          <div class="validation-icon">
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
          <i [class]="'suffix-icon pi ' + suffixIcon()"></i>
        }
      </div>

      <!-- Hint Text -->
      @if (hint() && !showError()) {
        <small [id]="inputId() + '-hint'" class="hint-text">
          <i class="pi pi-info-circle"></i>
          {{ hint() }}
        </small>
      }

      <!-- Success Message -->
      @if (showSuccess() && successMessage()) {
        <small [id]="inputId() + '-success'" class="success-message">
          <i class="pi pi-check-circle"></i>
          {{ successMessage() }}
        </small>
      }

      <!-- Error Message -->
      @if (showError()) {
        <small [id]="inputId() + '-error'" class="error-message" role="alert">
          <i class="pi pi-exclamation-circle"></i>
          {{ errorMessage() }}
        </small>
      }

      <!-- Character Count -->
      @if (maxLength() && showCharCount()) {
        <div class="char-count" [class.near-limit]="isNearLimit()">
          {{ value().length }} / {{ maxLength() }}
        </div>
      }
    </div>
  `,
  styleUrl: './form-input.component.scss',
})
export class FormInputComponent implements ControlValueAccessor {
  // Configuration inputs
  inputId = input<string>("");
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
  value = signal<string>("");
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  isFocused = signal<boolean>(false);
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
    const len = this.value().length;
    return max > 0 && len >= max * 0.9;
  });

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
    this.value.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.isTouched.set(true);
    this.isFocused.set(false);
    this.onTouched();
    this.blurred.emit();
  }

  /**
   * Handle focus event
   */
  onFocus(): void {
    this.isFocused.set(true);
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
    this.value.set(value || "");
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
