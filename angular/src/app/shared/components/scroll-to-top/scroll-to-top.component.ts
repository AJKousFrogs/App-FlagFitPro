/**
 * Scroll To Top Button Component
 *
 * Floating action button that appears when user scrolls down
 * Smoothly scrolls back to top when clicked
 *
 * UX Audit Fix #10: Add scroll-to-top button for long pages
 */

import {
  Component,
  HostListener,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "app-scroll-to-top",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (isVisible()) {
      <button
        class="scroll-to-top-btn"
        (click)="scrollToTop()"
        pTooltip="Back to top"
        tooltipPosition="left"
        [showDelay]="500"
        aria-label="Scroll to top"
      >
        <i class="pi pi-arrow-up"></i>
      </button>
    }
  `,
  styleUrl: "./scroll-to-top.component.scss",
})
export class ScrollToTopComponent {
  isVisible = signal(false);

  @HostListener("window:scroll")
  onWindowScroll(): void {
    // Show button after scrolling down 300px
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    this.isVisible.set(scrollPosition > 300);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}
