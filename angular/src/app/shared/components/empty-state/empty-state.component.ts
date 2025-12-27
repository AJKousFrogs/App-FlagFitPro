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
          [label]="actionLabel() || ''"
          [icon]="actionIcon() || undefined"
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
        animation: empty-icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
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
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
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
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
      }

      .empty-state.compact .empty-message {
        font-size: var(--font-body-sm);
        margin-bottom: var(--space-3);
      }

      :host ::ng-deep p-button {
        animation: empty-text-slide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
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
        :host ::ng-deep p-button {
          animation: none;
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
