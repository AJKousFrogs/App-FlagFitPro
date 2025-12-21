import { Component, input, output, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Checkbox Component - Angular 21
 * 
 * A checkbox form component with validation support
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  template: `
    <div class="checkbox-group">
      <label 
        [for]="id()"
        [class.disabled]="disabled()"
        [class.checked]="value()"
        class="checkbox-label">
        <input
          type="checkbox"
          [id]="id()"
          [checked]="value()"
          [disabled]="disabled()"
          [class.is-invalid]="invalid()"
          (change)="onChange($event)"
          (blur)="onBlur()"
          class="checkbox-input"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? id() + '-error' : null" />
        <span class="checkbox-custom"></span>
        @if (label()) {
          <span class="checkbox-text">{{ label() }}</span>
        }
        <ng-content></ng-content>
      </label>
      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div [id]="id() + '-error'" class="form-error">{{ errorMessage() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      font-size: 0.875rem;
      color: var(--p-text-color);
    }

    .checkbox-label.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .checkbox-custom {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--p-surface-border);
      border-radius: var(--p-border-radius);
      background-color: var(--p-surface-0);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .checkbox-label:hover .checkbox-custom:not(.disabled) {
      border-color: var(--p-primary-color);
    }

    .checkbox-label.checked .checkbox-custom {
      background-color: var(--p-primary-color);
      border-color: var(--p-primary-color);
    }

    .checkbox-label.checked .checkbox-custom::after {
      content: '';
      width: 0.375rem;
      height: 0.625rem;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-top: -0.125rem;
    }

    .checkbox-input:focus + .checkbox-custom {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 2px;
    }

    .checkbox-input.is-invalid + .checkbox-custom {
      border-color: var(--p-error-color);
    }

    .checkbox-label.disabled .checkbox-custom {
      background-color: var(--p-surface-100);
      border-color: var(--p-surface-300);
      cursor: not-allowed;
    }

    .checkbox-text {
      flex: 1;
    }

    .form-help {
      font-size: 0.75rem;
      color: var(--p-text-color-secondary);
      margin-left: 2rem;
    }

    .form-error {
      font-size: 0.75rem;
      color: var(--p-error-color);
      margin-left: 2rem;
    }
  `]
})
export class CheckboxComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`checkbox-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  
  // Value signal
  value = signal<boolean>(false);
  private onChangeFn = (value: boolean) => {};
  private onTouchedFn = () => {};
  
  // Events
  changed = output<boolean>();
  
  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    this.value.set(newValue);
    this.onChangeFn(newValue);
    this.changed.emit(newValue);
  }
  
  onBlur(): void {
    this.onTouchedFn();
  }
  
  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.value.set(value || false);
  }
  
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}

