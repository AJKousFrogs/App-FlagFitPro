import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Button Primary Component - Angular 21
 * 
 * A simplified primary button component
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-button-primary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button 
      class="btn btn-primary"
      [disabled]="disabled()"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel() || undefined">
      @if (loading()) {
        <span class="spinner spinner-sm"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--p-border-radius);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      line-height: 1.5;
      background-color: var(--color-brand-primary);
      color: var(--color-text-on-primary);
      border-color: var(--color-brand-primary);
    }

    button:focus {
      outline: 2px solid var(--p-primary-color);
      outline-offset: 2px;
    }

    button:hover:not(:disabled) {
      background-color: var(--color-brand-primary-hover);
      border-color: var(--color-brand-primary-hover);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
      border: 1.5px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class ButtonPrimaryComponent {
  // Angular 21: Use input() signals instead of @Input()
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  ariaLabel = input<string>('');

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  clicked = output<void>();

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}

