import { Component, input, output, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Toggle Switch Component - Angular 21
 * 
 * A toggle switch component for binary on/off states
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true
    }
  ],
  template: `
    <div class="toggle-switch-group">
      <label 
        [for]="id()"
        [class.disabled]="disabled()"
        [class.checked]="value()"
        [class.error]="invalid()"
        [class.toggle-sm]="size() === 'sm'"
        [class.toggle-lg]="size() === 'lg'"
        class="toggle-switch-label">
        <input
          type="checkbox"
          [id]="id()"
          [checked]="value()"
          [disabled]="disabled()"
          [class.is-invalid]="invalid()"
          (change)="onChange($event)"
          (blur)="onBlur()"
          class="toggle-input"
          role="switch"
          [attr.aria-checked]="value()"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="errorMessage() ? id() + '-error' : null" />
        <span class="toggle-slider"></span>
        @if (label()) {
          <span class="toggle-label-text">{{ label() }}</span>
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

    .toggle-switch-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .toggle-switch-label {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      font-size: 0.875rem;
      color: var(--p-text-color);
    }

    .toggle-switch-label.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .toggle-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: relative;
      display: inline-block;
      width: 3rem;
      height: 1.5rem;
      background-color: var(--p-surface-300);
      border-radius: 1.5rem;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 1.25rem;
      height: 1.25rem;
      left: 0.125rem;
      top: 0.125rem;
      background-color: white;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch-label.checked .toggle-slider {
      background-color: var(--p-primary-color);
    }

    .toggle-switch-label.checked .toggle-slider::before {
      transform: translateX(1.5rem);
    }

    .toggle-input:focus + .toggle-slider {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 2px;
    }

    .toggle-switch-label.disabled .toggle-slider {
      background-color: var(--p-surface-200);
      cursor: not-allowed;
    }

    .toggle-switch-label.error .toggle-slider {
      border: 2px solid var(--p-error-color);
    }

    .toggle-sm .toggle-slider {
      width: 2.25rem;
      height: 1.125rem;
    }

    .toggle-sm .toggle-slider::before {
      width: 0.875rem;
      height: 0.875rem;
    }

    .toggle-sm.checked .toggle-slider::before {
      transform: translateX(1.125rem);
    }

    .toggle-lg .toggle-slider {
      width: 3.75rem;
      height: 1.875rem;
    }

    .toggle-lg .toggle-slider::before {
      width: 1.625rem;
      height: 1.625rem;
      left: 0.125rem;
      top: 0.125rem;
    }

    .toggle-lg.checked .toggle-slider::before {
      transform: translateX(1.875rem);
    }

    .toggle-label-text {
      flex: 1;
    }

    .form-help {
      font-size: 0.75rem;
      color: var(--p-text-color-secondary);
      margin-left: 3.75rem;
    }

    .form-error {
      font-size: 0.75rem;
      color: var(--p-error-color);
      margin-left: 3.75rem;
    }
  `]
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`toggle-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  size = input<'sm' | 'md' | 'lg'>('md');
  
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

