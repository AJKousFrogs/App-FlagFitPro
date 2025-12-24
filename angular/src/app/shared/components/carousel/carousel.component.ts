import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
  effect,
  inject,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { timer, Subscription } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

/**
 * Carousel Component - Angular 21
 *
 * A carousel component for displaying slides
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-carousel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="carousel-container">
      <div class="carousel-wrapper">
        <div
          class="carousel-track"
          [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
        >
          @for (slide of slides(); track $index) {
            <div class="carousel-slide">
              @switch (slide.type) {
                @case ("image") {
                  <img
                    [src]="slide.content"
                    [alt]="slide.alt || 'Slide ' + ($index + 1)"
                  />
                }
                @default {
                  <div class="carousel-slide-content">
                    <ng-container
                      [ngTemplateOutlet]="slide.template || defaultTemplate"
                    ></ng-container>
                  </div>
                }
              }
              @if (slide.caption) {
                <div class="carousel-caption">
                  <h3>{{ slide.caption.title }}</h3>
                  @if (slide.caption.description) {
                    <p>{{ slide.caption.description }}</p>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      @if (showNavigation()) {
        <button
          type="button"
          class="carousel-nav carousel-prev"
          (click)="previous()"
          [disabled]="!canGoPrevious()"
          aria-label="Previous slide"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <button
          type="button"
          class="carousel-nav carousel-next"
          (click)="next()"
          [disabled]="!canGoNext()"
          aria-label="Next slide"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      }

      @if (showIndicators()) {
        <div class="carousel-indicators">
          @for (slide of slides(); track $index) {
            <button
              type="button"
              class="carousel-indicator"
              [class.active]="currentIndex() === $index"
              (click)="goTo($index)"
              [attr.aria-label]="'Go to slide ' + ($index + 1)"
            ></button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .carousel-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .carousel-wrapper {
        position: relative;
        overflow: hidden;
        border-radius: var(--p-border-radius);
      }

      .carousel-track {
        display: flex;
        transition: transform 0.5s ease;
      }

      .carousel-slide {
        min-width: 100%;
        position: relative;
      }

      .carousel-slide img {
        width: 100%;
        height: auto;
        display: block;
      }

      .carousel-slide-content {
        padding: 2rem;
        background: var(--p-surface-0);
      }

      .carousel-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        color: white;
        padding: 2rem;
      }

      .carousel-caption h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }

      .carousel-caption p {
        margin: 0;
        font-size: 1rem;
      }

      .carousel-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        width: 3rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s;
      }

      .carousel-nav:hover:not(:disabled) {
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .carousel-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .carousel-prev {
        left: 1rem;
      }

      .carousel-next {
        right: 1rem;
      }

      .carousel-indicators {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
        z-index: 10;
      }

      .carousel-indicator {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        transition: all 0.2s;
      }

      .carousel-indicator.active {
        background: white;
        width: 2rem;
        border-radius: 0.375rem;
      }
    `,
  ],
})
export class CarouselComponent {
  private destroyRef = inject(DestroyRef);
  private autoPlaySubscription?: Subscription;

  slides = input.required<
    Array<{
      type?: "image" | "content";
      content?: string;
      alt?: string;
      caption?: { title: string; description?: string };
      template?: unknown;
    }>
  >();
  showNavigation = input<boolean>(true);
  showIndicators = input<boolean>(true);
  autoPlay = input<boolean>(false);
  autoPlayInterval = input<number>(5000);
  loop = input<boolean>(true);

  currentIndex = signal<number>(0);

  defaultTemplate = null;

  constructor() {
    effect(() => {
      if (this.autoPlay()) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    });
  }

  canGoPrevious(): boolean {
    return this.loop() || this.currentIndex() > 0;
  }

  canGoNext(): boolean {
    return this.loop() || this.currentIndex() < this.slides().length - 1;
  }

  previous(): void {
    if (this.canGoPrevious()) {
      this.currentIndex.set(
        this.currentIndex() === 0 && this.loop()
          ? this.slides().length - 1
          : Math.max(0, this.currentIndex() - 1),
      );
    }
  }

  next(): void {
    if (this.canGoNext()) {
      this.currentIndex.set(
        this.currentIndex() === this.slides().length - 1 && this.loop()
          ? 0
          : Math.min(this.slides().length - 1, this.currentIndex() + 1),
      );
    }
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.slides().length) {
      this.currentIndex.set(index);
    }
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlaySubscription = timer(
      this.autoPlayInterval(),
      this.autoPlayInterval(),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.next();
      });
  }

  private stopAutoPlay(): void {
    if (this.autoPlaySubscription) {
      this.autoPlaySubscription.unsubscribe();
      this.autoPlaySubscription = undefined;
    }
  }
}
