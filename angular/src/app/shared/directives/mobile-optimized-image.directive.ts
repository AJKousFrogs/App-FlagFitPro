/**
 * Mobile Performance - Image Optimization Directive
 * ================================================================
 * High-performance image handling for Angular 21
 * - Automatic lazy loading (default)
 * - Fetch priority support for LCP
 * - Async decoding
 * - Touch-optimized (no drag)
 * ================================================================
 */

import { Directive, ElementRef, input, effect, inject } from "@angular/core";

@Directive({
  selector: "img[appMobileOptimized]",
  host: {
    "[attr.loading]": "priority() ? 'eager' : 'lazy'",
    "[attr.fetchpriority]": "priority() ? 'high' : 'auto'",
    "[attr.decoding]": "'async'",
    "[attr.draggable]": "'false'",
    "[style.content-visibility]": "'auto'",
  }
})
export class MobileOptimizedImageDirective {
  private el = inject(ElementRef<HTMLImageElement>);

  width = input<string | number | undefined>(undefined);
  height = input<string | number | undefined>(undefined);
  priority = input<boolean>(false);

  constructor() {
    effect(() => {
      const img = this.el.nativeElement;
      const w = this.width();
      const h = this.height();

      if (w) img.setAttribute("width", String(w));
      if (h) img.setAttribute("height", String(h));
    });
  }
}
