import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";

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
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
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
            <p-button
              [label]="actionLabel()!"
              [icon]="actionIcon() || undefined"
              [severity]="actionSeverity()"
              [routerLink]="actionLink()!"
            ></p-button>
          } @else if (actionHandler()) {
            <p-button
              [label]="actionLabel()!"
              [icon]="actionIcon() || undefined"
              [severity]="actionSeverity()"
              (onClick)="handleAction()"
            ></p-button>
          }
        }

        <!-- Secondary action (optional) -->
        @if (secondaryActionLabel()) {
          @if (secondaryActionLink()) {
            <p-button
              [label]="secondaryActionLabel()!"
              [icon]="secondaryActionIcon() || undefined"
              [outlined]="true"
              [routerLink]="secondaryActionLink()!"
            ></p-button>
          } @else {
            <p-button
              [label]="secondaryActionLabel()!"
              [icon]="secondaryActionIcon() || undefined"
              [outlined]="true"
              (onClick)="handleSecondaryAction()"
            ></p-button>
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
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        text-align: center;
        min-height: 300px;
        animation: empty-state-fade-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes empty-state-fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .empty-state.compact {
        padding: var(--space-6);
        min-height: 200px;
      }

      .empty-icon {
        font-size: var(--icon-5xl);
        margin-bottom: var(--space-4);
        opacity: 0.5;
        animation: empty-icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s
          both;
      }

      @keyframes empty-icon-bounce {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 0.5;
          transform: scale(1);
        }
      }

      .empty-state.compact .empty-icon {
        font-size: var(--icon-4xl);
        margin-bottom: var(--space-3);
      }

      .empty-title {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s
          both;
      }

      @keyframes empty-text-slide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .empty-state.compact .empty-title {
        font-size: var(--font-heading-sm);
      }

      .empty-message {
        font-size: var(--font-body-md);
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        max-width: 500px;
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s
          both;
      }

      .empty-state.compact .empty-message {
        font-size: var(--font-body-sm);
        margin-bottom: var(--space-3);
      }

      .empty-benefits {
        list-style: none;
        padding: 0;
        margin: var(--space-4) 0;
        text-align: left;
        max-width: 400px;
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s
          both;
      }

      .empty-benefits li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .empty-benefits li i {
        color: var(--ds-primary-green);
        font-size: var(--font-body-md);
        flex-shrink: 0;
      }

      .empty-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        align-items: center;
        margin-top: var(--space-4);
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s
          both;
      }

      @media (min-width: 640px) {
        .empty-actions {
          flex-direction: row;
        }
      }

      @media (max-width: 640px) {
        :host ::ng-deep .empty-actions p-button {
          width: 100%;
        }
      }

      .empty-help {
        margin-top: var(--space-4);
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s
          both;
      }

      .empty-help-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--ds-primary-green);
        text-decoration: none;
        transition: color 150ms ease-in-out;
      }

      .empty-help-link:hover {
        text-decoration: underline;
      }

      .empty-help-link i {
        font-size: var(--font-body-md);
      }

      :host ::ng-deep p-button {
        animation: inherit;
      }

      @media (max-width: 768px) {
        .empty-state {
          padding: var(--space-6);
          min-height: 200px;
        }

        .empty-icon {
          font-size: var(--icon-4xl);
        }

        .empty-title {
          font-size: var(--font-heading-sm);
        }

        .empty-message {
          font-size: var(--font-body-sm);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .empty-state,
        .empty-icon,
        .empty-title,
        .empty-message,
        .empty-benefits,
        .empty-actions,
        .empty-help,
        :host ::ng-deep p-button {
          animation: none;
        }
      }
    `,
  ],
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
    if (this.actionHandler()) {
      this.actionHandler()!();
    }
    this.onAction.emit();
  }

  handleSecondaryAction(): void {
    this.onSecondaryAction.emit();
  }
}
