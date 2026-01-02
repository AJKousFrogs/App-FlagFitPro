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
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-page-error-state",
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
  styleUrl: './page-error-state.component.scss',
})
export class PageErrorStateComponent {
  @Input() title = "Unable to load data";
  @Input() message =
    "Something went wrong while loading this page. Please try again.";
  @Input() icon = "pi-exclamation-circle";
  @Input() showRetry = true;
  @Input() helpText?: string;

  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
