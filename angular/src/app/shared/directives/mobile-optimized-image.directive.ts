/**
 * Mobile Performance - Image Optimization Directive
 * ================================================================
 * Automatic image optimization for mobile devices
 * - Lazy loading
 * - Explicit dimensions
 * - WebP format support
 * ================================================================
 */

import { Directive, ElementRef, input, OnInit, inject } from "@angular/core";

@Directive({
  selector: "img[appMobileOptimized]",
})
export class MobileOptimizedImageDirective implements OnInit {
  private el = inject(ElementRef<HTMLImageElement>);

  // Angular 21: Use input() signals instead of @Input()
  width = input<string | number | undefined>(undefined);
  height = input<string | number | undefined>(undefined);
  lazy = input<boolean>(true);

  ngOnInit() {
    const img = this.el.nativeElement;

    // Add lazy loading
    if (this.lazy()) {
      img.loading = "lazy";
    }

    // Add explicit dimensions if provided
    if (this.width()) {
      img.setAttribute("width", String(this.width()));
    }
    if (this.height()) {
      img.setAttribute("height", String(this.height()));
    }

    // Add decoding async for better performance
    img.decoding = "async";

    // Prevent dragging (better UX on mobile)
    img.draggable = false;
  }
}
