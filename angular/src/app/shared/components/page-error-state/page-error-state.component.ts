/**
 * Page Error State Component
 *
 * Displays a user-friendly error state with retry functionality.
 * Use this in page-level components when API calls fail.
 *
 * Uses standardized .error-state utility classes from ui-standardization.scss
 *
 * @author FlagFit Pro Team
 * @version 2.0.0 - Angular 21 Signals
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { ButtonComponent } from "../button/button.component";

@Component({
  selector: "app-page-error-state",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="error-state" role="alert" aria-live="polite">
      <div class="error-state__icon">
        <i [class]="'pi ' + icon()"></i>
      </div>
      @switch (titleTag()) {
        @case ("h1") {
          <h1 class="error-state__title">{{ title() }}</h1>
        }
        @case ("h2") {
          <h2 class="error-state__title">{{ title() }}</h2>
        }
        @default {
          <h3 class="error-state__title">{{ title() }}</h3>
        }
      }
      <p class="error-state__description">{{ message() }}</p>
      @if (showRetry()) {
        <app-button iconLeft="pi-refresh" (clicked)="onRetry()"
          >Try Again</app-button
        >
      }
      @if (helpText()) {
        <p class="error-state__help">{{ helpText() }}</p>
      }
    </div>
  `,
  styleUrl: "./page-error-state.component.scss",
})
export class PageErrorStateComponent {
  // Angular 21 Signals
  title = input<string>("We couldn't load this yet");
  message = input<string>(
    "Refresh to try again.",
  );
  icon = input<string>("pi-exclamation-circle");
  titleTag = input<"h1" | "h2" | "h3">("h3");
  showRetry = input<boolean>(true);
  helpText = input<string | null>(null);

  retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
