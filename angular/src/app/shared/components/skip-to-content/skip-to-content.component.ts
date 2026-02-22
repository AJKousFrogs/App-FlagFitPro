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

import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-skip-to-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
  `,
  styleUrl: "./skip-to-content.component.scss",
})
export class SkipToContentComponent {}
