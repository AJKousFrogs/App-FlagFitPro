import { CommonModule } from "@angular/common";
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, RippleModule, TooltipModule],
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
        [pTooltip]="tooltipText()"
        [tooltipPosition]="tooltipPosition()"
        (click)="onLinkClick($event)"
        pRipple
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
        pRipple
      >
        <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
      </button>
    }

    <!-- Shared button content template -->
    <ng-template #buttonContent>
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="spinner-svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
          </svg>
        </span>
      } @else {
        <i [class]="iconClasses()" aria-hidden="true"></i>
      }
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    /* ================================
       BASE ICON BUTTON - GREEN BG, WHITE TEXT, RAISED
       ================================ */

    .icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: var(--radius-lg, 8px);
      cursor: pointer;
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      text-decoration: none;

      /* DEFAULT: Green background, white icon, raised shadow */
      background-color: var(--ds-primary-green, #228b22);
      color: #ffffff;
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.1);

      transition:
        transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
        background-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
      will-change: transform, box-shadow;

      /* Default size (md) - 44px touch target */
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      padding: 0;
    }

    /* Hover state - elevated */
    @media (hover: hover) and (pointer: fine) {
      .icon-btn:hover:not(:disabled):not(.btn-disabled) {
        background-color: var(--ds-primary-green-hover, #1e7b1e);
        transform: translateY(-2px);
        box-shadow:
          0 8px 20px rgba(34, 139, 34, 0.4),
          0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }

    /* Active/pressed state */
    .icon-btn:active:not(:disabled):not(.btn-disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .icon-btn:focus-visible {
      outline: 3px solid rgba(34, 139, 34, 0.5);
      outline-offset: 2px;
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.15),
        0 0 0 4px rgba(34, 139, 34, 0.25);
    }

    .icon-btn:focus:not(:focus-visible) {
      outline: none;
    }

    .icon-btn:disabled,
    .icon-btn.btn-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* ================================
       SIZES
       ================================ */

    .icon-btn-sm {
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      border-radius: var(--radius-md, 6px);
    }

    .icon-btn-sm i {
      font-size: var(--font-body-sm, 14px);
    }

    .icon-btn-sm .spinner-svg {
      width: 1rem;
      height: 1rem;
    }

    .icon-btn-lg {
      width: 52px;
      height: 52px;
      min-width: 52px;
      min-height: 52px;
      border-radius: var(--radius-xl, 12px);
    }

    .icon-btn-lg i {
      font-size: var(--font-heading-sm, 20px);
    }

    .icon-btn-lg .spinner-svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    /* ================================
       SOLID VARIANTS: GREEN BG, WHITE TEXT, RAISED
       ================================ */

    .icon-btn-primary,
    .icon-btn-secondary,
    .icon-btn-outlined,
    .icon-btn-success {
      background-color: var(--ds-primary-green, #228b22);
      color: #ffffff;
    }

    @media (hover: hover) and (pointer: fine) {
      .icon-btn-primary:hover:not(:disabled):not(.btn-disabled),
      .icon-btn-secondary:hover:not(:disabled):not(.btn-disabled),
      .icon-btn-outlined:hover:not(:disabled):not(.btn-disabled),
      .icon-btn-success:hover:not(:disabled):not(.btn-disabled) {
        background-color: var(--ds-primary-green-hover, #1e7b1e);
      }
    }

    /* TEXT VARIANT: Subtle style (green icon, transparent background) */
    .icon-btn-text {
      background-color: transparent;
      color: var(--ds-primary-green, #228b22);
      box-shadow: none;
    }

    @media (hover: hover) and (pointer: fine) {
      .icon-btn-text:hover:not(:disabled):not(.btn-disabled) {
        background-color: rgba(34, 139, 34, 0.08);
        color: var(--ds-primary-green-hover, #1e7b1e);
        transform: none;
        box-shadow: none;
      }
    }

    .icon-btn-text:active:not(:disabled):not(.btn-disabled) {
      background-color: rgba(34, 139, 34, 0.12);
      transform: none;
      box-shadow: none;
    }

    .icon-btn-text:focus-visible {
      box-shadow: 0 0 0 3px rgba(34, 139, 34, 0.25);
    }

    /* Danger - Keep red for danger actions (important UX distinction) */
    .icon-btn-danger {
      background-color: var(--color-status-error, #dc2626);
      color: #ffffff;
    }

    @media (hover: hover) and (pointer: fine) {
      .icon-btn-danger:hover:not(:disabled):not(.btn-disabled) {
        background-color: var(--primitive-error-600, #b91c1c);
        transform: translateY(-2px);
        box-shadow:
          0 8px 20px rgba(220, 38, 38, 0.4),
          0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }

    .icon-btn-danger:focus-visible {
      outline-color: var(--color-status-error, #dc2626);
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.15),
        0 0 0 4px rgba(220, 38, 38, 0.25);
    }

    /* ================================
       ICON
       ================================ */

    .icon-btn i {
      font-size: var(--font-body-lg);
      line-height: 1;
    }

    /* ================================
       SPINNER
       ================================ */

    .btn-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-svg {
      width: 1.25rem;
      height: 1.25rem;
      animation: spinner-rotate 0.8s linear infinite;
    }

    .spinner-svg circle {
      stroke: currentColor;
      stroke-dasharray: 60;
      stroke-dashoffset: 45;
      stroke-linecap: round;
    }

    @keyframes spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }

    /* ================================
       TOUCH DEVICE OPTIMIZATIONS
       ================================ */

    @media (hover: none) and (pointer: coarse) {
      .icon-btn:active:not(:disabled):not(.btn-disabled) {
        transform: scale(0.95);
      }
    }

    /* ================================
       REDUCED MOTION
       ================================ */

    @media (prefers-reduced-motion: reduce) {
      .icon-btn {
        transition: none;
      }

      .spinner-svg {
        animation: none;
      }

      .icon-btn:hover,
      .icon-btn:active {
        transform: none;
      }
    }
  `],
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
  ariaHasPopup = input<"menu" | "listbox" | "dialog" | "grid" | "tree" | null>(null);

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
