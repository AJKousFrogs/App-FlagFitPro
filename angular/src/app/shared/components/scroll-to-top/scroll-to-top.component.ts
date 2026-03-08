/**
 * Scroll To Top Button Component
 *
 * Floating action button that appears when user scrolls down
 * Smoothly scrolls back to top when clicked
 *
 * UX Audit Fix #10: Add scroll-to-top button for long pages
 */

import {
  afterNextRender,
  Component,
  signal,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "app-scroll-to-top",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip],
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
export class ScrollToTopComponent implements OnDestroy {
  isVisible = signal(false);
  private scrollContainer: HTMLElement | Window | null = null;
  private readonly onScroll = () => this.updateVisibility();

  constructor() {
    afterNextRender(() => {
      if (typeof window === "undefined") return;
      this.scrollContainer =
        document.querySelector<HTMLElement>(".app-main") ?? window;
      this.scrollContainer.addEventListener("scroll", this.onScroll, {
        passive: true,
      });
      this.updateVisibility();
    });
  }

  ngOnDestroy(): void {
    if (typeof window === "undefined" || !this.scrollContainer) return;
    this.scrollContainer.removeEventListener("scroll", this.onScroll);
  }

  scrollToTop(): void {
    const container = this.scrollContainer;
    if (!container) return;

    if (container instanceof Window) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    container.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  private updateVisibility(): void {
    if (typeof window === "undefined" || !this.scrollContainer) return;

    const scrollPosition = this.scrollContainer instanceof Window
      ? window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      : this.scrollContainer.scrollTop;

    this.isVisible.set(scrollPosition > 300);
  }
}
