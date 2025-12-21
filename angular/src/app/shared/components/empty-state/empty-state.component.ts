import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";

/**
 * Empty State Component
 * 
 * Displays a consistent empty state when no data is available
 * Follows PLAYER_DATA_DISPLAY_LOGIC.md guidelines for empty states
 */
@Component({
  selector: "app-empty-state",
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
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
      @if (actionLabel() && actionHandler()) {
        <p-button
          [label]="actionLabel()"
          [icon]="actionIcon()"
          (onClick)="actionHandler()!()"
          [outlined]="true"
        ></p-button>
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
      }

      .empty-state.compact {
        padding: var(--space-6);
        min-height: 200px;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .empty-state.compact .empty-icon {
        font-size: 2.5rem;
        margin-bottom: var(--space-3);
      }

      .empty-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .empty-state.compact .empty-title {
        font-size: 1.25rem;
      }

      .empty-message {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        max-width: 500px;
      }

      .empty-state.compact .empty-message {
        font-size: 0.875rem;
        margin-bottom: var(--space-3);
      }

      @media (max-width: 768px) {
        .empty-state {
          padding: var(--space-6);
          min-height: 200px;
        }

        .empty-icon {
          font-size: 3rem;
        }

        .empty-title {
          font-size: 1.25rem;
        }

        .empty-message {
          font-size: 0.875rem;
        }
      }
    `,
  ],
})
export class EmptyStateComponent {
  // Angular 21: Use input() signal instead of @Input()
  title = input<string>("No Data Available");
  message = input<string | null>(null);
  icon = input<string | null>(null);
  iconColor = input<string>("var(--text-secondary)");
  actionLabel = input<string | null>(null);
  actionIcon = input<string | null>(null);
  actionHandler = input<(() => void) | null>(null);
  compact = input<boolean>(false);
}
