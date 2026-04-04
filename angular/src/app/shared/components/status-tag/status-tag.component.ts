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
 * - Font weight: var(--ds-font-weight-semibold) (600)
 * - Fixed height: var(--touch-target-sm) (36px)
 * - Horizontal padding: var(--space-3)
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
export type StatusTagSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "primary"
  | "contrast"
  | "warn";

@Component({
  selector: "app-status-tag",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
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
  styleUrl: "./status-tag.component.scss",
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
