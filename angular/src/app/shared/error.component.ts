import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message) {
      <div class="error-container">
        <span class="error-icon">⚠️</span>
        <div class="error-content">
          <p class="error-message">{{ message }}</p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .error-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #ffebee;
        border-left: 4px solid #d32f2f;
        border-radius: 4px;
      }

      .error-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .error-content {
        flex: 1;
      }

      .error-message {
        margin: 0;
        color: #d32f2f;
        font-weight: 500;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent {
  @Input() message: string | null = null;
}
