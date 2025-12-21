import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Alert Component - Angular 21
 * 
 * A feedback alert component with multiple types
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div [class]="alertClass()" [attr.role]="'alert'" [attr.aria-live]="'polite'">
        <div class="alert-content">
          @if (title()) {
            <h4 class="alert-title">{{ title() }}</h4>
          }
          <p class="alert-message">
            <ng-content></ng-content>
          </p>
        </div>
        @if (dismissible()) {
          <button 
            class="alert-close" 
            (click)="dismiss()"
            aria-label="Close alert"
            type="button">
            <i class="pi pi-times"></i>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    [role="alert"] {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--p-border-radius);
      border: 1px solid transparent;
      margin-bottom: 1rem;
      position: relative;
    }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .alert-message {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--p-border-radius);
    }

    .alert-close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.1);
    }

    .alert-close:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    /* Variants */
    .alert-success {
      background-color: var(--p-success-color-light, #e8f5e9);
      color: var(--p-success-color-dark, #2e7d32);
      border-color: var(--p-success-color, #4caf50);
    }

    .alert-success .alert-title {
      color: var(--p-success-color-dark, #2e7d32);
    }

    .alert-warning {
      background-color: var(--p-warning-color-light, #fff3e0);
      color: var(--p-warning-color-dark, #e65100);
      border-color: var(--p-warning-color, #ff9800);
    }

    .alert-warning .alert-title {
      color: var(--p-warning-color-dark, #e65100);
    }

    .alert-error {
      background-color: var(--p-error-color-light, #ffebee);
      color: var(--p-error-color-dark, #c62828);
      border-color: var(--p-error-color);
    }

    .alert-error .alert-title {
      color: var(--p-error-color-dark, #c62828);
    }

    .alert-info {
      background-color: var(--p-info-color-light, #e3f2fd);
      color: var(--p-info-color-dark, #1565c0);
      border-color: var(--p-info-color, #2196f3);
    }

    .alert-info .alert-title {
      color: var(--p-info-color-dark, #1565c0);
    }
  `]
})
export class AlertComponent {
  // Angular 21: Use input() signals instead of @Input()
  type = input<'success' | 'warning' | 'error' | 'info'>('info');
  title = input<string>();
  dismissible = input<boolean>(false);

  // Show state
  show = signal<boolean>(true);

  // Computed class string
  alertClass = computed(() => `alert alert-${this.type()}`);

  dismiss(): void {
    this.show.set(false);
  }
}

