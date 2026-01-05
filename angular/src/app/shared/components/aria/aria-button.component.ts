/**
 * Angular Aria Button Component
 *
 * Headless, accessibility-first button using @angular/aria.
 * Provides all ARIA attributes and keyboard handling without styling.
 *
 * Features:
 * - Full keyboard support (Enter, Space)
 * - ARIA role and state management
 * - Loading state with aria-busy
 * - Disabled state handling
 * - Focus management
 *
 * @version 1.0.0 - Angular 21 Aria
 */

import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

@Component({
  selector: "aria-button",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="isDisabled()"
      [attr.aria-disabled]="isDisabled()"
      [attr.aria-busy]="loading()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-expanded]="ariaExpanded()"
      [attr.aria-pressed]="ariaPressed()"
      [attr.aria-haspopup]="ariaHasPopup()"
      [class]="buttonClasses()"
      (click)="handleClick($event)"
      (keydown)="handleKeydown($event)"
    >
      @if (loading()) {
        <span class="aria-button-spinner" aria-hidden="true">
          <svg
            class="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
              opacity="0.25"
            />
            <path
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span class="sr-only">Loading...</span>
      }
      <ng-content />
    </button>
  `,
  styleUrl: "./aria-button.component.scss",
})
export class AriaButtonComponent {
  private elementRef = inject(ElementRef);

  // Inputs
  type = input<"button" | "submit" | "reset">("button");
  variant = input<ButtonVariant>("primary");
  size = input<ButtonSize>("md");
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  // ARIA inputs
  ariaLabel = input<string | null>(null);
  ariaDescribedBy = input<string | null>(null);
  ariaExpanded = input<boolean | null>(null);
  ariaPressed = input<boolean | null>(null);
  ariaHasPopup = input<"menu" | "listbox" | "dialog" | "grid" | "tree" | null>(
    null,
  );

  // Outputs
  clicked = output<MouseEvent>();
  keyPressed = output<KeyboardEvent>();

  // Computed
  isDisabled = computed(() => this.disabled() || this.loading());

  buttonClasses = computed(() => {
    const classes = ["aria-button"];
    classes.push(`variant-${this.variant()}`);
    classes.push(`size-${this.size()}`);
    if (this.loading()) classes.push("is-loading");
    return classes.join(" ");
  });

  handleClick(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.clicked.emit(event);
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    // Handle Enter and Space for button activation
    if (event.key === "Enter" || event.key === " ") {
      if (!this.isDisabled()) {
        event.preventDefault();
        this.keyPressed.emit(event);
        // Trigger click for consistency
        this.elementRef.nativeElement.querySelector("button")?.click();
      }
    }
  }

  /** Programmatically focus the button */
  focus(): void {
    this.elementRef.nativeElement.querySelector("button")?.focus();
  }
}
