/**
 * Form Error Service
 *
 * Helper service for form error handling:
 * - Scroll to field with error
 * - Focus on field
 * - Announce error to screen readers
 *
 * Evidence-Based: WCAG 2.1 Success Criterion 3.3.1, 3.3.3
 */

import { inject, Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class FormErrorService {
  private logger = inject(LoggerService);
  /**
   * Scroll to a form field and focus it
   *
   * @param fieldId - Form control name or element ID
   * @param options - Scroll behavior options
   */
  scrollToField(
    fieldId: string,
    options: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition } = {},
  ): void {
    const { behavior = "smooth", block = "center" } = options;

    // Try multiple selectors to find the field
    const selectors = [
      `#${fieldId}`,
      `[name="${fieldId}"]`,
      `[formcontrolname="${fieldId}"]`,
      `[ng-reflect-name="${fieldId}"]`,
    ];

    let element: HTMLElement | null = null;

    for (const selector of selectors) {
      element = document.querySelector(selector) as HTMLElement;
      if (element) break;
    }

    if (!element) {
      this.logger.warn(`[FormErrorService] Could not find field: ${fieldId}`);
      return;
    }

    // Scroll to element
    element.scrollIntoView({ behavior, block });

    // Focus the element (with delay to ensure scroll completes)
    setTimeout(() => {
      if (element) {
        element.focus();

        // For elements that can't be focused directly (like divs),
        // try to focus the first input inside
        if (document.activeElement !== element) {
          const focusableElement = element.querySelector<HTMLElement>(
            'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
          );
          focusableElement?.focus();
        }
      }
    }, 300);
  }

  /**
   * Announce message to screen readers
   *
   * @param message - Message to announce
   * @param priority - 'polite' or 'assertive'
   */
  announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite",
  ): void {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.setAttribute("class", "sr-only");
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}
