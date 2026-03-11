import { CommonModule } from "@angular/common";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tooltip } from "primeng/tooltip";

/**
 * Icon Button Component - For icon-only actions
 *
 * Specialized button component for actions that are represented by an icon only.
 * Enforces accessibility by requiring ariaLabel.
 *
 * @example Basic usage
 * ```html
 * <app-icon-button icon="pi-plus" ariaLabel="Add item" (clicked)="addItem()"></app-icon-button>
 * ```
 *
 * @example With tooltip
 * ```html
 * <app-icon-button
 *   icon="pi-trash"
 *   ariaLabel="Delete item"
 *   tooltip="Delete this item"
 *   variant="danger"
 *   (clicked)="deleteItem()"
 * ></app-icon-button>
 * ```
 *
 * @example Different sizes
 * ```html
 * <app-icon-button icon="pi-cog" ariaLabel="Settings" size="sm"></app-icon-button>
 * <app-icon-button icon="pi-cog" ariaLabel="Settings" size="md"></app-icon-button>
 * <app-icon-button icon="pi-cog" ariaLabel="Settings" size="lg"></app-icon-button>
 * ```
 *
 * @version 1.0.0 - Unified Design System
 */
export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "text"
  | "danger"
  | "success";
export type IconButtonSize = "sm" | "md" | "lg";

@Component({
  selector: "app-icon-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, Tooltip],
  template: `
    <!-- Link version (when routerLink is provided) -->
    @if (routerLink()) {
      <a
        [routerLink]="routerLink()"
        [queryParams]="queryParams()"
        [class]="buttonClasses()"
        [class.btn-disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-disabled]="isDisabled() || undefined"
        [attr.tabindex]="isDisabled() ? -1 : null"
        [pTooltip]="tooltipText()"
        [tooltipPosition]="tooltipPosition()"
        (click)="onLinkClick($event)"
      >
        <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
      </a>
    } @else {
      <!-- Button version -->
      <button
        [type]="type()"
        [class]="buttonClasses()"
        [disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-busy]="loading() || undefined"
        [attr.aria-disabled]="isDisabled() || undefined"
        [attr.aria-expanded]="ariaExpanded()"
        [attr.aria-pressed]="ariaPressed()"
        [attr.aria-haspopup]="ariaHasPopup()"
        [pTooltip]="tooltipText()"
        [tooltipPosition]="tooltipPosition()"
        (click)="onClick($event)"
      >
        <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
      </button>
    }

    <!-- Shared button content template -->
    <ng-template #buttonContent>
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true">
          <i class="pi pi-spin pi-spinner"></i>
        </span>
      } @else {
        <i [class]="iconClasses()" aria-hidden="true"></i>
      }
    </ng-template>
  `,
  styleUrl: "./icon-button.component.scss",
})
export class IconButtonComponent {
  // ============================================
  // REQUIRED INPUTS
  // ============================================

  /** Icon class (PrimeIcons, e.g., 'pi-plus' or 'plus') */
  icon = input.required<string>();

  /** Accessibility label - REQUIRED for icon-only buttons */
  ariaLabel = input.required<string>();

  // ============================================
  // OPTIONAL INPUTS
  // ============================================

  /** Visual style variant */
  variant = input<IconButtonVariant>("text");

  /** Size of the button */
  size = input<IconButtonSize>("md");

  /** Shows loading spinner and disables interaction */
  loading = input(false, { transform: booleanAttribute });

  /** Disables the button */
  disabled = input(false, { transform: booleanAttribute });

  /** HTML button type attribute */
  type = input<"button" | "submit" | "reset">("button");

  /** Tooltip text (defaults to ariaLabel if not provided) */
  tooltip = input<string>("");

  /** Tooltip position */
  tooltipPosition = input<"top" | "bottom" | "left" | "right">("top");

  // ============================================
  // ROUTING INPUTS
  // ============================================

  /** Router link destination */
  routerLink = input<string | string[] | null>(null);

  /** Query parameters for router link */
  queryParams = input<Record<string, string> | null>(null);

  // ============================================
  // ACCESSIBILITY INPUTS
  // ============================================

  /** ARIA expanded state */
  ariaExpanded = input<boolean | null>(null);

  /** ARIA pressed state */
  ariaPressed = input<boolean | null>(null);

  /** ARIA haspopup */
  ariaHasPopup = input<"menu" | "listbox" | "dialog" | "grid" | "tree" | null>(
    null,
  );

  // ============================================
  // OUTPUTS
  // ============================================

  /** Emits when button is clicked (does NOT fire when disabled or loading) */
  clicked = output<MouseEvent>();

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /** Combined disabled state */
  isDisabled = computed(() => this.disabled() || this.loading());

  /** Tooltip text (uses ariaLabel as fallback) */
  tooltipText = computed(() => this.tooltip() || this.ariaLabel());

  /** Icon CSS classes */
  iconClasses = computed(() => {
    const iconValue = this.icon();
    if (iconValue.startsWith("pi-")) {
      return `pi ${iconValue}`;
    }
    return `pi pi-${iconValue}`;
  });

  /** Button CSS classes */
  buttonClasses = computed(() => {
    const classes = ["icon-btn", `icon-btn-${this.variant()}`];

    if (this.size() !== "md") {
      classes.push(`icon-btn-${this.size()}`);
    }

    if (this.loading()) {
      classes.push("btn-loading");
    }

    return classes.join(" ");
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================

  onClick(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.clicked.emit(event);
    }
  }

  onLinkClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.clicked.emit(event);
    }
  }
}
