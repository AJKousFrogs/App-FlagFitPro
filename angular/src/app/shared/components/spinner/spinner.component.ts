import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Spinner Component - Angular 21
 * 
 * A standalone loading spinner component
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div [class]="spinnerClass()" [attr.aria-label]="ariaLabel() || 'Loading'">
      <div class="spinner-circle"></div>
      @if (showText()) {
        <div class="spinner-text">{{ text() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .spinner-circle {
      width: 2rem;
      height: 2rem;
      border: 3px solid var(--p-surface-border);
      border-top-color: var(--p-primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-sm .spinner-circle {
      width: 1rem;
      height: 1rem;
      border-width: 2px;
    }

    .spinner-lg .spinner-circle {
      width: 3rem;
      height: 3rem;
      border-width: 4px;
    }

    .spinner-text {
      font-size: 0.875rem;
      color: var(--p-text-color-secondary);
      text-align: center;
    }

    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .spinner-overlay .spinner-container {
      background-color: var(--p-surface-0);
      padding: 2rem;
      border-radius: var(--p-border-radius);
      box-shadow: var(--p-shadow-lg);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class SpinnerComponent {
  // Configuration
  size = input<'sm' | 'md' | 'lg'>('md');
  variant = input<'default' | 'overlay'>('default');
  showText = input<boolean>(false);
  text = input<string>('Loading...');
  ariaLabel = input<string>('Loading');
  
  // Computed class
  spinnerClass = computed(() => {
    const sizeClass = this.size() !== 'md' ? `spinner-${this.size()}` : '';
    const variantClass = this.variant() === 'overlay' ? 'spinner-overlay' : 'spinner-container';
    return `${variantClass} ${sizeClass}`.trim();
  });
}

