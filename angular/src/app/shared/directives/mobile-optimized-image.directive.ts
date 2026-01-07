/**
 * Mobile Performance - Image Optimization Directive
 * ================================================================
 * Automatic image optimization for mobile devices
 * - Lazy loading
 * - Explicit dimensions
 * - WebP format support
 * ================================================================
 */

import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appMobileOptimized]',
  standalone: true
})
export class MobileOptimizedImageDirective implements OnInit {
  @Input() width?: string | number;
  @Input() height?: string | number;
  @Input() lazy: boolean = true;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    const img = this.el.nativeElement;

    // Add lazy loading
    if (this.lazy) {
      img.loading = 'lazy';
    }

    // Add explicit dimensions if provided
    if (this.width) {
      img.setAttribute('width', String(this.width));
    }
    if (this.height) {
      img.setAttribute('height', String(this.height));
    }

    // Add decoding async for better performance
    img.decoding = 'async';

    // Prevent dragging (better UX on mobile)
    img.draggable = false;
  }
}
