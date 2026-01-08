import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  booleanAttribute,
  HostBinding,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";

/**
 * Button Component - Unified Design System Button
 *
 * THE SINGLE STANDARD BUTTON FOR THE ENTIRE APP.
 * Wraps PrimeNG internally while providing a consistent, controlled API.
 *
 * @example Basic usage
 * ```html
 * <app-button variant="primary" (clicked)="handleClick()">Click Me</app-button>
 * ```
 *
 * @example With icons
 * ```html
 * <app-button variant="primary" iconLeft="pi-check">Save</app-button>
 * <app-button variant="secondary" iconRight="pi-arrow-right">Continue</app-button>
 * ```
 *
 * @example Loading state
 * ```html
 * <app-button [loading]="isLoading" (clicked)="submit()">Submit</app-button>
 * ```
 *
 * @example Form submit
 * ```html
 * <app-button type="submit" variant="primary" [loading]="isSubmitting">Submit Form</app-button>
 * ```
 *
 * @example Full width
 * ```html
 * <app-button [fullWidth]="true" variant="primary">Full Width Button</app-button>
 * ```
 *
 * @example With routerLink
 * ```html
 * <app-button routerLink="/dashboard" variant="text">Go to Dashboard</app-button>
 * ```
 *
 * @version 2.0.0 - Unified Design System
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "text"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

@Component({
  selector: "app-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
  ],
  template: `
    <!-- Link version (when routerLink is provided) -->
    @if (routerLink()) {
      <a
        [routerLink]="routerLink()"
        [queryParams]="queryParams()"
        [fragment]="fragment()"
        [class]="buttonClasses()"
        [class.btn-disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel() || undefined"
        [attr.aria-disabled]="isDisabled() || undefined"
        [attr.data-testid]="testId() || undefined"
        [pTooltip]="tooltip()"
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
        [attr.aria-label]="computedAriaLabel()"
        [attr.aria-busy]="loading() || undefined"
        [attr.aria-disabled]="isDisabled() || undefined"
        [attr.aria-expanded]="ariaExpanded()"
        [attr.aria-pressed]="ariaPressed()"
        [attr.aria-haspopup]="ariaHasPopup()"
        [attr.data-testid]="testId() || undefined"
        [pTooltip]="tooltip()"
        [tooltipPosition]="tooltipPosition()"
        (click)="onClick($event)"
        pRipple
      >
        <ng-container *ngTemplateOutlet="buttonContent"></ng-container>
      </button>
    }

    <!-- Shared button content template -->
    <ng-template #buttonContent>
      <!-- Loading spinner -->
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="spinner-svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
          </svg>
        </span>
      }

      <!-- Left icon -->
      @if (iconLeft() && !loading()) {
        <i
          [class]="'btn-icon pi ' + normalizeIcon(iconLeft())"
          aria-hidden="true"
        ></i>
      }

      <!-- Button content -->
      @if (!iconOnly()) {
        <span
          class="btn-content"
          [class.btn-content-loading]="loading()"
          [class.visually-hidden]="loading() && !showLabelOnLoading()"
        >
          <ng-content></ng-content>
        </span>
      }

      <!-- Right icon -->
      @if (iconRight() && !loading()) {
        <i
          [class]="'btn-icon pi ' + normalizeIcon(iconRight())"
          aria-hidden="true"
        ></i>
      }
    </ng-template>
  `,
  styleUrl: "./button.component.scss",
})
export class ButtonComponent {
  // ============================================
  // REQUIRED INPUTS
  // ============================================

  /** Visual style variant of the button */
  variant = input<ButtonVariant>("primary");

  /** Size of the button */
  size = input<ButtonSize>("md");

  // ============================================
  // OPTIONAL INPUTS
  // ============================================

  /** Icon displayed on the left side (PrimeIcons class, e.g., 'pi-check') */
  iconLeft = input<string>("");

  /** Icon displayed on the right side (PrimeIcons class, e.g., 'pi-arrow-right') */
  iconRight = input<string>("");

  /** Shows loading spinner and disables interaction */
  loading = input(false, { transform: booleanAttribute });

  /** Disables the button */
  disabled = input(false, { transform: booleanAttribute });

  /** Makes the button full width of its container */
  fullWidth = input(false, { transform: booleanAttribute });

  /** HTML button type attribute */
  type = input<"button" | "submit" | "reset">("button");

  /** Accessibility label (required for icon-only buttons) */
  ariaLabel = input<string>("");

  // ============================================
  // ROUTING INPUTS
  // ============================================

  /** Router link destination */
  routerLink = input<string | string[] | null>(null);

  /** Query parameters for router link */
  queryParams = input<Record<string, string> | null>(null);

  /** Fragment for router link */
  fragment = input<string>("");

  // ============================================
  // ACCESSIBILITY INPUTS
  // ============================================

  /** ARIA expanded state for expandable controls */
  ariaExpanded = input<boolean | null>(null);

  /** ARIA pressed state for toggle buttons */
  ariaPressed = input<boolean | null>(null);

  /** ARIA haspopup for popup triggers */
  ariaHasPopup = input<"menu" | "listbox" | "dialog" | "grid" | "tree" | null>(
    null,
  );

  // ============================================
  // TOOLTIP INPUTS
  // ============================================

  /** Tooltip text */
  tooltip = input<string>("");

  /** Tooltip position */
  tooltipPosition = input<"top" | "bottom" | "left" | "right">("top");

  // ============================================
  // TESTING INPUTS
  // ============================================

  /** Data attribute for testing */
  testId = input<string>("");

  /** Icon-only mode (no text content) */
  iconOnly = input(false, { transform: booleanAttribute });

  /** Show label text during loading */
  showLabelOnLoading = input(false, { transform: booleanAttribute });

  // ============================================
  // OUTPUTS
  // ============================================

  /** Emits when button is clicked (does NOT fire when disabled or loading) */
  clicked = output<MouseEvent>();

  // ============================================
  // HOST BINDINGS
  // ============================================

  @HostBinding("class.btn-full-width")
  get isFullWidth(): boolean {
    return this.fullWidth();
  }

  @HostBinding("style.display")
  get hostDisplay(): string {
    return this.fullWidth() ? "block" : "inline-block";
  }

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /** Combined disabled state */
  isDisabled = computed(() => this.disabled() || this.loading());

  /** Computed ARIA label for accessibility */
  computedAriaLabel = computed(() => {
    if (this.ariaLabel()) {
      return this.ariaLabel();
    }
    // Icon-only buttons must have an aria-label
    if (this.iconOnly()) {
      // Development warning only - will be stripped in production
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn(
          "[app-button] Icon-only buttons require an ariaLabel for accessibility.",
        );
      }
    }
    return undefined;
  });

  /** Computed CSS classes for the button */
  buttonClasses = computed(() => {
    const classes = ["btn", `btn-${this.variant()}`];

    // Size
    if (this.size() !== "md") {
      classes.push(`btn-${this.size()}`);
    }

    // Icon-only
    if (this.iconOnly()) {
      classes.push("btn-icon-only");
    }

    // Full width
    if (this.fullWidth()) {
      classes.push("btn-full-width");
    }

    // Loading state
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

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Normalizes icon class names
   * Handles both 'pi-check' and 'check' formats
   */
  normalizeIcon(iconClass: string): string {
    if (!iconClass) return "";
    // If it already starts with 'pi-', return as-is
    if (iconClass.startsWith("pi-")) {
      return iconClass;
    }
    // Otherwise, prepend 'pi-'
    return `pi-${iconClass}`;
  }
}
