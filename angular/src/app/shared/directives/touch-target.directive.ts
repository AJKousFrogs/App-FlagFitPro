/**
 * Touch Target Directive
 *
 * Ensures interactive elements meet WCAG 2.5.5 minimum touch target size (44x44px).
 * Automatically adds padding or sizing to meet requirements on touch devices.
 *
 * Usage:
 * <button appTouchTarget>Click me</button>
 * <a appTouchTarget [minSize]="48">Link</a>
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Directive,
  ElementRef,
  input,
  effect,
  inject,
  Renderer2,
  OnInit,
  OnDestroy,
} from "@angular/core";

@Directive({
  selector: "[appTouchTarget]",
  standalone: true,
})
export class TouchTargetDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  // Minimum touch target size in pixels (WCAG 2.5.5 requires 44px)
  minSize = input<number>(44);

  // Whether to use padding (true) or min-width/height (false)
  usePadding = input<boolean>(false);

  // Force apply even on non-touch devices (for consistency)
  forceApply = input<boolean>(false);

  private resizeObserver: ResizeObserver | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private isTouchDevice = false;

  constructor() {
    // React to input changes
    effect(() => {
      const size = this.minSize();
      const padding = this.usePadding();
      const force = this.forceApply();

      if (this.isTouchDevice || force) {
        this.applyTouchTarget(size, padding);
      }
    });
  }

  ngOnInit(): void {
    this.detectTouchDevice();
    this.setupMediaQueryListener();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener("change", this.handleMediaChange);
    }
  }

  /**
   * Detect if device supports touch
   */
  private detectTouchDevice(): void {
    if (typeof window === "undefined") return;

    this.isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
  }

  /**
   * Setup media query listener for touch device changes
   */
  private setupMediaQueryListener(): void {
    if (typeof window === "undefined") return;

    this.mediaQueryList = window.matchMedia(
      "(hover: none) and (pointer: coarse)",
    );
    this.mediaQueryList.addEventListener("change", this.handleMediaChange);

    // Initial check
    this.isTouchDevice = this.mediaQueryList.matches;

    if (this.isTouchDevice || this.forceApply()) {
      this.applyTouchTarget(this.minSize(), this.usePadding());
    }
  }

  /**
   * Handle media query changes
   */
  private handleMediaChange = (event: MediaQueryListEvent): void => {
    this.isTouchDevice = event.matches;

    if (this.isTouchDevice || this.forceApply()) {
      this.applyTouchTarget(this.minSize(), this.usePadding());
    } else {
      this.removeTouchTarget();
    }
  };

  /**
   * Setup resize observer to check element size
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === "undefined") return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (this.isTouchDevice || this.forceApply()) {
          this.checkAndFixSize(entry.contentRect);
        }
      }
    });

    this.resizeObserver.observe(this.el.nativeElement);
  }

  /**
   * Apply touch target styles
   */
  private applyTouchTarget(size: number, usePadding: boolean): void {
    const element = this.el.nativeElement;

    if (usePadding) {
      // Use padding approach - good for text buttons
      const currentHeight = element.offsetHeight;
      const currentWidth = element.offsetWidth;

      if (currentHeight < size) {
        const paddingY = Math.ceil((size - currentHeight) / 2);
        this.renderer.setStyle(element, "padding-top", `${paddingY}px`);
        this.renderer.setStyle(element, "padding-bottom", `${paddingY}px`);
      }

      if (currentWidth < size) {
        const paddingX = Math.ceil((size - currentWidth) / 2);
        this.renderer.setStyle(element, "padding-left", `${paddingX}px`);
        this.renderer.setStyle(element, "padding-right", `${paddingX}px`);
      }
    } else {
      // Use min-width/height approach - good for icon buttons
      this.renderer.setStyle(element, "min-height", `${size}px`);
      this.renderer.setStyle(element, "min-width", `${size}px`);
    }

    // Ensure proper alignment
    this.renderer.setStyle(element, "display", "inline-flex");
    this.renderer.setStyle(element, "align-items", "center");
    this.renderer.setStyle(element, "justify-content", "center");

    // Add touch-action for better touch response
    this.renderer.setStyle(element, "touch-action", "manipulation");

    // Add cursor for clarity
    this.renderer.setStyle(element, "cursor", "pointer");

    // Mark as touch-optimized for debugging
    this.renderer.setAttribute(element, "data-touch-optimized", "true");
  }

  /**
   * Remove touch target styles
   */
  private removeTouchTarget(): void {
    const element = this.el.nativeElement;

    this.renderer.removeStyle(element, "min-height");
    this.renderer.removeStyle(element, "min-width");
    this.renderer.removeStyle(element, "padding-top");
    this.renderer.removeStyle(element, "padding-bottom");
    this.renderer.removeStyle(element, "padding-left");
    this.renderer.removeStyle(element, "padding-right");
    this.renderer.removeAttribute(element, "data-touch-optimized");
  }

  /**
   * Check element size and fix if needed
   */
  private checkAndFixSize(rect: DOMRectReadOnly): void {
    const minSize = this.minSize();

    if (rect.height < minSize || rect.width < minSize) {
      this.applyTouchTarget(minSize, this.usePadding());
    }
  }
}

/**
 * Touch Target Container Directive
 *
 * Applies touch target sizing to all interactive children.
 * Useful for applying to a container with multiple buttons/links.
 *
 * Usage:
 * <div appTouchTargetContainer>
 *   <button>Button 1</button>
 *   <button>Button 2</button>
 * </div>
 */
@Directive({
  selector: "[appTouchTargetContainer]",
  standalone: true,
})
export class TouchTargetContainerDirective implements OnInit {
  private el = inject(ElementRef<HTMLElement>);

  minSize = input<number>(44);

  ngOnInit(): void {
    if (typeof window === "undefined") return;

    const isTouchDevice = window.matchMedia(
      "(hover: none) and (pointer: coarse)",
    ).matches;

    if (isTouchDevice) {
      this.applyToChildren();
    }

    // Listen for changes
    window
      .matchMedia("(hover: none) and (pointer: coarse)")
      .addEventListener("change", (e) => {
        if (e.matches) {
          this.applyToChildren();
        }
      });
  }

  private applyToChildren(): void {
    const element = this.el.nativeElement;
    const interactiveElements = element.querySelectorAll(
      "button, a, [role='button'], input[type='button'], input[type='submit']",
    );

    interactiveElements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      const minSize = this.minSize();

      htmlEl.style.minHeight = `${minSize}px`;
      htmlEl.style.minWidth = `${minSize}px`;
      htmlEl.style.display = "inline-flex";
      htmlEl.style.alignItems = "center";
      htmlEl.style.justifyContent = "center";
      htmlEl.setAttribute("data-touch-optimized", "true");
    });
  }
}
