import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
} from "@angular/core";
import {
  getScrollTop,
  resolveScrollContainer,
  ScrollContainer,
} from "../../core/utils/scroll-container";

export interface SwipeEvent {
  direction: "left" | "right" | "up" | "down";
  distance: number;
}

@Directive({
  selector: "[appSwipeGesture]",
  host: {
    "(touchstart)": "onTouchStart($event)",
    "(touchmove)": "onTouchMove($event)",
    "(touchend)": "onTouchEnd($event)",
  },
})
export class SwipeGestureDirective implements OnInit, OnDestroy {
  // Angular 21: Using signal inputs for better performance
  swipeThreshold = input<number>(50); // Minimum distance in pixels to trigger swipe
  swipeVelocity = input<number>(0.3); // Minimum velocity for quick swipe
  enablePullToRefresh = input<boolean>(false); // Enable pull-to-refresh on container

  // Angular 21: Using output() for better type safety
  swipeRight = output<SwipeEvent>();
  swipeLeft = output<SwipeEvent>();
  swipeUp = output<SwipeEvent>();
  swipeDown = output<SwipeEvent>();
  pullToRefresh = output<void>();

  private elementRef = inject(ElementRef);
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private touchStartTime = 0;
  private isDragging = false;
  private initialScrollTop = 0;
  private pullDistance = 0;
  private maxPullDistance = 100;
  private scrollContainer: ScrollContainer | null = null;

  ngOnInit(): void {
    // Prevent text selection during swipe
    this.elementRef.nativeElement.style.userSelect = "none";
    this.elementRef.nativeElement.style.touchAction = "pan-y";
    this.scrollContainer = resolveScrollContainer(
      this.elementRef.nativeElement as HTMLElement,
    );
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.isDragging = true;

    // For pull-to-refresh on containers
    if (this.enablePullToRefresh()) {
      this.initialScrollTop = this.getScrollTop();
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.touchStartX;
    const deltaY = currentY - this.touchStartY;

    // Handle pull-to-refresh
    if (this.enablePullToRefresh()) {
      const scrollTop = this.getScrollTop();

      // Only allow pull-to-refresh when at the top
      if (scrollTop === 0 && deltaY > 0) {
        event.preventDefault();
        this.pullDistance = Math.min(deltaY, this.maxPullDistance);
        this.updatePullIndicator();
      }
    } else {
      // Prevent default scrolling during horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging) return;

    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    this.isDragging = false;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.touchStartTime;
    const velocity = distance / duration;

    // Handle pull-to-refresh
    if (
      this.enablePullToRefresh() &&
      this.pullDistance > this.swipeThreshold()
    ) {
      this.pullToRefresh.emit();
      this.resetPullIndicator();
      return;
    }

    // Determine swipe direction
    if (distance < this.swipeThreshold() && velocity < this.swipeVelocity()) {
      return; // Not a valid swipe
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const swipeEvent: SwipeEvent = {
      direction:
        absX > absY
          ? deltaX > 0
            ? "right"
            : "left"
          : deltaY > 0
            ? "down"
            : "up",
      distance,
    };

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.swipeRight.emit(swipeEvent);
      } else {
        this.swipeLeft.emit(swipeEvent);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.swipeDown.emit(swipeEvent);
      } else {
        this.swipeUp.emit(swipeEvent);
      }
    }

    this.resetPullIndicator();
  }

  private updatePullIndicator(): void {
    const element = this.elementRef.nativeElement;
    const pullProgress = this.pullDistance / this.maxPullDistance;

    // Add visual feedback
    element.style.transform = `translateY(${this.pullDistance * 0.5}px)`;
    element.style.opacity = `${1 - pullProgress * 0.2}`;
  }

  private resetPullIndicator(): void {
    const element = this.elementRef.nativeElement;
    element.style.transform = "";
    element.style.opacity = "";
    this.pullDistance = 0;
  }

  private getScrollTop(): number {
    return getScrollTop(this.scrollContainer);
  }
}
