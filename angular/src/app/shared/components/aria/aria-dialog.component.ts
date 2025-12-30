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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
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
  styles: [
    `
      .aria-dialog-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .aria-dialog-backdrop.visible {
        opacity: 1;
      }

      .aria-dialog {
        position: relative;
        background: var(--p-surface-0, white);
        border-radius: var(--p-border-radius-lg, 0.75rem);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: dialogEnter 0.2s ease;
      }

      @keyframes dialogEnter {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* Size variants */
      .size-sm {
        width: 100%;
        max-width: 400px;
      }

      .size-md {
        width: 100%;
        max-width: 560px;
      }

      .size-lg {
        width: 100%;
        max-width: 800px;
      }

      .size-full {
        width: 95vw;
        height: 90vh;
      }

      .aria-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
      }

      .aria-dialog-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-text-color, #1f2937);
      }

      .aria-dialog-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: none;
        border-radius: var(--p-border-radius, 0.5rem);
        background: transparent;
        color: var(--p-text-secondary, #6b7280);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .aria-dialog-close:hover {
        background: var(--p-surface-100, #f3f4f6);
        color: var(--p-text-color, #1f2937);
      }

      .aria-dialog-close:focus-visible {
        outline: 2px solid var(--p-primary-color, #089949);
        outline-offset: 2px;
      }

      .aria-dialog-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }

      .aria-dialog-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--p-surface-200, #e5e7eb);
      }

      .aria-dialog-footer:empty {
        display: none;
      }

      @media (max-width: 640px) {
        .aria-dialog {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
        }
      }
    `,
  ],
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

    // Focus dialog after render
    afterNextRender(
      () => {
        const dialog = this.elementRef.nativeElement.querySelector(
          "[role='dialog']"
        );
        dialog?.focus();
      },
      { injector: this.injector }
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
    const dialog = this.elementRef.nativeElement.querySelector(
      "[role='dialog']"
    );
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey && this.document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (
      !event.shiftKey &&
      this.document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement?.focus();
    }
  }
}

