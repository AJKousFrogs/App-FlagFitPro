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
import {
  getScrollTop,
  resolveScrollContainer,
  ScrollContainer,
} from "../../../core/utils/scroll-container";

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
  private scrollContainer: ScrollContainer | null = null;
  private readonly onScroll = () => this.updateVisibility();

  constructor() {
    afterNextRender(() => {
      if (typeof window === "undefined") return;
      this.scrollContainer = resolveScrollContainer();
      if (!this.scrollContainer) return;
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
    this.isVisible.set(getScrollTop(this.scrollContainer) > 300);
  }
}
