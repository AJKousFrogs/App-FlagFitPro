import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressSpinnerModule } from "primeng/progressspinner";

/**
 * Loading State Component
 *
 * Displays a consistent loading state while data is being fetched
 * Follows PLAYER_DATA_DISPLAY_LOGIC.md guidelines for loading states
 */
@Component({
  selector: "app-loading-state",
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
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
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  // Angular 21: Use input() signal instead of @Input()
  message = input<string | null>("Loading...");
  size = input<number>(50);
  compact = input<boolean>(false);
}
