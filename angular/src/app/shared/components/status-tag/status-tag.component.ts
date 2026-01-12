/**
 * Status Tag Component - Unified RAISED BADGE Design System
 *
 * SINGLE SOURCE OF TRUTH for all status indicators (tags, badges, chips)
 * across the entire application.
 *
 * Reference Design:
 * - Uses design tokens from design-system-tokens.scss
 * - Background: var(--color-status-success) for success
 * - Text: var(--color-text-on-primary) white on colored backgrounds
 * - Font weight: var(--font-weight-semibold) (600)
 * - Fixed height: var(--touch-target-sm) (36px)
 * - Horizontal padding: var(--space-3) (12px)
 * - RAISED RECTANGULAR shape: var(--radius-md) (8px)
 * - Subtle shadow for depth
 * - Text vertically centered
 * - text-transform: none
 *
 * @example
 * ```html
 * <app-status-tag value="Good" severity="success"></app-status-tag>
 * <app-status-tag value="Optimal" severity="success"></app-status-tag>
 * <app-status-tag value="Elevated" severity="warning"></app-status-tag>
 * <app-status-tag value="High" severity="danger"></app-status-tag>
 * ```
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type StatusTagSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "primary";

@Component({
  selector: "app-status-tag",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span
      [class]="tagClass()"
      [attr.aria-label]="ariaLabel() || value()"
      role="status"
    >
      @if (icon()) {
        <i [class]="'pi ' + icon()" aria-hidden="true"></i>
      }
      <span class="status-tag-text">{{ value() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      /* ================================================================
       STATUS TAG - UNIFIED RAISED BADGE DESIGN
       Standardized raised rectangular shape across the app
       ================================================================ */

      .status-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);

        /* Fixed height - 36px for better touch target */
        height: var(--touch-target-sm);
        min-height: var(--touch-target-sm);

        /* Padding: 12px horizontal for breathing room */
        padding: 0 var(--space-3);

        /* Typography - using design tokens */
        font-family: var(--font-family-sans);
        font-size: var(--font-body-sm-size);
        font-weight: var(--font-weight-semibold);
        line-height: 1;
        white-space: nowrap;
        text-transform: none;
        text-decoration: none;

        /* Shape: RAISED RECTANGULAR (not pill) */
        border-radius: var(--radius-md);

        /* Raised effect with shadow */
        border: none;
        box-shadow: var(--shadow-1);
        outline: none;

        /* Default: Success (green) - using design tokens */
        background-color: var(--color-status-success);
        color: var(--color-text-on-primary);

        /* Prevent flex row stretching */
        flex-shrink: 0;

        /* Smooth transitions */
        transition:
          box-shadow var(--motion-fast) var(--ease-standard),
          transform var(--motion-fast) var(--ease-standard);
      }

      /* Icon styling */
      .status-tag i {
        font-size: var(--font-caption-size);
        line-height: 1;
        text-decoration: none;
      }

      /* Text styling */
      .status-tag-text {
        line-height: 1;
        text-decoration: none;
      }

      /* ================================================================
       SEVERITY VARIANTS - Using Design Tokens
       ================================================================ */

      /* Success - Solid green (matches "Good" reference) */
      .status-tag-success {
        background-color: var(--color-status-success);
        color: var(--color-text-on-primary);
      }

      /* Primary - Brand green */
      .status-tag-primary {
        background-color: var(--ds-primary-green);
        color: var(--color-text-on-primary);
      }

      /* Warning - Amber/yellow with dark text for contrast */
      .status-tag-warning {
        background-color: var(--color-status-warning);
        color: var(--primitive-warning-800);
      }

      /* Danger - Red */
      .status-tag-danger {
        background-color: var(--color-status-error);
        color: var(--color-text-on-primary);
      }

      /* Info - Blue */
      .status-tag-info {
        background-color: var(--color-status-info);
        color: var(--color-text-on-primary);
      }

      /* Secondary - Neutral gray */
      .status-tag-secondary {
        background-color: var(--surface-tertiary);
        color: var(--color-text-secondary);
      }

      /* ================================================================
       SIZE VARIANTS - All use RAISED RECTANGULAR shape
       ================================================================ */

      /* Small - More compact */
      .status-tag-sm {
        height: var(--space-6); /* 24px */
        min-height: var(--space-6);
        padding: 0 var(--space-2);
        font-size: var(--font-caption-size);
        border-radius: var(--radius-sm);
      }

      /* Large - More prominent */
      .status-tag-lg {
        height: var(--touch-target-md); /* 44px */
        min-height: var(--touch-target-md);
        padding: 0 var(--space-5);
        font-size: var(--font-body-size);
        border-radius: var(--radius-lg);
      }

      /* ================================================================
       DARK MODE - Using Design Tokens
       ================================================================ */

      :host-context([data-theme="dark"]),
      :host-context(.dark-theme) {
        .status-tag-secondary {
          background-color: var(--primitive-neutral-700);
          color: var(--primitive-neutral-200);
        }
      }
    `,
  ],
})
export class StatusTagComponent {
  /** The text to display in the tag */
  value = input.required<string>();

  /** Severity determines the color scheme */
  severity = input<StatusTagSeverity>("success");

  /** Optional icon (PrimeNG pi-* class without the 'pi' prefix) */
  icon = input<string>();

  /** Size variant */
  size = input<"sm" | "md" | "lg">("md");

  /** Accessibility label */
  ariaLabel = input<string>();

  /** Computed CSS class */
  tagClass = computed(() => {
    const classes = ["status-tag", `status-tag-${this.severity()}`];

    if (this.size() !== "md") {
      classes.push(`status-tag-${this.size()}`);
    }

    return classes.join(" ");
  });
}
