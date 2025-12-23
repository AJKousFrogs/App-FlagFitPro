import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Card Component - Angular 21
 *
 * A versatile card component with multiple variants
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass()">
      @if (title() || subtitle()) {
        <div class="card-header">
          @if (title()) {
            <h3 class="card-title">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="card-subtitle">{{ subtitle() }}</p>
          }
        </div>
      }
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="card-footer">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .card {
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .card-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--p-surface-border);
      }

      .card-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .card-subtitle {
        margin: 0.5rem 0 0 0;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .card-body {
        padding: 1.5rem;
      }

      .card-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--p-surface-border);
        background: var(--p-surface-50);
      }

      /* Variants */
      .card-default {
        border: 1px solid var(--p-surface-border);
      }

      .card-elevated {
        border: none;
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      }

      .card-outlined {
        border: 2px solid var(--p-surface-border);
      }

      .card-interactive {
        border: 1px solid var(--p-surface-border);
        cursor: pointer;
      }

      .card-interactive:hover {
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        transform: translateY(-2px);
      }

      .card-gradient {
        background: linear-gradient(
          135deg,
          var(--color-brand-primary) 0%,
          var(--color-brand-secondary, #4caf50) 100%
        );
        color: var(--color-text-on-primary);
      }

      .card-gradient .card-title,
      .card-gradient .card-subtitle {
        color: var(--color-text-on-primary);
      }

      .card-gradient .card-header,
      .card-gradient .card-footer {
        border-color: rgba(255, 255, 255, 0.2);
      }
    `,
  ],
})
export class CardComponent {
  // Angular 21: Use input() signals instead of @Input()
  title = input<string>();
  subtitle = input<string>();
  variant = input<
    "default" | "elevated" | "outlined" | "interactive" | "gradient"
  >("default");
  hasFooter = input<boolean>(false);

  // Computed class string
  cardClass = computed(() => {
    return `card card-${this.variant()}`;
  });
}
