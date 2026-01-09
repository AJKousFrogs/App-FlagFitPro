import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../button/button.component";

/**
 * Empty State Component - Enhanced
 *
 * Displays a consistent empty state when no data is available
 * Follows PLAYER_DATA_DISPLAY_LOGIC.md guidelines for empty states
 *
 * NEW FEATURES:
 * - RouterLink support for navigation actions
 * - Secondary action button
 * - Benefits list to show value proposition
 * - Help link for contextual guidance
 * - Multiple severity options for action buttons
 */
@Component({
  selector: "app-empty-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CardModule, ButtonComponent],
  template: `
    <div class="empty-state" [class.compact]="compact()">
      @if (icon()) {
        <div class="empty-icon" [style.color]="iconColor()">
          <i [class]="'pi ' + icon()"></i>
        </div>
      }
      <h3 class="empty-title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-message">{{ message() }}</p>
      }

      <!-- Benefits list (optional) -->
      @if (benefits() && benefits()!.length > 0) {
        <ul class="empty-benefits">
          @for (benefit of benefits(); track benefit) {
            <li>
              <i class="pi pi-check-circle"></i>
              <span>{{ benefit }}</span>
            </li>
          }
        </ul>
      }

      <!-- Action buttons -->
      <div class="empty-actions">
        <!-- Primary action -->
        @if (actionLabel()) {
          @if (actionLink()) {
            <app-button
              [routerLink]="actionLink()!"
              [iconLeft]="actionIcon() || ''"
              >{{ actionLabel() }}</app-button
            >
          } @else if (actionHandler()) {
            <app-button
              (clicked)="handleAction()"
              [iconLeft]="actionIcon() || ''"
              >{{ actionLabel() }}</app-button
            >
          }
        }

        <!-- Secondary action (optional) -->
        @if (secondaryActionLabel()) {
          @if (secondaryActionLink()) {
            <app-button
              variant="outlined"
              [routerLink]="secondaryActionLink()!"
              [iconLeft]="secondaryActionIcon() || ''"
              >{{ secondaryActionLabel() }}</app-button
            >
          } @else {
            <app-button
              variant="outlined"
              (clicked)="handleSecondaryAction()"
              [iconLeft]="secondaryActionIcon() || ''"
              >{{ secondaryActionLabel() }}</app-button
            >
          }
        }
      </div>

      <!-- Help link (optional) -->
      @if (helpText() && helpLink()) {
        <div class="empty-help">
          <a [routerLink]="helpLink()!" class="empty-help-link">
            <i class="pi pi-question-circle"></i>
            {{ helpText() }}
          </a>
        </div>
      }
    </div>
  `,
  styleUrl: "./empty-state.component.scss",
})
export class EmptyStateComponent {
  // Angular 21: Use input() signal instead of @Input()

  // Basic display
  title = input<string>("No Data Available");
  message = input<string | null>(null);
  icon = input<string | null>(null);
  iconColor = input<string>("var(--text-secondary)");
  compact = input<boolean>(false);

  // Benefits list (optional)
  benefits = input<string[] | null>(null);

  // Primary action
  actionLabel = input<string | null>(null);
  actionIcon = input<string | null>(null);
  actionLink = input<string | null>(null); // NEW: RouterLink support
  actionHandler = input<(() => void) | null>(null);
  actionSeverity = input<
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "help"
    | "contrast"
  >("primary");

  // Secondary action (NEW)
  secondaryActionLabel = input<string | null>(null);
  secondaryActionIcon = input<string | null>(null);
  secondaryActionLink = input<string | null>(null);

  // Help link (NEW)
  helpText = input<string | null>(null);
  helpLink = input<string | null>(null);

  // Events (NEW)
  onAction = output<void>();
  onSecondaryAction = output<void>();

  // Event handlers
  handleAction(): void {
    const handler = this.actionHandler();
    if (handler) {
      handler();
    }
    this.onAction.emit();
  }

  handleSecondaryAction(): void {
    this.onSecondaryAction.emit();
  }
}
