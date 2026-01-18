/**
 * Angular Aria Dialog Component
 *
 * Accessible modal dialog following WAI-ARIA dialog pattern.
 * Provides proper focus management, keyboard navigation, and screen reader support.
 *
 * Features:
 * - Focus trap within dialog
 * - Escape key to close
 * - Click outside to close (optional)
 * - Proper ARIA roles and labels
 * - Return focus on close
 * - Scroll lock on body
 *
 * @version 1.0.0 - Angular 21 Aria
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  afterNextRender,
  Injector,
} from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";

@Component({
  selector: "aria-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="aria-dialog-backdrop"
        [class.visible]="isOpen()"
        (click)="handleBackdropClick($event)"
        (keydown)="handleKeydown($event)"
        role="presentation"
      >
        <div
          #dialogElement
          role="dialog"
          [attr.aria-modal]="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId()"
          class="aria-dialog"
          [class]="dialogClasses()"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="aria-dialog-header">
            <h2 [id]="titleId" class="aria-dialog-title">
              <ng-content select="[slot=title]" />
            </h2>
            @if (showCloseButton()) {
              <button
                type="button"
                class="aria-dialog-close"
                (click)="close()"
                aria-label="Close dialog"
              >
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            }
          </div>

          <!-- Content -->
          <div [id]="descriptionId()" class="aria-dialog-content">
            <ng-content />
          </div>

          <!-- Footer -->
          <div class="aria-dialog-footer">
            <ng-content select="[slot=footer]" />
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: "./aria-dialog.component.scss",
})
export class AriaDialogComponent {
  private elementRef = inject(ElementRef);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);

  // Inputs
  open = input<boolean>(false);
  size = input<"sm" | "md" | "lg" | "full">("md");
  showCloseButton = input<boolean>(true);
  closeOnBackdrop = input<boolean>(true);
  closeOnEscape = input<boolean>(true);
  /** Focus the first focusable element instead of the dialog container */
  focusFirstElement = input<boolean>(true);
  /** Selector for initial focus element (overrides focusFirstElement) */
  initialFocusSelector = input<string | null>(null);

  // ARIA inputs
  descriptionId = input<string | null>(null);

  // Outputs
  closed = output<void>();
  opened = output<void>();

  // Internal state
  isOpen = signal(false);
  private previousActiveElement: Element | null = null;
  readonly titleId = `aria-dialog-title-${Math.random().toString(36).slice(2)}`;

  // Computed
  dialogClasses = computed(() => {
    return `size-${this.size()}`;
  });

  constructor() {
    // Sync open input with internal state
    effect(() => {
      const shouldOpen = this.open();
      if (shouldOpen !== this.isOpen()) {
        if (shouldOpen) {
          this.openDialog();
        } else {
          this.closeDialog();
        }
      }
    });
  }

  private openDialog(): void {
    // Store current focus
    this.previousActiveElement = this.document.activeElement;

    // Lock body scroll
    this.document.body.style.overflow = "hidden";

    this.isOpen.set(true);
    this.opened.emit();

    // Focus appropriate element after render
    afterNextRender(
      () => {
        const dialog =
          this.elementRef.nativeElement.querySelector("[role='dialog']");
        if (!dialog) return;

        // Priority 1: Custom selector
        if (this.initialFocusSelector()) {
          const customFocus = dialog.querySelector(this.initialFocusSelector()!);
          if (customFocus instanceof HTMLElement) {
            customFocus.focus();
            return;
          }
        }

        // Priority 2: First focusable element (recommended for forms)
        if (this.focusFirstElement()) {
          const focusableElements = dialog.querySelectorAll(
            'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
            return;
          }
        }

        // Fallback: Focus dialog container
        dialog.focus();
      },
      { injector: this.injector },
    );
  }

  private closeDialog(): void {
    // Restore body scroll
    this.document.body.style.overflow = "";

    this.isOpen.set(false);
    this.closed.emit();

    // Return focus
    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
  }

  close(): void {
    this.closeDialog();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (
      this.closeOnBackdrop() &&
      (event.target as HTMLElement).classList.contains("aria-dialog-backdrop")
    ) {
      this.close();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.closeOnEscape()) {
      event.preventDefault();
      this.close();
    }

    // Focus trap
    if (event.key === "Tab") {
      this.handleTabKey(event);
    }
  }

  private handleTabKey(event: KeyboardEvent): void {
    const dialog =
      this.elementRef.nativeElement.querySelector("[role='dialog']");
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey && this.document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && this.document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }
}
