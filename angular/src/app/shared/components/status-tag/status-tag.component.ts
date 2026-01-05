/**
 * Status Tag Component - Unified PILL Design System
 *
 * SINGLE SOURCE OF TRUTH for all status indicators (tags, badges, chips)
 * across the entire application.
 *
 * Reference Design (matches "Good" pill exactly):
 * - Solid green background (#63ad0e for success)
 * - White text (#ffffff)
 * - Semibold font weight (600)
 * - Fixed height: 30px
 * - Horizontal padding: 13px
 * - NO borders, shadows, outlines, or underlines
 * - PILL shape: border-radius 9999px
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
  styles: [`
    :host {
      display: inline-block;
    }

    /* ================================================================
       STATUS TAG - UNIFIED PILL DESIGN
       Matches the "Good" pill badge in the player dashboard exactly
       ================================================================ */

    .status-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      
      /* Fixed height - 30px, no vertical growth */
      height: 30px;
      min-height: 30px;
      max-height: 30px;
      
      /* Padding: 13px horizontal */
      padding: 0 13px;
      
      /* Typography */
      font-family: var(--font-family-sans);
      font-size: 14px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      text-transform: none;
      text-decoration: none;
      
      /* Shape: PILL (full rounded) */
      border-radius: 9999px;
      
      /* NO borders, shadows, outlines, or underlines */
      border: none;
      box-shadow: none;
      outline: none;
      
      /* Default: Success (green) */
      background-color: #63ad0e;
      color: #ffffff;
      
      /* Prevent flex row stretching */
      flex-shrink: 0;
      
      /* Smooth transitions */
      transition: opacity 0.15s ease;
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
       SIZE VARIANTS - All use PILL shape
       ================================================================ */

    /* Small - More compact */
    .status-tag-sm {
      height: 24px;
      min-height: 24px;
      max-height: 24px;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 9999px;
    }

    /* Large - More prominent */
    .status-tag-lg {
      height: 36px;
      min-height: 36px;
      max-height: 36px;
      padding: 0 16px;
      font-size: 16px;
      border-radius: 9999px;
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
  `],
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
