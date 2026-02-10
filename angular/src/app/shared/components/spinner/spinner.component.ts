import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Spinner Component - Angular 21
 *
 * A standalone loading spinner component
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-spinner",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div [class]="spinnerClass()" [attr.aria-label]="ariaLabel() || 'Loading'">
      <div class="spinner-circle"></div>
      @if (showText()) {
        <div class="spinner-text">{{ text() }}</div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
      }

      .spinner-circle {
        width: var(--space-8);
        height: var(--space-8);
        border: var(--border-3) solid var(--p-surface-border);
        border-top-color: var(--p-primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .spinner-sm .spinner-circle {
        width: var(--space-4);
        height: var(--space-4);
        border-width: var(--border-2);
      }

      .spinner-lg .spinner-circle {
        width: var(--space-12);
        height: var(--space-12);
        border-width: var(--border-4);
      }

      .spinner-text {
        font-size: var(--ds-font-size-sm);
        color: var(--p-text-color-secondary);
        text-align: center;
      }

      .spinner-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--surface-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .spinner-overlay .spinner-container {
        background-color: var(--p-surface-0);
        padding: var(--space-8);
        border-radius: var(--p-border-radius);
        box-shadow: var(--p-shadow-lg);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {
  // Configuration
  size = input<"sm" | "md" | "lg">("md");
  variant = input<"default" | "overlay">("default");
  showText = input<boolean>(false);
  text = input<string>("Loading...");
  ariaLabel = input<string>("Loading");

  // Computed class
  spinnerClass = computed(() => {
    const sizeClass = this.size() !== "md" ? `spinner-${this.size()}` : "";
    const variantClass =
      this.variant() === "overlay" ? "spinner-overlay" : "spinner-container";
    return `${variantClass} ${sizeClass}`.trim();
  });
}
