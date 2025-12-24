/**
 * Skip to Content Component
 * 
 * WCAG 2.4.1 Bypass Blocks (Level A)
 * 
 * Provides a keyboard-accessible link to skip repetitive navigation
 * and jump directly to main content. Visible only when focused.
 * 
 * Usage:
 * Add at the very top of app.component.ts template:
 * <app-skip-to-content />
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skip-to-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <a 
      href="#main-content" 
      class="skip-to-content"
      (click)="skipToMain($event)"
    >
      Skip to main content
    </a>
  `,
  styles: [`
    .skip-to-content {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--color-brand-primary);
      color: white;
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      z-index: 10000;
      border-radius: 0 0 var(--p-border-radius) 0;
      transition: top 0.2s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .skip-to-content:focus {
      top: 0;
      outline: 3px solid var(--p-warning-color);
      outline-offset: 2px;
    }

    .skip-to-content:hover {
      background: var(--color-brand-primary-hover);
    }
  `]
})
export class SkipToContentComponent {
  skipToMain(event: Event): void {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

