/**
 * Skip to Content Component
 *
 * WCAG 2.4.1 Bypass Blocks (Level A)
 *
 * Provides a keyboard-accessible link to skip repetitive navigation
 * and jump directly to main content. Hidden off-screen by default,
 * slides in with a premium animation when focused via Tab key.
 *
 * Usage:
 * Add at the very top of app.component.ts template:
 * <app-skip-to-content />
 */

import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-skip-to-content",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <a href="#main-content" class="skip-link" (click)="skipToMain($event)">
      <span class="skip-link__icon" aria-hidden="true">⏭</span>
      <span class="skip-link__text">Skip to main content</span>
      <span class="skip-link__hint">Press Enter</span>
    </a>
  `,
  styleUrl: "./skip-to-content.component.scss",
})
export class SkipToContentComponent {
  skipToMain(event: Event): void {
    event.preventDefault();
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      // Ensure main content is focusable
      if (!mainContent.hasAttribute("tabindex")) {
        mainContent.setAttribute("tabindex", "-1");
      }
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
