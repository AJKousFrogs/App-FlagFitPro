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
    // Check if already created
    const existingPolite = this.document.getElementById("sr-announcer-polite");
    const existingAssertive = this.document.getElementById(
      "sr-announcer-assertive",
    );

    if (existingPolite && existingAssertive) {
      this.liveElement = existingPolite;
      this.assertiveElement = existingAssertive;
      return;
    }

    // Create polite live region
    this.liveElement = this.document.createElement("div");
    this.liveElement.id = "sr-announcer-polite";
    this.liveElement.setAttribute("role", "status");
    this.liveElement.setAttribute("aria-live", "polite");
    this.liveElement.setAttribute("aria-atomic", "true");
    this.applyHiddenStyles(this.liveElement);

    // Create assertive live region
    this.assertiveElement = this.document.createElement("div");
    this.assertiveElement.id = "sr-announcer-assertive";
    this.assertiveElement.setAttribute("role", "alert");
    this.assertiveElement.setAttribute("aria-live", "assertive");
    this.assertiveElement.setAttribute("aria-atomic", "true");
    this.applyHiddenStyles(this.assertiveElement);

    // Append to body
    this.document.body.appendChild(this.liveElement);
    this.document.body.appendChild(this.assertiveElement);
  }

  /**
   * Apply visually hidden styles (visible to screen readers)
   */
  private applyHiddenStyles(element: HTMLElement): void {
    element.style.position = "absolute";
    element.style.width = "1px";
    element.style.height = "1px";
    element.style.padding = "0";
    element.style.margin = "-1px";
    element.style.overflow = "hidden";
    element.style.clip = "rect(0, 0, 0, 0)";
    element.style.whiteSpace = "nowrap";
    element.style.border = "0";
  }
}
