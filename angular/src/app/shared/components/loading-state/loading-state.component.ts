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
        [styleClass]="spinnerSizeClass()"
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
        min-height: var(--chart-min-height-md);
      }

      .loading-state.compact {
        padding: var(--space-6);
        min-height: var(--chart-min-height-sm);
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        text-align: center;
      }

      .loading-state.compact .loading-message {
        font-size: var(--ds-font-size-sm);
        margin-top: var(--space-3);
      }

      .spinner-size-sm {
        width: var(--space-10);
        height: var(--space-10);
      }

      .spinner-size-md {
        width: var(--space-12);
        height: var(--space-12);
      }

      .spinner-size-lg {
        width: var(--space-16);
        height: var(--space-16);
      }

      @media (max-width: 768px) {
        .loading-state {
          padding: var(--space-6);
          min-height: var(--chart-min-height-sm);
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

  spinnerSizeClass(): string {
    const value = this.size();
    if (value <= 40) return "spinner-size-sm";
    if (value <= 56) return "spinner-size-md";
    return "spinner-size-lg";
  }
}
