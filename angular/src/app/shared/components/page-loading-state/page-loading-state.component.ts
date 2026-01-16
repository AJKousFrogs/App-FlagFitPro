import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinner } from "primeng/progressspinner";

/**
 * Page Loading State Component
 *
 * Full-page loading state for route transitions and data fetching
 */
@Component({
  selector: "app-page-loading-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressSpinner],
  template: `
    <div class="page-loading-state">
      <div class="loading-content">
        <p-progressSpinner
          [style]="{ width: '60px', height: '60px' }"
          strokeWidth="4"
          animationDuration="1s"
        ></p-progressSpinner>
        @if (message()) {
          <p class="loading-message">{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page-loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: var(--space-12, 3rem);
      }

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4, 1rem);
      }

      .loading-message {
        margin: 0;
        font-size: 1rem;
        color: var(--text-secondary, #666);
        text-align: center;
      }

      @media (max-width: 768px) {
        .page-loading-state {
          padding: var(--space-6, 1.5rem);
          min-height: 300px;
        }

        .loading-message {
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class PageLoadingStateComponent {
  message = input<string | null>("Loading...");
}
