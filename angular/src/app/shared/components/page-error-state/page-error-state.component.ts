/**
 * Page Error State Component
 *
 * Displays a user-friendly error state with retry functionality.
 * Use this in page-level components when API calls fail.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-page-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="error-state-container" role="alert" aria-live="polite">
      <div class="error-icon">
        <i [class]="'pi ' + icon"></i>
      </div>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      @if (showRetry) {
        <p-button
          label="Try Again"
          icon="pi pi-refresh"
          (onClick)="onRetry()"
          styleClass="p-button-primary"
        ></p-button>
      }
      @if (helpText) {
        <p class="error-help">{{ helpText }}</p>
      }
    </div>
  `,
  styles: [
    `
      .error-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-10, 2.5rem);
        text-align: center;
        min-height: 300px;
      }

      .error-icon {
        font-size: 3rem;
        color: var(--color-status-error, #ef4444);
        margin-bottom: var(--space-4, 1rem);
        opacity: 0.8;
      }

      .error-title {
        font-size: var(--font-heading-md, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
        color: var(--text-primary);
        margin: 0 0 var(--space-2, 0.5rem) 0;
      }

      .error-message {
        font-size: var(--font-body-md, 1rem);
        color: var(--text-secondary);
        margin: 0 0 var(--space-6, 1.5rem) 0;
        max-width: 400px;
        line-height: 1.5;
      }

      .error-help {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-muted);
        margin: var(--space-4, 1rem) 0 0 0;
      }
    `,
  ],
})
export class PageErrorStateComponent {
  @Input() title = 'Unable to load data';
  @Input() message = 'Something went wrong while loading this page. Please try again.';
  @Input() icon = 'pi-exclamation-circle';
  @Input() showRetry = true;
  @Input() helpText?: string;

  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}

