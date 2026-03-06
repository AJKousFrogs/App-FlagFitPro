/**
 * Angular 21 Form Field Component
 *
 * Reusable form field component using signals
 * Works with both reactive forms and signal-based forms
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  computed,
  forwardRef,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommonModule } from "@angular/common";

export interface FormFieldConfig {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
  error?: string | null;
  hint?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

@Component({
  selector: "app-form-field",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-field" [class.has-error]="hasError()">
      <label
        [for]="fieldId()"
        [class.required]="config().required"
        class="form-label"
        [attr.aria-label]="config().ariaLabel || config().label"
      >
        {{ config().label }}
        @if (config().required) {
          <span class="form-required" aria-hidden="true">*</span>
        }
      </label>

      @if (config().type === "textarea") {
        <textarea
          [id]="fieldId()"
          [name]="fieldId()"
          [placeholder]="config().placeholder || ''"
          [disabled]="config().disabled || disabled()"
          [autocomplete]="config().autocomplete || 'off'"
          [value]="value()"
          (input)="onInput(getInputValue($event))"
          (blur)="onBlur()"
          [class.error]="hasError()"
          [attr.aria-invalid]="hasError()"
          [attr.aria-required]="config().required"
          [attr.aria-describedby]="getAriaDescribedBy()"
          [attr.aria-label]="config().ariaLabel"
        ></textarea>
      } @else {
        <input
          [id]="fieldId()"
          [name]="fieldId()"
          [type]="config().type || 'text'"
          [placeholder]="config().placeholder || ''"
          [disabled]="config().disabled || disabled()"
          [autocomplete]="config().autocomplete || 'off'"
          [value]="value()"
          (input)="onInput(getInputValue($event))"
          (blur)="onBlur()"
          [class.error]="hasError()"
          [attr.aria-invalid]="hasError()"
          [attr.aria-required]="config().required"
          [attr.aria-describedby]="getAriaDescribedBy()"
          [attr.aria-label]="config().ariaLabel"
        />
      }

      @if (config().hint && !hasError()) {
        <small
          [id]="fieldId() + '-hint'"
          class="form-help"
          [attr.aria-live]="'polite'"
        >
          {{ config().hint }}
        </small>
      }

      @if (hasError()) {
        <small
          [id]="fieldId() + '-error'"
          class="form-error"
          role="alert"
          [attr.aria-live]="'polite'"
        >
          {{ errorMessage() }}
        </small>
      }
    </div>
  `,
  styleUrl: "./form-field.component.scss",
})
export class FormFieldComponent implements ControlValueAccessor {
  // Angular 21: Use input() signal instead of @Input()
  config = input<FormFieldConfig>({ label: "" });
  fieldId = input<string>("");

  // Value remains as signal for ControlValueAccessor compatibility
  value = signal<string>("");
  disabled = signal<boolean>(false);
  touched = signal<boolean>(false);

  private onChange = (_value: string) => {};
  private onTouched = () => {};

  hasError = computed(() => {
    return this.touched() && !!this.config().error;
  });

  errorMessage = computed(() => {
    return this.config().error || "";
  });

  // Accessibility: Get aria-describedby value
  getAriaDescribedBy(): string | null {
    const ids: string[] = [];

    const ariaDescribedBy = this.config().ariaDescribedBy;
    if (ariaDescribedBy) {
      ids.push(ariaDescribedBy);
    }

    if (this.hasError()) {
      ids.push(this.fieldId() + "-error");
    } else if (this.config().hint) {
      ids.push(this.fieldId() + "-hint");
    }

    return ids.length > 0 ? ids.join(" ") : null;
  }

  onInput(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
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
    this.disabled.set(isDisabled);
  }
}
