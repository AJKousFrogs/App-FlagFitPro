/**
 * Lazy Load Image Directive
 *
 * Implements image lazy loading with Intersection Observer API
 * - Loads images only when they enter viewport
 * - Shows placeholder while loading
 * - Improves initial page load time
 * - Reduces bandwidth usage
 *
 * Usage:
 * ```html
 * <img appLazyLoad [src]="imageUrl" alt="Description" />
 * ```
 */

import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
} from "@angular/core";

@Directive({
  selector: "img[appLazyLoad]",
  standalone: true,
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input() src!: string;
  @Input() placeholder =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18'%3ELoading...%3C/text%3E%3C/svg%3E";

  private observer?: IntersectionObserver;
  private loaded = false;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Set placeholder immediately
    this.renderer.setAttribute(this.el.nativeElement, "src", this.placeholder);
    this.renderer.addClass(this.el.nativeElement, "lazy-loading");

    // Use native lazy loading as primary method
    this.renderer.setAttribute(this.el.nativeElement, "loading", "lazy");

    // Fallback to Intersection Observer for older browsers
    if ("IntersectionObserver" in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback: load immediately
      this.loadImage();
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loaded) {
            this.loadImage();
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage(): void {
    if (this.loaded) return;

    const img = new Image();
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, "src", this.src);
      this.renderer.removeClass(this.el.nativeElement, "lazy-loading");
      this.renderer.addClass(this.el.nativeElement, "lazy-loaded");
      this.loaded = true;
    };

    img.onerror = () => {
      // On error, show error placeholder
      const errorPlaceholder =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23fee2e2' width='400' height='300'/%3E%3Ctext fill='%23dc2626' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18'%3EFailed to load%3C/text%3E%3C/svg%3E";
      this.renderer.setAttribute(
        this.el.nativeElement,
        "src",
        errorPlaceholder
      );
      this.renderer.removeClass(this.el.nativeElement, "lazy-loading");
      this.renderer.addClass(this.el.nativeElement, "lazy-error");
    };

    img.src = this.src;
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

