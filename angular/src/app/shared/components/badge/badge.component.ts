import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge Component - Angular 21
 * 
 * A badge component for notifications, counts, and status indicators
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span 
      [class]="badgeClass()"
      [attr.aria-label]="ariaLabel() || undefined">
      @if (dot()) {
        <span class="badge-dot"></span>
      } @else {
        <ng-content></ng-content>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      border-radius: 0.625rem;
      background-color: var(--p-primary-color);
      color: var(--p-text-on-primary-color, #fff);
      white-space: nowrap;
    }

    .badge-dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: var(--p-primary-color);
    }

    /* Variants */
    .badge-primary {
      background-color: var(--p-primary-color);
      color: var(--p-text-on-primary-color, #fff);
    }

    .badge-success {
      background-color: var(--p-success-color, #4caf50);
      color: var(--p-text-on-success-color, #fff);
    }

    .badge-warning {
      background-color: var(--p-warning-color, #ff9800);
      color: var(--p-text-on-warning-color, #fff);
    }

    .badge-danger {
      background-color: var(--p-error-color);
      color: var(--p-text-on-error-color, #fff);
    }

    .badge-info {
      background-color: var(--p-info-color, #2196f3);
      color: var(--p-text-on-info-color, #fff);
    }

    .badge-secondary {
      background-color: var(--p-surface-300);
      color: var(--p-text-color);
    }

    /* Sizes */
    .badge-sm {
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.25rem;
      font-size: 0.625rem;
    }

    .badge-lg {
      min-width: 1.5rem;
      height: 1.5rem;
      padding: 0 0.5rem;
      font-size: 0.875rem;
    }

    /* Position (for overlay badges) */
    .badge-overlay {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      z-index: 1;
    }

    .badge-overlay-top-left {
      top: -0.5rem;
      left: -0.5rem;
      right: auto;
    }

    .badge-overlay-bottom-right {
      top: auto;
      bottom: -0.5rem;
      right: -0.5rem;
    }

    .badge-overlay-bottom-left {
      top: auto;
      bottom: -0.5rem;
      left: -0.5rem;
      right: auto;
    }
  `]
})
export class BadgeComponent {
  // Configuration
  variant = input<'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  dot = input<boolean>(false);
  overlay = input<boolean>(false);
  position = input<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
  ariaLabel = input<string>();
  
  // Computed class
  badgeClass = computed(() => {
    const variantClass = `badge badge-${this.variant()}`;
    const sizeClass = this.size() !== 'md' ? `badge-${this.size()}` : '';
    const overlayClass = this.overlay() ? `badge-overlay badge-overlay-${this.position()}` : '';
    return `${variantClass} ${sizeClass} ${overlayClass}`.trim();
  });
}

