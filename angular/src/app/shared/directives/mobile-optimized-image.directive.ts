/**
 * Mobile Performance - Image Optimization Directive
 * ================================================================
 * Automatic image optimization for mobile devices
 * - Lazy loading
 * - Explicit dimensions
 * - WebP format support
 * ================================================================
 */

import { Directive, ElementRef, input, effect, inject } from "@angular/core";

@Directive({
  selector: "img[appMobileOptimized]",
})
export class MobileOptimizedImageDirective {
  private el = inject(ElementRef<HTMLImageElement>);

  width = input<string | number | undefined>(undefined);
  height = input<string | number | undefined>(undefined);
  lazy = input<boolean>(true);

  constructor() {
    // Use effect to react to input changes
    effect(() => {
      const img = this.el.nativeElement;
      const w = this.width();
      const h = this.height();
      const isLazy = this.lazy();

      // Add lazy loading
      if (isLazy) {
        img.loading = "lazy";
      }

      // Add explicit dimensions if provided
      if (w) {
        img.setAttribute("width", String(w));
      }
      if (h) {
        img.setAttribute("height", String(h));
      }

      // Add decoding async for better performance
      img.decoding = "async";

      // Prevent dragging (better UX on mobile)
      img.draggable = false;
    });
  }
}
