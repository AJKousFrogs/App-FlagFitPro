/**
 * Status Tag Component - Unified RAISED BADGE Design System
 *
 * SINGLE SOURCE OF TRUTH for all status indicators (tags, badges, chips)
 * across the entire application.
 *
 * Reference Design:
 * - Solid green background (#63ad0e for success)
 * - White text (#ffffff)
 * - Semibold font weight (600)
 * - Fixed height: 32px
 * - Horizontal padding: 12px
 * - RAISED RECTANGULAR shape: border-radius 8px
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

        /* Padding: 16px horizontal for breathing room */
        padding: 0 var(--space-4);

        /* Typography */
        font-family: var(--font-family-sans);
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        text-transform: none;
        text-decoration: none;

        /* Shape: RAISED RECTANGULAR (not pill) */
        border-radius: var(--radius-md, 8px);

        /* Raised effect with shadow */
        border: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        outline: none;

        /* Default: Success (green) */
        background-color: #63ad0e;
        color: #ffffff;

        /* Prevent flex row stretching */
        flex-shrink: 0;

        /* Smooth transitions */
        transition:
          box-shadow 0.15s ease,
          transform 0.15s ease;
      }

      /* Icon styling */
      .status-tag i {
        font-size: 12px;
        line-height: 1;
        text-decoration: none;
      }

      /* Text styling */
      .status-tag-text {
        line-height: 1;
        text-decoration: none;
      }

      /* ================================================================
       SEVERITY VARIANTS
       ================================================================ */

      /* Success - Solid green (matches "Good" reference) */
      .status-tag-success {
        background-color: #63ad0e;
        color: #ffffff;
      }

      /* Primary - Brand green */
      .status-tag-primary {
        background-color: var(--ds-primary-green, #089949);
        color: #ffffff;
      }

      /* Warning - Amber/yellow with dark text for contrast */
      .status-tag-warning {
        background-color: #ffc000;
        color: #78350f;
      }

      /* Danger - Red */
      .status-tag-danger {
        background-color: #ff003c;
        color: #ffffff;
      }

      /* Info - Blue */
      .status-tag-info {
        background-color: #0ea5e9;
        color: #ffffff;
      }

      /* Secondary - Neutral gray */
      .status-tag-secondary {
        background-color: #e5e7eb;
        color: #525252;
      }

      /* ================================================================
       SIZE VARIANTS - All use RAISED RECTANGULAR shape
       ================================================================ */

      /* Small - More compact */
      .status-tag-sm {
        height: var(--space-7); /* 28px */
        min-height: var(--space-7);
        padding: 0 var(--space-3);
        font-size: var(--font-size-badge);
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
       DARK MODE
       ================================================================ */

      :host-context([data-theme="dark"]),
      :host-context(.dark-theme) {
        .status-tag-secondary {
          background-color: #404040;
          color: #e5e5e5;
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
