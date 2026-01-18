import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinner } from "primeng/progressspinner";

/**
 * Loading State Component
 *
 * Displays a consistent loading state while data is being fetched
 * Follows PLAYER_DATA_DISPLAY_LOGIC.md guidelines for loading states
 */
@Component({
  selector: "app-loading-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProgressSpinner],
  template: `
    <div class="loading-state" [class.compact]="compact()">
      <p-progressSpinner
        [style]="{ width: size() + 'px', height: size() + 'px' }"
        strokeWidth="4"
        animationDuration="1s"
      ></p-progressSpinner>
      @if (message()) {
        <p class="loading-message">{{ message() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        min-height: 300px;
      }

      .loading-state.compact {
        padding: var(--space-6);
        min-height: 200px;
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--ds-font-size-md);
        color: var(--text-secondary);
        text-align: center;
      }

      .loading-state.compact .loading-message {
        font-size: var(--ds-font-size-sm);
        margin-top: var(--space-3);
      }

      @media (max-width: 768px) {
        .loading-state {
          padding: var(--space-6);
          min-height: 200px;
        }

        .loading-message {
          font-size: var(--ds-font-size-sm);
        }
      }
    `,
  ],
})
export class LoadingStateComponent {
  // Angular 21: Use input() signal instead of @Input()
  message = input<string | null>("Loading...");
  size = input<number>(50);
  compact = input<boolean>(false);
}
