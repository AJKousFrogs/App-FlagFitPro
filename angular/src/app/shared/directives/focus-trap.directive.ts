/**
 * Focus Trap Directive
 * 
 * WCAG 2.1.2 No Keyboard Trap (Level A)
 * 
 * Traps focus within an element (modal, drawer, dialog)
 * and cycles through focusable elements. Press Escape to release.
 * 
 * Usage:
 * <div appFocusTrap [isActive]="isOpen">
 *   <!-- Modal content -->
 * </div>
 */

import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements OnChanges, OnDestroy {
  @Input() isActive = false;
  @Input() returnFocusOnDeactivate = true;

  private previouslyFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  // Selector for all focusable elements
  private readonly FOCUSABLE_SELECTOR = `
    a[href],
    button:not([disabled]),
    textarea:not([disabled]),
    input:not([disabled]),
    select:not([disabled]),
    [tabindex]:not([tabindex="-1"])
  `;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isActive']) {
      if (this.isActive) {
        this.activate();
      } else {
        this.deactivate();
      }
    }
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.isActive) return;

    if (event.key === 'Tab') {
      this.handleTabKey(event);
    } else if (event.key === 'Escape') {
      this.handleEscapeKey(event);
    }
  }

  private activate(): void {
    // Store currently focused element to restore later
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Get all focusable elements within the trapped container
    this.updateFocusableElements();

    // Focus the first element
    if (this.focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.focusableElements[0]?.focus();
      }, 100);
    }
  }

  private deactivate(): void {
    // Return focus to previously focused element
    if (this.returnFocusOnDeactivate && this.previouslyFocusedElement) {
      setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0);
    }
    this.previouslyFocusedElement = null;
  }

  private updateFocusableElements(): void {
    const elements = this.el.nativeElement.querySelectorAll(
      this.FOCUSABLE_SELECTOR
    );
    this.focusableElements = Array.from(elements) as HTMLElement[];
  }

  private handleTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: Move backward
      if (currentElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: Move forward
      if (currentElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    // Allow parent to handle escape (e.g., close modal)
    // This directive just manages focus cycling
  }
}

