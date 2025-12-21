import { Component, input, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

/**
 * Select Component - Angular 21
 * 
 * A dropdown select component with option support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="form-group">
      @if (label()) {
        <label [for]="id()">{{ label() }}</label>
      }
      <select
        [id]="id()"
        [disabled]="disabled()"
        [class.is-invalid]="invalid()"
        [value]="value()"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="form-control"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="errorMessage() ? id() + '-error' : null">
        <option [value]="null" disabled>{{ placeholder() }}</option>
        @for (option of options(); track option.value) {
          <option 
            [value]="option.value"
            [disabled]="option.disabled">
            {{ option.label }}
          </option>
        }
      </select>
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error">{{ errorMessage() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-weight: 600;
      color: var(--p-text-color);
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--p-surface-border);
      border-radius: var(--p-border-radius);
      font-size: 1rem;
      background-color: var(--surface-primary);
      color: var(--p-text-color);
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
      cursor: pointer;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--p-primary-color);
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }

    .form-control:disabled {
      background-color: var(--p-surface-100);
      cursor: not-allowed;
      opacity: 0.6;
    }

    .form-control.is-invalid {
      border-color: var(--p-error-color);
    }

    .form-control.is-invalid:focus {
      border-color: var(--p-error-color);
      box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
    }

    option {
      padding: 0.5rem;
    }

    option:disabled {
      color: var(--p-text-color-secondary);
    }

    .form-error {
      font-size: 0.75rem;
      color: var(--p-error-color);
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  // Angular 21: Use input() signals instead of @Input()
  id = input<string>(`select-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  placeholder = input<string>('Select an option');
  options = input<SelectOption[]>([]);
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);

  // Value signal for ControlValueAccessor
  value = signal<any>(null);
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.onChangeFn(newValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: any) => void): void {
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

