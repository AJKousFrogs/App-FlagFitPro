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
          styleClass="page-loading-spinner"
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
        min-height: var(--chart-min-height-lg);
        padding: var(--space-12);
      }

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
      }

      .page-loading-spinner {
        width: var(--space-16);
        height: var(--space-16);
      }

      .loading-message {
        margin: 0;
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        text-align: center;
      }

      @media (max-width: 768px) {
        .page-loading-state {
          padding: var(--space-6);
          min-height: var(--chart-min-height-md);
        }

        .loading-message {
          font-size: var(--ds-font-size-sm);
        }
      }
    `,
  ],
})
export class PageLoadingStateComponent {
  message = input<string | null>("Loading...");
}
