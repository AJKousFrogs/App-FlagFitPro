/**
 * Screen Reader Announcer Service
 *
 * Provides a centralized way to announce messages to screen reader users.
 * Uses ARIA live regions to communicate dynamic content changes.
 *
 * @example
 * // In a component
 * private announcer = inject(ScreenReaderAnnouncerService);
 *
 * onSave() {
 *   this.announcer.announce('Changes saved successfully');
 * }
 *
 * onError() {
 *   this.announcer.announce('Error: Failed to save', 'assertive');
 * }
 */

import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser, DOCUMENT } from "@angular/common";

export type AnnouncePoliteness = "polite" | "assertive" | "off";

@Injectable({
  providedIn: "root",
})
export class ScreenReaderAnnouncerService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private liveElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.createLiveRegions();
    }
  }

  /**
   * Announce a message to screen reader users
   *
   * @param message - The message to announce
   * @param politeness - 'polite' (default, waits for current speech) or 'assertive' (interrupts)
   * @param duration - How long to keep the message visible (for cleanup)
   */
  announce(
    message: string,
    politeness: AnnouncePoliteness = "polite",
    duration: number = 1000,
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const element =
      politeness === "assertive" ? this.assertiveElement : this.liveElement;

    if (!element) {
      return;
    }

    // Clear previous content first (helps with repeated messages)
    element.textContent = "";

    // Use setTimeout to ensure the DOM update is processed
    setTimeout(() => {
      element.textContent = message;
    }, 100);

    // Clear after duration
    setTimeout(() => {
      if (element.textContent === message) {
        element.textContent = "";
      }
    }, duration + 100);
  }

  /**
   * Announce a polite message (doesn't interrupt current speech)
   */
  announcePolite(message: string, duration?: number): void {
    this.announce(message, "polite", duration);
  }

  /**
   * Announce an assertive message (interrupts current speech)
   * Use sparingly - only for critical updates like errors
   */
  announceAssertive(message: string, duration?: number): void {
    this.announce(message, "assertive", duration);
  }

  /**
   * Announce a form error
   */
  announceError(fieldName: string, errorMessage: string): void {
    this.announce(`Error in ${fieldName}: ${errorMessage}`, "assertive");
  }

  /**
   * Announce a loading state
   */
  announceLoading(itemName?: string): void {
    const message = itemName ? `Loading ${itemName}...` : "Loading...";
    this.announce(message, "polite");
  }

  /**
   * Announce loading complete
   */
  announceLoadingComplete(itemName?: string): void {
    const message = itemName ? `${itemName} loaded` : "Content loaded";
    this.announce(message, "polite");
  }

  /**
   * Announce a navigation change
   */
  announceNavigation(pageName: string): void {
    this.announce(`Navigated to ${pageName}`, "polite");
  }

  /**
   * Announce a success message
   */
  announceSuccess(message: string): void {
    this.announce(message, "polite");
  }

  /**
   * Create the live region elements in the DOM
   */
  private createLiveRegions(): void {
    let polite = this.document.getElementById(
      "sr-announcer-polite",
    ) as HTMLElement | null;
    let assertive = this.document.getElementById(
      "sr-announcer-assertive",
    ) as HTMLElement | null;

    // Reuse or create each region independently so we never duplicate IDs when
    // only one element already exists (e.g. partial DOM state or HMR).
    if (!polite) {
      polite = this.document.createElement("div");
      polite.id = "sr-announcer-polite";
      polite.setAttribute("role", "status");
      polite.setAttribute("aria-live", "polite");
      polite.setAttribute("aria-atomic", "true");
      this.applyHiddenStyles(polite);
      this.document.body.appendChild(polite);
    }
    this.liveElement = polite;

    if (!assertive) {
      assertive = this.document.createElement("div");
      assertive.id = "sr-announcer-assertive";
      assertive.setAttribute("role", "alert");
      assertive.setAttribute("aria-live", "assertive");
      assertive.setAttribute("aria-atomic", "true");
      this.applyHiddenStyles(assertive);
      this.document.body.appendChild(assertive);
    }
    this.assertiveElement = assertive;
  }

  /**
   * Apply visually hidden styles (visible to screen readers)
   */
  private applyHiddenStyles(element: HTMLElement): void {
    element.style.position = "absolute";
    element.style.width = "var(--border-1)";
    element.style.height = "var(--border-1)";
    element.style.padding = "0";
    element.style.margin = "calc(var(--border-1) * -1)";
    element.style.overflow = "hidden";
    element.style.clip = "rect(0, 0, 0, 0)";
    element.style.whiteSpace = "nowrap";
    element.style.border = "0";
  }
}
