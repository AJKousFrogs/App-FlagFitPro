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
  styles: [
    `
      .skip-link {
        /* Hidden off-screen by default */
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        z-index: 99999;

        /* Premium pill design matching FlagFit buttons */
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.5rem;
        border-radius: 0 0 9999px 9999px;

        /* Brand gradient background */
        background: linear-gradient(180deg, #0ab85a 0%, #089949 100%);
        border: 2px solid #089949;
        border-top: none;
        box-shadow:
          0 4px 20px rgba(8, 153, 73, 0.35),
          0 8px 32px rgba(0, 0, 0, 0.15);

        /* Typography */
        color: #ffffff;
        font-family: var(
          --font-family-sans,
          "Poppins",
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Roboto,
          sans-serif
        );
        font-size: 0.9375rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        text-decoration: none;
        white-space: nowrap;

        /* Smooth slide-in animation */
        transition:
          transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.2s ease,
          background 0.2s ease;

        /* Remove default outline, we'll add a custom one */
        outline: none;
      }

      /* Visible state when focused */
      .skip-link:focus,
      .skip-link:focus-visible {
        transform: translateX(-50%) translateY(0);
        box-shadow:
          0 8px 32px rgba(8, 153, 73, 0.4),
          0 12px 48px rgba(0, 0, 0, 0.2),
          0 0 0 3px rgba(241, 196, 15, 0.5); /* Yellow focus ring */
      }

      /* Hover state (while focused) */
      .skip-link:hover {
        background: linear-gradient(180deg, #089949 0%, #067a3a 100%);
        box-shadow:
          0 10px 40px rgba(8, 153, 73, 0.5),
          0 16px 56px rgba(0, 0, 0, 0.25),
          0 0 0 3px rgba(241, 196, 15, 0.6);
      }

      /* Active/pressed state */
      .skip-link:active {
        transform: translateX(-50%) translateY(2px);
        transition-duration: 0.1s;
      }

      /* Icon styling */
      .skip-link__icon {
        font-size: 1.125rem;
        line-height: 1;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
      }

      /* Main text */
      .skip-link__text {
        color: #ffffff;
      }

      /* Keyboard hint badge */
      .skip-link__hint {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Dark mode adjustments */
      :host-context([data-theme="dark"]) .skip-link,
      :host-context(.dark) .skip-link {
        box-shadow:
          0 4px 20px rgba(10, 184, 90, 0.3),
          0 8px 32px rgba(0, 0, 0, 0.4);
      }

      :host-context([data-theme="dark"]) .skip-link:focus,
      :host-context(.dark) .skip-link:focus {
        box-shadow:
          0 8px 32px rgba(10, 184, 90, 0.4),
          0 12px 48px rgba(0, 0, 0, 0.5),
          0 0 0 3px rgba(241, 196, 15, 0.6);
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .skip-link {
          transition: none;
        }

        .skip-link:focus {
          transform: translateX(-50%) translateY(0);
        }
      }

      /* Mobile adjustments */
      @media (max-width: 480px) {
        .skip-link {
          padding: 0.75rem 1rem;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .skip-link__hint {
          display: none; /* Hide hint on mobile - less relevant for touch */
        }
      }
    `,
  ],
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
