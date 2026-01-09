/**
 * Lazy Image Directive
 *
 * PERFORMANCE: Uses Intersection Observer to lazy-load images
 * Only loads images when they're about to enter the viewport
 *
 * Usage:
 * <img appLazyImage [src]="imageUrl" [placeholder]="placeholderUrl" />
 *
 * Features:
 * - Lazy loading via Intersection Observer
 * - Placeholder support while loading
 * - Fade-in animation on load
 * - Native lazy loading fallback
 * - Error handling with fallback image
 */

import {
  Directive,
  ElementRef,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Directive({
  selector: "img[appLazyImage]",
  standalone: true,
})
export class LazyImageDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  private observer: IntersectionObserver | null = null;
  private loaded = false;

  // Angular 21: Use input() signals instead of @Input()
  /** The actual image source to load */
  src = input<string>("");

  /** Placeholder image to show while loading (optional) */
  placeholder = input<string>(
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  );

  /** Root margin for intersection observer (load before entering viewport) */
  rootMargin = input<string>("50px");

  /** Threshold for intersection observer */
  threshold = input<number>(0.01);

  /** Fallback image on error */
  fallback = input<string>("");

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: Just set the src directly
      this.renderer.setAttribute(this.el.nativeElement, "src", this.src());
      return;
    }

    const img = this.el.nativeElement as HTMLImageElement;

    // Set initial styles for fade-in effect
    this.renderer.setStyle(img, "opacity", "0");
    this.renderer.setStyle(img, "transition", "opacity 0.3s ease-in-out");

    // Set placeholder while waiting
    this.renderer.setAttribute(img, "src", this.placeholder());

    // Add native lazy loading as fallback
    this.renderer.setAttribute(img, "loading", "lazy");

    // Use Intersection Observer for better control
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.loaded) {
              this.loadImage();
            }
          });
        },
        {
          rootMargin: this.rootMargin(),
          threshold: this.threshold(),
        },
      );

      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadImage(): void {
    if (this.loaded) return;
    this.loaded = true;

    const img = this.el.nativeElement as HTMLImageElement;

    // Create a new image to preload
    const preloadImg = new Image();

    preloadImg.onload = () => {
      // Set the actual source
      this.renderer.setAttribute(img, "src", this.src());
      // Fade in
      this.renderer.setStyle(img, "opacity", "1");
    };

    preloadImg.onerror = () => {
      if (this.fallback()) {
        this.renderer.setAttribute(img, "src", this.fallback());
      }
      this.renderer.setStyle(img, "opacity", "1");
    };

    // Start loading
    preloadImg.src = this.src();

    // Stop observing
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
