import { Component, input, output, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Rating Component - Angular 21
 * 
 * A star rating component
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: 'app-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true
    }
  ],
  template: `
    <div class="rating-group">
      @if (label()) {
        <label class="form-label">{{ label() }}</label>
      }
      <div class="rating" [class.rating-readonly]="readonly()" [class.rating-sm]="size() === 'sm'" [class.rating-lg]="size() === 'lg'">
        @for (star of stars(); track star) {
          <input
            type="radio"
            [id]="id() + '-star-' + star"
            [name]="id()"
            [value]="star"
            [checked]="value() === star"
            [disabled]="disabled() || readonly()"
            (change)="onChange(star)"
            (blur)="onBlur()"
            class="rating-input" />
          <label
            [for]="id() + '-star-' + star"
            class="rating-star"
            [class.filled]="star <= value()"
            [attr.aria-label]="star + ' stars'">
            <i class="pi pi-star-fill"></i>
          </label>
        }
      </div>
      @if (showValue()) {
        <div class="rating-value">{{ value() }} / {{ maxStars() }}</div>
      }
      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div class="form-error" role="alert">{{ errorMessage() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .rating-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .rating {
      display: inline-flex;
      flex-direction: row-reverse;
      gap: 0.25rem;
    }

    .rating-input {
      display: none;
    }

    .rating-star {
      cursor: pointer;
      color: var(--p-surface-300);
      transition: color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rating-star:hover:not(.rating-readonly .rating-star),
    .rating-star:hover ~ .rating-star:not(.rating-readonly .rating-star) {
      color: var(--p-primary-color);
    }

    .rating-input:checked ~ .rating-star,
    .rating-input:checked ~ .rating-star ~ .rating-star {
      color: var(--p-primary-color);
    }

    .rating-star.filled {
      color: var(--p-primary-color);
    }

    .rating-readonly .rating-star {
      cursor: default;
    }

    .rating-sm {
      gap: 0.125rem;
    }

    .rating-sm .rating-star {
      font-size: 1rem;
    }

    .rating-lg {
      gap: 0.5rem;
    }

    .rating-lg .rating-star {
      font-size: 2rem;
    }

    .rating-value {
      font-size: 0.875rem;
      color: var(--p-text-color-secondary);
    }

    .form-help {
      font-size: 0.75rem;
      color: var(--p-text-color-secondary);
    }

    .form-error {
      font-size: 0.75rem;
      color: var(--p-error-color);
    }
  `]
})
export class RatingComponent implements ControlValueAccessor {
  // Configuration
  id = input<string>(`rating-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  maxStars = input<number>(5);
  size = input<'sm' | 'md' | 'lg'>('md');
  showValue = input<boolean>(false);
  
  // Value signal
  value = signal<number>(0);
  private onChangeFn = (value: number) => {};
  private onTouchedFn = () => {};
  
  // Computed
  stars = signal<number[]>([]);
  
  constructor() {
    // Initialize stars array
    this.stars.set(Array.from({ length: this.maxStars() }, (_, i) => this.maxStars() - i));
  }
  
  // Events
  changed = output<number>();
  
  onChange(starValue: number): void {
    this.value.set(starValue);
    this.onChangeFn(starValue);
    this.changed.emit(starValue);
  }
  
  onBlur(): void {
    this.onTouchedFn();
  }
  
  // ControlValueAccessor implementation
  writeValue(value: number): void {
    this.value.set(value || 0);
  }
  
  registerOnChange(fn: (value: number) => void): void {
    this.onChangeFn = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    // Handled via disabled input
  }
}

