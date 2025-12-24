/**
 * Loading State Directive
 * 
 * WCAG 4.1.3 Status Messages (Level AA)
 * 
 * Announces loading states to screen readers using aria-busy
 * and aria-live regions.
 * 
 * Usage:
 * <div appLoadingState [isLoading]="isLoading" loadingMessage="Loading data">
 *   <!-- Content -->
 * </div>
 */

import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appLoadingState]',
  standalone: true,
})
export class LoadingStateDirective implements OnChanges {
  @Input() isLoading = false;
  @Input() loadingMessage = 'Loading';
  @Input() completeMessage = 'Loading complete';

  private liveRegion: HTMLElement | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading']) {
      if (this.isLoading) {
        this.setLoadingState();
      } else {
        this.setCompleteState();
      }
    }
  }

  private setLoadingState(): void {
    // Set aria-busy attribute
    this.renderer.setAttribute(this.el.nativeElement, 'aria-busy', 'true');

    // Announce loading to screen readers
    this.announce(this.loadingMessage);
  }

  private setCompleteState(): void {
    // Remove aria-busy attribute
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-busy');

    // Announce completion to screen readers
    this.announce(this.completeMessage);
  }

  private announce(message: string): void {
    // Create or update live region
    if (!this.liveRegion) {
      this.liveRegion = this.renderer.createElement('div');
      this.renderer.setAttribute(this.liveRegion, 'role', 'status');
      this.renderer.setAttribute(this.liveRegion, 'aria-live', 'polite');
      this.renderer.setAttribute(this.liveRegion, 'aria-atomic', 'true');
      this.renderer.addClass(this.liveRegion, 'sr-only');
      this.renderer.appendChild(document.body, this.liveRegion);
    }

    // Update message
    this.renderer.setProperty(this.liveRegion, 'textContent', message);

    // Clear message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.renderer.setProperty(this.liveRegion, 'textContent', '');
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    // Clean up live region
    if (this.liveRegion) {
      this.renderer.removeChild(document.body, this.liveRegion);
      this.liveRegion = null;
    }
  }
}

